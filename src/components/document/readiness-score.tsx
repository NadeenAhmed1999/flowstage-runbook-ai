import type { ReadinessReport, ReadinessCategory, ReadinessRisk } from "@/lib/readiness-score.functions";
import { AlertTriangle, CheckCircle2, ShieldAlert, Activity, Gauge } from "lucide-react";

const STATUS_META: Record<
  ReadinessReport["status"],
  { label: string; tone: string; bar: string; ring: string; dot: string }
> = {
  ready: {
    label: "Ready",
    tone: "text-emerald-700",
    bar: "bg-emerald-500",
    ring: "stroke-emerald-500",
    dot: "bg-emerald-500",
  },
  "nearly-ready": {
    label: "Nearly Ready",
    tone: "text-sky-700",
    bar: "bg-sky-500",
    ring: "stroke-sky-500",
    dot: "bg-sky-500",
  },
  "needs-attention": {
    label: "Needs Attention",
    tone: "text-amber-700",
    bar: "bg-amber-500",
    ring: "stroke-amber-500",
    dot: "bg-amber-500",
  },
  "high-risk": {
    label: "High Risk",
    tone: "text-rose-700",
    bar: "bg-rose-500",
    ring: "stroke-rose-500",
    dot: "bg-rose-500",
  },
};

const SEVERITY_META: Record<ReadinessRisk["severity"], { label: string; cls: string }> = {
  high: { label: "HIGH", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  medium: { label: "MED", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  low: { label: "LOW", cls: "bg-sky-50 text-sky-700 border-sky-200" },
};

export function ReadinessScorePanel({
  report,
  loading,
  error,
  onRun,
}: {
  report: ReadinessReport | null;
  loading: boolean;
  error: string | null;
  onRun: () => void;
}) {
  return (
    <section className="rounded-sm border border-border bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-accent" />
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-accent">
            Event Readiness Score
          </p>
          <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                loading ? "animate-pulse bg-accent" : report ? STATUS_META[report.status].dot : "bg-muted-foreground"
              }`}
            />
            {loading ? "Calculating" : report ? "Live" : "Offline"}
          </span>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={loading}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface disabled:opacity-60"
        >
          {loading ? "Scoring…" : report ? "Re-score" : "Run score"}
        </button>
      </header>

      <div className="p-5">
        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {loading && !report && <ScoreSkeleton />}

        {report && (
          <div className="space-y-6">
            <OverallCard report={report} />

            <div>
              <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Category Breakdown
              </h4>
              <div className="grid gap-3 sm:grid-cols-2">
                {report.categories.map((c) => (
                  <CategoryCard key={c.category} category={c} />
                ))}
              </div>
            </div>

            {report.topRisks.length > 0 && (
              <div>
                <h4 className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  Highest-Priority Risks
                </h4>
                <ul className="space-y-2">
                  {report.topRisks.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-md border border-border bg-surface/60 px-3 py-2"
                    >
                      <span
                        className={`mt-0.5 inline-flex items-center justify-center rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-widest ${SEVERITY_META[r.severity].cls}`}
                      >
                        {SEVERITY_META[r.severity].label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground">{r.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {r.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!loading && !report && !error && (
          <div className="flex items-center gap-3 rounded-md border border-dashed border-border bg-surface/40 px-4 py-6 text-xs text-muted-foreground">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Score will calculate once the run sheet is generated.
          </div>
        )}
      </div>
    </section>
  );
}

function OverallCard({ report }: { report: ReadinessReport }) {
  const meta = STATUS_META[report.status];
  const pct = Math.round(report.overallScore);
  const circumference = 2 * Math.PI * 42;
  const dash = (pct / 100) * circumference;

  return (
    <div className="grid gap-5 rounded-md border border-border bg-gradient-to-br from-surface/80 to-background p-5 sm:grid-cols-[auto_1fr]">
      <div className="flex items-center justify-center">
        <div className="relative h-28 w-28">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="fill-none stroke-border"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              className={`fill-none ${meta.ring} transition-[stroke-dashoffset] duration-700`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tracking-tight text-navy">{pct}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              / 100
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <div className="flex flex-wrap items-center gap-2">
          {report.status === "ready" ? (
            <CheckCircle2 className={`h-4 w-4 ${meta.tone}`} />
          ) : report.status === "high-risk" ? (
            <ShieldAlert className={`h-4 w-4 ${meta.tone}`} />
          ) : (
            <AlertTriangle className={`h-4 w-4 ${meta.tone}`} />
          )}
          <span className={`text-sm font-bold uppercase tracking-wide ${meta.tone}`}>
            {meta.label}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            · Confidence: {report.confidence}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{report.headline}</p>
        <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground">
          {report.confidenceRationale}
        </p>
      </div>
    </div>
  );
}

function CategoryCard({ category }: { category: ReadinessCategory }) {
  const meta = STATUS_META[category.status];
  const pct = Math.round(category.score);
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">{category.label}</p>
        <span className={`font-mono text-xs font-bold ${meta.tone}`}>{pct}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full ${meta.bar} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{category.summary}</p>

      {category.missingItems.length > 0 && (
        <div className="mt-2">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Missing
          </p>
          <ul className="mt-1 space-y-0.5">
            {category.missingItems.map((m, i) => (
              <li key={i} className="text-xs leading-snug text-foreground/80">
                <span className="text-rose-500">·</span> {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {category.recommendedActions.length > 0 && (
        <div className="mt-2">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Recommended
          </p>
          <ul className="mt-1 space-y-0.5">
            {category.recommendedActions.map((a, i) => (
              <li key={i} className="text-xs leading-snug text-foreground/80">
                <span className="text-accent">›</span> {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ScoreSkeleton() {
  return (
    <div className="space-y-4">
      <div className="shimmer h-32 rounded-md" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="shimmer h-24 rounded-md" />
        ))}
      </div>
    </div>
  );
}
