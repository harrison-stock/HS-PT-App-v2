-- Managed clients: trainer can add clients immediately without waiting for invite acceptance.
-- Drops FK constraints from client_id columns so managed_client UUIDs are valid there too.

-- ── managed_clients table ─────────────────────────────────────────────────────
create table if not exists public.managed_clients (
  id                 uuid primary key default gen_random_uuid(),
  trainer_id         uuid not null references public.profiles(id) on delete cascade,
  name               text not null default '',
  email              text not null default '',
  linked_profile_id  uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now()
);

alter table public.managed_clients enable row level security;

create policy "managed_clients: trainer all" on public.managed_clients for all
  using  (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

-- ── Link invites → managed_clients ───────────────────────────────────────────
alter table public.invites
  add column if not exists managed_client_id uuid references public.managed_clients(id) on delete set null;

-- ── Drop FK on client_id columns so managed_client UUIDs are accepted ─────────
alter table public.client_workouts  drop constraint if exists client_workouts_client_id_fkey;
alter table public.workout_sessions drop constraint if exists workout_sessions_client_id_fkey;

-- ── Update workout_sessions trainer policies to cover managed clients ──────────
drop policy if exists "workout_sessions: trainer read"   on public.workout_sessions;
drop policy if exists "workout_sessions: trainer insert" on public.workout_sessions;

create policy "workout_sessions: trainer read" on public.workout_sessions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = client_id and p.trainer_id = auth.uid()
    )
    or
    exists (
      select 1 from public.managed_clients mc
      where mc.id = client_id and mc.trainer_id = auth.uid()
    )
  );

create policy "workout_sessions: trainer insert" on public.workout_sessions for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = client_id and p.trainer_id = auth.uid()
    )
    or
    exists (
      select 1 from public.managed_clients mc
      where mc.id = client_id and mc.trainer_id = auth.uid()
    )
  );

-- ── Update logged_sets trainer insert to cover managed clients ────────────────
drop policy if exists "logged_sets: trainer insert" on public.logged_sets;

create policy "logged_sets: trainer insert" on public.logged_sets for insert
  with check (
    exists (
      select 1 from public.workout_sessions ws
      join   public.profiles p on p.id = ws.client_id
      where  ws.id = session_id and p.trainer_id = auth.uid()
    )
    or
    exists (
      select 1 from public.workout_sessions ws
      join   public.managed_clients mc on mc.id = ws.client_id
      where  ws.id = session_id and mc.trainer_id = auth.uid()
    )
  );
