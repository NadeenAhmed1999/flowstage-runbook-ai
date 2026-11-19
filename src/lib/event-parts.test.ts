import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { seedEvent, gccSampleEvent, eventFromOps } from "@/components/event-context";
import { fixtureOps, FIXTURE_META } from "@/lib/test-fixture-event";
import { sampleOps } from "@/lib/sample-summit-event";
import { opsToLegacy, resolveOps } from "@/lib/event-migrate";
import { migrateOps, MAIN_PART_ID, componentPartId } from "@/lib/event-parts";
import { eventFromSaved, pickEventMeta } from "@/lib/event-persist";
import { promptFor } from "@/lib/prompt-input.testutil";
import type { OpsModelV1 } from "@/lib/event-model";

const fx = (p: string) => JSON.parse(readFileSync(join(__dirname, "__fixtures__", p), "utf8"));
const plain = (o: unknown) => JSON.parse(JSON.stringify(o));
const strip = (e: any) => { const { ops, ...rest } = e; return plain(rest); };
const toV1 = (o: any): OpsModelV1 => {
  const { parts, ...rest } = o;
  return { ...rest, version: 1, items: rest.items.map(({ partId, ...i }: any) => i) };
};
const counts = (o: any) => ({ items: o.items.length, people: o.people.length, rooms: o.rooms.length, breaks: o.items.filter((i: any) => i.type === "break" || i.type === "meal").length });
const fixtureEvent = () => eventFromOps({ ...FIXTURE_META, sponsors: [], components: [], avRequirements: "" } as any, fixtureOps);
/** Sample with its 3 components, first session moved into the first component's part. */
const twoPartEvent = () => {
  const comp = gccSampleEvent.components![0];
  return { ev: { ...gccSampleEvent, sessions: gccSampleEvent.sessions.map((s, i) => (i === 0 ? { ...s, partId: componentPartId(comp.id) } : s)) }, comp };
};

describe("model v2: nested parts", () => {
  it("v1 -> v2 keeps item, people, room and break counts (sample and test fixture)", () => {
    for (const ops of [sampleOps, fixtureOps]) {
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
    const saved = plain({ meta: pickEventMeta(seedEvent), ops: seedEvent.ops });
    expect(eventFromSaved(saved.meta, saved.ops).ops).toEqual(seedEvent.ops);
    const old = eventFromSaved({ ...saved.meta, primaryEventType: "summit" }, toV1(seedEvent.ops));
    expect(old.ops!.version).toBe(2);
    expect(old.sessions).toEqual(seedEvent.sessions);
  });

  it("one-part legacy view is identical to the snapshot recorded before part links", () => {
    const snap = fx("legacy-snapshot.json");
    const f = fixtureEvent();
    expect(strip(seedEvent)).toEqual(snap.sample);
    expect(plain(opsToLegacy(seedEvent.ops!))).toEqual(snap.sampleLegacy);
    expect(strip(f)).toEqual(snap.fixture);
    expect(plain(opsToLegacy(f.ops!))).toEqual(snap.fixtureLegacy);
    expect(plain(opsToLegacy(resolveOps(gccSampleEvent)))).toEqual(snap.gccLegacy);
  });

  it("one-part AI prompt is character-for-character identical", () => {
    const snap = fx("prompt-snapshot.json");
    expect(promptFor(seedEvent)).toBe(snap.sample);
    expect(promptFor(gccSampleEvent)).toBe(snap.gcc);
  });
});

describe("part links on sessions and breaks", () => {
  it("a session's part link becomes the item's part; a missing part falls back to Main programme", () => {
    const { ev, comp } = twoPartEvent();
    const ops = resolveOps(ev);
    expect(ops.items.find((i) => i.id === ev.sessions[0].id)!.partId).toBe(componentPartId(comp.id));
    const missing = resolveOps({ ...ev, sessions: ev.sessions.map((s, i) => (i === 0 ? { ...s, partId: "part-gone" } : s)) });
    expect(missing.items.find((i) => i.id === ev.sessions[0].id)!.partId).toBe(MAIN_PART_ID);
  });

  it("a break's part link is kept too", () => {
    const comp = gccSampleEvent.components![0];
    const ev = { ...gccSampleEvent, breaks: gccSampleEvent.breaks.map((b, i) => (i === 0 ? { ...b, partId: componentPartId(comp.id) } : b)) };
    const back = opsToLegacy(resolveOps(ev));
    expect(back.breaks[0].partId).toBe(componentPartId(comp.id));
    expect(back.breaks.length).toBe(gccSampleEvent.breaks.length);
  });

  it("moving a session to another part keeps its room, status and AV settings", () => {
    const base = resolveOps(seedEvent);
    const id = seedEvent.sessions[0].id;
    const tuned = { ...base, items: base.items.map((i) => (i.id === id ? { ...i, status: "ready" as const, room: { state: "confirmed" as const, value: "room-x" }, av: { state: "confirmed" as const, value: ["mic" as any] } } : i)) };
    const comp = gccSampleEvent.components![0];
    const moved = { ...seedEvent, components: [comp], ops: tuned, sessions: seedEvent.sessions.map((s, i) => (i === 0 ? { ...s, partId: componentPartId(comp.id) } : s)) };
    const item = resolveOps(moved).items.find((i) => i.id === id)!;
    expect(item.partId).toBe(componentPartId(comp.id));
    expect(item.status).toBe("ready");
    expect(item.room).toEqual({ state: "confirmed", value: "room-x" });
    expect(item.av.value).toEqual(["mic"]);
  });

  it("sessions outside Main programme stay in the legacy view with their part link", () => {
    const { ev, comp } = twoPartEvent();
    const back = opsToLegacy(resolveOps(ev));
    expect(back.sessions.length).toBe(ev.sessions.length);
    expect(back.sessions.find((s) => s.id === ev.sessions[0].id)!.partId).toBe(componentPartId(comp.id));
  });

  it("multi-part AI prompt adds a Part: note only for sessions outside Main programme", () => {
    const { ev, comp } = twoPartEvent();
    const full = { ...ev, ops: resolveOps(ev) };
    const prompt = promptFor(full);
    expect(prompt).toContain(`  Part: ${comp.name}\n`);
    expect(prompt.match(/\n  Part: /g)).toHaveLength(1);
  });
});
