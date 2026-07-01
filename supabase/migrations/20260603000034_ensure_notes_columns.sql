-- Fix: "Database error saving new user" on invited-client sign-up.
-- handle_new_user() merges a managed client's coach_notes / medical_notes into
-- the new profile, but those columns were missing on managed_clients in some
-- environments (migration 23 not applied), so the trigger threw and the whole
-- auth insert rolled back. Re-add them idempotently on BOTH tables so the
-- trigger always has the columns it references.
alter table public.profiles
  add column if not exists coach_notes   text not null default '',
  add column if not exists medical_notes text not null default '';

alter table public.managed_clients
  add column if not exists coach_notes   text not null default '',
  add column if not exists medical_notes text not null default '';
