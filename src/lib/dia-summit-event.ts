import {
  confirmed,
  unknown,
  type OpsModel,
  type ProgrammeItem,
  type ProgrammeType,
} from "@/lib/event-model";
import { assignTracks } from "@/lib/ops-schedule";

/**
 * DIA Africa Access Summit 2026 — seeded from the uploaded draft agenda (14 July 2026).
 * Only information present in the agenda is stored. Rooms, chairs, unnamed speakers,
 * AV, interpretation and attendance are "unknown" (not specified) — never invented.
 */

function item(
  id: string,
  title: string,
  type: ProgrammeType,
  day: number,
  start: string,
  end: string,
  extra: Partial<ProgrammeItem> = {},
): ProgrammeItem {
  const pause = type === "break" || type === "meal";
  return {
    id,
    title,
    type,
    day,
    start,
    end,
    room: unknown(),
    owner: unknown(),
    speakers: pause ? { state: "not_required" } : unknown(),
    moderators: pause ? { state: "not_required" } : unknown(),
    chairs: pause ? { state: "not_required" } : unknown(),
    av: pause ? { state: "not_required" } : unknown(),
    interpretation: pause ? { state: "not_required" } : unknown(),
    expectedAttendance: unknown(),
    resources: [],
    sponsorIds: [],
    status: "planned",
    ...extra,
  };
}

const D2 = 2;
const D3 = 3;

const items: ProgrammeItem[] = [
  item("d2-open", "Opening Remarks", "opening-remarks", D2, "09:00", "09:30", {
    speakers: confirmed(["p-mukanga", "p-fathallah", "p-ghamrawy"]),
    chairs: { state: "not_required" },
    notes: "Tie in Day 0 insights into opening remarks and collaboration with the Gates Foundation and the EDA.",
  }),
  item("d2-p1", "Plenary Session 1: Strengthening Coordination Across Africa's Regulatory Ecosystem to Advance Patient Access", "plenary", D2, "09:30", "10:45", { code: "1" }),
  item("d2-p2", "Plenary Session 2: Leveraging Global Regulatory Partnerships to Strengthen Africa's Regulatory Ecosystem", "plenary", D2, "11:00", "12:15", { code: "2" }),
  item("d2-brk1", "Refreshment Break", "break", D2, "12:15", "13:00"),
  item("d2-3a", "Session 3A: Building Capacity and Strengthening Regulatory Systems to Advance Access", "breakout", D2, "13:00", "14:00", { code: "3A" }),
  item("d2-3b", "Session 3B: Advancing the Clinical Trial Ecosystem in Africa", "breakout", D2, "13:00", "14:00", { code: "3B" }),
  item("d2-lunch", "Lunch", "meal", D2, "14:00", "15:15"),
  item("d2-4a", "Session 4A: Building Sustainable Financing Models to Expand Access Across Africa", "breakout", D2, "15:15", "16:15", { code: "4A" }),
  item("d2-4b", "Session 4B: Putting Patients and Communities at the Center of Access", "breakout", D2, "15:15", "16:15", { code: "4B" }),
  item("d2-brk2", "Refreshment Break", "break", D2, "16:15", "17:00"),
  item("d2-5", "Session 5 Plenary & Closing Remarks: Harnessing AI and Digital Technologies to Accelerate Health Innovation and Access in Africa", "plenary", D2, "17:00", "18:15", { code: "5" }),

  item("d3-6", "Opening Remarks and Session 6 Plenary: Protecting Patients by Addressing Substandard and Falsified Medical Products and Strengthening Supply Chain Resilience", "plenary", D3, "09:00", "10:15", { code: "6" }),
  item("d3-brk1", "Refreshment Break", "break", D3, "10:15", "11:00"),
  item("d3-7a", "7A: Putting Regulatory Reliance into Practice: From Principles to Impact (Workshop)", "workshop", D3, "11:00", "12:30", { code: "7A" }),
  item("d3-7b", "Session 7B: Building Sustainable African Markets Through Manufacturing and Pooled Procurement", "breakout", D3, "11:00", "12:30", { code: "7B" }),
  item("d3-brk2", "Refreshment Break", "break", D3, "12:30", "13:15"),
  item("d3-8a", "Session 8A: Attracting Investment and Innovation to Advance Health in Africa", "breakout", D3, "13:15", "14:30", { code: "8A" }),
  item("d3-8b", "Session 8B: Advancing Access Through Cross-Stakeholder Engagement and Collaboration in Africa", "breakout", D3, "13:15", "14:30", { code: "8B" }),
  item("d3-lunch", "Lunch", "meal", D3, "14:30", "15:45"),
  item("d3-9", "Session 9 Plenary: Closing the Last-Mile Gap: Turning Health Innovation into Patient Access Across Africa", "plenary", D3, "15:45", "16:45", { code: "9" }),
  item("d3-close", "Closing Ceremony / Remarks", "closing-ceremony", D3, "16:45", "17:45"),
];

export const diaOps: OpsModel = {
  version: 1,
  venue: { name: confirmed("Hilton Cairo Heliopolis"), city: "Cairo", country: "Egypt" },
  rooms: [],
  people: [
    { id: "p-mukanga", name: "David Mukanga", role: "Speaker", organisation: "Gates Foundation" },
    { id: "p-fathallah", name: "Marwan Fathallah", role: "Speaker", organisation: "DIA" },
    { id: "p-ghamrawy", name: "H.E. Dr. Ali El-Ghamrawy", role: "Speaker", organisation: "Egyptian Drug Authority (EDA)", vip: true },
  ],
  items: assignTracks(items),
  requirements: [
    { id: "req-interp", kind: "interpretation", scope: "event", state: "unknown" },
    { id: "req-vip", kind: "vip_protocol", scope: "item", targetId: "d2-open", state: "unknown", detail: "H.E. Dr. Ali El-Ghamrawy speaking — protocol not specified" },
    { id: "req-access", kind: "accessibility", scope: "event", state: "unknown" },
    { id: "req-stream", kind: "livestream", scope: "event", state: "unknown" },
    { id: "req-record", kind: "recording", scope: "event", state: "unknown" },
  ],
  resources: [],
  economics: { currency: "USD", lines: [] },
  rules: { minResetMin: 15, minSpeakerTransitMin: 10 },
  dismissedConflicts: [],
};

export const DIA_META = {
  name: "DIA Africa Access Summit 2026",
  type: "Regulatory & Health Access Summit",
  date: "2026-12-01",
  endDate: "2026-12-03",
};
