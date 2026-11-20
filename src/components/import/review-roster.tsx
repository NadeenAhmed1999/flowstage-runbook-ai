import type { Dispatch } from "react";
import { Button } from "@/components/ui/button";
import type { ReviewAction, ReviewDraft } from "@/lib/import/review-draft";
import { ReviewField, reviewInput } from "./review-field";
export function ReviewRoster({ draft, dispatch, kind }: { draft: ReviewDraft; dispatch: Dispatch<ReviewAction>; kind: "speakers" | "moderators" }) {
  const people = draft.event[kind];
  const singular = kind === "speakers" ? "Speaker" : "Moderator";
  return <section className="border-t border-border p-4"><div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-semibold">{singular} roster</h3><Button variant="outline" className="min-h-11" onClick={() => dispatch({ type: "add-person", kind })}>Add {singular.toLowerCase()}</Button></div>
    {!people.length && <p className="text-sm text-muted-foreground">No {kind} yet. Add a {singular.toLowerCase()} to assign to sessions.</p>}
    <div className="space-y-3">{people.map((p, index) => <div key={index} className="grid gap-2 md:grid-cols-3">
      <ReviewField label="Name"><input aria-label={`${singular} ${index + 1} name`} className={reviewInput} value={p.name} onChange={v => dispatch({ type: "person", kind, index, patch: { name: v.target.value } })} /></ReviewField>
      <ReviewField label="Role"><input aria-label={`${singular} ${index + 1} role`} className={reviewInput} value={p.role} onChange={v => dispatch({ type: "person", kind, index, patch: { role: v.target.value } })} /></ReviewField>
      <ReviewField label="Merge into"><select aria-label={`${singular} ${index + 1} merge into`} className={reviewInput} value="" onChange={v => { if (v.target.value !== "") dispatch({ type: "merge", kind, index, target: Number(v.target.value) }); }}><option value="">Choose duplicate's target</option>{people.map((target, i) => i !== index && target.name.trim() ? <option key={i} value={i}>{target.name}</option> : null)}</select></ReviewField>
    </div>)}</div></section>;
}
