import * as XLSX from "xlsx";
import type { EventData } from "@/components/event-context";
import type { MappedEvent } from "./excel-import.functions";
import { itemPartLabel } from "@/lib/part-presentation";

export type ParsedWorkbook = {
  fileName: string;
  sheets: { name: string; rows: (string | number | null)[][] }[];
};

/** Read a .xlsx / .xls / .csv file into a compact JSON payload for the AI mapper. */
export async function parseWorkbookFile(file: File): Promise<ParsedWorkbook> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheets = wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, {
      header: 1,
      blankrows: false,
      defval: "",
      raw: false, // stringify dates/numbers so the AI reads them as text
    });
    // Part is metadata, never part of the title. Part assignment import is deferred.
    const header = rows[0];
    const partIndex = header?.findIndex(cell => String(cell).trim().toLowerCase() === "part") ?? -1;
    const hasItemTitle = header?.some(cell => /^(title|label)$/i.test(String(cell).trim()));
    return { name, rows: partIndex >= 0 && hasItemTitle
      ? rows.map(row => row.filter((_, index) => index !== partIndex))
      : rows };
  });
  return { fileName: file.name, sheets };
}

const uid = () => Math.random().toString(36).slice(2, 9);

/** Convert an AI-mapped payload into the app's EventData shape. */
export function mappedEventToEventData(m: MappedEvent): EventData {
  const speakerRoster = new Map<string, { id: string; name: string; role: string }>();
  for (const p of m.speakers) {
    const key = p.name.trim().toLowerCase();
    if (!key) continue;
    if (!speakerRoster.has(key))
      speakerRoster.set(key, { id: uid(), name: p.name.trim(), role: p.role || "Speaker" });
  }
  const moderatorRoster = new Map<string, { id: string; name: string; role: string }>();
  for (const p of m.moderators) {
    const key = p.name.trim().toLowerCase();
    if (!key) continue;
    if (!moderatorRoster.has(key))
      moderatorRoster.set(key, { id: uid(), name: p.name.trim(), role: p.role || "Moderator" });
  }

  const findOrAdd = (
    name: string,
    roster: Map<string, { id: string; name: string; role: string }>,
    defaultRole: string,
  ) => {
    const key = name.trim().toLowerCase();
    if (!key) return null;
    const found = roster.get(key);
    if (found) return found.id;
    const created = { id: uid(), name: name.trim(), role: defaultRole };
    roster.set(key, created);
    return created.id;
  };

  const sessions = m.sessions.map((s) => ({
    id: uid(),
    title: s.title,
    startTime: s.startTime,
    durationMin: s.durationMin || 30,
    description: s.description + (s.room ? (s.description ? " · " : "") + `Room: ${s.room}` : ""),
    speakerIds: s.speakers
      .map((n) => findOrAdd(n, speakerRoster, "Speaker"))
      .filter((x): x is string => Boolean(x)),
    moderatorIds: s.moderators
      .map((n) => findOrAdd(n, moderatorRoster, "Moderator"))
      .filter((x): x is string => Boolean(x)),
    day: s.day,
  }));

  return {
    name: m.name,
    type: m.type,
    date: m.date,
    endDate: m.endDate && m.endDate !== m.date ? m.endDate : undefined,
    sessions,
    speakers: Array.from(speakerRoster.values()),
    moderators: Array.from(moderatorRoster.values()),
    breaks: m.breaks.map((b) => ({
      id: uid(),
      label: b.label,
      startTime: b.startTime,
      durationMin: b.durationMin || 15,
      day: b.day,
    })),
    sponsors: m.sponsors.map((s) => ({
      id: uid(),
      name: s.name,
      placement: s.placement || "General visibility",
    })),
    components: m.components.map((c) => ({
      id: uid(),
      kind: c.kind as never,
      name: c.name,
      day: c.day,
      startTime: c.startTime,
      durationMin: c.durationMin,
      venue: c.venue,
      aiContext: c.notes,
    })),
    avRequirements: m.avRequirements || "Standard conference AV — main stage, dual screens, wireless mics, FOH.",
    templateGuidance: m.notes || undefined,
  };
}

/** Build the workbook without altering item titles. */
export function buildEventWorkbook(event: EventData) {
  const wb = XLSX.utils.book_new();

  const overview = [
    ["FlowStage Event Export"],
    [],
    ["Event Name", event.name],
    ["Event Type", event.type],
        ["Start Date", event.date],
    ["End Date", event.endDate ?? event.date],
    ["Sessions", event.sessions.length],
    ["Speakers", event.speakers.length],
    ["Moderators", event.moderators.length],
    ["Breaks", event.breaks.length],
    ["Sponsors", event.sponsors.length],
    ["Components", event.components?.length ?? 0],
    [],
    ["AV Requirements", event.avRequirements],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overview);
  wsOverview["!cols"] = [{ wch: 22 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

  const sessionRows = [
    ["Day", "Start", "Duration (min)", "Title", "Speakers", "Moderators", "Description", "Part"],
    ...event.sessions.map((s) => [
      s.day ?? 1,
      s.startTime,
      s.durationMin,
      s.title,
      s.speakerIds
        .map((id) => event.speakers.find((p) => p.id === id)?.name)
        .filter(Boolean)
        .join(", "),
      s.moderatorIds
        .map((id) => event.moderators.find((p) => p.id === id)?.name)
        .filter(Boolean)
        .join(", "),
      s.description,
      itemPartLabel(event, s) ?? "",
    ]),
  ];
  const wsS = XLSX.utils.aoa_to_sheet(sessionRows);
  wsS["!cols"] = [
    { wch: 6 },
    { wch: 8 },
    { wch: 14 },
    { wch: 45 },
    { wch: 30 },
    { wch: 24 },
    { wch: 60 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsS, "Sessions");

  const wsSp = XLSX.utils.aoa_to_sheet([
    ["Name", "Role"],
    ...event.speakers.map((p) => [p.name, p.role]),
  ]);
  wsSp["!cols"] = [{ wch: 32 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSp, "Speakers");

  const wsMod = XLSX.utils.aoa_to_sheet([
    ["Name", "Role"],
    ...event.moderators.map((p) => [p.name, p.role]),
  ]);
  wsMod["!cols"] = [{ wch: 32 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsMod, "Moderators");

  const wsB = XLSX.utils.aoa_to_sheet([
    ["Day", "Start", "Duration (min)", "Label", "Part"],
    ...event.breaks.map((b) => [b.day ?? 1, b.startTime, b.durationMin, b.label, itemPartLabel(event, b) ?? ""]),
  ]);
  wsB["!cols"] = [{ wch: 6 }, { wch: 8 }, { wch: 14 }, { wch: 40 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, wsB, "Breaks");

  const wsSpo = XLSX.utils.aoa_to_sheet([
    ["Sponsor", "Placement"],
    ...event.sponsors.map((s) => [s.name, s.placement]),
  ]);
  wsSpo["!cols"] = [{ wch: 36 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsSpo, "Sponsors");

  if (event.components && event.components.length) {
    const wsC = XLSX.utils.aoa_to_sheet([
      ["Kind", "Name", "Day", "Start", "Duration (min)", "Venue", "Notes"],
      ...event.components.map((c) => [
        c.kind,
        c.name,
        c.day ?? 1,
        c.startTime,
        c.durationMin,
        c.venue ?? "",
        c.aiContext ?? "",
      ]),
    ]);
    wsC["!cols"] = [
      { wch: 22 },
      { wch: 32 },
      { wch: 6 },
      { wch: 8 },
      { wch: 14 },
      { wch: 24 },
      { wch: 60 },
    ];
    XLSX.utils.book_append_sheet(wb, wsC, "Components");
  }

  return wb;
}

/** Export the current event as a professionally-formatted .xlsx and trigger download. */
export function exportEventToExcel(event: EventData) {
  const wb = buildEventWorkbook(event);
  const safeName = event.name.replace(/[^a-z0-9-_]+/gi, "_").slice(0, 60) || "flowstage_event";
  XLSX.writeFile(wb, `${safeName}.xlsx`);
}
