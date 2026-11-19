import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { extractJSON } from "./ai-json.server";
import {
  RunSheetInputSchema as InputSchema,
  buildFallbackRunSheet,
  normalizeRunSheetPayload,
  type RunSheet,
} from "./run-sheet-parsing";

export type { RunSheet } from "./run-sheet-parsing";
import { buildRunSheetPrompt } from "./run-sheet-prompt";


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

    const prompt = buildRunSheetPrompt(data);


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
