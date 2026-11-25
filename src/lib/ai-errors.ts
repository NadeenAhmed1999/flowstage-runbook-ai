export const AI_SIGN_IN_MESSAGE = "Sign in to use AI features. Your draft is kept on this device.";

export type FriendlyAiError = { message: string; detail?: string; signIn: boolean };

export function isAuthError(err: unknown): boolean {
  if (typeof Response !== "undefined" && err instanceof Response) return err.status === 401;
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /unauthori[sz]ed|\b401\b|no authorization/i.test(msg);
}

/** Turns any AI call failure into a short user message; technical text goes in `detail`. */
export function friendlyAiError(err: unknown, fallback: string): FriendlyAiError {
  if (isAuthError(err)) return { message: AI_SIGN_IN_MESSAGE, signIn: true };
  const detail = err instanceof Error ? err.message : typeof err === "string" ? err : undefined;
  return { message: fallback, signIn: false, ...(detail ? { detail } : {}) };
}
