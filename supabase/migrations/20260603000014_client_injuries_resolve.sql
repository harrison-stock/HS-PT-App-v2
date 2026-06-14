-- Slice 13: client-reported injuries + resolve / past-injury history

-- Active injuries have resolved_at = null; resolved ones are kept for history.
alter table public.client_injuries
  add column if not exists resolved_at timestamptz;

-- Clients can self-report without a trainer linked yet.
alter table public.client_injuries
  alter column trainer_id drop not null;

-- Clients manage their own injuries (report / resolve / view).
drop policy if exists "client_injuries: client manage" on public.client_injuries;
create policy "client_injuries: client manage" on public.client_injuries for all
  using  (client_id = auth.uid())
  with check (client_id = auth.uid());

-- Trainers see all of their clients' injuries even when the client logged it
-- themselves (trainer_id may be null on self-reported rows).
drop policy if exists "client_injuries: trainer all" on public.client_injuries;
create policy "client_injuries: trainer all" on public.client_injuries for all
  using (
    trainer_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = client_id and p.trainer_id = auth.uid())
  )
  with check (
    trainer_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = client_id and p.trainer_id = auth.uid())
  );
