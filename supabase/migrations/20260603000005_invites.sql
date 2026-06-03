-- Slice 3b: trainer creates client invite links; client claims on sign-up

create table if not exists public.invites (
  id           uuid primary key default gen_random_uuid(),
  trainer_id   uuid not null references public.profiles(id) on delete cascade,
  client_name  text not null default '',
  client_email text not null default '',
  code         text not null unique default encode(gen_random_bytes(6), 'hex'),
  claimed_by   uuid references public.profiles(id) on delete set null,
  claimed_at   timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.invites enable row level security;

-- Trainer manages their own invites
create policy "invites: trainer all"
  on public.invites for all
  using  (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

-- Any authenticated user can read invites (needed to validate code on claim)
create policy "invites: authenticated read"
  on public.invites for select
  to authenticated
  using (true);

-- Authenticated user can claim an unclaimed invite by setting themselves as claimed_by
create policy "invites: claim"
  on public.invites for update
  to authenticated
  using  (claimed_by is null)
  with check (claimed_by = auth.uid() and auth.uid() != trainer_id);
