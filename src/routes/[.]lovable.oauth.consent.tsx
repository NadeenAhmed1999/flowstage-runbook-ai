import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthOAuthApi {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{
    data: {
      client?: { name?: string; client_uri?: string };
      redirect_url?: string;
      redirect_to?: string;
      scope?: string;
    } | null;
    error: { message: string } | null;
  }>;
  approveAuthorization: (id: string) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
  denyAuthorization: (id: string) => Promise<{
    data: { redirect_url?: string; redirect_to?: string } | null;
    error: { message: string } | null;
  }>;
}

function oauthApi(): AuthOAuthApi {
  return (supabase.auth as unknown as { oauth: AuthOAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/auth", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId =
      new URLSearchParams(location.search).get("authorization_id") ?? "";
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: ConsentPage,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md px-6 py-16 text-center">
      <h1 className="text-lg font-semibold text-navy">Authorization error</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function ConsentPage() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "an external app";
  const scopeString = details?.scope ?? "";
  const scopes = scopeString.split(/\s+/).filter(Boolean);

  async function decide(approve: boolean) {
    setError(null);
    setBusy(true);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-6 py-12">
      <div className="w-full rounded-lg border border-border bg-background p-6 shadow-sm">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-accent">
          FlowStage · Authorize
        </p>
        <h1 className="mt-1 text-lg font-semibold text-navy">
          Connect {clientName} to your account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {clientName} will be able to call FlowStage's enabled tools while you are signed in.
        </p>

        {scopes.length > 0 && (
          <div className="mt-4 rounded-md border border-border bg-surface/50 p-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Requested access
            </p>
            <ul className="mt-2 space-y-1 text-xs text-foreground">
              {scopes.map((s) => (
                <li key={s} className="flex items-start gap-1.5">
                  <span className="text-accent">›</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
          This does not bypass FlowStage's permissions or backend policies.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => void decide(true)}
            disabled={busy}
            className="flex-1 rounded-md bg-navy px-3 py-2 text-sm font-semibold text-navy-foreground shadow-sm hover:bg-navy/90 disabled:opacity-50"
          >
            {busy ? "Working…" : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => void decide(false)}
            disabled={busy}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-surface disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}
