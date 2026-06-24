-- Slice 29: banded movements. An exercise can be flagged "banded" so the app
-- collects a resistance-band colour instead of a weight.
alter table public.exercises         add column if not exists banded boolean not null default false;
alter table public.section_exercises add column if not exists banded boolean not null default false;
alter table public.exercise_sets     add column if not exists band  text;   -- band level key
alter table public.logged_sets       add column if not exists actual_band text;
