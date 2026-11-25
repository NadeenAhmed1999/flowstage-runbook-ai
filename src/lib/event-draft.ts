import { z } from "zod";
import { eventFromSaved, pickEventMeta, type EventMeta } from "@/lib/event-persist";
import type { OpsModel } from "@/lib/event-model";
import { resolveOps } from "@/lib/event-migrate";
import { seedEvent, type EventData } from "@/components/event-context";

/** Device draft + backup file helpers. Only title/event_meta/ops are stored — never AI outputs. */
export const DRAFT_KEY = "flowstage:draft:v1";

export type EventPayload = { title: string; eventMeta: EventMeta; ops: OpsModel };

export function payloadOf(e: EventData): EventPayload {
  return { title: e.name || "Untitled event", eventMeta: pickEventMeta(e), ops: resolveOps(e) };
}

/** Stable comparison key for "has this changed?" checks. */
export function snapshotOf(e: EventData): string {
  return stableStringify(payloadOf(e));
}

function stableStringify(v: unknown): string {
  return JSON.stringify(v, (_k, val: unknown) =>
    val && typeof val === "object" && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val as Record<string, unknown>).filter(([k]) => k !== "legacySignature").sort(([a], [b]) => a.localeCompare(b)))
      : val,
  );
}

let seedSnap: string | null = null;
export function seedSnapshot(): string {
  return (seedSnap ??= snapshotOf(seedEvent));
}

const metaSchema = z.object({
  name: z.string(),
  type: z.string(),
  date: z.string(),
  avRequirements: z.string(),
  sponsors: z.array(z.any()),
  components: z.array(z.any()),
}).passthrough();

const opsSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]),
  people: z.array(z.any()),
  items: z.array(z.any()),
}).passthrough();

const payloadSchema = z.object({ title: z.string(), eventMeta: metaSchema, ops: opsSchema });

export type Draft = EventPayload & { savedId: string | null };

export function serializeDraft(e: EventData, savedId: string | null): string {
  return JSON.stringify({ v: 1, savedId, ...payloadOf(e) });
}

/** Returns null for missing, corrupt or seed-identical drafts. */
export function parseDraft(raw: string | null): { event: EventData; savedId: string | null } | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as { savedId?: unknown };
    const p = payloadSchema.safeParse(obj);
    if (!p.success) return null;
    const event = eventFromSaved(p.data.eventMeta as EventMeta, p.data.ops as unknown as OpsModel);
    if (snapshotOf(event) === seedSnapshot()) return null;
    return { event, savedId: typeof obj.savedId === "string" ? obj.savedId : null };
  } catch {
    return null;
  }
}

export function backupJson(e: EventData): string {
  return JSON.stringify({ format: "flowstage-backup", version: 1, ...payloadOf(e) }, null, 2);
}

export function backupFilename(e: EventData): string {
  const slug = (e.name || "event").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event";
  return `${slug}-backup.json`;
}

export function parseBackup(text: string): EventData {
  let obj: unknown;
  try { obj = JSON.parse(text); } catch { throw new Error("This file isn't a valid FlowStage backup (not JSON)."); }
  const p = payloadSchema.safeParse(obj);
  if (!p.success) throw new Error("This file isn't a valid FlowStage backup.");
  return eventFromSaved(p.data.eventMeta as EventMeta, p.data.ops as unknown as OpsModel);
}
