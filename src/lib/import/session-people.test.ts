import { describe, expect, it } from "vitest";
import { AiFallbackMappedEventSchema, MappedEventSchema, type MappedEvent } from "../excel-import.functions";
import { mergeSessionPersonRoles } from "./session-people";

const input = () => ({
  name: "Invented Forum",
  sessions: [{
    title: "Opening discussion", startTime: "09:00", day: 1,
    speakers: [" Mira Vale ", { name: " Tomas Reed ", role: "Director" }, { name: "" }, null, {}, 7],
    moderators: [{ name: " Lena Park " }, { name: " ", role: "Chair" }],
  }],
  breaks: [], confidence: { overall: 0.7 },
});

describe("AI session people normalization", () => {
  it("accepts strings and objects and outputs trimmed string arrays without empty or invalid names", () => {
    const event: MappedEvent = MappedEventSchema.parse(input());
    const names: string[] | undefined = event.sessions[0]?.speakers;
    expect(names).toEqual(["Mira Vale", "Tomas Reed"]);
    expect(event.sessions[0]?.moderators).toEqual(["Lena Park"]);
  });

  it("preserves object roles in the validated AI fallback's matching rosters", () => {
    const event = AiFallbackMappedEventSchema.parse(input());
    expect(event.sessions[0]?.speakers).toEqual(["Mira Vale", "Tomas Reed"]);
    expect(event.speakers).toEqual([{ name: "Mira Vale", role: "" }, { name: "Tomas Reed", role: "Director" }]);
    expect(event.moderators).toEqual([{ name: "Lena Park", role: "" }]);
  });
});

describe("session role roster merge", () => {
  it("adds roles and missing people, ignores blanks and merges case-insensitive names without duplicates", () => {
    const event = { speakers: [{ name: "Mira Vale", role: "" }], moderators: [] };
    const result = mergeSessionPersonRoles(event, [{
      speakers: [{ name: " mira VALE ", role: " Director " }, "MIRA VALE", { name: "", role: "Ignore" }],
      moderators: [{ name: "Lena Park", role: "Chair" }, { name: "lena park", role: "Other" }],
    }]);
    expect(result.speakers).toEqual([{ name: "Mira Vale", role: "Director" }]);
    expect(result.moderators).toEqual([{ name: "Lena Park", role: "Chair" }]);
    expect(event.speakers[0]?.role).toBe("");
  });

  it("keeps an existing non-empty role and merges duplicates already in the roster", () => {
    const result = mergeSessionPersonRoles({
      speakers: [{ name: "Tomas Reed", role: " Original director " }, { name: "tomas reed", role: "Duplicate" }],
      moderators: [{ name: "Lena Park", role: "Host" }],
    }, [{ speakers: [{ name: "TOMAS REED", role: "New role" }], moderators: [{ name: "lena park", role: "Chair" }] }]);
    expect(result.speakers).toEqual([{ name: "Tomas Reed", role: "Original director" }]);
    expect(result.moderators).toEqual([{ name: "Lena Park", role: "Host" }]);
  });
});