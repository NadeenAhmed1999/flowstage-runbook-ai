import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { generateValidatedJSON } from "./ai-json.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { capList, limitedValidator, normalizeCopilot } from "./ai-limits";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const ContextSchema = z.object({
  eventName: z.string(),
  eventType: z.string(),
  eventDate: z.string(),
  eventEndDate: z.string().optional(),
  audience: z.string().optional(),
  avRequirements: z.string().optional(),
  sessions: z.array(
    z.object({
      title: z.string(),
      startTime: z.string(),
      durationMin: z.number(),
      day: z.number().optional(),
      description: z.string().optional(),
      speakers: z.array(z.string()),
      moderators: z.array(z.string()),
    }),
  ),
  breaks: z.array(
    z.object({
      label: z.string(),
      startTime: z.string(),
      durationMin: z.number(),
      day: z.number().optional(),
    }),
  ),
  sponsors: z.array(z.object({ name: z.string(), placement: z.string() })),
  components: z
    .array(
      z.object({
        label: z.string(),
        name: z.string(),
        day: z.number().optional(),
        startTime: z.string(),
        durationMin: z.number(),
        venue: z.string().optional(),
        hosts: z.array(z.string()).optional(),
        aiContext: z.string().optional(),
      }),
    )
    .optional(),
  runSheet: z.unknown().optional(),
  readiness: z.unknown().optional(),
  smartReview: z.unknown().optional(),
});

const InputSchema = z.object({
  question: z.string().min(1).max(2000),
  context: ContextSchema,
  history: z.array(MessageSchema).max(20).optional(),
});

const AnswerSchema = z.object({
  answer: z
    .string()
    .describe(
      "Markdown answer to the user's question. Use short paragraphs, bullets, and bold for emphasis. Reference specific session times, speaker names, sponsors, or readiness categories when relevant. 2–6 short paragraphs maximum.",
    ),
  citations: z
    .array(z.string())
    .max(6)
    .describe(
      "Optional list of short evidence pointers, e.g. 'Session 10:05 — Regulatory Panel', 'Readiness · Contingency 42%'.",
    ),
  followUps: z
    .array(z.string())
    .max(4)
    .describe("2–4 short follow-up questions the user could ask next."),
});

export type CopilotAnswer = z.infer<typeof AnswerSchema>;

export const askCopilot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(limitedValidator(InputSchema, { maxString: 50_000 }))
  .handler(async ({ data }): Promise<CopilotAnswer> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI gateway not configured");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const ctx = {
      ...data.context,
      sessions: capList(data.context.sessions, 150),
      breaks: capList(data.context.breaks, 60),
      sponsors: capList(data.context.sponsors, 40),
      components: capList(data.context.components, 40),
    };

    const system = `You are the FlowStage Event Copilot — an expert event production director embedded inside a live planning workspace. You answer the operator's questions about THIS specific event using ONLY the data provided in the context block. Do not invent speakers, sessions, sponsors, times, or risks that are not in the data.

Voice: senior, calm, operational. Use real event-production terminology (rehearsal, mic check, transition buffer, walk-on, FOH, comms, lower-third, IMAG, soft out). Be specific — quote session times (HH:MM), speaker/sponsor names, and readiness categories.

If asked to generate a briefing or summary, produce it inline as concise markdown. If the data is insufficient to answer, say so directly and suggest what needs to be added to the plan.

Keep answers tight: short paragraphs, bullets where they help. Avoid filler and marketing language.`;

    const contextBlock = `EVENT
- Name: ${ctx.eventName}
- Type: ${ctx.eventType}
- Date: ${ctx.eventDate}${ctx.eventEndDate ? ` → ${ctx.eventEndDate}` : ""}
${ctx.audience ? `- Audience: ${ctx.audience}` : ""}

SESSIONS
${ctx.sessions
  .map(
    (s) =>
      `- ${s.startTime} (${s.durationMin}min)${s.day ? ` [Day ${s.day}]` : ""} ${s.title}
  Speakers: ${s.speakers.join(", ") || "—"}
  Moderators: ${s.moderators.join(", ") || "—"}
  ${s.description ?? ""}`,
  )
  .join("\n")}

BREAKS
${ctx.breaks.map((b) => `- ${b.startTime} (${b.durationMin}min)${b.day ? ` [Day ${b.day}]` : ""} ${b.label}`).join("\n") || "None"}

SPONSORS
${ctx.sponsors.map((s) => `- ${s.name} — ${s.placement}`).join("\n") || "None"}

EVENT COMPONENTS (modular programme blocks — treat as first-class parts of the event)
${
  ctx.components && ctx.components.length > 0
    ? ctx.components
        .map(
          (c) =>
            `- [${c.label}] "${c.name}"${c.day ? ` [Day ${c.day}]` : ""} · ${c.startTime} · ${c.durationMin}min${
              c.venue ? ` · ${c.venue}` : ""
            }${c.hosts && c.hosts.length ? ` · Hosts: ${c.hosts.join(", ")}` : ""}${
              c.aiContext ? `\n  Context: ${c.aiContext}` : ""
            }`,
        )
        .join("\n")
    : "None"
}

AV REQUIREMENTS
${ctx.avRequirements || "Standard conference AV"}

RUN SHEET (AI-generated production document, JSON)
${ctx.runSheet ? JSON.stringify(ctx.runSheet).slice(0, 12000) : "Not yet generated."}

READINESS REPORT (JSON)
${ctx.readiness ? JSON.stringify(ctx.readiness).slice(0, 6000) : "Not yet computed."}

SMART REVIEW FINDINGS (JSON)
${ctx.smartReview ? JSON.stringify(ctx.smartReview).slice(0, 6000) : "Not yet run."}`;

    const history = (data.history ?? [])
      .slice(-8)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n");

    const prompt = `${contextBlock}

${history ? `PRIOR CONVERSATION:\n${history}\n` : ""}
OPERATOR QUESTION:
${data.question}

Answer using only the event data above.`;

    return generateValidatedJSON({
      model,
      schema: AnswerSchema,
      system,
      prompt: `${prompt}\n\nReturn JSON: {answer: markdown string, citations: string[] (max 6), followUps: string[] (max 4)}.`,
      repairInstructions: "Return one JSON object with answer (string), citations (max 6 strings), followUps (max 4 strings).",
      label: "copilot",
      fallbackSchema: z.unknown().transform(normalizeCopilot),
    });
  });
