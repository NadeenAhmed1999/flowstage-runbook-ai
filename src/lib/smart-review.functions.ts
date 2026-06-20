import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const SeverityEnum = z.enum(["low", "medium", "high"]);

const FindingSchema = z.object({
  severity: SeverityEnum,
  category: z
    .string()
    .describe(
      "Short category like 'Timing', 'AV', 'Moderator', 'Sponsor', 'Rehearsal', 'Networking', 'Backstage', 'Contingency'",
    ),
  title: z.string().describe("Concise headline, max ~80 chars"),
  detail: z.string().describe("1-3 sentences explaining the risk and why it matters"),
  recommendation: z.string().describe("Concrete fix the production team should make"),
  relatedTime: z
    .string()
    .optional()
    .describe("Optional HH:MM reference to the affected moment in the run"),
});

const SmartReviewSchema = z.object({
  overallReadiness: z
    .enum(["ready", "needs-attention", "at-risk"])
    .describe("Overall production readiness assessment"),
  summary: z.string().describe("2-3 sentence executive summary of the review"),
  findings: z.array(FindingSchema),
});

export type SmartReviewFinding = z.infer<typeof FindingSchema>;
export type SmartReview = z.infer<typeof SmartReviewSchema>;

const InputSchema = z.object({
  eventName: z.string().min(1).max(200),
  eventType: z.string().max(100),
  eventDate: z.string().max(50),
  audience: z.string().max(200).optional(),
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
  templateGuidance: z.string().max(2000).optional(),
});

export const reviewRunSheet = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<SmartReview> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const system = `You are a senior event production director conducting a pre-show smart review of an event plan. Your job is to identify operational risks, missing details, timing issues, AV gaps, sponsor cue gaps, moderator/talent gaps, rehearsal gaps, and improvement opportunities BEFORE the show goes live.

Write findings as a working professional would in a pre-show readiness review — not marketing language. Use real event-production terminology (rehearsal, mic check, sound check, hold, soft out, hard out, transition buffer, talent escort, FOH, comms, walk-on, lower-third, run-through).

Assign severity honestly:
- high: would visibly break the show, cause a major delay, or embarrass talent/sponsors if unaddressed
- medium: meaningful operational risk; will likely cause friction or slippage
- low: polish / improvement opportunity

Cover at minimum: rehearsal & mic checks, transition buffers between sessions, break duration vs audience size, sponsor visibility cues, moderator briefings and cues, AV checks before panels/keynotes, backstage coordination, registration readiness, and contingencies. Only raise issues that actually apply to the plan provided. Aim for 6-12 findings.`;

    const prompt = `Review this event plan and produce a Smart Review.

EVENT: ${data.eventName}
TYPE: ${data.eventType}
DATE: ${data.eventDate}
${data.audience ? `AUDIENCE: ${data.audience}` : ""}

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
${data.templateGuidance ? `\nEVENT-TYPE GUIDANCE:\n${data.templateGuidance}\n` : ""}
Return the structured Smart Review.`;

    const MAX_ATTEMPTS = 3;
    let lastError: unknown = null;
    let lastRawText: string | undefined;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const repairNote =
        attempt === 1
          ? ""
          : `\n\nPREVIOUS ATTEMPT FAILED SCHEMA VALIDATION.
Reason: ${lastError instanceof Error ? lastError.message : String(lastError)}
${lastRawText ? `Previous output (truncated):\n${lastRawText.slice(0, 1500)}\n` : ""}
Repair instructions:
- Return ONLY valid JSON matching the schema exactly.
- overallReadiness must be one of: "ready", "needs-attention", "at-risk".
- Each finding.severity must be one of: "low", "medium", "high".
- Every finding must include severity, category, title, detail, and recommendation.
- Do NOT wrap the JSON in markdown fences or commentary.`;

      try {
        const { object } = await generateObject({
          model,
          schema: SmartReviewSchema,
          system,
          prompt: prompt + repairNote,
        });
        return SmartReviewSchema.parse(object);
      } catch (err) {
        lastError = err;
        const maybeText = (err as { text?: string } | null)?.text;
        if (typeof maybeText === "string") lastRawText = maybeText;
        if (attempt === MAX_ATTEMPTS) {
          throw new Error(
            `Smart Review failed after ${MAX_ATTEMPTS} attempts: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Smart Review failed");
  });
