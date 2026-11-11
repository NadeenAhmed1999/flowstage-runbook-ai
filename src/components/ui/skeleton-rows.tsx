import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder rows while content loads. */
export function SkeletonRows({ rows = 4, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}
