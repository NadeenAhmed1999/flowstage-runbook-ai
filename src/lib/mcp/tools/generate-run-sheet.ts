import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { generateRunSheet } from "@/lib/generate-run-sheet.functions";

const SessionSchema = z.object({
  title: z.string().describe("Session title, e.g. 'Opening Keynote'."),
  startTime: z.string().describe("24h start time, e.g. '09:00'."),
  durationMin: z.number().describe("Session length in minutes."),
  description: z.string().optional(),
  speakers: z.array(z.string()).describe("Speaker names."),
  moderators: z.array(z.string()).describe("Moderator names."),
  day: z.number().int().min(1).optional().describe("Day number for multi-day events."),
});

const BreakSchema = z.object({
  label: z.string(),
  startTime: z.string(),
  durationMin: z.number(),
  day: z.number().int().min(1).optional(),
});

export default defineTool({
  name: "generate_run_sheet",
  title: "Generate run-of-show",
  description:
    "Generate a professional, minute-by-minute run-of-show document for a conference, summit, panel, or corporate event. Returns a timeline with AV cues, transitions, moderator cues, backstage notes, sponsor visibility, and contingency reminders.",
  inputSchema: {
    eventName: z.string().describe("Event name."),
    eventType: z.string().describe("e.g. 'Healthcare Conference', 'Executive Summit'."),
    eventDate: z.string().describe("Event date, e.g. '2026-05-14'."),
    eventEndDate: z.string().optional().describe("End date for multi-day events."),
    sessions: z.array(SessionSchema).describe("Ordered list of sessions."),
    breaks: z.array(BreakSchema).default([]).describe("Networking / meal breaks."),
    sponsors: z
      .array(z.object({ name: z.string(), placement: z.string() }))
      .default([])
      .describe("Sponsors and where they appear (e.g. 'title', 'lunch', 'lanyard')."),
    avRequirements: z.string().default("").describe("AV setup notes."),
    templateGuidance: z.string().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: async (input) => {
    const runSheet = await generateRunSheet({
      data: {
        ...input,
        breaks: input.breaks ?? [],
        sponsors: input.sponsors ?? [],
        avRequirements: input.avRequirements ?? "",
      },
    });
    return {
      content: [{ type: "text", text: JSON.stringify(runSheet, null, 2) }],
      structuredContent: { runSheet },
    };
  },
});
