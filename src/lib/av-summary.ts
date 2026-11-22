import type { EventData } from "@/components/event-context";
import { resolveOps } from "@/lib/event-migrate";

/** Saved part checklists and event notes only; no invented readiness or equipment. */
export function avSummary(event: EventData) {
  const requirements = event.avRequirements.trim();
  const parts = resolveOps(event).parts.map(part => ({
    id: part.id, name: part.name, day: part.day,
    checklist: part.checklists.av.map(item => item.trim()).filter(Boolean),
  })).filter(part => part.checklist.length > 0);
  return { requirements, parts, empty: !requirements && parts.length === 0 };
}
