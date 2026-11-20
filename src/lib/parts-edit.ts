import type { EventData, EventComponent } from "@/components/event-context";
import { componentBlueprint, type ComponentKind } from "@/lib/event-components";
import { componentPartId, MAIN_PART_ID } from "@/lib/event-parts";
import { resolveOps } from "@/lib/event-migrate";

export const cleanHosts = (value: string) => value.split(",").map(name => name.trim()).filter(Boolean);

export function eventDayCount(start: string, end?: string): number {
  if (!start || !end) return 1;
  const days = Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  return Number.isFinite(days) ? Math.max(1, days) : 1;
}

export function addPart(event: EventData, kind: ComponentKind, id: string): EventData {
  const bp = componentBlueprint(kind);
  const part: EventComponent = {
    id,
    kind,
    name: bp.label,
    day: 1,
    startTime: bp.defaultStart,
    durationMin: bp.defaultDurationMin,
    operationalRequirements: {
      av: [...bp.defaultAV],
      staffing: [...bp.defaultStaffing],
      protocol: [...bp.defaultProtocol],
    },
  };
  return { ...event, components: [...(event.components ?? []), part] };
}

export function editPart(event: EventData, id: string, patch: Partial<EventComponent>): EventData {
  return {
    ...event,
    components: (event.components ?? []).map((c) =>
      c.id === id ? { ...c, ...patch, id: c.id } : c,
    ),
  };
}

export function renameMainPart(event: EventData, name: string): EventData {
  const ops = resolveOps(event);
  return {
    ...event,
    ops: { ...ops, parts: ops.parts.map((p) => (p.id === MAIN_PART_ID ? { ...p, name } : p)) },
  };
}

export function reorderPart(event: EventData, from: number, to: number): EventData {
  const components = [...(event.components ?? [])];
  if (from < 0 || to < 0 || from >= components.length || to >= components.length || from === to)
    return event;
  const [part] = components.splice(from, 1);
  if (!part) return event;
  components.splice(to, 0, part);
  return { ...event, components };
}

export function partItemCounts(event: EventData, id: string) {
  const partId = componentPartId(id);
  return {
    sessions: event.sessions.filter((s) => s.partId === partId).length,
    breaks: event.breaks.filter((b) => b.partId === partId).length,
  };
}

export function deletePart(event: EventData, id: string, choice?: "move" | "delete"): EventData {
  const counts = partItemCounts(event, id);
  if (!choice && counts.sessions + counts.breaks > 0) return event;
  const partId = componentPartId(id);
  const move = <T extends { partId?: string }>(item: T): T => {
    if (item.partId !== partId) return item;
    const { partId: _removed, ...rest } = item;
    return rest as T;
  };
  return {
    ...event,
    components: (event.components ?? []).filter((c) => c.id !== id),
    sessions:
      choice === "delete"
        ? event.sessions.filter((s) => s.partId !== partId)
        : event.sessions.map(move),
    breaks:
      choice === "delete"
        ? event.breaks.filter((b) => b.partId !== partId)
        : event.breaks.map(move),
  };
}
