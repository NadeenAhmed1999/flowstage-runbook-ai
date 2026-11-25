import { useEffect, useState } from "react";
import { CalendarRange, FileSpreadsheet, Globe, LayoutDashboard, LogOut, Plus, UserRound } from "lucide-react";
import { resetSavedEvent } from "@/hooks/use-saved-event";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function useAuthState() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserId(data.user?.id ?? null);
      setEmail(data.user?.email ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setUserId(session?.user?.id ?? null);
      setEmail(session?.user?.email ?? null);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { userId, email, ready };
}

export function AccountMenu() {
  const { userId, email, ready } = useAuthState();

  if (!ready) return <span aria-label="Loading account" className="block h-11 w-11" />;

  if (!userId) {
    return (
      <Link
        to="/auth"
        search={{ next: currentPath() }}
        className="inline-flex min-h-11 shrink-0 items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-navy shadow-sm transition hover:bg-surface"
      >
        Sign in
      </Link>
    );
  }

  const initial = (email ?? "?").slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Account menu"
          title="Account menu"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy p-0 text-[11px] font-bold text-navy-foreground shadow-sm transition hover:bg-navy/90"
        >
          {initial}
        </Button>
      </DropdownMenuTrigger>
      <AccountMenuItems email={email} align="end" />
    </DropdownMenu>
  );
}

function AccountMenuItems({ email, align }: { email: string | null; align: "end" | "start" }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", search: { next: "/app" }, replace: true });
  }
  const item = "min-h-11 text-xs";
  return (
    <DropdownMenuContent align={align} className="w-56">
      <DropdownMenuLabel className="truncate text-xs font-medium text-muted-foreground">{email}</DropdownMenuLabel>
      <DropdownMenuItem asChild className={item}><Link to="/app"><LayoutDashboard className="h-3.5 w-3.5" /> Dashboard</Link></DropdownMenuItem>
      <DropdownMenuItem asChild className={item}><Link to="/app/events"><CalendarRange className="h-3.5 w-3.5" /> My events</Link></DropdownMenuItem>
      <DropdownMenuItem asChild className={item}><Link to="/app/new" onClick={() => resetSavedEvent()}><Plus className="h-3.5 w-3.5" /> New event</Link></DropdownMenuItem>
      <DropdownMenuItem asChild className={item}><Link to="/app/import"><FileSpreadsheet className="h-3.5 w-3.5" /> Import existing event</Link></DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild className={item}><Link to="/"><Globe className="h-3.5 w-3.5" /> Back to website</Link></DropdownMenuItem>
      <DropdownMenuItem onClick={handleSignOut} className={item}><LogOut className="h-3.5 w-3.5" /> Sign out</DropdownMenuItem>
    </DropdownMenuContent>
  );
}

/** Sidebar footer account block — real session state, no invented personas. */
export function SidebarAccount({ compact = false }: { compact?: boolean }) {
  const { userId, email } = useAuthState();

  if (!userId) {
    return (
      <Link
        to="/auth"
        search={{ next: currentPath() }}
        aria-label="Sign in"
        title="Sign in"
        className="flex min-h-11 items-center gap-2 rounded-md border border-border bg-background px-3.5 py-2 text-xs font-medium text-navy shadow-sm transition hover:bg-surface lg:px-2.5"
      >
        <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className={compact ? "hidden lg:block" : ""}>Sign in</span>
      </Link>
    );
  }

  const initial = (email ?? "?").slice(0, 1).toUpperCase();
  return (
    <DropdownMenu>
    <DropdownMenuTrigger asChild>
    <button type="button" aria-label="Account menu" className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-md px-1 text-left transition hover:bg-background" title={email ?? undefined}>
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-[10px] font-bold text-navy-foreground">
        {initial}
      </div>
      <div className={`min-w-0 leading-tight ${compact ? "hidden lg:block" : ""}`}>
        <p className="truncate text-xs font-medium text-foreground">{email}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Signed in</p>
      </div>
    </button>
    </DropdownMenuTrigger>
    <AccountMenuItems email={email} align="start" />
    </DropdownMenu>
  );
}

/** Current in-app path (with search) for the sign-in return trip; client-only. */
export function currentPath(): string {
  if (typeof window === "undefined") return "/app";
  const p = window.location.pathname + window.location.search;
  return p.startsWith("/auth") ? "/app" : p;
}
