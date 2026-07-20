import { Link } from "@tanstack/react-router";
import { useState } from "react";

const SOLUTIONS = [
  { to: "/solutions/healthcare-conferences", label: "Healthcare Conferences" },
  { to: "/solutions/corporate-summits", label: "Corporate Summits" },
  { to: "/solutions/event-agencies", label: "Event Agencies" },
  { to: "/solutions/executive-forums", label: "Executive Forums" },
] as const;

export function SiteNav() {
  const [openSolutions, setOpenSolutions] = useState(false);
  return (
    <nav className="no-print sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-mono text-sm font-bold uppercase tracking-tighter text-foreground">
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
        <div className="flex items-center gap-4">
          <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link
            to="/generate"
            className="rounded-md bg-navy px-3.5 py-1.5 text-sm font-medium text-navy-foreground shadow-sm hover:bg-navy/90 transition-colors"
          >
            Start Building
          </Link>
        </div>
      </div>
    </nav>
  );
}
