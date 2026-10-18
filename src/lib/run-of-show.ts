import type { EventData, Session, Break } from "@/components/event-context";

export type CueChip = { label: string; tone: "accent" | "navy" | "muted" };

export type TimelineRow = {
  time: string;
  durationMin: number;
  kind: "session" | "break" | "sponsor" | "ops";
  title: string;
  subtitle?: string;
  talent?: string;
  talentSub?: string;
  cues: CueChip[];
  moderationNote?: string;
  backstageNote?: string;
};

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function cuesForSession(s: Session, speakerCount: number): CueChip[] {
  const cues: CueChip[] = [];
  const title = s.title.toLowerCase();

  if (title.includes("keynote") || title.includes("opening")) {
    cues.push({ label: "PLAY INTRO VIDEO", tone: "accent" });
    cues.push({ label: "SPOTLIGHT CENTER", tone: "navy" });
  }
  if (title.includes("panel")) {
    cues.push({ label: "PANEL WASH UP", tone: "accent" });
    cues.push({ label: `LAV × ${Math.max(2, speakerCount + 1)} HOT`, tone: "navy" });
  }
  if (title.includes("fireside")) {
    cues.push({ label: "TWO-CHAIR SETUP", tone: "accent" });
    cues.push({ label: "CAM 2 ISO", tone: "navy" });
  }
  if (cues.length === 0) {
    cues.push({ label: "STAGE WASH", tone: "accent" });
    cues.push({ label: "LAV ON", tone: "navy" });
  }
  return cues;
}

export function buildTimeline(event: EventData) {
  const peopleMap = new Map(
    [...event.speakers, ...event.moderators].map((p) => [p.id, p]),
  );

  const rows: TimelineRow[] = [];

  // No invented rows: the timeline shows only what the event data actually contains.

  // Sessions
  for (const s of event.sessions) {
    const speakerNames = s.speakerIds.map((id) => peopleMap.get(id)?.name).filter(Boolean) as string[];
    const moderatorNames = s.moderatorIds.map((id) => peopleMap.get(id)?.name).filter(Boolean) as string[];

    rows.push({
      time: s.startTime,
      durationMin: s.durationMin,
      kind: "session",
      title: s.title,
      subtitle: s.description,
      talent: speakerNames.join(" + ") || "—",
      talentSub: moderatorNames.length ? `Mod: ${moderatorNames.join(", ")}` : undefined,
      cues: cuesForSession(s, speakerNames.length),
      moderationNote: moderatorNames.length
        ? `${moderatorNames[0]} opens with 30-second framing; reserve final 5 minutes for audience Q&A.`
        : "Speaker self-introduces; signal 5-minute and 1-minute warnings from FOH.",
      backstageNote: `Escort ${speakerNames[0] || "speaker"} to stage-right wing 10 minutes prior.`,
    });
  }

  // Breaks
  for (const b of event.breaks) {
    rows.push({
      time: b.startTime,
      durationMin: b.durationMin,
      kind: "break",
      title: b.label,
      subtitle: `${b.durationMin} min — refreshments in foyer`,
      cues: [
        { label: "HOUSE 100%", tone: "muted" },
        { label: "AMBIENT MIX", tone: "accent" },
      ],
    });
  }

  // Sponsor mentions — place each at a sensible slot
  event.sponsors.forEach((sp, i) => {
    const anchor = event.sessions[i] ?? event.sessions[0];
    if (!anchor) return;
    const time = addMinutes(anchor.startTime, -3);
    rows.push({
      time,
      durationMin: 2,
      kind: "sponsor",
      title: `Sponsor Mention — ${sp.name}`,
      subtitle: sp.placement,
      cues: [{ label: "SPONSOR LOWER-THIRD", tone: "accent" }],
      moderationNote: `Read prepared 30-second acknowledgement for ${sp.name}.`,
    });
  });

  return rows.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}
