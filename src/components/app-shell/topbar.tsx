import { Bell, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SaveControls } from "@/components/app-shell/save-controls";
import { resetSavedEvent } from "@/hooks/use-saved-event";
import { AccountMenu } from "./account-menu";
import { Button } from "@/components/ui/button";

export function AppTopbar({ title, subtitle, breadcrumb }: { title: string; subtitle?: string; breadcrumb?: string }) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-background px-3 py-2 sm:flex sm:min-h-14 sm:justify-between sm:px-6">
      <div className="min-w-0">
        {breadcrumb && (
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {breadcrumb}
          </p>
        )}
        <h1 className="truncate text-sm font-semibold text-navy">{title}</h1>
        {subtitle && <p className="hidden text-xs text-muted-foreground md:block">{subtitle}</p>}
      </div>
      <div className="shrink-0 sm:order-last"><AccountMenu /></div>
      <div className="col-span-2 flex shrink-0 items-center justify-end gap-2 sm:col-span-1 sm:ml-auto">
        <Button variant="outline" size="icon" aria-label="Notifications" className="h-11 w-11 shrink-0 border-border bg-background text-muted-foreground hover:border-accent/30 hover:bg-surface hover:text-foreground">
          <Bell className="h-4 w-4" />
        </Button>
        <SaveControls />
        <Link
          to="/generate"
          onClick={() => resetSavedEvent()}
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-sm transition-all hover:bg-accent/90 hover:shadow-md hover:-translate-y-px active:translate-y-0"
        >
          <Plus className="h-3.5 w-3.5" /> New event
        </Link>
      </div>
    </header>
  );
}
