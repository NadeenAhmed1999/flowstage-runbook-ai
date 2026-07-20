// Event component blueprints — modular pieces that make up a multi-component event.
// Each blueprint carries defaults + an AI prompt snippet the generator injects.

export const COMPONENT_KINDS = [
  "opening-ceremony",
  "closing-ceremony",
  "gala-dinner",
  "awards-ceremony",
  "welcome-reception",
  "networking-reception",
  "vip-dinner",
  "sponsor-exhibition",
  "product-showcase",
  "press-conference",
  "site-visit",
  "celebration-event",
] as const;

export type ComponentKind = (typeof COMPONENT_KINDS)[number];

export type ComponentBlueprint = {
  kind: ComponentKind;
  label: string;
  category: "Ceremonies" | "Receptions & Dining" | "Showcases & Media" | "Off-site";
  defaultDurationMin: number;
  defaultStart: string; // HH:MM
  defaultAV: string[];
  defaultStaffing: string[];
  defaultProtocol: string[];
  aiPromptSnippet: string;
  description: string;
};

export const COMPONENT_BLUEPRINTS: Record<ComponentKind, ComponentBlueprint> = {
  "opening-ceremony": {
    kind: "opening-ceremony",
    label: "Opening Ceremony",
    category: "Ceremonies",
    defaultDurationMin: 45,
    defaultStart: "09:00",
    defaultAV: ["Stage lighting hit on host walk-on", "Anthem playback preset", "IMAG center + wings", "Handheld + lavalier for host"],
    defaultStaffing: ["Stage manager", "Host wrangler", "VIP escort x2", "Photographer + videographer"],
    defaultProtocol: [
      "VIP arrival window and dedicated entrance",
      "Order of precedence for stage party",
      "Anthem / national protocol before opening remarks",
      "Photo call after ceremony",
    ],
    aiPromptSnippet:
      "Formal opening ceremony. Include VIP arrivals, order of precedence for stage party, anthem/national protocol if applicable, host walk-on with lighting hit, opening address, ribbon-cutting or ceremonial gesture, and a photo call immediately after. Keep the tone dignified.",
    description: "Formal launch with VIP protocol and stage-party choreography.",
  },
  "closing-ceremony": {
    kind: "closing-ceremony",
    label: "Closing Ceremony",
    category: "Ceremonies",
    defaultDurationMin: 30,
    defaultStart: "17:00",
    defaultAV: ["Playoff music preset", "Recap VT ready", "Host lavalier"],
    defaultStaffing: ["Stage manager", "Photographer", "VIP escort for chair handover"],
    defaultProtocol: ["Chair thank-yous", "Sponsor final acknowledgement", "Handover / save-the-date"],
    aiPromptSnippet:
      "Formal closing ceremony. Include recap VT, chair thank-yous to partners and delegates, sponsor closing acknowledgement, host handover or save-the-date for next edition, and a photo call.",
    description: "Formal close with thank-yous, recap, and handover.",
  },
  "gala-dinner": {
    kind: "gala-dinner",
    label: "Gala Dinner",
    category: "Receptions & Dining",
    defaultDurationMin: 180,
    defaultStart: "19:00",
    defaultAV: ["Two follow-spots", "Room wash with table uplighting", "Host lavalier + handheld", "Ambient music bed with entrance/entertainment presets"],
    defaultStaffing: ["Banquet captain", "F&B liaison", "MC / host", "Entertainment stage manager", "Photographer"],
    defaultProtocol: [
      "VIP seating chart signed off",
      "Allergen protocol at each table",
      "Charity / cause moment timing",
      "Course-service pacing drives the show clock",
    ],
    aiPromptSnippet:
      "Formal seated gala. F&B pacing drives the clock — do not schedule programming over course service. Include welcome reception, call to seats, host walk-on between courses, headline address between main and dessert, entertainment after dessert, and a late-night call. Include dietary allergen protocol at the table and a discreet sponsor mention woven into the host script.",
    description: "Formal seated dinner with course pacing, entertainment, and headline address.",
  },
  "awards-ceremony": {
    kind: "awards-ceremony",
    label: "Awards Ceremony",
    category: "Ceremonies",
    defaultDurationMin: 120,
    defaultStart: "19:30",
    defaultAV: [
      "Broadcast switcher w/ 4 cameras",
      "Follow-spot on winner walk-ups",
      "In-ear comms for host",
      "Playoff music presets per category",
      "Category VT playback",
    ],
    defaultStaffing: ["Show caller", "Trophy handler", "Winner walker / escort", "Step-and-repeat photographer", "Autocue operator"],
    defaultProtocol: [
      "Winners list embargoed until reveal",
      "90-second acceptance cap with soft playoff cue",
      "No-show contingency (read citation, hold trophy backstage)",
      "Step-and-repeat photography after each category",
    ],
    aiPromptSnippet:
      "Televised-style awards ceremony. Pre-show VT, host walk-on with playoff music, category VTs before each reveal, winner walk-up with spotlight follow, acceptance speech length cap of 90 seconds with soft playoff cue, ISO cam on winners' table. Build step-and-repeat photography time after each category. Include a no-show winner contingency.",
    description: "Broadcast-style show with category reveals, walk-ups, and playoff cues.",
  },
  "welcome-reception": {
    kind: "welcome-reception",
    label: "Welcome Reception",
    category: "Receptions & Dining",
    defaultDurationMin: 90,
    defaultStart: "18:00",
    defaultAV: ["Ambient music bed", "Sponsor loop on venue screens", "Handheld mic for optional welcome remarks"],
    defaultStaffing: ["Greeter team", "Bar captains", "Photographer roaming", "Registration escalation lead"],
    defaultProtocol: ["Badge check at door", "Sponsor signage active", "Photo backdrop staffed"],
    aiPromptSnippet:
      "Standing welcome reception the evening before or start of Day 1. Focus on greeting, badge collection, sponsor visibility, and casual introductions. Include optional 3-minute welcome remarks from the chair mid-way through, no formal programming otherwise.",
    description: "Pre-event standing reception with light programming.",
  },
  "networking-reception": {
    kind: "networking-reception",
    label: "Networking Reception",
    category: "Receptions & Dining",
    defaultDurationMin: 90,
    defaultStart: "17:30",
    defaultAV: ["Ambient music bed", "Sponsor lower-third loop on screens"],
    defaultStaffing: ["Bar captains", "Sponsor host per activation zone", "Photographer roaming"],
    defaultProtocol: ["Sponsor activation zones staffed", "Directional signage to bars and washrooms"],
    aiPromptSnippet:
      "End-of-day standing networking reception. Protect the networking window — no formal programming. Sponsor activation zones should be actively hosted, not passive booths. Coordinate flow between conference floor and reception space.",
    description: "Standing networking with active sponsor zones and no formal programming.",
  },
  "vip-dinner": {
    kind: "vip-dinner",
    label: "VIP Dinner",
    category: "Receptions & Dining",
    defaultDurationMin: 150,
    defaultStart: "19:30",
    defaultAV: ["Discreet room wash", "Wireless lavalier for host toast", "No public recording"],
    defaultStaffing: ["Concierge greeter", "Sommelier / F&B lead", "Discreet security"],
    defaultProtocol: [
      "Closed guest list, no press",
      "Seating chart approved by chair",
      "Chatham House Rule reminder before conversation",
      "No photography during dinner",
    ],
    aiPromptSnippet:
      "Closed VIP dinner. Invite-only, no press, no public recording. Concierge-led arrival, curated seating plan, Chatham House Rule reminder before conversation. Include a discreet host toast between courses; no formal programming otherwise.",
    description: "Closed-door VIP dinner with concierge protocol and Chatham House Rule.",
  },
  "sponsor-exhibition": {
    kind: "sponsor-exhibition",
    label: "Sponsor Exhibition",
    category: "Showcases & Media",
    defaultDurationMin: 480,
    defaultStart: "08:30",
    defaultAV: ["Booth power + AV drops per sponsor", "Directional signage from main hall", "Announcement PA to exhibition floor"],
    defaultStaffing: ["Exhibition floor manager", "Sponsor liaisons per zone", "Cleaning turn crew"],
    defaultProtocol: [
      "Booth build-in and safety sign-off before doors",
      "Sponsor lead-collection compliance",
      "Break-time driven traffic flow",
    ],
    aiPromptSnippet:
      "Sponsor exhibition floor open throughout the event day. Include build-in, safety sign-off before doors, live-throughout hours coordinated with break times for traffic, lunch-hour hosted booth demos, and structured tear-down at end-of-day. Coordinate lead-collection compliance across sponsors.",
    description: "Exhibition floor running throughout the event with booth activations.",
  },
  "product-showcase": {
    kind: "product-showcase",
    label: "Product Showcase",
    category: "Showcases & Media",
    defaultDurationMin: 60,
    defaultStart: "11:00",
    defaultAV: ["Demo station with HDMI + USB-C", "Recorded demo VT as failover", "Reveal lighting cue"],
    defaultStaffing: ["Demo lead", "Product SME on stand-by", "Media wrangler"],
    defaultProtocol: ["Embargo check before reveal", "Hands-on area staff briefed 60 min prior"],
    aiPromptSnippet:
      "Product showcase / demo moment. Include an embargo checkpoint before the reveal, a recorded VT failover if the live demo drops, reveal lighting cue, and immediate hands-on area opening with a staff briefing 60 minutes prior.",
    description: "Live product demonstration with failover VT and hands-on follow-through.",
  },
  "press-conference": {
    kind: "press-conference",
    label: "Press Conference",
    category: "Showcases & Media",
    defaultDurationMin: 45,
    defaultStart: "14:00",
    defaultAV: ["Podium mic + lavalier for chair", "Mult-box for broadcast feeds", "Branded backdrop with lockups"],
    defaultStaffing: ["Comms lead / moderator", "Press check-in desk", "Photographer + videographer"],
    defaultProtocol: [
      "Accredited media only",
      "Embargo notes distributed at check-in",
      "Moderated Q&A with selected outlets",
      "Post-conference 1:1 slots for tier-1 press",
    ],
    aiPromptSnippet:
      "Press conference for accredited media. Include media check-in with embargo paperwork, branded backdrop with sponsor lockups, mult-box for broadcast feeds, moderated Q&A limited to accredited outlets, and post-conference 1:1 slots for tier-1 press.",
    description: "Accredited-media briefing with mult-box, embargo, and post-1:1 slots.",
  },
  "site-visit": {
    kind: "site-visit",
    label: "Site Visit",
    category: "Off-site",
    defaultDurationMin: 180,
    defaultStart: "13:00",
    defaultAV: ["Whisper radios or tour guide packs", "Hi-vis vests / PPE where required"],
    defaultStaffing: ["Tour lead per group of 15", "Coach captain per bus", "Host contact at destination"],
    defaultProtocol: [
      "Coach transport confirmed with pickup / dropoff points",
      "PPE / access requirements confirmed with host site",
      "Head-count on/off each coach",
      "Weather contingency and alternative indoor plan",
    ],
    aiPromptSnippet:
      "Off-site tour or facility visit for a delegate group. Include coach transport with named pickup/dropoff points, head-count on/off each coach, whisper radios or tour packs for the group, PPE / access sign-off with the host site, and a weather contingency with an indoor fallback.",
    description: "Off-site facility tour with transport, PPE, and head-count discipline.",
  },
  "celebration-event": {
    kind: "celebration-event",
    label: "Celebration Event",
    category: "Ceremonies",
    defaultDurationMin: 120,
    defaultStart: "20:00",
    defaultAV: ["DJ or live band", "Dance-floor lighting rig", "Wireless handheld for host toasts"],
    defaultStaffing: ["Entertainment manager", "F&B lead", "Photographer"],
    defaultProtocol: ["Late-night noise curfew with venue", "Transport plan for delegates at close"],
    aiPromptSnippet:
      "Informal celebration or after-party. Live music or DJ, structured host toasts early, dance floor open after entertainment. Coordinate noise curfew with venue and delegate transport plan at close.",
    description: "Informal celebration with entertainment, toasts, and transport plan.",
  },
};

export const PRIMARY_EVENT_TYPES = [
  { id: "conference", label: "Conference" },
  { id: "summit", label: "Summit" },
  { id: "forum", label: "Forum" },
  { id: "workshop", label: "Workshop" },
  { id: "exhibition", label: "Exhibition" },
  { id: "annual-meeting", label: "Annual Meeting" },
  { id: "product-launch", label: "Product Launch" },
  { id: "other", label: "Other" },
] as const;

export type PrimaryEventType = (typeof PRIMARY_EVENT_TYPES)[number]["id"];

export function componentBlueprint(kind: ComponentKind): ComponentBlueprint {
  return COMPONENT_BLUEPRINTS[kind];
}
