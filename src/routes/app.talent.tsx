import { createFileRoute, Link } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-shell/topbar";
import { useEvent } from "@/components/event-context";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { talentSummary } from "@/lib/talent-summary";

export const Route = createFileRoute("/app/talent")({
  head: () => ({ meta: [
    { title: "Talent · FlowStage" },
    { name: "description", content: "Speakers, moderators and session assignments for your current FlowStage event." },
    { property: "og:title", content: "Talent · FlowStage" },
    { property: "og:description", content: "Your current event's people and programme assignments." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: TalentPage,
});

function TalentPage() {
  const { event } = useEvent();
  const summary = talentSummary(event);
  const edit = <Button asChild variant="outline" className="min-h-11"><Link to="/app/new">Edit in setup</Link></Button>;
  return <>
    <AppTopbar breadcrumb="People" title="Talent" primary="none" subtitle={event.name} />
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {summary.people.length > 0 && <p className="text-sm text-muted-foreground">{summary.speakers} speakers · {summary.moderators} moderators · {summary.sessionsWithoutSpeaker} sessions without a speaker</p>}
          {summary.people.length > 0 && edit}
        </div>
        {summary.people.length === 0 ? <EmptyState title="No speakers or moderators" description="No people have been added to this event." action={edit} /> :
          <ul className="divide-y divide-border">
            {summary.people.map(person => <li key={person.id} className="grid gap-3 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <div className="min-w-0 break-words">
                <h2 className="text-sm font-semibold text-foreground">{person.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">{person.duties.join(" / ")}{person.role && !person.duties.includes(person.role) ? ` · ${person.role}` : ""}</p>
                {person.organisation && <p className="mt-1 text-xs text-muted-foreground">{person.organisation}</p>}
              </div>
              <ul className="min-w-0 space-y-3">
                {person.sessions.length === 0 && <li className="text-sm text-muted-foreground">No session assignments</li>}
                {person.sessions.map(session => <li key={session.id} className="break-words">
                  <p className="text-sm text-foreground">{session.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Day {session.day} · {session.start ? `${session.start}${session.end ? `–${session.end}` : ""}` : "Time not specified"}{session.partName ? ` · ${session.partName}` : ""}</p>
                </li>)}
              </ul>
            </li>)}
          </ul>}
      </div>
    </div>
  </>;
}
