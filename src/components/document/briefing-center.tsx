import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mic, Users, Headphones, Megaphone, Printer, RefreshCw } from "lucide-react";
import {
  generateBriefing,
  type Briefing,
  type BriefingAudience,
} from "@/lib/generate-briefing.functions";
import type { RunSheet } from "@/lib/generate-run-sheet.functions";
import type { EventData } from "@/components/event-context";

type Channel = {
  id: BriefingAudience;
  label: string;
  recipient: string;
  description: string;
  icon: typeof Mic;
};

const CHANNELS: Channel[] = [
  {
    id: "speaker",
    label: "Speaker Brief",
    recipient: "Keynote & session speakers",
    description: "Arrival, mic, stage map, time-on-stage.",
    icon: Mic,
  },
  {
    id: "moderator",
    label: "Moderator Brief",
    recipient: "Session moderators",
    description: "Framing, intros, hard in/out, Q&A discipline.",
    icon: Users,
  },
  {
    id: "production",
    label: "Production Brief",
    recipient: "AV, FOH & stage management",
    description: "Cue stack, mic plot, transitions, contingency.",
    icon: Headphones,
  },
  {
    id: "sponsor",
    label: "Sponsor Brief",
    recipient: "Sponsor & partner activations",
    description: "Branded moments, signage, networking windows.",
    icon: Megaphone,
  },
];

type ChannelState = {
  brief: Briefing | null;
  loading: boolean;
  error: string | null;
};

const EMPTY_STATE: ChannelState = { brief: null, loading: false, error: null };

export function BriefingCenter({
  event,
  runSheet,
}: {
  event: EventData;
  runSheet: RunSheet;
}) {
  const fn = useServerFn(generateBriefing);
  const [active, setActive] = useState<BriefingAudience>("speaker");
  const [channels, setChannels] = useState<Record<BriefingAudience, ChannelState>>({
    speaker: EMPTY_STATE,
    moderator: EMPTY_STATE,
    production: EMPTY_STATE,
    sponsor: EMPTY_STATE,
  });

  const update = (id: BriefingAudience, patch: Partial<ChannelState>) =>
    setChannels((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const run = async (id: BriefingAudience) => {
    update(id, { loading: true, error: null });
    try {
      const brief = await fn({
        data: {
          audience: id,
          eventName: event.name,
          eventType: event.type,
          eventDate: event.date,
          productionSummary: runSheet.productionSummary,
          timeline: runSheet.timeline,
          sponsors: event.sponsors.map((s) => ({ name: s.name, placement: s.placement })),
          avRequirements: event.avRequirements,
        },
      });
      update(id, { brief, loading: false });
    } catch (e) {
      update(id, {
        loading: false,
        error: e instanceof Error ? e.message : "Failed to generate briefing.",
      });
    }
  };

  const activeState = channels[active];
  const activeChannel = CHANNELS.find((c) => c.id === active)!;

  return (
    <section className="rounded-sm border border-navy/15 bg-background">
      {/* Command bar */}
      <header className="flex items-center justify-between border-b border-border bg-navy px-5 py-3 text-navy-foreground">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em]">
            Briefing Center · Live
          </p>
        </div>
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-navy-foreground/70 sm:block">
          {event.name}
        </p>
      </header>

      <div className="grid gap-0 md:grid-cols-[260px_1fr]">
        {/* Channels */}
        <nav className="border-b border-border bg-surface md:border-b-0 md:border-r">
          <ul>
            {CHANNELS.map((c) => {
              const state = channels[c.id];
              const isActive = c.id === active;
              const Icon = c.icon;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActive(c.id)}
                    className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors ${
                      isActive ? "bg-background" : "hover:bg-background/60"
                    }`}
                  >
                    <Icon
                      className={`mt-0.5 h-4 w-4 ${isActive ? "text-accent" : "text-muted-foreground"}`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-navy">{c.label}</p>
                        <StatusDot state={state} />
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                        {c.description}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Console */}
        <div className="min-h-[360px] bg-background">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
                Channel
              </p>
              <p className="mt-0.5 text-sm font-semibold text-navy">
                {activeChannel.label}{" "}
                <span className="font-normal text-muted-foreground">
                  · {activeChannel.recipient}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => run(active)}
                disabled={activeState.loading}
                className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
              >
                {activeState.loading ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent-foreground/40 border-t-accent-foreground" />
                    Generating
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3" />
                    {activeState.brief ? "Regenerate" : "Generate"}
                  </>
                )}
              </button>
              {activeState.brief && (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-foreground hover:bg-surface"
                >
                  <Printer className="h-3 w-3" /> Print
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {activeState.error && (
              <div className="mb-4 rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                {activeState.error}
              </div>
            )}

            {!activeState.brief && !activeState.loading && !activeState.error && (
              <EmptyState channel={activeChannel} onRun={() => run(active)} />
            )}

            {activeState.loading && !activeState.brief && <LoadingShimmer />}

            {activeState.brief && <BriefingView brief={activeState.brief} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusDot({ state }: { state: ChannelState }) {
  if (state.loading)
    return <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />;
  if (state.error) return <span className="h-1.5 w-1.5 rounded-full bg-destructive" />;
  if (state.brief) return <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />;
  return <span className="h-1.5 w-1.5 rounded-full bg-border" />;
}

function EmptyState({ channel, onRun }: { channel: Channel; onRun: () => void }) {
  const Icon = channel.icon;
  return (
    <div className="flex flex-col items-start gap-3 rounded-sm border border-dashed border-border bg-surface/50 p-6">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-navy text-navy-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Channel offline
        </p>
        <p className="mt-1 text-sm text-foreground">
          No briefing generated yet for {channel.recipient.toLowerCase()}.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          FlowStage will distill only the run-of-show content this audience needs.
        </p>
      </div>
      <button
        type="button"
        onClick={onRun}
        className="rounded-sm bg-accent px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-accent-foreground hover:bg-accent/90"
      >
        ✶ Generate brief
      </button>
    </div>
  );
}

function LoadingShimmer() {
  return (
    <div className="space-y-3">
      <div className="shimmer h-3 w-1/2" />
      <div className="shimmer h-2 w-3/4" />
      <div className="shimmer h-2 w-2/3" />
      <div className="mt-6 shimmer h-2 w-5/6" />
      <div className="shimmer h-2 w-4/6" />
    </div>
  );
}

function BriefingView({ brief }: { brief: Briefing }) {
  return (
    <article className="space-y-8 animate-fade-in">
      <header className="border-b border-border pb-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
          {brief.recipient}
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-navy">{brief.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{brief.subtitle}</p>
        <p className="mt-4 text-sm leading-relaxed text-foreground/90">{brief.headline}</p>
      </header>

      <section>
        <h4 className="border-b border-border pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Key Moments
        </h4>
        <ol className="mt-3 space-y-1">
          {brief.keyMoments.map((m, i) => (
            <li
              key={i}
              className="grid grid-cols-[72px_1fr] gap-3 border-b border-border/60 py-2 last:border-0"
            >
              <span className="font-mono text-sm font-semibold text-navy">{m.time}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                {m.note && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{m.note}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        {brief.sections.map((s, i) => (
          <div key={i} className="rounded-sm border border-border bg-surface/40 p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
              {s.heading}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{s.body}</p>
          </div>
        ))}
      </section>

      <section>
        <h4 className="border-b border-border pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          Reminders
        </h4>
        <ul className="mt-3 space-y-1.5 text-sm">
          {brief.reminders.map((r, i) => (
            <li key={i} className="flex gap-2 text-foreground/90">
              <span className="text-accent">›</span> {r}
            </li>
          ))}
        </ul>
      </section>

      <footer className="rounded-sm border-l-2 border-accent bg-surface/60 px-4 py-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
          On-the-day contact
        </p>
        <p className="mt-1 text-sm text-foreground">{brief.contact}</p>
      </footer>
    </article>
  );
}
