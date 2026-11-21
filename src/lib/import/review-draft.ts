import type { MappedEvent } from "../excel-import.functions";
import { mappedEventToEventData } from "../excel-io";
import { toIsoDate } from "./values";
import type { ParsedWorkbook } from "../excel-io";
import { partWindow, preparePartProposals, reviewRows, type ReviewPart, type RowMetadata } from "./part-proposals";
import { addPart, editPart } from "../parts-edit";
import { componentPartId, MAIN_PART_ID } from "../event-parts";

type Session = MappedEvent["sessions"][number] & RowMetadata;
type Break = MappedEvent["breaks"][number] & RowMetadata;
export type ReviewEvent = Omit<MappedEvent, "sessions" | "breaks"> & { sessions: Session[]; breaks: Break[] };
export type ReviewDraft = { event: ReviewEvent; parts: ReviewPart[]; year: string; sheets: Record<string, { included: boolean; loading: boolean; error: string; cached?: MappedEvent }> };
export type ReviewAction =
  | { type: "event"; patch: Partial<ReviewEvent> }
  | { type: "year"; value: string }
  | { type: "session"; index: number; patch: Partial<Session> }
  | { type: "break"; index: number; patch: Partial<Break> }
  | { type: "add" | "delete"; kind: "sessions" | "breaks"; index?: number }
  | { type: "person"; kind: "speakers" | "moderators"; index: number; patch: Partial<{ name: string; role: string }> }
  | { type: "merge"; kind: "speakers" | "moderators"; index: number; target: number }
  | { type: "add-person"; kind: "speakers" | "moderators" }
  | { type: "part"; id: string; patch: Partial<Pick<ReviewPart, "name" | "kind" | "accepted">> }
  | { type: "delete-part"; id: string }
  | { type: "move-row"; kind: "sessions" | "breaks"; index: number; partId: string }
  | { type: "sheet"; name: string; included: boolean; loading?: boolean; error?: string; mapped?: MappedEvent };

export function createReviewDraft(event: MappedEvent, workbook?: ParsedWorkbook): ReviewDraft {
  const prepared = preparePartProposals(structuredClone(event), workbook);
  return { ...prepared, year: String(event.importReview?.year ?? event.date.match(/^\d{4}/)?.[0] ?? ""), sheets: {} };
}

const replaceReferences = (event: ReviewEvent, kind: "speakers" | "moderators", from: string, to: string) => ({
  ...event,
  sessions: event.sessions.map(s => ({ ...s, [kind]: [...new Set(s[kind].map(n => n === from ? to : n).filter(n => n.trim()))] })),
});

export function reviewReducer(state: ReviewDraft, action: ReviewAction): ReviewDraft {
  const e = state.event;
  switch (action.type) {
    case "part": return { ...state, parts: state.parts.map(part => part.id === action.id ? { ...part, ...action.patch } : part) };
    case "delete-part": {
      const clear = <T extends RowMetadata>(row: T): T => row.partId === componentPartId(action.id) ? { ...row, partId: MAIN_PART_ID } : row;
      return { ...state, parts: state.parts.filter(part => part.id !== action.id), event: { ...e, sessions: e.sessions.map(clear), breaks: e.breaks.map(clear) } };
    }
    case "move-row": {
      if (action.partId !== MAIN_PART_ID && !state.parts.some(part => part.accepted && componentPartId(part.id) === action.partId)) return state;
      return { ...state, event: { ...e, [action.kind]: e[action.kind].map((row, index) => index === action.index ? { ...row, partId: action.partId } : row) } };
    }
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

/** Convert edited values only; accepted proposals use the existing component/part adapter. */
export function reviewToEventData(state: ReviewDraft) {
  const mapped: MappedEvent = { ...state.event, sessions: state.event.sessions.map(s => {
    if (!s.sessionType) return s;
    const description = s.description.replace(/(?:^| · )Format: [^·]*/g, "").replace(/^ · | · $/g, "").trim();
    return { ...s, description: [`Format: ${s.sessionType}`, description].filter(Boolean).join(" · ") };
  }) };
  const event = mappedEventToEventData(mapped);
  const accepted = state.parts.filter(part => part.accepted);
  const assigned = (row?: RowMetadata) => row?.partId && row.partId !== MAIN_PART_ID && accepted.some(part => componentPartId(part.id) === row.partId) ? { partId: row.partId } : {};
  let result = { ...event, avRequirements: mapped.avRequirements,
    sessions: event.sessions.map((s, i) => ({ ...s, ...assigned(state.event.sessions[i]), durationMin: mapped.sessions[i]?.durationMin ?? s.durationMin })),
    breaks: event.breaks.map((b, i) => ({ ...b, ...assigned(state.event.breaks[i]), durationMin: mapped.breaks[i]?.durationMin ?? b.durationMin })),
  };
  for (const part of accepted) {
    const window = partWindow(reviewRows(state.event).filter(row => row.partId === componentPartId(part.id)));
    result = editPart(addPart(result, part.kind, part.id), part.id, {
      name: part.name, day: window.day, startTime: window.start, endTime: window.end,
      durationMin: window.durationMin, venue: window.room,
      operationalRequirements: { av: [], staffing: [], protocol: [] },
    });
  }
  return result;
}
