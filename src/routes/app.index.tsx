import { createFileRoute, Link } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-shell/topbar";
import { StatusPill } from "@/components/app-shell/status-pill";
import { events, activity } from "@/lib/dashboard-data";
import { ArrowUpRight, TrendingUp, Clock3, CheckCircle2, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Overview · FlowStage" }] }),
  component: Overview,
});

function Overview() {
  const upcoming = events.filter((e) => e.status !== "completed").slice(0, 4);
  const next = upcoming[0];

  const stats = [
    { label: "Active events", value: "4", delta: "+1 this week", icon: TrendingUp },
    { label: "Hours of programming", value: "62.5", delta: "Across 5 venues", icon: Clock3 },
    { label: "Cues approved", value: "184 / 212", delta: "87% ready", icon: CheckCircle2 },
    { label: "Open AV flags", value: "3", delta: "1 critical", icon: AlertTriangle },
  ];

  return (
    <>
      <AppTopbar breadcrumb="Operations" title="Overview" subtitle="Run-of-show readiness across your active portfolio" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
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
                  Readiness breakdown
                </p>
                <div className="mt-4 space-y-3 text-xs">
                  <Bar label="Content" value={92} />
                  <Bar label="Talent confirmed" value={86} />
                  <Bar label="AV check" value={78} />
                  <Bar label="Sponsor copy" value={70} />
                  <Bar label="Broadcast" value={64} />
                </div>
              </div>
            </div>
          )}

          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {s.label}
                    </p>
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-navy">{s.value}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{s.delta}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Upcoming events */}
            <section className="rounded-lg border border-border bg-background">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <h3 className="text-sm font-semibold text-navy">Upcoming productions</h3>
                <Link to="/app/events" className="text-xs font-medium text-accent hover:underline">
                  All events
                </Link>
              </div>
              <ul className="divide-y divide-border">
                {upcoming.map((e) => (
                  <li key={e.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface font-mono text-[10px] font-bold uppercase tracking-wider text-navy">
                      {new Date(e.date).toLocaleDateString("en-US", { month: "short" })}
                      <br />
                      {new Date(e.date).getDate()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{e.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.venue} · {e.city} · {e.sessions} sessions
                      </p>
                    </div>
                    <div className="hidden w-32 md:block">
                      <Bar value={e.readiness} label={`${e.readiness}%`} compact />
                    </div>
                    <StatusPill status={e.status} />
                  </li>
                ))}
              </ul>
            </section>

            {/* Activity */}
            <section className="rounded-lg border border-border bg-background">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <h3 className="text-sm font-semibold text-navy">Live activity</h3>
                <Link to="/app/activity" className="text-xs font-medium text-accent hover:underline">
                  Full log
                </Link>
              </div>
              <ul className="divide-y divide-border">
                {activity.slice(0, 6).map((a) => (
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
        </div>
      </div>
    </>
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

function Bar({ label, value, compact }: { label: string; value: number; compact?: boolean }) {
  return (
    <div>
      {!compact && (
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-mono font-semibold text-foreground">{value}%</span>
        </div>
      )}
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </div>
      {compact && <p className="mt-1 text-right font-mono text-[10px] text-muted-foreground">{label}</p>}
    </div>
  );
}
