import {
  isPause,
  overlaps,
  toMin,
  fromMin,
  type OpsModel,
  type ProgrammeItem,
} from "@/lib/event-model";

/** A time band groups items that run at the same time. Two+ non-break items = concurrent tracks. */
export type TimeBand = {
  key: string;
  day: number;
  start: string;
  end: string;
  items: ProgrammeItem[];
  concurrent: boolean;
};

export type SetupBlock = {
  id: string;
  day: number;
  start: string;
  end: string;
  durationMin: number;
  /** Rooms being turned over. Names or "Room not specified". */
  rooms: string[];
  fromItemIds: string[];
  toItemIds: string[];
  label: string;
  tasks: string[];
  /** True when the window is shorter than the rule minimum (or zero). */
  insufficient: boolean;
};

export function sortItems(items: ProgrammeItem[]): ProgrammeItem[] {
  return [...items].sort(
    (a, b) => a.day - b.day || toMin(a.start) - toMin(b.start) || (a.code ?? a.title).localeCompare(b.code ?? b.title),
  );
}

/** Group items into bands of mutually overlapping items (per day). */
export function buildBands(items: ProgrammeItem[]): TimeBand[] {
  const sorted = sortItems(items);
  const bands: TimeBand[] = [];
  for (const it of sorted) {
    const last = bands[bands.length - 1];
    if (last && last.day === it.day && toMin(it.start) < toMin(last.end)) {
      last.items.push(it);
      if (toMin(it.end) > toMin(last.end)) last.end = it.end;
    } else {
      bands.push({ key: `${it.day}-${it.start}-${it.id}`, day: it.day, start: it.start, end: it.end, items: [it], concurrent: false });
    }
  }
  for (const b of bands) b.concurrent = b.items.filter((i) => !isPause(i)).length > 1;
  return bands;
}

/**
 * Assign track labels to concurrent items. Uses the session code suffix (3A → Track A)
 * when present, otherwise the order within the band. Existing labels are kept.
 */
export function assignTracks(items: ProgrammeItem[]): ProgrammeItem[] {
  const bands = buildBands(items);
  const labels = new Map<string, string>();
  for (const b of bands) {
    if (!b.concurrent) continue;
    b.items
      .filter((i) => !isPause(i))
      .forEach((i, idx) => {
        const suffix = i.code?.match(/[A-Z]$/)?.[0];
        labels.set(i.id, i.track ?? `Track ${suffix ?? String.fromCharCode(65 + idx)}`);
      });
  }
  return items.map((i) => (labels.has(i.id) ? { ...i, track: labels.get(i.id) } : i));
}

function kindOf(band: TimeBand): "tracks" | "plenary" | "pause" | "meal" {
  if (band.concurrent) return "tracks";
  if (band.items.some((i) => i.type === "meal")) return "meal";
  if (band.items.every(isPause)) return "pause";
  return "plenary";
}

/**
 * Derive setup/reset blocks between consecutive bands where the room configuration
 * changes (plenary → breakouts, breakouts → plenary, programme → meal, workshop setups).
 * The block occupies the gap between bands — when the gap is a break, the reset happens
 * during that break. Zero or short windows are flagged as insufficient.
 */
export function deriveSetupBlocks(model: OpsModel): SetupBlock[] {
  const roomName = (id?: string) => model.rooms.find((r) => r.id === id)?.name;
  const nameFor = (i: ProgrammeItem) =>
    i.room.state === "unknown" || !i.room.value ? `Room not specified (${i.code ?? i.title})` : roomName(i.room.value) ?? "Room not specified";

  const programme = buildBands(model.items).filter((b) => kindOf(b) !== "pause");
  const all = buildBands(model.items);
  const blocks: SetupBlock[] = [];

  for (let i = 0; i < programme.length - 1; i++) {
    const a = programme[i];
    const b = programme[i + 1];
    if (a.day !== b.day) continue;
    const ka = kindOf(a);
    const kb = kindOf(b);
    const hasWorkshop = b.items.some((x) => x.type === "workshop");
    const changes = ka !== kb || hasWorkshop || kb === "tracks";
    if (!changes) continue;

    const gapStart = toMin(a.end);
    const gapEnd = toMin(b.start);
    const duration = Math.max(0, gapEnd - gapStart);
    const pauseBetween = all.find((p) => p.day === a.day && kindOf(p) === "pause" && toMin(p.start) >= gapStart && toMin(p.end) <= gapEnd);

    const tasks: string[] = [];
    let label = "Room turnover";
    if (kb === "tracks") {
      label = "Split to concurrent tracks";
      tasks.push("Breakout rooms set and signed", "AV check per breakout room", "Room hosts / session chairs in position", "Wayfinding for delegates from plenary");
    } else if (ka === "tracks" && kb === "plenary") {
      label = "Reconvene plenary";
      tasks.push("Plenary room reset (stage, seating)", "Plenary AV and mics re-checked", "Call delegates back from breakouts");
    } else if (kb === "meal") {
      label = "Catering setup";
      tasks.push("Catering area set before session ends", "Service staff briefed", "Dietary stations labelled", "Clear path from session rooms");
    } else if (ka === "meal") {
      label = "Post-meal reset";
      tasks.push("Catering cleared from session spaces", "AV re-check", "Delegate call back");
    }
    if (hasWorkshop) tasks.push("Workshop furniture (tables, chairs) set", "Facilitator materials and participant packs placed");
    tasks.push("Staff ready confirmation to stage manager");

    const target = b.items.filter((x) => !isPause(x));
    const rooms = target.length
      ? [...new Set(target.map(nameFor))]
      : b.items.map((x) => (x.room.value ? roomName(x.room.value) ?? "Catering area not specified" : "Catering area not specified"));
    const minimum = kb === "meal" ? 0 : model.rules.minResetMin;
    blocks.push({
      id: `setup-${a.day}-${a.end}-${b.start}`,
      day: a.day,
      start: fromMin(gapStart),
      end: fromMin(gapEnd),
      durationMin: duration,
      rooms,
      fromItemIds: a.items.map((x) => x.id),
      toItemIds: b.items.map((x) => x.id),
      label: pauseBetween ? `${label} (during ${pauseBetween.items[0].title.toLowerCase()})` : label,
      tasks,
      insufficient: kb === "meal" ? duration === 0 && !pauseBetween : duration < minimum,
    });
  }
  return blocks;
}

export function concurrentPairs(items: ProgrammeItem[]): [ProgrammeItem, ProgrammeItem][] {
  const out: [ProgrammeItem, ProgrammeItem][] = [];
  const list = items.filter((i) => !isPause(i));
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) if (overlaps(list[i], list[j])) out.push([list[i], list[j]]);
  return out;
}
