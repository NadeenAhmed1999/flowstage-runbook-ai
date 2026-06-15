import { useState } from "react";
import type { SmartReview, SmartReviewFinding } from "@/lib/smart-review.functions";
import { AlertTriangle, AlertCircle, Info, ShieldCheck, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  review: SmartReview | null;
  loading: boolean;
  error: string | null;
  onRun: () => void;
};

const severityMeta = {
  high: {
    label: "High",
    icon: AlertTriangle,
    badge: "bg-destructive/10 text-destructive border-destructive/30",
    bar: "bg-destructive",
  },
  medium: {
    label: "Medium",
    icon: AlertCircle,
    badge: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  low: {
    label: "Low",
    icon: Info,
    badge: "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-400",
    bar: "bg-sky-500",
  },
} as const;

const readinessMeta = {
  ready: { label: "Ready", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" },
  "needs-attention": { label: "Needs Attention", className: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400" },
  "at-risk": { label: "At Risk", className: "bg-destructive/10 text-destructive border-destructive/30" },
} as const;

export function SmartReviewPanel({ review, loading, error, onRun }: Props) {
  const counts = review
    ? review.findings.reduce(
        (acc, f) => {
          acc[f.severity]++;
          return acc;
        },
        { high: 0, medium: 0, low: 0 } as Record<SmartReviewFinding["severity"], number>,
      )
    : { high: 0, medium: 0, low: 0 };

  return (
    <section className="rounded-sm border border-border bg-background animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent/10 text-accent">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
              Smart Review
            </p>
            <h3 className="text-sm font-semibold text-navy">Pre-show readiness analysis</h3>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {review && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider">
              <span className="text-destructive">{counts.high} High</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-amber-600 dark:text-amber-400">{counts.medium} Med</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sky-600 dark:text-sky-400">{counts.low} Low</span>
            </div>
          )}
          <button
            type="button"
            onClick={onRun}
            disabled={loading}
            className="no-print inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent/40 border-t-accent" />
                Analyzing…
              </>
            ) : (
              <>✶ {review ? "Re-run review" : "Run Smart Review"}</>
            )}
          </button>
        </div>
      </header>

      <div className="p-5">
        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {loading && !review && (
          <div className="space-y-2">
            <div className="shimmer h-3 w-2/3" />
            <div className="shimmer h-3 w-1/2" />
            <div className="shimmer h-3 w-3/4" />
          </div>
        )}

        {!loading && !review && !error && (
          <p className="text-sm text-muted-foreground">
            Run Smart Review to surface operational risks, missing details, timing issues, and
            improvement suggestions across your run-of-show.
          </p>
        )}

        {review && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                  readinessMeta[review.overallReadiness].className,
                )}
              >
                {readinessMeta[review.overallReadiness].label}
              </span>
              <p className="text-sm text-foreground/90">{review.summary}</p>
            </div>

            <ul className="space-y-2">
              {[...review.findings]
                .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
                .map((f, i) => (
                  <FindingRow key={i} finding={f} />
                ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function severityRank(s: SmartReviewFinding["severity"]) {
  return s === "high" ? 3 : s === "medium" ? 2 : 1;
}

function FindingRow({ finding }: { finding: SmartReviewFinding }) {
  const [open, setOpen] = useState(finding.severity === "high");
  const meta = severityMeta[finding.severity];
  const Icon = meta.icon;

  return (
    <li className="lift overflow-hidden rounded-md border border-border bg-surface">
      <div className="flex">
        <div className={cn("w-1 shrink-0", meta.bar)} />
        <div className="flex-1">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-background/60"
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", finding.severity === "high" ? "text-destructive" : finding.severity === "medium" ? "text-amber-600 dark:text-amber-400" : "text-sky-600 dark:text-sky-400")} />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded border px-1.5 py-px text-[10px] font-bold uppercase tracking-wider",
                    meta.badge,
                  )}
                >
                  {meta.label}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {finding.category}
                </span>
                {finding.relatedTime && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    · {finding.relatedTime}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">{finding.title}</p>
            </div>
            <ChevronDown
              className={cn(
                "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
          {open && (
            <div className="space-y-2 border-t border-border bg-background px-4 py-3 text-sm">
              <p className="text-foreground/90 leading-relaxed">{finding.detail}</p>
              <div className="rounded border-l-2 border-accent bg-accent/5 px-3 py-2">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-accent">
                  Recommendation
                </p>
                <p className="mt-1 text-foreground/90 leading-relaxed">{finding.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
