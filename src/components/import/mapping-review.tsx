import { useReducer, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { importEventFromExcel, type MappedEvent } from "@/lib/excel-import.functions";
import type { ParsedWorkbook } from "@/lib/excel-io";
import { createReviewDraft, reviewReducer, reviewToEventData } from "@/lib/import/review-draft";
import type { EventData } from "@/components/event-context";
import { ReviewEventFields } from "./review-event";
import { ReviewRows } from "./review-rows";
import { ReviewRoster } from "./review-roster";
import { ReviewSheets } from "./review-sheets";
import { ReviewField, reviewInput } from "./review-field";
import { COMPONENT_BLUEPRINTS } from "@/lib/event-components";
import { ReviewParts } from "./review-parts";
import { ReviewWarnings } from "./review-warnings";
import { importWarnings } from "@/lib/import/warnings";

export function EditableMappingReview({ mapping, workbook, onCommit }: { mapping: MappedEvent; workbook: ParsedWorkbook; onCommit: (event: EventData) => void }) {
  const [draft, dispatch] = useReducer(reviewReducer, { mapping, workbook }, ({ mapping, workbook }) => createReviewDraft(mapping, workbook));
  const importFn = useServerFn(importEventFromExcel);
  const pending = useRef(new Set<string>());
  const names = mapping.importReview?.skippedSheets ?? [];
  async function include(name: string, included: boolean) {
    if (pending.current.has(name)) return;
    if (!included || draft.sheets[name]?.cached) { dispatch({ type: "sheet", name, included }); return; }
    const sheet = workbook.sheets.find(s => s.name === name);
    if (!sheet) return;
    pending.current.add(name);
    dispatch({ type: "sheet", name, included: true, loading: true });
    try {
      const mapped = await importFn({ data: { fileName: workbook.fileName, sheets: [sheet], forceAi: true } });
      dispatch({ type: "sheet", name, included: true, mapped });
    } catch { dispatch({ type: "sheet", name, included: false, error: "This sheet could not be mapped. Tick Include to try again." }); }
    finally { pending.current.delete(name); }
  }
  const e = draft.event;
  const advisory = importWarnings(draft, workbook);
  const warnings = e.confidence.unclear.filter(w => {
    if (/Year not found/.test(w)) return !/^\d{4}$/.test(draft.year);
    if (/Event date not found/.test(w)) return !e.date;
    if (/row\(s\) have no start time|duration\(s\) calculated|Not imported:/.test(w)) return false;
    return true;
  });
  return <section className="min-w-0 rounded-lg border border-border bg-background">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4"><h2 className="text-lg font-semibold">Review import</h2><Button className="min-h-11" onClick={() => onCommit(reviewToEventData(draft))}>Create event</Button></header>
    <ReviewWarnings warnings={advisory} notes={warnings} />
    <ReviewEventFields draft={draft} dispatch={dispatch} />
    <ReviewParts draft={draft} dispatch={dispatch} />
    <ReviewRows draft={draft} dispatch={dispatch} kind="sessions" />
    <ReviewRows draft={draft} dispatch={dispatch} kind="breaks" />
    <ReviewRoster draft={draft} dispatch={dispatch} kind="speakers" />
    <ReviewRoster draft={draft} dispatch={dispatch} kind="moderators" />
    {e.sponsors.length > 0 && <section className="border-t border-border p-4"><h3 className="mb-3 font-semibold">Sponsors</h3>{e.sponsors.map((s, i) => <div key={i} className="mb-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]">{(["name", "placement"] as const).map(k => <ReviewField key={k} label={k === "name" ? "Name" : "Placement"}><input aria-label={`Sponsor ${i + 1} ${k}`} className={reviewInput} value={s[k]} onChange={v => dispatch({ type: "event", patch: { sponsors: e.sponsors.map((p, j) => i === j ? { ...p, [k]: v.target.value } : p) } })} /></ReviewField>)}<Button variant="ghost" className="min-h-11 md:mt-5" onClick={() => dispatch({ type: "event", patch: { sponsors: e.sponsors.filter((_, j) => j !== i) } })}>Delete sponsor</Button></div>)}</section>}
    {e.components.length > 0 && <section className="border-t border-border p-4"><h3 className="mb-3 font-semibold">Imported event components</h3>{e.components.map((c, i) => <div key={i} className="mb-3 grid gap-2 md:grid-cols-3">{(["name", "kind", "day", "startTime", "durationMin", "venue", "notes"] as const).map(k => <ReviewField key={k} label={k}>{k === "kind" ? <select aria-label={`Component ${i + 1} kind`} className={reviewInput} value={c.kind} onChange={v => dispatch({ type: "event", patch: { components: e.components.map((p, j) => j === i ? { ...p, kind: v.target.value } : p) } })}>{!Object.values(COMPONENT_BLUEPRINTS).some(b => b.kind === c.kind) && <option value={c.kind}>{c.kind}</option>}{Object.values(COMPONENT_BLUEPRINTS).map(b => <option key={b.kind} value={b.kind}>{b.label}</option>)}</select> : <input aria-label={`Component ${i + 1} ${k}`} className={reviewInput} type={k === "day" || k === "durationMin" ? "number" : k === "startTime" ? "time" : "text"} value={c[k]} onChange={v => dispatch({ type: "event", patch: { components: e.components.map((p, j) => i === j ? { ...p, [k]: k === "day" || k === "durationMin" ? Math.max(k === "day" ? 1 : 0, Number(v.target.value)) : v.target.value } : p) } })} />}</ReviewField>)}<Button variant="ghost" className="min-h-11" onClick={() => dispatch({ type: "event", patch: { components: e.components.filter((_, j) => j !== i) } })}>Delete component</Button></div>)}</section>}
    <div className="grid gap-3 border-t border-border p-4"><ReviewField label="General notes"><textarea aria-label="General notes" className={reviewInput} value={e.notes} onChange={v => dispatch({ type: "event", patch: { notes: v.target.value } })} /></ReviewField><ReviewField label="AV requirements"><textarea aria-label="AV requirements" className={reviewInput} value={e.avRequirements} onChange={v => dispatch({ type: "event", patch: { avRequirements: v.target.value } })} /></ReviewField></div>
    <ReviewSheets draft={draft} names={names} onInclude={include} />
    <footer className="border-t border-border p-4"><Button className="min-h-11" onClick={() => onCommit(reviewToEventData(draft))}>Create event</Button></footer>
  </section>;
}
