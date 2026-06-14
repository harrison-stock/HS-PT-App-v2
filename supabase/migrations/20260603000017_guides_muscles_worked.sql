-- Slice 17: exercise muscles-worked, guides library

-- Multi-select detailed muscles (map-keyed) in addition to the 6-group primary
alter table public.exercises
  add column if not exists muscles_worked text[] not null default '{}';

-- ── guides: the coach's guide / article / video library ──────────────────────
create table if not exists public.guides (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references public.profiles(id) on delete cascade,
  title       text not null default '',
  kind        text not null default 'ARTICLE' check (kind in ('ARTICLE','VIDEO','GUIDE')),
  category    text not null default 'TECHNIQUE',
  minutes     int  not null default 0,
  img_url     text not null default '',
  video_url   text not null default '',
  link_url    text not null default '',
  body        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.guides enable row level security;

drop policy if exists "guides: trainer all" on public.guides;
create policy "guides: trainer all" on public.guides for all
  using  (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

drop policy if exists "guides: client read" on public.guides;
create policy "guides: client read" on public.guides for select
  using (trainer_id = (select trainer_id from public.profiles where id = auth.uid()));
