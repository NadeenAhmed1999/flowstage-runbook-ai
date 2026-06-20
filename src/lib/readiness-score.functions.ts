import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { generateValidatedJSON } from "./ai-json.server";

const CategoryEnum = z.enum([
  "agenda",
  "speakers",
  "moderators",
  "av",
  "sponsors",
  "registration",
  "networking",
  "operational-risk",
  "contingency",
  "timeline",
]);

const CategoryScoreSchema = z.object({
  category: CategoryEnum,
  label: z.string().describe("Human readable category name"),
  score: z.number(),
  status: z.enum(["ready", "nearly-ready", "needs-attention", "high-risk"]),
  summary: z.string().describe("1-2 sentence assessment"),
  missingItems: z.array(z.string()),
  recommendedActions: z.array(z.string()),
});

const RiskSchema = z.object({
  severity: z.enum(["low", "medium", "high"]),
  title: z.string(),
  detail: z.string(),
});

const ReadinessSchema = z.object({
  overallScore: z.number().min(0).max(100),
  status: z.enum(["ready", "nearly-ready", "needs-attention", "high-risk"]),
  headline: z.string().describe("Short executive summary, 1-2 sentences"),
  confidence: z.enum(["low", "medium", "high"]),
  confidenceRationale: z.string().describe("Why this confidence level"),
  categories: z.array(CategoryScoreSchema),
  topRisks: z.array(RiskSchema),
});

export type ReadinessReport = z.infer<typeof ReadinessSchema>;
export type ReadinessCategory = z.infer<typeof CategoryScoreSchema>;
export type ReadinessRisk = z.infer<typeof RiskSchema>;

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
  templateGuidance: z.string().max(2000).optional(),
  hasRunSheet: z.boolean().optional(),
});

export const scoreReadiness = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<ReadinessReport> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const system = `You are a senior event production director computing an Event Readiness Score (0-100) for a live event plan. Score honestly as a working showcaller would in a pre-show readiness review — not as marketing copy.

Evaluate ALL 10 categories, each with a 0-100 score, status, missing items, and recommended actions:
1. agenda — "Agenda completeness"
2. speakers — "Speaker readiness" (bios, briefings, confirmations)
3. moderators — "Moderator readiness" (briefings, cues, Q&A management)
4. av — "AV and production preparation" (rehearsals, mic checks, IMAG, lower-thirds)
5. sponsors — "Sponsor deliverables" (cues, activation notes, signage)
6. registration — "Registration readiness" (staffing, badges, queues)
7. networking — "Networking & attendee experience" (break duration vs audience, flow)
8. operational-risk — "Operational risk coverage"
9. contingency — "Contingency planning" (delayed speaker, AV failure, weather)
10. timeline — "Timeline feasibility" (transition buffers, realistic durations)

Status mapping (use everywhere):
- 90-100 = ready
- 75-89  = nearly-ready
- 50-74  = needs-attention
- 0-49   = high-risk

Compute overallScore as a weighted blend of category scores (you may give slightly more weight to agenda, av, timeline, contingency). Set overall status from the same thresholds. Surface 3-6 topRisks across categories ordered by severity. Use real event-production terminology (rehearsal, mic check, transition buffer, FOH, comms, lower-third, walk-on, IMAG). Be specific — name session times or sponsor names when relevant.`;

    const prompt = `Score readiness for this event.

EVENT: ${data.eventName}
TYPE: ${data.eventType}
DATE: ${data.eventDate}
RUN SHEET GENERATED: ${data.hasRunSheet ? "yes" : "no"}

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
Return the structured Readiness Report.`;

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
- Include all 10 readiness categories.
- Use ONLY these status values: "ready", "nearly-ready", "needs-attention", "high-risk".
- Use ONLY these category keys: agenda, speakers, moderators, av, sponsors, registration, networking, operational-risk, contingency, timeline.
- Use ONLY these severity values: "low", "medium", "high".
- Scores must be integers between 0 and 100.
- Do NOT wrap the JSON in markdown fences or commentary.`;

      try {
        const { object } = await generateObject({
          model,
          schema: ReadinessSchema,
          system,
          prompt: prompt + repairNote,
        });
        return ReadinessSchema.parse(object);
      } catch (err) {
        lastError = err;
        // AI SDK attaches the raw model text on NoObjectGeneratedError
        const maybeText = (err as { text?: string } | null)?.text;
        if (typeof maybeText === "string") lastRawText = maybeText;
        if (attempt === MAX_ATTEMPTS) {
          throw new Error(
            `Readiness scoring failed after ${MAX_ATTEMPTS} attempts: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }
    }

    // Unreachable — loop either returns or throws.
    throw lastError instanceof Error ? lastError : new Error("Readiness scoring failed");
  });
