import type { EventData, Session, Break, Person as LegacyPerson } from "@/components/event-context";
import {
  confirmed,
  fromMin,
  toMin,
  unknown,
  isPause,
  type OpsModel,
  type ProgrammeItem,
  type ProgrammeType,
  type Room,
} from "@/lib/event-model";
import { assignTracks } from "@/lib/ops-schedule";
import { withParts, MAIN_PART_ID } from "@/lib/event-parts";

export function legacySignature(e: Pick<EventData, "sessions" | "breaks" | "components">): string {
  return JSON.stringify([e.sessions, e.breaks, e.components ?? []]);
}

function typeFromTitle(title: string): ProgrammeType {
  const t = title.toLowerCase();
  if (/workshop|training/.test(t)) return "workshop";
  if (/opening ceremony/.test(t)) return "opening-ceremony";
  if (/closing ceremony/.test(t)) return "closing-ceremony";
  if (/opening remarks|welcome/.test(t) && !/plenary/.test(t)) return "opening-remarks";
  if (/keynote/.test(t)) return "keynote";
  if (/panel/.test(t)) return "panel";
  if (/plenary/.test(t)) return "plenary";
  if (/sponsor/.test(t)) return "sponsor-presentation";
  if (/press/.test(t)) return "press-conference";
  if (/gala|dinner/.test(t)) return "gala-dinner";
  if (/award/.test(t)) return "awards";
  if (/reception|networking/.test(t)) return "reception";
  if (/session\s*\d+[a-z]\b|\b\d+[a-z]:/i.test(title)) return "breakout";
  return "other";
}

const COMPONENT_TYPE: Record<string, ProgrammeType> = {
  "opening-ceremony": "opening-ceremony",
  "closing-ceremony": "closing-ceremony",
  "gala-dinner": "gala-dinner",
  "awards-ceremony": "awards",
  "press-conference": "press-conference",
  "networking-reception": "reception",
  "vip-reception": "reception",
  workshop: "workshop",
  exhibition: "exhibition",
  "product-launch": "product-launch",
  "cultural-program": "cultural",
};

const codeFrom = (title: string) => title.match(/\b(?:session\s*)?(\d+[A-Z]?)\b(?=\s*[:\-–]|\s+plenary)/i)?.[1]?.toUpperCase();

function personField(ids: string[], known: Set<string>) {
  const valid = ids.filter((id) => known.has(id));
  return valid.length ? confirmed(valid) : unknown<string[]>();
}

/**
 * Forward migration: legacy sessions/breaks/components → programme items.
 * Missing rooms, chairs, AV, interpretation and attendance become "unknown".
 * Venue, rooms, resources, requirements and economics from `base` are preserved.
 */
export function legacyToOps(event: EventData, base?: OpsModel): OpsModel {
  const people: LegacyPerson[] = [...event.speakers, ...event.moderators];
  const known = new Set(people.map((p) => p.id));
  const prevStatus = new Map((base?.items ?? []).map((i) => [i.origin?.id ?? i.id, i]));
  const rooms: Room[] = [...(base?.rooms ?? [])];
  const roomId = (name?: string) => {
    if (!name?.trim()) return unknown<string>();
    let r = rooms.find((x) => x.name.toLowerCase() === name.trim().toLowerCase());
    if (!r) {
      r = {
        id: `room-${rooms.length + 1}`,
        name: name.trim(),
        purpose: "other",
        capacity: unknown(),
        layout: unknown(),
        stage: unknown(),
        equipmentState: "unknown",
        equipment: [],
      };
      rooms.push(r);
    }
    return confirmed(r.id);
  };

  const base0 = (id: string): Partial<ProgrammeItem> => {
    const prev = prevStatus.get(id);
    return prev ? { room: prev.room, owner: prev.owner, resources: prev.resources, status: prev.status, av: prev.av, interpretation: prev.interpretation, chairs: prev.chairs, expectedAttendance: prev.expectedAttendance, track: prev.track } : {};
  };

  const fromSession = (s: Session): ProgrammeItem => {
    const type = typeFromTitle(s.title);
    return {
      id: s.id,
      code: codeFrom(s.title),
      title: s.title,
      type,
      day: s.day ?? 1,
      start: s.startTime,
      end: fromMin(toMin(s.startTime) + s.durationMin),
      room: unknown(),
      owner: unknown(),
      speakers: personField(s.speakerIds, known),
      moderators: personField(s.moderatorIds, known),
      chairs: unknown(),
      av: unknown(),
      interpretation: unknown(),
      expectedAttendance: unknown(),
      resources: [],
      sponsorIds: [],
      status: "planned",
      notes: s.description || undefined,
      origin: { kind: "session", id: s.id },
      ...base0(s.id),
      ...(s.partId ? { partId: s.partId } : {}),
    };
  };

  const fromBreak = (b: Break): ProgrammeItem => ({
    id: b.id,
    title: b.label,
    type: /lunch|dinner|breakfast|meal/i.test(b.label) ? "meal" : "break",
    day: b.day ?? 1,
    start: b.startTime,
    end: fromMin(toMin(b.startTime) + b.durationMin),
    room: unknown(),
    owner: unknown(),
    speakers: { state: "not_required" },
    moderators: { state: "not_required" },
    chairs: { state: "not_required" },
    av: { state: "not_required" },
    interpretation: { state: "not_required" },
    expectedAttendance: unknown(),
    resources: [],
    sponsorIds: [],
    status: "planned",
    origin: { kind: "break", id: b.id },
    ...base0(b.id),
    ...(b.partId ? { partId: b.partId } : {}),
  });

  const fromComponent = (c: NonNullable<EventData["components"]>[number]): ProgrammeItem => ({
    id: c.id,
    title: c.name,
    type: COMPONENT_TYPE[c.kind] ?? typeFromTitle(c.name),
    day: c.day ?? 1,
    start: c.startTime,
    end: c.endTime ?? fromMin(toMin(c.startTime) + c.durationMin),
    room: roomId(c.venue),
    owner: c.hosts?.length ? confirmed(c.hosts.join(", ")) : unknown(),
    speakers: unknown(),
    moderators: unknown(),
    chairs: unknown(),
    av: unknown(c.operationalRequirements?.av?.join("; ")),
    interpretation: unknown(),
    expectedAttendance: c.expectedAttendees ? confirmed(c.expectedAttendees) : unknown(),
    resources: [],
    sponsorIds: [],
    status: "planned",
    notes: [c.aiContext, c.notes, ...(c.operationalRequirements?.protocol ?? [])].filter(Boolean).join(" · ") || undefined,
    origin: { kind: "component", id: c.id },
    ...base0(c.id),
  });

  const items = assignTracks([
    ...event.sessions.map(fromSession),
    ...event.breaks.map(fromBreak),
    ...(event.components ?? []).map(fromComponent),
  ]);

  return withParts({
    version: 1,
    venue: base?.venue ?? { name: unknown() },
    rooms,
    people: people.map((p) => ({ id: p.id, name: p.name, role: p.role })),
    items,
    requirements: base?.requirements ?? [{ id: "req-interp", kind: "interpretation", scope: "event", state: "unknown" }],
    resources: base?.resources ?? [],
    economics: base?.economics ?? { currency: "USD", lines: [] },
    rules: base?.rules ?? { minResetMin: 15, minSpeakerTransitMin: 10 },
    dismissedConflicts: base?.dismissedConflicts ?? [],
    legacySignature: legacySignature(event),
    parts: base?.parts,
  }, event.components ?? []);
}

/** Reverse adapter: programme items → legacy sessions/breaks/people used by existing features. */
export function opsToLegacy(ops: OpsModel): Pick<EventData, "sessions" | "breaks" | "speakers" | "moderators"> {
  const dur = (i: ProgrammeItem) => Math.max(0, toMin(i.end) - toMin(i.start));
  // Items outside Main programme keep their part link; one-part events get no extra field.
  const partOf = (i: ProgrammeItem) => (i.partId && i.partId !== MAIN_PART_ID ? { partId: i.partId } : {});
  const nonComponent = ops.items.filter((i) => i.origin?.kind !== "component");
  const modIds = new Set(nonComponent.flatMap((i) => [...(i.moderators.value ?? []), ...(i.chairs.value ?? [])]));
  const sessions: Session[] = nonComponent
    .filter((i) => !isPause(i))
    .map((i) => ({
      id: i.origin?.id ?? i.id,
      title: i.title,
      startTime: i.start,
      durationMin: dur(i),
      description: [i.track ? `[${i.track}]` : "", i.notes ?? ""].filter(Boolean).join(" "),
      speakerIds: i.speakers.value ?? [],
      moderatorIds: [...(i.moderators.value ?? []), ...(i.chairs.value ?? [])],
      day: i.day,
      ...partOf(i),
    }));
  const breaks: Break[] = nonComponent
    .filter(isPause)
    .map((i) => ({ ...partOf(i), id: i.origin?.id ?? i.id, label: i.title, startTime: i.start, durationMin: dur(i), day: i.day }));
  return {
    sessions,
    breaks,
    speakers: ops.people.filter((p) => !modIds.has(p.id)).map((p) => ({ id: p.id, name: p.name, role: p.organisation ? `${p.role}, ${p.organisation}` : p.role })),
    moderators: ops.people.filter((p) => modIds.has(p.id)).map((p) => ({ id: p.id, name: p.name, role: p.role })),
  };
}

/** Resolve the operational model for any event, re-deriving if legacy data was edited. */
export function resolveOps(event: EventData): OpsModel {
  const sig = legacySignature(event);
  if (event.ops && event.ops.legacySignature === sig) return event.ops;
  return legacyToOps(event, event.ops);
}
