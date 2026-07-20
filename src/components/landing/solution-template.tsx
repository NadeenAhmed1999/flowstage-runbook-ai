import { Link } from "@tanstack/react-router";

export type SolutionPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  pains: { title: string; body: string }[];
  outcomes: { title: string; body: string }[];
};

export function SolutionTemplate(p: SolutionPageProps) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent">{p.eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">{p.title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{p.subtitle}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/generate" className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90">
          Generate an Event Plan →
        </Link>
        <Link to="/demo" className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-navy-foreground shadow-sm hover:bg-navy/90">
          View Interactive Demo
        </Link>
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Where teams get stuck</p>
          <div className="mt-4 space-y-4">
            {p.pains.map((it) => (
              <div key={it.title} className="rounded-xl border border-border bg-surface p-5">
                <p className="text-sm font-semibold text-navy">{it.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">How FlowStage delivers</p>
          <div className="mt-4 space-y-4">
            {p.outcomes.map((it) => (
              <div key={it.title} className="rounded-xl border border-border bg-background p-5 lift">
                <p className="text-sm font-semibold text-navy">{it.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
