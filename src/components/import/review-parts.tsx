import type { Dispatch } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPONENT_BLUEPRINTS, COMPONENT_KINDS } from "@/lib/event-components";
import { componentPartId } from "@/lib/event-parts";
import { partWindow, reviewRows } from "@/lib/import/part-proposals";
import type { ReviewAction, ReviewDraft } from "@/lib/import/review-draft";
import { ReviewField, reviewInput } from "./review-field";

export function ReviewParts({ draft, dispatch }: { draft: ReviewDraft; dispatch: Dispatch<ReviewAction> }) {
  return <section className="border-t border-border p-4" aria-label="Parts review">
    <h3 className="mb-3 font-semibold">Parts</h3>
    {!draft.parts.length && <p className="text-sm text-muted-foreground">Main programme</p>}
    <div className="divide-y divide-border">{draft.parts.map((part, index) => {
      const rows = reviewRows(draft.event).filter(row => row.partId === componentPartId(part.id));
      const window = partWindow(rows);
      return <div key={part.id} className="grid min-w-0 gap-3 py-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
        <ReviewField label="Name"><div className="flex min-w-0 gap-1"><input id={`import-part-name-${part.id}`} aria-label={`Part ${index + 1} name`} className={reviewInput} value={part.name} onChange={e => dispatch({ type: "part", id: part.id, patch: { name: e.target.value } })} /><Button variant="ghost" size="icon" className="min-h-11 w-11 shrink-0" aria-label={`Rename part ${index + 1}`} title="Rename part" onClick={() => document.getElementById(`import-part-name-${part.id}`)?.focus()}><Pencil /></Button></div></ReviewField>
        <ReviewField label="Kind"><select aria-label={`Part ${index + 1} kind`} className={reviewInput} value={part.kind} onChange={e => { const kind = COMPONENT_KINDS.find(kind => kind === e.target.value); if (kind) dispatch({ type: "part", id: part.id, patch: { kind } }); }}>{COMPONENT_KINDS.map(kind => <option key={kind} value={kind}>{COMPONENT_BLUEPRINTS[kind].label}</option>)}</select></ReviewField>
        <div className="flex items-end gap-2"><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" aria-label={`Accept part ${index + 1}`} checked={part.accepted} onChange={e => dispatch({ type: "part", id: part.id, patch: { accepted: e.target.checked } })} />Accept</label><Button variant="ghost" size="icon" className="min-h-11 w-11" aria-label={`Delete part ${index + 1}`} title="Delete part" onClick={() => dispatch({ type: "delete-part", id: part.id })}><Trash2 /></Button></div>
        <p className="text-xs text-muted-foreground md:col-span-3">Day {window.day} · {window.start || "Time not specified"}{window.start && window.end ? `–${window.end}` : ""} · {rows.length} {rows.length === 1 ? "row" : "rows"}</p>
      </div>;
    })}</div>
  </section>;
}