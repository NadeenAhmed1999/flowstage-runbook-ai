import { describe, expect, it } from "vitest";
import type { EventData } from "@/components/event-context";
import { resolveOps } from "@/lib/event-migrate";
import { avSummary } from "./av-summary";

function inventedEvent(): EventData {
  return { name: "Juniper Forum", type: "Conference", date: "2026-11-22", sessions: [], speakers: [], moderators: [], breaks: [], sponsors: [], avRequirements: "" };
}

describe("AV summary", () => {
  it("returns event AV notes without claiming readiness", () => {
    expect(avSummary({ ...inventedEvent(), avRequirements: "  Two handheld microphones\nProjector  " })).toEqual({ requirements: "Two handheld microphones\nProjector", parts: [], empty: false });
  });
  it("includes Main programme and component AV checklists with their own day", () => {
    const event = inventedEvent();
    event.components = [{ id: "opening", name: "Juniper opening", kind: "opening-ceremony", day: 2, startTime: "09:00", durationMin: 30, operationalRequirements: { av: ["Anthem playback"] } }];
    const ops = resolveOps(event);
    ops.parts = ops.parts.map(part => part.kind === "main" ? { ...part, checklists: { ...part.checklists, av: ["Lectern mic", "  "] } } : part);
    expect(avSummary({ ...event, ops }).parts).toEqual([
      { id: "part-main", name: "Main programme", day: 2, checklist: ["Lectern mic"] },
      { id: "part-opening", name: "Juniper opening", day: 2, checklist: ["Anthem playback"] },
    ]);
  });
  it("does not treat staffing or protocol as AV information", () => {
    const event = inventedEvent();
    event.components = [{ id: "opening", name: "Juniper opening", kind: "opening-ceremony", startTime: "09:00", durationMin: 30, operationalRequirements: { staffing: ["Showcaller"], protocol: ["Welcome guests"] } }];
    expect(avSummary(event)).toEqual({ requirements: "", parts: [], empty: true });
  });
  it("is empty when event notes and all part checklists are blank", () => {
    expect(avSummary({ ...inventedEvent(), avRequirements: " \n " }).empty).toBe(true);
  });
});
