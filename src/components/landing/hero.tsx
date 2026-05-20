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
      <div className="mt-10 flex items-center justify-center gap-4">
        <Link
          to="/generate"
          className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90 transition-colors"
        >
          Start Building
        </Link>
        <Link
          to="/run-of-show"
          className="rounded-md bg-background px-5 py-2.5 text-sm font-semibold text-navy ring-1 ring-inset ring-border hover:bg-surface transition-colors"
        >
          View Sample Document
        </Link>
      </div>
    </header>
  );
}
