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
    type: "Executive Event",
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
    name: "MedAxis Clinical Forum",
    type: "Healthcare Forum",
    date: "2025-11-28",
    venue: "Mayo Civic Center",
    city: "Rochester",
    attendees: 640,
    sessions: 11,
    speakers: 17,
    status: "scheduled",
    owner: "A. Patel",
    revision: "1.0",
    readiness: 74,
  },
  {
    id: "ev-004",
    name: "Vega Product Launch",
    type: "Business Summit",
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
    name: "Atrium Health Leadership Retreat",
    type: "Executive Event",
    date: "2025-12-11",
    venue: "Ritz-Carlton Half Moon Bay",
    city: "Half Moon Bay",
    attendees: 180,
    sessions: 6,
    speakers: 8,
    status: "draft",
    owner: "R. Nguyen",
    revision: "0.3",
    readiness: 28,
  },
  {
    id: "ev-006",
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
  {
    id: "ev-007",
    name: "Helix Labs · Research Panel",
    type: "Hybrid Panel",
    date: "2025-10-22",
    venue: "Barbican Hall",
    city: "London",
    attendees: 280,
    sessions: 3,
    speakers: 5,
    status: "completed",
    owner: "A. Patel",
    revision: "1.2",
    readiness: 100,
  },
];

export const activity: ActivityEntry[] = [
  { id: "a1", at: "09:42", actor: "Sarah Jenkins", action: "approved revision", target: "Global Tech Summit 2025 · RoS v1.4", kind: "approval" },
  { id: "a2", at: "09:31", actor: "Marcus Chen", action: "edited cue", target: "Fireside: AI in Operations · CAM 2 ISO", kind: "cue" },
  { id: "a3", at: "09:14", actor: "Aris Patel", action: "added speaker", target: "MedAxis Clinical Forum · Dr. L. Hassan", kind: "edit" },
  { id: "a4", at: "08:58", actor: "FlowStage AI", action: "regenerated transitions", target: "Northwind Investor Day", kind: "edit" },
  { id: "a5", at: "08:40", actor: "Elena Thorne", action: "left a comment", target: "Vega Product Launch · Keynote block", kind: "comment" },
  { id: "a6", at: "08:22", actor: "Sarah Jenkins", action: "published document", target: "Global Tech Summit 2025 · v1.3 → v1.4", kind: "publish" },
  { id: "a7", at: "08:05", actor: "FlowStage AI", action: "flagged AV conflict", target: "Vega Product Launch · LAV channel overlap", kind: "cue" },
  { id: "a8", at: "07:51", actor: "Rachel Nguyen", action: "imported agenda", target: "Atrium Health Leadership Retreat · draft v0.3", kind: "edit" },
];

export const talent: TalentRecord[] = [
  { id: "t1", name: "Elena Thorne", role: "Keynote", org: "Northwind", event: "Global Tech Summit 2025", callTime: "08:15", greenRoom: "GR-A", status: "confirmed" },
  { id: "t2", name: "Marcus Chen", role: "Fireside", org: "Vega", event: "Global Tech Summit 2025", callTime: "09:00", greenRoom: "GR-A", status: "arrived" },
  { id: "t3", name: "Dr. Aris Patel", role: "Panelist", org: "Helix Labs", event: "Global Tech Summit 2025", callTime: "10:00", greenRoom: "GR-B", status: "confirmed" },
  { id: "t4", name: "Sarah Jenkins", role: "Moderator", org: "The Brief", event: "Global Tech Summit 2025", callTime: "08:30", greenRoom: "GR-A", status: "arrived" },
  { id: "t5", name: "Priya Rao", role: "Panelist", org: "Northwind", event: "Northwind Investor Day", callTime: "13:00", greenRoom: "GR-1", status: "tentative" },
  { id: "t6", name: "Jonas Berg", role: "Closing", org: "CloudStream", event: "Vega Product Launch", callTime: "15:45", greenRoom: "GR-2", status: "confirmed" },
  { id: "t7", name: "Dr. Lina Hassan", role: "Keynote", org: "MedAxis", event: "MedAxis Clinical Forum", callTime: "07:45", greenRoom: "GR-C", status: "confirmed" },
  { id: "t8", name: "Dr. Owen Park", role: "Panelist", org: "Atrium Health", event: "MedAxis Clinical Forum", callTime: "10:30", greenRoom: "GR-C", status: "tentative" },
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

export type RunSheet = {
  id: string;
  event: string;
  revision: string;
  updatedBy: string;
  updatedAt: string;
  sessions: number;
  status: "approved" | "in-review" | "draft";
};

export const runSheets: RunSheet[] = [
  { id: "rs1", event: "Global Tech Summit 2025", revision: "v1.4", updatedBy: "S. Jenkins", updatedAt: "Today · 09:42", sessions: 14, status: "approved" },
  { id: "rs2", event: "Northwind Investor Day", revision: "v0.9", updatedBy: "M. Okafor", updatedAt: "Today · 08:58", sessions: 7, status: "in-review" },
  { id: "rs3", event: "MedAxis Clinical Forum", revision: "v1.0", updatedBy: "A. Patel", updatedAt: "Yesterday · 17:12", sessions: 11, status: "in-review" },
  { id: "rs4", event: "Vega Product Launch", revision: "v1.1", updatedBy: "E. Thorne", updatedAt: "Yesterday · 14:40", sessions: 9, status: "in-review" },
  { id: "rs5", event: "Atrium Health Leadership Retreat", revision: "v0.3", updatedBy: "R. Nguyen", updatedAt: "2d ago · 11:05", sessions: 6, status: "draft" },
];

export type SponsorDeliverable = {
  id: string;
  sponsor: string;
  tier: "Title" | "Platinum" | "Gold" | "Silver";
  event: string;
  deliverable: string;
  due: string;
  progress: number;
  status: "on-track" | "at-risk" | "delivered";
};

export const sponsorDeliverables: SponsorDeliverable[] = [
  { id: "sd1", sponsor: "Northwind Cloud", tier: "Title", event: "Global Tech Summit 2025", deliverable: "Mainstage walk-on loop + logo lockup", due: "Nov 10", progress: 92, status: "on-track" },
  { id: "sd2", sponsor: "Helix Labs", tier: "Platinum", event: "Global Tech Summit 2025", deliverable: "Stage-side activation copy approval", due: "Nov 09", progress: 68, status: "on-track" },
  { id: "sd3", sponsor: "Vega Systems", tier: "Platinum", event: "Vega Product Launch", deliverable: "Keynote intro video master (4K)", due: "Nov 28", progress: 40, status: "at-risk" },
  { id: "sd4", sponsor: "Atrium Health", tier: "Gold", event: "MedAxis Clinical Forum", deliverable: "Session sponsor read-in script", due: "Nov 24", progress: 55, status: "on-track" },
  { id: "sd5", sponsor: "Pier 27 Partners", tier: "Silver", event: "Global Tech Summit 2025", deliverable: "Hospitality lounge signage proof", due: "Nov 12", progress: 100, status: "delivered" },
  { id: "sd6", sponsor: "CloudStream", tier: "Gold", event: "Northwind Investor Day", deliverable: "Closing remarks acknowledgement", due: "Nov 18", progress: 30, status: "at-risk" },
];

export type OpsAlert = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  event: string;
  at: string;
};

export const opsAlerts: OpsAlert[] = [
  { id: "al1", severity: "critical", title: "Broadcast ingest redundancy not confirmed", detail: "Primary stream path locked. Backup path awaiting carrier sign-off.", event: "Global Tech Summit 2025", at: "09:38" },
  { id: "al2", severity: "warning", title: "Sponsor video master overdue", detail: "Vega keynote intro 4K master not received from agency.", event: "Vega Product Launch", at: "08:05" },
  { id: "al3", severity: "warning", title: "Panelist travel unconfirmed", detail: "Dr. Owen Park itinerary returned tentative. Backup panelist queued.", event: "MedAxis Clinical Forum", at: "Yesterday" },
  { id: "al4", severity: "info", title: "Run-of-show v1.4 published", detail: "All department heads acknowledged within 12 minutes.", event: "Global Tech Summit 2025", at: "08:22" },
];

export type TimelineBlock = {
  id: string;
  start: string; // HH:MM
  end: string;
  label: string;
  track: "Mainstage" | "Studio B" | "Breakout";
  kind: "keynote" | "panel" | "break" | "sponsor" | "fireside";
};

export const timelineDay: TimelineBlock[] = [
  { id: "tb1", start: "08:00", end: "08:30", label: "Doors + walk-in loop", track: "Mainstage", kind: "break" },
  { id: "tb2", start: "08:30", end: "09:15", label: "Opening keynote · E. Thorne", track: "Mainstage", kind: "keynote" },
  { id: "tb3", start: "09:15", end: "09:25", label: "Title sponsor read-in · Northwind", track: "Mainstage", kind: "sponsor" },
  { id: "tb4", start: "09:25", end: "10:10", label: "Fireside · AI in Operations", track: "Mainstage", kind: "fireside" },
  { id: "tb5", start: "09:30", end: "10:15", label: "Workshop · Production playbooks", track: "Studio B", kind: "panel" },
  { id: "tb6", start: "10:10", end: "10:40", label: "Networking break", track: "Mainstage", kind: "break" },
  { id: "tb7", start: "10:40", end: "11:30", label: "Panel · Resilient platforms", track: "Mainstage", kind: "panel" },
  { id: "tb8", start: "10:30", end: "11:20", label: "Breakout · Customer rituals", track: "Breakout", kind: "panel" },
  { id: "tb9", start: "11:30", end: "12:15", label: "Closing keynote · J. Berg", track: "Mainstage", kind: "keynote" },
];

export type SpeakerCoordination = {
  id: string;
  name: string;
  event: string;
  travel: number;
  bio: number;
  assets: number;
  rehearsal: number;
};

export const speakerCoordination: SpeakerCoordination[] = [
  { id: "sc1", name: "Elena Thorne", event: "Global Tech Summit 2025", travel: 100, bio: 100, assets: 90, rehearsal: 75 },
  { id: "sc2", name: "Marcus Chen", event: "Global Tech Summit 2025", travel: 100, bio: 100, assets: 100, rehearsal: 100 },
  { id: "sc3", name: "Dr. Lina Hassan", event: "MedAxis Clinical Forum", travel: 100, bio: 80, assets: 60, rehearsal: 0 },
  { id: "sc4", name: "Dr. Owen Park", event: "MedAxis Clinical Forum", travel: 40, bio: 80, assets: 30, rehearsal: 0 },
  { id: "sc5", name: "Priya Rao", event: "Northwind Investor Day", travel: 60, bio: 100, assets: 50, rehearsal: 25 },
  { id: "sc6", name: "Jonas Berg", event: "Vega Product Launch", travel: 100, bio: 100, assets: 70, rehearsal: 50 },
];
