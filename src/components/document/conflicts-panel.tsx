import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { OpsModel } from "@/lib/event-model";
import { detectConflicts, type Conflict } from "@/lib/conflicts";

const tone = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-accent/10 text-accent",
  low: "bg-secondary text-muted-foreground",
};

/** Deterministic conflicts and gaps. Changes are applied only after explicit confirmation. */
export function ConflictsPanel({ ops, setOps }: { ops: OpsModel; setOps: (m: OpsModel) => void }) {
  const conflicts = detectConflicts(ops);
  const [confirming, setConfirming] = useState<string | null>(null);
  const label = (id: string) => {
    const i = ops.items.find((x) => x.id === id);
    return i ? (i.code ? `${i.code}` : i.title) + ` (D${i.day} ${i.start})` : id;
  };

  return (
    <section className="rounded-lg border border-border bg-background p-5" data-testid="conflicts-panel">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-navy">Operational conflicts & missing information</h3>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">{conflicts.length} open</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Detected from the event model. Nothing is changed unless you confirm.</p>
      <ul className="mt-4 space-y-3">
        {conflicts.map((c: Conflict) => (
          <li key={c.id} className="rounded-md border border-border p-3 text-xs" data-testid="conflict">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${tone[c.severity]}`}>{c.severity}</span>
              <p className="font-semibold text-foreground">{c.what}</p>
            </div>
            <dl className="mt-2 grid gap-1.5 sm:grid-cols-2">
              <div><dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Affected</dt><dd>{c.itemIds.length ? c.itemIds.slice(0, 8).map(label).join(", ") + (c.itemIds.length > 8 ? ` +${c.itemIds.length - 8}` : "") : "Whole event"}</dd></div>
              <div><dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Why it matters</dt><dd>{c.why}</dd></div>
              <div><dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Recommended resolution</dt><dd>{c.resolution}</dd></div>
              <div><dt className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Operational impact</dt><dd>{c.impact}</dd></div>
            </dl>
            <div className="no-print mt-2 flex flex-wrap items-center gap-2">
              {c.patch && confirming !== c.id && (
                <button type="button" onClick={() => setConfirming(c.id)} className="rounded bg-navy px-2.5 py-1 font-medium text-navy-foreground">
                  {c.patch.label}…
                </button>
              )}
              <button type="button" onClick={() => setOps({ ...ops, dismissedConflicts: [...ops.dismissedConflicts, c.id] })} className="rounded border border-border px-2.5 py-1 text-muted-foreground hover:bg-surface">
                Dismiss
              </button>
            </div>
            {c.patch && confirming === c.id && (
              <div className="no-print mt-2 rounded border border-accent/40 bg-accent/5 p-2">
                <p className="text-foreground">{c.patch.description}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => { setOps(c.patch!.apply(ops)); setConfirming(null); }} className="rounded bg-accent px-2.5 py-1 font-medium text-accent-foreground">Apply change</button>
                  <button type="button" onClick={() => setConfirming(null)} className="rounded border border-border px-2.5 py-1">Cancel</button>
                </div>
              </div>
            )}
          </li>
        ))}
        {conflicts.length === 0 && <li className="text-xs text-muted-foreground">No open conflicts.</li>}
      </ul>
    </section>
  );
}
