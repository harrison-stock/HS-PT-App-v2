import React from 'react'
import { supabase } from '../lib/supabase'
import { HexBackButton, Hex } from '../components/hex'
import { IconUser, IconClipboard, IconCalendar, IconFlame, IconHeart } from '../components/icons'
import { injuryTitle } from '../lib/injuries'

const dayStr = (d) => d.toISOString().slice(0, 10);

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

async function loadClientFeed(userId) {
  const today = dayStr(new Date());
  const in7   = dayStr(new Date(Date.now() + 7 * 86_400_000));
  const ago7  = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const [tasksQ, upcomingQ, sessionsQ] = await Promise.all([
    supabase.from('client_tasks').select('id, title, kind, due_date')
      .eq('client_id', userId).is('completed_at', null),
    supabase.from('client_workouts')
      .select('id, scheduled_date, status, programme_days ( programme_phases ( name, programmes ( name ) ) )')
      .eq('client_id', userId).gte('scheduled_date', today).lte('scheduled_date', in7)
      .eq('status', 'scheduled').order('scheduled_date'),
    supabase.from('workout_sessions').select('id, completed_at')
      .eq('client_id', userId).not('completed_at', 'is', null)
      .gte('completed_at', ago7).order('completed_at', { ascending: false }).limit(5),
  ]);

  const items = [];

  (tasksQ.data || []).forEach(t => {
    const overdue = t.due_date && t.due_date < today;
    items.push({
      id: `task-${t.id}`, kind: 'task', today: !t.due_date || t.due_date <= today,
      title: t.title,
      body: overdue ? 'Overdue — tick it off on your dashboard.'
        : t.due_date ? `Due ${new Date(t.due_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}.`
        : 'Assigned by your coach — tick it off on your dashboard.',
      when: t.due_date ? fmtDate(t.due_date) : 'OPEN',
      target: 'dashboard',
    });
  });

  (upcomingQ.data || []).forEach(w => {
    const ph = w.programme_days?.programme_phases;
    const label = [ph?.programmes?.name, ph?.name].filter(Boolean).join(' · ') || 'Workout';
    items.push({
      id: `wk-${w.id}`, kind: 'schedule', today: w.scheduled_date === today,
      title: w.scheduled_date === today ? 'Session ready today' : 'Upcoming session',
      body: label,
      when: w.scheduled_date === today ? 'TODAY' : fmtDate(w.scheduled_date),
      target: 'workouts',
    });
  });

  (sessionsQ.data || []).forEach(s => {
    items.push({
      id: `sess-${s.id}`, kind: 'done', today: s.completed_at.slice(0, 10) === today,
      title: 'Session completed',
      body: 'Nice work — your progress charts are updated.',
      when: fmtDate(s.completed_at),
      target: 'progress',
    });
  });

  return items;
}

async function loadTrainerFeed(trainerId) {
  const today = dayStr(new Date());
  const ago3  = new Date(Date.now() - 3 * 86_400_000).toISOString();

  const ago7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [profilesQ, managedQ, todayQ, sessQ, tasksQ, injQ] = await Promise.all([
    supabase.from('profiles').select('id, name').eq('trainer_id', trainerId).eq('role', 'client'),
    supabase.from('managed_clients').select('id, name').eq('trainer_id', trainerId),
    supabase.from('client_workouts')
      .select('id, client_id, status, programme_days ( programme_phases ( name, programmes ( name ) ) )')
      .eq('trainer_id', trainerId).eq('scheduled_date', today).neq('status', 'skipped'),
    supabase.from('workout_sessions').select('id, client_id, completed_at')
      .not('completed_at', 'is', null).gte('completed_at', ago3)
      .order('completed_at', { ascending: false }).limit(10),
    supabase.from('client_tasks').select('id, client_id, title, completed_at')
      .not('completed_at', 'is', null).gte('completed_at', ago7)
      .order('completed_at', { ascending: false }).limit(10),
    supabase.from('client_injuries').select('id, client_id, muscle_group, laterality, severity, created_at')
      .gte('created_at', ago7).order('created_at', { ascending: false }).limit(10),
  ]);

  const names = {};
  (profilesQ.data || []).forEach(p => { names[p.id] = p.name; });
  (managedQ.data || []).forEach(m => { names[m.id] = m.name; });

  const items = [];

  (todayQ.data || []).forEach(w => {
    const ph = w.programme_days?.programme_phases;
    const label = [ph?.programmes?.name, ph?.name].filter(Boolean).join(' · ') || 'Assigned workout';
    items.push({
      id: `wk-${w.id}`, kind: 'schedule', today: true,
      title: `${names[w.client_id] || 'Client'} — ${w.status === 'completed' ? 'completed' : 'scheduled'} today`,
      body: label,
      when: 'TODAY',
      target: 'coach',
    });
  });

  (sessQ.data || []).forEach(s => {
    if (!names[s.client_id]) return;
    items.push({
      id: `sess-${s.id}`, kind: 'done', today: s.completed_at.slice(0, 10) === today,
      title: `${names[s.client_id]} completed a workout`,
      body: 'Open their file to review the logged sets.',
      when: fmtDate(s.completed_at),
      target: 'coach',
    });
  });

  (tasksQ.data || []).forEach(t => {
    if (!names[t.client_id]) return;
    items.push({
      id: `task-${t.id}`, kind: 'task', today: t.completed_at.slice(0, 10) === today,
      title: `${names[t.client_id]} completed a task`,
      body: t.title,
      when: fmtDate(t.completed_at),
      target: 'coach',
    });
  });

  (injQ.data || []).forEach(inj => {
    if (!names[inj.client_id]) return;
    items.push({
      id: `inj-${inj.id}`, kind: 'injury', today: inj.created_at.slice(0, 10) === today,
      title: `${names[inj.client_id]} reported an injury`,
      body: `${injuryTitle(inj)} · ${inj.severity}`,
      when: fmtDate(inj.created_at),
      target: 'coach',
    });
  });

  return items;
}

// Notifications — live activity feed derived from tasks, schedule and sessions.
export function Notifications({ go, userId, isTrainer }) {
  const [items, setItems] = React.useState(null);

  React.useEffect(() => {
    if (!userId) { setItems([]); return; }
    (isTrainer ? loadTrainerFeed(userId) : loadClientFeed(userId)).then(setItems);
  }, [userId, isTrainer]);

  const today   = (items || []).filter((n) => n.today);
  const earlier = (items || []).filter((n) => !n.today);

  return (
    <div className="scroller" style={{ padding: '0 16px 110px', paddingTop: 64 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HexBackButton onClick={() => go('dashboard')} size={36} />
          <div>
            <div className="label" style={{ marginBottom: 4 }}>// ACTIVITY</div>
            <div className="h-bold" style={{ fontSize: 20, lineHeight: 1, color: 'var(--heading-deep)' }}>
              NOTIFICATIONS
            </div>
          </div>
        </div>
      </div>

      {items === null && (
        <div className="card" style={{ padding: 28, textAlign: 'center', color: 'var(--text-3)', fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: '0.12em' }}>
          LOADING…
        </div>
      )}

      {items !== null && items.length === 0 && (
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em', lineHeight: 1.7 }}>
            ALL CAUGHT UP<br/>
            <span style={{ fontSize: 9 }}>Tasks, scheduled sessions and recent activity show here</span>
          </div>
        </div>
      )}

      {today.length > 0 && <>
        <div className="label" style={{ margin: '4px 4px 8px' }}>// TODAY</div>
        <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
          {today.map((n) => <NotifRow key={n.id} n={n} onTap={() => go(n.target)} />)}
        </div>
      </>}

      {earlier.length > 0 && <>
        <div className="label" style={{ margin: '4px 4px 8px' }}>// COMING UP & RECENT</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {earlier.map((n) => <NotifRow key={n.id} n={n} onTap={() => go(n.target)} />)}
        </div>
      </>}
    </div>);
}

function NotifRow({ n, onTap }) {
  const meta = NOTIF_META[n.kind] || NOTIF_META.task;
  const Icon = meta.icon;
  return (
    <button onClick={onTap} style={{ all: 'unset', cursor: 'pointer', display: 'block' }}>
      <div className="card" style={{
        padding: 12, display: 'grid', gridTemplateColumns: '38px 1fr', gap: 12, alignItems: 'flex-start',
        borderColor: n.today ? `color-mix(in srgb, ${meta.color} 40%, var(--line))` : 'var(--line)',
        background: n.today ? `color-mix(in srgb, ${meta.color} 7%, var(--bg-2))` : 'var(--bg-2)'
      }}>
        <Hex size={40} square style={{
          background: `color-mix(in srgb, ${meta.color} 16%, transparent)`,
          color: meta.color, flexShrink: 0
        }}>
          <Icon size={17} />
        </Hex>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{n.title}</span>
            <span className="mono" style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em', flexShrink: 0 }}>
              {n.when}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45, marginTop: 4 }}>{n.body}</div>
        </div>
      </div>
    </button>);
}

const NOTIF_META = {
  task:     { icon: (p) => <IconClipboard {...p} />, color: 'var(--c-amber)' },
  schedule: { icon: (p) => <IconCalendar {...p} />,  color: 'var(--accent-2)' },
  done:     { icon: (p) => <IconFlame {...p} />,     color: 'var(--accent)' },
  injury:   { icon: (p) => <IconHeart {...p} />,     color: 'var(--c-coral)' },
  coach:    { icon: (p) => <IconUser {...p} />,      color: 'var(--accent)' },
};
