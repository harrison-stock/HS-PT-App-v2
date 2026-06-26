-- Slice 32: single-coach app — any client who signs up WITHOUT an invite still
-- attaches to the default coach, so no sign-up is ever orphaned off the hub.
-- (If you ever add multiple coaches, revisit this default.)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mc    uuid;
  v_tid   uuid;
  v_role  text;
  v_coach uuid;
  m       record;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'client');
  v_tid  := nullif(new.raw_user_meta_data->>'trainer_id', '')::uuid;

  -- No invite → still route the client to the default coach.
  if v_tid is null and v_role = 'client' then
    select id into v_coach from public.profiles
      where role = 'trainer' and lower(email) = lower('harrison@harrisonstock.co.uk') limit 1;
    if v_coach is null then
      select id into v_coach from public.profiles where role = 'trainer' order by created_at limit 1;
    end if;
    v_tid := v_coach;
  end if;

  insert into public.profiles (id, name, email, role, trainer_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    v_role,
    v_tid
  );

  -- Invited managed client → link + merge their pre-signup data.
  v_mc := nullif(new.raw_user_meta_data->>'managed_client_id', '')::uuid;
  if v_mc is not null then
    select * into m from public.managed_clients where id = v_mc;
    if found then
      update public.managed_clients set linked_profile_id = new.id where id = v_mc;
      update public.profiles p set
        credits       = m.credits,
        client_status = m.client_status,
        coach_notes   = case when coalesce(m.coach_notes, '')   <> '' then m.coach_notes   else p.coach_notes   end,
        medical_notes = case when coalesce(m.medical_notes, '') <> '' then m.medical_notes else p.medical_notes end,
        trainer_id    = coalesce(p.trainer_id, m.trainer_id)
      where p.id = new.id;
      update public.client_tasks     set client_id = new.id where client_id = v_mc;
      update public.client_goals     set client_id = new.id where client_id = v_mc;
      update public.client_injuries  set client_id = new.id where client_id = v_mc;
      update public.body_metrics     set client_id = new.id where client_id = v_mc;
      update public.client_workouts  set client_id = new.id where client_id = v_mc;
      update public.workout_sessions set client_id = new.id where client_id = v_mc;
      update public.progress_photos  set client_id = new.id where client_id = v_mc;
    end if;
  end if;

  return new;
end;
$$;

-- Backfill: attach any existing orphaned client profiles to the default coach.
do $$
declare v_coach uuid;
begin
  select id into v_coach from public.profiles where role = 'trainer' and lower(email) = lower('harrison@harrisonstock.co.uk') limit 1;
  if v_coach is null then
    select id into v_coach from public.profiles where role = 'trainer' order by created_at limit 1;
  end if;
  if v_coach is not null then
    update public.profiles
       set trainer_id = v_coach
     where role = 'client' and trainer_id is null and id <> v_coach;
  end if;
end $$;
