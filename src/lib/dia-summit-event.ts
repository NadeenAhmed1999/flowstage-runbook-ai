import { confirmed } from "@/lib/event-model";
import { buildSummit } from "@/lib/summit-skeleton";

/**
 * PRIVATE TEST DATA — DIA Africa Access Summit 2026, from the uploaded draft agenda.
 * Not imported by any page; used only by automated acceptance tests.
 * Only agenda facts are stored; everything else is "not specified".
 */
export const diaOps = buildSummit({
  venue: { name: confirmed("Hilton Cairo Heliopolis"), city: "Cairo", country: "Egypt" },
  people: [
    { id: "p-mukanga", name: "David Mukanga", role: "Speaker", organisation: "Gates Foundation" },
    { id: "p-fathallah", name: "Marwan Fathallah", role: "Speaker", organisation: "DIA" },
    { id: "p-ghamrawy", name: "H.E. Dr. Ali El-Ghamrawy", role: "Speaker", organisation: "Egyptian Drug Authority (EDA)", vip: true },
  ],
  openingSpeakers: ["p-mukanga", "p-fathallah", "p-ghamrawy"],
  openingNotes: "Tie in Day 0 insights into opening remarks and collaboration with the Gates Foundation and the EDA.",
  vipDetail: "H.E. Dr. Ali El-Ghamrawy speaking — protocol not specified",
  titles: {
    "d2-open": "Opening Remarks",
    "d2-p1": "Plenary Session 1: Strengthening Coordination Across Africa's Regulatory Ecosystem to Advance Patient Access",
    "d2-p2": "Plenary Session 2: Leveraging Global Regulatory Partnerships to Strengthen Africa's Regulatory Ecosystem",
    "d2-brk1": "Refreshment Break",
    "d2-3a": "Session 3A: Building Capacity and Strengthening Regulatory Systems to Advance Access",
    "d2-3b": "Session 3B: Advancing the Clinical Trial Ecosystem in Africa",
    "d2-lunch": "Lunch",
    "d2-4a": "Session 4A: Building Sustainable Financing Models to Expand Access Across Africa",
    "d2-4b": "Session 4B: Putting Patients and Communities at the Center of Access",
    "d2-brk2": "Refreshment Break",
    "d2-5": "Session 5 Plenary & Closing Remarks: Harnessing AI and Digital Technologies to Accelerate Health Innovation and Access in Africa",
    "d3-6": "Opening Remarks and Session 6 Plenary: Protecting Patients by Addressing Substandard and Falsified Medical Products and Strengthening Supply Chain Resilience",
    "d3-brk1": "Refreshment Break",
    "d3-7a": "7A: Putting Regulatory Reliance into Practice: From Principles to Impact (Workshop)",
    "d3-7b": "Session 7B: Building Sustainable African Markets Through Manufacturing and Pooled Procurement",
    "d3-brk2": "Refreshment Break",
    "d3-8a": "Session 8A: Attracting Investment and Innovation to Advance Health in Africa",
    "d3-8b": "Session 8B: Advancing Access Through Cross-Stakeholder Engagement and Collaboration in Africa",
    "d3-lunch": "Lunch",
    "d3-9": "Session 9 Plenary: Closing the Last-Mile Gap: Turning Health Innovation into Patient Access Across Africa",
    "d3-close": "Closing Ceremony / Remarks",
  },
});

export const DIA_META = {
  name: "DIA Africa Access Summit 2026",
  type: "Regulatory & Health Access Summit",
  date: "2026-12-01",
  endDate: "2026-12-03",
};
