import { unknown } from "@/lib/event-model";
import { buildSummit } from "@/lib/summit-skeleton";

/**
 * Anonymized public sample: same days, times, parallel pairs, gaps and conflicts as the
 * private test agenda, with fictional titles, people and organisations, and no venue.
 */
export const sampleOps = buildSummit({
  venue: { name: unknown() },
  people: [
    { id: "p-okafor", name: "Dr. Lena Okafor", role: "Speaker", organisation: "Northbridge Health Fund" },
    { id: "p-reyes", name: "Tomas Reyes", role: "Speaker", organisation: "Meridian Health Alliance" },
    { id: "p-velasquez", name: "H.E. Dr. Amara Velasquez", role: "Speaker", organisation: "National Medicines Agency", vip: true },
  ],
  openingSpeakers: ["p-okafor", "p-reyes", "p-velasquez"],
  openingNotes: "Link previous-day insights to the partnership themes of the summit.",
  vipDetail: "H.E. Dr. Amara Velasquez speaking — protocol not specified",
  titles: {
    "d2-open": "Opening Remarks",
    "d2-p1": "Plenary Session 1: Coordinating Regional Regulatory Networks",
    "d2-p2": "Plenary Session 2: Partnerships with International Regulators",
    "d2-brk1": "Refreshment Break",
    "d2-3a": "Session 3A: Building Regulatory Capacity",
    "d2-3b": "Session 3B: Growing the Clinical Trial Ecosystem",
    "d2-lunch": "Lunch",
    "d2-4a": "Session 4A: Sustainable Financing for Access",
    "d2-4b": "Session 4B: Patients and Communities at the Center",
    "d2-brk2": "Refreshment Break",
    "d2-5": "Session 5 Plenary & Closing Remarks: Digital Tools for Health Access",
    "d3-6": "Opening Remarks and Session 6 Plenary: Product Quality and Supply Resilience",
    "d3-brk1": "Refreshment Break",
    "d3-7a": "7A: Reliance in Practice (Workshop)",
    "d3-7b": "Session 7B: Regional Manufacturing and Pooled Procurement",
    "d3-brk2": "Refreshment Break",
    "d3-8a": "Session 8A: Attracting Health Investment",
    "d3-8b": "Session 8B: Cross-Stakeholder Collaboration",
    "d3-lunch": "Lunch",
    "d3-9": "Session 9 Plenary: Closing the Last-Mile Gap",
    "d3-close": "Closing Ceremony / Remarks",
  },
});

export const SAMPLE_META = {
  name: "Meridian Health Access Summit 2026 (Sample)",
  type: "Regulatory & Health Access Summit",
  date: "2026-12-01",
  endDate: "2026-12-03",
};
