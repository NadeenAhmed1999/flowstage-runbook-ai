import { createFileRoute, Link } from "@tanstack/react-router";
import { SAMPLE_META } from "@/lib/sample-summit-event";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources — FlowStage" },
      { name: "description", content: "Guides, templates, and the interactive demo for FlowStage — the AI Operating System for Professional Events." },
      { property: "og:title", content: "FlowStage Resources" },
      { property: "og:description", content: "How teams operate professional events with an AI OS." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent">Resources</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy">
        Learn how professional teams run events on FlowStage.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
        Explore the interactive demo, browse the built-in event templates, and read what an AI
        Operating System means for event operations.
      </p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <ResourceCard
          to="/demo"
          eyebrow="Interactive"
          title="Explore the sample event"
          body={`Explore ${SAMPLE_META.name}: a fictional two-day run-of-show with parallel tracks, changeover checks, and conflicts you can review.`}
        />
        <ResourceCard
          to="/generate"
          eyebrow="Get started"
          title="Generate your first event plan"
          body="Pick a template, add components, and let FlowStage generate a run sheet. Review, readiness, and briefings are available separately."
        />
        <ResourceCard
          to="/pricing"
          eyebrow="Plans"
          title="Free during early access"
          body="Explore the available features. Paid plans will be announced later."
        />
        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Concept</p>
          <p className="mt-2 text-sm font-semibold text-navy">What's an AI OS for events?</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            An AI Operating System replaces spreadsheets and disconnected documents with a single
            plan that generates run sheets, detects risks, briefs stakeholders, scores readiness,
            and answers operational questions — coordinated by AI.
          </p>
        </div>
      </div>
    </div>
  ),
});

function ResourceCard({
  to,
  eyebrow,
  title,
  body,
}: {
  to: "/demo" | "/generate" | "/pricing";
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <Link to={to} className="lift rounded-xl border border-border bg-background p-6 block">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">{eyebrow}</p>
      <p className="mt-2 text-sm font-semibold text-navy">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </Link>
  );
}
