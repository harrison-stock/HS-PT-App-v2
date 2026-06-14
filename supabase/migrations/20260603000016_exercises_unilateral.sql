-- Slice 16: unilateral injuries + exercise master list (library)

-- ── Unilateral injuries ──────────────────────────────────────────────────────
alter table public.client_injuries
  add column if not exists laterality text not null default 'both'
    check (laterality in ('left', 'right', 'both'));

-- ── exercises: the coach's reusable exercise library ─────────────────────────
create table if not exists public.exercises (
  id               uuid primary key default gen_random_uuid(),
  trainer_id       uuid not null references public.profiles(id) on delete cascade,
  name             text not null default '',
  modality         text not null default 'Strength',
  muscle_group     text not null default '',
  movement_pattern text not null default '',
  category         text not null default 'Strength',
  tracking_fields  text[] not null default array['Weight','Reps'],
  instructions     text not null default '',
  link_url         text not null default '',
  video_url        text not null default '',
  thumbnail_url    text not null default '',
  photos           text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.exercises enable row level security;

drop policy if exists "exercises: trainer all" on public.exercises;
create policy "exercises: trainer all" on public.exercises for all
  using  (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

-- Clients can read their own trainer's library (for richer workout media later)
drop policy if exists "exercises: client read" on public.exercises;
create policy "exercises: client read" on public.exercises for select
  using (trainer_id = (select trainer_id from public.profiles where id = auth.uid()));

-- ── Storage: exercise media (public read, trainer writes own folder) ─────────
insert into storage.buckets (id, name, public)
values ('exercise-media', 'exercise-media', true)
on conflict (id) do nothing;

drop policy if exists "exercise media: public read" on storage.objects;
create policy "exercise media: public read" on storage.objects for select
  using (bucket_id = 'exercise-media');

drop policy if exists "exercise media: trainer manage own" on storage.objects;
create policy "exercise media: trainer manage own" on storage.objects for all
  using (
    bucket_id = 'exercise-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'exercise-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
