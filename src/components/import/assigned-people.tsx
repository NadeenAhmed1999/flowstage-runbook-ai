import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addAssignment, assignableOptions, removeAssignment, type AssignOption } from "@/lib/import/assignments";
import { reviewInput } from "./review-field";

/** Assigned people as removable chips plus a searchable "Assign …" dropdown (assigned people excluded). */
export function AssignedPeople({ label, noun, options, assigned, onChange }: { label: string; noun: string; options: AssignOption[]; assigned: string[]; onChange: (next: string[]) => void }) {
  const [query, setQuery] = useState("");
  const all = assignableOptions(options, assigned);
  const shown = assignableOptions(options, assigned, query);
  const labelOf = (value: string) => options.find(o => o.value === value)?.label || value || "Unnamed person";
  return <div className="min-w-0 space-y-1">
    <div className="flex flex-wrap gap-1">{assigned.map(value => <Button key={value} type="button" variant="outline" className="min-h-11 h-auto max-w-full whitespace-normal break-words text-left text-xs" title="Remove assignment" aria-label={`Remove ${labelOf(value)}`} onClick={() => onChange(removeAssignment(assigned, value))}>{labelOf(value)} ×</Button>)}</div>
    {all.length > 8 && <input aria-label={`Search ${noun}s for ${label}`} className={reviewInput} placeholder={`Search ${noun}s`} value={query} onChange={e => setQuery(e.target.value)} />}
    <select aria-label={label} className={reviewInput} value="" disabled={!all.length} onChange={e => { if (e.target.value) { onChange(addAssignment(assigned, e.target.value)); setQuery(""); } }}>
      <option value="">{all.length ? `Assign ${noun}` : `No more ${noun}s to assign`}</option>
      {shown.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>;
}
