-- Slice 27: optional due date on task templates (applied when assigned).
alter table public.task_templates
  add column if not exists due_date date;
