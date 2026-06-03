-- Slice 3: trainer assigns programme days to clients; clients read their schedule

-- ── client_workouts ──────────────────────────────────────────────────────────
create table if not exists public.client_workouts (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.profiles(id) on delete cascade,
  trainer_id     uuid not null references public.profiles(id),
  day_id         uuid not null references public.programme_days(id) on delete cascade,
  scheduled_date date not null,
  status         text not null default 'scheduled'
                 check (status in ('scheduled','completed','skipped')),
  created_at     timestamptz not null default now()
);

alter table public.client_workouts enable row level security;

-- Trainer manages all workouts they've assigned
create policy "client_workouts: trainer all"
  on public.client_workouts for all
  using  (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

-- Client reads their own assigned workouts
create policy "client_workouts: client read"
  on public.client_workouts for select
  using (client_id = auth.uid());

-- Client can update status on their own workouts
create policy "client_workouts: client update"
  on public.client_workouts for update
  using  (client_id = auth.uid())
  with check (client_id = auth.uid());

-- ── Read-through policies for clients accessing workout content ──────────────

-- programme_days: client can read if they have an assignment pointing to it
create policy "programme_days: client read via assignment"
  on public.programme_days for select
  using (
    exists (
      select 1 from public.client_workouts cw
      where cw.day_id = id and cw.client_id = auth.uid()
    )
  );

-- workout_sections: client can read if parent day is assigned to them
create policy "workout_sections: client read via assignment"
  on public.workout_sections for select
  using (
    exists (
      select 1 from public.client_workouts cw
      where cw.day_id = day_id and cw.client_id = auth.uid()
    )
  );

-- section_exercises: client read via assignment chain
create policy "section_exercises: client read via assignment"
  on public.section_exercises for select
  using (
    exists (
      select 1 from public.workout_sections s
      join public.client_workouts cw on cw.day_id = s.day_id
      where s.id = section_id and cw.client_id = auth.uid()
    )
  );

-- exercise_sets: client read via assignment chain
create policy "exercise_sets: client read via assignment"
  on public.exercise_sets for select
  using (
    exists (
      select 1 from public.section_exercises ex
      join public.workout_sections s on s.id = ex.section_id
      join public.client_workouts cw on cw.day_id = s.day_id
      where ex.id = exercise_id and cw.client_id = auth.uid()
    )
  );

-- programme_phases: client can read phases that contain their assigned days
create policy "programme_phases: client read via assignment"
  on public.programme_phases for select
  using (
    exists (
      select 1 from public.programme_days pd
      join public.client_workouts cw on cw.day_id = pd.id
      where pd.phase_id = id and cw.client_id = auth.uid()
    )
  );

-- programmes: client can read programmes that have phases with their assigned days
create policy "programmes: client read via assignment"
  on public.programmes for select
  using (
    exists (
      select 1 from public.programme_phases ph
      join public.programme_days pd on pd.phase_id = ph.id
      join public.client_workouts cw on cw.day_id = pd.id
      where ph.programme_id = id and cw.client_id = auth.uid()
    )
  );
