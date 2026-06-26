-- Slice 31: wearable / health integration (steps, heart rate, weight).
-- Data arrives from an aggregator (Terra/Vital) via the ingest-health Edge
-- Function (service role), keyed to a client by the reference id we pass.

-- ── Daily health metrics (one row per client/day/source) ─────────────────────
create table if not exists public.health_daily (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.profiles(id) on delete cascade,
  day         date not null,
  source      text not null default 'wearable',   -- garmin | fitbit | withings | oura | whoop | apple | google | manual
  steps       int,
  resting_hr  int,
  avg_hr      int,
  weight_kg   numeric(6,2),
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (client_id, day, source)
);
alter table public.health_daily enable row level security;

-- Client sees/owns their own; trainer reads their clients' (real + managed).
drop policy if exists "health_daily: client all"    on public.health_daily;
create policy "health_daily: client all" on public.health_daily for all
  using (client_id = auth.uid()) with check (client_id = auth.uid());

drop policy if exists "health_daily: trainer read" on public.health_daily;
create policy "health_daily: trainer read" on public.health_daily for select
  using (
    exists (select 1 from public.profiles p where p.id = client_id and p.trainer_id = auth.uid())
    or exists (select 1 from public.managed_clients mc where mc.id = client_id and mc.trainer_id = auth.uid())
  );

-- ── Which providers a client has connected (for the settings UI) ─────────────
create table if not exists public.wearable_connections (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.profiles(id) on delete cascade,
  provider     text not null,                 -- garmin | fitbit | withings | ...
  status       text not null default 'connected',
  ref_user_id  text,                          -- aggregator's user id (for reference)
  last_sync    timestamptz,
  created_at   timestamptz not null default now(),
  unique (client_id, provider)
);
alter table public.wearable_connections enable row level security;

drop policy if exists "wearable_connections: client all" on public.wearable_connections;
create policy "wearable_connections: client all" on public.wearable_connections for all
  using (client_id = auth.uid()) with check (client_id = auth.uid());

drop policy if exists "wearable_connections: trainer read" on public.wearable_connections;
create policy "wearable_connections: trainer read" on public.wearable_connections for select
  using (
    exists (select 1 from public.profiles p where p.id = client_id and p.trainer_id = auth.uid())
    or exists (select 1 from public.managed_clients mc where mc.id = client_id and mc.trainer_id = auth.uid())
  );
