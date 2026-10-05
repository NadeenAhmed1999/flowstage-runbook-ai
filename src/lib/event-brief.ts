import { INFO_STATE_LABEL, REQUIREMENT_LABEL, economicsTotals, isPause, type Field, type OpsModel } from "@/lib/event-model";
import { buildBands, deriveSetupBlocks } from "@/lib/ops-schedule";
import { detectConflicts } from "@/lib/conflicts";

const f = <T,>(x: Field<T>, show: (v: T) => string) =>
  x.value != null && x.state !== "unknown" ? show(x.value) : INFO_STATE_LABEL[x.state].toUpperCase();

/**
 * Compact structured brief of the whole operational model, shared by the run-sheet
 * generator, Smart Review, Readiness, and Copilot so they reason across the event.
 */
export function buildOperationsBrief(m: OpsModel, maxChars = 7800): string {
  const room = (id?: string) => m.rooms.find((r) => r.id === id)?.name ?? id ?? "";
  const ppl = (ids?: string[]) => (ids ?? []).map((id) => m.people.find((p) => p.id === id)?.name ?? id).join(", ");
  const lines: string[] = [];
  lines.push(`VENUE: ${f(m.venue.name, (v) => v)}${m.venue.city ? `, ${m.venue.city}` : ""}`);
  lines.push(`ROOMS: ${m.rooms.length ? m.rooms.map((r) => `${r.name}${r.placeholder ? " (placeholder)" : ""} [cap ${f(r.capacity, String)}, layout ${f(r.layout, String)}, AV ${r.equipmentState === "unknown" ? "NOT SPECIFIED" : r.equipment.map((e) => e.kind).join("/")}]`).join("; ") : "NONE SPECIFIED"}`);
  lines.push("PROGRAMME (time bands; ∥ = concurrent tracks):");
  for (const b of buildBands(m.items)) {
    const parts = b.items.map((i) =>
      isPause(i)
        ? `${i.title}`
        : `[${i.id}] ${i.track ? i.track + " " : ""}${i.code ? i.code + " " : ""}${i.title.slice(0, 80)} | room ${f(i.room, room)} | speakers ${f(i.speakers, ppl)} | chair ${f(i.chairs, ppl)} | AV ${f(i.av, (v) => v.join("/"))} | interp ${f(i.interpretation, String)}`,
    );
    lines.push(`D${b.day} ${b.start}-${b.end}: ${parts.join(b.concurrent ? "  ∥  " : " + ")}`);
  }
  lines.push("SETUP/RESET WINDOWS:");
  for (const s of deriveSetupBlocks(m)) lines.push(`D${s.day} ${s.start}-${s.end} ${s.label} (${s.durationMin}m)${s.insufficient ? " INSUFFICIENT" : ""} rooms: ${s.rooms.join(", ")}`);
  lines.push(`REQUIREMENTS: ${m.requirements.map((r) => `${REQUIREMENT_LABEL[r.kind]}(${r.scope}${r.targetId ? ":" + r.targetId : ""})=${INFO_STATE_LABEL[r.state]}${r.detail ? " — " + r.detail : ""}`).join("; ") || "none"}`);
  lines.push(`RESOURCES: ${m.resources.map((r) => `${r.name}×${r.quantity}`).join(", ") || "NONE SPECIFIED"}`);
  const t = economicsTotals(m.economics);
  lines.push(`ECONOMICS: ${t.linesWithValues ? `revenue budget ${t.revenue.budget}, cost budget ${t.cost.budget} ${m.economics.currency}` : "NOT SPECIFIED"}`);
  lines.push("DETECTED CONFLICTS / GAPS:");
  for (const c of detectConflicts(m)) lines.push(`- [${c.severity}] ${c.what}`);
  lines.push("RULES: NOT SPECIFIED means unknown — never invent it and never treat it as not required; flag it. Cues must suit each room's actual setup.");
  const out = lines.join("\n");
  return out.length > maxChars ? out.slice(0, maxChars) + "\n…" : out;
}
