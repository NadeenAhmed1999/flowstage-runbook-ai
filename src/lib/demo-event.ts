import type { EventData } from "@/components/event-context";
import type { RunSheet } from "@/lib/generate-run-sheet.functions";
import type { ReadinessReport } from "@/lib/readiness-score.functions";
import type { SmartReview } from "@/lib/smart-review.functions";

export const demoEvent: EventData = {
  name: "Helios Healthcare Innovation Summit 2026",
  type: "Healthcare Conference",
  date: "2026-04-22",
  speakers: [
    { id: "s1", name: "Dr. Amara Okonkwo", role: "Conference Chair · Helios Health Institute" },
    { id: "s2", name: "Dr. Rafael Mendes", role: "Director, National Digital Health Authority" },
    { id: "s3", name: "Prof. Ingrid Halvorsen", role: "Chair of Clinical AI, Karolinska" },
    { id: "s4", name: "Dr. Wei Zhang", role: "Head of Regulatory Strategy, AsiaPac Pharma" },
    { id: "s5", name: "Dr. Priya Anand", role: "Chief Medical Officer, Meridian Hospitals" },
    { id: "s6", name: "Dr. Tomás Herrera", role: "Lead Researcher, Genomic Frontiers Lab" },
    { id: "s7", name: "Sophie Laurent", role: "Senior Partner, Vance Health Ventures" },
  ],
  moderators: [
    { id: "m1", name: "Naomi Chen", role: "Health Policy Editor, The Lancet Forum" },
    { id: "m2", name: "Daniel Whitford", role: "Summit Program Director" },
  ],
  sessions: [
    {
      id: "se1",
      title: "Opening Remarks & Welcome",
      startTime: "09:00",
      durationMin: 10,
      description:
        "Conference Chair welcomes 480 delegates, frames the day's regulatory, clinical, and digital health agenda, and acknowledges title and strategic partners.",
      speakerIds: ["s1"],
      moderatorIds: [],
    },
    {
      id: "se2",
      title: "Keynote: The Next Decade of Digital Health",
      startTime: "09:10",
      durationMin: 35,
      description:
        "Policy keynote on national digital health strategy, interoperability mandates, and the regulatory roadmap for AI-enabled care.",
      speakerIds: ["s2"],
      moderatorIds: [],
    },
    {
      id: "se3",
      title: "Panel: Clinical AI — From Pilot to Standard of Care",
      startTime: "09:50",
      durationMin: 45,
      description:
        "Four-person panel exploring deployment of clinical AI, validation frameworks, and bedside adoption. 10 minutes reserved for audience Q&A.",
      speakerIds: ["s3", "s5", "s6"],
      moderatorIds: ["m1"],
    },
    {
      id: "se4",
      title: "Sponsor Spotlight: Meditrace Diagnostics",
      startTime: "11:10",
      durationMin: 10,
      description:
        "Branded 10-minute spotlight from the title sponsor on AI-enabled diagnostic deployments across three hospital networks.",
      speakerIds: [],
      moderatorIds: [],
    },
    {
      id: "se5",
      title: "Fireside Chat: Regulatory Pathways for Genomic Medicine",
      startTime: "11:25",
      durationMin: 35,
      description:
        "Two-chair fireside on cross-border regulatory reliance, real-world evidence, and accelerated review pathways for genomic therapies.",
      speakerIds: ["s4", "s6"],
      moderatorIds: ["m2"],
    },
    {
      id: "se6",
      title: "Workshop: Designing Patient-Centric Digital Pathways",
      startTime: "13:15",
      durationMin: 75,
      description:
        "Facilitated working session with break-out tables. Delegates map a patient journey across primary care, specialist referral, and remote monitoring.",
      speakerIds: ["s5"],
      moderatorIds: [],
    },
    {
      id: "se7",
      title: "Investor Forum: Funding the Next Wave of Health Innovation",
      startTime: "14:35",
      durationMin: 40,
      description:
        "Curated investor panel covering venture flow, exit dynamics, and the most defensible category bets across digital health, devices, and therapeutics.",
      speakerIds: ["s7"],
      moderatorIds: ["m2"],
    },
    {
      id: "se8",
      title: "Closing Remarks & Awards",
      startTime: "15:20",
      durationMin: 15,
      description:
        "Chair closes the program, presents the Helios Innovator of the Year award, and announces the 2027 host city.",
      speakerIds: ["s1"],
      moderatorIds: [],
    },
  ],
  breaks: [
    { id: "b0", label: "Registration & Welcome Coffee", startTime: "08:15", durationMin: 45 },
    { id: "b1", label: "Networking Coffee Break", startTime: "10:35", durationMin: 35 },
    { id: "b2", label: "Networking Lunch & Sponsor Pods", startTime: "12:00", durationMin: 75 },
  ],
  sponsors: [
    {
      id: "sp1",
      name: "Meditrace Diagnostics (Title)",
      placement: "Opening acknowledgement + dedicated 11:10 spotlight + lunch branding + mainstage lower-third lockup",
    },
    {
      id: "sp2",
      name: "Cedar Health Systems (Platinum)",
      placement: "Pre-keynote thank-you + lower-third during panel transitions + branded charging lounge",
    },
    {
      id: "sp3",
      name: "NovaPharma Global (Coffee Break Sponsor)",
      placement: "Branded signage and lower-third during 10:35 networking coffee break",
    },
    {
      id: "sp4",
      name: "Vance Health Ventures (Investor Forum Partner)",
      placement: "Investor Forum branding, partner-introduced session, and curated investor lounge",
    },
  ],
  avRequirements:
    "Mainstage with dual 16:9 projection screens and center IMAG. Four lavalier mics (panel), two handhelds for audience Q&A, one lectern gooseneck for keynote. Confidence monitor downstage center with speaker timer and next-cue prompt. FOH at rear-of-house with comms to stage manager, lighting, and video. Walk-on music presets for keynote, panel, fireside, workshop, and awards. Lower-thirds package preloaded in run order. Sponsor video loops queued for breaks. Live captioning feed for keynote and panel. Registration desk with 6 check-in stations, badge printers, overflow queue managers. Sponsor village with 8 pods adjacent to coffee service. Backup wireless mic kit and spare lav packs in green room.",
  templateGuidance:
    "Healthcare conference: regulatory sensitivity, clinical credibility, sponsor governance, and disclosure cues for every speaker.",
};

export const demoRunSheet: RunSheet = {
  documentTitle: "Run-of-Show: Helios Healthcare Innovation Summit 2026",
  productionSummary:
    "A single-day, single-stage healthcare summit for 480 senior delegates with two keynotes, a clinical AI panel, a regulatory fireside, an afternoon workshop, and an investor forum closing into an awards moment. Tight transitions, four sponsor activations across the day, and live captioning on all plenary content.",
  timeline: [
    {
      time: "08:30",
      durationMin: 30,
      kind: "ops",
      title: "House Opens · Walk-in Loop",
      subtitle: "Ambient music at FOH, sponsor reel on screens, ushers in position.",
      cues: ["LOOP VIDEO", "HOUSE 60%", "AMBIENT MIX -12dB"],
      backstageNote: "Confirm mic battery levels and assign lav packs to keynote and chair.",
    },
    {
      time: "08:55",
      durationMin: 5,
      kind: "transition",
      title: "Call to Seats",
      subtitle: "SM calls delegates from coffee area; doors close on cue.",
      cues: ["CHIME × 3", "HOUSE TO 30%", "WALK-ON MUSIC IN"],
    },
    {
      time: "09:00",
      durationMin: 10,
      kind: "session",
      title: "Opening Remarks & Welcome",
      subtitle: "Chair frames the day and acknowledges title and strategic partners.",
      talent: "Dr. Amara Okonkwo",
      cues: ["PLAY OPENING VIDEO", "SPOTLIGHT CENTER", "LECTERN MIC HOT"],
      backstageNote: "Escort Dr. Mendes (keynote) to stage-right wing at 09:05.",
    },
    {
      time: "09:10",
      durationMin: 35,
      kind: "session",
      title: "Keynote: The Next Decade of Digital Health",
      subtitle: "Policy keynote on digital health strategy and AI regulation.",
      talent: "Dr. Rafael Mendes",
      cues: ["KEYNOTE WASH", "CAM 1 LOCK", "LOWER-THIRD #2", "CAPTIONING ON"],
      moderatorCue: "Self-introduces; signal 5-minute and 1-minute warnings from FOH.",
    },
    {
      time: "09:45",
      durationMin: 5,
      kind: "transition",
      title: "Reset for Panel",
      subtitle: "Strike lectern, set four panel chairs, mic check on lavs.",
      cues: ["WALK-OFF MUSIC", "STRIKE LECTERN", "PANEL CHAIRS SET", "LAV × 4 PRE-CHECK"],
    },
    {
      time: "09:50",
      durationMin: 45,
      kind: "session",
      title: "Panel: Clinical AI — From Pilot to Standard of Care",
      subtitle: "Validation, adoption, and bedside reality. 10 min Q&A reserved.",
      talent: "Halvorsen, Anand, Herrera · Mod: Naomi Chen",
      cues: ["PANEL WASH UP", "LAV × 4 HOT", "Q&A HANDHELDS PREP"],
      moderatorCue: "Naomi opens with 30-second framing; takes hard out cue from FOH at 35-min mark for Q&A.",
    },
    {
      time: "10:35",
      durationMin: 35,
      kind: "break",
      title: "Networking Coffee Break · NovaPharma",
      subtitle: "Branded signage and lower-third active throughout.",
      cues: ["HOUSE 100%", "SPONSOR LOOP B", "AMBIENT MIX"],
    },
    {
      time: "11:08",
      durationMin: 2,
      kind: "sponsor",
      title: "Sponsor Acknowledgement · Meditrace",
      subtitle: "Chair reads prepared 30-second acknowledgement.",
      cues: ["SPONSOR LOWER-THIRD #1"],
      moderatorCue: "Read approved Meditrace copy verbatim, then introduce spotlight speaker.",
    },
    {
      time: "11:10",
      durationMin: 10,
      kind: "session",
      title: "Sponsor Spotlight: Meditrace Diagnostics",
      subtitle: "AI-enabled diagnostics across three hospital networks.",
      cues: ["PLAY SPONSOR VIDEO", "STAGE WASH", "LECTERN MIC HOT"],
    },
    {
      time: "11:20",
      durationMin: 5,
      kind: "transition",
      title: "Reset for Fireside",
      subtitle: "Two-chair set, low table, secondary wash up.",
      cues: ["TWO-CHAIR SETUP", "CAM 2 ISO", "LAV × 2 HOT"],
    },
    {
      time: "11:25",
      durationMin: 35,
      kind: "session",
      title: "Fireside: Regulatory Pathways for Genomic Medicine",
      subtitle: "Cross-border reliance, real-world evidence, accelerated review.",
      talent: "Dr. Wei Zhang & Dr. Tomás Herrera · Mod: Daniel Whitford",
      cues: ["FIRESIDE WASH", "CAM 2 ISO", "LOWER-THIRD #3"],
      moderatorCue: "Daniel opens with 45-second context; closes with one forward-looking question at 30-min mark.",
    },
    {
      time: "12:00",
      durationMin: 75,
      kind: "break",
      title: "Networking Lunch & Sponsor Pods",
      subtitle: "Cedar Health charging lounge active. All 8 sponsor pods staffed.",
      cues: ["HOUSE 100%", "SPONSOR LOOP A+B", "AMBIENT MIX"],
    },
    {
      time: "13:15",
      durationMin: 75,
      kind: "session",
      title: "Workshop: Patient-Centric Digital Pathways",
      subtitle: "Facilitated table work mapping cross-care journeys.",
      talent: "Dr. Priya Anand",
      cues: ["WORKSHOP WASH", "ROAMING MIC × 2", "TABLE TIMERS ON"],
      backstageNote: "Workshop facilitators briefed at 12:40 in green room A.",
    },
    {
      time: "14:30",
      durationMin: 5,
      kind: "transition",
      title: "Reset for Investor Forum",
      subtitle: "Strike workshop tables, restore theatre layout.",
      cues: ["HOUSE TO 30%", "INVESTOR PRESET", "LOWER-THIRD #4"],
    },
    {
      time: "14:35",
      durationMin: 40,
      kind: "session",
      title: "Investor Forum: Funding the Next Wave",
      subtitle: "Vance Health Ventures partner-introduced.",
      talent: "Sophie Laurent · Mod: Daniel Whitford",
      cues: ["INVESTOR WASH", "CAM 1 LOCK", "SPONSOR LOWER-THIRD #4"],
      moderatorCue: "Daniel reads Vance partner intro copy verbatim before the session opens.",
    },
    {
      time: "15:20",
      durationMin: 15,
      kind: "session",
      title: "Closing Remarks & Awards",
      subtitle: "Chair closes, presents Innovator of the Year, announces 2027 host city.",
      talent: "Dr. Amara Okonkwo",
      cues: ["AWARDS PRESET", "PLAY AWARDS VIDEO", "SPOTLIGHT CENTER"],
    },
    {
      time: "15:35",
      durationMin: 30,
      kind: "ops",
      title: "Hard Out · Egress & Sponsor Wind-Down",
      subtitle: "Outro music, sponsor reel, ushers direct egress.",
      cues: ["HOUSE 100%", "OUTRO MUSIC", "SPONSOR LOOP A"],
    },
  ],
  avReminders: [
    {
      title: "Captioning feed",
      detail: "Live captioning enabled for opening, keynote, panel, fireside, and closing. Confirm captioner is on comms by 08:45.",
    },
    {
      title: "Lower-thirds order",
      detail: "Lower-thirds package #1–#5 preloaded in run order. Verify Meditrace logo lockup before opening.",
    },
    {
      title: "RF coordination",
      detail: "10 wireless channels in play. RF check at 07:45 before doors. Spare lavalier and handheld in green room A.",
    },
  ],
  backstageCoordination: [
    {
      title: "Talent escort schedule",
      detail: "Next speaker moves to stage-right holding 10 minutes before call. SM confirms mic pack before walk-on.",
    },
    {
      title: "Workshop facilitators",
      detail: "Six table facilitators briefed at 12:40 in green room A; receive printed table prompts and timer cards.",
    },
    {
      title: "Awards handoff",
      detail: "Award trophy positioned stage-left at 15:15. Chair receives one-line bio for awardee on confidence monitor.",
    },
  ],
  moderatorCues: [
    {
      title: "Panel · Naomi Chen",
      detail: "Open with 30-second framing. Take hard out at the 35-minute mark to protect Q&A. Close on one forward-looking question.",
    },
    {
      title: "Fireside · Daniel Whitford",
      detail: "45-second context, two prepared questions, then open table. One closing question at the 30-minute mark.",
    },
    {
      title: "Investor Forum · Daniel Whitford",
      detail: "Read Vance partner intro verbatim. Reserve final 5 minutes for live audience questions.",
    },
  ],
  sponsorVisibility: [
    {
      title: "Meditrace (Title)",
      detail: "Opening acknowledgement, 11:10 spotlight, lunch branding, mainstage lockup throughout plenary.",
    },
    {
      title: "Cedar Health Systems (Platinum)",
      detail: "Pre-keynote thank-you, lower-third on panel transitions, branded charging lounge active all day.",
    },
    {
      title: "NovaPharma Global",
      detail: "Coffee break sponsor — signage and lower-third active throughout 10:35 break window.",
    },
    {
      title: "Vance Health Ventures",
      detail: "Investor forum partner-introduced, lower-third #4, curated investor lounge open from lunch onward.",
    },
  ],
  networkingBreaks: [
    {
      title: "10:35 coffee break",
      detail: "35 minutes for 480 delegates. Two coffee stations + sponsor pods staffed. Tight but workable with overflow signage.",
    },
    {
      title: "12:00 networking lunch",
      detail: "75-minute lunch overlaps with sponsor pod activation. Cedar charging lounge open.",
    },
  ],
  productionNotes: [
    {
      title: "Transition discipline",
      detail: "Every mic swap, chair reset, and talent escort happens on comms with stage-right and stage-left confirming ready.",
    },
    {
      title: "Show control",
      detail: "Sponsor acknowledgements, registration, breaks, and session timing run as one integrated plan, not separate workstreams.",
    },
  ],
  contingencyReminders: [
    {
      title: "Speaker delay",
      detail: "If Dr. Mendes keynote is delayed, Chair extends opening by 5 minutes and panel pulls forward by 5; FOH holds walk-on music.",
    },
    {
      title: "AV failure",
      detail: "Hold local PDF backups of all decks, sponsor loops, and a static event holding slide on FOH machine.",
    },
    {
      title: "Spare audio path",
      detail: "Live spare handheld at stage-left for instant recovery from lav failure or dead lectern mic.",
    },
  ],
};

export const demoReadiness: ReadinessReport = {
  overallScore: 84,
  status: "nearly-ready",
  headline:
    "Strong agenda, AV plan, and sponsor governance. Two operational gaps to close: panel rehearsal and registration peak-load staffing.",
  confidence: "high",
  confidenceRationale:
    "Run-of-show is complete, talent confirmed, sponsor placements signed off. Open items are scoped and assignable.",
  categories: [
    {
      category: "agenda",
      label: "Agenda completeness",
      score: 94,
      status: "ready",
      summary: "All sessions, transitions, breaks, and awards moment scheduled with realistic durations.",
      missingItems: [],
      recommendedActions: ["Lock final session abstracts for printed program by Mon."],
    },
    {
      category: "speakers",
      label: "Speaker readiness",
      score: 88,
      status: "nearly-ready",
      summary: "Bios and travel confirmed for 6 of 7 speakers. Dr. Herrera deck outstanding.",
      missingItems: ["Final keynote deck from Dr. Herrera"],
      recommendedActions: ["Chase Dr. Herrera deck by Wed; pre-flight on FOH machine Thu."],
    },
    {
      category: "moderators",
      label: "Moderator readiness",
      score: 86,
      status: "nearly-ready",
      summary: "Both moderators briefed. Panel pre-call not yet scheduled.",
      missingItems: ["30-min panel pre-call with Naomi + 3 panelists"],
      recommendedActions: ["Schedule virtual pre-call 48h before event."],
    },
    {
      category: "av",
      label: "AV & production",
      score: 82,
      status: "nearly-ready",
      summary: "Mainstage rig, captioning, lower-thirds and RF plan all in place. Tech rehearsal locked.",
      missingItems: ["Panel walk-through with all four mics hot"],
      recommendedActions: ["Add 20-min panel block to tech rehearsal at 17:30 day prior."],
    },
    {
      category: "sponsors",
      label: "Sponsor deliverables",
      score: 90,
      status: "ready",
      summary: "All four sponsors signed off. Title sponsor video master received.",
      missingItems: [],
      recommendedActions: ["Confirm NovaPharma signage placement with venue ops."],
    },
    {
      category: "registration",
      label: "Registration readiness",
      score: 68,
      status: "needs-attention",
      summary: "6 check-in stations planned; peak arrival window may exceed throughput for 480 delegates.",
      missingItems: ["Overflow queue staffing", "Badge reprint escalation lead"],
      recommendedActions: ["Add 2 floating staff for 08:15–08:45 peak.", "Assign explicit reprint lead."],
    },
    {
      category: "networking",
      label: "Networking & attendee experience",
      score: 80,
      status: "nearly-ready",
      summary: "Coffee break is workable at 35 min for 480 delegates if signage steers flow correctly.",
      missingItems: ["Directional signage between sponsor pods and coffee"],
      recommendedActions: ["Walk venue with sponsor lead Thursday to finalise signage."],
    },
    {
      category: "operational-risk",
      label: "Operational risk coverage",
      score: 82,
      status: "nearly-ready",
      summary: "Key risks identified, owners assigned. One unmitigated risk on speaker travel.",
      missingItems: ["Backup speaker for Investor Forum"],
      recommendedActions: ["Pre-brief Vance partner as warm backup if Sophie's travel slips."],
    },
    {
      category: "contingency",
      label: "Contingency planning",
      score: 86,
      status: "nearly-ready",
      summary: "Backup audio path, deck mirror, and speaker delay plan documented.",
      missingItems: [],
      recommendedActions: ["Print contingency one-pager for SM and FOH."],
    },
    {
      category: "timeline",
      label: "Timeline feasibility",
      score: 85,
      status: "nearly-ready",
      summary: "Transition buffers realistic. Lunch-to-workshop reset is the tightest window.",
      missingItems: [],
      recommendedActions: ["Brief workshop facilitators at 12:40 sharp to protect 13:15 start."],
    },
  ],
  topRisks: [
    {
      severity: "high",
      title: "Registration peak load",
      detail: "Six stations may not absorb 08:15–08:45 arrival peak for 480 delegates. Add floaters and a reprint lead.",
    },
    {
      severity: "medium",
      title: "Panel rehearsal not scheduled",
      detail: "Three-panelist + moderator session has no walk-through. Add a 20-min block to tech rehearsal day prior.",
    },
    {
      severity: "medium",
      title: "Herrera keynote deck outstanding",
      detail: "Deck not yet received. Pre-flight needed on FOH machine 24h prior to surface any media issues.",
    },
    {
      severity: "low",
      title: "Coffee break flow",
      detail: "Tight throughput at coffee break — directional signage between pods and coffee will reduce bunching.",
    },
  ],
};

export const demoReview: SmartReview = {
  overallReadiness: "needs-attention",
  summary:
    "Strong production plan with clear cues, sponsor governance, and contingency thinking. Close two operational gaps — panel rehearsal and registration peak staffing — to move to fully ready.",
  findings: [
    {
      severity: "high",
      category: "Registration",
      title: "Peak arrival window may exceed check-in throughput",
      detail:
        "Six check-in stations for 480 delegates with a 30-minute arrival peak risks visible queues that bleed into the keynote.",
      recommendation:
        "Add two floating staff at 08:15–08:45 and assign an explicit badge reprint escalation lead.",
      relatedTime: "08:15",
    },
    {
      severity: "medium",
      category: "Rehearsal",
      title: "No panel walk-through scheduled",
      detail:
        "The clinical AI panel has four mics hot, three panelists, and a moderator — but no walk-through is on the tech rehearsal call sheet.",
      recommendation:
        "Add a 20-minute panel block to tech rehearsal at 17:30 the day before, with all four lavs hot.",
      relatedTime: "09:50",
    },
    {
      severity: "medium",
      category: "AV",
      title: "Keynote deck pre-flight needed",
      detail:
        "Dr. Herrera's keynote deck has not been received. Without a 24h pre-flight on FOH, media issues will surface live.",
      recommendation:
        "Chase deck by Wednesday and pre-flight on FOH machine Thursday morning.",
      relatedTime: "09:10",
    },
    {
      severity: "medium",
      category: "Sponsor",
      title: "Sponsor acknowledgement script not in confidence monitor",
      detail:
        "Chair reads the Meditrace acknowledgement at 11:08 — copy is approved but not loaded into the confidence monitor.",
      recommendation:
        "Push approved sponsor copy to confidence monitor and provide printed backup.",
      relatedTime: "11:08",
    },
    {
      severity: "medium",
      category: "Moderator",
      title: "Moderator pre-call not scheduled",
      detail:
        "Naomi Chen needs a 30-minute pre-call with all three panelists to align on framing and Q&A discipline.",
      recommendation:
        "Schedule a virtual pre-call 48 hours before event with calendar invites and dial-in.",
    },
    {
      severity: "low",
      category: "Networking",
      title: "Coffee break flow may bunch",
      detail:
        "35 minutes for 480 delegates is workable, but pod-to-coffee flow lacks directional signage.",
      recommendation:
        "Walk venue with sponsor lead Thursday to finalise wayfinding.",
      relatedTime: "10:35",
    },
    {
      severity: "low",
      category: "Contingency",
      title: "Backup speaker not warm-briefed",
      detail:
        "Investor Forum has no warm backup if Sophie Laurent's travel slips.",
      recommendation:
        "Pre-brief the Vance partner as a warm backup with a one-page run sheet.",
      relatedTime: "14:35",
    },
  ],
};

export type SpeakerMatrixRow = {
  name: string;
  role: string;
  callTime: string;
  greenRoom: string;
  travel: "confirmed" | "tentative" | "arrived";
  bio: "received" | "pending";
  deck: "received" | "pending" | "n/a";
  rehearsal: "scheduled" | "not-scheduled" | "complete";
};

export const demoSpeakerMatrix: SpeakerMatrixRow[] = [
  { name: "Dr. Amara Okonkwo", role: "Chair / Awards", callTime: "08:00", greenRoom: "GR-A", travel: "arrived", bio: "received", deck: "received", rehearsal: "complete" },
  { name: "Dr. Rafael Mendes", role: "Keynote", callTime: "08:30", greenRoom: "GR-A", travel: "confirmed", bio: "received", deck: "received", rehearsal: "scheduled" },
  { name: "Prof. Ingrid Halvorsen", role: "Panelist", callTime: "09:15", greenRoom: "GR-B", travel: "confirmed", bio: "received", deck: "n/a", rehearsal: "scheduled" },
  { name: "Dr. Wei Zhang", role: "Fireside", callTime: "10:45", greenRoom: "GR-B", travel: "confirmed", bio: "received", deck: "n/a", rehearsal: "scheduled" },
  { name: "Dr. Priya Anand", role: "Panelist / Workshop", callTime: "09:15", greenRoom: "GR-B", travel: "confirmed", bio: "received", deck: "received", rehearsal: "scheduled" },
  { name: "Dr. Tomás Herrera", role: "Panelist / Fireside", callTime: "09:15", greenRoom: "GR-B", travel: "confirmed", bio: "received", deck: "pending", rehearsal: "not-scheduled" },
  { name: "Sophie Laurent", role: "Investor Forum", callTime: "14:00", greenRoom: "GR-A", travel: "tentative", bio: "received", deck: "received", rehearsal: "not-scheduled" },
  { name: "Naomi Chen", role: "Moderator · Panel", callTime: "09:00", greenRoom: "GR-A", travel: "confirmed", bio: "received", deck: "n/a", rehearsal: "scheduled" },
  { name: "Daniel Whitford", role: "Moderator · Fireside + Investor", callTime: "08:30", greenRoom: "GR-A", travel: "arrived", bio: "received", deck: "n/a", rehearsal: "complete" },
];

export type SponsorDeliverable = {
  sponsor: string;
  tier: "Title" | "Platinum" | "Gold" | "Partner";
  deliverable: string;
  due: string;
  progress: number;
  status: "on-track" | "at-risk" | "delivered";
};

export const demoSponsorDeliverables: SponsorDeliverable[] = [
  { sponsor: "Meditrace Diagnostics", tier: "Title", deliverable: "Mainstage logo lockup + 10-min spotlight video master", due: "Apr 18", progress: 100, status: "delivered" },
  { sponsor: "Meditrace Diagnostics", tier: "Title", deliverable: "Lunch branding signage proof", due: "Apr 17", progress: 92, status: "on-track" },
  { sponsor: "Cedar Health Systems", tier: "Platinum", deliverable: "Charging lounge furniture + wayfinding", due: "Apr 20", progress: 80, status: "on-track" },
  { sponsor: "Cedar Health Systems", tier: "Platinum", deliverable: "Lower-third asset (animated)", due: "Apr 16", progress: 100, status: "delivered" },
  { sponsor: "NovaPharma Global", tier: "Gold", deliverable: "Coffee break signage + sponsor read copy", due: "Apr 18", progress: 55, status: "at-risk" },
  { sponsor: "Vance Health Ventures", tier: "Partner", deliverable: "Investor Forum partner-intro script approval", due: "Apr 19", progress: 70, status: "on-track" },
  { sponsor: "Vance Health Ventures", tier: "Partner", deliverable: "Investor lounge curation list", due: "Apr 20", progress: 88, status: "on-track" },
];

export type OpsAlert = {
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  at: string;
};

export const demoOpsAlerts: OpsAlert[] = [
  { severity: "critical", title: "Registration staffing gap at peak window", detail: "Six check-in stations + 480 delegates + 30-minute peak. Two floaters required.", at: "09:42" },
  { severity: "warning", title: "Herrera keynote deck not received", detail: "Pre-flight blocked until deck arrives. Chase by Wednesday.", at: "09:18" },
  { severity: "warning", title: "NovaPharma signage proof outstanding", detail: "Sponsor copy approved; printed signage proof still in production.", at: "08:54" },
  { severity: "info", title: "Run-of-show v1.3 published", detail: "All department heads acknowledged within 9 minutes.", at: "08:22" },
];

export type DemoActivity = {
  actor: string;
  action: string;
  target: string;
  at: string;
  kind: "edit" | "publish" | "comment" | "cue" | "approval";
};

export const demoActivity: DemoActivity[] = [
  { actor: "Naomi Chen", action: "left a comment", target: "Panel · request 30-min pre-call with panelists", at: "09:51", kind: "comment" },
  { actor: "FlowStage AI", action: "flagged registration risk", target: "Helios Summit · peak arrival window", at: "09:42", kind: "cue" },
  { actor: "Daniel Whitford", action: "approved revision", target: "Helios Summit · Run-of-Show v1.3", at: "09:31", kind: "approval" },
  { actor: "FlowStage AI", action: "regenerated transitions", target: "Helios Summit · workshop → investor reset", at: "09:14", kind: "edit" },
  { actor: "Sponsor Ops", action: "uploaded asset", target: "Cedar Health · animated lower-third", at: "08:58", kind: "edit" },
  { actor: "Daniel Whitford", action: "published document", target: "Helios Summit · v1.2 → v1.3", at: "08:22", kind: "publish" },
];
