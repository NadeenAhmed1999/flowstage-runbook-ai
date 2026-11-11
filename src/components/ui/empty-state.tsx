import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** One sentence on what belongs here, one primary action, optional secondary link. */
export function EmptyState({ icon: Icon, title, description, action, secondary }: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode; secondary?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center">
      {Icon && (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-background text-muted-foreground">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="text-sm font-semibold text-navy">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
      {secondary && <div className="mt-2 text-xs text-muted-foreground">{secondary}</div>}
    </div>
  );
}
