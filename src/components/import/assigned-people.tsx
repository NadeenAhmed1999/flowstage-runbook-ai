import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addAssignment, assignableOptions, removeAssignment, type AssignOption } from "@/lib/import/assignments";
import { reviewInput } from "./review-field";

/** Assigned people as removable chips plus a searchable list picker (assigned people excluded). */
export function AssignedPeople({ label, noun, options, assigned, onChange }: { label: string; noun: string; options: AssignOption[]; assigned: string[]; onChange: (next: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const all = assignableOptions(options, assigned);
  const shown = assignableOptions(options, assigned, query);
  const labelOf = (value: string) => options.find(o => o.value === value)?.label || value || "Unnamed person";
  return <div className="min-w-0 space-y-1">
    <div className="flex flex-wrap gap-1">{assigned.map(value => <Button key={value} type="button" variant="outline" className="min-h-11 h-auto max-w-full whitespace-normal break-words text-left text-xs" title="Remove assignment" aria-label={`Remove ${labelOf(value)}`} onClick={() => onChange(removeAssignment(assigned, value))}>{labelOf(value)} ×</Button>)}</div>
    {!all.length ? <p className="text-xs text-muted-foreground">No more {noun}s to assign</p> : !open
      ? <Button type="button" variant="outline" className="min-h-11 w-full justify-start text-xs" aria-label={label} onClick={() => setOpen(true)}>+ Assign {noun}</Button>
      : <div className="rounded-md border border-border bg-background">
          <div className="flex gap-1 p-1">
            <input autoFocus aria-label={`Search ${noun}s for ${label}`} className={reviewInput} placeholder={`Search ${noun}s`} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Escape") { setOpen(false); setQuery(""); } }} />
            <Button type="button" variant="ghost" className="min-h-11 text-xs" onClick={() => { setOpen(false); setQuery(""); }}>Done</Button>
          </div>
          <ul role="listbox" aria-label={`${label} options`} className="max-h-56 overflow-y-auto border-t border-border">
            {shown.length ? shown.map(o => <li key={o.value} role="option" aria-selected={false}>
              <button type="button" className="flex min-h-11 w-full items-center px-3 text-left text-sm hover:bg-surface" onClick={() => { onChange(addAssignment(assigned, o.value)); setQuery(""); }}>{o.label}</button>
            </li>) : <li className="px-3 py-3 text-sm text-muted-foreground">No matches</li>}
          </ul>
        </div>}
  </div>;
}
