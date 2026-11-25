import { describe, expect, it } from "vitest";
import { z } from "zod";
import { assertAiInputSize, limitedValidator, normalizeBriefing, normalizeCopilot } from "./ai-limits";
import { friendlyAiError, AI_SIGN_IN_MESSAGE } from "./ai-errors";

describe("lenient AI fallbacks", () => {
  it("briefing: trims over-long arrays and fills missing optional fields", () => {
    const b = normalizeBriefing(
      { headline: "Calm day", keyMoments: Array.from({ length: 12 }, (_, i) => ({ time: "09:00", label: `M${i}` })),
        sections: Array.from({ length: 10 }, (_, i) => ({ heading: `H${i}`, body: "x" })),
        reminders: Array.from({ length: 11 }, (_, i) => `R${i}`) },
      "speaker",
    );
    expect(b.keyMoments).toHaveLength(8);
    expect(b.sections).toHaveLength(7);
    expect(b.reminders).toHaveLength(8);
    expect(b.title).toBe("Briefing");
    expect(b.contact).toBe("");
    expect(b.audience).toBe("speaker");
  });
  it("briefing: fails when nothing usable", () => {
    expect(() => normalizeBriefing({}, "speaker")).toThrow();
  });
  it("copilot: trims citations/followUps and fills missing", () => {
    const c = normalizeCopilot({ answer: "Yes", citations: ["a", "b", "c", "d", "e", "f", "g", "h"] });
    expect(c.citations).toHaveLength(6);
    expect(c.followUps).toEqual([]);
    expect(() => normalizeCopilot({ citations: [] })).toThrow();
  });
});

describe("AI input size limits", () => {
  const schema = z.object({ title: z.string(), items: z.array(z.string()) });
  it("rejects over-long strings, arrays and total size", () => {
    const v = limitedValidator(schema, { maxString: 10, maxArray: 3, maxJsonChars: 200 });
    expect(v({ title: "Gala", items: ["a"] }).title).toBe("Gala");
    expect(() => v({ title: "x".repeat(11), items: [] })).toThrow(/too long/);
    expect(() => v({ title: "a", items: ["1", "2", "3", "4"] })).toThrow(/Too many/);
    expect(() => assertAiInputSize({ t: "y".repeat(300) }, { maxString: 1000, maxArray: 10, maxJsonChars: 200 })).toThrow(/too large/);
  });
});

describe("friendly AI errors", () => {
  it("maps unauthorized to the sign-in message and hides detail otherwise", () => {
    expect(friendlyAiError(new Error("Unauthorized"), "x").message).toBe(AI_SIGN_IN_MESSAGE);
    const f = friendlyAiError(new Error("No object generated"), "Couldn't generate this briefing. Try again.");
    expect(f.message).toBe("Couldn't generate this briefing. Try again.");
    expect(f.detail).toBe("No object generated");
  });
});
