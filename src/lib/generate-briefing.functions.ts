import { createServerFn } from "@tanstack/react-start";
import { NoObjectGeneratedError, generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

export const BRIEFING_AUDIENCES = [
  "speaker",
  "moderator",
  "production",
  "sponsor",
] as const;
export type BriefingAudience = (typeof BRIEFING_AUDIENCES)[number];

const SectionSchema = z.object({
  heading: z.string(),
  body: z.string().describe("Short paragraph or single bullet — 1–3 sentences."),
});

const TimelineItemSchema = z.object({
  time: z.string().describe("HH:MM"),
  label: z.string(),
  note: z.string().optional(),
});

const BriefingSchema = z.object({
  audience: z.enum(BRIEFING_AUDIENCES),
  title: z.string(),
  subtitle: z.string(),
  recipient: z.string().describe("Who specifically this brief is for, e.g. 'Keynote Speakers' or 'FOH / Stage Management'."),
  headline: z.string().describe("Single sentence framing the day from this audience's perspective."),
  keyMoments: z.array(TimelineItemSchema).min(1).max(8),
  sections: z.array(SectionSchema).min(3).max(7),
  reminders: z.array(z.string()).min(2).max(8),
  contact: z.string().describe("Single line — who to find on the day."),
});
export type Briefing = z.infer<typeof BriefingSchema>;

const InputSchema = z.object({
  audience: z.enum(BRIEFING_AUDIENCES),
  eventName: z.string(),
  eventType: z.string(),
  eventDate: z.string(),
  productionSummary: z.string(),
  timeline: z.array(
    z.object({
      time: z.string(),
      durationMin: z.number(),
      kind: z.string(),
      title: z.string(),
      subtitle: z.string().optional(),
      talent: z.string().optional(),
      cues: z.array(z.string()),
      moderatorCue: z.string().optional(),
      backstageNote: z.string().optional(),
    }),
  ),
  sponsors: z.array(z.object({ name: z.string(), placement: z.string() })),
  avRequirements: z.string(),
});

const AUDIENCE_BRIEFS: Record<BriefingAudience, { recipient: string; focus: string }> = {
  speaker: {
    recipient: "Speakers & Keynote Talent",
    focus:
      "Include only what a speaker needs: arrival window, green-room location, mic type, walk-on cue, stage layout, time-on-stage, what the moderator will do, Q&A handling, and who escorts them. EXCLUDE backstage cue calls, sponsor placement logistics, FOH wiring, and contingency ops.",
  },
  moderator: {
    recipient: "Moderators",
    focus:
      "Include only what a moderator needs: which sessions they own, framing language, hard in/out timing, who they introduce, sponsor acknowledgements they read, Q&A discipline, and how stage management signals time. EXCLUDE technical AV setup and sponsor commercials they don't read.",
  },
  production: {
    recipient: "Production, AV & Stage Management",
    focus:
      "Include show-calling detail: house open, mic plot, video presets, lower-thirds order, transition choreography, intercom calls, backstage holding, and contingency. EXCLUDE soft narrative content and speaker biographies.",
  },
  sponsor: {
    recipient: "Sponsors & Partner Activations",
    focus:
      "Include only sponsor-relevant content: branded moments, on-stage acknowledgements, signage and lower-third placements, sponsor area activation windows, networking touchpoints, and the speakers/decision-makers in the room. EXCLUDE internal cue calls and unrelated session detail.",
  },
};

export const generateBriefing = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<Briefing> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const audienceMeta = AUDIENCE_BRIEFS[data.audience];

    const system = `You are a senior event operations director producing a single-audience briefing document. The document must read like a real, shareable briefing — calm, operational, no filler, no marketing language.

Audience: ${audienceMeta.recipient}.
Editorial rule: ${audienceMeta.focus}

Use specific times from the timeline. Keep section bodies tight (1–3 sentences). Reminders should be terse imperatives. Do NOT invent people or sessions that are not in the provided timeline.`;

    const prompt = `EVENT: ${data.eventName}
TYPE: ${data.eventType}
DATE: ${data.eventDate}

PRODUCTION SUMMARY:
${data.productionSummary}

TIMELINE:
${data.timeline
  .map(
    (b) =>
      `- ${b.time} (${b.durationMin}min) [${b.kind.toUpperCase()}] ${b.title}${
        b.talent ? ` — Talent: ${b.talent}` : ""
      }${b.subtitle ? ` // ${b.subtitle}` : ""}${
        b.cues.length ? ` // CUES: ${b.cues.join(", ")}` : ""
      }${b.moderatorCue ? ` // MOD: ${b.moderatorCue}` : ""}${
        b.backstageNote ? ` // BACKSTAGE: ${b.backstageNote}` : ""
      }`,
  )
  .join("\n")}

SPONSORS:
${data.sponsors.map((s) => `- ${s.name} — ${s.placement}`).join("\n") || "None"}

AV POSTURE:
${data.avRequirements}

Produce a professional ${audienceMeta.recipient} briefing.`;

    try {
      const { object } = await generateObject({
        model,
        schema: BriefingSchema,
        system,
        prompt,
      });
      return BriefingSchema.parse({ ...object, audience: data.audience });
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error(
          `Briefing generation failed: ${error.message ?? "model returned no usable object"}`,
        );
      }
      throw error;
    }
  });
