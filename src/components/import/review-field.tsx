export const reviewInput = "min-h-11 w-full min-w-0 rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring";
export function ReviewField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block min-w-0"><span className="mb-1 block text-xs text-muted-foreground">{label}</span>{children}</label>;
}
export function ReviewBadge({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground">{children}</span>;
}
