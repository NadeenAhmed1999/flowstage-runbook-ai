import { describe, expect, it } from "vitest";
import { parseAgendaWorkbook } from "./agenda-parse";
import { createReviewDraft, reviewReducer, reviewToEventData } from "./review-draft";
import { resolveOps } from "../event-migrate";

function draft() {
  const parsed = parseAgendaWorkbook("Invented Forum.xlsx", [{ name: "Agenda", rows: [
    ["Title", "Start", "Duration", "Date", "DAY", "SPEAKER 1", "SPEAKER 2", "MODERATOR", "FORMAT"],
    ["First session", "09:00", 30, "November 29th", 1, "Host Example, Director", "Duplicate Example, Lead", "Chair Example, Editor", "Panel"],
    ["Second session", "10:00", 30, "November 30th", 2, "Duplicate Example, Lead", "", "Chair Example, Editor", "Keynote"],
    ["Coffee break", "10:30", 15, "November 30th", 2],
  ] }]);
  if (!parsed) throw new Error("Missing test agenda");
  return createReviewDraft(parsed.mapped);
}

describe("edited import conversion", () => {
  it("keeps zero duration and unspecified AV instead of substituting defaults", () => {
    let d = reviewReducer(draft(), { type: "session", index: 0, patch: { durationMin: 0 } });
    d = reviewReducer(d, { type: "break", index: 0, patch: { durationMin: 0 } });
    const e = reviewToEventData(d);
    expect(e.sessions[0]?.durationMin).toBe(0);
    expect(e.breaks[0]?.durationMin).toBe(0);
    expect(e.avRequirements).toBe("");
  });
  it("rename and start edits reach the created event", () => {
    let d = draft();
    d = reviewReducer(d, { type: "session", index: 0, patch: { title: "Edited title", startTime: "09:45", sessionType: "Workshop" } });
    const e = reviewToEventData(d);
    expect(e.sessions[0]).toMatchObject({ title: "Edited title", startTime: "09:45" });
    expect(e.sessions[0]?.description).toContain("Format: Workshop");
    expect(e.sessions[0]?.description).not.toContain("Format: Panel");
  });
  it("delete and add session rows reach the created event", () => {
    let d = reviewReducer(draft(), { type: "delete", kind: "sessions", index: 0 });
    d = reviewReducer(d, { type: "add", kind: "sessions" });
    d = reviewReducer(d, { type: "session", index: 1, patch: { title: "Added session", startTime: "14:00", day: 2, durationMin: 45 } });
    const e = reviewToEventData(d);
    expect(e.sessions.map(s => s.title)).toEqual(["Second session", "Added session"]);
    expect(e.sessions[1]).toMatchObject({ day: 2, startTime: "14:00", durationMin: 45 });
  });
  it("break edits, delete and add reach the created event", () => {
    let d = reviewReducer(draft(), { type: "delete", kind: "breaks", index: 0 });
    d = reviewReducer(d, { type: "add", kind: "breaks" });
    d = reviewReducer(d, { type: "break", index: 0, patch: { label: "Edited lunch", day: 2, startTime: "13:00", durationMin: 60 } });
    expect(reviewToEventData(d).breaks[0]).toMatchObject({ label: "Edited lunch", day: 2, startTime: "13:00", durationMin: 60 });
  });
  it("speaker merge rewrites all session references", () => {
    const d = reviewReducer(draft(), { type: "merge", kind: "speakers", index: 1, target: 0 });
    const e = reviewToEventData(d);
    expect(e.speakers).toHaveLength(1);
    expect(e.sessions.map(s => s.speakerIds)).toEqual([[e.speakers[0]?.id], [e.speakers[0]?.id]]);
  });
  it("roster name and role edits rewrite speaker and moderator references", () => {
    let d = reviewReducer(draft(), { type: "person", kind: "speakers", index: 0, patch: { name: "Renamed Speaker", role: "New role" } });
    d = reviewReducer(d, { type: "person", kind: "moderators", index: 0, patch: { name: "Renamed Chair", role: "New chair role" } });
    const e = reviewToEventData(d);
    expect(e.speakers[0]).toMatchObject({ name: "Renamed Speaker", role: "New role" });
    expect(e.moderators[0]).toMatchObject({ name: "Renamed Chair", role: "New chair role" });
    expect(e.sessions[0]?.moderatorIds).toEqual([e.moderators[0]?.id]);
    expect(e.sessions[0]?.speakerIds).toContain(e.speakers[0]?.id);
  });
  it("keystroke year entry fills previously unknown start and end dates", () => {
    let d = draft();
    expect(d.event.date).toBe("");
    for (const value of ["2", "20", "202", "2027"]) d = reviewReducer(d, { type: "year", value });
    expect(reviewToEventData(d)).toMatchObject({ date: "2027-11-29", endDate: "2027-11-30" });
  });
  it("moderator merge deduplicates and rewrites references", () => {
    let d = reviewReducer(draft(), { type: "add-person", kind: "moderators" });
    d = reviewReducer(d, { type: "person", kind: "moderators", index: 1, patch: { name: "Other Chair" } });
    d = reviewReducer(d, { type: "session", index: 0, patch: { moderators: ["Chair Example", "Other Chair"] } });
    d = reviewReducer(d, { type: "merge", kind: "moderators", index: 1, target: 0 });
    expect(d.event.sessions[0]?.moderators).toEqual(["Chair Example"]);
    expect(reviewToEventData(d).moderators).toHaveLength(1);
  });
  it("included sheet results are cached, removed and re-included without duplication", () => {
    let d = draft();
    const mapped = structuredClone(d.event);
    mapped.sessions = [mapped.sessions[0]];
    mapped.breaks = [];
    d = reviewReducer(d, { type: "sheet", name: "Extra", included: true, mapped });
    expect(d.event.sessions).toHaveLength(3);
    d = reviewReducer(d, { type: "sheet", name: "Extra", included: false });
    expect(d.event.sessions).toHaveLength(2);
    d = reviewReducer(d, { type: "sheet", name: "Extra", included: true });
    d = reviewReducer(d, { type: "sheet", name: "Extra", included: true });
    expect(d.event.sessions).toHaveLength(3);
    expect(d.sheets["Extra"]?.cached).toBeDefined();
  });
  it("edited import keeps the existing Main programme parts model", () => {
    const e = reviewToEventData(draft());
    const ops = resolveOps(e);
    expect(ops.version).toBe(2);
    expect(ops.parts).toHaveLength(1);
    expect(ops.items.every(i => i.partId === ops.parts[0]?.id)).toBe(true);
  });
});
