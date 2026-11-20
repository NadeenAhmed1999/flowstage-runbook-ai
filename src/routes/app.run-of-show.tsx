import { createFileRoute, Link } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-shell/topbar";
import { useEvent } from "@/components/event-context";
import { buildTimeline } from "@/lib/run-of-show";
import { TimelineTable } from "@/components/document/timeline-table";
import { OpsRunOfShow } from "@/components/document/ops-run-of-show";
import { ArrowUpRight, Printer, Pencil } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/run-of-show")({
  head: () => ({ meta: [{ title: "Run-of-show · FlowStage" }] }),
  component: AppRunOfShow,
});

function AppRunOfShow() {
  const { event, ops, reset } = useEvent();
  const rows = buildTimeline(event);

  return (
    <>
      <AppTopbar
        breadcrumb={`Events / ${event.name}`}
        title="Run-of-show"
        primary="none"
        subtitle={`${event.type} · ${event.date} · ${rows.length} cues`}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_280px]">
          <section className="rounded-lg border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                  Document · Live
                </p>
                <h2 className="mt-0.5 text-sm font-semibold text-navy">{event.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/app/new"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Link>
                <Link
                  to="/run-of-show"
                  className="inline-flex items-center gap-1.5 rounded-md bg-navy px-2.5 py-1.5 text-xs font-medium text-navy-foreground hover:bg-navy/90"
                >
                  Full document <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
              </div>
            </div>
            <div className="overflow-x-auto p-5">
              {ops.items.length === 0 ? (
                <EmptyState
                  title="No programme items"
                  action={<Button asChild className="min-h-11"><Link to="/app/import">Import agenda</Link></Button>}
                  secondary={<Button type="button" variant="link" className="min-h-11" onClick={reset}>Use the sample</Button>}
                />
              ) : (
                ops.parts.length > 1 ? <OpsRunOfShow ops={ops} /> : <>
                  <div className="md:hidden"><OpsRunOfShow ops={ops} /></div>
                  <div className="hidden min-w-[700px] md:block"><TimelineTable rows={rows} /></div>
                </>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <Panel title="Show Vitals">
              <Row k="Date" v={event.date} />
              <Row k="Type" v={event.type} />
              <Row k="Sessions" v={String(event.sessions.length)} />
              <Row k="Speakers" v={String(event.speakers.length)} />
              <Row k="Breaks" v={String(event.breaks.length)} />
              <Row k="Sponsors" v={String(event.sponsors.length)} />
            </Panel>

            <Panel title="AV Posture">
              <p className="text-xs leading-relaxed text-muted-foreground">{event.avRequirements}</p>
            </Panel>

            <Panel title="Stage Manager Notes">
              <ul className="space-y-1.5 text-xs text-foreground">
                <li>· All cues called from booth.</li>
                <li>· Green Room A reserved for keynote speakers.</li>
                <li>· Holding area stage-right 15 min before each session.</li>
              </ul>
            </Panel>
          </aside>
        </div>
      </div>
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <h3 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-1.5 text-xs last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono font-medium text-foreground">{v}</span>
    </div>
  );
}
