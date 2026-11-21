import type { SavedEventSummary, SavedEventInput } from "@/lib/event-store";
import { eventFromSaved } from "@/lib/event-persist";
import { formatOverviewDateRange, overviewSummary } from "@/lib/overview-summary";

export function eventListSummary(row: SavedEventSummary, locale?: string) {
  const event = eventFromSaved(row.eventMeta, row.ops);
  return { ...overviewSummary(event), dateRange: formatOverviewDateRange(event, locale) };
}

export function canDeleteEvent(ownerId: string, userId: string | null): boolean {
  return userId !== null && ownerId === userId;
}

/** Insert only: never reuse the source event's id or owner. */
export function duplicateEventInput(row: Pick<SavedEventSummary, "title" | "eventMeta" | "ops">): SavedEventInput {
  const title = `${row.title} (copy)`;
  return { id: crypto.randomUUID(), title, eventMeta: { ...structuredClone(row.eventMeta), name: title }, ops: structuredClone(row.ops) };
}

export function eventListState(ready: boolean, userId: string | null, loading: boolean, error: boolean, count: number) {
  if (!ready) return "loading";
  if (!userId) return "signed-out";
  if (loading) return "loading";
  if (error) return "error";
  return count === 0 ? "empty" : "ready";
}