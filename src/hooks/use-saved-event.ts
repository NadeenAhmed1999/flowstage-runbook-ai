import { useCallback, useSyncExternalStore } from "react";
import { useEvent } from "@/components/event-context";
import { pickEventMeta, eventFromSaved } from "@/lib/event-persist";
import { saveEventRow, loadSavedEvent } from "@/lib/event-store";
import { snapshotOf } from "@/lib/event-draft";

/**
 * Tracks which saved event (if any) the in-memory event is linked to, plus the
 * save status. Kept in a tiny module-level store so every component (top bar,
 * menus, sign-out) shares one value without touching event-context.
 */
export type SaveStatus = "idle" | "saving" | "saved" | "error";

type State = { savedId: string | null; status: SaveStatus; error: string | null; savedSnapshot: string | null };

let state: State = { savedId: null, status: "idle", error: null, savedSnapshot: null };
const listeners = new Set<() => void>();

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const SERVER_STATE: State = { savedId: null, status: "idle", error: null, savedSnapshot: null };

/** Clear the saved link (new event, sign-out). Usable outside React. */
export function resetSavedEvent() {
  setState({ savedId: null, status: "idle", error: null, savedSnapshot: null });
}

/** Restore the saved link from a device draft (snapshot unknown, so it counts as unsaved). */
export function restoreSavedLink(savedId: string | null) {
  setState({ savedId, status: "idle", error: null, savedSnapshot: null });
}

export function getSavedState() {
  return state;
}

export function useSavedEvent() {
  const snap = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  const { event, ops, setEvent } = useEvent();

  const save = useCallback(async () => {
    setState({ status: "saving", error: null });
    try {
      const id = await saveEventRow({
        id: state.savedId ?? undefined,
        title: event.name || "Untitled event",
        eventMeta: pickEventMeta(event),
        ops,
      });
      setState({ savedId: id, status: "saved", savedSnapshot: snapshotOf(event) });
      return id;
    } catch (err) {
      setState({ status: "error", error: err instanceof Error ? err.message : "Save failed" });
      throw err;
    }
  }, [event, ops]);

  const load = useCallback(
    async (id: string) => {
      const row = await loadSavedEvent(id);
      const next = eventFromSaved(row.eventMeta, row.ops);
      setEvent(next);
      setState({ savedId: row.id, status: "saved", error: null, savedSnapshot: snapshotOf(next) });
    },
    [setEvent],
  );

  return { savedSnapshot: snap.savedSnapshot, savedId: snap.savedId, status: snap.status, error: snap.error, save, load, reset: resetSavedEvent };
}
