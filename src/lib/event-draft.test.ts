import { describe, expect, it } from "vitest";
import { seedEvent, type EventData } from "@/components/event-context";
import { backupFilename, backupJson, parseBackup, parseDraft, serializeDraft, snapshotOf } from "@/lib/event-draft";
import { assertRowsUpdated, SAVE_FAILED_MESSAGE } from "@/lib/event-store";

const edited: EventData = { ...seedEvent, name: "Lakeside Product Forum", date: "2031-04-02" };

describe("device draft", () => {
  it("round-trips an edited event with its saved link", () => {
    const d = parseDraft(serializeDraft(edited, "row-123"));
    expect(d?.savedId).toBe("row-123");
    expect(d && snapshotOf(d.event)).toBe(snapshotOf(edited));
    expect(d?.event.name).toBe("Lakeside Product Forum");
  });
  it("ignores missing, corrupt, wrong-shape and seed-identical drafts", () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft("{not json")).toBeNull();
    expect(parseDraft(JSON.stringify({ title: "x" }))).toBeNull();
    expect(parseDraft(serializeDraft(seedEvent, null))).toBeNull();
  });
});

describe("save result check", () => {
  it("treats zero updated rows as a failed save", () => {
    expect(() => assertRowsUpdated([])).toThrow(SAVE_FAILED_MESSAGE);
    expect(() => assertRowsUpdated(null)).toThrow(SAVE_FAILED_MESSAGE);
    expect(() => assertRowsUpdated([{ id: "a" }])).not.toThrow();
  });
});

describe("backup file", () => {
  it("exports and re-imports the same event", () => {
    expect(snapshotOf(parseBackup(backupJson(edited)))).toBe(snapshotOf(edited));
    expect(backupFilename(edited)).toBe("lakeside-product-forum-backup.json");
  });
  it("rejects bad files with a clear error", () => {
    expect(() => parseBackup("hello")).toThrow(/valid FlowStage backup/);
    expect(() => parseBackup(JSON.stringify({ title: "x", eventMeta: {}, ops: {} }))).toThrow(/valid FlowStage backup/);
  });
});
