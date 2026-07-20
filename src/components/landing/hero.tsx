import { Link } from "@tanstack/react-router";

export function Hero() {
  return (
    <header className="mx-auto max-w-7xl px-6 pt-24 pb-16 text-center animate-in-up">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-6">
        Event Operations Platform · v2.0
      </p>
      <h1 className="text-balance text-5xl font-semibold tracking-tight text-navy sm:text-6xl">
        AI Operating System for <br className="hidden sm:block" />
        Professional Events
      </h1>
      <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted-foreground text-pretty">
        Generate production-ready run sheets, identify operational risks, brief stakeholders, track
        event readiness, and coordinate every aspect of event execution from a single platform.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/generate"
          className="group inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all duration-200 hover:bg-accent/90 hover:shadow-md hover:-translate-y-px"
        >
          Generate Your First Event Plan
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
        <Link
          to="/demo"
          className="group inline-flex items-center gap-2 rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-navy-foreground shadow-sm transition-all duration-200 hover:bg-navy/90 hover:shadow-md hover:-translate-y-px"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          View Interactive Demo
        </Link>
      </div>
      <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        Conferences · Summits · Forums · Corporate events · Multi-component programmes
      </p>
    </header>
  );
}
