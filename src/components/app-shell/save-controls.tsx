import { useState } from "react";
import { FolderOpen, Save } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthState } from "@/components/app-shell/account-menu";
import { useSavedEvent } from "@/hooks/use-saved-event";
import { listSavedEvents, type SavedEventSummary } from "@/lib/event-store";
import { Button } from "@/components/ui/button";

export function SaveControls() {
  const { userId } = useAuthState();
  const { status, save, load, savedId } = useSavedEvent();
  const [items, setItems] = useState<SavedEventSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const btn =
    "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-navy shadow-sm transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50";

  if (!userId) {
    return (
      <Button type="button" variant="outline" disabled className={btn} title="Sign in to save" aria-label="Save (sign in to save)">
        <Save className="h-3.5 w-3.5" /> Sign in to save
      </Button>
    );
  }

  async function onSave() {
    try {
      await save();
      toast.success("Event saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
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
    <>
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
          {items?.length === 0 && <p className="px-2 py-1.5 text-xs text-muted-foreground">No saved events yet.</p>}
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
    </>
  );
}
