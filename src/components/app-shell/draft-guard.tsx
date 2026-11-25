import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useEvent } from "@/components/event-context";
import { getSavedState, resetSavedEvent, restoreSavedLink, useSavedEvent } from "@/hooks/use-saved-event";
import { DRAFT_KEY, parseDraft, seedSnapshot, serializeDraft, snapshotOf } from "@/lib/event-draft";
import { Button } from "@/components/ui/button";

/**
 * Keeps the in-progress event on this device: restores it after mount (SSR-safe),
 * autosaves ~500 ms after changes, and warns before leaving with unsaved changes.
 */
export function DraftGuard() {
  const { event, reset, setEvent } = useEvent();
  const { savedId, savedSnapshot } = useSavedEvent();
  const [restored, setRestored] = useState(false);
  const ready = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    try {
      const d = parseDraft(localStorage.getItem(DRAFT_KEY));
      if (d) {
        setEvent(d.event);
        restoreSavedLink(d.savedId);
        setRestored(true);
      }
    } catch { /* storage unavailable */ }
    ready.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const snap = snapshotOf(event);
    dirty.current = snap !== (savedSnapshot ?? seedSnapshot());
    if (!ready.current) return;
    const t = setTimeout(() => {
      try {
        if (dirty.current) localStorage.setItem(DRAFT_KEY, serializeDraft(event, getSavedState().savedId));
        else localStorage.removeItem(DRAFT_KEY);
      } catch { /* quota or private mode */ }
    }, 500);
    return () => clearTimeout(t);
  }, [event, savedId, savedSnapshot]);

  useEffect(() => {
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  if (!restored) return null;
  return (
    <div role="status" className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs text-navy shadow-md md:bottom-4">
      <span className="flex-1">Restored your unsaved draft</span>
      <Button type="button" variant="outline" className="min-h-11 text-xs" onClick={() => {
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
        dirty.current = false;
        reset();
        resetSavedEvent();
        setRestored(false);
      }}>Discard draft</Button>
      <Button type="button" variant="ghost" size="icon" className="h-11 w-11" aria-label="Dismiss" onClick={() => setRestored(false)}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
