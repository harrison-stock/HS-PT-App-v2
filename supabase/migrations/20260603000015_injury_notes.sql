-- Slice 14: injury note threads (multiple notes per injury, by coach or client)

create table if not exists public.client_injury_notes (
  id         uuid primary key default gen_random_uuid(),
  injury_id  uuid not null references public.client_injuries(id) on delete cascade,
  author_id  uuid references public.profiles(id) on delete set null,
  body       text not null default '',
  created_at timestamptz not null default now()
);
alter table public.client_injury_notes enable row level security;

-- Access follows the parent injury: the client it belongs to, or that
-- client's trainer (whether or not trainer_id is set on the injury row).
drop policy if exists "client_injury_notes: access" on public.client_injury_notes;
create policy "client_injury_notes: access" on public.client_injury_notes for all
  using (exists (
    select 1 from public.client_injuries ci
    where ci.id = injury_id and (
      ci.client_id = auth.uid()
      or ci.trainer_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = ci.client_id and p.trainer_id = auth.uid())
    )
  ))
  with check (exists (
    select 1 from public.client_injuries ci
    where ci.id = injury_id and (
      ci.client_id = auth.uid()
      or ci.trainer_id = auth.uid()
      or exists (select 1 from public.profiles p where p.id = ci.client_id and p.trainer_id = auth.uid())
    )
  ));
