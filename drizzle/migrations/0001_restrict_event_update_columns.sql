revoke update on public.events from authenticated;
grant update (title, event_meta, ops) on public.events to authenticated;