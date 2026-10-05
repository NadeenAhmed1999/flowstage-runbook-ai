import {
  EQUIPMENT_LABEL,
  REQUIREMENT_EQUIPMENT,
  REQUIREMENT_LABEL,
  isPause,
  overlaps,
  toMin,
  type OpsModel,
  type ProgrammeItem,
  type Room,
} from "@/lib/event-model";
import { buildBands, deriveSetupBlocks, sortItems } from "@/lib/ops-schedule";

export type Severity = "high" | "medium" | "low";

export type ConflictRule =
  | "person_double_booked"
  | "resource_conflict"
  | "interpreter_conflict"
  | "equipment_conflict"
  | "insufficient_reset"
  | "speaker_transit"
  | "capacity"
  | "missing_equipment"
  | "requirement_unsupported"
  | "catering_overlap"
  | "vip_overlap"
  | "missing_information";

export type ConflictPatch = {
  label: string;
  /** Exact description of the change shown before the user confirms. */
  description: string;
  apply: (m: OpsModel) => OpsModel;
};

export type Conflict = {
  id: string;
  rule: ConflictRule;
  severity: Severity;
  what: string;
  itemIds: string[];
  why: string;
  resolution: string;
  impact: string;
  patch?: ConflictPatch;
};

const label = (i: ProgrammeItem) => (i.code ? `Session ${i.code}` : i.title);
const roomOf = (m: OpsModel, i: ProgrammeItem): Room | undefined => m.rooms.find((r) => r.id === i.room.value);

export function detectConflicts(m: OpsModel): Conflict[] {
  const out: Conflict[] = [];
  const items = sortItems(m.items);
  const prog = items.filter((i) => !isPause(i));
  const name = (id: string) => m.people.find((p) => p.id === id)?.name ?? id;

  // 1. People in concurrent items
  for (let a = 0; a < prog.length; a++)
    for (let b = a + 1; b < prog.length; b++) {
      const x = prog[a], y = prog[b];
      if (!overlaps(x, y)) continue;
      const roles = (i: ProgrammeItem) => [
        ...(i.speakers.value ?? []).map((p) => [p, "speaker"] as const),
        ...(i.moderators.value ?? []).map((p) => [p, "moderator"] as const),
        ...(i.chairs.value ?? []).map((p) => [p, "chair"] as const),
      ];
      const ry = new Map(roles(y));
      for (const [p, role] of roles(x)) {
        if (!ry.has(p)) continue;
        out.push({
          id: `person-${p}-${x.id}-${y.id}`,
          rule: "person_double_booked",
          severity: "high",
          what: `${name(p)} is ${role} in ${label(x)} and ${ry.get(p)} in ${label(y)} at the same time`,
          itemIds: [x.id, y.id],
          why: "One person cannot be in two rooms at once; one session will start without them.",
          resolution: `Replace ${name(p)} in one session or move one session to a different time slot.`,
          impact: "Session delay or empty chair; audience and sponsor expectations affected.",
        });
      }
    }

  // 2. Shared resources / interpreters / equipment pool
  for (const res of m.resources) {
    for (const band of buildBands(items)) {
      const users = band.items.filter((i) => i.resources.some((r) => r.resourceId === res.id));
      const demand = users.reduce((s, i) => s + (i.resources.find((r) => r.resourceId === res.id)?.quantity ?? 0), 0);
      if (users.length > 1 && demand > res.quantity) {
        const rule = res.kind === "interpreter" ? "interpreter_conflict" : res.kind === "microphone" || res.kind === "camera" ? "equipment_conflict" : "resource_conflict";
        out.push({
          id: `res-${res.id}-${band.key}`,
          rule,
          severity: "high",
          what: `${res.name}: ${demand} needed across ${users.map(label).join(", ")} but only ${res.quantity} available`,
          itemIds: users.map((u) => u.id),
          why: "Concurrent items need the same resource at the same time.",
          resolution: `Add ${demand - res.quantity} more ${res.name.toLowerCase()} or re-assign one item.`,
          impact: rule === "interpreter_conflict" ? "Delegates relying on interpretation lose access in one room." : "One room runs without required support.",
        });
      }
    }
  }

  // 3. Setup / reset windows
  for (const s of deriveSetupBlocks(m)) {
    if (!s.insufficient) continue;
    out.push({
      id: `reset-${s.id}`,
      rule: s.label.startsWith("Catering") ? "catering_overlap" : "insufficient_reset",
      severity: "medium",
      what: `${s.label}: ${s.durationMin} min window at ${s.start} (day ${s.day})`,
      itemIds: [...s.fromItemIds, ...s.toItemIds],
      why: `Rooms need at least ${m.rules.minResetMin} min to reset furniture, AV and staffing.`,
      resolution: "Add a buffer, shorten the previous item, or use a separate pre-set room.",
      impact: "Next item likely starts late; rushed AV checks increase technical risk.",
    });
  }

  // 4. Speaker transit between rooms
  for (const p of m.people) {
    const mine = prog.filter((i) => [...(i.speakers.value ?? []), ...(i.moderators.value ?? []), ...(i.chairs.value ?? [])].includes(p.id));
    for (let k = 0; k < mine.length - 1; k++) {
      const a = mine[k], b = mine[k + 1];
      if (a.day !== b.day || !a.room.value || !b.room.value || a.room.value === b.room.value) continue;
      const gap = toMin(b.start) - toMin(a.end);
      if (gap >= 0 && gap < m.rules.minSpeakerTransitMin)
        out.push({
          id: `transit-${p.id}-${a.id}-${b.id}`,
          rule: "speaker_transit",
          severity: "medium",
          what: `${p.name} has ${gap} min to move from ${roomOf(m, a)?.name} to ${roomOf(m, b)?.name}`,
          itemIds: [a.id, b.id],
          why: `Speakers need at least ${m.rules.minSpeakerTransitMin} min to move, mic up and brief.`,
          resolution: "Assign an escort and pre-mic, or adjust timings.",
          impact: "Late walk-on; moderator must fill time.",
        });
    }
  }

  // 5–7. Capacity, equipment, requirement support
  for (const i of prog) {
    const room = roomOf(m, i);
    if (!room) continue;
    if (room.capacity.value != null && i.expectedAttendance.value != null && room.capacity.value < i.expectedAttendance.value)
      out.push({
        id: `cap-${i.id}`,
        rule: "capacity",
        severity: "high",
        what: `${room.name} holds ${room.capacity.value}; ${label(i)} expects ${i.expectedAttendance.value}`,
        itemIds: [i.id],
        why: "Over-capacity breaches fire safety limits and leaves delegates standing.",
        resolution: "Move to a larger room, add overflow with a relay feed, or cap registration.",
        impact: "Safety risk and poor delegate experience.",
      });
    if (room.equipmentState !== "unknown") {
      const has = new Set(room.equipment.filter((e) => e.state !== "not_required").map((e) => e.kind));
      for (const k of i.av.value ?? [])
        if (!has.has(k))
          out.push({
            id: `eq-${i.id}-${k}`,
            rule: "missing_equipment",
            severity: "high",
            what: `${label(i)} needs ${EQUIPMENT_LABEL[k]} but ${room.name} has none listed`,
            itemIds: [i.id],
            why: "The session cannot run as planned without this equipment.",
            resolution: `Add ${EQUIPMENT_LABEL[k]} to ${room.name} or move the session.`,
            impact: "Technical failure on stage.",
          });
      for (const r of m.requirements.filter((r) => r.scope === "item" && r.targetId === i.id && r.state !== "not_required" && r.state !== "unknown"))
        for (const k of REQUIREMENT_EQUIPMENT[r.kind] ?? [])
          if (!has.has(k))
            out.push({
              id: `req-${r.id}-${k}`,
              rule: "requirement_unsupported",
              severity: "high",
              what: `${REQUIREMENT_LABEL[r.kind]} required for ${label(i)} but ${room.name} has no ${EQUIPMENT_LABEL[k]}`,
              itemIds: [i.id],
              why: "The room cannot deliver this requirement.",
              resolution: `Install ${EQUIPMENT_LABEL[k]} or move to a room that has it.`,
              impact: "Requirement not delivered to delegates who depend on it.",
            });
    }
  }

  // 8. Catering immediately after programming with no turnaround
  for (const meal of items.filter((i) => i.type === "meal")) {
    const before = prog.find((p) => p.day === meal.day && p.end === meal.start);
    if (!before) continue;
    const sameKnownRoom = meal.room.value && meal.room.value === before.room.value;
    const hasCateringReq = m.requirements.some((r) => r.kind === "catering" && r.targetId === meal.id && r.state !== "unknown");
    if (hasCateringReq && !sameKnownRoom) continue;
    const affected = prog.filter((p) => p.day === meal.day && p.end === meal.start);
    out.push({
      id: `catering-${meal.id}`,
      rule: "catering_overlap",
      severity: "medium",
      what: `${meal.title} (day ${meal.day}, ${meal.start}) starts the minute ${affected.map(label).join(" / ")} end${affected.length > 1 ? "" : "s"}`,
      itemIds: [meal.id, ...affected.map((a) => a.id)],
      why: "Catering must be set while sessions are still running; the catering location is not specified.",
      resolution: "Confirm lunch is served in a separate catering area set up during the sessions.",
      impact: "If catering shares a session space, set-up noise disrupts the session or lunch starts late.",
      patch: {
        label: "Record catering requirement",
        description: `Add a "Required" catering requirement to ${meal.title} (day ${meal.day}): served in a separate catering area, set up during the preceding sessions. No timings change.`,
        apply: (mm) => ({
          ...mm,
          requirements: [
            ...mm.requirements,
            { id: `req-cat-${meal.id}`, kind: "catering", scope: "item", targetId: meal.id, state: "required", detail: "Separate catering area, set up during preceding sessions" },
          ],
        }),
      },
    });
  }

  // 9. VIP protocol overlapping another activity
  for (const r of m.requirements.filter((r) => r.kind === "vip_protocol" && r.scope === "item" && r.targetId)) {
    const i = items.find((x) => x.id === r.targetId);
    if (!i) continue;
    const clash = prog.filter((o) => o.id !== i.id && overlaps(o, i));
    if (clash.length)
      out.push({
        id: `vip-${r.id}`,
        rule: "vip_overlap",
        severity: "medium",
        what: `VIP protocol for ${label(i)} overlaps ${clash.map(label).join(", ")}`,
        itemIds: [i.id, ...clash.map((c) => c.id)],
        why: "VIP movement and security sweeps compete with delegate flow and staff.",
        resolution: "Agree a VIP route and dedicated escort separate from the concurrent session.",
        impact: "Protocol breach or delayed start.",
      });
  }

  // 10. Missing information (aggregated)
  const missing = (key: string, what: string, list: ProgrammeItem[], severity: Severity, why: string, resolution: string, patch?: ConflictPatch) => {
    if (!list.length) return;
    out.push({
      id: `missing-${key}`,
      rule: "missing_information",
      severity,
      what: `${what} — ${list.length} item${list.length > 1 ? "s" : ""}`,
      itemIds: list.map((i) => i.id),
      why,
      resolution,
      impact: "Run-of-show cues, staffing and AV cannot be finalised for these items.",
      patch,
    });
  };

  const concurrentNoRoom = buildBands(items).filter((b) => b.concurrent).flatMap((b) => b.items.filter((i) => !isPause(i) && i.room.state === "unknown"));
  missing(
    "concurrent-rooms",
    "Concurrent tracks have no rooms assigned",
    concurrentNoRoom,
    "high",
    "Parallel sessions must be in different rooms; without rooms, delegate wayfinding, AV and staffing cannot be planned.",
    "Assign a room to each track. You can create placeholder breakout rooms now and rename them later.",
    {
      label: "Create placeholder track rooms",
      description: `Create placeholder rooms "Breakout Room A" and "Breakout Room B" (capacity, layout and AV still not specified) and assign Track A items to Room A and Track B items to Room B (${concurrentNoRoom.length} items).`,
      apply: (mm) => {
        const mk = (id: string, n: string): Room => ({ id, name: n, purpose: "breakout", capacity: { state: "unknown" }, layout: { state: "unknown" }, stage: { state: "unknown" }, equipmentState: "unknown", equipment: [], placeholder: true });
        const rooms = [...mm.rooms];
        if (!rooms.some((r) => r.id === "room-ph-a")) rooms.push(mk("room-ph-a", "Breakout Room A"));
        if (!rooms.some((r) => r.id === "room-ph-b")) rooms.push(mk("room-ph-b", "Breakout Room B"));
        const ids = new Set(concurrentNoRoom.map((i) => i.id));
        return {
          ...mm,
          rooms,
          items: mm.items.map((i) =>
            ids.has(i.id) && i.room.state === "unknown"
              ? { ...i, room: { state: "confirmed", value: i.track === "Track B" ? "room-ph-b" : "room-ph-a" } }
              : i,
          ),
        };
      },
    },
  );
  missing("room", "Room not specified", prog.filter((i) => i.room.state === "unknown" && !concurrentNoRoom.includes(i)), "medium", "Room drives layout, AV and staffing.", "Assign a room to each item.");
  missing("chairs", "Session chair / moderator not specified", prog.filter((i) => i.chairs.state === "unknown" && i.moderators.state === "unknown"), "medium", "Every session needs someone to run time, introduce speakers and manage Q&A.", "Confirm a chair or moderator per session.");
  missing("speakers", "Speakers not specified", prog.filter((i) => i.speakers.state === "unknown"), "medium", "Speaker briefings, mic plots and green-room scheduling depend on confirmed speakers.", "Confirm speakers per session.");
  missing("av", "AV requirements not specified", prog.filter((i) => i.av.state === "unknown"), "low", "Production cannot plan mics, screens or recording per room.", "Specify AV per session or per room.");
  missing("interp", "Interpretation requirement not specified", prog.filter((i) => i.interpretation.state === "unknown"), "low", "Multilingual audiences may need booths, interpreters and receivers, which take lead time.", "Confirm whether interpretation is required, and in which languages.");
  if (m.venue.name.state === "unknown")
    out.push({ id: "missing-venue", rule: "missing_information", severity: "high", what: "Venue not specified", itemIds: [], why: "Every operational plan depends on the venue.", resolution: "Add the venue.", impact: "No room or AV planning possible." });

  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  return out.filter((c) => !m.dismissedConflicts.includes(c.id)).sort((a, b) => order[a.severity] - order[b.severity]);
}
