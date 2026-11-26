import { factsBlock } from "@/lib/ai-facts";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { generateValidatedJSON } from "./ai-json.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { capList, limitedValidator, normalizeBriefing } from "./ai-limits";

export const BRIEFING_AUDIENCES = [
  "speaker",
  "moderator",
  "production",
  "registration",
  "sponsor",
  "executive",
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
  partAssignments: z.string().optional(),
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
  registration: {
    recipient: "Registration & Front-of-House Team",
    focus:
      "Include only what registration / FOH staff need: door times, badge collection windows, VIP and speaker check-in handling, accessibility support, late-arrival policy during keynotes, signage placement, and escalation paths. EXCLUDE on-stage cues, sponsor commercials, and AV cue stack detail.",
  },
  executive: {
    recipient: "Executive Stakeholders & Leadership",
    focus:
      "Produce a one-page executive summary: event objective, headline programme moments, audience profile, key sponsor and partner outcomes, top operational risks with mitigation, and the moments leadership should personally attend. EXCLUDE granular cue calls, mic plots, and minute-by-minute timing.",
  },
};

export const generateBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(limitedValidator(InputSchema))
  .handler(async ({ data }): Promise<Briefing> => {
    const timeline = capList(data.timeline, 120);
    const sponsors = capList(data.sponsors, 40);
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const audienceMeta = AUDIENCE_BRIEFS[data.audience];

    const system = `You are a senior event operations director producing a single-audience briefing document. The document must read like a real, shareable briefing — calm, operational, no filler, no marketing language.

Audience: ${audienceMeta.recipient}.
Editorial rule: ${audienceMeta.focus}

Use specific times from the timeline. Keep section bodies tight (1–3 sentences). Reminders should be terse imperatives. Do NOT invent people or sessions that are not in the provided timeline. When an item has a "Part:" label, retain that part name whenever you mention the item in key moments or sections.`;

    const prompt = `EVENT: ${data.eventName}
TYPE: ${data.eventType}
DATE: ${data.eventDate}

PRODUCTION SUMMARY:
${data.productionSummary}

TIMELINE:
${timeline
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
${sponsors.map((s) => `- ${s.name} — ${s.placement}`).join("\n") || "None"}

AV POSTURE:
${data.avRequirements}
${data.partAssignments ? `\nPART ASSIGNMENTS (source agenda; retain the part name on these items):\n${data.partAssignments}\n` : ""}

Produce a professional ${audienceMeta.recipient} briefing.`;

    const result = await generateValidatedJSON({
      model,
      schema: BriefingSchema,
      system: system + factsBlock(timeline.filter(t => /session|panel|keynote|talk/i.test(t.kind)).map(t => ({ startTime: t.time, durationMin: t.durationMin, people: (t.talent ?? "").split(/[,;]/) })), false),
      prompt: `${prompt}\n\nReturn JSON: {audience, title, subtitle, recipient, headline, keyMoments: [{time, label, note?}] (1-8), sections: [{heading, body}] (3-7), reminders: string[] (2-8), contact}.`,
      repairInstructions: "Return one JSON object matching the shape exactly; keep keyMoments to at most 8, sections 3-7, reminders 2-8.",
      label: "briefing",
      fallbackSchema: z.unknown().transform((raw) => normalizeBriefing(raw, data.audience)),
    });
    return { ...result, audience: data.audience };
  });
