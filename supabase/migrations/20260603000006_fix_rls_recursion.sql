-- Fix infinite recursion in RLS policies
--
-- Two cycles existed:
--   1. programmes: client policy  → query programme_phases
--      programme_phases: trainer policy → query programmes          → loop
--   2. programme_phases: client policy → query programme_days
--      programme_days: trainer policy  → query programme_phases    → loop
--
-- Fix: SECURITY DEFINER functions bypass RLS on the tables they query,
-- so the ownership checks no longer re-enter the policy evaluator.

-- ── Helper: check programme ownership without triggering programmes RLS ──
create or replace function public.is_my_programme(prog_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.programmes
    where id = prog_id and trainer_id = auth.uid()
  );
$$;

-- ── Helper: check client day-assignment without triggering phase/day RLS ──
create or replace function public.client_has_day_assignment(p_phase_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.programme_days pd
    join   public.client_workouts cw on cw.day_id = pd.id
    where  pd.phase_id = p_phase_id and cw.client_id = auth.uid()
  );
$$;

-- ── Rebuild trainer policies to use is_my_programme ──────────────────────
-- Drops first so the migration is re-runnable.

drop policy if exists "programme_phases: trainer all"  on public.programme_phases;
drop policy if exists "programme_days: trainer all"    on public.programme_days;
drop policy if exists "workout_sections: trainer all"  on public.workout_sections;
drop policy if exists "section_exercises: trainer all" on public.section_exercises;
drop policy if exists "exercise_sets: trainer all"     on public.exercise_sets;

create policy "programme_phases: trainer all"
  on public.programme_phases for all
  using  (is_my_programme(programme_id))
  with check (is_my_programme(programme_id));

create policy "programme_days: trainer all"
  on public.programme_days for all
  using (exists (
    select 1 from public.programme_phases ph
    where ph.id = phase_id and is_my_programme(ph.programme_id)
  ))
  with check (exists (
    select 1 from public.programme_phases ph
    where ph.id = phase_id and is_my_programme(ph.programme_id)
  ));

create policy "workout_sections: trainer all"
  on public.workout_sections for all
  using (exists (
    select 1 from public.programme_days d
    join   public.programme_phases ph on ph.id = d.phase_id
    where  d.id = day_id and is_my_programme(ph.programme_id)
  ))
  with check (exists (
    select 1 from public.programme_days d
    join   public.programme_phases ph on ph.id = d.phase_id
    where  d.id = day_id and is_my_programme(ph.programme_id)
  ));

create policy "section_exercises: trainer all"
  on public.section_exercises for all
  using (exists (
    select 1 from public.workout_sections s
    join   public.programme_days d on d.id = s.day_id
    join   public.programme_phases ph on ph.id = d.phase_id
    where  s.id = section_id and is_my_programme(ph.programme_id)
  ))
  with check (exists (
    select 1 from public.workout_sections s
    join   public.programme_days d on d.id = s.day_id
    join   public.programme_phases ph on ph.id = d.phase_id
    where  s.id = section_id and is_my_programme(ph.programme_id)
  ));

create policy "exercise_sets: trainer all"
  on public.exercise_sets for all
  using (exists (
    select 1 from public.section_exercises ex
    join   public.workout_sections s on s.id = ex.section_id
    join   public.programme_days d on d.id = s.day_id
    join   public.programme_phases ph on ph.id = d.phase_id
    where  ex.id = exercise_id and is_my_programme(ph.programme_id)
  ))
  with check (exists (
    select 1 from public.section_exercises ex
    join   public.workout_sections s on s.id = ex.section_id
    join   public.programme_days d on d.id = s.day_id
    join   public.programme_phases ph on ph.id = d.phase_id
    where  ex.id = exercise_id and is_my_programme(ph.programme_id)
  ));

-- ── Rebuild programme_phases client policy to use client_has_day_assignment ─
-- Breaks the second cycle: phase client policy → programme_days → phase trainer
-- policy → phase client policy.

drop policy if exists "programme_phases: client read via assignment" on public.programme_phases;

create policy "programme_phases: client read via assignment"
  on public.programme_phases for select
  using (client_has_day_assignment(id));
