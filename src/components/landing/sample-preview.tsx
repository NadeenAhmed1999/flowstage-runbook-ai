import { Link } from "@tanstack/react-router";
import { TimelineTable } from "@/components/document/timeline-table";
import { buildTimeline } from "@/lib/run-of-show";
import { seedEvent } from "@/components/event-context";

export function SamplePreview() {
  const rows = buildTimeline(seedEvent).slice(0, 4);
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid overflow-hidden rounded-xl border border-border bg-surface animate-in-up lg:grid-cols-[380px_1fr]">
        {/* Form sidebar */}
        <div className="border-b border-border bg-background p-6 lg:border-b-0 lg:border-r">
          <div className="mb-8">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Configuration
            </h3>
            <h2 className="mt-1 text-lg font-semibold text-foreground">Event Details</h2>
          </div>
          <div className="space-y-5">
            <Field label="Event Name" value="Global Tech Summit 2025" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type" value="Conference" />
              <Field label="Date" value="2025-11-14" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Key Speakers
              </label>
              <div className="space-y-2">
                {["Elena Thorne (CTO)", "Marcus Chen (Product Lead)", "Dr. Aris Patel (Researcher)"].map((n) => (
                  <div key={n} className="flex items-center gap-2 rounded border border-border bg-surface px-2 py-1.5">
                    <div className="size-5 rounded-full bg-navy/10" />
                    <span className="text-xs">{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              to="/generate"
              className="block w-full rounded-md bg-navy py-2.5 text-center text-xs font-bold uppercase tracking-widest text-navy-foreground"
            >
              Open Generator
            </Link>
          </div>
        </div>

        {/* Document preview */}
        <div className="overflow-x-auto p-8 lg:p-12">
          <div className="min-w-[640px] rounded-sm bg-background p-8 shadow-sm ring-1 ring-black/5">
            <div className="mb-8 flex justify-between border-b border-navy/10 pb-6">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
                  Official Document // CONFIDENTIAL
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-navy">
                  Global Tech Summit 2025
                </h3>
                <p className="text-sm text-muted-foreground">
                  Opening Keynote · The Future of Distributed Systems
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-medium text-foreground">REV: 2.1</p>
                <p className="mt-1 text-xs text-muted-foreground">09:00 START</p>
              </div>
            </div>
            <TimelineTable rows={rows} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">{value}</div>
    </div>
  );
}
