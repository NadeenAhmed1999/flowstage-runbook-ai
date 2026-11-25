import type { FriendlyAiError } from "@/lib/ai-errors";

/** Friendly AI failure: short message, sign-in link when signed out, technical detail collapsed. */
export function AiErrorNotice({ error, className = "" }: { error: FriendlyAiError; className?: string }) {
  const next = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/app";
  return (
    <div className={`text-sm ${className}`}>
      <p>{error.message}</p>
      {error.signIn && (
        <a href={`/auth?next=${encodeURIComponent(next)}`} className="mt-1 inline-block font-medium underline">
          Sign in
        </a>
      )}
      {error.detail && (
        <details className="mt-1 text-xs opacity-70">
          <summary className="cursor-pointer">Details</summary>
          <p className="mt-1 break-words">{error.detail}</p>
        </details>
      )}
    </div>
  );
}
