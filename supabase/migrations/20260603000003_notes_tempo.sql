-- Slice 3 additions: coach notes per day, tempo per exercise
alter table public.programme_days    add column if not exists notes text not null default '';
alter table public.section_exercises add column if not exists tempo text not null default '';
