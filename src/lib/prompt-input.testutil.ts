import { partNameFor } from "@/lib/event-parts";
import type { EventData } from "@/components/event-context";
import { buildOperationsBrief } from "@/lib/event-brief";
import { resolveOps } from "@/lib/event-migrate";
import { buildRunSheetPrompt } from "@/lib/run-sheet-prompt";
import { componentBlueprint } from "@/lib/event-components";

/** Mirrors the run-of-show page's mapping from an event to the run-sheet AI input (test helper). */
export function promptFor(event: EventData): string {
  const name = (ids: string[], list: EventData["speakers"]) =>
    ids.map((id) => list.find((p) => p.id === id)).filter(Boolean).map((p) => `${p!.name} (${p!.role})`);
  return buildRunSheetPrompt({
    eventName: event.name,
    eventType: event.type,
    eventDate: event.date,
    eventEndDate: event.endDate,
    sessions: event.sessions.map((s) => ({ title: s.title, startTime: s.startTime, durationMin: s.durationMin, description: s.description, day: s.day, part: partNameFor(event.ops?.parts, s.partId), speakers: name(s.speakerIds, event.speakers), moderators: name(s.moderatorIds, event.moderators) })),
    breaks: event.breaks.map((b) => ({ label: b.label, startTime: b.startTime, durationMin: b.durationMin, day: b.day })),
    sponsors: event.sponsors.map((s) => ({ name: s.name, placement: s.placement })),
    avRequirements: event.avRequirements,
    templateGuidance: event.templateGuidance,
    operationsBrief: buildOperationsBrief(resolveOps(event)),
    components: (event.components ?? []).map((c) => ({ kind: c.kind, label: componentBlueprint(c.kind).label, name: c.name, day: c.day, startTime: c.startTime, durationMin: c.durationMin, venue: c.venue, hosts: c.hosts })),
  } as any);
}
