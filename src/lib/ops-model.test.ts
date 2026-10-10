import { describe, expect, it } from "vitest";
import { diaOps } from "@/lib/dia-summit-event";
import { buildBands, deriveSetupBlocks } from "@/lib/ops-schedule";
import { detectConflicts } from "@/lib/conflicts";
import { buildDependencyGraph } from "@/lib/dependencies";
import { legacyToOps, opsToLegacy, resolveOps } from "@/lib/event-migrate";
import { seedEvent, gccSampleEvent } from "@/components/event-context";
import { buildOperationsBrief } from "@/lib/event-brief";

describe("DIA acceptance — event model", () => {
  const bands = buildBands(diaOps.items);
  const concurrent = bands.filter((b) => b.concurrent).map((b) => b.items.map((i) => i.code).sort().join("/"));

  it("renders all A/B pairs as concurrent tracks", () => {
    expect(concurrent).toEqual(["3A/3B", "4A/4B", "7A/7B", "8A/8B"]);
  });

  it("assigns Track A / Track B from session codes", () => {
    const a = diaOps.items.find((i) => i.code === "7A")!;
    const b = diaOps.items.find((i) => i.code === "7B")!;
    expect(a.track).toBe("Track A");
    expect(b.track).toBe("Track B");
    expect(a.type).toBe("workshop");
  });

  it("keeps plenaries sequential and spans two days", () => {
    expect(new Set(diaOps.items.map((i) => i.day))).toEqual(new Set([2, 3]));
    expect(bands.filter((b) => !b.concurrent).length).toBeGreaterThan(10);
  });

  it("stores unspecified fields as unknown, not as not-required", () => {
    const s3a = diaOps.items.find((i) => i.code === "3A")!;
    expect(s3a.room.state).toBe("unknown");
    expect(s3a.chairs.state).toBe("unknown");
    expect(s3a.interpretation.state).toBe("unknown");
    const open = diaOps.items.find((i) => i.id === "d2-open")!;
    expect(open.speakers).toEqual({ state: "confirmed", value: ["p-mukanga", "p-fathallah", "p-ghamrawy"] });
  });

  it("derives setup/reset blocks for every split to and from tracks", () => {
    const blocks = deriveSetupBlocks(diaOps);
    expect(blocks.filter((b) => b.label.startsWith("Split to concurrent tracks")).length).toBe(4);
    expect(blocks.some((b) => b.label.startsWith("Catering setup"))).toBe(true);
    expect(blocks.every((b) => b.rooms.length > 0)).toBe(true);
  });

  it("reports missing information and catering overlap, with patches that require confirmation", () => {
    const c = detectConflicts(diaOps);
    const rooms = c.find((x) => x.id === "missing-concurrent-rooms")!;
    expect(rooms.itemIds.length).toBe(8);
    expect(rooms.patch).toBeDefined();
    expect(c.some((x) => x.rule === "catering_overlap")).toBe(true);
    // Applying is an explicit, pure step — the seed itself is unchanged.
    const applied = rooms.patch!.apply(diaOps);
    expect(applied.rooms.map((r) => r.name)).toEqual(["Breakout Room A", "Breakout Room B"]);
    expect(diaOps.rooms.length).toBe(0);
    expect(detectConflicts(applied).find((x) => x.id === "missing-concurrent-rooms")).toBeUndefined();
  });

  it("detects a person double-booked in concurrent sessions", () => {
    const m = { ...diaOps, items: diaOps.items.map((i) => (i.code === "3A" || i.code === "3B" ? { ...i, speakers: { state: "confirmed" as const, value: ["p-fathallah"] } } : i)) };
    expect(detectConflicts(m).some((x) => x.rule === "person_double_booked")).toBe(true);
  });

  it("detects a shared resource over-allocated across tracks", () => {
    const m = {
      ...diaOps,
      resources: [{ id: "r-int", kind: "interpreter" as const, name: "Arabic interpreters", quantity: 2 }],
      items: diaOps.items.map((i) => (i.code === "4A" || i.code === "4B" ? { ...i, resources: [{ resourceId: "r-int", quantity: 2 }] } : i)),
    };
    expect(detectConflicts(m).some((x) => x.rule === "interpreter_conflict")).toBe(true);
  });

  it("builds dependency edges and a brief with gaps", () => {
    const edges = buildDependencyGraph(diaOps);
    expect(edges.some((e) => e.relation === "speaker" && e.to.id === "p-ghamrawy")).toBe(true);
    expect(edges.some((e) => e.relation === "setup_before")).toBe(true);
    const brief = buildOperationsBrief(diaOps);
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
    const ids = (m: typeof diaOps) => detectConflicts(m).map((c) => c.id).filter((id) => id !== "missing-venue");
    expect(ids(sampleOps)).toEqual(ids(diaOps));
    expect(JSON.stringify(sampleOps)).not.toMatch(/Mukanga|Fathallah|Ghamrawy|Gates|EDA|DIA|Africa|Cairo|Hilton/);
  });
});
