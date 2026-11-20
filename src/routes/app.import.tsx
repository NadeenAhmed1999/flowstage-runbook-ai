import { EVENT_TYPES, importTypeSelection, importFileProblem, withListedType } from "@/lib/event-types";
import { useMemo, useRef, useState } from "react";
import { EditableMappingReview } from "@/components/import/mapping-review";
import type { EventData } from "@/components/event-context";
import { resetSavedEvent } from "@/hooks/use-saved-event";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppTopbar } from "@/components/app-shell/topbar";
import { useEvent } from "@/components/event-context";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  parseWorkbookFile,
  mappedEventToEventData,
  type ParsedWorkbook,
} from "@/lib/excel-io";
import { parseWordFile, isWordFile } from "@/lib/word-io";
import {
  importEventFromExcel,
  type MappedEvent,
} from "@/lib/excel-import.functions";
import {
  UploadCloud,
  FileSpreadsheet,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  RefreshCw,
  Table2,
} from "lucide-react";

export const Route = createFileRoute("/app/import")({
  head: () => ({
    meta: [
      { title: "Import an event · FlowStage" },
      {
        name: "description",
        content:
          "Migrate an existing event plan from Excel into FlowStage. AI auto-maps sessions, speakers, breaks, sponsors, and components.",
      },
      { property: "og:title", content: "Import an event · FlowStage" },
      {
        property: "og:description",
        content: "AI-mapped Excel import for professional event operations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImportPage,
});

const uid = () => Math.random().toString(36).slice(2, 9);

function ImportPage() {
  const navigate = useNavigate();
  const { setEvent } = useEvent();
  const importFn = useServerFn(importEventFromExcel);
  const inputRef = useRef<HTMLInputElement>(null);

  const [workbook, setWorkbook] = useState<ParsedWorkbook | null>(null);
  const [previewSheet, setPreviewSheet] = useState<string | null>(null);
  const [reviewVersion, setReviewVersion] = useState(0);
  const [mapping, setMapping] = useState<MappedEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    setMapping(null);
    setWorkbook(null);
    try {
      const parsed = isWordFile(file) ? await parseWordFile(file) : await parseWorkbookFile(file);
      setWorkbook(parsed);
      setPreviewSheet(parsed.sheets[0]?.name ?? null);
      await runMapping(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read workbook");
    }
  }

  async function runMapping(parsed: ParsedWorkbook) {
    setLoading(true);
    setError(null);
    try {
      const result = await importFn({ data: parsed });
      setMapping(withListedType(result));
      setReviewVersion(v => v + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI mapping failed. Try again or map manually.");
    } finally {
      setLoading(false);
    }
  }

  function commitEdited(eventData: EventData) {
    setEvent(eventData);
    resetSavedEvent();
    navigate({ to: "/run-of-show" });
  }

  function commit() {
    if (!mapping) return;
    const eventData = mappedEventToEventData(mapping);
    setEvent(eventData);
    resetSavedEvent();
    navigate({ to: "/run-of-show" });
  }

  const confidencePct = mapping ? Math.round(mapping.confidence.overall * 100) : 0;
  const needsReview = mapping ? mapping.confidence.overall < 0.6 : false;
  const previewData = useMemo(
    () => workbook?.sheets.find((s) => s.name === previewSheet) ?? workbook?.sheets[0],
    [workbook, previewSheet],
  );

  return (
    <>
      <AppTopbar
        breadcrumb="Import"
        title="Import an event"
        primary="none"
        subtitle="Migrate an existing event plan. AI maps sessions, speakers, breaks, sponsors & components."
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {!workbook && <UploadPane onFile={handleFile} dragOver={dragOver} setDragOver={setDragOver} inputRef={inputRef} />}

          {workbook && (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="min-w-0 space-y-6">
                {loading && (
                  <div className="rounded-lg border border-border bg-background p-8 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      AI is mapping your workbook…
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Detecting sessions, speakers, breaks, sponsors and event components.
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-semibold">Mapping error</p>
                        <p className="mt-0.5 text-destructive/80">{error}</p>
                        <button
                          onClick={() => runMapping(workbook)}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-background px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Retry
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {mapping && !loading && !isWordFile({ name: workbook.fileName } as File) && <EditableMappingReview key={reviewVersion} mapping={mapping} workbook={workbook} onCommit={commitEdited} />}
                {mapping && !loading && isWordFile({ name: workbook.fileName } as File) && (
                  <MappingReview
                    mapping={mapping}
                    setMapping={setMapping}
                    onRetry={() => runMapping(workbook)}
                    onCommit={commit}
                    confidencePct={confidencePct}
                    needsReview={needsReview}
                  />
                )}

                {previewData && (
                  <section className="rounded-lg border border-border bg-background">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Table2 className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">
                          Source preview
                        </p>
                      </div>
                      <select
                        value={previewSheet ?? ""}
                        onChange={(e) => setPreviewSheet(e.target.value)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        {workbook.sheets.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name} ({s.rows.length})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="max-h-80 overflow-auto">
                      <table className="w-full text-xs">
                        <tbody>
                          {previewData.rows.slice(0, 40).map((r, i) => (
                            <tr key={i} className={i === 0 ? "bg-surface font-semibold" : "border-t border-border/50"}>
                              <td className="w-10 border-r border-border/50 bg-surface/60 px-2 py-1 text-right font-mono text-[10px] text-muted-foreground">
                                {i + 1}
                              </td>
                              {r.slice(0, 12).map((c, j) => (
                                <td key={j} className="px-2 py-1 align-top text-foreground">
                                  {String(c ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>

              <aside className="space-y-4">
                <section className="rounded-lg border border-border bg-background p-4">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    Source file
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <FileSpreadsheet className="h-4 w-4 text-accent" />
                    <span className="truncate font-medium text-foreground">{workbook.fileName}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {workbook.sheets.length} sheet{workbook.sheets.length === 1 ? "" : "s"} ·{" "}
                    {workbook.sheets.reduce((a, s) => a + s.rows.length, 0)} rows
                  </p>
                  <button
                    onClick={() => {
                      setWorkbook(null);
                      setMapping(null);
                      setError(null);
                    }}
                    className="mt-3 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-surface"
                  >
                    Replace file
                  </button>
                </section>

                <section className="rounded-lg border border-border bg-background p-4">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                    What happens next
                  </p>
                  <ol className="mt-3 space-y-2 text-xs text-foreground">
                    <li className="flex gap-2">
                      <span className="font-mono text-accent">1.</span> AI maps rows to sessions,
                      speakers, breaks, sponsors, components.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-mono text-accent">2.</span> Review flagged fields, edit
                      inline.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-mono text-accent">3.</span> FlowStage generates the run
                      sheet, Smart Review and Readiness Score automatically.
                    </li>
                  </ol>
                </section>
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function UploadPane({
  onFile,
  dragOver,
  setDragOver,
  inputRef,
}: {
  onFile: (f: File) => void;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [fileError, setFileError] = useState<string | null>(null);
  const check = (f: File) => {
    const problem = importFileProblem(f.name);
    setFileError(problem);
    if (!problem) onFile(f);
  };
  return (
    <div className="rounded-xl border border-border bg-background p-8">
      {fileError && (
        <p role="alert" className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {fileError}
        </p>
      )}
      <div className="mb-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
          Migration · Excel &amp; Word
        </p>
        <h2 className="mt-1 text-xl font-semibold text-navy">
          Bring your event plan into FlowStage
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Drop an existing .xlsx, .xls, .csv or .docx agenda. Our AI mapper will detect sessions,
          dates, times, speakers, moderators, rooms, breaks, sponsors, and event components — even
          when the document structure is non-standard.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) check(f);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          dragOver
            ? "border-accent bg-accent/5"
            : "border-border bg-surface/50 hover:border-accent/60 hover:bg-accent/[0.02]"
        }`}
      >
        <EmptyState
          icon={UploadCloud}
          title="No file chosen"
          description="Import an existing Excel or Word agenda with sessions, dates, times and speakers."
          action={<>
            <p className="mb-4 text-xs text-muted-foreground">.xlsx, .xls, .csv, .docx · large planning files supported (we read the agenda sheet first) · row titles are sent to our AI to suggest event name and type. Files without a clear agenda sheet are sent to our AI for mapping.</p>
            <Button type="button" className="min-h-11" onClick={() => inputRef.current?.click()}>Choose file</Button>
          </>}
        />
        <input
          ref={inputRef}
          id="xlsx-upload"
          type="file"
          accept=".xlsx,.xls,.csv,.docx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) check(f);
          }}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 text-xs">
        <FeatureLine text="AI detects headers, dates, and roster columns automatically." />
        <FeatureLine text="Multi-day agendas & event components fully supported." />
        <FeatureLine text="Manual column mapping fallback if the structure is ambiguous." />
      </div>
    </div>
  );
}

function FeatureLine({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border/70 bg-surface/50 p-3">
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
      <span className="text-muted-foreground">{text}</span>
    </div>
  );
}

function MappingReview({
  mapping,
  setMapping,
  onRetry,
  onCommit,
  confidencePct,
  needsReview,
}: {
  mapping: MappedEvent;
  setMapping: (m: MappedEvent) => void;
  onRetry: () => void;
  onCommit: () => void;
  confidencePct: number;
  needsReview: boolean;
}) {
  const update = <K extends keyof MappedEvent>(key: K, value: MappedEvent[K]) =>
    setMapping({ ...mapping, [key]: value });

  return (
    <section className="rounded-lg border border-border bg-background">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
            AI Mapping · Review
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-navy">{mapping.name || "Untitled event"}</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Confidence
            </p>
            <p
              className={`font-mono text-sm font-bold ${
                needsReview ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {confidencePct}%
            </p>
          </div>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium hover:bg-surface"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Re-run
          </button>
          <button
            onClick={onCommit}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Import & Generate <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {mapping.confidence.unclear.length > 0 && (
        <div className="border-b border-border bg-amber-50/70 px-5 py-3">
          <div className="flex items-start gap-2 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div>
              <p className="font-semibold">Needs your eyes</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {mapping.confidence.unclear.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <Field label="Event name">
          <input
            value={mapping.name}
            onChange={(e) => update("name", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Event type">
          <select
            value={importTypeSelection(mapping.type)}
            onChange={(e) => update("type", e.target.value)}
            className={inputCls}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Start date">
          <input
            type="date"
            value={mapping.date}
            onChange={(e) => update("date", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="End date (optional)">
          <input
            type="date"
            value={mapping.endDate ?? ""}
            onChange={(e) => update("endDate", e.target.value || undefined)}
            className={inputCls}
          />
        </Field>
      </div>

      <SectionSummary
        title="Sessions"
        count={mapping.sessions.length}
        columns={["Day", "Start", "Min", "Title", "Speakers", "Room"]}
        rows={mapping.sessions.slice(0, 25).map((s) => [
          String(s.day),
          s.startTime,
          String(s.durationMin),
          s.title,
          s.speakers.join(", "),
          s.room,
        ])}
      />
      <SectionSummary
        title="Speakers"
        count={mapping.speakers.length}
        columns={["Name", "Role"]}
        rows={mapping.speakers.map((p) => [p.name, p.role])}
      />
      <SectionSummary
        title="Moderators"
        count={mapping.moderators.length}
        columns={["Name", "Role"]}
        rows={mapping.moderators.map((p) => [p.name, p.role])}
      />
      <SectionSummary
        title="Breaks"
        count={mapping.breaks.length}
        columns={["Day", "Start", "Min", "Label"]}
        rows={mapping.breaks.map((b) => [String(b.day), b.startTime, String(b.durationMin), b.label])}
      />
      <SectionSummary
        title="Sponsors"
        count={mapping.sponsors.length}
        columns={["Name", "Placement"]}
        rows={mapping.sponsors.map((s) => [s.name, s.placement])}
      />
      <SectionSummary
        title="Event components"
        count={mapping.components.length}
        columns={["Kind", "Name", "Day", "Start", "Min", "Venue"]}
        rows={mapping.components.map((c) => [
          c.kind,
          c.name,
          String(c.day),
          c.startTime,
          String(c.durationMin),
          c.venue,
        ])}
      />

      <div className="flex items-center justify-between border-t border-border px-5 py-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          Import will auto-generate the run sheet, Smart Review and Readiness Score.
        </div>
        <button
          onClick={onCommit}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-navy-foreground hover:bg-navy/90"
        >
          Import & Generate <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function SectionSummary({
  title,
  count,
  columns,
  rows,
}: {
  title: string;
  count: number;
  columns: string[];
  rows: string[][];
}) {
  if (count === 0) {
    return (
      <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
        <span className="font-mono uppercase tracking-widest">{title}</span> · none detected
      </div>
    );
  }
  return (
    <details className="border-t border-border" open={count <= 8}>
      <summary className="flex cursor-pointer items-center justify-between px-5 py-3 text-sm">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-foreground">
          {title}
        </span>
        <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold text-accent">
          {count}
        </span>
      </summary>
      <div className="overflow-x-auto px-5 pb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {columns.map((c) => (
                <th key={c} className="py-1.5 pr-3 text-left font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className="py-1.5 pr-3 align-top text-foreground">
                    {cell || <span className="text-muted-foreground/50">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
