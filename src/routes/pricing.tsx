import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [
    { title: "Early access — FlowStage" },
    { name: "description", content: "FlowStage is free during early access. Create event plans, import agendas, and save your events to your account." },
    { property: "og:title", content: "FlowStage early access" },
    { property: "og:description", content: "Free during early access. Paid plans will be announced later." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PricingPage,
});

const features = [
  "AI run-sheet generation",
  "Event types and templates",
  "Multi-day and multi-part events",
  "Excel and Word import with editable review",
  "Smart Review and readiness score",
  "Briefing center",
  "Excel and Word export; print or PDF via browser print",
  "Save and open events with an account",
];

function PricingPage() {
  return <div className="mx-auto max-w-7xl px-6 py-20">
    <header className="mx-auto max-w-2xl text-center animate-in-up">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent">Early access</p>
      <h1 className="mt-4 text-balance text-4xl font-semibold text-navy sm:text-5xl">FlowStage early access</h1>
    </header>
    <article className="mx-auto mt-14 max-w-xl rounded-lg border border-border bg-card p-7">
      <h2 className="text-2xl font-semibold text-navy">Free during early access</h2>
      <ul className="mt-6 space-y-3">
        {features.map(feature => <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground"><Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent" /><span>{feature}</span></li>)}
      </ul>
      <p className="mt-6 text-sm leading-6 text-muted-foreground">Paid plans will be announced later; early users will be told first</p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button asChild className="min-h-11"><Link to="/app/new">New event</Link></Button>
        <Button asChild variant="link" className="min-h-11"><Link to="/auth" search={{ next: "/app/new" }}>Sign in</Link></Button>
      </div>
    </article>
    <section className="mt-16">
      <h2 className="text-center text-xl font-semibold text-navy">Frequently asked</h2>
      <div className="mx-auto mt-8 grid max-w-4xl gap-5 sm:grid-cols-2">
        {[
          { q: "Is there a paid plan?", a: "FlowStage is free during early access. Paid plans will be announced later." },
          { q: "Do you support multi-day events?", a: "Yes. Events can span several days and include multiple programme parts." },
          { q: "Do I need an account?", a: "You can explore the sample and set up an event signed out. Sign in to save and open your personal events." },
          { q: "Is my event data private?", a: "Your events are saved to your account and visible only to you unless shared." },
        ].map(item => <div key={item.q} className="rounded-lg border border-border bg-card p-5"><h3 className="text-sm font-semibold text-navy">{item.q}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.a}</p></div>)}
      </div>
    </section>
  </div>;
}
