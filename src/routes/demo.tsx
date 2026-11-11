import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { OpsRunOfShow } from "@/components/document/ops-run-of-show";
import { ConflictsPanel } from "@/components/document/conflicts-panel";
import { sampleOps, SAMPLE_META } from "@/lib/sample-summit-event";
import { buildBands, deriveSetupBlocks } from "@/lib/ops-schedule";
import { detectConflicts } from "@/lib/conflicts";
import type { OpsModel } from "@/lib/event-model";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Sample event · FlowStage" },
      {
        name: "description",
        content:
          "Explore a fictional two-day summit in FlowStage: parallel tracks, changeovers, conflicts and unknowns, all on one operational run-of-show.",
      },
      { property: "og:title", content: "FlowStage sample — operational run-of-show" },
      {
        property: "og:description",
        content: "A fictional summit with parallel tracks, changeover checks and conflict detection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  // Local, in-page state only: visitors can try fixes; nothing is saved.
  const [ops, setOps] = useState<OpsModel>(sampleOps);
  const stats = useMemo(() => {
    const bands = buildBands(ops.items);
    return {
      sessions: ops.items.filter((i) => i.type !== "break" && i.type !== "meal").length,
      pairs: bands.filter((b) => b.concurrent).length,
      red: deriveSetupBlocks(ops).filter((s) => s.insufficient).length,
      conflicts: detectConflicts(ops).length,
    };
  }, [ops]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-6 rounded-md border border-accent/30 bg-accent/5 px-4 py-2 text-xs text-foreground">
        Sample event — all names, organisations and titles are fictional. Changes you make here are not saved.
      </div>

      <header className="mb-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent">
          {SAMPLE_META.type} · 02–03 December 2026
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">{SAMPLE_META.name}</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Kpi label="Sessions" value={stats.sessions} />
          <Kpi label="Parallel pairs" value={stats.pairs} />
          <Kpi label="Tight changeovers" value={stats.red} />
          <Kpi label="Open issues" value={stats.conflicts} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/generate" className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-navy-foreground hover:bg-navy/90">
            New event
          </Link>
          <Link to="/pricing" className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface">
            See pricing
          </Link>
        </div>
      </header>

      <div className="mb-8">
        <ConflictsPanel ops={ops} setOps={setOps} />
      </div>

      <article className="rounded-sm border border-border bg-background p-6 shadow-sm sm:p-10">
        <h2 className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Operational run-of-show
        </h2>
        <OpsRunOfShow ops={ops} setOps={setOps} />
      </article>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular text-navy">{value}</p>
    </div>
  );
}
