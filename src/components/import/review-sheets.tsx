import { Checkbox } from "@/components/ui/checkbox";
import type { ReviewDraft } from "@/lib/import/review-draft";
export function ReviewSheets({ draft, names, onInclude }: { draft: ReviewDraft; names: string[]; onInclude: (name: string, included: boolean) => void }) {
  if (!names.length) return null;
  return <section className="border-t border-border p-4"><h3 className="font-semibold">Skipped sheets</h3><div className="mt-2 divide-y divide-border">{names.map(name => { const sheet = draft.sheets[name]; return <div key={name}><label className="flex min-h-11 cursor-pointer items-center gap-3 break-words text-sm"><Checkbox aria-label={`Include ${name}`} checked={sheet?.included ?? false} disabled={sheet?.loading} onCheckedChange={v => onInclude(name, v === true)} /><span className="min-w-0 flex-1">{name}</span><span className="text-xs text-muted-foreground">{sheet?.loading ? "Mapping…" : "Include"}</span></label>{sheet?.error && <p role="alert" className="text-xs text-destructive">{sheet.error}</p>}</div>; })}</div></section>;
}
