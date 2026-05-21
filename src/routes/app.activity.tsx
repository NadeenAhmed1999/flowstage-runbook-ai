import { createFileRoute } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-shell/topbar";
import { activity } from "@/lib/dashboard-data";
import { Pencil, Send, MessageSquare, Zap, CheckCheck } from "lucide-react";

export const Route = createFileRoute("/app/activity")({
  head: () => ({ meta: [{ title: "Activity · FlowStage" }] }),
  component: ActivityPage,
});

const iconMap = {
  edit: Pencil,
  publish: Send,
  comment: MessageSquare,
  cue: Zap,
  approval: CheckCheck,
} as const;

function ActivityPage() {
  return (
    <>
      <AppTopbar breadcrumb="Operations" title="Activity" subtitle="Every change across your productions" />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">
          <ol className="relative border-l border-border pl-6">
            {activity.map((a) => {
              const Icon = iconMap[a.kind];
              return (
                <li key={a.id} className="mb-6 last:mb-0">
                  <span className="absolute -left-[11px] grid h-5 w-5 place-items-center rounded-full border border-border bg-background">
                    <Icon className="h-2.5 w-2.5 text-accent" />
                  </span>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">{a.actor}</span>{" "}
                        <span className="text-muted-foreground">{a.action}</span>
                      </p>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Today · {a.at}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-foreground/80">{a.target}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </>
  );
}
