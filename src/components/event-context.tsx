import { createContext, useContext, useState, type ReactNode } from "react";

export type Session = {
  id: string;
  title: string;
  startTime: string; // HH:MM
  durationMin: number;
  description: string;
  speakerIds: string[];
  moderatorIds: string[];
};

export type Person = { id: string; name: string; role: string };
export type Break = { id: string; label: string; startTime: string; durationMin: number };
export type Sponsor = { id: string; name: string; placement: string };

export type EventData = {
  name: string;
  type: string;
  date: string; // YYYY-MM-DD
  sessions: Session[];
  speakers: Person[];
  moderators: Person[];
  breaks: Break[];
  sponsors: Sponsor[];
  avRequirements: string;
};

const uid = () => Math.random().toString(36).slice(2, 9);

export const seedEvent: EventData = {
  name: "GCC Healthcare Innovation Summit 2026",
  type: "Healthcare Conference",
  date: "2026-03-12",
  speakers: [
    { id: "s1", name: "Dr. Hana Al-Mansoori", role: "Conference Chair" },
    { id: "s2", name: "Dr. Khalid Al-Rashid", role: "Senior Representative, Regional Health Authority" },
    { id: "s3", name: "Dr. Layla Haddad", role: "Health Authority Representative" },
    { id: "s4", name: "Omar Farouk", role: "Regulatory Affairs Lead, Pharma Consortium" },
    { id: "s5", name: "Prof. Reema Nasser", role: "Clinical Research Expert, Gulf Medical University" },
    { id: "s6", name: "Dr. Yusuf Karim", role: "Clinical Innovation Lead, Regional AI Health Initiative" },
    { id: "s7", name: "Sara Belhaj", role: "Senior Digital Health Consultant" },
  ],
  moderators: [
    { id: "m1", name: "Noura El-Sayed", role: "Industry Affairs Director" },
    { id: "m2", name: "James Whitford", role: "Program Director, Summit" },
  ],
  sessions: [
    {
      id: "se1",
      title: "Opening Remarks",
      startTime: "09:15",
      durationMin: 10,
      description:
        "Conference Chair welcomes 350 senior delegates, frames the day's regulatory and digital health agenda, and acknowledges Platinum and Strategic Partners.",
      speakerIds: ["s1"],
      moderatorIds: [],
    },
    {
      id: "se2",
      title: "Keynote: Digital Transformation in Regional Healthcare",
      startTime: "09:25",
      durationMin: 40,
      description:
        "Headline policy keynote on national digital health strategy, interoperability mandates, and the next phase of regional healthcare modernization.",
      speakerIds: ["s2"],
      moderatorIds: [],
    },
    {
      id: "se3",
      title: "Panel: Regulatory Reliance and Cross-Border Collaboration",
      startTime: "10:05",
      durationMin: 45,
      description:
        "Three-person panel exploring GCC regulatory reliance pathways, joint reviews, and cross-border data and clinical trial collaboration. Includes 10 minutes audience Q&A.",
      speakerIds: ["s3", "s4", "s5"],
      moderatorIds: ["m1"],
    },
    {
      id: "se4",
      title: "Sponsor Spotlight: Platinum Sponsor",
      startTime: "11:20",
      durationMin: 10,
      description:
        "Branded 10-minute spotlight from the Platinum Sponsor on AI-enabled diagnostics deployments across the region.",
      speakerIds: [],
      moderatorIds: [],
    },
    {
      id: "se5",
      title: "Fireside Chat: AI in Clinical Research",
      startTime: "11:30",
      durationMin: 40,
      description:
        "Two-chair fireside on operationalizing AI in regional clinical research — protocol design, regulatory acceptance, and patient safety guardrails.",
      speakerIds: ["s6"],
      moderatorIds: ["m2"],
    },
    {
      id: "se6",
      title: "Workshop: Building Patient-Centric Digital Health Pathways",
      startTime: "13:10",
      durationMin: 70,
      description:
        "Facilitated working session with break-out tables. Delegates map a patient journey across primary care, specialist referral, and remote monitoring touchpoints.",
      speakerIds: ["s7"],
      moderatorIds: [],
    },
    {
      id: "se7",
      title: "Closing Remarks",
      startTime: "14:20",
      durationMin: 10,
      description:
        "Conference Chair closes the program with key takeaways, partner thank-yous, and next-year save-the-date.",
      speakerIds: ["s1"],
      moderatorIds: [],
    },
  ],
  breaks: [
    { id: "b0", label: "Registration & Welcome Coffee", startTime: "08:30", durationMin: 45 },
    { id: "b1", label: "Networking Coffee Break", startTime: "10:50", durationMin: 30 },
    { id: "b2", label: "Networking Lunch", startTime: "12:10", durationMin: 60 },
  ],
  sponsors: [
    { id: "sp1", name: "Meditrace Diagnostics (Platinum)", placement: "Opening remarks acknowledgement + dedicated 11:20 sponsor spotlight + lunch branding" },
    { id: "sp2", name: "Cedar Health Systems (Strategic Partner)", placement: "Pre-keynote thank-you + lower-third during panel transitions" },
    { id: "sp3", name: "NovaPharma Gulf (Coffee Break Sponsor)", placement: "Branded signage and lower-third during 10:50 networking coffee break" },
  ],
  avRequirements:
    "Main stage with dual 16:9 projection screens and center IMAG. Four lavalier mics (panel) + two handhelds for audience Q&A + one lectern mic (gooseneck) for keynote. Confidence monitor downstage center showing speaker timer and next-cue prompt. FOH desk at rear-of-house with comms to stage manager, lighting, and video. Walk-on music presets loaded for keynote, panel, fireside, and workshop. Lower-thirds package preloaded in order of run. Sponsor video loops queued for breaks. Live captioning feed for keynote and panel. Registration desk with 4 check-in stations, badge printers, and overflow queue managers. Sponsor area with 6 pods adjacent to coffee service. Backup wireless mic kit and spare lav packs in green room.",
};

  sponsors: [
    { id: "sp1", name: "CloudStream Systems", placement: "Opening keynote intro" },
    { id: "sp2", name: "Northwind Capital", placement: "Pre-lunch thank-you" },
  ],
  avRequirements:
    "Dual projection screens, four lapel microphones, one handheld for audience Q&A, confidence monitor downstage center, walk-on music cue ready at FOH.",
};

import type { RunSheet } from "@/lib/generate-run-sheet.functions";

type Ctx = {
  event: EventData;
  setEvent: (next: EventData) => void;
  reset: () => void;
  newId: () => string;
  runSheet: RunSheet | null;
  setRunSheet: (s: RunSheet | null) => void;
};

const EventCtx = createContext<Ctx | null>(null);

export function EventProvider({ children }: { children: ReactNode }) {
  const [event, setEvent] = useState<EventData>(seedEvent);
  const [runSheet, setRunSheet] = useState<RunSheet | null>(null);
  return (
    <EventCtx.Provider
      value={{
        event,
        setEvent,
        reset: () => setEvent(seedEvent),
        newId: uid,
        runSheet,
        setRunSheet,
      }}
    >
      {children}
    </EventCtx.Provider>
  );
}

export function useEvent() {
  const ctx = useContext(EventCtx);
  if (!ctx) throw new Error("useEvent must be used within EventProvider");
  return ctx;
}
