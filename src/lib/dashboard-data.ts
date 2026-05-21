export type EventStatus = "live" | "rehearsal" | "scheduled" | "completed" | "draft";

export type EventRecord = {
  id: string;
  name: string;
  type: string;
  date: string; // ISO
  venue: string;
  city: string;
  attendees: number;
  sessions: number;
  speakers: number;
  status: EventStatus;
  owner: string;
  revision: string;
  readiness: number; // 0-100
};

export type ActivityEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  kind: "edit" | "publish" | "comment" | "cue" | "approval";
};

export type TalentRecord = {
  id: string;
  name: string;
  role: string;
  org: string;
  event: string;
  callTime: string;
  greenRoom: string;
  status: "confirmed" | "tentative" | "arrived" | "on-stage";
};

export type AvItem = {
  id: string;
  area: "Audio" | "Video" | "Lighting" | "Broadcast" | "Comms";
  item: string;
  owner: string;
  event: string;
  status: "ready" | "pending" | "flagged";
};

export const events: EventRecord[] = [
  {
    id: "ev-001",
    name: "Global Tech Summit 2025",
    type: "Conference",
    date: "2025-11-14",
    venue: "Pier 27",
    city: "San Francisco",
    attendees: 1850,
    sessions: 14,
    speakers: 22,
    status: "rehearsal",
    owner: "S. Jenkins",
    revision: "1.4",
    readiness: 88,
  },
  {
    id: "ev-002",
    name: "Northwind Investor Day",
    type: "Corporate Event",
    date: "2025-11-21",
    venue: "Cipriani 42nd",
    city: "New York",
    attendees: 420,
    sessions: 7,
    speakers: 9,
    status: "scheduled",
    owner: "M. Okafor",
    revision: "0.9",
    readiness: 64,
  },
  {
    id: "ev-003",
    name: "Helix Labs · Research Panel",
    type: "Hybrid Panel",
    date: "2025-11-28",
    venue: "Barbican Hall",
    city: "London",
    attendees: 280,
    sessions: 3,
    speakers: 5,
    status: "draft",
    owner: "A. Patel",
    revision: "0.2",
    readiness: 22,
  },
  {
    id: "ev-004",
    name: "Vega Product Launch",
    type: "Summit",
    date: "2025-12-05",
    venue: "The Midway",
    city: "San Francisco",
    attendees: 950,
    sessions: 9,
    speakers: 12,
    status: "scheduled",
    owner: "E. Thorne",
    revision: "1.1",
    readiness: 71,
  },
  {
    id: "ev-005",
    name: "CloudStream Ops Forum",
    type: "Conference",
    date: "2025-10-30",
    venue: "Moscone West",
    city: "San Francisco",
    attendees: 2200,
    sessions: 18,
    speakers: 28,
    status: "completed",
    owner: "S. Jenkins",
    revision: "2.0",
    readiness: 100,
  },
];

export const activity: ActivityEntry[] = [
  { id: "a1", at: "09:42", actor: "Sarah Jenkins", action: "approved revision", target: "Global Tech Summit 2025 · RoS v1.4", kind: "approval" },
  { id: "a2", at: "09:31", actor: "Marcus Chen", action: "edited cue", target: "Fireside: AI in Operations · CAM 2 ISO", kind: "cue" },
  { id: "a3", at: "09:14", actor: "Aris Patel", action: "added speaker", target: "Helix Labs Research Panel", kind: "edit" },
  { id: "a4", at: "08:58", actor: "FlowStage AI", action: "regenerated transitions", target: "Northwind Investor Day", kind: "edit" },
  { id: "a5", at: "08:40", actor: "Elena Thorne", action: "left a comment", target: "Vega Product Launch · Keynote block", kind: "comment" },
  { id: "a6", at: "08:22", actor: "Sarah Jenkins", action: "published document", target: "Global Tech Summit 2025 · v1.3 → v1.4", kind: "publish" },
  { id: "a7", at: "08:05", actor: "FlowStage AI", action: "flagged AV conflict", target: "Vega Product Launch · LAV channel overlap", kind: "cue" },
];

export const talent: TalentRecord[] = [
  { id: "t1", name: "Elena Thorne", role: "Keynote", org: "Northwind", event: "Global Tech Summit 2025", callTime: "08:15", greenRoom: "GR-A", status: "confirmed" },
  { id: "t2", name: "Marcus Chen", role: "Fireside", org: "Vega", event: "Global Tech Summit 2025", callTime: "09:00", greenRoom: "GR-A", status: "arrived" },
  { id: "t3", name: "Dr. Aris Patel", role: "Panelist", org: "Helix Labs", event: "Global Tech Summit 2025", callTime: "10:00", greenRoom: "GR-B", status: "confirmed" },
  { id: "t4", name: "Sarah Jenkins", role: "Moderator", org: "The Brief", event: "Global Tech Summit 2025", callTime: "08:30", greenRoom: "GR-A", status: "arrived" },
  { id: "t5", name: "Priya Rao", role: "Panelist", org: "Northwind", event: "Northwind Investor Day", callTime: "13:00", greenRoom: "GR-1", status: "tentative" },
  { id: "t6", name: "Jonas Berg", role: "Closing", org: "CloudStream", event: "Vega Product Launch", callTime: "15:45", greenRoom: "GR-2", status: "confirmed" },
];

export const avChecklist: AvItem[] = [
  { id: "av1", area: "Audio", item: "Lavalier pack count (8) + spare batteries", owner: "FOH · J. Marlow", event: "Global Tech Summit 2025", status: "ready" },
  { id: "av2", area: "Audio", item: "Handheld for audience Q&A — RF coordination", owner: "FOH · J. Marlow", event: "Global Tech Summit 2025", status: "ready" },
  { id: "av3", area: "Video", item: "Confidence monitor downstage center", owner: "Video · R. Singh", event: "Global Tech Summit 2025", status: "pending" },
  { id: "av4", area: "Video", item: "Lower-thirds queue locked to session order", owner: "Video · R. Singh", event: "Global Tech Summit 2025", status: "ready" },
  { id: "av5", area: "Lighting", item: "Two-chair fireside wash preset", owner: "LX · M. Ortiz", event: "Global Tech Summit 2025", status: "ready" },
  { id: "av6", area: "Broadcast", item: "Stream ingest redundancy (primary + backup)", owner: "Broadcast · K. Liu", event: "Global Tech Summit 2025", status: "flagged" },
  { id: "av7", area: "Comms", item: "Clear-Com channels assigned (SM / FOH / LX / VID)", owner: "Stage Mgr · S. Jenkins", event: "Global Tech Summit 2025", status: "ready" },
  { id: "av8", area: "Audio", item: "Walk-on music levels confirmed with FOH", owner: "FOH · J. Marlow", event: "Northwind Investor Day", status: "pending" },
];
