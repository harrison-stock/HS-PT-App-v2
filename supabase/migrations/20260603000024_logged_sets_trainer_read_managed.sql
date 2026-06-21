-- Slice 25: let trainers READ logged sets for their managed clients too.
-- Migration 010 extended workout_sessions read + logged_sets insert to managed
-- clients, but the logged_sets READ policy still only covered real profiles —
-- which left the Performance Report empty for managed (no-login) clients.

drop policy if exists "logged_sets: trainer read" on public.logged_sets;

create policy "logged_sets: trainer read" on public.logged_sets for select
  using (
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
