import { useEffect, useState } from "react";
import { LogOut, UserRound } from "lucide-react";
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
  const { userId, email } = useAuthState();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!userId) {
    return (
      <Link
        to="/auth"
        search={{ next: "/app" }}
        className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-navy shadow-sm transition hover:bg-surface"
      >
        Sign in
      </Link>
    );
  }

  const initial = (email ?? "?").slice(0, 1).toUpperCase();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          className="grid h-8 w-8 place-items-center rounded-full bg-navy text-[11px] font-bold text-navy-foreground shadow-sm transition hover:bg-navy/90"
        >
          {initial}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate text-xs font-medium text-muted-foreground">
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-xs">
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Sidebar footer account block — real session state, no invented personas. */
export function SidebarAccount() {
  const { userId, email } = useAuthState();

  if (!userId) {
    return (
      <Link
        to="/auth"
        search={{ next: "/app" }}
        className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-xs font-medium text-navy shadow-sm transition hover:bg-surface"
      >
        <UserRound className="h-4 w-4 text-muted-foreground" />
        Sign in to save events
      </Link>
    );
  }

  const initial = (email ?? "?").slice(0, 1).toUpperCase();
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-[10px] font-bold text-navy-foreground">
        {initial}
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-xs font-medium text-foreground">{email}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Signed in</p>
      </div>
    </div>
  );
}
