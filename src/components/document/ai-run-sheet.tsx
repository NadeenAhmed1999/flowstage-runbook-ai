import { useState } from "react";
import type { RunSheet } from "@/lib/generate-run-sheet.functions";

const kindStyles: Record<string, { label: string; cls: string }> = {
  session: { label: "SESSION", cls: "bg-navy text-navy-foreground" },
  transition: { label: "TRANSITION", cls: "bg-accent/15 text-accent border border-accent/30" },
  break: { label: "BREAK", cls: "bg-muted text-foreground" },
  sponsor: { label: "SPONSOR", cls: "bg-accent/10 text-accent" },
  ops: { label: "OPS", cls: "bg-foreground/10 text-foreground" },
};

export function AiRunSheet({ sheet }: { sheet: RunSheet }) {
  return (
    <div className="space-y-10">
      <section className="rounded-sm border border-navy/10 bg-surface p-6">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            AI-Generated Production Summary
          </p>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-foreground/90">{sheet.productionSummary}</p>
      </section>

      <section>
        <SectionHeader label="Detailed Timeline" count={sheet.timeline.length} />
        <ol className="mt-4 space-y-px">
          {sheet.timeline.map((b, i) => {
            const style = kindStyles[b.kind] ?? kindStyles.ops;
            return (
              <li
                key={i}
                className="grid grid-cols-[88px_120px_1fr] gap-4 border-b border-border bg-background px-4 py-4 first:border-t transition-colors hover:bg-accent/[0.03]"
              >
                <div>
                  <p className="font-mono text-sm font-semibold text-navy">{b.time}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    +{b.durationMin} min
                  </p>
                </div>
                <div>
                  <span
                    className={`inline-block rounded-sm px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${style.cls}`}
                  >
                    {style.label}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy">{b.title}</p>
                  {b.subtitle && (
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{b.subtitle}</p>
                  )}
                  {b.talent && (
                    <p className="mt-1 text-xs text-foreground/80">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Talent ·{" "}
                      </span>
                      {b.talent}
                    </p>
                  )}
                  {b.cues.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {b.cues.map((c, ci) => (
                        <span
                          key={ci}
                          className="rounded-sm border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide text-navy"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                  {(b.moderatorCue || b.backstageNote) && (
                    <div className="mt-2 space-y-1 border-l-2 border-accent/40 pl-3 text-xs text-foreground/80">
                      {b.moderatorCue && (
                        <p>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                            Mod ·{" "}
                          </span>
                          {b.moderatorCue}
                        </p>
                      )}
                      {b.backstageNote && (
                        <p>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            Backstage ·{" "}
                          </span>
                          {b.backstageNote}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <NotesPanel title="AV Reminders" tone="accent" items={sheet.avReminders} />
        <NotesPanel title="Backstage Coordination" tone="navy" items={sheet.backstageCoordination} />
        <NotesPanel title="Moderator Cues" tone="accent" items={sheet.moderatorCues} />
        <NotesPanel title="Sponsor Visibility" tone="navy" items={sheet.sponsorVisibility} />
        <NotesPanel title="Networking Breaks" tone="navy" items={sheet.networkingBreaks} />
        <NotesPanel title="Production Notes" tone="accent" items={sheet.productionNotes} />
      </div>

      <section className="rounded-sm border border-destructive/20 bg-destructive/5 p-6">
        <SectionHeader label="Contingency Reminders" count={sheet.contingencyReminders.length} tone="warn" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {sheet.contingencyReminders.map((n, i) => (
            <div key={i} className="rounded-sm border border-destructive/20 bg-background p-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-destructive">
                ⚠ {n.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/90">{n.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  label,
  count,
  tone = "default",
}: {
  label: string;
  count?: number;
  tone?: "default" | "warn";
}) {
  const color = tone === "warn" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <h3 className={`font-mono text-[11px] font-bold uppercase tracking-[0.25em] ${color}`}>
        {label}
      </h3>
      {count !== undefined && (
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {count} entries
        </span>
      )}
    </div>
  );
}

function NotesPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: { title: string; detail: string }[];
  tone: "accent" | "navy";
}) {
  const [open, setOpen] = useState(true);
  if (items.length === 0) return null;
  const dotCls = tone === "accent" ? "bg-accent" : "bg-navy";
  return (
    <section className="lift rounded-sm border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-surface"
      >
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            {title}
          </h4>
          <span className="font-mono text-[10px] text-muted-foreground">({items.length})</span>
        </div>
        <span className="font-mono text-xs text-muted-foreground">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <ul className="divide-y divide-border border-t border-border">
          {items.map((n, i) => (
            <li key={i} className="px-5 py-3">
              <p className="text-sm font-semibold text-navy">{n.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground/80">{n.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
