import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { AccountMenu, useAuthState } from "@/components/app-shell/account-menu";
import { resetSavedEvent } from "@/hooks/use-saved-event";

const SOLUTIONS = [
  { to: "/solutions/healthcare-conferences", label: "Healthcare Conferences" },
  { to: "/solutions/corporate-summits", label: "Corporate Summits" },
  { to: "/solutions/event-agencies", label: "Event Agencies" },
  { to: "/solutions/executive-forums", label: "Executive Forums" },
] as const;

export function SiteNav() {
  const [openSolutions, setOpenSolutions] = useState(false);
  const { userId } = useAuthState();
  return (
    <nav className="no-print sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:flex sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link to="/" className="truncate font-mono text-sm font-bold uppercase tracking-tighter text-foreground">
            FlowStage //
          </Link>
          <div className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground transition-colors">Product</Link>
            <div
              className="relative"
              onMouseEnter={() => setOpenSolutions(true)}
              onMouseLeave={() => setOpenSolutions(false)}
            >
              <button
                type="button"
                className="hover:text-foreground transition-colors"
                onClick={() => setOpenSolutions((v) => !v)}
              >
                Solutions
              </button>
              {openSolutions && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="min-w-[240px] rounded-lg border border-border bg-background p-2 shadow-lg">
                    {SOLUTIONS.map((s) => (
                      <Link
                        key={s.to}
                        to={s.to}
                        className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-surface"
                      >
                        {s.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/resources" className="hover:text-foreground transition-colors">Resources</Link>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {userId && (
            <Link to="/app" className="hidden min-h-11 items-center px-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex">
              Open app
            </Link>
          )}
          <AccountMenu />
          <Link
            to="/generate"
            onClick={() => resetSavedEvent()}
            className="inline-flex min-h-11 items-center rounded-md bg-navy px-3.5 py-1.5 text-sm font-medium text-navy-foreground shadow-sm hover:bg-navy/90 transition-colors"
          >
            New event
          </Link>
        </div>
      </div>
    </nav>
  );
}
