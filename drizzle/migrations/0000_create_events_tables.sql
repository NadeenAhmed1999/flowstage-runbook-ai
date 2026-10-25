create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  title text not null,
  event_meta jsonb not null default '{}'::jsonb,
  ops jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_collaborators (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('editor','viewer')),
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index events_owner_idx on public.events (owner_id);
create index event_collaborators_user_idx on public.event_collaborators (user_id);

grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
grant select, insert, update, delete on public.event_collaborators to authenticated;
grant all on public.event_collaborators to service_role;

alter table public.events enable row level security;
alter table public.event_collaborators enable row level security;

-- Security-definer helper so policies never recurse through RLS on their own tables.
create or replace function public.event_access(_event_id uuid, _user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (select 1 from public.events e where e.id = _event_id and e.owner_id = _user_id) then 'owner'
    else (select c.role from public.event_collaborators c where c.event_id = _event_id and c.user_id = _user_id)
  end;
$$;

create policy "Owners read their events"
  on public.events for select to authenticated
  using (owner_id = auth.uid());

create policy "Collaborators read shared events"
  on public.events for select to authenticated
  using (public.event_access(id, auth.uid()) in ('editor','viewer'));

create policy "Owners insert their events"
  on public.events for insert to authenticated
  with check (owner_id = auth.uid());

create policy "Owners and editors update events"
  on public.events for update to authenticated
  using (public.event_access(id, auth.uid()) in ('owner','editor'))
  with check (public.event_access(id, auth.uid()) in ('owner','editor'));

create policy "Owners delete their events"
  on public.events for delete to authenticated
  using (owner_id = auth.uid());

create policy "Members read collaborator rows"
  on public.event_collaborators for select to authenticated
  using (user_id = auth.uid() or public.event_access(event_id, auth.uid()) = 'owner');

create policy "Owners add collaborators"
  on public.event_collaborators for insert to authenticated
  with check (public.event_access(event_id, auth.uid()) = 'owner');

create policy "Owners update collaborators"
  on public.event_collaborators for update to authenticated
  using (public.event_access(event_id, auth.uid()) = 'owner')
  with check (public.event_access(event_id, auth.uid()) = 'owner');

create policy "Owners and self remove collaborators"
  on public.event_collaborators for delete to authenticated
  using (user_id = auth.uid() or public.event_access(event_id, auth.uid()) = 'owner');

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_touch_updated_at
  before update on public.events
  for each row execute function public.touch_updated_at();