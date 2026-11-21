import type { ParsedWorkbook } from "../excel-io";
import type { ComponentKind } from "../event-components";
import type { ReviewEvent } from "./review-draft";
import { findHeader, rankSheets } from "./agenda-parse";
import { cleanCell, parseTime } from "./values";
import { fromMin, toMin } from "../event-model";
import { componentPartId } from "../event-parts";

export type ReviewPart = { id: string; name: string; kind: ComponentKind; accepted: boolean };
export type RowMetadata = { partId?: string; sourceSheet?: string; sourceRow?: number; sourceOrder?: number; room?: string };

export function ceremonyKind(text: string): ComponentKind | null {
  if (/\b(anthem|opening ceremony|opening performance|opening video|welcome (address|remarks)|opening (address|remarks))\b/i.test(text)) return "opening-ceremony";
  if (/\b(awards? ceremony|awards? presentation|prize giving)\b/i.test(text)) return "awards-ceremony";
  if (/\bregistration\b/i.test(text) || /\bnetworking\b/i.test(text) && !/\bbreak\b/i.test(text)) return "networking-reception";
  return null;
}

export function reviewRows(event: ReviewEvent) {
  return [
    ...event.sessions.map((row, index) => ({ ...row, kind: "sessions" as const, index, title: row.title })),
    ...event.breaks.map((row, index) => ({ ...row, kind: "breaks" as const, index, title: row.label })),
  ].sort((a, b) => (a.sourceOrder ?? 100000 + a.index) - (b.sourceOrder ?? 100000 + b.index));
}

export function partWindow(rows: { day: number; startTime: string; durationMin: number; room?: string }[]) {
  const first = rows[0];
  const timed = rows.filter(row => parseTime(row.startTime));
  const start = timed.length ? Math.min(...timed.map(row => toMin(row.startTime))) : null;
  const end = timed.length ? Math.max(...timed.map(row => toMin(row.startTime) + row.durationMin)) : null;
  return { day: first?.day ?? 1, start: start === null ? "" : fromMin(start), end: end === null ? "" : fromMin(end), durationMin: start === null || end === null ? 0 : Math.max(0, end - start), room: first?.room ?? "" };
}

/** Only rich, ordered day/space agendas propose groups; simple imports retain one Main programme. */
export function preparePartProposals(event: ReviewEvent, workbook?: ParsedWorkbook): { event: ReviewEvent; parts: ReviewPart[] } {
  if (!workbook) return { event, parts: [] };
  const top = rankSheets(workbook.sheets)[0];
  const sheet = top ? workbook.sheets[top.index] : undefined;
  if (!sheet || !top?.header) return { event, parts: [] };
  const candidates = workbook.sheets.flatMap((source, sheetIndex) => {
    const header = findHeader(source.rows);
    if (!header || source.name !== sheet.name && !/break/i.test(source.name)) return [];
    const c = header.columns;
    return source.rows.slice(header.row + 1).map((row, index) => ({
      title: cleanCell(row[c.title?.[0] ?? -1]),
      start: parseTime(row[c.start?.[0] ?? -1] ?? null) ?? "",
      day: Number(cleanCell(row[c.day?.[0] ?? -1]).match(/\d+/)?.[0]) || 1,
      room: cleanCell(row[c.space?.[0] ?? -1]),
      sourceSheet: source.name, sourceRow: header.row + index + 2, sourceOrder: sheetIndex * 100000 + index,
    }));
  });
  const used = new Set<number>();
  const metadata = (title: string, start: string, day: number) => {
    const index = candidates.findIndex((row, i) => !used.has(i) && row.title === title && row.start === start && row.day === day);
    const source = candidates[index];
    if (!source) return {};
    used.add(index);
    return { room: source.room, sourceSheet: source.sourceSheet, sourceRow: source.sourceRow, sourceOrder: source.sourceOrder };
  };
  const enriched: ReviewEvent = { ...event,
    sessions: event.sessions.map(row => ({ ...row, ...metadata(row.title, row.startTime, row.day) })),
    breaks: event.breaks.map(row => ({ ...row, ...metadata(row.label, row.startTime, row.day) })),
  };
  if (!top.header.columns.day || !top.header.columns.space) return { event: enriched, parts: [] };
  const parts: ReviewPart[] = [];
  let previous: ReturnType<typeof reviewRows>[number] | undefined;
  let current: ReviewPart | undefined;
  for (const row of reviewRows(enriched)) {
    const kind = ceremonyKind(`${row.title} ${"sessionType" in row ? row.sessionType ?? "" : ""}`);
    if (!kind || row.sourceSheet !== sheet.name) { current = undefined; previous = row; continue; }
    const consecutive = previous && previous.sourceOrder !== undefined && row.sourceOrder === previous.sourceOrder + 1 && previous.day === row.day && previous.room === row.room;
    if (!current || current.kind !== kind || !consecutive) {
      current = { id: `import-group-${row.sourceOrder}`, name: kind === "opening-ceremony" ? "Opening ceremony" : kind === "awards-ceremony" ? "Awards ceremony" : "Registration & networking", kind, accepted: true };
      parts.push(current);
    }
    const item = enriched[row.kind][row.index];
    if (item) item.partId = componentPartId(current.id);
    previous = row;
  }
  return { event: enriched, parts };
}