-- ─────────────────────────────────────────────────────────────────────────────
-- Slice 2: programme builder persistence
--
-- HOW TO RUN:
--   Supabase dashboard → SQL Editor → New query → paste → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── programmes ───────────────────────────────────────────────────────────────
create table if not exists public.programmes (
  id          uuid primary key default gen_random_uuid(),
  trainer_id  uuid not null references public.profiles(id) on delete cascade,
  name        text not null default 'New Programme',
  tag         text not null default 'STRENGTH'
              check (tag in ('STRENGTH','ONBOARD','REHAB','ENDURANCE','HYBRID','SPORT','CARDIO')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── programme_phases ─────────────────────────────────────────────────────────
create table if not exists public.programme_phases (
  id           uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  phase_index  int  not null default 0,
  name         text not null default 'Phase 1',
  focus        text not null default 'Foundation',
  weeks        int  not null default 4,
  created_at   timestamptz default now()
);

-- ── programme_days ───────────────────────────────────────────────────────────
-- One row per (phase, week, day_of_week). Absence = rest day.
create table if not exists public.programme_days (
  id           uuid primary key default gen_random_uuid(),
  phase_id     uuid not null references public.programme_phases(id) on delete cascade,
  week_index   int  not null default 0,  -- 0-based
  day_of_week  int  not null default 0,  -- 0=Mon … 6=Sun
  created_at   timestamptz default now(),
  unique (phase_id, week_index, day_of_week)
);

-- ── workout_sections ─────────────────────────────────────────────────────────
create table if not exists public.workout_sections (
  id         uuid primary key default gen_random_uuid(),
  day_id     uuid not null references public.programme_days(id) on delete cascade,
  kind       text not null default 'MAIN'
             check (kind in ('PULSE_RAISER','BANDED','MAIN','COOLDOWN')),
  title      text not null default 'Workout',
  sort_order int  not null default 0,
  created_at timestamptz default now()
);

-- ── section_exercises ────────────────────────────────────────────────────────
create table if not exists public.section_exercises (
  id         uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.workout_sections(id) on delete cascade,
  name       text not null default 'New Exercise',
  img_url    text,
  timed      boolean not null default false,
  sort_order int  not null default 0,
  created_at timestamptz default now()
);

-- ── exercise_sets ────────────────────────────────────────────────────────────
create table if not exists public.exercise_sets (
  id          uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.section_exercises(id) on delete cascade,
  set_index   int  not null default 0,
  kind        text not null default 'WORK' check (kind in ('WARMUP','WORK','DROP')),
  reps        int  default 8,
  weight_kg   numeric(6,2) default 0,
  rest_secs   int  default 60,
  time_secs   int  default 60,
  intensity   int  default 6 check (intensity between 1 and 10),
  created_at  timestamptz default now()
);

-- ── Auto-update updated_at on programmes ─────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace trigger programmes_updated_at
  before update on public.programmes
  for each row execute function public.set_updated_at();

-- ── Row-Level Security ────────────────────────────────────────────────────────
alter table public.programmes       enable row level security;
alter table public.programme_phases enable row level security;
alter table public.programme_days   enable row level security;
alter table public.workout_sections enable row level security;
alter table public.section_exercises enable row level security;
alter table public.exercise_sets    enable row level security;

-- programmes: trainer owns their own rows
create policy "programmes: trainer all"
  on public.programmes for all
  using  (trainer_id = auth.uid())
  with check (trainer_id = auth.uid());

-- programme_phases: access via parent programme
create policy "programme_phases: trainer all"
  on public.programme_phases for all
  using (exists (
    select 1 from public.programmes
    where id = programme_id and trainer_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.programmes
    where id = programme_id and trainer_id = auth.uid()
  ));

-- programme_days: access via phase → programme
create policy "programme_days: trainer all"
  on public.programme_days for all
  using (exists (
    select 1 from public.programme_phases ph
    join   public.programmes p on p.id = ph.programme_id
    where  ph.id = phase_id and p.trainer_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.programme_phases ph
    join   public.programmes p on p.id = ph.programme_id
    where  ph.id = phase_id and p.trainer_id = auth.uid()
  ));

-- workout_sections: access via day → phase → programme
create policy "workout_sections: trainer all"
  on public.workout_sections for all
  using (exists (
    select 1 from public.programme_days d
    join   public.programme_phases ph on ph.id = d.phase_id
    join   public.programmes p on p.id = ph.programme_id
    where  d.id = day_id and p.trainer_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.programme_days d
    join   public.programme_phases ph on ph.id = d.phase_id
    join   public.programmes p on p.id = ph.programme_id
    where  d.id = day_id and p.trainer_id = auth.uid()
  ));

-- section_exercises: access via section → day → phase → programme
create policy "section_exercises: trainer all"
  on public.section_exercises for all
  using (exists (
    select 1 from public.workout_sections s
    join   public.programme_days d on d.id = s.day_id
    join   public.programme_phases ph on ph.id = d.phase_id
    join   public.programmes p on p.id = ph.programme_id
    where  s.id = section_id and p.trainer_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workout_sections s
    join   public.programme_days d on d.id = s.day_id
    join   public.programme_phases ph on ph.id = d.phase_id
    join   public.programmes p on p.id = ph.programme_id
    where  s.id = section_id and p.trainer_id = auth.uid()
  ));

-- exercise_sets: access via exercise → section → ... → programme
create policy "exercise_sets: trainer all"
  on public.exercise_sets for all
  using (exists (
    select 1 from public.section_exercises ex
    join   public.workout_sections s on s.id = ex.section_id
    join   public.programme_days d on d.id = s.day_id
    join   public.programme_phases ph on ph.id = d.phase_id
    join   public.programmes p on p.id = ph.programme_id
    where  ex.id = exercise_id and p.trainer_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.section_exercises ex
    join   public.workout_sections s on s.id = ex.section_id
    join   public.programme_days d on d.id = s.day_id
    join   public.programme_phases ph on ph.id = d.phase_id
    join   public.programmes p on p.id = ph.programme_id
    where  ex.id = exercise_id and p.trainer_id = auth.uid()
  ));
