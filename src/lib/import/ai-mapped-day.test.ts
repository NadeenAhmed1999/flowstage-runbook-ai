import { describe, expect, it, vi } from "vitest";

const replies: string[] = [];
vi.mock("ai", () => ({ generateText: vi.fn(async () => ({ text: replies.shift() ?? "{}" })) }));

import { generateValidatedJSON } from "../ai-json.server";
import { AiFallbackLenientSchema, AiFallbackMappedEventSchema } from "../excel-import.functions";
import type { ParsedWorkbook } from "../excel-io";
import { createReviewDraft, reviewReducer, reviewToEventData } from "./review-draft";
import { importWarnings } from "./warnings";

const workbook: ParsedWorkbook = { fileName: "Invented Summit.docx", sheets: [{ name: "Document", rows: [["Wednesday, 02 December 2026"]] }] };
const raw = (breakDay?: number) => ({
  name: "Invented Summit", date: "2026-12-01", endDate: "2026-12-03",
  sessions: [{ title: "Opening Remarks", startTime: "09:00", durationMin: 30, day: 2 }, { title: "Closing Panel", startTime: "15:00", durationMin: 45, day: 3 }],
  breaks: [{ label: "Lunch", startTime: "12:15", durationMin: 45, ...(breakDay ? { day: breakDay } : {}) }, { label: "Coffee", startTime: "10:15", durationMin: 45, day: 3 }],
  confidence: { overall: 0.7 },
});
const run = () => generateValidatedJSON({ model: {} as never, schema: AiFallbackMappedEventSchema, fallbackSchema: AiFallbackLenientSchema, system: "s", prompt: "p", repairInstructions: "r", label: "excel-import-mapping" });

describe("AI fallback break/component days", () => {
  it("rejects a break or component without day instead of defaulting to Day 1", () => {
    expect(AiFallbackMappedEventSchema.safeParse(raw()).success).toBe(false);
    expect(AiFallbackMappedEventSchema.safeParse({ ...raw(2), components: [{ name: "Gala", startTime: "19:00" }] }).success).toBe(false);
    expect(AiFallbackMappedEventSchema.parse(raw(2)).breaks.map(b => b.day)).toEqual([2, 3]);
  });

  it("retries when day is missing and uses the corrected answer", async () => {
    replies.splice(0, replies.length, JSON.stringify(raw()), JSON.stringify(raw(2)));
    const result = await run();
    expect(result.breaks.map(b => b.day)).toEqual([2, 3]);
    expect(result.breaks.some(b => b.dayMissing)).toBe(false);
  });

  it("keeps the row and flags it when day is still missing after the final retry", async () => {
    replies.splice(0, replies.length, JSON.stringify(raw()), JSON.stringify(raw()), JSON.stringify(raw()));
    const result = await run();
    expect(result.breaks[0]).toMatchObject({ label: "Lunch", day: 1, dayMissing: true });
    const draft = createReviewDraft(result, workbook);
    expect(importWarnings(draft, workbook).filter(w => w.code === "missing-day").map(w => w.message)).toEqual(["Day not supplied — shown on Day 1; check the day"]);
    expect(reviewToEventData(draft).breaks).toHaveLength(2);
  });

  it("warns when a day has breaks but no sessions, without blocking creation", () => {
    const draft = createReviewDraft(AiFallbackMappedEventSchema.parse({ ...raw(2), breaks: [{ label: "Lunch", startTime: "12:15", durationMin: 45, day: 1 }] }), workbook);
    const warnings = importWarnings(draft, workbook).filter(w => w.code === "breaks-only-day");
    expect(warnings.map(w => w.message)).toEqual(["Day 1 has breaks but no sessions"]);
    expect(reviewToEventData(draft).breaks).toHaveLength(1);
    expect(importWarnings(createReviewDraft(AiFallbackMappedEventSchema.parse(raw(2)), workbook), workbook).some(w => w.code === "breaks-only-day")).toBe(false);
  });

  it("keeps break days through review edits and event conversion", () => {
    let draft = createReviewDraft(AiFallbackMappedEventSchema.parse(raw(2)), workbook);
    draft = reviewReducer(draft, { type: "break", index: 1, patch: { durationMin: 30 } });
    const event = reviewToEventData(draft);
    expect(event.breaks.map(b => [b.label, b.day, b.startTime])).toEqual([["Lunch", 2, "12:15"], ["Coffee", 3, "10:15"]]);
    expect(event.sessions.map(s => s.day)).toEqual([2, 3]);
  });
});
