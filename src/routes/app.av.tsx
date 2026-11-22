import { createFileRoute, Link } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-shell/topbar";
import { useEvent } from "@/components/event-context";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { avSummary } from "@/lib/av-summary";

export const Route = createFileRoute("/app/av")({
  head: () => ({ meta: [
    { title: "AV checklist · FlowStage" },
    { name: "description", content: "AV requirements and part checklists for your current FlowStage event." },
    { property: "og:title", content: "AV checklist · FlowStage" },
    { property: "og:description", content: "Your current event's AV notes and part checklists." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AvPage,
});

function AvPage() {
  const { event } = useEvent();
  const summary = avSummary(event);
  const edit = <Button asChild variant="outline" className="min-h-11"><Link to="/app/new">Edit in setup</Link></Button>;
  return <>
    <AppTopbar breadcrumb="Production" title="AV checklist" primary="none" subtitle={event.name} />
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {summary.empty ? <EmptyState title="No AV information" description="No AV requirements or part checklists have been added to this event." action={edit} /> : <>
          <div className="flex justify-end">{edit}</div>
          {summary.requirements && <section className="border-b border-border pb-6">
            <h2 className="text-sm font-semibold text-foreground">Event AV requirements</h2>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{summary.requirements}</p>
          </section>}
          {summary.parts.map(part => <section key={part.id} className="border-b border-border pb-6">
            <h2 className="break-words text-sm font-semibold text-foreground">{part.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Day {part.day}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-foreground">
              {part.checklist.map((item, index) => <li key={index} className="break-words">{item}</li>)}
            </ul>
          </section>)}
        </>}
      </div>
    </div>
  </>;
}
