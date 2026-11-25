import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, FolderOpen, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { currentPath, useAuthState } from "@/components/app-shell/account-menu";
import { useEvent } from "@/components/event-context";
import { backupFilename, backupJson, parseBackup } from "@/lib/event-draft";
import { downloadBlob } from "@/lib/download-blob";
import { useSavedEvent } from "@/hooks/use-saved-event";
import { listSavedEvents, SAVE_FAILED_MESSAGE, type SavedEventSummary } from "@/lib/event-store";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function SaveControls() {
  const { userId } = useAuthState();
  const { status, save, load, savedId, reset } = useSavedEvent();
  const [items, setItems] = useState<SavedEventSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const { event, setEvent } = useEvent();
  const fileRef = useRef<HTMLInputElement>(null);

  const btn =
    "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-navy shadow-sm transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50";

  async function onImportFile(file: File | undefined) {
    if (!file) return;
    try {
      setEvent(parseBackup(await file.text()));
      reset();
      toast.success("Backup loaded. Save it to keep it in your account.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't read this backup file.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const backup = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className={btn} aria-label="Backup">
          <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Backup</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="min-h-11 text-xs" onClick={() => downloadBlob(new Blob([backupJson(event)], { type: "application/json" }), backupFilename(event))}>
          <Download className="h-3.5 w-3.5" /> Export backup
        </DropdownMenuItem>
        <DropdownMenuItem className="min-h-11 text-xs" onClick={() => fileRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" /> Import backup
        </DropdownMenuItem>
      </DropdownMenuContent>
      <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => void onImportFile(e.target.files?.[0])} />
    </DropdownMenu>
  );

  if (!userId) {
    return (
      <div className="flex flex-nowrap items-center gap-2">
        {backup}
        <Button asChild variant="outline" className={btn}>
          <Link to="/auth" search={{ next: currentPath() }}>
            <Save className="h-3.5 w-3.5" /> Sign in to save
          </Link>
        </Button>
      </div>
    );
  }

  async function onSave() {
    try {
      await save();
      toast.success("Event saved");
    } catch (err) {
      void err;
      toast.error(SAVE_FAILED_MESSAGE);
    }
  }

  async function refresh() {
    setListError(null);
    try {
      setItems(await listSavedEvents());
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Could not load events");
    }
  }

  return (
    <div className="flex flex-nowrap items-center gap-2">
      {backup}
      <DropdownMenu onOpenChange={(open) => open && void refresh()}>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className={btn}>
            <FolderOpen className="h-3.5 w-3.5" /> My events
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Saved events</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {listError && <p className="px-2 py-1.5 text-xs text-destructive">{listError}</p>}
          {items === null && !listError && <p className="px-2 py-1.5 text-xs text-muted-foreground">Loading…</p>}
          {items?.length === 0 && (
            <EmptyState
              title="No saved events yet"
              description="Save the current event to find it here."
              action={
                <Button
                  type="button"
                  disabled={status === "saving"}
                  onClick={async () => { await onSave(); await refresh(); }}
                >
                  Save current event
                </Button>
              }
            />
          )}
          {items?.map((it) => (
            <DropdownMenuItem
              key={it.id}
              className="flex min-h-11 flex-col items-start text-xs"
              onClick={() =>
                load(it.id).catch((err) => toast.error(err instanceof Error ? err.message : "Could not open event"))
              }
            >
              <span className="font-medium">
                {it.title}
                {it.id === savedId ? " (open)" : ""}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Updated {new Date(it.updatedAt).toLocaleString()}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button type="button" variant="outline" onClick={onSave} disabled={status === "saving"} className={btn} aria-label="Save event">
        <Save className="h-3.5 w-3.5" /> {status === "saving" ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
