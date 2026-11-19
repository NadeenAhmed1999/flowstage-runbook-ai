import type { ComponentKind } from "@/lib/event-components";
/**
 * FlowStage operational event model.
 *
 * The run-of-show describes how an event is executed: rooms, tracks, people,
 * requirements, resources, setup/reset, and economics. Every operational field
 * carries an explicit information state — missing data is always "unknown",
 * never silently treated as "not required".
 */

export type InfoState = "confirmed" | "required" | "not_required" | "unknown";

export type Field<T> = { state: InfoState; value?: T; note?: string };

export const unknown = <T,>(note?: string): Field<T> => ({ state: "unknown", note });
export const confirmed = <T,>(value: T): Field<T> => ({ state: "confirmed", value });
export const required = <T,>(value?: T, note?: string): Field<T> => ({ state: "required", value, note });
export const notRequired = <T,>(): Field<T> => ({ state: "not_required" });

export const INFO_STATE_LABEL: Record<InfoState, string> = {
  confirmed: "Confirmed",
  required: "Required",
  not_required: "Not required",
  unknown: "Not specified",
};

// ---------- Venue ----------

export type RoomLayout =
  | "theatre"
  | "classroom"
  | "boardroom"
  | "u-shape"
  | "cabaret"
  | "banquet"
  | "reception";

export type RoomPurpose =
  | "plenary"
  | "breakout"
  | "workshop"
  | "registration"
  | "green-room"
  | "vip"
  | "media"
  | "catering"
  | "exhibition"
  | "other";

export type EquipmentKind =
  | "screen"
  | "projector"
  | "confidence_monitor"
  | "lectern"
  | "stage"
  | "mic_handheld"
  | "mic_lapel"
  | "mic_headset"
  | "clicker"
  | "recording"
  | "livestream"
  | "interpretation_booth"
  | "lighting"
  | "other";

export const EQUIPMENT_LABEL: Record<EquipmentKind, string> = {
  screen: "Screen / LED",
  projector: "Projector",
  confidence_monitor: "Confidence monitor",
  lectern: "Podium / lectern",
  stage: "Stage",
  mic_handheld: "Handheld mic",
  mic_lapel: "Lapel mic",
  mic_headset: "Headset mic",
  clicker: "Clicker",
  recording: "Recording",
  livestream: "Livestream",
  interpretation_booth: "Interpretation booth",
  lighting: "Lighting",
  other: "Other AV",
};

export type RoomEquipment = { kind: EquipmentKind; quantity: number; state: InfoState; note?: string };

export type Room = {
  id: string;
  name: string;
  purpose: RoomPurpose;
  capacity: Field<number>;
  layout: Field<RoomLayout>;
  stage: Field<string>;
  /** "unknown" means the equipment inventory for this room has not been specified. */
  equipmentState: InfoState;
  equipment: RoomEquipment[];
  placeholder?: boolean;
};

export type Venue = { name: Field<string>; city?: string; country?: string };

// ---------- People ----------

export type Person = { id: string; name: string; role: string; organisation?: string; vip?: boolean };

// ---------- Programme ----------

export type ProgrammeType =
  | "plenary"
  | "breakout"
  | "workshop"
  | "panel"
  | "keynote"
  | "opening-remarks"
  | "opening-ceremony"
  | "closing-ceremony"
  | "gala-dinner"
  | "awards"
  | "reception"
  | "sponsor-presentation"
  | "exhibition"
  | "product-launch"
  | "press-conference"
  | "cultural"
  | "registration"
  | "break"
  | "meal"
  | "other";

export type ItemStatus = "planned" | "ready" | "in_progress" | "complete" | "delayed" | "at_risk";

export const STATUS_LABEL: Record<ItemStatus, string> = {
  planned: "Planned",
  ready: "Ready",
  in_progress: "In progress",
  complete: "Complete",
  delayed: "Delayed",
  at_risk: "At risk",
};

export type ProgrammeItem = {
  id: string;
  /** Session code from the agenda, e.g. "3A". */
  code?: string;
  title: string;
  type: ProgrammeType;
  /** 1-based day index relative to the event start date. */
  day: number;
  start: string; // HH:MM
  end: string; // HH:MM
  room: Field<string>; // room id
  track?: string;
  owner: Field<string>;
  speakers: Field<string[]>; // person ids
  moderators: Field<string[]>;
  chairs: Field<string[]>;
  av: Field<EquipmentKind[]>;
  interpretation: Field<string>;
  expectedAttendance: Field<number>;
  resources: { resourceId: string; quantity: number }[];
  sponsorIds: string[];
  status: ItemStatus;
  notes?: string;
  origin?: { kind: "session" | "break" | "component"; id: string };
  /** Part this item belongs to (model v2). */
  partId?: string;
};

// ---------- Requirements ----------

export type RequirementKind =
  | "interpretation"
  | "accessibility"
  | "remote_speaker"
  | "livestream"
  | "recording"
  | "teleprompter"
  | "confidence_monitor"
  | "extra_mics"
  | "vip_protocol"
  | "security"
  | "dietary"
  | "catering"
  | "custom";

export const REQUIREMENT_LABEL: Record<RequirementKind, string> = {
  interpretation: "Interpretation",
  accessibility: "Accessibility",
  remote_speaker: "Remote speaker",
  livestream: "Livestream",
  recording: "Recording",
  teleprompter: "Teleprompter",
  confidence_monitor: "Confidence monitor",
  extra_mics: "Additional microphones",
  vip_protocol: "VIP protocol",
  security: "Security",
  dietary: "Dietary",
  catering: "Catering",
  custom: "Custom",
};

/** Equipment each requirement needs from the room hosting it. */
export const REQUIREMENT_EQUIPMENT: Partial<Record<RequirementKind, EquipmentKind[]>> = {
  interpretation: ["interpretation_booth"],
  livestream: ["livestream"],
  recording: ["recording"],
  confidence_monitor: ["confidence_monitor"],
  teleprompter: ["confidence_monitor"],
};

export type Requirement = {
  id: string;
  kind: RequirementKind;
  scope: "event" | "room" | "item" | "person";
  targetId?: string;
  state: InfoState;
  detail?: string;
};

// ---------- Resources ----------

export type ResourceKind =
  | "av_technician"
  | "interpreter"
  | "photographer"
  | "videographer"
  | "registration_staff"
  | "production_staff"
  | "vip_escort"
  | "microphone"
  | "camera"
  | "other";

export type Resource = { id: string; kind: ResourceKind; name: string; quantity: number };

// ---------- Economics ----------

export type RevenueCategory = "registration" | "sponsorship" | "exhibition" | "partnerships" | "other";
export type CostCategory =
  | "venue"
  | "av_production"
  | "catering"
  | "staffing"
  | "speakers"
  | "travel"
  | "accommodation"
  | "interpretation"
  | "branding"
  | "photo_video"
  | "entertainment"
  | "marketing"
  | "transportation"
  | "other";

export type EconomicsLine = {
  id: string;
  direction: "revenue" | "cost";
  category: RevenueCategory | CostCategory;
  label: string;
  budget?: number;
  forecast?: number;
  actual?: number;
  notes?: string;
  links?: { itemIds?: string[]; roomIds?: string[]; resourceIds?: string[]; sponsorIds?: string[] };
};

export type Economics = { currency: string; lines: EconomicsLine[] };

// ---------- Aggregate ----------

// ---------- Parts (model v2) ----------

export type PartKind = ComponentKind | "main" | "other";

/** A part of the event (main programme, opening ceremony, gala dinner, ...). Its track is only a default for its items. */
export type Part = {
  id: string;
  name: string;
  kind: PartKind;
  day: number;
  start: string; // HH:MM
  end?: string;
  track?: string;
  notes?: string;
  /** Legacy component this part was created from (moved across, nothing dropped). */
  componentId?: string;
  venue?: string;
  hosts?: string[];
  expectedAttendees?: number;
  aiContext?: string;
  checklists: { av: string[]; staffing: string[]; protocol: string[] };
};

/** Stored model before parts existed. Still accepted on load and upgraded by migrateOps. */
export type OpsModelV1 = Omit<OpsModel, "version" | "parts"> & { version: 1; parts?: Part[] };

export type OpsModel = {
  version: 2;
  parts: Part[];
  venue: Venue;
  rooms: Room[];
  people: Person[];
  items: ProgrammeItem[];
  requirements: Requirement[];
  resources: Resource[];
  economics: Economics;
  rules: { minResetMin: number; minSpeakerTransitMin: number };
  dismissedConflicts: string[];
  /** Fingerprint of the legacy sessions/breaks/components this model was derived from. */
  legacySignature?: string;
};

// ---------- Time helpers ----------

export function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function fromMin(total: number): string {
  const t = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export function overlaps(a: ProgrammeItem, b: ProgrammeItem): boolean {
  return a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);
}

export const isPause = (i: ProgrammeItem) => i.type === "break" || i.type === "meal";

export function economicsTotals(e: Economics) {
  const sum = (dir: "revenue" | "cost", k: "budget" | "forecast" | "actual") =>
    e.lines.filter((l) => l.direction === dir).reduce((acc, l) => acc + (l[k] ?? 0), 0);
  return {
    revenue: { budget: sum("revenue", "budget"), forecast: sum("revenue", "forecast"), actual: sum("revenue", "actual") },
    cost: { budget: sum("cost", "budget"), forecast: sum("cost", "forecast"), actual: sum("cost", "actual") },
    linesWithValues: e.lines.filter((l) => l.budget != null || l.forecast != null || l.actual != null).length,
  };
}
