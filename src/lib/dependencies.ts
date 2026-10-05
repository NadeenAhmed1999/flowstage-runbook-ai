import type { OpsModel } from "@/lib/event-model";
import { deriveSetupBlocks } from "@/lib/ops-schedule";

export type NodeType = "item" | "room" | "track" | "person" | "resource" | "equipment" | "requirement" | "sponsor" | "setup" | "cost";
export type Relation =
  | "in_room"
  | "in_track"
  | "speaker"
  | "moderator"
  | "chair"
  | "uses_resource"
  | "needs_equipment"
  | "has_requirement"
  | "sponsored_by"
  | "setup_before"
  | "has_cost"
  | "room_has_equipment";

export type Edge = { from: { type: NodeType; id: string }; to: { type: NodeType; id: string }; relation: Relation };

/** Build the dependency graph from the operational model. Unknown fields produce no edge. */
export function buildDependencyGraph(m: OpsModel): Edge[] {
  const edges: Edge[] = [];
  const add = (fromId: string, type: NodeType, id: string, relation: Relation, fromType: NodeType = "item") =>
    edges.push({ from: { type: fromType, id: fromId }, to: { type, id }, relation });

  for (const i of m.items) {
    if (i.room.value) add(i.id, "room", i.room.value, "in_room");
    if (i.track) add(i.id, "track", i.track, "in_track");
    i.speakers.value?.forEach((p) => add(i.id, "person", p, "speaker"));
    i.moderators.value?.forEach((p) => add(i.id, "person", p, "moderator"));
    i.chairs.value?.forEach((p) => add(i.id, "person", p, "chair"));
    i.resources.forEach((r) => add(i.id, "resource", r.resourceId, "uses_resource"));
    i.av.value?.forEach((k) => add(i.id, "equipment", k, "needs_equipment"));
    i.sponsorIds.forEach((s) => add(i.id, "sponsor", s, "sponsored_by"));
  }
  for (const r of m.requirements) if (r.scope === "item" && r.targetId) add(r.targetId, "requirement", r.id, "has_requirement");
  for (const room of m.rooms) room.equipment.forEach((e) => add(room.id, "equipment", e.kind, "room_has_equipment", "room"));
  for (const b of deriveSetupBlocks(m)) b.toItemIds.forEach((id) => add(id, "setup", b.id, "setup_before"));
  for (const l of m.economics.lines) l.links?.itemIds?.forEach((id) => add(id, "cost", l.id, "has_cost"));
  return edges;
}

export function itemsLinkedTo(edges: Edge[], type: NodeType, id: string): string[] {
  return [...new Set(edges.filter((e) => e.to.type === type && e.to.id === id && e.from.type === "item").map((e) => e.from.id))];
}
