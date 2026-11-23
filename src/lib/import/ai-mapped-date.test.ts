import { describe, expect, it } from "vitest";
import { MappedEventSchema } from "../excel-import.functions";
import { mappedEventToEventData, type ParsedWorkbook } from "../excel-io";
import { createReviewDraft, reviewReducer, reviewToEventData } from "./review-draft";
import { importWarnings } from "./warnings";

const workbook: ParsedWorkbook = {
  fileName: "Invented Forum.docx",
  sheets: [{ name: "Document", rows: [["09:00–09:30 Opening Remarks"]] }],
};

const mapped = () => MappedEventSchema.parse({
  name: "Invented Forum",
  sessions: [{ title: "Opening Remarks", startTime: "09:00", durationMin: 30 }],
  breaks: [],
  confidence: { overall: 0.7 },
});

describe("AI-mapped agendas with missing dates", () => {
  it("defaults an omitted date to an empty string", () => {
    expect(mapped().date).toBe("");
  });

  it("converts an empty date without crashing or inventing a date", () => {
    const event = mappedEventToEventData(mapped());
    expect(event.date).toBe("");
    expect(event.sessions[0]).toMatchObject({ title: "Opening Remarks", startTime: "09:00", durationMin: 30 });
  });

  it("produces the existing missing-date warning while allowing creation", () => {
    const draft = createReviewDraft(mapped(), workbook);
    expect(draft.year).toBe("");
    expect(importWarnings(draft, workbook).map(w => w.code)).toContain("unknown-date");
    expect(importWarnings(draft, workbook).map(w => w.code)).toContain("unknown-year");
    expect(reviewToEventData(draft)).toMatchObject({ date: "", name: "Invented Forum" });
  });

  it("uses the date and row edits from review on creation", () => {
    let draft = createReviewDraft(mapped(), workbook);
    draft = reviewReducer(draft, { type: "event", patch: { date: "2026-12-02" } });
    draft = reviewReducer(draft, { type: "year", value: "2026" });
    draft = reviewReducer(draft, { type: "session", index: 0, patch: { title: "Edited remarks" } });
    const event = reviewToEventData(draft);
    expect(event.date).toBe("2026-12-02");
    expect(event.sessions[0]?.title).toBe("Edited remarks");
    expect(importWarnings(draft, workbook).some(w => w.code === "unknown-date" || w.code === "unknown-year")).toBe(false);
  });
});