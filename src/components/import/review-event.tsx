import type { Dispatch } from "react";
import { EVENT_TYPES, importTypeSelection } from "@/lib/event-types";
import type { ReviewAction, ReviewDraft } from "@/lib/import/review-draft";
import { ReviewBadge, ReviewField, reviewInput } from "./review-field";
export function ReviewEventFields({ draft, dispatch }: { draft: ReviewDraft; dispatch: Dispatch<ReviewAction> }) {
  const e = draft.event;
  return <div className="grid gap-3 p-4 md:grid-cols-2">
    <ReviewField label="Event name"><input aria-label="Event name" className={reviewInput} value={e.name} onChange={v => dispatch({ type: "event", patch: { name: v.target.value } })} />{e.importReview?.inferredEvent && <ReviewBadge>inferred</ReviewBadge>}</ReviewField>
    <ReviewField label="Event type"><select aria-label="Event type" className={reviewInput} value={importTypeSelection(e.type)} onChange={v => dispatch({ type: "event", patch: { type: v.target.value } })}>{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}</select>{e.importReview?.inferredEvent && <ReviewBadge>inferred</ReviewBadge>}</ReviewField>
    <div className={`md:col-span-2 ${!draft.year ? "border-l-2 border-accent pl-3" : ""}`}><ReviewField label={draft.year ? "Year" : "Year not found — enter the event year"}><input aria-label="Year" inputMode="numeric" className={reviewInput} value={draft.year} onChange={v => dispatch({ type: "year", value: v.target.value })} /></ReviewField>{!draft.year && <p className="mt-1 text-xs text-muted-foreground">Dates remain unspecified until a year is entered. You can still create the event.</p>}</div>
    <ReviewField label="Start date"><input aria-label="Start date" type="date" className={reviewInput} value={e.date} onChange={v => dispatch({ type: "event", patch: { date: v.target.value } })} /></ReviewField>
    <ReviewField label="End date"><input aria-label="End date" type="date" className={reviewInput} value={e.endDate ?? ""} onChange={v => dispatch({ type: "event", patch: { endDate: v.target.value } })} /></ReviewField>
  </div>;
}
