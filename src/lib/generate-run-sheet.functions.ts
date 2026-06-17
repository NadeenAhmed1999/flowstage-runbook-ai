import { createServerFn } from "@tanstack/react-start";
import { NoObjectGeneratedError, generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

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

function parseJsonText(text: string): unknown | undefined {
  const trimmed = text.trim();
  const lines = trimmed.split("\n");
  const withoutFences =
    lines[0]?.startsWith("```") && lines.at(-1)?.trim() === "```"
      ? lines.slice(1, -1).join("\n").trim()
      : trimmed;

  try {
    return JSON.parse(withoutFences);
  } catch {
    return undefined;
  }
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
    pickString(record.title) ?? pickString(record.session) ?? pickString(record.segment_title);
  if (!title) return null;

  const cueSource = [
    ...normalizeCueList(record.cues),
    ...normalizeCueList(record.audio),
    ...normalizeCueList(record.video),
    ...normalizeCueList(record.lighting),
    ...normalizeCueList(record.av_cues),
  ];

  const timelineBlock = {
    time: normalizeTime(record.time ?? record.time_start),
    durationMin: normalizeDuration(record.durationMin ?? record.duration),
    kind:
      typeof record.kind === "string" &&
      ["session", "transition", "break", "sponsor", "ops"].includes(record.kind)
        ? (record.kind as z.infer<typeof TimelineBlockSchema>["kind"])
        : inferTimelineKind(title),
    title,
    subtitle: pickString(record.subtitle) ?? pickString(record.stage_status),
    talent: pickString(record.talent),
    cues: cueSource,
    moderatorCue: pickString(record.moderatorCue),
    backstageNote:
      pickString(record.backstageNote) ??
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

  const hasTime = typeof record.time === "string" || typeof record.time_start === "string";
  const hasTitle = [record.title, record.session, record.segment, record.segment_title].some(
    (item) => typeof item === "string",
  );

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

function normalizeRunSheetPayload(raw: unknown, data: RunSheetInput): RunSheet {
  const direct = RunSheetSchema.safeParse(raw);
  if (direct.success) return direct.data;

  const envelope = Array.isArray(raw) ? raw[0] : raw;
  if (!envelope || typeof envelope !== "object") {
    throw new Error("AI returned JSON, but it did not contain a usable run sheet document.");
  }

  const record = envelope as Record<string, unknown>;
  const fallbackNotes = buildFallbackNotes(data);
  const timelineSource = findTimelineSource(record);

  const timeline = timelineSource
    .map((entry) => normalizeTimelineEntry(entry))
    .filter((entry): entry is z.infer<typeof TimelineBlockSchema> => entry !== null);

  if (timeline.length === 0) {
    throw new Error("AI returned JSON, but no usable timeline entries were found.");
  }

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
    timeline,
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


    try {
      const { object } = await generateObject({
        model,
        schema: RunSheetSchema,
        system,
        prompt,
      });

      return RunSheetSchema.parse(object);
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error) && error.text) {
        const parsed = parseJsonText(error.text);
        if (parsed !== undefined) {
          return normalizeRunSheetPayload(parsed, data);
        }
      }

      throw error;
    }
  });
