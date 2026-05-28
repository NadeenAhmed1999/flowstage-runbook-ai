import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const TimelineBlockSchema = z.object({
  time: z.string().describe("HH:MM 24-hour format"),
  durationMin: z.number().int().positive(),
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
  sessions: z.array(
    z.object({
      title: z.string(),
      startTime: z.string(),
      durationMin: z.number(),
      description: z.string().optional(),
      speakers: z.array(z.string()),
      moderators: z.array(z.string()),
    }),
  ),
  breaks: z.array(
    z.object({ label: z.string(), startTime: z.string(), durationMin: z.number() }),
  ),
  sponsors: z.array(z.object({ name: z.string(), placement: z.string() })),
  avRequirements: z.string().max(2000),
});

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

    const prompt = `Generate a production-ready run-of-show document for the following event:

EVENT: ${data.eventName}
TYPE: ${data.eventType}
DATE: ${data.eventDate}

SESSIONS:
${data.sessions
  .map(
    (s) =>
      `- ${s.startTime} (${s.durationMin}min) ${s.title}
  Speakers: ${s.speakers.join(", ") || "—"}
  Moderators: ${s.moderators.join(", ") || "—"}
  ${s.description ?? ""}`,
  )
  .join("\n")}

BREAKS:
${data.breaks.map((b) => `- ${b.startTime} (${b.durationMin}min) ${b.label}`).join("\n") || "None"}

SPONSORS:
${data.sponsors.map((s) => `- ${s.name} — ${s.placement}`).join("\n") || "None"}

AV REQUIREMENTS:
${data.avRequirements || "Standard conference AV"}

Produce the complete document. Make sure the timeline starts 30 minutes before the first session with house open, includes explicit transition blocks between every session, and ends with a closeout block.`;

    const { object } = await generateObject({
      model,
      schema: RunSheetSchema,
      system,
      prompt,
    });

    return object;
  });
