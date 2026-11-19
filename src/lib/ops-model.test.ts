import { describe, expect, it } from "vitest";
import { fixtureOps } from "@/lib/test-fixture-event";
import { createHash } from "crypto";
import { buildBands, deriveSetupBlocks } from "@/lib/ops-schedule";
import { detectConflicts } from "@/lib/conflicts";
import { buildDependencyGraph } from "@/lib/dependencies";
import { legacyToOps, opsToLegacy, resolveOps } from "@/lib/event-migrate";
import { seedEvent, gccSampleEvent } from "@/components/event-context";
import { buildOperationsBrief } from "@/lib/event-brief";

describe("acceptance — event model (invented test fixture)", () => {
  const bands = buildBands(fixtureOps.items);
  const concurrent = bands.filter((b) => b.concurrent).map((b) => b.items.map((i) => i.code).sort().join("/"));

  it("renders all A/B pairs as concurrent tracks", () => {
    expect(concurrent).toEqual(["3A/3B", "4A/4B", "7A/7B", "8A/8B"]);
  });

  it("assigns Track A / Track B from session codes", () => {
    const a = fixtureOps.items.find((i) => i.code === "7A")!;
    const b = fixtureOps.items.find((i) => i.code === "7B")!;
    expect(a.track).toBe("Track A");
    expect(b.track).toBe("Track B");
    expect(a.type).toBe("workshop");
  });

  it("keeps plenaries sequential and spans two days", () => {
    expect(new Set(fixtureOps.items.map((i) => i.day))).toEqual(new Set([2, 3]));
    expect(bands.filter((b) => !b.concurrent).length).toBeGreaterThan(10);
  });

  it("stores unspecified fields as unknown, not as not-required", () => {
    const s3a = fixtureOps.items.find((i) => i.code === "3A")!;
    expect(s3a.room.state).toBe("unknown");
    expect(s3a.chairs.state).toBe("unknown");
    expect(s3a.interpretation.state).toBe("unknown");
    const open = fixtureOps.items.find((i) => i.id === "d2-open")!;
    expect(open.speakers).toEqual({ state: "confirmed", value: ["p-a", "p-b", "p-c"] });
  });

  it("derives setup/reset blocks for every split to and from tracks", () => {
    const blocks = deriveSetupBlocks(fixtureOps);
    expect(blocks.filter((b) => b.label.startsWith("Split to concurrent tracks")).length).toBe(4);
    expect(blocks.some((b) => b.label.startsWith("Catering setup"))).toBe(true);
    expect(blocks.every((b) => b.rooms.length > 0)).toBe(true);
  });

  it("reports missing information and catering overlap, with patches that require confirmation", () => {
    const c = detectConflicts(fixtureOps);
    const rooms = c.find((x) => x.id === "missing-concurrent-rooms")!;
    expect(rooms.itemIds.length).toBe(8);
    expect(rooms.patch).toBeDefined();
    expect(c.some((x) => x.rule === "catering_overlap")).toBe(true);
    // Applying is an explicit, pure step — the seed itself is unchanged.
    const applied = rooms.patch!.apply(fixtureOps);
    expect(applied.rooms.map((r) => r.name)).toEqual(["Breakout Room A", "Breakout Room B"]);
    expect(fixtureOps.rooms.length).toBe(0);
    expect(detectConflicts(applied).find((x) => x.id === "missing-concurrent-rooms")).toBeUndefined();
  });

  it("detects a person double-booked in concurrent sessions", () => {
    const m = { ...fixtureOps, items: fixtureOps.items.map((i) => (i.code === "3A" || i.code === "3B" ? { ...i, speakers: { state: "confirmed" as const, value: ["p-b"] } } : i)) };
    expect(detectConflicts(m).some((x) => x.rule === "person_double_booked")).toBe(true);
  });

  it("detects a shared resource over-allocated across tracks", () => {
    const m = {
      ...fixtureOps,
      resources: [{ id: "r-int", kind: "interpreter" as const, name: "Arabic interpreters", quantity: 2 }],
      items: fixtureOps.items.map((i) => (i.code === "4A" || i.code === "4B" ? { ...i, resources: [{ resourceId: "r-int", quantity: 2 }] } : i)),
    };
    expect(detectConflicts(m).some((x) => x.rule === "interpreter_conflict")).toBe(true);
  });

  it("builds dependency edges and a brief with gaps", () => {
    const edges = buildDependencyGraph(fixtureOps);
    expect(edges.some((e) => e.relation === "speaker" && e.to.id === "p-c")).toBe(true);
    expect(edges.some((e) => e.relation === "setup_before")).toBe(true);
    const brief = buildOperationsBrief(fixtureOps);
    expect(brief).toContain("∥");
    expect(brief).toContain("NOT SPECIFIED");
  });
});

describe("migration", () => {
  it("seed event keeps legacy fields in sync with the model", () => {
    expect(seedEvent.name).toBe("Meridian Health Access Summit 2026 (Sample)");
    expect(seedEvent.sessions.length).toBe(15);
    expect(seedEvent.breaks.length).toBe(6);
    expect(resolveOps(seedEvent)).toBe(seedEvent.ops);
  });

  it("legacy events migrate forward and back", () => {
    const ops = legacyToOps(gccSampleEvent);
    expect(ops.items.length).toBe(gccSampleEvent.sessions.length + gccSampleEvent.breaks.length + (gccSampleEvent.components?.length ?? 0));
    expect(ops.items.find((i) => i.id === "se3")!.speakers.state).toBe("confirmed");
    expect(ops.items.find((i) => i.id === "se3")!.room.state).toBe("unknown");
    const back = opsToLegacy(ops);
    expect(back.sessions.length).toBe(gccSampleEvent.sessions.length);
  });

  it("edits to legacy sessions re-derive the model", () => {
    const edited = { ...seedEvent, sessions: seedEvent.sessions.slice(1) };
    expect(resolveOps(edited).items.length).toBe(seedEvent.ops!.items.length - 1);
  });
});

describe("anonymized sample", () => {
  it("keeps the same structure and conflicts, with no real names", async () => {
    const { sampleOps } = await import("@/lib/sample-summit-event");
    const pairs = buildBands(sampleOps.items).filter((b) => b.concurrent).map((b) => b.items.map((i) => i.code).sort().join("/"));
    expect(pairs).toEqual(["3A/3B", "4A/4B", "7A/7B", "8A/8B"]);
    const ids = (m: typeof fixtureOps) => detectConflicts(m).map((c) => c.id).filter((id) => id !== "missing-venue");
    expect(ids(sampleOps)).toEqual(ids(fixtureOps));
    // Guard against real names from the private source agenda, stored only as hashes.
    const banned = new Set(["82c59607599a5a5a", "3cf78192f2d3a5e6", "74f2e4018991bd45", "7a3b3573cac24bf3", "500e30721a0702fd", "0addcc1de26ee0f6", "3f5053b3ae70794b", "6d2805b8ba496887", "8e3f5e915594cdb4"]);
    const words = JSON.stringify(sampleOps).match(/[A-Za-z]+/g) ?? [];
    expect(words.filter((w) => banned.has(createHash("sha256").update(w.toLowerCase()).digest("hex").slice(0, 16)))).toEqual([]);
  });
});
