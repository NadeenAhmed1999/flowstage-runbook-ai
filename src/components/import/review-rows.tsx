import type { Dispatch } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { ReviewAction, ReviewDraft } from "@/lib/import/review-draft";
import { ReviewBadge, ReviewField, reviewInput } from "./review-field";
import { componentPartId, MAIN_PART_ID } from "@/lib/event-parts";
import { rowTargetId } from "@/lib/import/warnings";

export function ReviewRows({ draft, dispatch, kind }: { draft: ReviewDraft; dispatch: Dispatch<ReviewAction>; kind: "sessions" | "breaks" }) {
  const sessions = kind === "sessions";
  const rows = draft.event[kind];
  const singular = sessions ? "Session" : "Break";
  return <section id={`import-${kind}`} className="border-t border-border p-4">
    <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{sessions ? "Sessions" : "Breaks"} ({rows.length})</h3><Button variant="outline" className="min-h-11" onClick={() => dispatch({ type: "add", kind })}><Plus className="h-4 w-4" />Add {singular.toLowerCase()}</Button></div>
    {!rows.length && <p className="text-sm text-muted-foreground">No {kind} in this draft. Add a {singular.toLowerCase()}.</p>}
    <div role="table" aria-label={sessions ? "Sessions review" : "Breaks review"} className="space-y-3 md:space-y-0">
      {rows.map((row, index) => {
        const session = sessions ? draft.event.sessions[index] : undefined;
        const title = session?.title ?? draft.event.breaks[index]?.label ?? "";
        const patch = (value: Record<string, unknown>) => dispatch(sessions ? { type: "session", index, patch: value } : { type: "break", index, patch: value });
        const label = (field: string) => `${singular} ${index + 1} ${field}`;
        return <div role="row" id={rowTargetId(kind, index)} key={index} className="scroll-mt-4 rounded-md border border-border p-3 md:rounded-none md:border-x-0 md:border-b-0 md:px-0">
          <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1.2fr)_44px]">
            <ReviewField label={sessions ? "Title" : "Label"}><input aria-label={label(sessions ? "title" : "label")} className={reviewInput} value={title} onChange={v => patch(sessions ? { title: v.target.value } : { label: v.target.value })} /></ReviewField>
            <ReviewField label="Day"><input aria-label={label("day")} className={reviewInput} type="number" min={1} value={row.day} onChange={v => patch({ day: Math.max(1, Number(v.target.value)) })} />{row.inferredDay && <ReviewBadge>inferred</ReviewBadge>}</ReviewField>
            <ReviewField label="Start"><input aria-label={label("start")} className={reviewInput} type="time" value={row.startTime} onChange={v => patch({ startTime: v.target.value })} />{!row.startTime && <ReviewBadge>missing time</ReviewBadge>}</ReviewField>
            <ReviewField label="Minutes"><input aria-label={label("duration")} className={reviewInput} type="number" min={0} value={row.durationMin} onChange={v => patch({ durationMin: Math.max(0, Number(v.target.value)), durationSource: "provided" })} />{row.durationSource === "derived" && <ReviewBadge>from CLOSE - OPEN</ReviewBadge>}{row.durationSource === "inferred" && <ReviewBadge>inferred</ReviewBadge>}</ReviewField>
            <Button aria-label={label("delete")} title="Delete row" className="min-h-11 w-11 md:mt-5" variant="ghost" size="icon" onClick={() => dispatch({ type: "delete", kind, index })}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="mt-2 grid min-w-0 gap-2 md:grid-cols-3"><ReviewField label="Part"><select aria-label={label("part")} className={reviewInput} value={draft.parts.some(part => part.accepted && componentPartId(part.id) === row.partId) ? row.partId : MAIN_PART_ID} onChange={e => dispatch({ type: "move-row", kind, index, partId: e.target.value })}><option value={MAIN_PART_ID}>Main programme</option>{draft.parts.filter(part => part.accepted).map(part => <option key={part.id} value={componentPartId(part.id)}>{part.name}</option>)}</select></ReviewField>{!sessions && <ReviewField label="Room"><input aria-label={label("room")} className={reviewInput} value={row.room ?? ""} onChange={e => patch({ room: e.target.value })} /></ReviewField>}</div>
          {session && <div className="mt-2 grid min-w-0 gap-2 md:grid-cols-3">
            <ReviewField label="Type"><input aria-label={label("type")} className={reviewInput} value={session.sessionType ?? session.description.match(/Format: ([^·]+)/)?.[1]?.trim() ?? ""} onChange={v => patch({ sessionType: v.target.value, inferredType: false })} />{session.inferredType && <ReviewBadge>inferred</ReviewBadge>}</ReviewField>
            {(["speakers", "moderators"] as const).map(k => <ReviewField key={k} label={k === "speakers" ? "Speakers" : "Moderators"}><div className="flex flex-wrap gap-1">{session[k].map(name => <Button key={name} variant="outline" className="min-h-11 max-w-full whitespace-normal break-words text-left text-xs" title="Remove assignment" onClick={() => patch({ [k]: session[k].filter(n => n !== name) })}>{name} ×</Button>)}</div><select aria-label={label(k)} className={reviewInput} value="" onChange={v => { if (v.target.value) patch({ [k]: [...new Set([...session[k], v.target.value])] }); }}><option value="">Assign {k === "speakers" ? "speaker" : "moderator"}</option>{draft.event[k].filter(p => p.name.trim() && !session[k].includes(p.name)).map((p, i) => <option key={i} value={p.name}>{p.name}</option>)}</select></ReviewField>)}
            <ReviewField label="Room"><input aria-label={label("room")} className={reviewInput} value={session.room} onChange={v => patch({ room: v.target.value })} /></ReviewField>
            <div className="md:col-span-2"><ReviewField label="Description / notes"><textarea aria-label={label("description")} className={reviewInput} value={session.description} onChange={v => patch({ description: v.target.value })} /></ReviewField></div>
          </div>}
        </div>;
      })}
    </div>
  </section>;
}
