import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppTopbar } from "@/components/app-shell/topbar";
import { StatusPill } from "@/components/app-shell/status-pill";
import { events, type EventStatus } from "@/lib/dashboard-data";

export const Route = createFileRoute("/app/events")({
  head: () => ({ meta: [{ title: "Events · FlowStage" }] }),
  component: EventsPage,
});

const filters: { label: string; value: "all" | EventStatus }[] = [
  { label: "All", value: "all" },
  { label: "Rehearsal", value: "rehearsal" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Draft", value: "draft" },
  { label: "Completed", value: "completed" },
];

function EventsPage() {
  const [filter, setFilter] = useState<"all" | EventStatus>("all");
  const rows = filter === "all" ? events : events.filter((e) => e.status === filter);

  return (
    <>
      <AppTopbar breadcrumb="Operations" title="Events" subtitle="All productions managed by your team" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1 rounded-md border border-border bg-background p-1">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    filter === f.value
                      ? "bg-navy text-navy-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {rows.length} of {events.length} events
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Event</th>
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">Venue</th>
                  <th className="px-3 py-2.5 font-medium">Sessions</th>
                  <th className="px-3 py-2.5 font-medium">Owner</th>
                  <th className="px-3 py-2.5 font-medium">Readiness</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-5 py-2.5 font-medium text-right">Rev</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((e) => (
                  <tr key={e.id} className="group hover:bg-surface/60">
                    <td className="px-5 py-3">
                      <Link to="/app/run-of-show" className="font-medium text-foreground group-hover:text-navy">
                        {e.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">{e.type}</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-foreground">
                      {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">
                      {e.venue}
                      <span className="text-muted-foreground/50"> · {e.city}</span>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-foreground">{e.sessions}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{e.owner}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full bg-accent" style={{ width: `${e.readiness}%` }} />
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground">{e.readiness}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={e.status} />
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-muted-foreground">v{e.revision}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
