import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Wrench } from "lucide-react";
import {
  EQUIPMENT_LABEL,
  INFO_STATE_LABEL,
  REQUIREMENT_LABEL,
  STATUS_LABEL,
  isPause,
  type Field,
  type ItemStatus,
  type OpsModel,
  type ProgrammeItem,
} from "@/lib/event-model";
import { buildBands, deriveSetupBlocks, type SetupBlock, type TimeBand } from "@/lib/ops-schedule";
import { groupItemsByPart, effectiveTrack } from "@/lib/part-presentation";
import { sortItems } from "@/lib/ops-schedule";
import { toMin } from "@/lib/event-model";
import { Link } from "@tanstack/react-router";
import { useEvent } from "@/components/event-context";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

type View = "full" | "production" | "room" | "speaker";
const VIEWS: { id: View; label: string }[] = [
  { id: "full", label: "Full Operations" },
  { id: "production", label: "Production / AV" },
  { id: "room", label: "By Room" },
  { id: "speaker", label: "Speakers" },
];

function cueFor(i: ProgrammeItem): string {
  switch (i.type) {
    case "opening-remarks":
    case "opening-ceremony":
      return "Walk-in music out · house to half · VOG · speakers to lectern in order";
    case "closing-ceremony":
      return "Closing VOG · speakers on · outro music · house up";
    case "plenary":
    case "keynote":
      return "Chair on · lectern/panel mics live · slides on screen";
    case "workshop":
      return "Facilitator brief · tables set · materials placed · roaming mic";
    case "breakout":
    case "panel":
      return "Room host opens doors · chair intro · Q&A mic ready";
    case "meal":
      return "Catering open · signage to catering area · AV to standby";
    case "break":
      return "Holding slide / sponsor loop · reset for next item";
    default:
      return "Stage manager standby";
  }
}

function Unk({ children }: { children: React.ReactNode }) {
  return <span className="italic text-muted-foreground/80">{children}</span>;
}

function FieldText<T>({ f, render, unknownLabel }: { f: Field<T>; render: (v: T) => string; unknownLabel: string }) {
  if (f.state === "not_required") return <span className="text-muted-foreground/60">—</span>;
  if (f.value == null || (Array.isArray(f.value) && f.value.length === 0) || f.state === "unknown")
    return <Unk>{unknownLabel}</Unk>;
  return <>{render(f.value)}</>;
}

const statusTone: Record<ItemStatus, string> = {
  planned: "bg-secondary text-muted-foreground",
  ready: "bg-accent/10 text-accent",
  in_progress: "bg-navy text-navy-foreground",
  complete: "bg-secondary text-foreground",
  delayed: "bg-destructive/10 text-destructive",
  at_risk: "bg-destructive/15 text-destructive",
};

function typeTone(i: ProgrammeItem): string {
  if (i.type === "meal" || i.type === "break") return "border-l-muted-foreground/30 bg-surface/70";
  if (i.track === "Track A") return "border-l-accent";
  if (i.track === "Track B") return "border-l-navy";
  if (i.type.includes("ceremony") || i.type === "opening-remarks") return "border-l-navy bg-navy/[0.03]";
  return "border-l-foreground/40";
}

export function OpsRunOfShow({ ops, setOps }: { ops: OpsModel; setOps?: (m: OpsModel) => void }) {
  const { reset } = useEvent();
  const [view, setView] = useState<View>("full");
  const [track, setTrack] = useState<string>("all");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const tracks = useMemo(() => [...new Set(ops.items.map((i) => i.track).filter(Boolean))] as string[], [ops]);
  const filtered = useMemo(
    () => ops.items.filter((i) => track === "all" || !i.track || i.track === track),
    [ops, track],
  );
  const bands = useMemo(() => buildBands(filtered), [filtered]);
  const setups = useMemo(() => deriveSetupBlocks(ops), [ops]);
  

  const roomName = (id: string) => ops.rooms.find((r) => r.id === id)?.name ?? id;
  const people = (ids: string[]) => ids.map((id) => ops.people.find((p) => p.id === id)?.name ?? id).join(", ");
  const reqsFor = (i: ProgrammeItem) => ops.requirements.filter((r) => r.scope === "item" && r.targetId === i.id);
  const eventReqs = ops.requirements.filter((r) => r.scope === "event");

  const setStatus = (id: string, status: ItemStatus) =>
    setOps?.({ ...ops, items: ops.items.map((i) => (i.id === id ? { ...i, status } : i)) });

  const renderCell = (i: ProgrammeItem, mobile = false) => {
    const pause = isPause(i);
    const reqs = reqsFor(i);
    const isOpen = open[i.id];
    return (
      <div key={i.id} className={`rounded-md border border-border border-l-4 ${typeTone(i)} bg-background`} data-testid="ops-item" data-track={effectiveTrack(ops, i) ?? ""} data-day={i.day} data-start={i.start}>
        <button
          type="button"
          onClick={() => setOpen((o) => ({ ...o, [i.id]: !o[i.id] }))}
          className="flex w-full items-start gap-2 px-3 py-2 text-left"
          aria-expanded={!!isOpen}
        >
          {isOpen ? <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
          <div className="min-w-0 flex-1">
            {mobile && <p className="mb-1 text-xs text-muted-foreground">Day {i.day} · {i.start || "Time not specified"}–{i.end} · {Math.max(0, toMin(i.end) - toMin(i.start))} min</p>}
            <div className="flex flex-wrap items-center gap-1.5">
              {mobile && ops.parts.length > 1 && <span className="text-[10px] text-muted-foreground" data-testid="part-label">{ops.parts.find(p => p.id === i.partId)?.name ?? "Main programme"}</span>}
              {effectiveTrack(ops, i) && <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-foreground">{effectiveTrack(ops, i)}</span>}
              {i.code && <span className="font-mono text-[10px] font-bold text-accent">{i.code}</span>}
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{i.type.replace(/-/g, " ")}</span>
            </div>
            <p className={`mt-0.5 text-sm font-semibold leading-snug ${pause ? "text-muted-foreground" : "text-foreground"}`}>{i.title}</p>
          </div>
          <span className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${statusTone[i.status]}`}>{STATUS_LABEL[i.status]}</span>
        </button>

        {!pause && (
          <dl className="grid grid-cols-1 gap-x-3 gap-y-1 border-t border-border/60 px-3 py-2 text-[11px] md:grid-cols-3">
            {(view === "full" || view === "room" || view === "production") && (
              <Cell k="Room"><FieldText f={i.room} render={roomName} unknownLabel="Room not specified" /></Cell>
            )}
            {(view === "full" || view === "speaker") && (
              <Cell k="Speaker / VIP"><FieldText f={i.speakers} render={people} unknownLabel="Speaker not specified" /></Cell>
            )}
            {(view === "full" || view === "speaker") && (
              <Cell k="Chair / Moderator">
                {i.chairs.value?.length || i.moderators.value?.length ? (
                  people([...(i.chairs.value ?? []), ...(i.moderators.value ?? [])])
                ) : i.chairs.state === "not_required" ? (
                  <span className="text-muted-foreground/60">—</span>
                ) : (
                  <Unk>Chair not specified</Unk>
                )}
              </Cell>
            )}
            {(view === "full" || view === "production") && (
              <Cell k="Production / AV"><FieldText f={i.av} render={(v) => v.map((k) => EQUIPMENT_LABEL[k]).join(", ")} unknownLabel="AV not specified" /></Cell>
            )}
            {(view === "full" || view === "production") && (
              <Cell k="Interpretation"><FieldText f={i.interpretation} render={String} unknownLabel="Not specified" /></Cell>
            )}
            {view === "full" && <Cell k="Owner"><FieldText f={i.owner} render={String} unknownLabel="Owner not specified" /></Cell>}
            {(view === "full" || view === "production") && <Cell k="Cue" wide>{cueFor(i)}</Cell>}
            {view !== "speaker" && (
              <Cell k="Special req." wide>
                {reqs.length ? reqs.map((r) => `${REQUIREMENT_LABEL[r.kind]}: ${INFO_STATE_LABEL[r.state]}${r.detail ? ` (${r.detail})` : ""}`).join(" · ") : <Unk>None recorded</Unk>}
              </Cell>
            )}
          </dl>
        )}
        {pause && view === "full" && (
          <div className="border-t border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground">
            Location: <FieldText f={i.room} render={roomName} unknownLabel="Catering area not specified" /> · {cueFor(i)}
            {reqs.length > 0 && <> · {reqs.map((r) => `${REQUIREMENT_LABEL[r.kind]}: ${INFO_STATE_LABEL[r.state]}`).join(" · ")}</>}
          </div>
        )}

        {isOpen && (
          <div className="space-y-2 border-t border-border/60 bg-surface/50 px-3 py-2 text-[11px]">
            {i.notes && <p className="text-foreground/90">{i.notes}</p>}
            <p className="text-muted-foreground">
              Resources: {i.resources.length ? i.resources.map((r) => `${ops.resources.find((x) => x.id === r.resourceId)?.name ?? r.resourceId} ×${r.quantity}`).join(", ") : <Unk>none assigned</Unk>}
              {" · "}Expected attendance: <FieldText f={i.expectedAttendance} render={String} unknownLabel="not specified" />
            </p>
            {setOps && (
              <div className="no-print flex flex-wrap gap-1">
                {(Object.keys(STATUS_LABEL) as ItemStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(i.id, s)}
                    className={`rounded border px-2 py-0.5 font-mono text-[10px] ${i.status === s ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:bg-background"}`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const setupBetween = (day: number, band: TimeBand, next?: TimeBand) =>
    setups.filter((s) => s.day === day && s.start >= band.end && (!next || s.end <= next.start || s.start === band.end) && s.start === band.end);

  const renderSchedule = (scheduleBands: TimeBand[], scheduleSetups: SetupBlock[]) => {
    const scheduleDays = [...new Set(scheduleBands.map(b => b.day))];
    return <>{scheduleDays.map((day) => {
        const dayBands = scheduleBands.filter((b) => b.day === day);
        return (
          <section key={day}>
            <h4 className="sticky top-0 z-10 border-b border-navy/20 bg-background/95 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-navy backdrop-blur">
              Day {day}
            </h4>
            <div className="mt-2 space-y-2">
              {dayBands.map((b, idx) => {
                const lanes = b.items;
                return (
                  <Fragment key={b.key}>
                    <div className="grid grid-cols-[64px_1fr] gap-3" data-testid={b.concurrent ? "concurrent-band" : "band"}>
                      <div className="pt-2 text-right">
                        <p className="font-mono text-sm font-semibold tabular text-accent">{b.start}</p>
                        <p className="font-mono text-[10px] tabular text-muted-foreground">{b.end}</p>
                        {b.concurrent && <p className="mt-1 font-mono text-[9px] font-bold uppercase text-navy">∥ {lanes.length} tracks</p>}
                      </div>
                      <div className="space-y-2">
                        {b.concurrent ? (
                          <div className="grid gap-2 md:grid-cols-2">{lanes.map(i => renderCell(i))}</div>
                        ) : (
                          lanes.map(i => renderCell(i))
                        )}
                      </div>
                    </div>
                    {view !== "speaker" && setupBetween(day, b, dayBands[idx + 1]).filter(s => scheduleSetups.includes(s)).map((s) => <SetupRow key={s.id} s={s} />)}
                  </Fragment>
                );
              })}
              {view !== "speaker" &&
                scheduleSetups
                  .filter((s) => s.day === day && !dayBands.some((b) => b.end === s.start))
                  .map((s) => <SetupRow key={s.id} s={s} />)}
            </div>
          </section>
        );
      })}</>;
  };
  const groups = groupItemsByPart(ops, filtered);
  const mobileEntries = [
    ...sortItems(filtered).map(item => ({ day: item.day, start: item.start, id: item.id, item, setup: undefined as SetupBlock | undefined })),
    ...(view === "speaker" ? [] : setups).map(setup => ({ day: setup.day, start: setup.start, id: setup.id, item: undefined as ProgrammeItem | undefined, setup })),
  ].sort((a,b) => a.day - b.day || toMin(a.start) - toMin(b.start) || a.id.localeCompare(b.id));
  return (
    <div className="space-y-4" data-testid="ops-run-of-show">
      {ops.items.length === 0 && (
        <EmptyState
          title="No programme items"
          action={<Button asChild className="min-h-11"><Link to="/app/import">Import agenda</Link></Button>}
          secondary={<Button type="button" variant="link" className="min-h-11" onClick={reset}>Use the sample</Button>}
        />
      )}
      <div className="no-print flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-md border border-border p-0.5">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" onClick={() => setView(v.id)} className={`rounded px-2.5 py-1 text-xs font-medium ${view === v.id ? "bg-navy text-navy-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {v.label}
            </button>
          ))}
        </div>
        {tracks.length > 0 && (
          <div className="flex gap-1 rounded-md border border-border p-0.5">
            {["all", ...tracks].map((t) => (
              <button key={t} type="button" onClick={() => setTrack(t)} className={`rounded px-2.5 py-1 text-xs font-medium ${track === t ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {t === "all" ? "All tracks" : t}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 rounded-md border border-border bg-surface/60 p-3 text-xs sm:grid-cols-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Venue</p>
          <p className="mt-0.5 font-medium text-foreground"><FieldText f={ops.venue.name} render={String} unknownLabel="Venue not specified" />{ops.venue.city ? `, ${ops.venue.city}` : ""}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Rooms</p>
          <p className="mt-0.5 text-foreground">{ops.rooms.length ? ops.rooms.map((r) => `${r.name}${r.placeholder ? " (placeholder)" : ""}`).join(", ") : <Unk>No rooms specified</Unk>}</p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Event requirements</p>
          <p className="mt-0.5 text-foreground">{eventReqs.map((r) => `${REQUIREMENT_LABEL[r.kind]}: ${INFO_STATE_LABEL[r.state]}`).join(" · ") || <Unk>None recorded</Unk>}</p>
        </div>
      </div>

      <div className="space-y-2 md:hidden" data-testid="phone-schedule">{mobileEntries.map(entry => entry.item ? renderCell(entry.item, true) : entry.setup ? <SetupRow key={entry.id} s={entry.setup} mobile /> : null)}</div>
      <div className="hidden space-y-6 md:block" data-testid="desktop-schedule">
        {ops.parts.length <= 1 ? renderSchedule(bands, setups) : groups.map(({ part, items }) => <section key={part.id} data-testid="part-group">
          <h3 className="text-base font-semibold text-foreground">{part.name}</h3>
          <p className="mb-3 text-xs text-muted-foreground">Day {part.day} · {part.start || "Time not specified"}{part.end ? `–${part.end}` : items.length ? `–${items[items.length - 1]?.end}` : ""}{part.track ? ` · ${part.track}` : ""}</p>
          {items.length ? renderSchedule(buildBands(items), setups.filter(s => s.toItemIds.some(id => items.some(i => i.id === id)))) : <p className="text-sm text-muted-foreground">No programme items in this part.</p>}
        </section>)}
      </div>
    </div>
  );
}

function SetupRow({ s, mobile = false }: { s: SetupBlock; mobile?: boolean }) {
  return (
    <div className={mobile ? "space-y-1" : "grid grid-cols-[64px_1fr] gap-3"} data-testid="setup-block">
      <div className="pt-1 text-right font-mono text-[10px] tabular text-muted-foreground">{s.start}</div>
      <div className={`flex flex-wrap items-start gap-2 rounded border border-dashed px-3 py-1.5 text-[11px] ${s.insufficient ? "border-destructive/50 bg-destructive/5" : "border-border bg-surface/40"}`}>
        <Wrench className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">
            Setup / reset · {s.label} · {s.durationMin} min{s.insufficient && <span className="ml-1 text-destructive">— insufficient window</span>}
          </p>
          <p className="text-muted-foreground">Rooms: {s.rooms.join(", ")}</p>
          <p className="text-muted-foreground">{s.tasks.join(" · ")}</p>
        </div>
      </div>
    </div>
  );
}

function Cell({ k, children, wide }: { k: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-3" : ""}>
      <dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{k}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
