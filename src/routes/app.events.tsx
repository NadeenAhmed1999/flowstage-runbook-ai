import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Copy, FolderOpen, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppTopbar } from "@/components/app-shell/topbar";
import { useAuthState } from "@/components/app-shell/account-menu";
import { useEvent } from "@/components/event-context";
import { useSavedEvent } from "@/hooks/use-saved-event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { listSavedEvents, duplicateSavedEvent, deleteSavedEvent, type SavedEventSummary } from "@/lib/event-store";
import { canDeleteEvent, eventListState, eventListSummary } from "@/lib/event-list-summary";
import { formatOverviewDateRange, isExampleEvent, overviewSummary } from "@/lib/overview-summary";

export const Route = createFileRoute("/app/events")({
  head: () => ({ meta: [
    { title: "Saved events · FlowStage" },
    { name: "description", content: "Find and open your saved FlowStage events and manage event copies." },
    { property: "og:title", content: "Saved events · FlowStage" },
    { property: "og:description", content: "Your saved events and current event in FlowStage." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: EventsPage,
});

function EventCounts({ sessions, people, partCount }: { sessions: number; people: number; partCount: number }) {
  return <p className="text-xs text-muted-foreground">{sessions} sessions · {people} speakers + moderators{partCount > 1 ? ` · ${partCount} parts` : ""}</p>;
}

function SetupActions() {
  return <Button asChild className="min-h-11"><Link to="/app/new">Set up your event</Link></Button>;
}

function EventsPage() {
  const { userId, ready } = useAuthState();
  const { event } = useEvent();
  const { savedId, status, error: saveError, save, load, reset } = useSavedEvent();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [localeReady, setLocaleReady] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedEventSummary | null>(null);
  const queryKey = ["saved-events", userId];
  const list = useQuery({ queryKey, queryFn: listSavedEvents, enabled: ready && !!userId });
  useEffect(() => { setLocaleReady(true); }, []);
  useEffect(() => {
    if (userId && status === "saved") void queryClient.invalidateQueries({ queryKey: ["saved-events", userId] });
  }, [userId, savedId, status, queryClient]);
  const rows = list.data ?? [];
  const view = eventListState(ready, userId, list.isPending, list.isError, rows.length);
  const current = overviewSummary(event);
  const hasCurrent = savedId !== null || !current.empty || event.breaks.length > 0;
  const showSearch = rows.length > 6;
  const filtered = showSearch ? rows.filter(row => row.title.toLocaleLowerCase().includes(search.toLocaleLowerCase())) : rows;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["saved-events", userId] });

  async function act(id: string, action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(id);
    try { await action(); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not complete this action. Please try again."); }
    finally { setBusy(null); }
  }

  return <>
    <AppTopbar breadcrumb="Operations" title="Events" subtitle="Your saved events" primary="none" />
    <div className="min-w-0 flex-1 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {hasCurrent && <section aria-label="Current event" className="space-y-3 border-b border-border pb-6">
          <h2 className="text-sm font-semibold text-navy">Current event</h2>
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-background p-4">
            <div className="min-w-0 flex-1 space-y-2">
              <h3 className="break-words font-semibold text-foreground">{event.name || "Untitled event"}</h3>
              {isExampleEvent(event, savedId) && <p className="text-xs font-medium text-muted-foreground">Example event</p>}
              <p className="text-sm text-muted-foreground">{localeReady ? formatOverviewDateRange(event) : "…"}</p>
              <EventCounts {...current} />
              <p role="status" className={status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
                {status === "saving" ? "Saving…" : status === "error" ? `Save failed: ${saveError || "Please try again."}` : savedId ? "Saved" : "Not saved yet"}
              </p>
            </div>
            {userId && (!savedId || status === "error") && <Button variant="outline" className="min-h-11" disabled={status === "saving" || busy !== null} onClick={() => void act("save", async () => { await save(); await refresh(); })}>
              <Save />{status === "error" ? "Retry" : "Save"}
            </Button>}
          </div>
        </section>}
        {view === "signed-out" && <EmptyState icon={FolderOpen} title="Sign in to save and find your events" action={<Button asChild className="min-h-11"><Link to="/auth" search={{ next: "/app/events" }}>Sign in</Link></Button>} />}
        {view === "loading" && <p role="status" className="py-8 text-sm text-muted-foreground">Loading events…</p>}
        {view === "error" && <EmptyState title="Could not load your events" description="Please try again." action={<Button variant="outline" className="min-h-11" onClick={() => void list.refetch()}>Retry</Button>} />}
        {view === "empty" && <EmptyState icon={CalendarDays} title="No saved events yet" action={<SetupActions />} secondary={<Button asChild variant="link" className="min-h-11"><Link to="/app/import">Import existing event</Link></Button>} />}
        {view === "ready" && <section aria-label="Saved events" className="space-y-4">
          <h2 className="text-sm font-semibold text-navy">Saved events</h2>
          {showSearch && <Input aria-label="Search events" placeholder="Search events" value={search} onChange={e => setSearch(e.target.value)} className="min-h-11 max-w-md" />}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">No matching events.</p>}
          <ul className="grid min-w-0 gap-3 xl:grid-cols-2">
            {filtered.map(row => {
              const summary = eventListSummary(row);
              const updated = new Date(row.updatedAt);
              return <li key={row.id} className="min-w-0 space-y-3 rounded-lg border border-border bg-background p-4">
                <div className="flex items-start gap-2">
                  <h3 className="min-w-0 flex-1 break-words font-semibold text-foreground">{row.title}</h3>
                  {row.id === savedId && <span className="shrink-0 rounded border border-border bg-surface px-2 py-1 text-xs font-medium text-navy">Open</span>}
                </div>
                <p className="text-sm text-muted-foreground">{localeReady ? summary.dateRange : "…"}</p>
                <EventCounts {...summary} />
                <p className="text-xs text-muted-foreground">Updated {localeReady && !Number.isNaN(updated.getTime()) ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(updated) : "…"}</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="min-h-11" disabled={busy !== null} onClick={() => void act(row.id, async () => { await load(row.id); await navigate({ to: "/app" }); })}><FolderOpen />Open</Button>
                  <Button variant="outline" className="min-h-11" disabled={busy !== null} onClick={() => void act(row.id, async () => { await duplicateSavedEvent(row.id); await refresh(); })}><Copy />Duplicate</Button>
                  {canDeleteEvent(row.ownerId, userId) && <Button variant="outline" className="min-h-11" disabled={busy !== null} onClick={() => setDeleteTarget(row)}><Trash2 />Delete</Button>}
                </div>
              </li>;
            })}
          </ul>
        </section>}
      </div>
    </div>
    <AlertDialog open={deleteTarget !== null && canDeleteEvent(deleteTarget.ownerId, userId)} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="break-words">Delete “{deleteTarget?.title}”?</AlertDialogTitle>
          <AlertDialogDescription>This deletes the saved event. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">Cancel</AlertDialogCancel>
          <AlertDialogAction className="min-h-11" onClick={() => {
            const target = deleteTarget;
            if (!target || !canDeleteEvent(target.ownerId, userId)) return;
            void act(target.id, async () => { await deleteSavedEvent(target.id); if (target.id === savedId) reset(); await refresh(); });
          }}>Delete event</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>;
}
