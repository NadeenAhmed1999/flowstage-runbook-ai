import { describe, expect, it } from "vitest";
import { parseWorkbookFile } from "../excel-io";
import { parseAgendaWorkbook } from "./agenda-parse";
import { masterPlanFile } from "./master-plan-fixture.testutil";
import { createReviewDraft, reviewReducer, reviewToEventData } from "./review-draft";
import { importWarnings, normalizeSpeakerName, readSubSheetWindows } from "./warnings";
import { componentPartId, MAIN_PART_ID, migrateOps, withParts } from "../event-parts";
import { resolveOps } from "../event-migrate";

async function fixture() {
  const workbook = await parseWorkbookFile(masterPlanFile());
  const parsed = parseAgendaWorkbook(workbook.fileName, workbook.sheets);
  if (!parsed) throw new Error("Invented agenda missing");
  return { workbook, draft: createReviewDraft(parsed.mapped, workbook) };
}

describe("import part proposals and reducer", () => {
  it("proposes opening, awards and registration groups from the 28-sheet invented agenda", async () => {
    const { workbook, draft } = await fixture();
    expect(workbook.sheets).toHaveLength(28);
    expect(draft.parts.map(part => [part.name, part.kind, part.accepted])).toEqual([
      ["Registration & networking", "networking-reception", true], ["Opening ceremony", "opening-ceremony", true], ["Awards ceremony", "awards-ceremony", true],
    ]);
    const event = reviewToEventData(draft);
    expect(event.components?.find(part => part.kind === "opening-ceremony")).toMatchObject({ day: 1, startTime: "10:30", endTime: "11:30", durationMin: 60 });
    expect(event.sessions.filter(row => row.partId === componentPartId(draft.parts[1]?.id ?? ""))).toHaveLength(3);
  });
  it("proposes no parts for a one-part simple import", () => {
    const workbook = { fileName: "Invented.xlsx", sheets: [{ name: "Agenda", rows: [["Title", "Start", "Duration"], ["Opening ceremony", "09:00", 30], ["Panel", "10:00", 45]] }] };
    const parsed = parseAgendaWorkbook(workbook.fileName, workbook.sheets);
    if (!parsed) throw new Error("Simple agenda missing");
    const draft = createReviewDraft(parsed.mapped, workbook);
    expect(draft.parts).toEqual([]);
    expect(reviewToEventData(draft).components).toEqual([]);
    expect(resolveOps(reviewToEventData(draft)).parts).toHaveLength(1);
  });
  it("splits groups at intervening rows, day changes or space changes", () => {
    const workbook = { fileName: "Invented.xlsx", sheets: [{ name: "Agenda", rows: [["Title", "Start", "Duration", "Day", "Space"], ["Anthem", "09:00", 10, 1, "Hall A"], ["Panel", "09:10", 30, 1, "Hall A"], ["Welcome address", "09:40", 10, 1, "Hall A"], ["Opening video", "09:50", 10, 1, "Hall B"], ["Opening address", "10:00", 10, 2, "Hall B"]] }] };
    const parsed = parseAgendaWorkbook(workbook.fileName, workbook.sheets);
    if (!parsed) throw new Error("Agenda missing");
    expect(createReviewDraft(parsed.mapped, workbook).parts).toHaveLength(4);
  });
  it("uses ceremony formats when row titles alone do not identify a group", () => {
    const workbook = { fileName: "Invented.xlsx", sheets: [{ name: "Agenda", rows: [["Title", "Start", "Duration", "Day", "Space", "Format"], ["Stage welcome", "09:00", 15, 1, "Hall A", "Opening ceremony"], ["Stage presentation", "10:00", 30, 1, "Hall A", "Awards ceremony"]] }] };
    const parsed = parseAgendaWorkbook(workbook.fileName, workbook.sheets);
    if (!parsed) throw new Error("Agenda missing");
    expect(createReviewDraft(parsed.mapped, workbook).parts.map(part => part.kind)).toEqual(["opening-ceremony", "awards-ceremony"]);
  });
  it("Accept off excludes a component and returns created rows to Main programme; Accept on restores assignments", async () => {
    let { draft } = await fixture();
    const part = draft.parts[1];
    if (!part) throw new Error("Opening part missing");
    draft = reviewReducer(draft, { type: "part", id: part.id, patch: { accepted: false } });
    expect(reviewToEventData(draft).components?.some(c => c.id === part.id)).toBe(false);
    expect(reviewToEventData(draft).sessions.some(s => s.partId === componentPartId(part.id))).toBe(false);
    draft = reviewReducer(draft, { type: "part", id: part.id, patch: { accepted: true } });
    expect(reviewToEventData(draft).sessions.filter(s => s.partId === componentPartId(part.id))).toHaveLength(3);
  });
  it("delayed rename and kind changes reach the created component", async () => {
    let { draft } = await fixture();
    const part = draft.parts[1];
    if (!part) throw new Error("Opening part missing");
    for (const name of ["W", "Wi", "Willow welcome"]) draft = reviewReducer(draft, { type: "part", id: part.id, patch: { name } });
    draft = reviewReducer(draft, { type: "part", id: part.id, patch: { kind: "other" } });
    expect(reviewToEventData(draft).components?.find(c => c.id === part.id)).toMatchObject({ name: "Willow welcome", kind: "other", startTime: "10:30", endTime: "11:30" });
  });
  it("moving session and break rows updates assignments and derived part window", async () => {
    let { draft } = await fixture();
    const part = draft.parts[1];
    if (!part) throw new Error("Opening part missing");
    draft = reviewReducer(draft, { type: "move-row", kind: "sessions", index: 0, partId: MAIN_PART_ID });
    draft = reviewReducer(draft, { type: "move-row", kind: "breaks", index: 0, partId: componentPartId(part.id) });
    const event = reviewToEventData(draft);
    expect(event.sessions[0]?.partId).toBeUndefined();
    expect(event.breaks[0]?.partId).toBe(componentPartId(part.id));
    expect(event.components?.find(c => c.id === part.id)).toMatchObject({ startTime: "09:00", endTime: "11:30", durationMin: 150 });
  });
  it("deleting a proposed part returns all its rows to Main programme without deleting agenda rows", async () => {
    let { draft } = await fixture();
    const part = draft.parts[1];
    if (!part) throw new Error("Opening part missing");
    draft = reviewReducer(draft, { type: "delete-part", id: part.id });
    expect(draft.event.sessions.slice(0, 3).map(row => row.partId)).toEqual([MAIN_PART_ID, MAIN_PART_ID, MAIN_PART_ID]);
    expect(reviewToEventData(draft).sessions).toHaveLength(8);
    expect(reviewToEventData(draft).components).toHaveLength(2);
  });
  it("created components and assignments survive migrateOps/withParts round trip", async () => {
    const { draft } = await fixture();
    const event = reviewToEventData(draft);
    const ops = resolveOps(event);
    const roundTrip = withParts(migrateOps(ops, event.components), event.components);
    expect(roundTrip.parts.map(part => part.id)).toEqual(ops.parts.map(part => part.id));
    expect(roundTrip.items.map(row => row.partId)).toEqual(ops.items.map(row => row.partId));
    expect(roundTrip.parts).toHaveLength(4);
  });
});

describe("non-blocking import warnings", () => {
  it("detects ceremony time mismatch with both windows and affected row targets", async () => {
    const { workbook, draft } = await fixture();
    const warning = importWarnings(draft, workbook).find(w => w.code === "sheet-time");
    expect(warning?.message).toContain("Agenda: 10:30-11:30, 'Opening ceremony' sheet: 11:00-11:30");
    expect(warning?.possible).toBe(false);
    expect(warning?.rows.map(row => row.id)).toEqual(["import-sessions-0", "import-sessions-1", "import-sessions-2"]);
  });
  it("reads spaced ranges, compact ranges and starts; ignores unrelated and empty sheets", () => {
    const workbook = { fileName: "Invented.xlsx", sheets: [
      { name: "Compact", rows: [["Time", "Item"], ["11:00-11:30", "Anthem"]] },
      { name: "Spaced", rows: [["Time", "Item"], ["11:00 - 11:30", "Anthem"]] },
      { name: "Starts", rows: [["Time", "Item"], ["11:00", "Doors"], ["11:30", "End"]] },
      { name: "Notes", rows: [["Name", "Notes"], ["11:00", "Anthem"]] }, { name: "Empty", rows: [["Time", "Item"]] },
    ] };
    expect(readSubSheetWindows(workbook).map(w => [w.sheet, w.start, w.end])).toEqual([["Compact", "11:00", "11:30"], ["Spaced", "11:00", "11:30"], ["Starts", "11:00", "11:30"]]);
  });
  it("labels title-only or ambiguous matches as possible conflicts", async () => {
    const { workbook, draft } = await fixture();
    workbook.sheets = [{ name: "Stage cues", rows: [["Time", "Item"], ["11:00 - 11:30", "Anthem"]] }];
    const warning = importWarnings(draft, workbook).find(w => w.code === "sheet-time");
    expect(warning?.possible).toBe(true);
    expect(warning?.message).toContain("Possible conflict");
  });
  it("detects overlap only on the same day and known space", async () => {
    let { workbook, draft } = await fixture();
    expect(importWarnings(draft, workbook).filter(w => w.code === "overlap")).toHaveLength(2);
    draft = reviewReducer(draft, { type: "session", index: 1, patch: { room: "Hall B" } });
    draft = reviewReducer(draft, { type: "session", index: 2, patch: { day: 2 } });
    expect(importWarnings(draft, workbook).filter(w => w.code === "overlap")).toHaveLength(0);
  });
  it("detects duplicate speaker names after accents, punctuation and Dr. are stripped", async () => {
    let { workbook, draft } = await fixture();
    expect(normalizeSpeakerName("Dr. Dána Ex-ample")).toBe(normalizeSpeakerName("Dana Example"));
    draft = reviewReducer(draft, { type: "event", patch: { speakers: [...draft.event.speakers, { name: "Dr. Dána Ex-ample", role: "Invented" }] } });
    const warning = importWarnings(draft, workbook).find(w => w.code === "duplicate-speaker");
    expect(warning?.message).toContain("Dana Example / Dr. Dána Ex-ample");
    expect(warning?.rows.some(row => row.id === "import-sessions-2")).toBe(true);
  });
  it("does not strip Dr from a person's actual name or collapse unrelated non-Latin names", () => {
    expect(normalizeSpeakerName("Drake Willow")).toBe("drakewillow");
    expect(normalizeSpeakerName("Лена")).not.toBe(normalizeSpeakerName("Анна"));
  });
  it("detects exact non-ceremony sheet/title matches without inventing a proposed part", async () => {
    const { workbook, draft } = await fixture();
    workbook.sheets = [{ name: "Future of Care Panel", rows: [["Time", "Item"], ["12:00 - 12:45", "Discussion"]] }];
    const warning = importWarnings(draft, workbook).find(w => w.code === "sheet-time");
    expect(warning?.message).toContain("Agenda: 11:45-12:30, 'Future of Care Panel' sheet: 12:00-12:45");
    expect(warning?.possible).toBe(false);
    expect(warning?.rows[0]?.id).toBe("import-sessions-3");
  });
  it("rejects impossible calendar dates", async () => {
    const { workbook, draft } = await fixture();
    const changed = reviewReducer(draft, { type: "event", patch: { date: "2026-02-30" } });
    expect(importWarnings(changed, workbook).some(w => w.code === "unknown-date")).toBe(true);
  });
  it("reports inferred duration until the user supplies a duration", async () => {
    const { workbook, draft } = await fixture();
    const unknown = reviewReducer(draft, { type: "session", index: 0, patch: { durationSource: "inferred" } });
    expect(importWarnings(unknown, workbook).some(w => w.code === "duration")).toBe(true);
    const supplied = reviewReducer(unknown, { type: "session", index: 0, patch: { durationSource: "provided", durationMin: 10 } });
    expect(importWarnings(supplied, workbook).some(w => w.code === "duration")).toBe(false);
  });
  it("warns about unknown year/date, missing time and missing duration without blocking creation", async () => {
    let { workbook, draft } = await fixture();
    draft = reviewReducer(draft, { type: "year", value: "" });
    draft = reviewReducer(draft, { type: "event", patch: { date: "", endDate: "" } });
    draft = reviewReducer(draft, { type: "session", index: 0, patch: { startTime: "", durationMin: 0 } });
    const before = JSON.stringify(draft);
    const warnings = importWarnings(draft, workbook);
    expect(warnings.map(w => w.code)).toEqual(expect.arrayContaining(["unknown-year", "unknown-date", "missing-time", "duration"]));
    expect(warnings.every(w => w.rows.length > 0)).toBe(true);
    expect(JSON.stringify(draft)).toBe(before);
    expect(reviewToEventData(draft).sessions[0]).toMatchObject({ startTime: "", durationMin: 0 });
    expect(reviewToEventData(draft).components).toHaveLength(3);
  });
  it("clearing proposals does not hide the source ceremony mismatch", async () => {
    let { workbook, draft } = await fixture();
    for (const part of draft.parts) draft = reviewReducer(draft, { type: "delete-part", id: part.id });
    expect(importWarnings(draft, workbook).some(w => w.code === "sheet-time")).toBe(true);
  });
});