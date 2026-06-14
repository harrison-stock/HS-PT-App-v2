-- Demo client "John Doe" for trialling — a managed client (no login) with
-- made-up metrics, injuries (incl. unilateral), tasks and a goal.
-- Run in the Supabase SQL editor. Safe to re-run (it rebuilds John Doe).

do $$
declare
  v_coach uuid;
  v_mc    uuid;
  v_inj   uuid;
begin
  select id into v_coach from public.profiles where lower(email) = lower('harrison@harrisonstock.co.uk') limit 1;
  if v_coach is null then
    select id into v_coach from public.profiles where role = 'trainer' order by created_at limit 1;
  end if;
  if v_coach is null then raise exception 'No trainer profile found to attach John Doe to'; end if;

  -- Remove any previous John Doe for a clean re-run
  for v_mc in select id from public.managed_clients where trainer_id = v_coach and name = 'John Doe' loop
    delete from public.client_injury_notes where injury_id in (select id from public.client_injuries where client_id = v_mc);
    delete from public.client_injuries where client_id = v_mc;
    delete from public.body_metrics  where client_id = v_mc;
    delete from public.client_tasks  where client_id = v_mc;
    delete from public.client_goals  where client_id = v_mc;
    delete from public.managed_clients where id = v_mc;
  end loop;

  insert into public.managed_clients (trainer_id, name, email, credits, client_status)
  values (v_coach, 'John Doe', 'john.doe@example.com', 8, 'in_person')
  returning id into v_mc;

  -- ── Body metrics: ~10 weekly readings, trending down ──────────────────────
  insert into public.body_metrics (client_id, trainer_id, recorded_at, weight_kg, body_fat_pct, waist_cm, neck_cm, chest_cm) values
    (v_mc, v_coach, current_date - 63, 86.4, 22.1, 92, 40.5, 104),
    (v_mc, v_coach, current_date - 56, 85.8, 21.6, 91, 40.5, 104),
    (v_mc, v_coach, current_date - 49, 85.1, 21.0, 90, 40.0, 105),
    (v_mc, v_coach, current_date - 42, 84.6, 20.4, 89, 40.0, 105),
    (v_mc, v_coach, current_date - 35, 84.0, 19.9, 89, 40.0, 106),
    (v_mc, v_coach, current_date - 28, 83.5, 19.4, 88, 39.5, 106),
    (v_mc, v_coach, current_date - 21, 83.0, 18.9, 87, 39.5, 107),
    (v_mc, v_coach, current_date - 14, 82.4, 18.5, 86, 39.5, 107),
    (v_mc, v_coach, current_date - 7,  81.9, 18.1, 86, 39.0, 108),
    (v_mc, v_coach, current_date,      81.2, 17.9, 85, 39.0, 108);

  -- ── Injuries (incl. unilateral) ───────────────────────────────────────────
  insert into public.client_injuries (client_id, trainer_id, muscle_group, body_side, severity, laterality, note, created_at)
  values (v_mc, v_coach, 'knees', 'front', 'moderate', 'left', 'Aching after squats, mild swelling on the inside of the knee.', now() - interval '9 days')
  returning id into v_inj;
  insert into public.client_injury_notes (injury_id, author_id, body, created_at) values
    (v_inj, v_coach, 'Reduce squat depth this week, ice after sessions.', now() - interval '8 days'),
    (v_inj, v_coach, 'Feeling better — cleared for box squats to parallel.', now() - interval '3 days');

  insert into public.client_injuries (client_id, trainer_id, muscle_group, body_side, severity, laterality, note, created_at)
  values (v_mc, v_coach, 'shoulders', 'front', 'mild', 'right', 'Slight pinch on overhead press, no pain on incline.', now() - interval '5 days');

  insert into public.client_injuries (client_id, trainer_id, muscle_group, body_side, severity, laterality, note, created_at, resolved_at)
  values (v_mc, v_coach, 'lowerBack', 'back', 'severe', 'both', 'Tweaked deadlifting — fully rehabbed now.', now() - interval '40 days', now() - interval '12 days');

  -- ── Tasks ─────────────────────────────────────────────────────────────────
  insert into public.client_tasks (client_id, trainer_id, title, kind, due_date, completed_at) values
    (v_mc, v_coach, 'Log your weigh-in', 'log', current_date, null),
    (v_mc, v_coach, 'Upload progress photos', 'photo', current_date + 2, null),
    (v_mc, v_coach, 'Complete weekly check-in', 'check', current_date - 1, now() - interval '6 hours');

  -- ── Goal ──────────────────────────────────────────────────────────────────
  insert into public.client_goals (client_id, trainer_id, title, description, target_date, status) values
    (v_mc, v_coach, 'Reach 78 kg lean', 'Cut to 78 kg while keeping bench above 100 kg.', current_date + 56, 'active');

  raise notice 'John Doe seeded (managed client %).', v_mc;
end $$;
