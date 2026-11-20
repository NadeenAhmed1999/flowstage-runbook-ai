/**
 * Deterministic first pass for agenda-style worksheets (no AI).
 * Finds the header below title rows, cleans nbsp cells, parses times/dates/people,
 * and returns a MappedEvent-shaped draft plus notes the review shows as "Needs your eyes".
 */
import type { MappedEvent } from "../excel-import.functions";
import {
  type Cell, cleanCell, formatToType, inferYear, looksLikeBreak, minutesBetween,
  parseDateText, parsePersonCell, parseTime, toIsoDate, type PartialDate,
} from "./values";

export type RawSheet = { name: string; rows: Cell[][] };

type Field = "day" | "space" | "title" | "date" | "start" | "minutes" | "end" | "format"
  | "description" | "block" | "speaker" | "speakers" | "moderator" | "mc";

const ALIASES: [Field, RegExp][] = [
  ["day", /^day$/],
  ["space", /^(space|room|location|venue|hall|stage)$/],
  ["title", /^(session title|session|title|topic|agenda item|label|item)$/],
  ["date", /^date$/],
  ["start", /^(open|start|start time|from|time|begins?)$/],
  ["minutes", /^(mins?|minutes|duration|duration \(min\))$/],
  ["end", /^(close|end|end time|to|finish)$/],
  ["format", /^(format|session type)|^type$/],
  ["description", /^(session description|description|details)$/],
  ["block", /^(block.*|theme.*|track)$/],
  ["speaker", /^speaker\s*\d+$/],
  ["speakers", /^(speakers?|presenters?)$/],
  ["moderator", /^(moderators?|chairs?|facilitators?)$/],
  ["mc", /^mc$/],
];

export type HeaderMatch = { row: number; columns: Partial<Record<Field, number[]>>; score: number };

/** Look in the first 15 rows for the row whose cells best match known header aliases. */
export function findHeader(rows: Cell[][]): HeaderMatch | null {
  let best: HeaderMatch | null = null;
  rows.slice(0, 15).forEach((row, index) => {
    const columns: Partial<Record<Field, number[]>> = {};
    row.forEach((cell, col) => {
      const text = cleanCell(cell).toLowerCase().replace(/\s*\([^)]*\)\s*$/, "").trim();
      const field = ALIASES.find(([, re]) => re.test(text))?.[0];
      if (field) (columns[field] ??= []).push(col);
    });
    const score = Object.keys(columns).length;
    if (columns.title && columns.start && score >= 3 && (!best || score > best.score)) best = { row: index, columns, score };
  });
  return best;
}

/** Agenda-likeness: header quality plus count of rows with a parseable time. */
export function rankSheets(sheets: RawSheet[]) {
  return sheets.map((sheet, index) => {
    const header = findHeader(sheet.rows);
    const timeRows = sheet.rows.filter(r => r.some(c => parseTime(c))).length;
    return { name: sheet.name, index, header, score: (header ? header.score * 10 : 0) + Math.min(timeRows, 50) };
  }).sort((a, b) => b.score - a.score || a.index - b.index);
}

export type AgendaDraft = {
  mapped: MappedEvent;
  agendaSheet: string;
  skippedSheets: string[];
  year: number | null;
  /** Row indexes into mapped.sessions whose duration came from CLOSE − OPEN. */
  derivedDurations: number[];
};

const get = (row: Cell[], cols?: number[]) => (cols ?? []).map(c => cleanCell(row[c])).filter(Boolean);

/** Returns null when no agenda header is found, so callers keep the existing AI mapping path. */
export function parseAgendaWorkbook(fileName: string, sheets: RawSheet[]): AgendaDraft | null {
  const ranked = rankSheets(sheets);
  const top = ranked[0];
  if (!top?.header) return null;
  const agenda = sheets[top.index];
  if (!agenda) return null;
  const { columns, row: headerRow } = top.header;
  const breakSheets = ranked.filter(r => r !== top && r.header && /break/i.test(r.name));
  const titleTexts = agenda.rows.slice(0, headerRow).flat().map(cleanCell).filter(Boolean);
  const metaTexts = sheets.flatMap(s => s.rows.slice(0, 10).flat().map(cleanCell));
  const isoInMeta = metaTexts.map(t => t.match(/^(\d{4})-\d{2}-\d{2}$/)).find(Boolean);
  const year = inferYear(fileName.replace(/\.[^.]+$/, ""), titleTexts) ?? (isoInMeta ? Number(isoInMeta[1]) : null);

  const unclear: string[] = [];
  const sessions: MappedEvent["sessions"] = [];
  const breaks: MappedEvent["breaks"] = [];
  const speakers = new Map<string, { name: string; role: string }>();
  const moderators = new Map<string, { name: string; role: string }>();
  const dayDates = new Map<number, PartialDate>();
  const derivedDurations: number[] = [];
  let missingTimes = 0;
  const addPerson = (map: typeof speakers, p: { name: string; role: string }) => {
    const key = p.name.toLowerCase();
    if (!map.has(key) || (!map.get(key)?.role && p.role)) map.set(key, p);
    return p.name;
  };

  const readRows = (sheet: RawSheet, cols: HeaderMatch["columns"], from: number, forceBreak: boolean) => {
    let lastDay = 1;
    for (const row of sheet.rows.slice(from + 1)) {
      const title = get(row, cols.title)[0] ?? "";
      if (!title) continue;
      const dateText = get(row, cols.date)[0];
      const date = parseDateText(dateText);
      const dayNum = Number(get(row, cols.day)[0]?.match(/\d+/)?.[0]);
      let day = Number.isFinite(dayNum) && dayNum > 0 ? dayNum : 0;
      if (!day && date) {
        const known = [...dayDates].find(([, d]) => d.month === date.month && d.day === date.day);
        day = known ? known[0] : dayDates.size + 1;
      }
      day ||= lastDay;
      lastDay = day;
      if (date && !dayDates.has(day)) dayDates.set(day, date);
      const startRaw = (cols.start ?? []).map(c => row[c]).find(c => cleanCell(c));
      const endRaw = (cols.end ?? []).map(c => row[c]).find(c => cleanCell(c));
      const start = parseTime(startRaw ?? null);
      const end = parseTime(endRaw ?? null);
      const minutesText = get(row, cols.minutes)[0];
      const minutes = minutesText && /^\d+(\.\d+)?$/.test(minutesText) ? Math.round(Number(minutesText)) : null;
      const derived = minutes == null && start && end ? minutesBetween(start, end) : null;
      if (!start) missingTimes++;
      const format = formatToType(get(row, cols.format)[0]);
      if (forceBreak || looksLikeBreak(title, format)) {
        breaks.push({ label: title, startTime: start ?? "", durationMin: minutes ?? derived ?? 15, day, durationSource: minutes != null ? "provided" : derived != null ? "derived" : "inferred", inferredDay: !dayNum });
        continue;
      }
      const sp = [
        ...get(row, cols.speaker).map(parsePersonCell),
        ...get(row, cols.speakers).flatMap(t => t.split(/[;,]/).map(n => ({ name: n.trim(), role: "" }))),
      ].filter((p): p is { name: string; role: string } => Boolean(p?.name));
      const mc = get(row, cols.mc).map(parsePersonCell).filter(Boolean).map(p => `MC: ${p?.name}`);
      const mods = get(row, cols.moderator).map(parsePersonCell)
        .filter((p): p is { name: string; role: string } => Boolean(p));
      if (derived != null) derivedDurations.push(sessions.length);
      const block = get(row, cols.block)[0];
      sessions.push({
        title,
        sessionType: format || "Session",
        inferredType: !format,
        inferredDay: !dayNum,
        durationSource: minutes != null ? "provided" : derived != null ? "derived" : "inferred",
        startTime: start ?? "",
        durationMin: minutes ?? derived ?? 30,
        description: [format && `Format: ${format}`, block && `Block: ${block}`, ...get(row, cols.description), ...mc].filter(Boolean).join(" · "),
        speakers: sp.map(p => addPerson(speakers, p)),
        moderators: mods.map(p => addPerson(moderators, p)),
        room: get(row, cols.space)[0] ?? "",
        day,
      });
    }
  };

  readRows(agenda, columns, headerRow, false);
  for (const b of breakSheets) {
    const sheet = sheets[b.index];
    if (sheet && b.header) readRows(sheet, b.header.columns, b.header.row, true);
  }

  const days = [...dayDates].sort((a, b) => a[0] - b[0]);
  let date = "";
  let endDate: string | undefined;
  if (days.length && year) {
    const first = days[0]?.[1];
    const last = days[days.length - 1]?.[1];
    if (first) date = toIsoDate(first, first.year ?? year);
    if (days.length > 1 && last) endDate = toIsoDate(last, last.year ?? year);
  } else if (isoInMeta) {
    date = isoInMeta[0];
  }
  if (!year && days.length) unclear.push("Year not found in the file name or title. Check the event dates before creating.");
  if (!date) unclear.push("Event date not found. Set it before creating.");
  if (missingTimes) unclear.push(`${missingTimes} row(s) have no start time.`);
  if (derivedDurations.length) unclear.push(`${derivedDurations.length} duration(s) calculated from CLOSE − OPEN.`);
  const used = new Set([top.name, ...breakSheets.map(b => b.name)]);
  const skippedSheets = sheets.map(s => s.name).filter(n => !used.has(n));
  if (skippedSheets.length) unclear.push(`Not imported: ${skippedSheets.length} other sheet(s) (${skippedSheets.slice(0, 8).join(", ")}${skippedSheets.length > 8 ? ", …" : ""}).`);

  const mapped: MappedEvent = {
    importReview: { year, dayDates: days.map(([day, d]) => ({ day, month: d.month, dateDay: d.day })), skippedSheets, inferredEvent: true },
    name: titleTexts[0] ?? fileName.replace(/\.[^.]+$/, ""),
    type: "Other",
    date,
    ...(endDate ? { endDate } : {}),
    sessions,
    breaks,
    speakers: [...speakers.values()],
    moderators: [...moderators.values()],
    sponsors: [],
    components: [],
    notes: "",
    avRequirements: "",
    confidence: { overall: missingTimes || !date ? 0.6 : 0.85, unclear },
  };
  return { mapped, agendaSheet: top.name, skippedSheets, year, derivedDurations };
}
