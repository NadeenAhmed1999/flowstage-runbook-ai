import { describe, expect, it } from "vitest";
import { computeEventFacts, factsBlock } from "./ai-facts";

describe("computeEventFacts", () => {
  it("counts days, concurrency, sessions and unique people", () => {
    const f = computeEventFacts([
      { day: 1, startTime: "09:00", durationMin: 60, people: ["Ama Kesse"] },
      { day: 1, startTime: "09:30", durationMin: 30, people: ["ama kesse", "Bruno Tal"] },
      { day: 2, startTime: "09:00", durationMin: 60, people: [] },
    ]);
    expect(f).toEqual({ days: 2, maxConcurrent: 2, totalSessions: 3, speakers: 2 });
  });
  it("back-to-back sessions are not concurrent", () => {
    expect(computeEventFacts([{ startTime: "09:00", durationMin: 60 }, { startTime: "10:00", durationMin: 30 }]).maxConcurrent).toBe(1);
  });
  it("block includes the anti-invention rule", () => {
    expect(factsBlock([])).toContain("Do not invent counts.");
  });
});
