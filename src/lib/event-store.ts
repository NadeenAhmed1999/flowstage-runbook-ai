import { supabase } from "@/integrations/supabase/client";
import type { OpsModel } from "@/lib/event-model";
import type { EventMeta } from "@/lib/event-persist";

/**
 * Browser-side persistence for saved events. All reads and writes go through
 * the Supabase client with the user's own session, so Row Level Security on
 * the `events` table decides what is visible — owners see their events,
 * collaborators see shared ones, nobody else does.
 */

export type SavedEventSummary = {
  id: string;
  title: string;
  ownerId: string;
  updatedAt: string;
};

export type SavedEventInput = {
  id?: string;
  title: string;
  eventMeta: EventMeta;
  ops: OpsModel;
};

export type LoadedEvent = {
  id: string;
  title: string;
  updatedAt: string;
  eventMeta: EventMeta;
  ops: OpsModel;
};

export async function listSavedEvents(): Promise<SavedEventSummary[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, owner_id, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({ id: r.id, title: r.title, ownerId: r.owner_id, updatedAt: r.updated_at }));
}

export async function saveEventRow(input: SavedEventInput): Promise<string> {
  const row = { title: input.title, event_meta: input.eventMeta, ops: input.ops };
  if (input.id) {
    const { error } = await supabase.from("events").update(row).eq("id", input.id);
    if (error) throw error;
    return input.id;
  }
  const { data, error } = await supabase.from("events").insert(row).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function loadSavedEvent(id: string): Promise<LoadedEvent> {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, event_meta, ops, updated_at")
    .eq("id", id)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    title: data.title,
    updatedAt: data.updated_at,
    eventMeta: data.event_meta as EventMeta,
    ops: data.ops as OpsModel,
  };
}

export async function deleteSavedEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

export async function getSignedInUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
