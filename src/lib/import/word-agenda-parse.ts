/**
 * Rule-based first pass for Word agendas (no AI, no network).
 * Reads the rows produced by parseWordFile (paragraphs become single-cell rows), finds the
 * event title, date range, day headings, "H:MM–H:MM  Title" rows and the Chair/Speaker/Description
 * blocks under each session, and returns a MappedEvent-shaped draft.
 * Returns null when the file does not look like a timed agenda so callers keep the AI path.
 */
import type { MappedEvent } from "../excel-import.functions";
import type { ParsedWorkbook } from "../excel-io";
import { cleanCell, formatToType, looksLikeBreak } from "./values";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const monthOf = (word: string) => MONTHS.indexOf(word.slice(0, 3).toLowerCase()) + 1;

const DAY_HEADING = /^(?:mon|tues?|wednes|thur?s?|fri|satur|sun)(?:day)?[,\s]+(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\.?\s+(\d{4})\s*(?:[-–—:]\s*(.*))?$/i;
const DATE_RANGE = /^(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})$/;
const TIME_ROW = /^(\d{1,2})[:.](\d{2})\s*(am|pm)?\s*(?:[-–—]|to)\s*(\d{1,2})[:.](\d{2})\s*(am|pm)?\s*[\t ]+(\S.*)$/i;
const CHAIR = /^(?:session\s+)?(?:chair|moderator|facilitator)(?:\(?s\)?)?\s*:\s*(.*)$/i;
const SPEAKER = /^(?:proposed\s+|confirmed\s+|invited\s+)?(?:speaker|panelist|presenter)(?:\(?s\)?)?\s*:\s*(.*)$/i;
const DESCRIPTION = /^(?:description|overview)\s*:?\s*(.*)$/i;
const OBJECTIVES = /^learning\s+objectives?\s*:?\s*(.*)$/i;
const CONCURRENT_HEAD = /^(?:session|track|breakout)\s+\d+[a-z]\b/i;
const STATUS = /\b(confirmed|invited|declined|pending|tbc|tbd|to be confirmed)\b/i;
const CREDENTIAL = /^(?:ph\.?\s?d|m\.?d|ms|msc|mba|mph|mpa|cpa|pharmd|frcpath|mfpm|frsc|fibiol|bsc|dds|jd|esq|rph)\b/i;
const NOT_A_PERSON = /^(?:potential|possibly|industry|tbc|tbd|to be|ideally|note|per |we |ask )/i;
const HONORIFIC = /^(?:h\.?e\.?|dr|mr|mrs|ms|prof|professor|eng|hon|amb|sir|sheikh)\.?$/i;
const PARTICLES = new Set(["de", "da", "del", "van", "von", "bin", "ibn", "al", "el", "of", "the", "and", "&", "la", "le", "du", "dos"]);

type Person = { name: string; role: string };

/** Clock minutes for "H:MM" with optional am/pm; bare hours are resolved against the previous time. */
function resolve(h: number, m: number, ampm: string | undefined, floor: number): number {
  const mode = ampm?.toLowerCase();
  if (mode === "pm") return (h % 12) * 60 + 720 + m;
  if (mode === "am") return (h % 12) * 60 + m;
  if (h >= 13 || h === 0) return h * 60 + m;
  const options = h === 12 ? [720 + m] : [h * 60 + m, (h + 12) * 60 + m];
  const min = Math.max(floor, 360);
  return options.find(o => o >= min) ?? options[options.length - 1] ?? h * 60 + m;
}
const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const iso = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const utcDay = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day) / 86_400_000;

/** Splits one paragraph into people, dropping status words, e-mails and note-like lines. */
export function parsePeopleLine(raw: string): { people: Person[]; rejected: string[] } {
  const people: Person[] = [];
  const rejected: string[] = [];
  const cleaned = raw.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "").replace(/\(\s*\)/g, "").replace(/ /g, " ");
  const chunks = cleaned
    .split(/(?<=[)\]])(?=[A-Z])|(?<=[a-z])(?=(?:Dr|Mr|Ms|Mrs|Prof)\.?\s)|(?<=[A-Z]{2})(?=[A-Z][a-z]+ [A-Z])/)
    .flatMap(part => (/\bwill represent\b/i.test(part) ? part.split(/\s+and\s+(?=[A-Z])/) : [part]));
  for (const chunk of chunks) {
    let text = chunk.trim();
    if (!text) continue;
    const status = STATUS.exec(text);
    if (status?.[1]?.toLowerCase() === "declined") { rejected.push(`${text.slice(0, 60)} (declined, not imported)`); continue; }
    if (status) text = text.slice(0, status.index);
    text = text.replace(/\s+will\s+.*$/i, "").replace(/[\s(\[\-–—,;:]+$/, "").trim();
    if (!text || text.includes("?") || NOT_A_PERSON.test(text)) { if (chunk.trim()) rejected.push(chunk.trim().slice(0, 80)); continue; }
    const [first = "", ...restParts] = text.split(/\s[-–—]\s|,|;/).map(s => s.trim());
    let name = first.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s{2,}/g, " ").trim();
    const parenRole = /\(([^)]+)\)/.exec(first)?.[1];
    let rest = restParts.filter(Boolean);
    const tokens = name.split(" ");
    if (!restParts.length && tokens.length > 4) {
      const keep = HONORIFIC.test(tokens[0] ?? "") ? 3 : 2;
      name = tokens.slice(0, keep).join(" ");
      rest = [tokens.slice(keep).join(" ")];
    }
    let nameTokens = name.split(" ").filter(Boolean);
    const capital = (t: string) => /^[A-ZÀ-Þ]/.test(t) || HONORIFIC.test(t) || PARTICLES.has(t.toLowerCase());
    const run = nameTokens.findIndex(t => !capital(t));
    if (run > 0 && nameTokens.slice(0, run).filter(t => !HONORIFIC.test(t) && !PARTICLES.has(t.toLowerCase())).length >= 2 && !/^(?:to|will|could|may|might)$/i.test(nameTokens[run] ?? "")) {
      rest = [nameTokens.slice(run).join(" "), ...rest];
      nameTokens = nameTokens.slice(0, run);
      name = nameTokens.join(" ");
    }
    const plausible = nameTokens.length >= 1 && nameTokens.length <= 8 && /^[A-Z]/.test(nameTokens[0] ?? "")
      && nameTokens.every(t => /^[A-ZÀ-Þ]/.test(t) || /\./.test(t) || PARTICLES.has(t.toLowerCase()) || /[-'’]/.test(t) || /^\d/.test(t) === false && t === t.toUpperCase());
    if (!plausible) { rejected.push(chunk.trim().slice(0, 80)); continue; }
    const role = [parenRole, ...rest.filter(p => !CREDENTIAL.test(p))].filter(Boolean).join(", ");
    people.push({ name, role: role.length > 140 ? "" : role });
  }
  return { people, rejected };
}

function inferType(name: string): string {
  if (/summit/i.test(name)) return "Summit";
  if (/conference/i.test(name)) return "Conference";
  if (/forum/i.test(name)) return "Forum";
  if (/workshop/i.test(name)) return "Workshop";
  return "Other";
}

export function parseWordAgenda(workbook: ParsedWorkbook): MappedEvent | null {
  const rows = workbook.sheets.flatMap(s => s.rows);
  const lines = rows.map(r => r.map(c => cleanCell(c)).filter(Boolean).join("\t")).filter(Boolean);
  if (!lines.some(l => TIME_ROW.test(l))) return null;

  const unclear: string[] = [];
  const notes: string[] = [];
  const speakers = new Map<string, Person>();
  const moderators = new Map<string, Person>();
  const addPerson = (map: Map<string, Person>, p: Person) => {
    const key = p.name.toLowerCase();
    if (!map.has(key) || (!map.get(key)?.role && p.role)) map.set(key, p);
    return p.name;
  };

  let name = "";
  let year: number | null = null;
  let startDate: { y: number; m: number; d: number } | null = null;
  let endDate: { y: number; m: number; d: number } | null = null;
  const dayDates: { day: number; month: number; dateDay: number }[] = [];
  let day = 1;
  let floor = 0;
  let seenDay = false;
  let first = true;

  type Item = { kind: "session" | "break"; idx: number };
  const sessions: MappedEvent["sessions"] = [];
  const breaks: MappedEvent["breaks"] = [];
  let current = null as Item | null;
  let lastTimed = null as { start: number; end: number } | null;
  let mode = null as "chairs" | "speakers" | "desc" | "objectives" | null;
  const descParts = new Map<number, string[]>();

  const session = () => (current?.kind === "session" ? sessions[current.idx] : undefined);

  const open = (title: string, start: number, end: number, inferredTimes: boolean) => {
    const duration = end - start > 0 ? end - start : 30;
    if (end - start <= 0) unclear.push(`${title}: end time is not after start time; 30 min assumed.`);
    if (looksLikeBreak(title, "")) {
      breaks.push({ label: title, startTime: hhmm(start), durationMin: duration, day, durationSource: "derived", inferredDay: false });
      current = { kind: "break", idx: breaks.length - 1 };
    } else {
      sessions.push({
        sessionType: formatToType(title) || "Session", inferredType: true, inferredDay: false,
        durationSource: inferredTimes ? "inferred" : "derived",
        title, startTime: hhmm(start), durationMin: duration, description: "", speakers: [], moderators: [], room: "", day,
      });
      current = { kind: "session", idx: sessions.length - 1 };
      if (inferredTimes) unclear.push(`${title}: no time in the file; assumed to run at the same time as the session above.`);
    }
    lastTimed = { start, end };
    mode = null;
  };

  for (const line of lines) {
    if (first) {
      first = false;
      if (!TIME_ROW.test(line) && !DAY_HEADING.test(line)) { name = line.replace(/\s*Agenda\b.*$/i, "").trim() || line; continue; }
    }
    const heading = DAY_HEADING.exec(line);
    if (heading) {
      const d = Number(heading[1]); const m = monthOf(heading[2] ?? ""); const y = Number(heading[3]);
      year = y;
      const dayNumber = startDate ? utcDay(y, m, d) - utcDay(startDate.y, startDate.m, startDate.d) + 1 : dayDates.length + 1;
      day = dayNumber >= 1 ? Math.round(dayNumber) : dayDates.length + 1;
      dayDates.push({ day, month: m, dateDay: d });
      if (!startDate) startDate = { y, m, d };
      endDate = { y, m, d };
      if (heading[4]) notes.push(`Day ${day}: ${heading[4].trim()}`);
      floor = 0; seenDay = true; current = null; lastTimed = null; mode = null;
      continue;
    }
    const range = DATE_RANGE.exec(line);
    if (range && !seenDay) {
      const m = monthOf(range[3] ?? ""); const y = Number(range[4]);
      year = y; startDate = { y, m, d: Number(range[1]) }; endDate = { y, m, d: Number(range[2]) };
      continue;
    }
    if (!seenDay && !TIME_ROW.test(line)) { if (!/^time$/i.test(line)) notes.push(startDate ? `Venue: ${line}` : line); continue; }
    if (/^time$/i.test(line)) continue;

    const time = TIME_ROW.exec(line);
    if (time) {
      const start = resolve(Number(time[1]), Number(time[2]), time[3], floor);
      const end = resolve(Number(time[4]), Number(time[5]), time[6] ?? time[3], start);
      open((time[7] ?? "").trim(), start, end, false);
      floor = end;
      continue;
    }
    if (!seenDay) { seenDay = true; }

    const chair = CHAIR.exec(line); const speaker = SPEAKER.exec(line);
    const desc = DESCRIPTION.exec(line); const objectives = OBJECTIVES.exec(line);
    if (chair && session()) { mode = "chairs"; if (chair[1]) feed("chairs", chair[1]); continue; }
    if (speaker && session()) { mode = "speakers"; if (speaker[1]) feed("speakers", speaker[1]); continue; }
    if (desc && session() && line.length < 400 && /^(description|overview)\b/i.test(line)) { mode = "desc"; if (desc[1]) feed("desc", desc[1]); continue; }
    if (objectives && session()) { mode = "objectives"; continue; }
    if (CONCURRENT_HEAD.test(line) && lastTimed && current) {
      const title = line.replace(/^\s*/, "");
      open(title, lastTimed.start, lastTimed.end, true);
      continue;
    }
    if (mode) feed(mode, line);
  }

  function feed(kind: NonNullable<typeof mode>, text: string) {
    const s = session();
    if (!s || !current) return;
    if (kind === "desc") { const parts = descParts.get(current.idx) ?? []; parts.push(text); descParts.set(current.idx, parts); return; }
    if (kind === "objectives") return;
    const { people, rejected } = parsePeopleLine(text);
    for (const p of people) {
      if (kind === "chairs") s.moderators.push(addPerson(moderators, p));
      else s.speakers.push(addPerson(speakers, p));
    }
    for (const r of rejected) unclear.push(`${s.title.slice(0, 40)}: "${r}" was not read as a ${kind === "chairs" ? "chair" : "speaker"}.`);
  }

  sessions.forEach((s, i) => { s.description = (descParts.get(i) ?? []).join(" ").slice(0, 500); });
  if (sessions.length + breaks.length < 2) return null;

  if (!year) unclear.push("Year not found. Check the event dates before creating.");
  const date = startDate ? iso(startDate.y, startDate.m, startDate.d) : "";
  const end = endDate && startDate && (endDate.d !== startDate.d || endDate.m !== startDate.m) ? iso(endDate.y, endDate.m, endDate.d) : undefined;
  if (!date) unclear.push("Event date not found. Set it before creating.");
  const dates = dayDates.length ? dayDates : [];
  return {
    importReview: { year, dayDates: dates, skippedSheets: [], inferredEvent: true },
    name: name || workbook.fileName.replace(/\.[^.]+$/, ""),
    type: inferType(name),
    date,
    ...(end ? { endDate: end } : {}),
    sessions,
    breaks,
    speakers: [...speakers.values()],
    moderators: [...moderators.values()],
    sponsors: [],
    components: [],
    notes: notes.join("\n"),
    avRequirements: "",
    confidence: { overall: unclear.length > 12 || !date ? 0.6 : 0.85, unclear: unclear.slice(0, 40) },
  };
}
