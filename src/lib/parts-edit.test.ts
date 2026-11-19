import { describe, it, expect } from "vitest";
import { seedEvent } from "@/components/event-context";
import {
  addPart,
  editPart,
  renameMainPart,
  reorderPart,
  deletePart,
  partItemCounts,
} from "@/lib/parts-edit";
import { componentPartId, MAIN_PART_ID } from "@/lib/event-parts";
import { resolveOps, opsToLegacy } from "@/lib/event-migrate";
import { eventFromSaved, pickEventMeta } from "@/lib/event-persist";
import { promptFor } from "@/lib/prompt-input.testutil";

const linked = () => {
  const e = addPart(seedEvent, "other", "custom");
  return {
    ...e,
    sessions: e.sessions.map((s, i) => (i === 0 ? { ...s, partId: componentPartId("custom") } : s)),
    breaks: e.breaks.map((b, i) => (i === 0 ? { ...b, partId: componentPartId("custom") } : b)),
  };
};
describe("setup parts mutations", () => {
  it("adds, renames and reorders parts without moving Main programme", () => {
    const added = addPart(addPart(seedEvent, "other", "a"), "gala-dinner", "b");
    const renamed = editPart(added, "a", { name: "Workshop group" });
    const reordered = reorderPart(renamed, 1, 0);
    expect(reordered.components?.map((c) => c.id)).toEqual(["b", "a"]);
    expect(reordered.components?.[1].name).toBe("Workshop group");
    expect(resolveOps(reordered).parts.map((p) => p.id)).toEqual([
      MAIN_PART_ID,
      "part-b",
      "part-a",
    ]);
  });
  it("renames Main programme while leaving legacy output and AI prompt unchanged", () => {
    const renamed = renameMainPart(seedEvent, "Conference programme");
    expect(resolveOps(renamed).parts[0].name).toBe("Conference programme");
    expect(opsToLegacy(resolveOps(renamed))).toEqual(opsToLegacy(resolveOps(seedEvent)));
    expect(promptFor(renamed)).toBe(promptFor(seedEvent));
    const changed = {
      ...renamed,
      sessions: renamed.sessions.map((s, i) => (i === 0 ? { ...s, startTime: "08:10" } : s)),
    };
    expect(resolveOps(changed).parts[0].name).toBe("Conference programme");
  });
  it("requires a choice for populated parts and moves sessions and breaks to Main programme", () => {
    const e = linked();
    expect(partItemCounts(e, "custom")).toEqual({ sessions: 1, breaks: 1 });
    expect(deletePart(e, "custom")).toBe(e);
    const moved = deletePart(e, "custom", "move");
    expect(moved.components).toEqual([]);
    expect(moved.sessions).toEqual(seedEvent.sessions);
    expect(moved.breaks).toEqual(seedEvent.breaks);
    expect(resolveOps(moved).items.every((i) => i.partId === MAIN_PART_ID)).toBe(true);
  });
  it("deletes only the selected part's sessions and breaks when confirmed", () => {
    const e = linked();
    const deleted = deletePart(e, "custom", "delete");
    expect(deleted.sessions.map((s) => s.id)).toEqual(seedEvent.sessions.slice(1).map((s) => s.id));
    expect(deleted.breaks.map((b) => b.id)).toEqual(seedEvent.breaks.slice(1).map((b) => b.id));
    expect(
      resolveOps(deleted).items.some(
        (i) => i.id === e.sessions[0].id || i.id === e.breaks[0].id || i.id === "custom",
      ),
    ).toBe(false);
  });
  it("deletes an empty part without requiring a choice", () => {
    const e = addPart(seedEvent, "other", "empty");
    expect(partItemCounts(e, "empty")).toEqual({ sessions: 0, breaks: 0 });
    expect(deletePart(e, "empty").components).toEqual([]);
    expect(deletePart(e, "empty").sessions).toEqual(e.sessions);
  });
  it("other kind works through editing, ops, saved roundtrip and AI", () => {
    const e = editPart(linked(), "custom", {
      name: "Working group",
      day: 2,
      startTime: "14:00",
      endTime: "15:00",
      track: "Group A",
      venue: "Meeting room",
      hosts: ["Host A"],
      notes: "Bring notes",
      operationalRequirements: {
        av: ["Display"],
        staffing: ["Facilitator"],
        protocol: ["Guest list"],
      },
    });
    const ops = resolveOps(e);
    expect(ops.parts.find((p) => p.id === "part-custom")).toMatchObject({
      kind: "other",
      name: "Working group",
      day: 2,
      start: "14:00",
      end: "15:00",
      track: "Group A",
      venue: "Meeting room",
      hosts: ["Host A"],
      notes: "Bring notes",
      checklists: { av: ["Display"], staffing: ["Facilitator"], protocol: ["Guest list"] },
    });
    const restored = eventFromSaved(pickEventMeta(e), ops);
    expect(restored.components?.[0].kind).toBe("other");
    expect(restored.sessions[0].partId).toBe("part-custom");
    expect(promptFor({ ...e, ops })).toContain("Part: Working group");
  });
});
