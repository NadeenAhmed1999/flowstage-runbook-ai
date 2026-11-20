import type { MappedEvent } from "../excel-import.functions";
import { mappedEventToEventData } from "../excel-io";
import { toIsoDate } from "./values";

type Session = MappedEvent["sessions"][number] & { sourceSheet?: string };
type Break = MappedEvent["breaks"][number] & { sourceSheet?: string };
export type ReviewEvent = Omit<MappedEvent, "sessions" | "breaks"> & { sessions: Session[]; breaks: Break[] };
export type ReviewDraft = { event: ReviewEvent; year: string; sheets: Record<string, { included: boolean; loading: boolean; error: string; cached?: MappedEvent }> };
export type ReviewAction =
  | { type: "event"; patch: Partial<ReviewEvent> }
  | { type: "year"; value: string }
  | { type: "session"; index: number; patch: Partial<Session> }
  | { type: "break"; index: number; patch: Partial<Break> }
  | { type: "add" | "delete"; kind: "sessions" | "breaks"; index?: number }
  | { type: "person"; kind: "speakers" | "moderators"; index: number; patch: Partial<{ name: string; role: string }> }
  | { type: "merge"; kind: "speakers" | "moderators"; index: number; target: number }
  | { type: "add-person"; kind: "speakers" | "moderators" }
  | { type: "sheet"; name: string; included: boolean; loading?: boolean; error?: string; mapped?: MappedEvent };

export function createReviewDraft(event: MappedEvent): ReviewDraft {
  return { event: structuredClone(event), year: String(event.importReview?.year ?? event.date.match(/^\d{4}/)?.[0] ?? ""), sheets: {} };
}

const replaceReferences = (event: ReviewEvent, kind: "speakers" | "moderators", from: string, to: string) => ({
  ...event,
  sessions: event.sessions.map(s => ({ ...s, [kind]: [...new Set(s[kind].map(n => n === from ? to : n).filter(n => n.trim()))] })),
});

export function reviewReducer(state: ReviewDraft, action: ReviewAction): ReviewDraft {
  const e = state.event;
  switch (action.type) {
    case "event": return { ...state, event: { ...e, ...action.patch } };
    case "year": {
      const year = Number(action.value);
      if (!/^\d{4}$/.test(action.value) || year < 1900 || year > 2200) return { ...state, year: action.value };
      const dates = [...(e.importReview?.dayDates ?? [])].sort((a, b) => a.day - b.day);
      const first = dates[0];
      const last = dates[dates.length - 1];
      const replaceYear = (date: string) => date ? `${year}${date.slice(4)}` : "";
      return { ...state, year: action.value, event: { ...e,
        date: first ? toIsoDate({ month: first.month, day: first.dateDay, year }, year) : replaceYear(e.date),
        ...(last && dates.length > 1 ? { endDate: toIsoDate({ month: last.month, day: last.dateDay, year }, year) } : e.endDate ? { endDate: replaceYear(e.endDate) } : {}),
      } };
    }
    case "session": return { ...state, event: { ...e, sessions: e.sessions.map((s, i) => i === action.index ? { ...s, ...action.patch } : s) } };
    case "break": return { ...state, event: { ...e, breaks: e.breaks.map((b, i) => i === action.index ? { ...b, ...action.patch } : b) } };
    case "delete": return { ...state, event: { ...e, [action.kind]: e[action.kind].filter((_, i) => i !== action.index) } };
    case "add": return action.kind === "sessions"
      ? { ...state, event: { ...e, sessions: [...e.sessions, { title: "", day: 1, startTime: "", durationMin: 30, description: "", room: "", speakers: [], moderators: [], sessionType: "Session" }] } }
      : { ...state, event: { ...e, breaks: [...e.breaks, { label: "", day: 1, startTime: "", durationMin: 15 }] } };
    case "person": {
      const person = e[action.kind][action.index];
      if (!person) return state;
      const updated = action.patch.name !== undefined ? replaceReferences(e, action.kind, person.name, action.patch.name) : e;
      return { ...state, event: { ...updated, [action.kind]: updated[action.kind].map((p, i) => i === action.index ? { ...p, ...action.patch } : p) } };
    }
    case "merge": {
      const person = e[action.kind][action.index];
      const target = e[action.kind][action.target];
      if (!person || !target || action.index === action.target) return state;
      const updated = replaceReferences(e, action.kind, person.name, target.name);
      return { ...state, event: { ...updated, [action.kind]: updated[action.kind].filter((_, i) => i !== action.index) } };
    }
    case "add-person": return { ...state, event: { ...e, [action.kind]: [...e[action.kind], { name: "", role: "" }] } };
    case "sheet": {
      const previous = state.sheets[action.name];
      const cached = action.mapped ?? previous?.cached;
      const sheets = { ...state.sheets, [action.name]: { included: action.included, loading: action.loading ?? false, error: action.error ?? "", ...(cached ? { cached } : {}) } };
      const sessions = e.sessions.filter(s => s.sourceSheet !== action.name);
      const breaks = e.breaks.filter(b => b.sourceSheet !== action.name);
      if (!action.included || !cached) return { ...state, sheets, event: { ...e, sessions, breaks } };
      const union = (kind: "speakers" | "moderators") => [...e[kind], ...cached[kind].filter(p => !e[kind].some(n => n.name.trim().toLowerCase() === p.name.trim().toLowerCase()))];
      return { ...state, sheets, event: { ...e,
        sessions: [...sessions, ...cached.sessions.map(s => ({ ...s, sourceSheet: action.name }))],
        breaks: [...breaks, ...cached.breaks.map(b => ({ ...b, sourceSheet: action.name }))],
        speakers: union("speakers"), moderators: union("moderators"),
        sponsors: [...e.sponsors, ...cached.sponsors.filter(s => !e.sponsors.some(p => p.name === s.name))],
        components: [...e.components, ...cached.components.filter(c => !e.components.some(p => p.name === c.name))],
        notes: [e.notes, cached.notes].filter(Boolean).filter((n, i, all) => all.indexOf(n) === i).join("\n"),
      } };
    }
  }
}

/** Keep type edits in existing description-based legacy format; no parts or Word changes. */
export function reviewToEventData(state: ReviewDraft) {
  const mapped: MappedEvent = { ...state.event, sessions: state.event.sessions.map(s => {
    if (!s.sessionType) return s;
    const description = s.description.replace(/(?:^| · )Format: [^·]*/g, "").replace(/^ · | · $/g, "").trim();
    return { ...s, description: [`Format: ${s.sessionType}`, description].filter(Boolean).join(" · ") };
  }) };
  const event = mappedEventToEventData(mapped);
  return { ...event, avRequirements: mapped.avRequirements,
    sessions: event.sessions.map((s, i) => ({ ...s, durationMin: mapped.sessions[i]?.durationMin ?? s.durationMin })),
    breaks: event.breaks.map((b, i) => ({ ...b, durationMin: mapped.breaks[i]?.durationMin ?? b.durationMin })),
  };
}
