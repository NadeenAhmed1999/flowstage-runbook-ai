import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { extractJSON } from "./ai-json.server";

const TimelineBlockSchema = z.object({
  time: z.string().describe("HH:MM 24-hour format"),
  durationMin: z.number().int().nonnegative(),
  kind: z.enum(["session", "transition", "break", "sponsor", "ops"]),
  title: z.string(),
  subtitle: z.string().optional(),
  talent: z.string().optional(),
  cues: z.array(z.string()).describe("Short uppercase AV/stage cues like 'LAV x3 HOT', 'PLAY INTRO VIDEO'"),
  moderatorCue: z.string().optional().describe("Specific moderator script note"),
  backstageNote: z.string().optional().describe("Backstage coordination note"),
});

const NoteSchema = z.object({
  title: z.string(),
  detail: z.string(),
});

const RunSheetSchema = z.object({
  documentTitle: z.string(),
  productionSummary: z.string().describe("2-3 sentence executive summary of the show"),
  timeline: z.array(TimelineBlockSchema),
  avReminders: z.array(NoteSchema),
  backstageCoordination: z.array(NoteSchema),
  moderatorCues: z.array(NoteSchema),
  sponsorVisibility: z.array(NoteSchema),
  networkingBreaks: z.array(NoteSchema),
  productionNotes: z.array(NoteSchema),
  contingencyReminders: z.array(NoteSchema),
});
export type RunSheet = z.infer<typeof RunSheetSchema>;
type TimelineBlock = z.infer<typeof TimelineBlockSchema>;

const InputSchema = z.object({
  eventName: z.string().min(1).max(200),
  eventType: z.string().max(100),
  eventDate: z.string().max(50),
  eventEndDate: z.string().max(50).optional(),
  sessions: z.array(
    z.object({
      title: z.string(),
      startTime: z.string(),
      durationMin: z.number(),
      description: z.string().optional(),
      speakers: z.array(z.string()),
      moderators: z.array(z.string()),
      day: z.number().int().min(1).optional(),
    }),
  ),
  breaks: z.array(
    z.object({
      label: z.string(),
      startTime: z.string(),
      durationMin: z.number(),
      day: z.number().int().min(1).optional(),
    }),
  ),
  sponsors: z.array(z.object({ name: z.string(), placement: z.string() })),
  avRequirements: z.string().max(2000),
  templateGuidance: z.string().max(2000).optional(),
});


type RunSheetInput = z.infer<typeof InputSchema>;

function pickString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeTime(value: unknown): string {
  if (typeof value !== "string") return "00:00";
  const match = value.match(/\b\d{2}:\d{2}\b/);
  return match?.[0] ?? "00:00";
}

function normalizeDuration(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === "string") {
    const match = value.match(/\d+/);
    if (match) return Math.max(0, Number.parseInt(match[0], 10));
  }

  return 5;
}

function timeToMinutes(value: string): number {
  const [hours = "0", minutes = "0"] = normalizeTime(value).split(":");
  return Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10);
}

function minutesToTime(value: number): string {
  const wrapped = ((value % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60).toString().padStart(2, "0");
  const minutes = (wrapped % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function normalizeCueList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => pickString(item))
      .filter((item): item is string => Boolean(item));
  }

  if (typeof value !== "string") return [];

  return value
    .split(/;|\n|•/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.toUpperCase());
}

function inferTimelineKind(title: string): z.infer<typeof TimelineBlockSchema>["kind"] {
  const value = title.toLowerCase();

  if (value.includes("transition")) return "transition";
  if (value.includes("sponsor")) return "sponsor";
  if (
    value.includes("break") ||
    value.includes("coffee") ||
    value.includes("lunch") ||
    value.includes("networking")
  ) {
    return "break";
  }
  if (
    value.includes("registration") ||
    value.includes("house open") ||
    value.includes("call to seats") ||
    value.includes("walk-in") ||
    value.includes("walk in") ||
    value.includes("close") ||
    value.includes("egress") ||
    value.includes("hard out")
  ) {
    return "ops";
  }

  return "session";
}

function normalizeTimelineEntry(entry: unknown) {
  if (!entry || typeof entry !== "object") return null;
  const record = entry as Record<string, unknown>;
  const title =
    pickString(record.title) ??
    pickString(record.session) ??
    pickString(record.session_title) ??
    pickString(record.segment) ??
    pickString(record.segment_title) ??
    pickString(record.activity) ??
    pickString(record.event) ??
    pickString(record.label) ??
    pickString(record.name);
  if (!title) return null;

  const cueSource = [
    ...normalizeCueList(record.cues),
    ...normalizeCueList(record.audio),
    ...normalizeCueList(record.video),
    ...normalizeCueList(record.lighting),
    ...normalizeCueList(record.av_cues),
    ...normalizeCueList(record.avCues),
    ...normalizeCueList(record.cue),
  ];

  const timelineBlock = {
    time: normalizeTime(record.time ?? record.time_start ?? record.start_time ?? record.startTime),
    durationMin: normalizeDuration(
      record.durationMin ?? record.duration_min ?? record.durationMinutes ?? record.duration,
    ),
    kind:
      typeof record.kind === "string" &&
      ["session", "transition", "break", "sponsor", "ops"].includes(record.kind)
        ? (record.kind as z.infer<typeof TimelineBlockSchema>["kind"])
        : inferTimelineKind(title),
    title,
    subtitle: pickString(record.subtitle) ?? pickString(record.stage_status),
    talent: pickString(record.talent),
    cues: cueSource,
    moderatorCue: pickString(record.moderatorCue) ?? pickString(record.moderator_cue),
    backstageNote:
      pickString(record.backstageNote) ??
      pickString(record.backstage_note) ??
      pickString(record.backstage) ??
      pickString(record.notes),
  };

  const parsed = TimelineBlockSchema.safeParse(timelineBlock);
  return parsed.success ? parsed.data : null;
}

function deriveNotesFromTimeline(
  entries: unknown[],
  detailKeys: string[],
  fallbackTitle: string,
): z.infer<typeof NoteSchema>[] {
  return entries.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];

    const record = entry as Record<string, unknown>;
    const detail = detailKeys.map((key) => pickString(record[key])).find(Boolean);
    if (!detail) return [];

    const title =
      pickString(record.title) ??
      pickString(record.session) ??
      pickString(record.segment) ??
      pickString(record.segment_title) ??
      fallbackTitle;

    return [{ title, detail }];
  });
}

function looksLikeTimelineEntry(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;

  const hasTime = [record.time, record.time_start, record.start_time, record.startTime].some(
    (item) => typeof item === "string",
  );
  const hasTitle = [
    record.title,
    record.session,
    record.session_title,
    record.segment,
    record.segment_title,
    record.activity,
    record.event,
    record.label,
    record.name,
  ].some((item) => typeof item === "string");

  return hasTime && hasTitle;
}

function findTimelineSource(record: Record<string, unknown>): unknown[] {
  const explicitSources = [record.timeline, record.run_of_show, record.production_schedule, record.schedule];
  for (const source of explicitSources) {
    if (Array.isArray(source) && source.some(looksLikeTimelineEntry)) {
      return source;
    }
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value) && value.some(looksLikeTimelineEntry)) {
      return value;
    }
  }

  return [];
}

function collectTimelineEntries(value: unknown, depth = 0): unknown[] {
  if (depth > 4 || value == null) return [];

  if (Array.isArray(value)) {
    if (value.some(looksLikeTimelineEntry)) return value;
    for (const item of value) {
      const nested = collectTimelineEntries(item, depth + 1);
      if (nested.length > 0) return nested;
    }
    return [];
  }

  if (typeof value !== "object") return [];
  for (const nestedValue of Object.values(value as Record<string, unknown>)) {
    const nested = collectTimelineEntries(nestedValue, depth + 1);
    if (nested.length > 0) return nested;
  }

  return [];
}

function normalizeNoteArray(value: unknown): z.infer<typeof NoteSchema>[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const record = entry as Record<string, unknown>;
    const title = pickString(record.title) ?? pickString(record.label) ?? pickString(record.name);
    const detail =
      pickString(record.detail) ?? pickString(record.description) ?? pickString(record.notes);

    return title && detail ? [{ title, detail }] : [];
  });
}

function buildFallbackNotes(data: RunSheetInput) {
  return {
    avReminders: [
      {
        title: "FOH / video preset",
        detail:
          "Confirm mic plot, lower-thirds order, confidence monitor timer, sponsor loops, and captioning feed before doors.",
      },
      {
        title: "Core AV requirement",
        detail: data.avRequirements,
      },
    ],
    backstageCoordination: [
      {
        title: "Talent holding",
        detail:
          "Move the next speaker or panel to stage-left holding 10 minutes ahead of their call and confirm mic assignment before walk-on.",
      },
      {
        title: "Registration and front desk",
        detail:
          "Registration desk must stay staffed through opening remarks with one escalation lead handling badge reprints, VIP arrivals, and late check-ins.",
      },
    ],
    moderatorCues: data.sessions.flatMap((session) =>
      session.moderators.length > 0
        ? [
            {
              title: session.title,
              detail:
                "Moderator to hit the hard in/out, restate audience Q&A rules, and take wrap cues from stage management at 2 minutes remaining.",
            },
          ]
        : [],
    ),
    sponsorVisibility: data.sponsors.map((sponsor) => ({
      title: sponsor.name,
      detail: sponsor.placement,
    })),
    networkingBreaks: data.breaks.map((item) => ({
      title: item.label,
      detail:
        "Keep sponsor area, coffee service, and directional signage active while stage management resets the room for the next programmed block.",
    })),
    productionNotes: [
      {
        title: "Transition discipline",
        detail:
          "All mic swaps, chair resets, and talent escorts should happen on comms with stage-right and stage-left confirming ready status before the next walk-on.",
      },
      {
        title: "Show control",
        detail:
          "Treat sponsor acknowledgements, registration flow, breaks, and session timing as one integrated operating plan, not separate workstreams.",
      },
    ],
    contingencyReminders: [
      {
        title: "Spare audio path",
        detail:
          "Keep a live spare handheld at stage-left for immediate recovery from lav failure, battery issues, or a dead lectern mic.",
      },
      {
        title: "Deck / media backup",
        detail:
          "FOH should hold local PDF backups, sponsor loops, and a static event holding slide in case the primary playback machine drops.",
      },
    ],
  };
}

function createFallbackSummary(data: RunSheetInput): string {
  return `${data.eventName} is a professional ${data.eventType.toLowerCase()} run with ${data.sessions.length} programmed sessions, ${data.breaks.length} operational break windows, and ${data.sponsors.length} sponsor activations. Prioritize precise handoffs between registration, FOH, stage management, backstage holding, and sponsor-facing staff so the day stays calm, on-time, and presentation-ready.`;
}

function buildDeterministicTimeline(data: RunSheetInput): TimelineBlock[] {
  const dayCount = Math.max(
    1,
    ...data.sessions.map((session) => session.day ?? 1),
    ...data.breaks.map((item) => item.day ?? 1),
  );

  return Array.from({ length: dayCount }, (_, index) => index + 1).flatMap((day) => {
    const beats: TimelineBlock[] = [
      ...data.breaks
        .filter((item) => (item.day ?? 1) === day)
        .map((item) => ({
          time: normalizeTime(item.startTime),
          durationMin: normalizeDuration(item.durationMin),
          kind: "break" as const,
          title: dayCount > 1 ? `Day ${day}: ${item.label}` : item.label,
          cues: ["SIGNAGE LIVE", "FOH HOLDING MUSIC"],
          backstageNote: "Keep registration, sponsor area, and room reset leads on comms.",
        })),
      ...data.sessions
        .filter((session) => (session.day ?? 1) === day)
        .map((session) => ({
          time: normalizeTime(session.startTime),
          durationMin: normalizeDuration(session.durationMin),
          kind: inferTimelineKind(session.title),
          title: dayCount > 1 ? `Day ${day}: ${session.title}` : session.title,
          subtitle: session.description,
          talent: [...session.speakers, ...session.moderators].join(", ") || undefined,
          cues: ["LOWER THIRD READY", "MIC CHECK COMPLETE", "TIMER LIVE"],
          moderatorCue: session.moderators.length
            ? "Confirm opening question, Q&A rules, two-minute wrap, and hard-out cue."
            : undefined,
          backstageNote: "Talent to holding 10 minutes before walk-on; confirm mic assignment before stage entry.",
        })),
    ].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    if (beats.length === 0) return [];

    const timeline: TimelineBlock[] = [
      {
        time: minutesToTime(timeToMinutes(beats[0].time) - 30),
        durationMin: 30,
        kind: "ops",
        title: dayCount > 1 ? `Day ${day}: House open / room preset` : "House open / room preset",
        cues: ["HOUSE OPEN", "WALK-IN MUSIC", "SCREENS TO HOLDING SLIDE"],
        backstageNote: "FOH, stage manager, registration lead, and talent liaison confirm green status on comms.",
      },
    ];

    beats.forEach((beat, beatIndex) => {
      if (beatIndex > 0) {
        const previous = beats[beatIndex - 1];
        const previousEnd = timeToMinutes(previous.time) + previous.durationMin;
        const transitionDuration = Math.max(5, timeToMinutes(beat.time) - previousEnd);
        timeline.push({
          time: minutesToTime(previousEnd),
          durationMin: transitionDuration,
          kind: "transition",
          title: `Transition to ${beat.title.replace(/^Day \d+: /, "")}`,
          cues: ["RESET STAGE", "MIC SWAP", "NEXT TALENT TO HOLDING"],
          backstageNote: "Stage-left and stage-right confirm clear before next walk-on.",
        });
      }
      timeline.push(beat);
    });

    const last = beats.at(-1)!;
    timeline.push({
      time: minutesToTime(timeToMinutes(last.time) + last.durationMin),
      durationMin: 15,
      kind: "ops",
      title: dayCount > 1 ? `Day ${day}: Closeout / production reset` : "Closeout / production reset",
      cues: ["HOUSE LIGHTS UP", "WALK-OUT MUSIC", "RESET RECORDINGS"],
      backstageNote: "Collect packs, save show files, confirm sponsor and speaker follow-ups.",
    });

    return timeline;
  });
}

function buildFallbackRunSheet(data: RunSheetInput): RunSheet {
  return RunSheetSchema.parse({
    documentTitle: `Run-of-Show: ${data.eventName}`,
    productionSummary: createFallbackSummary(data),
    timeline: buildDeterministicTimeline(data),
    ...buildFallbackNotes(data),
  });
}

function normalizeRunSheetPayload(raw: unknown, data: RunSheetInput): RunSheet {
  const direct = RunSheetSchema.safeParse(raw);
  if (direct.success) return direct.data;

  const envelope = Array.isArray(raw) ? raw[0] : raw;
  if (!envelope || typeof envelope !== "object") {
    throw new Error("AI returned JSON, but it did not contain a usable run sheet document.");
  }

  const record = envelope as Record<string, unknown>;
  const fallbackNotes = buildFallbackNotes(data);
  const timelineSource = findTimelineSource(record).length
    ? findTimelineSource(record)
    : collectTimelineEntries(record);

  const timeline = timelineSource
    .map((entry) => normalizeTimelineEntry(entry))
    .filter((entry): entry is z.infer<typeof TimelineBlockSchema> => entry !== null);

  const safeTimeline = timeline.length > 0 ? timeline : buildDeterministicTimeline(data);

  const eventDetails =
    record.event_details && typeof record.event_details === "object"
      ? (record.event_details as Record<string, unknown>)
      : undefined;
  const eventInfo =
    record.event_info && typeof record.event_info === "object"
      ? (record.event_info as Record<string, unknown>)
      : undefined;
  const derivedAvReminders = deriveNotesFromTimeline(
    timelineSource,
    ["av_cues", "technical_notes", "av_backstage"],
    "AV cue",
  );
  const derivedBackstage = deriveNotesFromTimeline(
    timelineSource,
    ["backstage", "backstage_cues", "backstage_production", "av_backstage"],
    "Backstage",
  );
  const derivedModerator = deriveNotesFromTimeline(
    timelineSource,
    ["moderator_cue", "moderator_cues"],
    "Moderator cue",
  );
  const derivedSponsor = deriveNotesFromTimeline(
    timelineSource,
    ["sponsor_visibility"],
    "Sponsor visibility",
  );
  const derivedNetworking = deriveNotesFromTimeline(
    timelineSource,
    ["networking_instructions"],
    "Networking",
  );
  const derivedProduction = deriveNotesFromTimeline(
    timelineSource,
    ["production_notes", "notes", "technical_notes"],
    "Production note",
  );
  const derivedContingencies = deriveNotesFromTimeline(
    timelineSource,
    ["contingency"],
    "Contingency",
  );

  return RunSheetSchema.parse({
    documentTitle:
      pickString(record.documentTitle) ??
      pickString(eventDetails?.event_name) ??
      pickString(eventDetails?.title) ??
      pickString(eventInfo?.event_name) ??
      pickString(eventInfo?.title) ??
      `Run-of-Show: ${data.eventName}`,
    productionSummary: pickString(record.productionSummary) ?? createFallbackSummary(data),
    timeline: safeTimeline,
    avReminders: normalizeNoteArray(record.avReminders).length
      ? normalizeNoteArray(record.avReminders)
      : derivedAvReminders.length
        ? derivedAvReminders
      : fallbackNotes.avReminders,
    backstageCoordination: normalizeNoteArray(record.backstageCoordination).length
      ? normalizeNoteArray(record.backstageCoordination)
      : derivedBackstage.length
        ? derivedBackstage
      : fallbackNotes.backstageCoordination,
    moderatorCues: normalizeNoteArray(record.moderatorCues).length
      ? normalizeNoteArray(record.moderatorCues)
      : derivedModerator.length
        ? derivedModerator
      : fallbackNotes.moderatorCues,
    sponsorVisibility: normalizeNoteArray(record.sponsorVisibility).length
      ? normalizeNoteArray(record.sponsorVisibility)
      : derivedSponsor.length
        ? derivedSponsor
      : fallbackNotes.sponsorVisibility,
    networkingBreaks: normalizeNoteArray(record.networkingBreaks).length
      ? normalizeNoteArray(record.networkingBreaks)
      : derivedNetworking.length
        ? derivedNetworking
      : fallbackNotes.networkingBreaks,
    productionNotes: normalizeNoteArray(record.productionNotes).length
      ? normalizeNoteArray(record.productionNotes)
      : derivedProduction.length
        ? derivedProduction
      : fallbackNotes.productionNotes,
    contingencyReminders: normalizeNoteArray(record.contingencyReminders).length
      ? normalizeNoteArray(record.contingencyReminders)
      : derivedContingencies.length
        ? derivedContingencies
      : fallbackNotes.contingencyReminders,
  });
}

export const generateRunSheet = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<RunSheet> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const system = `You are a senior show caller and event operations director producing a professional run-of-show document for a live conference production team (stage managers, FOH audio, video, lighting, talent liaison, backstage runners).

Write with the precision, brevity, and tone of a real broadcast/show-calling document. Use industry terminology: FOH, walk-on, lower-third, IMAG, intercom/comms, green room, holding, stage-right/stage-left, hot mic, ISO cam, walk-up music, hard out, soft out, contingency, presets, gobo, wash, downstage center.

Build a detailed minute-by-minute timeline that includes house opens, walk-in, opening cue, every session, explicit TRANSITION blocks between sessions (set strikes, mic swaps, talent escorts), sponsor mentions placed naturally, networking breaks, and a close-out.

Cues should be short, uppercase, operational. Notes should sound like a working professional wrote them - not marketing copy.`;

    const isMultiDay = Boolean(data.eventEndDate && data.eventEndDate !== data.eventDate);
    const dayCount = isMultiDay
      ? Math.max(
          1,
          ...data.sessions.map((s) => s.day ?? 1),
          ...data.breaks.map((b) => b.day ?? 1),
        )
      : 1;

    const sessionsByDay = Array.from({ length: dayCount }, (_, i) => i + 1)
      .map((d) => {
        const lines =
          data.sessions
            .filter((s) => (s.day ?? 1) === d)
            .map(
              (s) =>
                `- ${s.startTime} (${s.durationMin}min) ${s.title}
  Speakers: ${s.speakers.join(", ") || "—"}
  Moderators: ${s.moderators.join(", ") || "—"}
  ${s.description ?? ""}`,
            )
            .join("\n") || "- (no sessions)";
        return isMultiDay ? `\n=== DAY ${d} ===\n${lines}` : lines;
      })
      .join("\n");

    const breaksByDay = Array.from({ length: dayCount }, (_, i) => i + 1)
      .map((d) => {
        const lines =
          data.breaks
            .filter((b) => (b.day ?? 1) === d)
            .map((b) => `- ${b.startTime} (${b.durationMin}min) ${b.label}`)
            .join("\n") || "- None";
        return isMultiDay ? `\n=== DAY ${d} ===\n${lines}` : lines;
      })
      .join("\n");

    const prompt = `Generate a production-ready run-of-show document for the following event:

EVENT: ${data.eventName}
TYPE: ${data.eventType}
DATE: ${data.eventDate}${isMultiDay ? ` → ${data.eventEndDate} (${dayCount}-day program)` : ""}

SESSIONS:
${sessionsByDay}

BREAKS:
${breaksByDay}

SPONSORS:
${data.sponsors.map((s) => `- ${s.name} — ${s.placement}`).join("\n") || "None"}

AV REQUIREMENTS:
${data.avRequirements || "Standard conference AV"}
${data.templateGuidance ? `\nEVENT-TYPE GUIDANCE (apply throughout the document):\n${data.templateGuidance}\n` : ""}
Produce the complete document. ${
      isMultiDay
        ? `This is a ${dayCount}-day program. Build the timeline day-by-day with a clear "DAY 1", "DAY 2"… header before each day's blocks. Each day starts 30 minutes before its first session with house open, includes explicit transition blocks between every session, and ends with a wrap/closeout for that day. Add an end-of-day reset / overnight handoff note where appropriate.`
        : `Make sure the timeline starts 30 minutes before the first session with house open, includes explicit transition blocks between every session, and ends with a closeout block.`
    }`;


    const outputInstructions = `
Return ONE valid JSON object with this exact top-level shape:
{
  "documentTitle": "string",
  "productionSummary": "string",
  "timeline": [{ "time": "HH:MM", "durationMin": 5, "kind": "session|transition|break|sponsor|ops", "title": "string", "subtitle": "string", "talent": "string", "cues": ["UPPERCASE CUE"], "moderatorCue": "string", "backstageNote": "string" }],
  "avReminders": [{ "title": "string", "detail": "string" }],
  "backstageCoordination": [{ "title": "string", "detail": "string" }],
  "moderatorCues": [{ "title": "string", "detail": "string" }],
  "sponsorVisibility": [{ "title": "string", "detail": "string" }],
  "networkingBreaks": [{ "title": "string", "detail": "string" }],
  "productionNotes": [{ "title": "string", "detail": "string" }],
  "contingencyReminders": [{ "title": "string", "detail": "string" }]
}
The timeline array must be top-level and must contain at least ${Math.max(3, data.sessions.length + data.breaks.length)} usable entries. Return JSON only; no markdown fences or commentary.`;

    const MAX_ATTEMPTS = 3;
    let lastError: unknown = null;
    let lastRawText: string | undefined;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const repairNote =
        attempt === 1
          ? ""
          : `\n\nPREVIOUS ATTEMPT FAILED.
Reason: ${lastError instanceof Error ? lastError.message : String(lastError)}
${lastRawText ? `Previous output (truncated):\n${lastRawText.slice(0, 1500)}\n` : ""}
Repair instructions:
- The "timeline" array MUST contain at least ${Math.max(3, data.sessions.length + data.breaks.length)} entries, one per show beat (house open, each session, each transition, each break, closeout).
- Each timeline entry MUST be an object with these EXACT keys: time (HH:MM string), durationMin (number), kind ("session" | "transition" | "break" | "sponsor" | "ops"), title (string), cues (array of short uppercase strings). Optional: subtitle, talent, moderatorCue, backstageNote.
- Do NOT nest the timeline inside "event_details", "event_info", or any other wrapper. It must be at the top level.
- Return ONLY the JSON object. No markdown fences, no commentary.`;

      try {
        const { text } = await generateText({
          model,
          system: `${system}\n\nOUTPUT FORMAT: Respond with a single JSON object only. The first character must be "{" and the last character must be "}".`,
          prompt: `${prompt}\n\n${outputInstructions}${repairNote}`,
        });
        lastRawText = text;
        return normalizeRunSheetPayload(extractJSON(text), data);
      } catch (error) {
        lastError = error;
        if (attempt === MAX_ATTEMPTS) {
          console.error(
            `Run sheet AI generation failed after ${MAX_ATTEMPTS} attempts; using deterministic fallback.`,
            lastError,
          );
          return buildFallbackRunSheet(data);
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Run sheet generation failed");
  });
