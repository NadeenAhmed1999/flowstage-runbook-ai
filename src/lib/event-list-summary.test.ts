import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventData } from "@/components/event-context";
import { pickEventMeta } from "@/lib/event-persist";
import { resolveOps } from "@/lib/event-migrate";
import { canDeleteEvent, duplicateEventInput, eventListState, eventListSummary } from "./event-list-summary";
import { deleteSavedEvent, duplicateSavedEvent, listSavedEvents, type SavedEventSummary } from "./event-store";

const mocks = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), order: vi.fn(), eq: vi.fn(), single: vi.fn(), insert: vi.fn(), delete: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));

function fixture(): SavedEventSummary {
  const event: EventData = {
    name: "Cedar Science Forum", type: "Conference", date: "2026-11-21", endDate: "2026-11-23",
    sessions: [{ id: "cedar-session", title: "Research exchange", startTime: "09:00", durationMin: 45, description: "", speakerIds: ["cedar-ada"], moderatorIds: ["cedar-robin"] }],
    speakers: [{ id: "cedar-ada", name: "Ada Willow", role: "Researcher" }], moderators: [{ id: "cedar-robin", name: "Robin Brook", role: "Host" }],
    breaks: [], sponsors: [], avRequirements: "", components: [],
  };
  return { id: "cedar-event", title: event.name, ownerId: "cedar-owner", updatedAt: "2026-11-21T21:00:00Z", eventMeta: pickEventMeta(event), ops: resolveOps(event) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockReturnValue(mocks);
  mocks.select.mockReturnValue(mocks);
  mocks.eq.mockReturnValue(mocks);
  mocks.insert.mockReturnValue(mocks);
  mocks.delete.mockReturnValue(mocks);
});

describe("Saved event summaries", () => {
  it("derives sessions, speakers plus moderators and inclusive days from saved data", () => {
    expect(eventListSummary(fixture(), "en-GB")).toMatchObject({ sessions: 1, people: 2, days: 3, partCount: 1, empty: false });
  });
  it("formats the saved date range using the supplied locale", () => {
    const expected = new Intl.DateTimeFormat("fr-FR", { year: "numeric", month: "short", day: "numeric" }).formatRange(new Date(2026, 10, 21, 12), new Date(2026, 10, 23, 12));
    expect(eventListSummary(fixture(), "fr-FR").dateRange).toBe(expected);
  });
  it("counts multiple stored parts", () => {
    const row = fixture();
    const main = row.ops.parts[0];
    if (!main) throw new Error("Fixture needs Main programme");
    row.ops.parts.push({ ...main, id: "cedar-opening", name: "Opening" });
    expect(eventListSummary(row).partCount).toBe(2);
  });
  it("allows Delete only for the event owner, never a collaborator or signed-out user", () => {
    expect(canDeleteEvent("cedar-owner", "cedar-owner")).toBe(true);
    expect(canDeleteEvent("cedar-owner", "cedar-collaborator")).toBe(false);
    expect(canDeleteEvent("cedar-owner", null)).toBe(false);
  });
  it("builds isolated copies with the exact suffix and fresh IDs", () => {
    const row = fixture();
    const copy = duplicateEventInput(row);
    const next = duplicateEventInput(row);
    expect(copy.title).toBe("Cedar Science Forum (copy)");
    expect(copy.eventMeta.name).toBe("Cedar Science Forum (copy)");
    expect(copy.id).not.toBe(row.id);
    expect(copy.id).not.toBe(next.id);
    expect(copy).not.toHaveProperty("ownerId");
    expect(copy.ops).toEqual(row.ops);
    expect(copy.ops).not.toBe(row.ops);
    expect(row.eventMeta.name).toBe("Cedar Science Forum");
  });
  it("distinguishes empty, loading, error and signed-out list states", () => {
    expect(eventListState(true, "cedar-owner", false, false, 0)).toBe("empty");
    expect(eventListState(true, "cedar-owner", false, true, 0)).toBe("error");
    expect(eventListState(true, "cedar-owner", true, false, 0)).toBe("loading");
    expect(eventListState(false, null, false, false, 0)).toBe("loading");
    expect(eventListState(true, null, true, false, 0)).toBe("signed-out");
    expect(eventListState(true, "cedar-owner", false, false, 1)).toBe("ready");
  });
});

describe("Saved events persistence (mock client only)", () => {
  it("selects summary data newest updated first", async () => {
    const row = fixture();
    mocks.order.mockResolvedValue({ data: [{ id: row.id, title: row.title, owner_id: row.ownerId, updated_at: row.updatedAt, event_meta: row.eventMeta, ops: row.ops }], error: null });
    expect(await listSavedEvents()).toEqual([row]);
    expect(mocks.select).toHaveBeenCalledWith("id, title, owner_id, updated_at, event_meta, ops");
    expect(mocks.order).toHaveBeenCalledWith("updated_at", { ascending: false });
  });
  it("returns an empty list for no stored rows", async () => {
    mocks.order.mockResolvedValue({ data: [], error: null });
    expect(await listSavedEvents()).toEqual([]);
  });
  it("propagates read errors for Retry rather than showing an empty list", async () => {
    mocks.order.mockResolvedValue({ data: null, error: new Error("Mock unavailable") });
    await expect(listSavedEvents()).rejects.toThrow("Mock unavailable");
  });
  it("duplicates via insert with a fresh id and no inherited ownership", async () => {
    const row = fixture();
    mocks.single.mockResolvedValueOnce({ data: { id: row.id, title: row.title, event_meta: row.eventMeta, ops: row.ops, updated_at: row.updatedAt }, error: null }).mockResolvedValueOnce({ data: { id: "new-cedar-id" }, error: null });
    expect(await duplicateSavedEvent(row.id)).toBe("new-cedar-id");
    expect(mocks.insert).toHaveBeenCalledWith({ id: expect.any(String), title: "Cedar Science Forum (copy)", event_meta: { ...row.eventMeta, name: "Cedar Science Forum (copy)" }, ops: row.ops });
    const payload: Record<string, unknown> | undefined = mocks.insert.mock.calls[0]?.[0];
    expect(payload?.["id"]).not.toBe(row.id);
    expect(payload).not.toHaveProperty("owner_id");
  });
  it("does not insert when loading the source fails", async () => {
    mocks.single.mockResolvedValue({ data: null, error: new Error("Mock denied") });
    await expect(duplicateSavedEvent("cedar-event")).rejects.toThrow("Mock denied");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("targets only the confirmed id for deletion", async () => {
    mocks.eq.mockResolvedValue({ error: null });
    await deleteSavedEvent("cedar-event");
    expect(mocks.delete).toHaveBeenCalledOnce();
    expect(mocks.eq).toHaveBeenCalledWith("id", "cedar-event");
  });
});
