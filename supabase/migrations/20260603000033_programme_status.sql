-- Slice 34: programme lifecycle — active (live, editable), completed, archived.
alter table public.programmes
  add column if not exists status text not null default 'active'
    check (status in ('active', 'completed', 'archived'));
