import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SidebarAccount } from "./account-menu";
import { resetSavedEvent } from "@/hooks/use-saved-event";
import {
  LayoutDashboard,
  CalendarRange,
  FileText,
  Users,
  Cable,
  Activity,
  Sparkles,
  FileSpreadsheet,
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";

const nav = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/events", label: "Events", icon: CalendarRange },
  { to: "/app/run-of-show", label: "Run-of-show", icon: FileText },
  { to: "/app/talent", label: "Talent", icon: Users },
  { to: "/app/av", label: "AV checklist", icon: Cable },
  { to: "/import", label: "Import", icon: FileSpreadsheet },
  { to: "/app/activity", label: "Activity", icon: Activity },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [expanded, setExpanded] = useState(false);
  const labels = expanded ? "" : "hidden lg:block";

  return (
    <aside aria-label="Operations sidebar" className={`sticky top-0 hidden h-dvh shrink-0 flex-col overflow-y-auto border-r border-border bg-surface transition-[width] duration-200 motion-reduce:transition-none md:flex lg:w-60 ${expanded ? "w-60" : "w-16"}`}>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-2 lg:px-5">
        <Link to="/" className={`${labels} pl-3 font-mono text-sm font-bold uppercase tracking-tighter text-foreground lg:pl-0`}>
          FlowStage //
        </Link>
        <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0 lg:hidden" aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
      </div>

      <div className="px-2 py-4 lg:px-3">
        <p className={`${labels} px-2 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground`}>
          Operations
        </p>
        <nav className="space-y-0.5">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={`group relative flex min-h-11 items-center gap-2.5 rounded-md px-3.5 py-1.5 text-sm transition-all duration-150 lg:min-h-0 lg:px-2.5 ${
                  active
                    ? "bg-background text-navy shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:translate-x-0.5 hover:bg-background/60 hover:text-foreground"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-accent" />
                )}
                <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-accent" : "group-hover:text-foreground"}`} />
                <span className={`${labels} whitespace-nowrap font-medium`}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-border p-2 lg:p-3">
        <Link
          to="/generate"
          onClick={() => resetSavedEvent()}
          aria-label="New event"
          title="New event"
          className="flex min-h-11 items-center gap-2 rounded-md bg-navy px-3.5 py-2 text-sm font-medium text-navy-foreground shadow-sm hover:bg-navy/90 lg:min-h-0 lg:px-3"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className={`${labels} whitespace-nowrap`}>New event</span>
        </Link>
        <div className="mt-3">
          <SidebarAccount compact={!expanded} />
        </div>
      </div>
    </aside>
  );
}
