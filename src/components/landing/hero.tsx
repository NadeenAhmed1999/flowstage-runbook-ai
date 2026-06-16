import { Link } from "@tanstack/react-router";

export function Hero() {
  return (
    <header className="mx-auto max-w-7xl px-6 pt-24 pb-16 text-center animate-in-up">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-6">
        Event Operations · v1.0
      </p>
      <h1 className="text-balance text-5xl font-semibold tracking-tight text-navy sm:text-6xl">
        Operational clarity for <br className="hidden sm:block" />
        high-stakes stage production.
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">
        FlowStage is the AI engine for generating professional, timecoded run-of-show documents.
        Built for stage managers, broadcast producers, and event leads.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/generate"
          className="group inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all duration-200 hover:bg-accent/90 hover:shadow-md hover:-translate-y-px active:translate-y-0"
        >
          Start Building
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
        <Link
          to="/demo"
          className="group inline-flex items-center gap-2 rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-navy-foreground shadow-sm transition-all duration-200 hover:bg-navy/90 hover:shadow-md hover:-translate-y-px"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          View Demo Event
        </Link>
        <Link
          to="/run-of-show"
          className="rounded-md bg-background px-5 py-2.5 text-sm font-semibold text-navy ring-1 ring-inset ring-border transition-all duration-200 hover:bg-surface hover:ring-accent/30"
        >
          View Sample Document
        </Link>
      </div>
      <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Trusted by conference organizers · event agencies · healthcare congress teams
      </p>
    </header>
  );
}
