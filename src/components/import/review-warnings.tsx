import type { ImportWarning } from "@/lib/import/warnings";
import { Button } from "@/components/ui/button";

export function ReviewWarnings({ warnings, notes }: { warnings: ImportWarning[]; notes: string[] }) {
  if (!warnings.length && !notes.length) return null;
  return <section className="border-b border-border bg-surface p-4 text-sm" aria-label="Import warnings">
    <h3 className="font-semibold">Needs your eyes</h3>
    <ul className="mt-2 space-y-3">{warnings.map(warning => <li key={warning.id} className="min-w-0">
      <p className="break-words font-medium">{warning.message}</p>
      <ul className="mt-1 text-muted-foreground">{warning.rows.map((row, index) => <li key={`${row.id}-${index}`} className="flex flex-wrap items-center gap-x-2">
        <span className="min-w-0 break-words">{row.label}</span>
        <Button asChild variant="link" className="min-h-11 shrink-0 px-0 text-xs"><a href={`#${row.id}`} onClick={e => { e.preventDefault(); const target = document.getElementById(row.id); target?.scrollIntoView({ block: "center", behavior: "instant" }); target?.querySelector<HTMLElement>("input, select, textarea")?.focus({ preventScroll: true }); }}>Go to row</a></Button>
      </li>)}</ul>
    </li>)}{notes.map((note, index) => <li key={`note-${index}`} className="break-words text-muted-foreground">{note}</li>)}</ul>
  </section>;
}