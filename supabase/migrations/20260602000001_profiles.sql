-- ─────────────────────────────────────────────────────────────────────────────
-- Slice 1: profiles table, RLS, and auth trigger
--
-- HOW TO RUN:
--   Supabase dashboard → SQL Editor → New query → paste this entire file → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  role           text not null default 'client' check (role in ('trainer', 'client')),
  name           text not null default '',
  date_of_birth  date,
  trainer_id     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz default now()
);

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Each user can read and update their own profile
create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: own update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Trainer can read all profiles where trainer_id points to them
create policy "profiles: trainer reads clients"
  on public.profiles for select
  using (trainer_id = auth.uid());

-- ── Helper function ───────────────────────────────────────────────────────────
-- Used in RLS policies on other tables: client policies check my_trainer_id()
-- to confirm the querying trainer owns this client's data.
create or replace function public.my_trainer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select trainer_id from public.profiles where id = auth.uid()
$$;

-- ── Auto-create profile on sign-up ───────────────────────────────────────────
-- Reads optional metadata passed at sign-up time:
--   { name, role, trainer_id }
-- Clients invited via the app will have role + trainer_id injected by the
-- invite Edge Function (Slice 9). Sign-ups through the login screen default
-- to role = 'client'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role, trainer_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    nullif(new.raw_user_meta_data->>'trainer_id', '')::uuid
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- AFTER RUNNING THIS MIGRATION:
--
-- 1. Sign up via the app using harrison@harrisonstock.co.uk
-- 2. Then run this one-off query in the SQL Editor to set your trainer role:
--
--    update public.profiles
--    set role = 'trainer', name = 'Harrison Stock'
--    where id = (select id from auth.users where email = 'harrison@harrisonstock.co.uk');
--
-- ─────────────────────────────────────────────────────────────────────────────
