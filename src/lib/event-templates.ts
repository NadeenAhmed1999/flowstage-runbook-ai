import type { EventData } from "@/components/event-context";

export type EventTemplate = {
  id: string;
  label: string;
  description: string;
  /** Extra event-specific context appended to the AI prompt to improve run-sheet quality. */
  aiGuidance: string;
  /** Pre-filled event scaffold. Caller assigns fresh IDs. */
  seed: Omit<EventData, "templateGuidance"> & { templateGuidance?: string };
};

const mk = (overrides: Partial<EventData>): EventData => ({
  name: "",
  type: "",
  date: "",
  sessions: [],
  speakers: [],
  moderators: [],
  breaks: [],
  sponsors: [],
  avRequirements: "",
  ...overrides,
});

export const EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: "healthcare-conference",
    label: "Healthcare Conference",
    description:
      "Regulatory, clinical, and digital-health programming with panels, keynotes, and a workshop.",
    aiGuidance:
      "This is a senior healthcare conference. Use clinical and regulatory terminology (interoperability, reliance pathways, pharmacovigilance, HCP, KOL, IRB). Include live captioning cues for accessibility, conflict-of-interest acknowledgements before sponsored content, and a dedicated registration-desk operating note for badge reprints and VIP arrivals. Sponsor visibility must remain clearly separated from clinical content per industry compliance norms.",
    seed: mk({
      name: "Healthcare Innovation Summit",
      type: "Healthcare Conference",
      avRequirements:
        "Main stage with dual 16:9 screens, IMAG, lavalier x4 for panel, 2 handhelds for Q&A, lectern gooseneck for keynote, confidence monitor with timer. Live captioning feed for keynote and panels. Registration desk with 4 check-in stations and badge printers. Sponsor pods adjacent to coffee service. Backup wireless kit in green room.",
      sessions: [
        { id: "t1", title: "Opening Remarks", startTime: "09:15", durationMin: 10, description: "Conference chair welcome and agenda framing.", speakerIds: [], moderatorIds: [] },
        { id: "t2", title: "Keynote: Digital Transformation in Healthcare", startTime: "09:25", durationMin: 40, description: "Policy keynote on national digital health strategy and interoperability.", speakerIds: [], moderatorIds: [] },
        { id: "t3", title: "Panel: Regulatory Reliance & Cross-Border Collaboration", startTime: "10:05", durationMin: 45, description: "Three-person panel with 10 minutes audience Q&A.", speakerIds: [], moderatorIds: [] },
        { id: "t4", title: "Fireside: AI in Clinical Research", startTime: "11:30", durationMin: 40, description: "Two-chair fireside on operationalizing AI in clinical research.", speakerIds: [], moderatorIds: [] },
        { id: "t5", title: "Workshop: Patient-Centric Digital Health Pathways", startTime: "13:10", durationMin: 70, description: "Facilitated working session with break-out tables.", speakerIds: [], moderatorIds: [] },
        { id: "t6", title: "Closing Remarks", startTime: "14:20", durationMin: 10, description: "Takeaways and save-the-date.", speakerIds: [], moderatorIds: [] },
      ],
      breaks: [
        { id: "b1", label: "Registration & Welcome Coffee", startTime: "08:30", durationMin: 45 },
        { id: "b2", label: "Networking Coffee Break", startTime: "10:50", durationMin: 30 },
        { id: "b3", label: "Networking Lunch", startTime: "12:10", durationMin: 60 },
      ],
      sponsors: [
        { id: "sp1", name: "Platinum Sponsor", placement: "Opening acknowledgement + 11:20 spotlight + lunch branding" },
        { id: "sp2", name: "Strategic Partner", placement: "Pre-keynote thank-you + lower-third during panel transitions" },
      ],
    }),
  },
  {
    id: "executive-summit",
    label: "Executive Summit",
    description: "C-suite roundtables, headline keynotes, and curated networking.",
    aiGuidance:
      "This is an invite-only executive summit for CEOs and board members. Tone is measured and confidential — use Chatham House Rule reminders before roundtables, VIP arrival protocols (private entrance, dedicated host), and a discreet press/photography policy. Networking moments are the product; protect them with strict session-end discipline and concierge-led transitions.",
    seed: mk({
      name: "Executive Leadership Summit",
      type: "Executive Summit",
      avRequirements:
        "Single-camera IMAG, two lavalier mics for fireside, four table mics for roundtable, ambient room wash, no audience-facing recording during Chatham House sessions. Discreet comms, no visible run-of-show on stage.",
      sessions: [
        { id: "t1", title: "Private VIP Reception", startTime: "08:30", durationMin: 45, description: "Closed-door arrivals with concierge greeting.", speakerIds: [], moderatorIds: [] },
        { id: "t2", title: "Chair's Welcome", startTime: "09:15", durationMin: 10, description: "Summit chair opens the day.", speakerIds: [], moderatorIds: [] },
        { id: "t3", title: "Headline Keynote", startTime: "09:25", durationMin: 35, description: "Macro outlook from headline speaker.", speakerIds: [], moderatorIds: [] },
        { id: "t4", title: "Executive Roundtable (Chatham House)", startTime: "10:30", durationMin: 60, description: "Closed roundtable, no recording.", speakerIds: [], moderatorIds: [] },
        { id: "t5", title: "Fireside: The Next Decade", startTime: "12:00", durationMin: 40, description: "Two-chair fireside with curated audience Q&A.", speakerIds: [], moderatorIds: [] },
        { id: "t6", title: "Closing & Private Lunch", startTime: "13:00", durationMin: 75, description: "Curated seating plan.", speakerIds: [], moderatorIds: [] },
      ],
      breaks: [
        { id: "b1", label: "Arrivals & Coffee", startTime: "08:30", durationMin: 45 },
        { id: "b2", label: "Networking Break", startTime: "11:30", durationMin: 25 },
      ],
      sponsors: [
        { id: "sp1", name: "Founding Partner", placement: "Subtle acknowledgement in chair's welcome only" },
      ],
    }),
  },
  {
    id: "awards-ceremony",
    label: "Awards Ceremony",
    description: "Hosted gala with category reveals, winner walk-ups, and broadcast cues.",
    aiGuidance:
      "This is a televised-style awards ceremony. Treat the show like a broadcast: pre-show VT, host walk-on with playoff music, category VTs before each reveal, winner walk-up cues with spotlight follow, acceptance speech length cap (90 seconds) with playoff music as soft cue, ISO cam on the winners' table. Build in step-and-repeat photography time after each category. Include a contingency for a no-show winner (read citation, hold trophy backstage).",
    seed: mk({
      name: "Industry Excellence Awards",
      type: "Awards Ceremony",
      avRequirements:
        "Broadcast switcher with 4 cameras (host wide, host close, audience reaction, podium ISO), follow-spot for winner walk-ups, in-ear comms for host, podium mic + 2 handhelds for category presenters, playoff music presets per category, VT playback ready for each category package.",
      sessions: [
        { id: "t1", title: "Red Carpet & Arrivals", startTime: "18:00", durationMin: 60, description: "Step-and-repeat photography, drinks reception.", speakerIds: [], moderatorIds: [] },
        { id: "t2", title: "Pre-Show VT & Host Walk-On", startTime: "19:15", durationMin: 5, description: "Opening package and host entrance.", speakerIds: [], moderatorIds: [] },
        { id: "t3", title: "Award Category 1: Rising Star", startTime: "19:20", durationMin: 12, description: "VT, presenter, reveal, acceptance.", speakerIds: [], moderatorIds: [] },
        { id: "t4", title: "Award Category 2: Innovator of the Year", startTime: "19:32", durationMin: 12, description: "VT, presenter, reveal, acceptance.", speakerIds: [], moderatorIds: [] },
        { id: "t5", title: "Headline Performance", startTime: "20:00", durationMin: 15, description: "Live act between categories.", speakerIds: [], moderatorIds: [] },
        { id: "t6", title: "Grand Prize: Company of the Year", startTime: "20:45", durationMin: 15, description: "Final category with extended acceptance.", speakerIds: [], moderatorIds: [] },
        { id: "t7", title: "Host Wrap & After-Party Call", startTime: "21:00", durationMin: 5, description: "Closeout and after-party signpost.", speakerIds: [], moderatorIds: [] },
      ],
      breaks: [
        { id: "b1", label: "Dinner Service", startTime: "19:45", durationMin: 15 },
      ],
      sponsors: [
        { id: "sp1", name: "Headline Sponsor", placement: "Title card pre-show, host mention, category co-presenter" },
        { id: "sp2", name: "Category Sponsor", placement: "On-screen lockup before each category VT" },
      ],
    }),
  },
  {
    id: "product-launch",
    label: "Product Launch",
    description: "Keynote-driven reveal with demo, press Q&A, and embargo coordination.",
    aiGuidance:
      "This is a product launch with press in the room. Embargo lifts at the moment of reveal — coordinate with comms before any slide goes live. Include a rehearsed demo backup path (recorded video stand-in if live demo fails), reveal lighting hit, applause cue, and a tightly-managed press Q&A with selected moderators. Hands-on area opens immediately after keynote; staff briefing required 60 minutes prior.",
    seed: mk({
      name: "Product Launch Event",
      type: "Product Launch",
      avRequirements:
        "Single keynote screen 16:9, presenter clicker with backup, lectern + lavalier on presenter, demo station with HDMI + USB-C feeds, recorded demo VT loaded as failover, dramatic reveal lighting cue, ambient music bed for hands-on area.",
      sessions: [
        { id: "t1", title: "Press Check-In & Embargo Briefing", startTime: "09:00", durationMin: 30, description: "Press desk, embargo paperwork, press kit pickup.", speakerIds: [], moderatorIds: [] },
        { id: "t2", title: "Keynote: The Story", startTime: "10:00", durationMin: 25, description: "CEO frames the why before the what.", speakerIds: [], moderatorIds: [] },
        { id: "t3", title: "Product Reveal", startTime: "10:25", durationMin: 10, description: "Embargo lifts on reveal cue.", speakerIds: [], moderatorIds: [] },
        { id: "t4", title: "Live Demo", startTime: "10:35", durationMin: 15, description: "Hands-on demonstration of headline features.", speakerIds: [], moderatorIds: [] },
        { id: "t5", title: "Press Q&A", startTime: "11:00", durationMin: 20, description: "Moderated questions from accredited press.", speakerIds: [], moderatorIds: [] },
        { id: "t6", title: "Hands-On Area Open", startTime: "11:30", durationMin: 90, description: "Demo stations staffed by product team.", speakerIds: [], moderatorIds: [] },
      ],
      breaks: [
        { id: "b1", label: "Coffee & Pastries", startTime: "09:00", durationMin: 60 },
      ],
      sponsors: [],
    }),
  },
  {
    id: "investor-forum",
    label: "Investor Forum",
    description: "Company pitches, fireside chats, and curated LP/GP networking.",
    aiGuidance:
      "This is a regulated investor forum. Include a disclaimer slide before all pitch sessions (no offer to sell securities). Use a strict pitch clock (7 minutes pitch, 3 minutes Q&A) with visible countdown timer on confidence monitor and audible chime at 1 minute remaining. Capture investor RSVPs at registration for accurate room counts. Networking is the deliverable — protect break timing.",
    seed: mk({
      name: "Capital Markets Investor Forum",
      type: "Investor Forum",
      avRequirements:
        "Pitch stage with single 16:9 screen, lectern mic + lavalier, visible 10-minute countdown timer on confidence monitor, audible chime at 1 minute remaining, pitch deck preload via USB at registration, FOH disclaimer slide template loaded.",
      sessions: [
        { id: "t1", title: "Welcome & Forum Disclaimer", startTime: "08:45", durationMin: 10, description: "Chair welcome and regulatory disclaimer.", speakerIds: [], moderatorIds: [] },
        { id: "t2", title: "Keynote: Market Outlook", startTime: "09:00", durationMin: 30, description: "Macro outlook from headline economist.", speakerIds: [], moderatorIds: [] },
        { id: "t3", title: "Company Pitches Block 1", startTime: "09:45", durationMin: 60, description: "Six companies, 10 minutes each (7 pitch + 3 Q&A).", speakerIds: [], moderatorIds: [] },
        { id: "t4", title: "Fireside: LP Perspective", startTime: "11:15", durationMin: 30, description: "Two-chair fireside with leading LP.", speakerIds: [], moderatorIds: [] },
        { id: "t5", title: "Company Pitches Block 2", startTime: "13:00", durationMin: 60, description: "Six companies, 10 minutes each.", speakerIds: [], moderatorIds: [] },
        { id: "t6", title: "Curated 1:1 Meetings", startTime: "14:15", durationMin: 90, description: "Pre-matched investor meetings in side rooms.", speakerIds: [], moderatorIds: [] },
      ],
      breaks: [
        { id: "b1", label: "Registration & Coffee", startTime: "08:00", durationMin: 45 },
        { id: "b2", label: "Networking Break", startTime: "10:45", durationMin: 30 },
        { id: "b3", label: "Networking Lunch", startTime: "11:45", durationMin: 75 },
      ],
      sponsors: [
        { id: "sp1", name: "Lead Sponsor", placement: "Chair acknowledgement + co-branded forum signage" },
      ],
    }),
  },
  {
    id: "workshop",
    label: "Workshop / Training Day",
    description: "Hands-on instructor-led training with breakouts and exercises.",
    aiGuidance:
      "This is an instructor-led training day with active participation. Tone is facilitative, not theatrical. Include a materials check at registration (printed workbooks, name tents), table assignments by skill level, timed breakout exercises with a visible countdown on the room screen, and a feedback survey link displayed in the closeout. Lower AV complexity — clarity and pacing matter more than production polish.",
    seed: mk({
      name: "Practitioner Workshop",
      type: "Workshop / Training",
      avRequirements:
        "Single projection screen, instructor lavalier + 2 roaming handhelds for participant questions, visible breakout countdown timer, printed workbooks at each seat, whiteboard + flipcharts per table.",
      sessions: [
        { id: "t1", title: "Welcome & Workshop Norms", startTime: "09:00", durationMin: 15, description: "Facilitator welcome, ground rules, agenda.", speakerIds: [], moderatorIds: [] },
        { id: "t2", title: "Module 1: Foundations", startTime: "09:15", durationMin: 60, description: "Theory + worked example.", speakerIds: [], moderatorIds: [] },
        { id: "t3", title: "Breakout Exercise 1", startTime: "10:30", durationMin: 45, description: "Table exercise with debrief.", speakerIds: [], moderatorIds: [] },
        { id: "t4", title: "Module 2: Applied Practice", startTime: "11:30", durationMin: 60, description: "Hands-on case work.", speakerIds: [], moderatorIds: [] },
        { id: "t5", title: "Breakout Exercise 2", startTime: "13:45", durationMin: 60, description: "Deeper case with peer feedback.", speakerIds: [], moderatorIds: [] },
        { id: "t6", title: "Wrap, Feedback & Certificates", startTime: "15:00", durationMin: 30, description: "Survey link displayed, certificate distribution.", speakerIds: [], moderatorIds: [] },
      ],
      breaks: [
        { id: "b1", label: "Arrivals & Materials Pickup", startTime: "08:30", durationMin: 30 },
        { id: "b2", label: "Coffee Break", startTime: "11:15", durationMin: 15 },
        { id: "b3", label: "Lunch", startTime: "12:30", durationMin: 75 },
      ],
      sponsors: [],
    }),
  },
  {
    id: "gala-dinner",
    label: "Gala Dinner",
    description: "Hosted dinner with welcome reception, course pacing, and entertainment.",
    aiGuidance:
      "This is a formal seated gala. Coordinate tightly with the venue F&B team — course service drives the show clock, not the other way around. Welcome reception, table call to seats, host walk-on between courses, headline speaker between main and dessert, entertainment after dessert, late-night call. Include a dietary requirements protocol at the table (allergens marked on covers) and a discreet sponsor mention woven into the host script.",
    seed: mk({
      name: "Annual Gala Dinner",
      type: "Gala Dinner",
      avRequirements:
        "Two follow-spots for stage, host lavalier + handheld for guest speakers, room wash with table uplighting, ambient music bed throughout dinner with louder presets for entrance and entertainment, single 16:9 screen for host visuals only (no slide deck content during service).",
      sessions: [
        { id: "t1", title: "Welcome Reception & Drinks", startTime: "18:30", durationMin: 60, description: "Arrivals, sponsor display, photographer roaming.", speakerIds: [], moderatorIds: [] },
        { id: "t2", title: "Call to Seats & Host Welcome", startTime: "19:30", durationMin: 15, description: "Host walk-on, welcome, charity mention.", speakerIds: [], moderatorIds: [] },
        { id: "t3", title: "Starter Service", startTime: "19:45", durationMin: 30, description: "F&B leads pacing; no programming.", speakerIds: [], moderatorIds: [] },
        { id: "t4", title: "Main Course & Headline Address", startTime: "20:15", durationMin: 45, description: "Main service with headline speaker mid-course.", speakerIds: [], moderatorIds: [] },
        { id: "t5", title: "Dessert & Entertainment", startTime: "21:00", durationMin: 45, description: "Dessert service with live entertainment act.", speakerIds: [], moderatorIds: [] },
        { id: "t6", title: "Host Wrap & After-Party", startTime: "21:45", durationMin: 15, description: "Closeout, thank-yous, after-party call.", speakerIds: [], moderatorIds: [] },
      ],
      breaks: [
        { id: "b1", label: "Welcome Drinks", startTime: "18:30", durationMin: 60 },
      ],
      sponsors: [
        { id: "sp1", name: "Headline Sponsor", placement: "Welcome reception signage + host mention in welcome + menu card lockup" },
      ],
    }),
  },
];

export function applyTemplate(template: EventTemplate, dateISO: string, newId: () => string): EventData {
  const seed = template.seed;
  return {
    ...seed,
    date: dateISO || seed.date,
    sessions: seed.sessions.map((s) => ({ ...s, id: newId() })),
    speakers: seed.speakers.map((p) => ({ ...p, id: newId() })),
    moderators: seed.moderators.map((p) => ({ ...p, id: newId() })),
    breaks: seed.breaks.map((b) => ({ ...b, id: newId() })),
    sponsors: seed.sponsors.map((sp) => ({ ...sp, id: newId() })),
    templateGuidance: template.aiGuidance,
  };
}
