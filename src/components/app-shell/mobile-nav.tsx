import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Cable, CalendarRange, FileSpreadsheet, FileText, LayoutDashboard, MoreHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const tabs = [
  { to: "/app", label: "Overview", icon: LayoutDashboard },
  { to: "/app/run-of-show", label: "Run-of-show", icon: FileText },
  { to: "/app/talent", label: "Talent", icon: Users },
  { to: "/app/av", label: "AV", icon: Cable },
] as const;
const more = [
  { to: "/app/events", label: "Events", icon: CalendarRange },
  { to: "/app/import", label: "Import", icon: FileSpreadsheet },
  { to: "/app/activity", label: "Activity", icon: Activity },
] as const;

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Phone navigation" className="no-print fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      {tabs.map(({ to, label, icon: Icon }) => (
        <Button key={to} asChild variant="ghost" className={`h-16 min-w-0 flex-col gap-1 rounded-none px-0 text-[10px] ${pathname === to ? "bg-surface text-accent" : "text-muted-foreground"}`}>
          <Link to={to} aria-current={pathname === to ? "page" : undefined}><Icon className="h-5 w-5" /><span>{label}</span></Link>
        </Button>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={`h-16 min-w-0 flex-col gap-1 rounded-none px-0 text-[10px] ${more.some((item) => item.to === pathname) ? "bg-surface text-accent" : "text-muted-foreground"}`} aria-label="More">
            <MoreHorizontal className="h-5 w-5" /><span>More</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-48">
          {more.map(({ to, label, icon: Icon }) => (
            <DropdownMenuItem key={to} asChild className="min-h-11">
              <Link to={to}><Icon className="h-4 w-4 shrink-0" />{label}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}