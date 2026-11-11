import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Plain-language error with an optional retry. */
export function InlineError({ message, onRetry, retryLabel = "Try again" }: { message: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div role="alert" className="flex flex-wrap items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1">{message}</p>
      {onRetry && (
        <Button type="button" size="sm" variant="outline" className="min-h-11 sm:min-h-9" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
