import type { OpsModel, OpsModelV1, Part, ProgrammeItem } from "@/lib/event-model";
import type { EventComponent } from "@/components/event-context";

/**
 * Nested parts (model version 2). An event is made of parts; every programme
 * item belongs to exactly one part. A v1 event becomes one "Main programme"
 * part holding its sessions and breaks, plus one part per modular component.
 */
export const MAIN_PART_ID = "part-main";
export const componentPartId = (componentId: string) => `part-${componentId}`;

function mainPart(items: ProgrammeItem[], prev?: Part): Part {
  const own = items.filter((i) => i.origin?.kind !== "component");
  const pool = own.length ? own : items;
  const sorted = [...pool].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
  const first = sorted[0];
  const last = [...pool].sort((a, b) => b.day - a.day || b.end.localeCompare(a.end))[0];
  return {
    id: MAIN_PART_ID,
    name: prev?.name ?? "Main programme",
    kind: "main",
    day: first?.day ?? 1,
    start: first?.start ?? "",
    end: last?.end,
    track: prev?.track,
    notes: prev?.notes,
    checklists: prev?.checklists ?? { av: [], staffing: [], protocol: [] },
  };
}

function partFromComponent(c: EventComponent, prev?: Part): Part {
  return {
    id: componentPartId(c.id),
    componentId: c.id,
    name: c.name,
    kind: c.kind,
    day: c.day ?? 1,
    start: c.startTime,
    end: c.endTime,
    track: prev?.track,
    notes: c.notes,
    venue: c.venue,
    hosts: c.hosts,
    expectedAttendees: c.expectedAttendees,
    aiContext: c.aiContext,
    checklists: {
      av: [...(c.operationalRequirements?.av ?? [])],
      staffing: [...(c.operationalRequirements?.staffing ?? [])],
      protocol: [...(c.operationalRequirements?.protocol ?? [])],
    },
  };
}

/** Build parts from items + legacy components, keeping prior part settings and valid item partIds. */
export function withParts(ops: OpsModel | OpsModelV1, components: EventComponent[] = []): OpsModel {
  const prevParts = new Map((ops.parts ?? []).map((p) => [p.id, p]));
  const parts: Part[] = [
    mainPart(ops.items, prevParts.get(MAIN_PART_ID)),
    ...components.map((c) => partFromComponent(c, prevParts.get(componentPartId(c.id)))),
  ];
  // Keep any extra (non-component) parts a v2 model already had.
  for (const p of ops.parts ?? []) if (!parts.some((x) => x.id === p.id) && !p.componentId) parts.push(p);
  const ids = new Set(parts.map((p) => p.id));
  const items = ops.items.map((i) => {
    if (i.partId && ids.has(i.partId)) return i;
    const cp = i.origin?.kind === "component" ? componentPartId(i.origin.id) : MAIN_PART_ID;
    return { ...i, partId: ids.has(cp) ? cp : MAIN_PART_ID };
  });
  return { ...ops, version: 2, parts, items };
}

/** Upgrade any stored model to v2. An already-v2 model is returned unchanged. */
export function migrateOps(ops: OpsModel | OpsModelV1, components: EventComponent[] = []): OpsModel {
  if (ops.version === 2 && Array.isArray(ops.parts)) return ops as OpsModel;
  return withParts(ops, components);
}
