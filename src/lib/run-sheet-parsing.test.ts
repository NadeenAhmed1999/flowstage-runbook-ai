import { describe, it, expect } from "vitest";
import {
  buildFallbackRunSheet,
  normalizeRunSheetPayload,
  RunSheetSchema,
  type RunSheetInput,
} from "./run-sheet-parsing";
import { extractJSON } from "./ai-json.server";

const baseInput: RunSheetInput = {
  eventName: "FlowStage Summit",
  eventType: "Conference",
  eventDate: "2026-09-12",
  sessions: [
    {
      title: "Opening Keynote",
      startTime: "09:30",
      durationMin: 45,
      description: "Welcome and vision",
      speakers: ["Ada Lovelace (CEO)"],
      moderators: ["Grace Hopper (Host)"],
    },
    {
      title: "Panel: Future of Live Events",
      startTime: "10:30",
      durationMin: 50,
      speakers: ["Alan Turing (CTO)"],
      moderators: ["Grace Hopper (Host)"],
    },
  ],
  breaks: [{ label: "Coffee Break", startTime: "11:30", durationMin: 20 }],
  sponsors: [{ name: "Acme", placement: "Lobby booth" }],
  avRequirements: "2x lav, 1x handheld, FOH timer",
};

describe("normalizeRunSheetPayload", () => {
  it("returns the fallback run sheet when AI JSON is null", () => {
    const sheet = normalizeRunSheetPayload(null, baseInput);
    expect(RunSheetSchema.safeParse(sheet).success).toBe(true);
    expect(sheet.timeline.length).toBeGreaterThanOrEqual(3);
  });

  it("returns the fallback when AI JSON is a primitive", () => {
    const sheet = normalizeRunSheetPayload("nope", baseInput);
    expect(sheet.timeline.length).toBeGreaterThanOrEqual(3);
  });

  it("returns the fallback when envelope is an empty object", () => {
    const sheet = normalizeRunSheetPayload({}, baseInput);
    expect(sheet.timeline.length).toBeGreaterThanOrEqual(3);
  });

  it("falls back to deterministic timeline when timeline array is empty", () => {
    const sheet = normalizeRunSheetPayload(
      { documentTitle: "X", timeline: [] },
      baseInput,
    );
    expect(sheet.timeline.length).toBeGreaterThanOrEqual(3);
  });

  it("falls back when every timeline entry is invalid (no title)", () => {
    const sheet = normalizeRunSheetPayload(
      { timeline: [{ time: "09:00" }, { foo: "bar" }, 42, null] },
      baseInput,
    );
    expect(sheet.timeline.length).toBeGreaterThanOrEqual(3);
    // deterministic fallback always starts with house open / preset
    expect(sheet.timeline[0].kind).toBe("ops");
  });

  it("recovers timeline nested under event_details wrappers", () => {
    const sheet = normalizeRunSheetPayload(
      {
        event_details: {
          schedule: [
            {
              start_time: "09:30",
              session_title: "Opening Keynote",
              duration_min: 45,
              av_cues: ["LAV HOT", "TIMER LIVE"],
            },
          ],
        },
      },
      baseInput,
    );
    expect(sheet.timeline.length).toBeGreaterThanOrEqual(1);
    expect(sheet.timeline[0].title).toBe("Opening Keynote");
    expect(sheet.timeline[0].time).toBe("09:30");
  });

  it("uses an array envelope's first object", () => {
    const sheet = normalizeRunSheetPayload(
      [{ timeline: [{ time: "10:00", title: "Session A", duration: "30" }] }],
      baseInput,
    );
    expect(sheet.timeline[0].title).toBe("Session A");
  });

  it("never produces an empty timeline regardless of input shape", () => {
    const inputs: unknown[] = [
      undefined,
      null,
      0,
      "",
      [],
      {},
      { timeline: null },
      { timeline: [] },
      { timeline: [{}] },
      { production_schedule: "not an array" },
      { event_info: { schedule: [] } },
    ];
    for (const raw of inputs) {
      const sheet = normalizeRunSheetPayload(raw, baseInput);
      expect(sheet.timeline.length).toBeGreaterThan(0);
      expect(RunSheetSchema.safeParse(sheet).success).toBe(true);
    }
  });
});

describe("buildFallbackRunSheet", () => {
  it("produces a schema-valid run sheet with a non-empty timeline", () => {
    const sheet = buildFallbackRunSheet(baseInput);
    expect(RunSheetSchema.safeParse(sheet).success).toBe(true);
    expect(sheet.timeline.length).toBeGreaterThanOrEqual(3);
  });

  it("still has a timeline when there are no sessions or breaks", () => {
    const sheet = buildFallbackRunSheet({
      ...baseInput,
      sessions: [],
      breaks: [],
    });
    expect(sheet.timeline.length).toBeGreaterThan(0);
  });
});

describe("extractJSON + normalizeRunSheetPayload integration", () => {
  it("handles markdown-fenced JSON with no usable timeline by falling back", () => {
    const raw = '```json\n{ "timeline": [] }\n```';
    const sheet = normalizeRunSheetPayload(extractJSON(raw), baseInput);
    expect(sheet.timeline.length).toBeGreaterThan(0);
  });

  it("handles prose-wrapped JSON object", () => {
    const raw =
      'Here you go:\n{ "timeline": [{ "time": "09:00", "title": "Doors", "duration": 30 }] }\nEnjoy!';
    const sheet = normalizeRunSheetPayload(extractJSON(raw), baseInput);
    expect(sheet.timeline.length).toBeGreaterThan(0);
    expect(sheet.timeline.some((t) => t.title === "Doors")).toBe(true);
  });
});
