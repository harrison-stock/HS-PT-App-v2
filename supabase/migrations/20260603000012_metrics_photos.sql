-- Slice 10: body measurements + progress photos

-- ── body_metrics: extra measurement columns ─────────────────────────────────
alter table public.body_metrics
  add column if not exists waist_cm numeric(5,1),
  add column if not exists neck_cm  numeric(5,1),
  add column if not exists chest_cm numeric(5,1);

-- Trainers must also see metrics their clients logged themselves
-- (those rows have trainer_id null, so the old policy missed them)
drop policy if exists "body_metrics: trainer all" on public.body_metrics;
create policy "body_metrics: trainer all" on public.body_metrics for all
  using (
    trainer_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = client_id and p.trainer_id = auth.uid())
  )
  with check (
    trainer_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = client_id and p.trainer_id = auth.uid())
  );

-- ── progress_photos ──────────────────────────────────────────────────────────
create table if not exists public.progress_photos (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null,
  taken_on   date not null default current_date,
  pose       text not null default 'front' check (pose in ('front', 'side', 'back')),
  path       text not null,
  created_at timestamptz not null default now()
);
alter table public.progress_photos enable row level security;

drop policy if exists "progress_photos: client own" on public.progress_photos;
create policy "progress_photos: client own" on public.progress_photos for all
  using  (client_id = auth.uid())
  with check (client_id = auth.uid());

drop policy if exists "progress_photos: trainer read" on public.progress_photos;
create policy "progress_photos: trainer read" on public.progress_photos for select
  using (exists (
    select 1 from public.profiles p
    where p.id = client_id and p.trainer_id = auth.uid()
  ));

-- ── Storage bucket (private) ─────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

-- Clients manage files under their own folder: progress-photos/<uid>/...
drop policy if exists "progress photos: client manage own" on storage.objects;
create policy "progress photos: client manage own" on storage.objects for all
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Trainers can view their clients' photos
drop policy if exists "progress photos: trainer read clients" on storage.objects;
create policy "progress photos: trainer read clients" on storage.objects for select
  using (
    bucket_id = 'progress-photos'
    and exists (
      select 1 from public.profiles p
      where p.id::text = (storage.foldername(name))[1]
        and p.trainer_id = auth.uid()
    )
  );
