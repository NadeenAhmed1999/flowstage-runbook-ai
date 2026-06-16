import { createFileRoute, Link } from "@tanstack/react-router";
import { buildTimeline } from "@/lib/run-of-show";
import { TimelineTable } from "@/components/document/timeline-table";
import { AiRunSheet } from "@/components/document/ai-run-sheet";
import { ReadinessScorePanel } from "@/components/document/readiness-score";
import { SmartReviewPanel } from "@/components/document/smart-review";
import {
  demoEvent,
  demoRunSheet,
  demoReadiness,
  demoReview,
  demoSpeakerMatrix,
  demoSponsorDeliverables,
  demoOpsAlerts,
  demoActivity,
} from "@/lib/demo-event";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Pencil,
  Send,
  MessageSquare,
  Zap,
  CheckCheck,
  Lock,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo Event · FlowStage" },
      {
        name: "description",
        content:
          "Explore a fully populated FlowStage demo event — run-of-show, readiness score, smart review, sponsor deliverables, and operational alerts for a healthcare summit.",
      },
      { property: "og:title", content: "FlowStage Demo Event" },
      {
        property: "og:description",
        content:
          "See how FlowStage runs a 480-delegate healthcare summit end-to-end.",
      },
    ],
  }),
  component: DemoPage,
});

const noop = () => {};

const activityIconMap = {
  edit: Pencil,
  publish: Send,
  comment: MessageSquare,
  cue: Zap,
  approval: CheckCheck,
} as const;

const alertMeta = {
  critical: {
    Icon: AlertTriangle,
    cls: "border-rose-200 bg-rose-50 text-rose-700",
    label: "CRITICAL",
  },
  warning: {
    Icon: AlertCircle,
    cls: "border-amber-200 bg-amber-50 text-amber-700",
    label: "WARNING",
  },
  info: {
    Icon: Info,
    cls: "border-sky-200 bg-sky-50 text-sky-700",
    label: "INFO",
  },
} as const;

const sponsorStatusMeta = {
  "on-track": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "at-risk": "bg-amber-50 text-amber-700 border-amber-200",
  delivered: "bg-sky-50 text-sky-700 border-sky-200",
} as const;

const travelMeta = {
  arrived: "bg-emerald-50 text-emerald-700 border-emerald-200",
  confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  tentative: "bg-amber-50 text-amber-700 border-amber-200",
} as const;

const checkMeta = {
  received: "text-emerald-700",
  pending: "text-amber-700",
  "n/a": "text-muted-foreground",
  scheduled: "text-sky-700",
  "not-scheduled": "text-amber-700",
  complete: "text-emerald-700",
} as const;

function DemoPage() {
  const rows = buildTimeline(demoEvent);
  const formattedDate = new Date(demoEvent.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Demo banner */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-accent/30 bg-accent/[0.04] px-4 py-3 animate-fade-in">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
              Demo Mode · Read-Only
            </p>
            <p className="text-xs text-muted-foreground">
              You're exploring a fictional healthcare summit. Interactive but not editable.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <Lock className="h-3 w-3" /> View only
          </span>
          <Link
            to="/generate"
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 hover:shadow-md hover:-translate-y-px"
          >
            Build your own →
          </Link>
        </div>
      </div>

      {/* Header */}
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 animate-in-up">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent">
            {demoEvent.type} · {formattedDate}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            {demoEvent.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            480 delegates · {demoEvent.sessions.length} sessions · {demoEvent.speakers.length}{" "}
            speakers · {demoEvent.sponsors.length} sponsors
          </p>
        </div>
        <div className="flex items-center gap-2 text-right">
          <KpiTile label="Readiness" value={`${demoReadiness.overallScore}%`} tone="sky" />
          <KpiTile label="Risks" value={`${demoReview.findings.length}`} tone="amber" />
          <KpiTile label="Revision" value="v1.3" tone="muted" />
        </div>
      </header>

      {/* Readiness */}
      <div className="mb-6">
        <ReadinessScorePanel
          report={demoReadiness}
          loading={false}
          error={null}
          onRun={noop}
        />
      </div>

      {/* Smart Review */}
      <div className="mb-6">
        <SmartReviewPanel review={demoReview} loading={false} error={null} onRun={noop} />
      </div>

      {/* Grid: Speaker matrix + Sponsors / Alerts / Activity */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {/* Speaker matrix */}
        <Panel className="lg:col-span-2" title="Speaker Coordination Matrix" subtitle="Travel, bio, deck, rehearsal">
          <div className="overflow-x-auto thin-scroll">
            <table className="w-full min-w-[640px] text-sm tabular">
              <thead>
                <tr className="border-b border-border text-left">
                  <Th>Name</Th>
                  <Th>Role</Th>
                  <Th>Call</Th>
                  <Th>Room</Th>
                  <Th>Travel</Th>
                  <Th>Bio</Th>
                  <Th>Deck</Th>
                  <Th>Rehearsal</Th>
                </tr>
              </thead>
              <tbody>
                {demoSpeakerMatrix.map((r) => (
                  <tr
                    key={r.name}
                    className="border-b border-border/60 transition-colors hover:bg-accent/[0.03]"
                  >
                    <td className="py-2.5 pr-3 font-medium text-foreground">{r.name}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{r.role}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{r.callTime}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs text-muted-foreground">{r.greenRoom}</td>
                    <td className="py-2.5 pr-3">
                      <Pill cls={travelMeta[r.travel]}>{r.travel}</Pill>
                    </td>
                    <td className={`py-2.5 pr-3 text-xs font-medium ${checkMeta[r.bio]}`}>
                      {r.bio}
                    </td>
                    <td className={`py-2.5 pr-3 text-xs font-medium ${checkMeta[r.deck]}`}>
                      {r.deck}
                    </td>
                    <td className={`py-2.5 pr-3 text-xs font-medium ${checkMeta[r.rehearsal]}`}>
                      {r.rehearsal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Ops alerts */}
        <Panel title="Operational Alerts" subtitle="Live signals from the production room">
          <ul className="space-y-2.5">
            {demoOpsAlerts.map((a, i) => {
              const meta = alertMeta[a.severity];
              const Icon = meta.Icon;
              return (
                <li
                  key={i}
                  className={`flex gap-3 rounded-md border px-3 py-2.5 ${meta.cls}`}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight">{a.title}</p>
                      <span className="font-mono text-[9px] uppercase tracking-wider opacity-70">
                        {a.at}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs leading-snug opacity-90">{a.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      {/* Sponsors + Activity */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Sponsor Deliverables" subtitle="Tracking across all activations">
          <div className="space-y-3">
            {demoSponsorDeliverables.map((s, i) => (
              <div
                key={i}
                className="rounded-md border border-border bg-background p-3 transition-colors hover:bg-accent/[0.03]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-accent">
                      {s.tier}
                    </span>
                    <p className="text-sm font-semibold text-navy">{s.sponsor}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill cls={sponsorStatusMeta[s.status]}>{s.status}</Pill>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Due {s.due}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.deliverable}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full transition-all ${
                        s.status === "at-risk"
                          ? "bg-amber-500"
                          : s.status === "delivered"
                            ? "bg-sky-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] tabular text-muted-foreground">
                    {s.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Recent Activity" subtitle="Today">
          <ol className="relative border-l border-border pl-5">
            {demoActivity.map((a, i) => {
              const Icon = activityIconMap[a.kind];
              return (
                <li key={i} className="mb-4 last:mb-0">
                  <span className="absolute -left-[9px] grid h-4 w-4 place-items-center rounded-full border border-border bg-background">
                    <Icon className="h-2 w-2 text-accent" />
                  </span>
                  <p className="text-xs text-foreground">
                    <span className="font-semibold">{a.actor}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{a.target}</p>
                  <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {a.at}
                  </p>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>

      {/* Document */}
      <article className="rounded-sm border border-border bg-background p-8 shadow-sm sm:p-10 animate-fade-in">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-navy/10 pb-6">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">
              Run-of-Show Document // DEMO
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-navy">
              {demoEvent.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {demoEvent.type} · {formattedDate}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs font-medium text-foreground">REV: 1.3</p>
            <p className="mt-1 text-xs text-muted-foreground">{rows[0]?.time ?? "—"} START</p>
          </div>
        </header>

        <section className="mb-10 overflow-x-auto thin-scroll">
          <h3 className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
            Timeline
          </h3>
          <div className="min-w-[700px]">
            <TimelineTable rows={rows} />
          </div>
        </section>

        <section className="mt-2">
          <AiRunSheet sheet={demoRunSheet} />
        </section>

        <footer className="mt-12 border-t border-border pt-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Generated by FlowStage · End of demo document
          </p>
        </footer>
      </article>

      {/* Bottom CTA */}
      <div className="no-print mt-10 rounded-md border border-border bg-surface p-6 text-center animate-fade-in">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
          Ready to build your own?
        </p>
        <h3 className="mt-2 text-xl font-semibold text-navy">
          Generate a professional run-of-show in minutes.
        </h3>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            to="/generate"
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 hover:shadow-md hover:-translate-y-px"
          >
            Start Building →
          </Link>
          <Link
            to="/"
            className="rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function KpiTile({ label, value, tone }: { label: string; value: string; tone: "sky" | "amber" | "muted" }) {
  const toneCls =
    tone === "sky"
      ? "text-sky-700"
      : tone === "amber"
        ? "text-amber-700"
        : "text-foreground";
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-left lift">
      <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-semibold tabular ${toneCls}`}>{value}</p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-sm border border-border bg-background animate-fade-in ${className}`}
    >
      <header className="border-b border-border px-5 py-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
          {title}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="pb-2 pr-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </th>
  );
}

function Pill({ cls, children }: { cls: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${cls}`}
    >
      {children}
    </span>
  );
}
