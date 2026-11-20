import { describe, it, expect } from "vitest";
import { seedEvent } from "@/components/event-context";
import { addPart, cleanHosts, eventDayCount } from "@/lib/parts-edit";
import { resolveOps } from "@/lib/event-migrate";
import { groupItemsByPart, labelledItemTitle, labelTimelineParts, partAssignmentsBrief } from "@/lib/part-presentation";
import { sortItems, buildBands, deriveSetupBlocks } from "@/lib/ops-schedule";
import { buildTimeline } from "@/lib/run-of-show";
import { fromMin } from "@/lib/event-model";

const event = () => {
  const e = addPart(addPart(seedEvent, "other", "b"), "other", "a");
  return { ...e, sessions: e.sessions.map((s,i) => i === 0 ? { ...s, partId: "part-a" } : s) };
};
describe("part presentation and setup review fixes", () => {
  it("groups in stored part order, Main first, items chronological", () => {
    const ops = resolveOps(event());
    const groups = groupItemsByPart(ops);
    expect(groups.map(g => g.part.id)).toEqual(["part-main", "part-b", "part-a"]);
    expect(groups[2].items.some(i => i.id === seedEvent.sessions[0].id)).toBe(true);
    expect(groups.flatMap(g => g.items)).toHaveLength(ops.items.length);
  });
  it("phone items sort by day then time across parts, not group order", () => {
    const ops = resolveOps(event());
    const base = ops.items[0];
    const rows = sortItems([{ ...base, id: "late", day: 2, start: "08:00", partId: "part-main" }, { ...base, id: "early", day: 1, start: "10:00", partId: "part-a" }, { ...base, id: "first", day: 1, start: "09:00", partId: "part-b" }]);
    expect(rows.map(i => i.id)).toEqual(["first", "early", "late"]);
  });
  it("export titles label non-main sessions and breaks only", () => {
    const e = event();
    expect(labelledItemTitle(e, { partId: "part-a" }, "Session A")).toBe("Session A · Part: Other part");
    expect(labelledItemTitle(e, { partId: "part-b" }, "Break A")).toBe("Break A · Part: Other part");
    expect(labelledItemTitle(e, {}, "Main session")).toBe("Main session");
  });
  it("briefing timeline labels exact matches, never guesses ambiguous cross-day rows", () => {
    const e = event(); const s = e.sessions[0];
    const row = { time: s.startTime, durationMin: s.durationMin, kind: "session" as const, title: s.title, cues: [] };
    expect(labelTimelineParts(e, [row])[0].subtitle).toBe("Part: Other part");
    const ambiguous = { ...e, sessions: [...e.sessions, { ...s, id: "another", day: 9, partId: undefined }] };
    expect(labelTimelineParts(ambiguous, [row])[0]).toEqual(row);
    expect(labelTimelineParts(seedEvent, [row])[0]).toEqual(row);
    expect(partAssignmentsBrief(e)).toContain(`${s.title} | Part: Other part`);
    expect(partAssignmentsBrief(seedEvent)).toBeUndefined();
  });
  it("Other starts at 09:00; blank starts never produce NaN in schedule or ops", () => {
    expect(addPart(seedEvent, "other", "x").components?.[0].startTime).toBe("09:00");
    const e = { ...seedEvent, sessions: [{ ...seedEvent.sessions[0], startTime: "" }] };
    const ops = resolveOps(e);
    const result = JSON.stringify([buildTimeline(e), ops, buildBands(ops.items), deriveSetupBlocks(ops)]);
    expect(result).not.toContain("NaN");
    expect(ops.items.find(i => i.id === e.sessions[0].id)?.start).toBe("");
    expect(fromMin(Number.NaN)).toBe("");
  });
  it("hosts are trimmed and empty entries dropped", () => {
    expect(cleanHosts("  Host A, , Host B  ,")).toEqual(["Host A", "Host B"]);
    expect(cleanHosts(" , ")).toEqual([]);
  });
  it("day choices use event duration only", () => {
    expect(eventDayCount("2026-12-01", "2026-12-03")).toBe(3);
    expect(eventDayCount("2026-12-01")).toBe(1);
    expect(eventDayCount("", "")).toBe(1);
  });
});