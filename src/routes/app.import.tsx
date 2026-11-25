import { AI_SIGN_IN_MESSAGE, isAuthError } from "@/lib/ai-errors";
import { AiErrorNotice } from "@/components/ai-error-notice";
import { importFileProblem, withListedType } from "@/lib/event-types";
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
      setError(isAuthError(err) ? AI_SIGN_IN_MESSAGE : err instanceof Error ? err.message : "AI mapping failed. Try again or map manually.");
    } finally {
      setLoading(false);
    }
  }

  function commitEdited(eventData: EventData) {
    setEvent(eventData);
    resetSavedEvent();
    navigate({ to: "/run-of-show" });
  }

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
      <div className="min-w-0 flex-1 overflow-auto p-6">
        <div className="mx-auto min-w-0 max-w-6xl space-y-6">
          {!workbook && <UploadPane onFile={handleFile} dragOver={dragOver} setDragOver={setDragOver} inputRef={inputRef} />}

          {workbook && (
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
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

                {error === AI_SIGN_IN_MESSAGE ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-destructive">
                    <AiErrorNotice error={{ message: AI_SIGN_IN_MESSAGE, signIn: true }} />
                  </div>
                ) : error && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="min-w-0 break-words">
                        <p className="font-semibold">Mapping error</p>
                        <p className="mt-0.5 text-destructive/80">We couldn't read this file's layout. Check that it has an agenda with times and titles, then retry.</p>
                        <details className="mt-2 text-xs text-muted-foreground">
                          <summary className="cursor-pointer">Details</summary>
                          <p className="mt-1 break-words">{error}</p>
                        </details>
                        <Button
                          variant="outline"
                          onClick={() => runMapping(workbook)}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-background px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Retry
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {mapping && !loading && <EditableMappingReview key={reviewVersion} mapping={mapping} workbook={workbook} onCommit={commitEdited} />}

                {previewData && (
                  <section className="min-w-0 rounded-lg border border-border bg-background">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Table2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <p className="text-sm font-semibold text-foreground">
                          Source preview
                        </p>
                      </div>
                      <select
                        value={previewSheet ?? ""}
                        onChange={(e) => setPreviewSheet(e.target.value)}
                        className="min-w-0 max-w-32 rounded-md border border-border bg-background px-2 py-1 text-xs sm:max-w-48"
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

              <aside className="min-w-0 space-y-4">
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
