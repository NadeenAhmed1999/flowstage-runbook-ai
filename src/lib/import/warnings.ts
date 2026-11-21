import type { ParsedWorkbook } from "../excel-io";
import type { ReviewDraft } from "./review-draft";
import { ceremonyKind, partWindow, reviewRows } from "./part-proposals";
import { cleanCell, parseTime } from "./values";
import { fromMin, toMin } from "../event-model";

export type WarningTarget = { id: string; label: string };
export type ImportWarning = { id: string; code: "sheet-time" | "overlap" | "missing-time" | "duplicate-speaker" | "unknown-date" | "unknown-year" | "duration"; message: string; possible?: boolean; rows: WarningTarget[] };
export const rowTargetId = (kind: "sessions" | "breaks", index: number) => `import-${kind}-${index}`;
export const normalizeSpeakerName = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\bdr\b\.?\s*/g, "").replace(/[^\p{L}\p{N}]/gu, "");

/** Sub-sheet windows require a Time/Item header; arbitrary time-like cells are not schedules. */
export function readSubSheetWindows(workbook: ParsedWorkbook) {
  return workbook.sheets.flatMap(sheet => {
    const headerIndex = sheet.rows.slice(0, 15).findIndex(row => row.some(cell => /^(time|start|start time|from)$/i.test(cleanCell(cell))) && row.some(cell => /^(item|title|activity|agenda item|session)$/i.test(cleanCell(cell))));
    const header = sheet.rows[headerIndex];
    if (!header) return [];
    const col = (re: RegExp) => header.findIndex(cell => re.test(cleanCell(cell)));
    const timeCol = col(/^(time|start|start time|from)$/i);
    const itemCol = col(/^(item|title|activity|agenda item|session)$/i);
    const dayCol = col(/^day$/i);
    const spaceCol = col(/^(space|room|venue|location)$/i);
    const groups = new Map<string, { sheet: string; day: number | null; space: string; starts: number[]; ends: number[]; titles: string[] }>();
    for (const row of sheet.rows.slice(headerIndex + 1)) {
      const title = cleanCell(row[itemCol]);
      const raw = cleanCell(row[timeCol]);
      const range = raw.match(/^(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})$/);
      const start = parseTime(range?.[1] ?? raw);
      const end = range ? parseTime(range[2] ?? "") : null;
      if (!title || !start) continue;
      const day = Number(cleanCell(row[dayCol]).match(/\d+/)?.[0]) || null;
      const space = cleanCell(row[spaceCol]);
      const key = `${day}:${space.toLowerCase()}`;
      const group = groups.get(key) ?? { sheet: sheet.name, day, space, starts: [], ends: [], titles: [] };
      group.starts.push(toMin(start));
      group.ends.push(toMin(end ?? start));
      group.titles.push(title);
      groups.set(key, group);
    }
    return [...groups.values()].filter(group => group.starts.length > 1 || group.ends[0] !== group.starts[0]).map(group => ({
      sheet: group.sheet, day: group.day, space: group.space, titles: group.titles,
      start: fromMin(Math.min(...group.starts)), end: fromMin(Math.max(...group.ends)),
    }));
  });
}

const normalizedSpace = (room: string | undefined) => (room ?? "").trim().toLowerCase();
const normalizedTitle = (title: string) => title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

/** Advisory only: no mutations, AI calls, blocking flags or automatic resolutions. */
export function importWarnings(draft: ReviewDraft, workbook: ParsedWorkbook): ImportWarning[] {
  const rows = reviewRows(draft.event);
  const target = (row: typeof rows[number]): WarningTarget => ({ id: rowTargetId(row.kind, row.index), label: `${row.kind === "sessions" ? "Session" : "Break"} ${row.index + 1}: ${row.title}${row.sourceSheet ? ` (${row.sourceSheet}${row.sourceRow ? ` row ${row.sourceRow}` : ""})` : ""}` });
  const warnings: ImportWarning[] = [];
  for (const row of rows) {
    if (!parseTime(row.startTime)) warnings.push({ id: `time-${row.kind}-${row.index}`, code: "missing-time", message: "Missing start time", rows: [target(row)] });
    if (row.kind === "sessions" && (row.durationMin <= 0 || row.durationSource === "inferred")) warnings.push({ id: `duration-${row.index}`, code: "duration", message: row.durationMin <= 0 ? "Session has no duration" : "Session duration was not supplied; the displayed duration is inferred", rows: [target(row)] });
  }
  for (let i = 0; i < rows.length; i++) {
    const a = rows[i];
    if (!a || !parseTime(a.startTime) || !normalizedSpace(a.room) || a.durationMin <= 0) continue;
    for (const b of rows.slice(i + 1)) {
      if (a.day !== b.day || normalizedSpace(a.room) !== normalizedSpace(b.room) || !parseTime(b.startTime) || b.durationMin <= 0) continue;
      if (toMin(a.startTime) < toMin(b.startTime) + b.durationMin && toMin(b.startTime) < toMin(a.startTime) + a.durationMin) warnings.push({
        id: `overlap-${a.kind}-${a.index}-${b.kind}-${b.index}`, code: "overlap", message: `Overlapping items: Day ${a.day}, ${a.room}`, rows: [target(a), target(b)],
      });
    }
  }
  const people = new Map<string, string[]>();
  for (const person of draft.event.speakers) {
    const key = normalizeSpeakerName(person.name);
    if (key) people.set(key, [...(people.get(key) ?? []), person.name]);
  }
  for (const [key, names] of people) if (names.length > 1) {
    const affected = rows.filter(row => "speakers" in row && row.speakers.some(name => normalizeSpeakerName(name) === key));
    warnings.push({ id: `duplicate-${key}`, code: "duplicate-speaker", message: `Possible duplicate speakers: ${names.join(" / ")}`, rows: affected.length ? affected.map(target) : names.map(name => ({ id: "import-speakers", label: name })) });
  }
  const eventRows = rows.length ? rows.map(target) : [{ id: "import-event-fields", label: "Event dates" }];
  if (!/^\d{4}$/.test(draft.year) || Number(draft.year) < 1900 || Number(draft.year) > 2200) warnings.push({ id: "year", code: "unknown-year", message: "Event year is unknown", rows: eventRows });
  if (!validDate(draft.event.date) || draft.event.endDate && !validDate(draft.event.endDate)) warnings.push({ id: "date", code: "unknown-date", message: "Event date is unknown or invalid", rows: eventRows });

  // Compare original title families rather than editable part labels, so renaming/deleting a proposal cannot hide a source discrepancy.
  const groups: { kind: string; day: number; space: string; rows: typeof rows }[] = [];
  for (const row of rows) {
    const kind = ceremonyKind(`${row.title} ${"sessionType" in row ? row.sessionType ?? "" : ""}`);
    if (!kind) { groups.push({ kind: `title:${normalizedTitle(row.title)}`, day: row.day, space: normalizedSpace(row.room), rows: [row] }); continue; }
    const last = groups[groups.length - 1];
    const previous = last?.rows[last.rows.length - 1];
    if (last && last.kind === kind && last.day === row.day && last.space === normalizedSpace(row.room) && previous?.sourceOrder !== undefined && row.sourceOrder === previous.sourceOrder + 1) last.rows.push(row);
    else groups.push({ kind, day: row.day, space: normalizedSpace(row.room), rows: [row] });
  }
  for (const sub of readSubSheetWindows(workbook)) {
    const sheetKind = ceremonyKind(sub.sheet);
    const titleKind = ceremonyKind(sub.titles.join(" "));
    const sheetTitle = normalizedTitle(sub.sheet);
    const matches = groups.filter(group => (group.kind === (sheetKind ?? titleKind) || group.kind === `title:${sheetTitle}`) && (sub.day === null || sub.day === group.day) && (!sub.space || normalizedSpace(sub.space) === group.space) && !group.rows.some(row => row.sourceSheet === sub.sheet));
    for (const group of matches) {
      const window = partWindow(group.rows);
      if (!window.start || !window.end || window.start === sub.start && window.end === sub.end) continue;
      const possible = !sheetKind && group.kind !== `title:${sheetTitle}` || matches.length > 1;
      warnings.push({ id: `sheet-${sub.sheet}-${group.day}-${group.rows[0]?.index}`, code: "sheet-time", possible,
        message: `${possible ? "Possible conflict — " : "Time mismatch — "}Agenda: ${window.start}-${window.end}, '${sub.sheet}' sheet: ${sub.start}-${sub.end} (Day ${group.day}${group.space ? `, ${group.rows[0]?.room}` : ""})`, rows: group.rows.map(target),
      });
    }
  }
  return warnings;
}