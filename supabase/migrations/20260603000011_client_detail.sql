-- Slice 7: client detail — credits, goals, injuries, tasks, subscription

-- ── profiles: new columns ────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists email            text,
  add column if not exists credits          int  not null default 0,
  add column if not exists client_status    text not null default 'online'
    check (client_status in ('online', 'in_person', 'hybrid')),
  add column if not exists subscription_due date,
  add column if not exists timezone         text not null default 'Europe/London',
  add column if not exists archived         boolean not null default false;

-- Backfill email from auth.users for existing rows
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- ── managed_clients: new columns ────────────────────────────────────────────
alter table public.managed_clients
  add column if not exists credits       int  not null default 0,
  add column if not exists client_status text not null default 'online'
    check (client_status in ('online', 'in_person', 'hybrid'));

-- ── Trainer can update their clients' profile rows ───────────────────────────
drop policy if exists "profiles: trainer update clients" on public.profiles;
create policy "profiles: trainer update clients" on public.profiles for update
  using  (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

-- ── Refresh handle_new_user to store email ───────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, trainer_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    nullif(new.raw_user_meta_data->>'trainer_id', '')::uuid
  );
  return new;
end;
$$;

-- ── client_goals ─────────────────────────────────────────────────────────────
create table if not exists public.client_goals (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null,
  trainer_id  uuid not null references public.profiles(id) on delete cascade,
  title       text not null default '',
  description text not null default '',
  target_date date,
  status      text not null default 'active'
    check (status in ('active', 'achieved', 'paused')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.client_goals enable row level security;
create policy "client_goals: trainer all" on public.client_goals for all
  using  (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());
create policy "client_goals: client read" on public.client_goals for select
  using (client_id = auth.uid());

-- ── client_injuries ──────────────────────────────────────────────────────────
create table if not exists public.client_injuries (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null,
  trainer_id   uuid not null references public.profiles(id) on delete cascade,
  muscle_group text not null,
  body_side    text not null default 'front' check (body_side in ('front', 'back')),
  note         text not null default '',
  severity     text not null default 'moderate'
    check (severity in ('mild', 'moderate', 'severe')),
  created_at   timestamptz not null default now()
);
alter table public.client_injuries enable row level security;
create policy "client_injuries: trainer all" on public.client_injuries for all
  using  (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());
create policy "client_injuries: client read" on public.client_injuries for select
  using (client_id = auth.uid());

-- ── client_tasks ─────────────────────────────────────────────────────────────
create table if not exists public.client_tasks (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null,
  trainer_id   uuid not null references public.profiles(id) on delete cascade,
  title        text not null default '',
  kind         text not null default 'check'
    check (kind in ('check', 'log', 'photo')),
  due_date     date,
  completed_at timestamptz,
  created_at   timestamptz not null default now()
);
alter table public.client_tasks enable row level security;
create policy "client_tasks: trainer all" on public.client_tasks for all
  using  (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());
create policy "client_tasks: client read" on public.client_tasks for select
  using (client_id = auth.uid());
create policy "client_tasks: client complete" on public.client_tasks for update
  using  (client_id = auth.uid())
  with check (client_id = auth.uid());

-- ── body_metrics ─────────────────────────────────────────────────────────────
create table if not exists public.body_metrics (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null,
  trainer_id   uuid references public.profiles(id) on delete set null,
  recorded_at  date not null default current_date,
  weight_kg    numeric(5,2),
  body_fat_pct numeric(4,1),
  notes        text,
  created_at   timestamptz not null default now()
);
alter table public.body_metrics enable row level security;
create policy "body_metrics: trainer all" on public.body_metrics for all
  using  (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());
create policy "body_metrics: client own" on public.body_metrics for all
  using  (client_id = auth.uid())
  with check (client_id = auth.uid());
