import { createFileRoute } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-shell/topbar";
import { ExampleDataBanner } from "@/components/app-shell/example-data-banner";
import { talent } from "@/lib/dashboard-data";

export const Route = createFileRoute("/app/talent")({
  head: () => ({ meta: [{ title: "Talent · FlowStage" }] }),
  component: TalentPage,
});

const statusCls: Record<string, string> = {
  confirmed: "bg-navy/10 text-navy",
  tentative: "bg-secondary text-muted-foreground",
  arrived: "bg-accent/10 text-accent",
  "on-stage": "bg-destructive/10 text-destructive",
};

function TalentPage() {
  return (
    <>
      <AppTopbar breadcrumb="People" title="Talent" primary="none" subtitle="Speakers, moderators, and backstage assignments" />
      <ExampleDataBanner />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Confirmed" value={String(talent.filter((t) => t.status === "confirmed").length)} />
            <Stat label="Arrived" value={String(talent.filter((t) => t.status === "arrived").length)} />
            <Stat label="Tentative" value={String(talent.filter((t) => t.status === "tentative").length)} />
            <Stat label="Green Rooms" value="3" />
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Name</th>
                  <th className="px-3 py-2.5 font-medium">Role</th>
                  <th className="px-3 py-2.5 font-medium">Organisation</th>
                  <th className="px-3 py-2.5 font-medium">Event</th>
                  <th className="px-3 py-2.5 font-medium">Call</th>
                  <th className="px-3 py-2.5 font-medium">Green Room</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {talent.map((t) => (
                  <tr key={t.id} className="hover:bg-surface/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-7 w-7 place-items-center rounded-full bg-navy text-[10px] font-bold text-navy-foreground">
                          {t.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                        </div>
                        <span className="font-medium text-foreground">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{t.role}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{t.org}</td>
                    <td className="px-3 py-3 text-xs text-foreground">{t.event}</td>
                    <td className="px-3 py-3 font-mono text-xs text-accent">{t.callTime}</td>
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{t.greenRoom}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusCls[t.status]}`}
                      >
                        {t.status}
                      </span>
                    </td>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-navy">{value}</p>
    </div>
  );
}
