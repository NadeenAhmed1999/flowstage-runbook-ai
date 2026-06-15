import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarRange,
  FileText,
  Users,
  Cable,
  Activity,
  Sparkles,
} from "lucide-react";

const nav = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/app/events", label: "Events", icon: CalendarRange },
  { to: "/app/run-of-show", label: "Run-of-Show", icon: FileText },
  { to: "/app/talent", label: "Talent", icon: Users },
  { to: "/app/av", label: "AV Checklist", icon: Cable },
  { to: "/app/activity", label: "Activity", icon: Activity },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-14 items-center border-b border-border px-5">
        <Link to="/" className="font-mono text-sm font-bold uppercase tracking-tighter text-foreground">
          FlowStage //
        </Link>
      </div>

      <div className="px-3 py-4">
        <p className="px-2 pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
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
                className={`group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-all duration-150 ${
                  active
                    ? "bg-background text-navy shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:translate-x-0.5 hover:bg-background/60 hover:text-foreground"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-accent" />
                )}
                <Icon className={`h-4 w-4 transition-colors ${active ? "text-accent" : "group-hover:text-foreground"}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-border p-3">
        <Link
          to="/generate"
          className="flex items-center gap-2 rounded-md bg-navy px-3 py-2 text-sm font-medium text-navy-foreground shadow-sm hover:bg-navy/90"
        >
          <Sparkles className="h-4 w-4" />
          New run-of-show
        </Link>
        <div className="mt-3 flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-navy text-[10px] font-bold text-navy-foreground">
            SJ
          </div>
          <div className="leading-tight">
            <p className="font-medium text-foreground">Sarah Jenkins</p>
            <p className="text-[10px] uppercase tracking-wider">Stage Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
