import { describe, expect, it } from "vitest";
import { parsePeopleLine, parseWordAgenda } from "./word-agenda-parse";

const wb = (lines: string[]) => ({ fileName: "agenda.docx", sheets: [{ name: "Document", rows: lines.map(l => [l]) }] });

const AGENDA = [
  "Harbour Health Forum 2031Agenda as of 1/2/31",
  "05-06 May 2031",
  "Grand Hall, Lisbon, Portugal",
  "Tuesday, 05 May 2031 - Opening the Conversation",
  "Time",
  "09:00–09:30\tOpening Remarks",
  "Speaker(s):",
  "Ana Pereira, MD ,Director, Public Health Unit, Harbour Institute Confirmed",
  "Luis Moreira, President, Harbour Forum (confirmed)",
  "Overview",
  "Welcome delegates and frame the day.",
  "9:30-10:45 \tPlenary Session 1: Shared Data for Better Care",
  "Session Chair(s):",
  "Marta Silva, Associate Commissioner, Health Agency (confirmed)",
  "Description:",
  "A plenary on sharing data safely.",
  "Learning Objectives:",
  "Proposed Speaker(s):",
  "Tomas Rey, MS, MBA, Lead, Policy, Acme Pharma (CONFIRMED)Dr. Inês Costa, Hospital Group (invited)",
  "Joao Faria, Minister – declined",
  "Industry rep? Ask the association",
  "12:15 –1:00\tRefreshment Break",
  "1:00 –2:00\tSession 3A: Capacity That Delivers",
  "Session Chair(s): Rui Alves, PhD, Director, Regulator (rui.alves@example.org )",
  "Session 3B: Trials in Practice",
  "Session Chair(s):",
  "Eva Lima, Head of Research, Trials Net (confirmed)",
  "2:00-3:15               Lunch",
  "3:15-4:15\tSession 4A: Paying for Access",
  "Wednesday, 06 May 2031 - Turning Plans into Care",
  "9:00-10:15\tSession 5 Plenary: Closing the Gap",
  "10:15-11:00 Coffee Break",
  "4:45-5:45\tClosing Ceremony: Call to Action",
];

function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error("Expected parsed agenda value");
  return value;
}

describe("parseWordAgenda", () => {
  const m = required(parseWordAgenda(wb(AGENDA)));
  it("reads title, dates and venue", () => {
    expect(m.name).toBe("Harbour Health Forum 2031");
    expect(m.type).toBe("Forum");
    expect(m.date).toBe("2031-05-05");
    expect(m.endDate).toBe("2031-05-06");
    expect(m.notes).toContain("Venue: Grand Hall, Lisbon, Portugal");
    expect(m.importReview?.dayDates).toEqual([{ day: 1, month: 5, dateDay: 5 }, { day: 2, month: 5, dateDay: 6 }]);
  });
  it("assigns days and resolves 12-hour times without am/pm", () => {
    const byTitle = (t: string) => required(m.sessions.find(s => s.title.startsWith(t)));
    expect(byTitle("Opening Remarks")).toMatchObject({ day: 1, startTime: "09:00", durationMin: 30 });
    expect(byTitle("Plenary Session 1")).toMatchObject({ startTime: "09:30", durationMin: 75 });
    expect(byTitle("Session 3A")).toMatchObject({ startTime: "13:00", durationMin: 60 });
    expect(byTitle("Session 4A")).toMatchObject({ startTime: "15:15", durationMin: 60 });
    expect(byTitle("Session 5 Plenary")).toMatchObject({ day: 2, startTime: "09:00" });
    expect(byTitle("Closing Ceremony")).toMatchObject({ startTime: "16:45", durationMin: 60 });
  });
  it("puts breaks and lunch in breaks with their day", () => {
    expect(m.breaks.map(b => [b.label, b.day, b.startTime, b.durationMin])).toEqual([
      ["Refreshment Break", 1, "12:15", 45], ["Lunch", 1, "14:00", 75], ["Coffee Break", 2, "10:15", 45],
    ]);
    expect(m.sessions).toHaveLength(7);
  });
  it("gives a concurrent session without a time the same slot", () => {
    const b = required(m.sessions.find(s => s.title.startsWith("Session 3B")));
    expect(b).toMatchObject({ startTime: "13:00", durationMin: 60, day: 1 });
    expect(m.confidence.unclear.join(" ")).toMatch(/Session 3B.*same time/);
  });
  it("reads chairs and speakers, strips status words, e-mails and credentials", () => {
    const open = required(m.sessions[0]);
    expect(open.speakers).toEqual(["Ana Pereira", "Luis Moreira"]);
    expect(m.speakers.find(p => p.name === "Ana Pereira")?.role).toBe("Director, Public Health Unit, Harbour Institute");
    const p1 = required(m.sessions.find(s => s.title.startsWith("Plenary Session 1")));
    expect(p1.moderators).toEqual(["Marta Silva"]);
    expect(p1.speakers).toEqual(["Tomas Rey", "Dr. Inês Costa"]);
    expect(required(m.sessions.find(s => s.title.startsWith("Session 3A"))).moderators).toEqual(["Rui Alves"]);
    expect(JSON.stringify(m)).not.toContain("@example.org");
  });
  it("skips declined people and note-like lines but reports them", () => {
    const names = m.speakers.map(p => p.name);
    expect(names).not.toContain("Joao Faria");
    const unclear = m.confidence.unclear.join(" | ");
    expect(unclear).toContain("declined");
    expect(unclear).toContain("Industry rep?");
  });
  it("keeps the description and ignores learning objectives", () => {
    expect(required(m.sessions[0]).description).toContain("Welcome delegates");
    expect(required(m.sessions.find(s => s.title.startsWith("Plenary Session 1"))).description).toBe("A plenary on sharing data safely.");
  });
  it("returns null for files that are not timed agendas", () => {
    expect(parseWordAgenda(wb(["Meeting notes", "We discussed the budget.", "Next steps: email the team."]))).toBeNull();
  });
});

describe("parsePeopleLine", () => {
  it("splits fused names and drops statuses", () => {
    const { people } = parsePeopleLine("Tamei Elliott, MS, Director, Global Content, DIAStuart Walker, PhD, Professor, Univ of Herts (confirmed)");
    expect(people.map(p => p.name)).toEqual(["Tamei Elliott", "Stuart Walker"]);
  });
  it("uses the first words as the name when there is no comma", () => {
    const { people } = parsePeopleLine("Nathaniel Nkrumah  African Medicines Agency (AMA) – (CONFIRMED)");
    expect(people[0]?.name).toBe("Nathaniel Nkrumah");
  });
  it("keeps a person whose title follows the name without a comma", () => {
    const { people } = parsePeopleLine("Bunmi Femi-Oyekan lead for regulatory policy, Pfizer (confirmed)");
    expect(people[0]).toMatchObject({ name: "Bunmi Femi-Oyekan" });
    expect(people[0]?.role).toContain("Pfizer");
  });
  it("rejects note lines", () => {
    expect(parsePeopleLine("EDA to participate – Dr Ali will speak in this session if Dr Darko does").people).toEqual([]);
  });
  it("handles 'will represent'", () => {
    const { people } = parsePeopleLine("Alex Ismail will represent DG and David Mukanga, PhD, MPH, Deputy Director, Gates Foundation");
    expect(people.map(p => p.name)).toEqual(["Alex Ismail", "David Mukanga"]);
  });
});
