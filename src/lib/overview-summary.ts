import { seedEvent, type EventData } from "@/components/event-context";
import { resolveOps } from "@/lib/event-migrate";
import { MAIN_PART_ID } from "@/lib/event-parts";

const seedFingerprint = JSON.stringify(seedEvent);

/** Identity is intentional: an imported copy, even with identical values, is not the built-in example. */
export function isExampleEvent(event: EventData, savedId: string | null): boolean {
  return savedId === null && event === seedEvent && JSON.stringify(event) === seedFingerprint;
}

function calendarDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function formatOverviewDateRange(event: EventData, locale?: string): string {
  const start = calendarDate(event.date);
  const end = calendarDate(event.endDate ?? "");
  if (!start) return "Date not specified";
  const formatter = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" });
  return end && end > start ? formatter.formatRange(start, end) : formatter.format(start);
}

export function overviewSummary(event: EventData) {
  const ops = resolveOps(event);
  const start = calendarDate(event.date);
  const end = calendarDate(event.endDate ?? "");
  // Calendar arithmetic avoids daylight-saving transitions changing the day count.
  const ordinal = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dateDays = start && end ? Math.max(1, Math.round((ordinal(end) - ordinal(start)) / 86_400_000) + 1) : 1;
  const parts = ops.parts.map(part => ({
    id: part.id,
    name: part.name,
    day: part.day,
    start: part.start,
    end: part.end,
    sessions: event.sessions.filter(session => (session.partId || MAIN_PART_ID) === part.id).length,
  }));
  return {
    sessions: event.sessions.length,
    people: new Set([...event.speakers, ...event.moderators].map(person => person.id)).size,
    breaks: event.breaks.length,
    days: Math.max(dateDays, ...ops.items.map(item => item.day), ...parts.map(part => part.day)),
    partCount: parts.length,
    parts,
    empty: event.sessions.length === 0 && (event.components?.length ?? 0) === 0,
  };
}