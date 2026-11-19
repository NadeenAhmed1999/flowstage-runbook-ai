import { unknown } from "@/lib/event-model";
import { buildSummit } from "@/lib/summit-skeleton";

/**
 * TEST-ONLY FIXTURE. All names and titles are invented placeholders.
 * Uses the shared two-day skeleton (concurrent pairs, breaks, meals) so the
 * structural tests stay meaningful without storing any real agenda.
 */
const ids = ["d2-open","d2-p1","d2-p2","d2-brk1","d2-3a","d2-3b","d2-lunch","d2-4a","d2-4b","d2-brk2","d2-5","d3-6","d3-brk1","d3-7a","d3-7b","d3-brk2","d3-8a","d3-8b","d3-lunch","d3-9","d3-close"];
const titleFor = (id: string) => {
  if (id === "d2-open") return "Opening Remarks";
  if (id.includes("brk")) return "Break";
  if (id.includes("lunch")) return "Lunch";
  if (id === "d3-close") return "Closing Remarks";
  const code = id.split("-")[1].replace(/^p/, "").toUpperCase();
  return `Session ${code}: Sample Topic ${code}`;
};

export const fixtureOps = buildSummit({
  venue: { name: unknown() },
  people: [
    { id: "p-a", name: "Speaker A", role: "Speaker", organisation: "Org A" },
    { id: "p-b", name: "Speaker B", role: "Speaker", organisation: "Org B" },
    { id: "p-c", name: "Speaker C", role: "Speaker", organisation: "Org C", vip: true },
  ],
  openingSpeakers: ["p-a", "p-b", "p-c"],
  openingNotes: "Sample opening note.",
  vipDetail: "Speaker C speaking — protocol not specified",
  titles: Object.fromEntries(ids.map((id) => [id, titleFor(id)])),
});

export const FIXTURE_META = { name: "Sample Forum (Test Fixture)", type: "Summit", date: "2026-01-05", endDate: "2026-01-07" };
