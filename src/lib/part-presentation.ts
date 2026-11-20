import type { EventData } from "@/components/event-context";
import type { OpsModel, ProgrammeItem } from "@/lib/event-model";
import { resolveOps } from "@/lib/event-migrate";
import { MAIN_PART_ID, partNameFor } from "@/lib/event-parts";
import { sortItems } from "@/lib/ops-schedule";
import type { TimelineBlock } from "@/lib/run-sheet-parsing";

/** Presentation only: preserve model order for groups, chronological order within each. */
export function groupItemsByPart(ops: OpsModel, items = ops.items) {
  return ops.parts.map(part => ({ part, items: sortItems(items.filter(item =>
    (item.partId && ops.parts.some(p => p.id === item.partId) ? item.partId : MAIN_PART_ID) === part.id)) }));
}

export function itemPartLabel(event: EventData, item: { partId?: string }): string | undefined {
  return partNameFor(resolveOps(event).parts, item.partId);
}

export function labelledItemTitle(event: EventData, item: { partId?: string }, title: string): string {
  const part = itemPartLabel(event, item);
  return part ? `${title} · Part: ${part}` : title;
}

/** AI rows have no stable item IDs/day. Label only an unambiguous exact title + time match. */
export function labelTimelineParts(event: EventData, timeline: TimelineBlock[]): TimelineBlock[] {
  const ops = resolveOps(event);
  return timeline.map(row => {
    const matches = ops.items.filter(item => item.title === row.title && item.start === row.time);
    const names = new Set(matches.map(item => partNameFor(ops.parts, item.partId) ?? ""));
    const name = names.size === 1 ? [...names][0] : undefined;
    return name ? { ...row, subtitle: [row.subtitle, `Part: ${name}`].filter(Boolean).join(" · ") } : row;
  });
}

export function effectiveTrack(ops: OpsModel, item: ProgrammeItem) {
  return item.track ?? ops.parts.find(p => p.id === item.partId)?.track;
}

export function partAssignmentsBrief(event: EventData): string | undefined {
  const ops = resolveOps(event);
  const rows = ops.items.flatMap(item => {
    const part = partNameFor(ops.parts, item.partId);
    return part ? [`Day ${item.day} ${item.start || "Time not specified"} | ${item.title} | Part: ${part}`] : [];
  });
  return rows.length ? rows.join("\n") : undefined;
}