/** Pure cell-value helpers for the deterministic agenda import (no AI). */

export type Cell = string | number | null | undefined;

/** Strip non-breaking spaces and surrounding whitespace; nbsp-only cells become "". */
export function cleanCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

/** Parse "HH:MM", "HH:MM:SS", "9.30", "10:30 AM" or an Excel day fraction into "HH:MM". */
export function parseTime(value: Cell): string | null {
  if (typeof value === "number" && value >= 0 && value < 1) {
    const total = Math.round(value * 24 * 60);
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }
  const text = cleanCell(value).toLowerCase();
  const m = text.match(/^(\d{1,2})[:.](\d{2})(?::\d{2})?\s*(am|pm)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (m[3] === "pm" && h < 12) h += 12;
  if (m[3] === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export function minutesBetween(start: string, end: string): number | null {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const diff = toMin(end) - toMin(start);
  return diff > 0 ? diff : null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export type PartialDate = { year: number | null; month: number; day: number };

/** Parse "November 29th", "29 Nov", "Nov 29, 2026" or "2026-11-29". The year stays null when absent. */
export function parseDateText(value: Cell): PartialDate | null {
  const text = cleanCell(value).toLowerCase();
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
  const monthIndex = MONTHS.findIndex(m => new RegExp(`\\b${m}[a-z]*\\b`).test(text));
  if (monthIndex < 0) return null;
  const day = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (!day) return null;
  const year = text.match(/\b(20\d{2})\b/);
  const d = Number(day[1]);
  if (d < 1 || d > 31) return null;
  return { year: year ? Number(year[1]) : null, month: monthIndex + 1, day: d };
}

export function toIsoDate(d: PartialDate, year: number): string {
  return `${year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

/** One year from the file name, else from title rows; null when none or several differ (never guessed). */
export function inferYear(fileName: string, titleTexts: string[]): number | null {
  for (const source of [[fileName], titleTexts]) {
    const years = new Set(source.flatMap(t => [...t.matchAll(/(?<!\d)(20\d{2})(?!\d)/g)].map(m => Number(m[1]))));
    if (years.size === 1) return [...years][0] ?? null;
    if (years.size > 1) return null;
  }
  return null;
}

/** "Moderator: Name, Title, Org" → { name, role }. Prefix labels are dropped. */
export function parsePersonCell(value: Cell): { name: string; role: string } | null {
  const text = cleanCell(value).replace(/^(moderator|moderated by|chair|chaired by|mc|host|speaker)\s*[:\-–]\s*/i, "");
  if (!text) return null;
  const [name, ...rest] = text.split(",").map(s => s.trim()).filter(Boolean);
  if (!name) return null;
  return { name, role: rest.join(", ") };
}

const FORMAT_TYPES: [RegExp, string][] = [
  [/fireside/i, "Fireside chat"],
  [/panel/i, "Panel"],
  [/survey|poll/i, "Survey"],
  [/mou|signing/i, "MOU signing"],
  [/keynote/i, "Keynote"],
  [/address|remarks|welcome/i, "Address"],
  [/perform/i, "Performance"],
  [/workshop/i, "Workshop"],
];

/** Map a FORMAT cell to a session type label; unknown formats keep their text, blank → "". */
export function formatToType(value: Cell): string {
  const text = cleanCell(value);
  if (!text) return "";
  return FORMAT_TYPES.find(([re]) => re.test(text))?.[1] ?? text;
}

const BREAK_RE = /\b(break|coffee|lunch|tea|networking|registration|recess)\b/i;
export const looksLikeBreak = (title: string, format: string) => !format && BREAK_RE.test(title);
