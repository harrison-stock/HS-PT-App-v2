-- Slice 30: unilateral (one-side-at-a-time) exercises. A flag the coach sets in
-- the library; surfaced to the client as an "EACH SIDE" badge and per-side reps.
alter table public.exercises         add column if not exists unilateral boolean not null default false;
alter table public.section_exercises add column if not exists unilateral boolean not null default false;
