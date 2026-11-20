import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { seedEvent } from "@/components/event-context";
import { buildEventWorkbook, parseWorkbookFile } from "../excel-io";
import { parseAgendaWorkbook } from "./agenda-parse";
import { cleanCell, formatToType, inferYear, parseDateText, parsePersonCell, parseTime } from "./values";
import { masterPlanFile } from "./master-plan-fixture.testutil";

describe("cell values", () => {
  it("cleans nbsp and treats nbsp-only cells as empty", () => {
    expect(cleanCell("\u00a0")).toBe("");
    expect(cleanCell(" \u00a0Main\u00a0Hall ")).toBe("Main Hall");
  });
  it("parses HH:MM:SS and HH:MM", () => {
    expect(parseTime("10:30:00")).toBe("10:30");
    expect(parseTime("9:05")).toBe("09:05");
    expect(parseTime("\u00a0")).toBeNull();
  });
  it("parses date text without a year and keeps the year unknown", () => {
    expect(parseDateText("November 29th")).toEqual({ year: null, month: 11, day: 29 });
  });
  it("infers the year from the file name, never guesses when absent or ambiguous", () => {
    expect(inferYear("Forum 2026 Master Plan", [])).toBe(2026);
    expect(inferYear("Master Plan", [])).toBeNull();
    expect(inferYear("Plan 2025 vs 2026", [])).toBeNull();
  });
  it("splits speaker cells and strips the moderator prefix", () => {
    expect(parsePersonCell("Lee Sample, Director, Contoso Clinics")).toEqual({ name: "Lee Sample", role: "Director, Contoso Clinics" });
    expect(parsePersonCell("Moderator: Sam Fictional, Editor")).toEqual({ name: "Sam Fictional", role: "Editor" });
  });
  it("maps FORMAT to session types", () => {
    expect(formatToType("Fireside Chat")).toBe("Fireside chat");
    expect(formatToType("MOU Signing")).toBe("MOU signing");
  });
});

describe("master plan workbook", () => {
  it("28-sheet file parses: header below title rows, durations, people, days, year", async () => {
    const wb = await parseWorkbookFile(masterPlanFile());
    expect(wb.sheets).toHaveLength(28);
    const draft = parseAgendaWorkbook(wb.fileName, wb.sheets);
    if (!draft) throw new Error("agenda not found");
    const m = draft.mapped;
    expect(draft.agendaSheet).toBe("AGENDA");
    expect(draft.skippedSheets).toHaveLength(27);
    expect(draft.year).toBe(2026);
    expect(m.date).toBe("2026-11-29");
    expect(m.endDate).toBe("2026-11-30");
    const ceremony = m.sessions.find(s => s.title.includes("Opening Ceremony"));
    expect(ceremony).toMatchObject({ startTime: "10:30", durationMin: 60, day: 1 });
    expect(m.sessions.find(s => s.title.startsWith("Fireside"))?.durationMin).toBe(40);
    const panel = m.sessions.find(s => s.title.includes("Panel"));
    expect(panel?.speakers).toEqual(["Lee Sample", "Ari Placeholder", "Dana Example"]);
    expect(panel?.moderators).toEqual(["Sam Fictional"]);
    expect(m.speakers.filter(p => p.name === "Dana Example")).toHaveLength(1);
    expect(m.breaks.map(b => b.label)).toEqual(["Registration & Networking", "Networking Break"]);
    expect(m.sessions.find(s => s.title === "Audience Survey")?.day).toBe(2);
  });
  it("asks for the year instead of guessing when the file name and title have none", async () => {
    const wb = await parseWorkbookFile(masterPlanFile("Master Plan.xlsx"));
    wb.sheets[0]!.rows[0] = ["Fictional Health Forum"];
    const draft = parseAgendaWorkbook(wb.fileName, wb.sheets);
    expect(draft?.year).toBeNull();
    expect(draft?.mapped.date).toBe("");
    expect(draft?.mapped.confidence.unclear.join(" ")).toMatch(/Year not found/);
  });
  it("our own Excel export still imports through the new path", async () => {
    const bytes = XLSX.write(buildEventWorkbook(seedEvent), { type: "array", bookType: "xlsx" });
    const wb = await parseWorkbookFile(new File([bytes], "export.xlsx"));
    const draft = parseAgendaWorkbook(wb.fileName, wb.sheets);
    expect(draft?.mapped.sessions.map(s => s.title)).toEqual(seedEvent.sessions.map(s => s.title));
    expect(draft?.mapped.breaks.map(b => b.label)).toEqual(seedEvent.breaks.map(b => b.label));
  });
  it("falls back (null) when no agenda header exists", () => {
    expect(parseAgendaWorkbook("notes.xlsx", [{ name: "Notes", rows: [["Hello"], ["World"]] }])).toBeNull();
  });
});


describe("review parser regressions", () => {
  it("accepts FORMAT (Panel/Open Mic/FS), MINs (duration) and DATE (day)", async () => {
    const wb = await parseWorkbookFile(masterPlanFile());
    const m = parseAgendaWorkbook(wb.fileName, wb.sheets)?.mapped;
    expect(m?.sessions.find(s => s.title === "Future of Care Panel")).toMatchObject({ sessionType: "Panel", durationMin: 45 });
    expect(m?.date).toBe("2026-11-29");
  });
  it("keeps MC as a session note, never a moderator", () => {
    const m = parseAgendaWorkbook("Invented.xlsx", [{ name: "Agenda", rows: [["Title", "Start", "MC", "Moderator"], ["Test session", "09:00", "MC: Host Example, Director", "Moderator: Chair Example"]] }])?.mapped;
    expect(m?.sessions[0]?.description).toContain("MC: Host Example");
    expect(m?.sessions[0]?.moderators).toEqual(["Chair Example"]);
    expect(m?.moderators.map(p => p.name)).toEqual(["Chair Example"]);
  });
  it("retains sessions and breaks with missing start times", () => {
    const m = parseAgendaWorkbook("Invented.xlsx", [{ name: "Agenda", rows: [["Title", "Start", "Duration"], ["Untimed session", "", 30], ["Coffee break", "", 15]] }])?.mapped;
    expect(m?.sessions[0]).toMatchObject({ title: "Untimed session", startTime: "" });
    expect(m?.breaks[0]).toMatchObject({ label: "Coffee break", startTime: "" });
    expect(m?.confidence.unclear.join(" ")).toContain("2 row(s) have no start time");
  });
});
