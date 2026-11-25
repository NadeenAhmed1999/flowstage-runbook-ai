import type { z } from "zod";

export type AiInputLimits = { maxJsonChars: number; maxString: number; maxArray: number };
export const DEFAULT_AI_LIMITS: AiInputLimits = { maxJsonChars: 300_000, maxString: 8_000, maxArray: 400 };

/** Rejects oversized AI inputs (total size, any string, any array) before schema parsing. */
export function assertAiInputSize(input: unknown, limits: AiInputLimits = DEFAULT_AI_LIMITS): void {
  let json: string;
  try {
    json = JSON.stringify(input) ?? "";
  } catch {
    throw new Error("Input too large or invalid");
  }
  if (json.length > limits.maxJsonChars) throw new Error(`Input too large (${json.length} > ${limits.maxJsonChars} chars)`);
  const walk = (v: unknown, path: string, depth: number): void => {
    if (depth > 12) throw new Error("Input too deeply nested");
    if (typeof v === "string") {
      if (v.length > limits.maxString) throw new Error(`Text too long at ${path || "input"} (max ${limits.maxString})`);
    } else if (Array.isArray(v)) {
      if (v.length > limits.maxArray) throw new Error(`Too many items at ${path || "input"} (max ${limits.maxArray})`);
      v.forEach((x, i) => walk(x, `${path}[${i}]`, depth + 1));
    } else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k, depth + 1);
    }
  };
  walk(input, "", 0);
}

/** Validator for AI server functions: size guard first, then the schema. */
export function limitedValidator<T extends z.ZodTypeAny>(schema: T, limits?: Partial<AiInputLimits>) {
  const l = { ...DEFAULT_AI_LIMITS, ...limits };
  return (input: unknown): z.infer<T> => {
    assertAiInputSize(input, l);
    return schema.parse(input);
  };
}

const strs = (v: unknown, max: number): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").slice(0, max) : [];
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);

/** Lenient briefing repair: trims arrays to max, fills missing optional fields. Throws if nothing usable. */
export function normalizeBriefing<A extends string>(raw: unknown, audience: A) {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const keyMoments = (Array.isArray(o["keyMoments"]) ? o["keyMoments"] : [])
    .filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
    .map((m) => ({ time: str(m["time"]), label: str(m["label"]), ...(typeof m["note"] === "string" ? { note: m["note"] } : {}) }))
    .filter((m) => m.label)
    .slice(0, 8);
  const sections = (Array.isArray(o["sections"]) ? o["sections"] : [])
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s) => ({ heading: str(s["heading"]), body: str(s["body"]) }))
    .filter((s) => s.heading || s.body)
    .slice(0, 7);
  const headline = str(o["headline"]);
  if (!sections.length && !keyMoments.length && !headline) throw new Error("Briefing had no usable content");
  return {
    audience,
    title: str(o["title"], "Briefing"),
    subtitle: str(o["subtitle"]),
    recipient: str(o["recipient"]),
    headline,
    keyMoments,
    sections,
    reminders: strs(o["reminders"], 8),
    contact: str(o["contact"]),
  };
}

/** Lenient Copilot repair: answer required; citations/followUps trimmed or empty. */
export function normalizeCopilot(raw: unknown) {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const answer = str(o["answer"]).trim();
  if (!answer) throw new Error("Copilot answer was empty");
  return { answer, citations: strs(o["citations"], 6), followUps: strs(o["followUps"], 4) };
}

/** Caps a list before prompting so big events cannot blow up the prompt. */
export const capList = <T,>(list: readonly T[] | undefined, max: number): T[] => (list ?? []).slice(0, max);
