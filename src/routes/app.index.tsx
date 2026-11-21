import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, FileDown, FileSpreadsheet, Pencil, Printer, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppTopbar } from "@/components/app-shell/topbar";
import { ExampleDataBanner } from "@/components/app-shell/example-data-banner";
import { useEvent } from "@/components/event-context";
import { useSavedEvent } from "@/hooks/use-saved-event";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { exportEventToExcel } from "@/lib/excel-io";
import { exportEventToWord } from "@/lib/word-io";
import { formatOverviewDateRange, isExampleEvent, overviewSummary } from "@/lib/overview-summary";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [
    { title: "Event overview · FlowStage" },
    { name: "description", content: "Your current event's programme, people, parts and run-of-show exports in FlowStage." },
    { property: "og:title", content: "Event overview · FlowStage" },
    { property: "og:description", content: "View your event summary and export professional event documents." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Overview,
});

function Overview() {
  const { event, runSheet } = useEvent();
  const { savedId } = useSavedEvent();
  const summary = overviewSummary(event);
  const [dateRange, setDateRange] = useState<string | null>(null);
  // Resolve the locale in the browser rather than displaying the server's locale during hydration.
  useEffect(() => { setDateRange(formatOverviewDateRange(event)); }, [event.date, event.endDate]);
  const stats = [
    { label: "Days", value: summary.days },
    { label: "Sessions", value: summary.sessions },
    { label: "Speakers + moderators", value: summary.people },
    { label: "Breaks", value: summary.breaks },
    ...(summary.partCount > 1 ? [{ label: "Parts", value: summary.partCount }] : []),
  ];
  const exportExcel = () => {
    try { exportEventToExcel(event); } catch { toast.error("Could not export Excel. Please try again."); }
  };
  const exportWord = async () => {
    if (!runSheet) return;
    try { await exportEventToWord(event, runSheet); } catch { toast.error("Could not export Word. Please try again."); }
  };

  return (
    <>
      <AppTopbar breadcrumb="Operations" title="Overview" primary="none" />
      {isExampleEvent(event, savedId) && <ExampleDataBanner currentEvent />}
      <div className="min-w-0 flex-1 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {summary.empty ? (
            <EmptyState icon={CalendarDays} title="No programme yet" action={
              <Button asChild className="min-h-11"><Link to="/app/new"><Pencil />Set up your event</Link></Button>
            } secondary={
              <Button asChild variant="link" className="min-h-11"><Link to="/app/import"><Upload />Import existing event</Link></Button>
            } />
          ) : (
            <>
              <section className="space-y-5 border-b border-border pb-6">
                <div className="space-y-2">
                  <h2 className="break-words text-2xl font-semibold text-navy">{event.name || "Untitled event"}</h2>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4 shrink-0" />{dateRange ?? "…"}</p>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 xl:grid-cols-5">
                  {stats.map(stat => <div key={stat.label} className="min-w-0">
                    <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                    <dd className="mt-1 text-2xl font-semibold tabular-nums text-navy">{stat.value}</dd>
                  </div>)}
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Button asChild className="min-h-11"><Link to="/app/run-of-show"><ArrowUpRight />Open run-of-show</Link></Button>
                  <Button asChild variant="outline" className="min-h-11"><Link to="/app/new"><Pencil />Edit setup</Link></Button>
                  <Button asChild variant="outline" className="min-h-11"><Link to="/app/import"><Upload />Import</Link></Button>
                </div>
              </section>
              {summary.partCount > 1 && <section>
                <h2 className="mb-3 text-sm font-semibold text-navy">Parts</h2>
                <ul className="divide-y divide-border">
                  {summary.parts.map(part => <li key={part.id} className="grid min-w-0 gap-1 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:gap-6">
                    <p className="break-words font-medium text-foreground">{part.name}</p>
                    <p className="text-muted-foreground">Day {part.day} · {part.start || "Time not specified"}{part.end && part.start ? `–${part.end}` : ""}</p>
                    <p className="text-muted-foreground">{part.sessions} {part.sessions === 1 ? "session" : "sessions"}</p>
                  </li>)}
                </ul>
              </section>}
              <section className="space-y-2" aria-label="Event exports">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="min-h-11" onClick={exportExcel}><FileSpreadsheet />Export Excel</Button>
                  <Button variant="outline" className="min-h-11" disabled={!runSheet} aria-describedby={!runSheet ? "word-export-hint" : undefined} onClick={() => void exportWord()}><FileDown />Export Word</Button>
                  <Button variant="outline" className="min-h-11" onClick={() => window.print()}><Printer />Print</Button>
                </div>
                {!runSheet && <p id="word-export-hint" className="text-xs text-muted-foreground">A run sheet is needed for Word export.</p>}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
