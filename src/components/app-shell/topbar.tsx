import { Search, Bell, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function AppTopbar({ title, subtitle, breadcrumb }: { title: string; subtitle?: string; breadcrumb?: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="min-w-0">
        {breadcrumb && (
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {breadcrumb}
          </p>
        )}
        <h1 className="truncate text-sm font-semibold text-navy">{title}</h1>
        {subtitle && <p className="hidden text-xs text-muted-foreground md:block">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-foreground md:flex">
          <Search className="h-3.5 w-3.5" />
          <span>Search events, talent, cues…</span>
          <kbd className="ml-2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </div>
        <button className="rounded-md border border-border bg-background p-2 text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
        </button>
        <Link
          to="/generate"
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-sm hover:bg-accent/90"
        >
          <Plus className="h-3.5 w-3.5" /> New event
        </Link>
      </div>
    </header>
  );
}
