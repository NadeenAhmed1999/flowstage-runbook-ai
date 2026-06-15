import type { EventStatus } from "@/lib/dashboard-data";

const map: Record<EventStatus, { label: string; cls: string; dot: string; pulse?: boolean }> = {
  live: { label: "Live", cls: "bg-destructive/10 text-destructive ring-destructive/20", dot: "bg-destructive", pulse: true },
  rehearsal: { label: "Rehearsal", cls: "bg-accent/10 text-accent ring-accent/20", dot: "bg-accent", pulse: true },
  scheduled: { label: "Scheduled", cls: "bg-navy/10 text-navy ring-navy/20", dot: "bg-navy" },
  completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400", dot: "bg-emerald-500" },
  draft: { label: "Draft", cls: "bg-secondary text-muted-foreground ring-border", dot: "bg-muted-foreground/60" },
};

export function StatusPill({ status }: { status: EventStatus }) {
  const v = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 transition-colors ${v.cls}`}>
      <span className="relative flex h-1.5 w-1.5">
        {v.pulse && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${v.dot} animate-ping`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${v.dot}`} />
      </span>
      {v.label}
    </span>
  );
}
