import { describe, expect, it } from "vitest";
import { seedEvent, type EventData } from "@/components/event-context";
import { overviewSummary, isExampleEvent, formatOverviewDateRange } from "./overview-summary";

function inventedEvent(): EventData {
  return {
    name: "Willow Research Forum", type: "Conference", date: "2026-11-21",
    sessions: [{ id: "session-willow", title: "Research exchange", startTime: "09:00", durationMin: 45, description: "", speakerIds: ["person-ada"], moderatorIds: ["person-robin"] }],
    speakers: [{ id: "person-ada", name: "Ada Vale", role: "Researcher" }],
    moderators: [{ id: "person-robin", name: "Robin Reed", role: "Host" }],
    breaks: [{ id: "break-willow", label: "Coffee", startTime: "09:45", durationMin: 15 }],
    sponsors: [], components: [], avRequirements: "",
  };
}

describe("Overview summary", () => {
  it("counts a one-part event without inventing any extra programme", () => {
    expect(overviewSummary(inventedEvent())).toMatchObject({ sessions: 1, people: 2, breaks: 1, days: 1, partCount: 1, empty: false });
  });
  it("counts inclusive calendar days for a multi-day event", () => {
    expect(overviewSummary({ ...inventedEvent(), endDate: "2026-11-23" }).days).toBe(3);
  });
  it("counts agenda days even when dates have not been supplied", () => {
    const event = inventedEvent();
    expect(overviewSummary({ ...event, date: "", sessions: event.sessions.map(session => ({ ...session, day: 4 })) }).days).toBe(4);
  });
  it("counts parts and each part's own sessions", () => {
    const event = inventedEvent();
    event.components = [{ id: "opening-willow", name: "Opening", kind: "opening-ceremony", day: 1, startTime: "08:30", durationMin: 30 }];
    event.sessions = event.sessions.map(session => ({ ...session, partId: "part-opening-willow" }));
    const summary = overviewSummary(event);
    expect(summary.partCount).toBe(2);
    expect(summary.parts.map(part => part.sessions)).toEqual([0, 1]);
  });
  it("is empty only when both sessions and components are absent", () => {
    const event = { ...inventedEvent(), sessions: [] };
    expect(overviewSummary(event).empty).toBe(true);
    expect(overviewSummary({ ...event, components: [{ id: "reception-willow", name: "Reception", kind: "networking-reception", startTime: "17:00", durationMin: 60 }] }).empty).toBe(false);
  });
  it("recognizes the untouched built-in seed", () => {
    expect(isExampleEvent(seedEvent, null)).toBe(true);
  });
  it("never labels a saved seed as example", () => {
    expect(isExampleEvent(seedEvent, "saved-willow")).toBe(false);
  });
  it("never labels an edited event as example", () => {
    expect(isExampleEvent({ ...seedEvent, name: "Willow Research Forum" }, null)).toBe(false);
  });
  it("never labels an imported event, including an exact copy of the seed, as example", () => {
    expect(isExampleEvent(inventedEvent(), null)).toBe(false);
    expect(isExampleEvent(structuredClone(seedEvent), null)).toBe(false);
  });
  it("formats calendar dates in the requested locale without shifting the day", () => {
    const event = inventedEvent();
    expect(formatOverviewDateRange(event, "en-GB")).toBe("21 Nov 2026");
    expect(formatOverviewDateRange(event, "en-US")).toBe("Nov 21, 2026");
    expect(formatOverviewDateRange({ ...event, date: "2026-02-30" })).toBe("Date not specified");
  });
});