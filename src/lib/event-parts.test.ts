import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { seedEvent, gccSampleEvent, eventFromOps } from "@/components/event-context";
import { diaOps, DIA_META } from "@/lib/dia-summit-event";
import { sampleOps } from "@/lib/sample-summit-event";
import { opsToLegacy, resolveOps } from "@/lib/event-migrate";
import { migrateOps, MAIN_PART_ID } from "@/lib/event-parts";
import { eventFromSaved, pickEventMeta } from "@/lib/event-persist";
import type { OpsModelV1 } from "@/lib/event-model";

const toV1 = (o: any): OpsModelV1 => {
  const { parts, ...rest } = o;
  return { ...rest, version: 1, items: rest.items.map(({ partId, ...i }: any) => i) };
};
const counts = (o: any) => ({ items: o.items.length, people: o.people.length, rooms: o.rooms.length, breaks: o.items.filter((i: any) => i.type === "break" || i.type === "meal").length });

describe("model v2: nested parts", () => {
  it("v1 -> v2 keeps item, people, room and break counts (sample and DIA agenda)", () => {
    for (const ops of [sampleOps, diaOps]) {
      const v1 = toV1(ops);
      const v2 = migrateOps(v1);
      expect(v2.version).toBe(2);
      expect(counts(v2)).toEqual(counts(v1));
      expect(v2.parts.map((p) => p.name)).toEqual(["Main programme"]);
      expect(v2.items.every((i) => i.partId === MAIN_PART_ID)).toBe(true);
    }
  });

  it("a v1 event with 2 components becomes 3 parts, checklists moved across", () => {
    const two = { ...gccSampleEvent, components: gccSampleEvent.components!.slice(0, 2) };
    const ops = resolveOps(two);
    expect(ops.parts).toHaveLength(3);
    const c = two.components[0];
    const part = ops.parts.find((p) => p.componentId === c.id)!;
    expect(part.checklists.av).toEqual(c.operationalRequirements?.av ?? []);
    expect(part.hosts).toEqual(c.hosts);
    expect(part.venue).toEqual(c.venue);
    expect(ops.items.find((i) => i.origin?.id === c.id)!.partId).toBe(part.id);
  });

  it("loading an already-v2 event is unchanged", () => {
    const v2 = migrateOps(toV1(sampleOps));
    expect(migrateOps(v2)).toBe(v2);
  });

  it("save/load round trip keeps the shape; old v1 saved data with primaryEventType still loads", () => {
    const saved = JSON.parse(JSON.stringify({ meta: pickEventMeta(seedEvent), ops: seedEvent.ops }));
    const back = eventFromSaved(saved.meta, saved.ops);
    expect(back.ops).toEqual(seedEvent.ops);
    const old = eventFromSaved({ ...saved.meta, primaryEventType: "summit" }, toV1(seedEvent.ops));
    expect(old.ops!.version).toBe(2);
    expect(old.sessions).toEqual(seedEvent.sessions);
  });

  it("one-part legacy view is identical to the pre-parts snapshot", () => {
    const snap = JSON.parse(readFileSync(join(__dirname, "__fixtures__/legacy-snapshot-v1.json"), "utf8"));
    const strip = (e: any) => { const { ops, ...rest } = e; return JSON.parse(JSON.stringify(rest)); };
    const dia = eventFromOps({ ...DIA_META, sponsors: [], components: [], avRequirements: "" } as any, diaOps);
    const gccOps = resolveOps(gccSampleEvent);
    expect(strip(seedEvent)).toEqual(snap.sample);
    expect(JSON.parse(JSON.stringify(opsToLegacy(seedEvent.ops!)))).toEqual(snap.sampleLegacy);
    expect(strip(dia)).toEqual(snap.dia);
    expect(JSON.parse(JSON.stringify(opsToLegacy(dia.ops!)))).toEqual(snap.diaLegacy);
    expect(JSON.parse(JSON.stringify(opsToLegacy(gccOps)))).toEqual(snap.gccLegacy);
  });

  it("multi-part legacy view keeps items from extra parts and labels them", () => {
    const ops = seedEvent.ops!;
    const first = ops.items.find((i) => i.type !== "break" && i.type !== "meal")!;
    const multi = { ...ops, parts: [...ops.parts, { id: "p-side", name: "Training room", kind: "other" as const, day: 1, start: "10:00", checklists: { av: [], staffing: [], protocol: [] } }], items: ops.items.map((i) => (i.id === first.id ? { ...i, partId: "p-side" } : i)) };
    const legacy = opsToLegacy(multi);
    expect(legacy.sessions.length).toBe(opsToLegacy(ops).sessions.length);
    expect(legacy.sessions.find((s) => s.title === first.title)!.description).toContain("[Part: Training room]");
  });
});
