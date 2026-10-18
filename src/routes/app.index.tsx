import { createFileRoute, Link } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-shell/topbar";
import { ExampleDataBanner } from "@/components/app-shell/example-data-banner";
import { StatusPill } from "@/components/app-shell/status-pill";
import {
  events,
  activity,
  runSheets,
  sponsorDeliverables,
  opsAlerts,
  timelineDay,
  speakerCoordination,
} from "@/lib/dashboard-data";
import {
  ArrowUpRight,
  TrendingUp,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileDown,
  Printer,
  Mic2,
  Video,
  Lightbulb,
  Radio,
  Megaphone,
} from "lucide-react";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Overview · FlowStage" }] }),
  component: Overview,
});

function Overview() {
  const upcoming = events.filter((e) => e.status !== "completed");
  const next = upcoming[0];

  const stats = [
    { label: "Active productions", value: "5", delta: "+1 this week", icon: TrendingUp },
    { label: "Hours of programming", value: "82.5", delta: "Across 6 venues", icon: Clock3 },
    { label: "Cues approved", value: "214 / 248", delta: "86% locked", icon: CheckCircle2 },
    { label: "Open alerts", value: "3", delta: "1 critical · 2 warning", icon: AlertTriangle },
  ];

  return (
    <>
      <AppTopbar
        breadcrumb="Operations"
        title="Production overview"
        subtitle="Run-of-show readiness across your active portfolio"
      />
      <ExampleDataBanner />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Export bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Friday · 22 May 2026 · 09:48 PT
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                All systems nominal. Show day for <span className="font-medium text-foreground">Global Tech Summit</span> in T-minus 6 days.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton icon={FileDown} label="Export PDF" />
              <ExportButton icon={Download} label="Export CSV" />
              <ExportButton icon={Printer} label="Print briefing" />
            </div>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="lift rounded-lg border border-border bg-background p-4 animate-fade-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {s.label}
                    </p>
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight tabular text-navy">{s.value}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{s.delta}</p>
                </div>
              );
            })}
          </div>

          {/* Hero card — next show */}
          {next && (
            <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-[2fr_1fr]">
              <div className="bg-navy p-6 text-navy-foreground">
                <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-navy-foreground/60">
                  Next show · T-minus 6 days
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">{next.name}</h2>
                <p className="mt-1 text-sm text-navy-foreground/70">
                  {next.venue} · {next.city} · {next.attendees.toLocaleString()} attendees · Rev {next.revision}
                </p>

                <div className="mt-6 grid grid-cols-3 gap-6">
                  <Metric label="Sessions" value={String(next.sessions)} />
                  <Metric label="Speakers" value={String(next.speakers)} />
                  <Metric label="Readiness" value={`${next.readiness}%`} />
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <Link
                    to="/app/run-of-show"
                    className="inline-flex items-center gap-1.5 rounded-md bg-background px-3 py-1.5 text-xs font-semibold text-navy hover:bg-background/90"
                  >
                    Open run-of-show <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link to="/app/events" className="text-xs font-medium text-navy-foreground/70 hover:text-navy-foreground">
                    View all events →
                  </Link>
                </div>
              </div>

              <div className="bg-background p-6">
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  Production readiness
                </p>
                <div className="mt-4 space-y-3 text-xs">
                  <Bar label="Content locked" value={92} />
                  <Bar label="Talent confirmed" value={86} />
                  <Bar label="AV check" value={78} />
                  <Bar label="Sponsor copy" value={70} />
                  <Bar label="Broadcast" value={64} />
                </div>
              </div>
            </div>
          )}

          {/* Operational alerts */}
          <section className="rounded-lg border border-border bg-background">
            <SectionHeader title="Operational alerts" rightHref="/app/activity" rightLabel="Activity log" />
            <ul className="divide-y divide-border">
              {opsAlerts.map((a) => (
                <li key={a.id} className="flex items-start gap-4 px-5 py-3.5">
                  <SeverityDot severity={a.severity} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {a.event}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
                  </div>
                  <p className="font-mono text-[10px] text-muted-foreground">{a.at}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Day timeline */}
          <section className="rounded-lg border border-border bg-background">
            <SectionHeader title="Show-day timeline · Global Tech Summit" exportable />
            <DayTimeline />
          </section>

          {/* Upcoming events cards */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy">Upcoming events</h3>
              <Link to="/app/events" className="text-xs font-medium text-accent hover:underline">
                Portfolio →
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {upcoming.slice(0, 6).map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Recent run sheets */}
            <section className="rounded-lg border border-border bg-background">
              <SectionHeader title="Recent run sheets" exportable rightHref="/app/run-of-show" rightLabel="Open editor" />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-surface text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-2.5 font-semibold">Event</th>
                      <th className="px-3 py-2.5 font-semibold">Rev</th>
                      <th className="px-3 py-2.5 font-semibold">Sessions</th>
                      <th className="px-3 py-2.5 font-semibold">Updated</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                      <th className="px-5 py-2.5" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {runSheets.map((rs) => (
                      <tr key={rs.id} className="hover:bg-surface/60">
                        <td className="px-5 py-3 font-medium text-foreground">{rs.event}</td>
                        <td className="px-3 py-3 font-mono text-[11px] text-muted-foreground">{rs.revision}</td>
                        <td className="px-3 py-3 text-muted-foreground">{rs.sessions}</td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {rs.updatedAt}
                          <span className="ml-1 text-[10px]">· {rs.updatedBy}</span>
                        </td>
                        <td className="px-3 py-3">
                          <RunSheetStatus status={rs.status} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent hover:underline">
                            Export
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Activity */}
            <section className="rounded-lg border border-border bg-background">
              <SectionHeader title="Recent activity" rightHref="/app/activity" rightLabel="Full log" />
              <ul className="divide-y divide-border">
                {activity.slice(0, 7).map((a) => (
                  <li key={a.id} className="px-5 py-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{a.actor}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{a.at}</span>
                    </div>
                    <p className="mt-0.5 text-muted-foreground">
                      {a.action} <span className="text-foreground">{a.target}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Speaker coordination */}
          <section className="rounded-lg border border-border bg-background">
            <SectionHeader title="Speaker coordination progress" exportable rightHref="/app/talent" rightLabel="Talent roster" />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-surface text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Speaker</th>
                    <th className="px-3 py-2.5 font-semibold">Event</th>
                    <th className="px-3 py-2.5 font-semibold">Travel</th>
                    <th className="px-3 py-2.5 font-semibold">Bio + headshot</th>
                    <th className="px-3 py-2.5 font-semibold">Assets</th>
                    <th className="px-5 py-2.5 font-semibold">Rehearsal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {speakerCoordination.map((s) => (
                    <tr key={s.id} className="hover:bg-surface/60">
                      <td className="px-5 py-3 font-medium text-foreground">{s.name}</td>
                      <td className="px-3 py-3 text-muted-foreground">{s.event}</td>
                      <td className="px-3 py-3"><TinyBar value={s.travel} /></td>
                      <td className="px-3 py-3"><TinyBar value={s.bio} /></td>
                      <td className="px-3 py-3"><TinyBar value={s.assets} /></td>
                      <td className="px-5 py-3"><TinyBar value={s.rehearsal} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Sponsor deliverables */}
          <section className="rounded-lg border border-border bg-background">
            <SectionHeader title="Sponsor deliverables" exportable />
            <ul className="divide-y divide-border">
              {sponsorDeliverables.map((d) => (
                <li key={d.id} className="grid gap-3 px-5 py-3.5 md:grid-cols-[1.4fr_1.2fr_1fr_auto] md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{d.sponsor}</p>
                      <TierTag tier={d.tier} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{d.event}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{d.deliverable}</p>
                  <div className="min-w-0">
                    <Bar label={`Due ${d.due}`} value={d.progress} />
                  </div>
                  <DeliverableStatus status={d.status} />
                </li>
              ))}
            </ul>
          </section>

          {/* Operational systems status */}
          <section className="rounded-lg border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy">Operational systems</h3>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Live · refreshed 2 min ago
              </p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
              <SystemTile icon={Mic2} label="Audio" status="ok" detail="FOH locked" />
              <SystemTile icon={Video} label="Video" status="ok" detail="Routing verified" />
              <SystemTile icon={Lightbulb} label="Lighting" status="ok" detail="Presets saved" />
              <SystemTile icon={Radio} label="Broadcast" status="warn" detail="Backup pending" />
              <SystemTile icon={Megaphone} label="Comms" status="ok" detail="Clear-Com paired" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* ---------- subcomponents ---------- */

function ExportButton({ icon: Icon, label }: { icon: typeof Download; label: string }) {
  return (
    <button className="group inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-accent/40 hover:bg-surface hover:shadow-sm active:scale-[0.98]">
      <Icon className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-accent" />
      {label}
    </button>
  );
}

function SectionHeader({
  title,
  rightHref,
  rightLabel,
  exportable,
}: {
  title: string;
  rightHref?: string;
  rightLabel?: string;
  exportable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-3">
      <h3 className="text-sm font-semibold text-navy">{title}</h3>
      <div className="flex items-center gap-3">
        {exportable && (
          <button className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
            <Download className="h-3 w-3" /> Export
          </button>
        )}
        {rightHref && rightLabel && (
          <Link to={rightHref} className="text-xs font-medium text-accent hover:underline">
            {rightLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-navy-foreground/60">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function TinyBar({ value }: { value: number }) {
  const color =
    value >= 90 ? "bg-emerald-500" : value >= 60 ? "bg-accent" : value >= 30 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{value}%</span>
    </div>
  );
}

function EventCard({ event }: { event: (typeof events)[number] }) {
  const date = new Date(event.date);
  return (
    <Link
      to="/app/events"
      className="lift group flex flex-col rounded-lg border border-border bg-background p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-surface text-center font-mono text-[10px] font-bold uppercase tracking-wider text-navy">
            <span>{date.toLocaleDateString("en-US", { month: "short" })}</span>
            <span className="-mt-0.5 text-base">{date.getDate()}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{event.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {event.type} · {event.city}
            </p>
          </div>
        </div>
        <StatusPill status={event.status} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-[11px] text-muted-foreground">
        <Stat label="Sessions" value={String(event.sessions)} />
        <Stat label="Speakers" value={String(event.speakers)} />
        <Stat label="Attendees" value={event.attendees.toLocaleString()} />
      </div>

      <div className="mt-4">
        <Bar label="Readiness" value={event.readiness} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Owner · {event.owner}</span>
        <span>Rev {event.revision}</span>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SeverityDot({ severity }: { severity: "critical" | "warning" | "info" }) {
  const cls =
    severity === "critical"
      ? "bg-destructive"
      : severity === "warning"
        ? "bg-amber-500"
        : "bg-accent";
  return (
    <span className="mt-1.5 inline-flex h-2 w-2 shrink-0 rounded-full ring-2 ring-background" >
      <span className={`h-full w-full rounded-full ${cls}`} />
    </span>
  );
}

function RunSheetStatus({ status }: { status: "approved" | "in-review" | "draft" }) {
  const map = {
    approved: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20",
    "in-review": "bg-accent/10 text-accent ring-accent/20",
    draft: "bg-secondary text-muted-foreground ring-border",
  } as const;
  const label = status === "in-review" ? "In review" : status[0].toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ring-1 ${map[status]}`}>
      {label}
    </span>
  );
}

function TierTag({ tier }: { tier: "Title" | "Platinum" | "Gold" | "Silver" }) {
  return (
    <span className="rounded-sm border border-border bg-surface px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
      {tier}
    </span>
  );
}

function DeliverableStatus({ status }: { status: "on-track" | "at-risk" | "delivered" }) {
  const map = {
    "on-track": { label: "On track", cls: "text-emerald-700 bg-emerald-500/10 ring-emerald-500/20" },
    "at-risk": { label: "At risk", cls: "text-amber-700 bg-amber-500/10 ring-amber-500/30" },
    delivered: { label: "Delivered", cls: "text-muted-foreground bg-secondary ring-border" },
  } as const;
  const v = map[status];
  return (
    <span className={`inline-flex justify-self-end rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ring-1 ${v.cls}`}>
      {v.label}
    </span>
  );
}

function SystemTile({
  icon: Icon,
  label,
  status,
  detail,
}: {
  icon: typeof Mic2;
  label: string;
  status: "ok" | "warn" | "down";
  detail: string;
}) {
  const dot =
    status === "ok" ? "bg-emerald-500" : status === "warn" ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="lift flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <span className="relative flex h-1.5 w-1.5">
            {status !== "ok" && (
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${dot} animate-ping`} />
            )}
            <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dot}`} />
          </span>
        </div>
        <p className="truncate text-[10px] text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function DayTimeline() {
  const startHour = 8;
  const endHour = 13;
  const totalMin = (endHour - startHour) * 60;
  const tracks: Array<"Mainstage" | "Studio B" | "Breakout"> = ["Mainstage", "Studio B", "Breakout"];

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m - startHour * 60;
  };

  const kindCls: Record<string, string> = {
    keynote: "bg-navy text-navy-foreground",
    fireside: "bg-accent text-accent-foreground",
    panel: "bg-accent/15 text-accent ring-1 ring-accent/30",
    sponsor: "bg-amber-500/15 text-amber-800 ring-1 ring-amber-500/30",
    break: "bg-secondary text-muted-foreground ring-1 ring-border",
  };

  return (
    <div className="p-5">
      {/* Hour ruler */}
      <div className="relative ml-24 h-5 border-b border-border">
        {Array.from({ length: endHour - startHour + 1 }).map((_, i) => {
          const pct = (i * 60) / totalMin * 100;
          return (
            <div key={i} className="absolute -translate-x-1/2" style={{ left: `${pct}%` }}>
              <span className="font-mono text-[10px] text-muted-foreground">
                {String(startHour + i).padStart(2, "0")}:00
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 space-y-2">
        {tracks.map((track) => {
          const blocks = timelineDay.filter((b) => b.track === track);
          return (
            <div key={track} className="flex items-center gap-3">
              <div className="w-20 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {track}
              </div>
              <div className="relative h-9 flex-1 rounded-md bg-surface ring-1 ring-border">
                {blocks.map((b) => {
                  const left = (toMin(b.start) / totalMin) * 100;
                  const width = ((toMin(b.end) - toMin(b.start)) / totalMin) * 100;
                  return (
                    <div
                      key={b.id}
                      className={`absolute inset-y-1 flex items-center overflow-hidden rounded px-2 text-[10px] font-medium ${kindCls[b.kind]}`}
                      style={{ left: `${left}%`, width: `calc(${width}% - 2px)` }}
                      title={`${b.start}–${b.end} · ${b.label}`}
                    >
                      <span className="truncate">{b.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <LegendDot cls="bg-navy" label="Keynote" />
        <LegendDot cls="bg-accent" label="Fireside" />
        <LegendDot cls="bg-accent/40" label="Panel" />
        <LegendDot cls="bg-amber-500/60" label="Sponsor" />
        <LegendDot cls="bg-secondary ring-1 ring-border" label="Break" />
      </div>
    </div>
  );
}

function LegendDot({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-3 rounded-sm ${cls}`} />
      {label}
    </span>
  );
}
