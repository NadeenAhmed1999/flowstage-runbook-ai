import { describe, expect, it } from "vitest";
import { eventFromOps, type EventData } from "@/components/event-context";
import { resolveOps } from "@/lib/event-migrate";
import { talentSummary } from "./talent-summary";

function inventedEvent(): EventData {
  return { name: "Juniper Forum", type: "Conference", date: "2026-11-22", sponsors: [], breaks: [], avRequirements: "",
    speakers: [{ id: "fern", name: "Fern Vale", role: "Researcher" }, { id: "reed", name: "Reed Moss", role: "Guest" }],
    moderators: [{ id: "fern", name: "Fern Vale", role: "Researcher" }],
    sessions: [
      { id: "talk", title: "Garden research", day: 2, startTime: "10:00", durationMin: 30, description: "", speakerIds: ["fern"], moderatorIds: ["fern"] },
      { id: "empty", title: "Open discussion", startTime: "09:00", durationMin: 20, description: "", speakerIds: [], moderatorIds: [] },
    ] };
}

describe("Talent summary", () => {
  it("counts real roster roles and sessions without speakers, deduplicating dual roles", () => {
    expect(talentSummary(inventedEvent())).toMatchObject({ speakers: 2, moderators: 1, sessionsWithoutSpeaker: 1 });
    const fern = talentSummary(inventedEvent()).people.find(person => person.id === "fern");
    expect(fern).toMatchObject({ name: "Fern Vale", role: "Researcher", duties: ["Speaker", "Moderator"], sessions: [{ title: "Garden research", day: 2, start: "10:00", end: "10:30", partName: undefined }] });
  });
  it("keeps unassigned roster members without inventing assignments or organisations", () => {
    expect(talentSummary(inventedEvent()).people.find(person => person.id === "reed")).toMatchObject({ sessions: [], organisation: undefined });
  });
  it("uses saved operational organisations, moderators and multi-part assignments", () => {
    const event = inventedEvent();
    event.components = [{ id: "opening", name: "Garden opening", kind: "opening-ceremony", startTime: "08:00", durationMin: 30 }];
    event.sessions = event.sessions.map(session => ({ ...session, partId: "part-opening" }));
    const ops = resolveOps(event);
    ops.people = ops.people.map(person => ({ ...person, organisation: "Juniper Institute" }));
    const saved = eventFromOps(event, ops);
    expect(talentSummary(saved).people.find(person => person.id === "fern")).toMatchObject({ organisation: "Juniper Institute", sessions: [{ day: 2, partName: "Garden opening" }] });
  });
  it("ignores dangling speaker references when counting missing assignments", () => {
    const event = inventedEvent();
    event.sessions = event.sessions.map(session => ({ ...session, speakerIds: ["missing"] }));
    expect(talentSummary(event).sessionsWithoutSpeaker).toBe(2);
  });
  it("counts saved sessions without origin metadata and uses operational assignments", () => {
    const event = inventedEvent();
    const ops = resolveOps(event);
    ops.items = ops.items.map(({ origin: _origin, ...item }) => ({ ...item, speakers: { state: "unknown" } }));
    const saved = eventFromOps(event, ops);
    expect(talentSummary(saved).sessionsWithoutSpeaker).toBe(2);
  });
  it("has an empty roster without inserting sample people", () => {
    expect(talentSummary({ ...inventedEvent(), speakers: [], moderators: [], sessions: [] })).toEqual({ people: [], speakers: 0, moderators: 0, sessionsWithoutSpeaker: 0 });
  });
});
