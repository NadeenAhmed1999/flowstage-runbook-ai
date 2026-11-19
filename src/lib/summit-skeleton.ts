import { migrateOps } from "@/lib/event-parts";
import { confirmed, unknown, type OpsModel, type OpsModelV1, type ProgrammeItem, type ProgrammeType } from "@/lib/event-model";
import { assignTracks } from "@/lib/ops-schedule";

/**
 * Name-free structure shared by the private DIA test event and the public sample:
 * days, times, types, session codes, parallel pairs and gaps. Titles and people are
 * supplied by each event file, so private names never enter public bundles.
 */

type Slot = [id: string, type: ProgrammeType, day: number, start: string, end: string, code?: string];

const SLOTS: Slot[] = [
  ["d2-open", "opening-remarks", 2, "09:00", "09:30"],
  ["d2-p1", "plenary", 2, "09:30", "10:45", "1"],
  ["d2-p2", "plenary", 2, "11:00", "12:15", "2"],
  ["d2-brk1", "break", 2, "12:15", "13:00"],
  ["d2-3a", "breakout", 2, "13:00", "14:00", "3A"],
  ["d2-3b", "breakout", 2, "13:00", "14:00", "3B"],
  ["d2-lunch", "meal", 2, "14:00", "15:15"],
  ["d2-4a", "breakout", 2, "15:15", "16:15", "4A"],
  ["d2-4b", "breakout", 2, "15:15", "16:15", "4B"],
  ["d2-brk2", "break", 2, "16:15", "17:00"],
  ["d2-5", "plenary", 2, "17:00", "18:15", "5"],
  ["d3-6", "plenary", 3, "09:00", "10:15", "6"],
  ["d3-brk1", "break", 3, "10:15", "11:00"],
  ["d3-7a", "workshop", 3, "11:00", "12:30", "7A"],
  ["d3-7b", "breakout", 3, "11:00", "12:30", "7B"],
  ["d3-brk2", "break", 3, "12:30", "13:15"],
  ["d3-8a", "breakout", 3, "13:15", "14:30", "8A"],
  ["d3-8b", "breakout", 3, "13:15", "14:30", "8B"],
  ["d3-lunch", "meal", 3, "14:30", "15:45"],
  ["d3-9", "plenary", 3, "15:45", "16:45", "9"],
  ["d3-close", "closing-ceremony", 3, "16:45", "17:45"],
];

export type SummitContent = {
  titles: Record<string, string>;
  openingNotes?: string;
  people: OpsModel["people"];
  /** Person ids speaking at Opening Remarks (the only named speakers in the agenda). */
  openingSpeakers: string[];
  vipDetail: string;
  venue: OpsModel["venue"];
};

export function buildSummit(c: SummitContent): OpsModel {
  return migrateOps(buildSummitV1(c));
}

function buildSummitV1(c: SummitContent): OpsModelV1 {
  const items: ProgrammeItem[] = SLOTS.map(([id, type, day, start, end, code]) => {
    const pause = type === "break" || type === "meal";
    const nr = { state: "not_required" as const };
    const base: ProgrammeItem = {
      id,
      code,
      title: c.titles[id] ?? id,
      type,
      day,
      start,
      end,
      room: unknown(),
      owner: unknown(),
      speakers: pause ? nr : unknown(),
      moderators: pause ? nr : unknown(),
      chairs: pause ? nr : unknown(),
      av: pause ? nr : unknown(),
      interpretation: pause ? nr : unknown(),
      expectedAttendance: unknown(),
      resources: [],
      sponsorIds: [],
      status: "planned",
    };
    if (id === "d2-open") return { ...base, speakers: confirmed(c.openingSpeakers), chairs: nr, notes: c.openingNotes };
    return base;
  });
  return {
    version: 1,
    venue: c.venue,
    rooms: [],
    people: c.people,
    items: assignTracks(items),
    requirements: [
      { id: "req-interp", kind: "interpretation", scope: "event", state: "unknown" },
      { id: "req-vip", kind: "vip_protocol", scope: "item", targetId: "d2-open", state: "unknown", detail: c.vipDetail },
      { id: "req-access", kind: "accessibility", scope: "event", state: "unknown" },
      { id: "req-stream", kind: "livestream", scope: "event", state: "unknown" },
      { id: "req-record", kind: "recording", scope: "event", state: "unknown" },
    ],
    resources: [],
    economics: { currency: "USD", lines: [] },
    rules: { minResetMin: 15, minSpeakerTransitMin: 10 },
    dismissedConflicts: [],
  };
}
