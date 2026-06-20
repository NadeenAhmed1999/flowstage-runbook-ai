import { generateText, type LanguageModel } from "ai";
import type { z } from "zod";

/** Strip markdown fences and locate the JSON body in a raw model response. */
export function extractJSON(raw: string): unknown {
  let cleaned = raw
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const objStart = cleaned.indexOf("{");
    const arrStart = cleaned.indexOf("[");
    const isArray = arrStart !== -1 && (objStart === -1 || arrStart < objStart);
    const start = isArray ? arrStart : objStart;
    const end = isArray ? cleaned.lastIndexOf("]") : cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("No JSON object found in model output");
    cleaned = cleaned.slice(start, end + 1);
  }

  return JSON.parse(cleaned);
}

/**
 * Generate a structured object by prompting for JSON and validating with Zod.
 * Used when Gemini constrained-decoding rejects the schema (too many states).
 * Retries up to `maxAttempts`, feeding the previous error back into the prompt.
 */
export async function generateValidatedJSON<T extends z.ZodTypeAny>(opts: {
  model: LanguageModel;
  schema: T;
  system: string;
  prompt: string;
  repairInstructions: string;
  maxAttempts?: number;
  label: string;
}): Promise<z.infer<T>> {
  const { model, schema, system, prompt, repairInstructions, label } = opts;
  const maxAttempts = opts.maxAttempts ?? 3;

  let lastError: unknown = null;
  let lastRaw: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const repairBlock =
      attempt === 1
        ? ""
        : `\n\nPREVIOUS ATTEMPT FAILED VALIDATION.
Reason: ${lastError instanceof Error ? lastError.message : String(lastError)}
${lastRaw ? `Previous output (truncated):\n${lastRaw.slice(0, 1500)}\n` : ""}
${repairInstructions}`;

    const fullSystem = `${system}

OUTPUT FORMAT: Respond with a SINGLE valid JSON object only. No prose, no explanation, no markdown code fences. The first character of your response must be '{' and the last must be '}'.`;

    try {
      const { text } = await generateText({
        model,
        system: fullSystem,
        prompt: prompt + repairBlock,
      });
      lastRaw = text;
      const parsed = extractJSON(text);
      return schema.parse(parsed);
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts) {
        throw new Error(
          `${label} failed after ${maxAttempts} attempts: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${label} failed`);
}
