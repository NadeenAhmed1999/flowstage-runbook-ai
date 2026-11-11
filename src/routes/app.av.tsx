import { createFileRoute } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-shell/topbar";
import { avChecklist } from "@/lib/dashboard-data";
import { CheckCircle2, Clock3, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/app/av")({
  head: () => ({ meta: [{ title: "AV checklist · FlowStage" }] }),
  component: AvPage,
});

const areas = ["Audio", "Video", "Lighting", "Broadcast", "Comms"] as const;

const statusIcon = {
  ready: { icon: CheckCircle2, cls: "text-accent" },
  pending: { icon: Clock3, cls: "text-muted-foreground" },
  flagged: { icon: AlertTriangle, cls: "text-destructive" },
};

function AvPage() {
  const total = avChecklist.length;
  const ready = avChecklist.filter((i) => i.status === "ready").length;

  return (
    <>
      <AppTopbar
        breadcrumb="Production"
        title="AV checklist"
        primary="none"
        subtitle={`${ready} of ${total} items ready across all productions`}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <KPI label="Ready" value={String(ready)} tone="accent" />
            <KPI label="Pending" value={String(avChecklist.filter((i) => i.status === "pending").length)} tone="muted" />
            <KPI label="Flagged" value={String(avChecklist.filter((i) => i.status === "flagged").length)} tone="destructive" />
          </div>

          <div className="space-y-6">
            {areas.map((area) => {
              const items = avChecklist.filter((i) => i.area === area);
              if (!items.length) return null;
              return (
                <section key={area} className="overflow-hidden rounded-lg border border-border bg-background">
                  <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-2.5">
                    <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-navy">{area}</h3>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {items.length} items
                    </span>
                  </div>
                  <ul className="divide-y divide-border">
                    {items.map((i) => {
                      const v = statusIcon[i.status];
                      const Icon = v.icon;
                      return (
                        <li key={i.id} className="flex items-center gap-4 px-5 py-3">
                          <Icon className={`h-4 w-4 shrink-0 ${v.cls}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{i.item}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {i.owner} · {i.event}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider ${v.cls}`}
                          >
                            {i.status}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone: "accent" | "muted" | "destructive" }) {
  const toneCls =
    tone === "accent" ? "text-accent" : tone === "destructive" ? "text-destructive" : "text-muted-foreground";
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneCls}`}>{value}</p>
    </div>
  );
}
