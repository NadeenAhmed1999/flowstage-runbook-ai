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
  name: "Global Tech Summit 2025",
  type: "Conference",
  date: "2025-11-14",
  speakers: [
    { id: "s1", name: "Elena Thorne", role: "CTO, Northwind" },
    { id: "s2", name: "Marcus Chen", role: "Product Lead, Vega" },
    { id: "s3", name: "Dr. Aris Patel", role: "Researcher, Helix Labs" },
  ],
  moderators: [{ id: "m1", name: "Sarah Jenkins", role: "Editor, The Brief" }],
  sessions: [
    {
      id: "se1",
      title: "Opening Keynote: The Future of Distributed Systems",
      startTime: "09:00",
      durationMin: 30,
      description: "Vision keynote setting the tone for the day.",
      speakerIds: ["s1"],
      moderatorIds: [],
    },
    {
      id: "se2",
      title: "Fireside: AI in Operations",
      startTime: "09:45",
      durationMin: 35,
      description: "Two-chair fireside on operational AI deployments.",
      speakerIds: ["s1", "s2"],
      moderatorIds: ["m1"],
    },
    {
      id: "se3",
      title: "Panel: The Ethics of GenAI",
      startTime: "10:45",
      durationMin: 45,
      description: "Four-person panel with audience Q&A.",
      speakerIds: ["s2", "s3"],
      moderatorIds: ["m1"],
    },
  ],
  breaks: [
    { id: "b1", label: "Networking Break", startTime: "10:20", durationMin: 20 },
    { id: "b2", label: "Lunch", startTime: "11:30", durationMin: 60 },
  ],
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
