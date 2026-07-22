import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { generateValidatedJSON } from "./ai-json.server";

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
  components: z
    .array(
      z.object({
        label: z.string(),
        name: z.string(),
        day: z.number().optional(),
        startTime: z.string(),
        durationMin: z.number(),
        venue: z.string().optional(),
        expectedAttendees: z.number().optional(),
        hosts: z.array(z.string()).optional(),
        av: z.array(z.string()).optional(),
        staffing: z.array(z.string()).optional(),
        protocol: z.array(z.string()).optional(),
        aiContext: z.string().optional(),
      }),
    )
    .optional(),
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
${
  data.components && data.components.length > 0
    ? `\nEVENT COMPONENTS (modular programme blocks — treat as first-class parts of the same event):\n${data.components
        .map(
          (c) =>
            `- [${c.label}] "${c.name}" · Day ${c.day ?? 1} · ${c.startTime} · ${c.durationMin}min${
              c.venue ? ` · ${c.venue}` : ""
            }${c.expectedAttendees ? ` · ${c.expectedAttendees} pax` : ""}\n  Hosts: ${(c.hosts ?? []).join(", ") || "—"}\n  AV: ${(c.av ?? []).join("; ") || "—"}\n  Staffing: ${(c.staffing ?? []).join("; ") || "—"}\n  Protocol: ${(c.protocol ?? []).join("; ") || "—"}${c.aiContext ? `\n  Context: ${c.aiContext}` : ""}`,
        )
        .join("\n")}\nReview each component for gaps in AV, staffing, protocol, VIP handling, sponsor visibility, transition buffers to/from the main programme, and contingency. Raise findings by component when relevant (reference the component name).\n`
    : ""
}
${data.templateGuidance ? `\nEVENT-TYPE GUIDANCE:\n${data.templateGuidance}\n` : ""}
Return the structured Smart Review.`;

    return generateValidatedJSON({
      model,
      schema: SmartReviewSchema,
      system,
      prompt,
      label: "Smart Review",
      repairInstructions: `Repair instructions:
- Return ONLY valid JSON matching the schema exactly.
- Top-level keys: overallReadiness, summary, findings.
- overallReadiness must be one of: "ready", "needs-attention", "at-risk".
- Each finding.severity must be one of: "low", "medium", "high".
- Every finding must include: severity, category, title, detail, recommendation. Optional: relatedTime (HH:MM).`,
    });
  });
