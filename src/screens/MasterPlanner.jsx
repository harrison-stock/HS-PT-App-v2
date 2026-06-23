import React from 'react'
import { supabase } from '../lib/supabase'
import { HexBackButton } from '../components/hex'
import { IconChevronRight } from '../components/icons'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SECTION_LABEL = { MAIN: 'Workout', PULSE_RAISER: 'Pulse Raiser', BANDED: 'Activation', COOLDOWN: 'Cooldown' };
const sectionTag = (kind) => kind === 'BANDED' ? 'FREESTYLE' : 'REGULAR';
const sectionColor = (kind) => kind === 'PULSE_RAISER' ? 'var(--c-coral)' : kind === 'BANDED' ? 'var(--c-amber)' : kind === 'COOLDOWN' ? 'var(--accent-2)' : 'var(--accent)';

function fmtSecs(s) {
  s = parseInt(s) || 0;
  if (!s) return '—';
  const m = Math.floor(s / 60), r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

// Master Planner — pull every day of the programme out at once, either the same
// day across all weeks ("Week by Week") or all seven days of one week
// ("Day by Day"). Tap any column to jump into that day in the builder.
export function MasterPlanner({ programme, onClose, onPickDay }) {
  const phaseList = programme.phaseList || [];
  const phaseIds = phaseList.map(p => p.id).filter(Boolean);

  const [mode, setMode]   = React.useState('week');   // 'week' | 'day'
  const [dow, setDow]     = React.useState(0);          // selected day-of-week (week mode)
  const [gweek, setGweek] = React.useState(0);          // selected global week (day mode)
  const [days, setDays]   = React.useState(null);       // map key → day row

  // Flatten phases → a global week list { phaseIdx, phaseId, phaseName, weekInPhase, label }
  const weeks = [];
  phaseList.forEach((ph, pi) => {
    for (let w = 0; w < (ph.weeks || 0); w++) weeks.push({ phaseIdx: pi, phaseId: ph.id, phaseName: ph.name, weekInPhase: w, label: `Week ${weeks.length + 1}` });
  });

  React.useEffect(() => {
    if (!phaseIds.length) { setDays({}); return; }
    supabase.from('programme_days')
      .select('id, phase_id, week_index, day_of_week, intro, workout_sections(title, kind, sort_order, section_exercises(name, img_url, timed, alternates, superset_group, sort_order, exercise_sets(set_index, kind, reps_text, reps, weight_kg, rest_secs, time_secs)))')
      .in('phase_id', phaseIds)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(d => { map[`${d.phase_id}|${d.week_index}|${d.day_of_week}`] = d; });
        setDays(map);
      });
  }, [programme.id]);

  const dayAt = (phaseId, weekInPhase, dowIdx) => days?.[`${phaseId}|${weekInPhase}|${dowIdx}`] || null;

  // Columns depend on the mode.
  let columns = [];
  if (mode === 'week') {
    columns = weeks.map(w => ({
      key: `${w.phaseId}|${w.weekInPhase}`,
      title: `${w.label} · ${w.phaseName}`,
      sub: DOW[dow],
      day: dayAt(w.phaseId, w.weekInPhase, dow),
      onOpen: () => onPickDay(w.phaseIdx, w.weekInPhase, dow),
    }));
  } else {
    const w = weeks[gweek];
    if (w) columns = DOW.map((d, i) => ({
      key: `${w.phaseId}|${i}`,
      title: `${d}`,
      sub: `${w.label} · ${w.phaseName}`,
      day: dayAt(w.phaseId, w.weekInPhase, i),
      onOpen: () => onPickDay(w.phaseIdx, w.weekInPhase, i),
    }));
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 130, background: 'var(--bg-0)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ padding: '54px 14px 12px', background: 'var(--bg-1)', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <HexBackButton onClick={onClose} size={36}/>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div className="mono" style={{ fontSize: 8, color: 'var(--accent)', letterSpacing: '0.16em', fontWeight: 600 }}>// MASTER PLANNER</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{programme.name}</div>
          </div>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 999, padding: 3 }}>
            {[['week', 'Week by Week'], ['day', 'Day by Day']].map(([m, l]) => (
              <button key={m} onClick={() => setMode(m)} className="mono" style={{
                all: 'unset', cursor: 'pointer', padding: '7px 12px', borderRadius: 999, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? 'var(--on-accent)' : 'var(--text-3)',
              }}>{l.toUpperCase()}</button>
            ))}
          </div>

          {/* Selector */}
          {mode === 'week' ? (
            <select value={dow} onChange={e => setDow(+e.target.value)} style={selSt}>
              {DOW.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          ) : (
            <select value={gweek} onChange={e => setGweek(+e.target.value)} style={selSt}>
              {weeks.map((w, i) => <option key={i} value={i}>{w.label} · {w.phaseName}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Grid */}
      {!phaseIds.length ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.08em', lineHeight: 1.7 }}>
            SAVE THE PROGRAMME FIRST<br/><span style={{ fontSize: 9 }}>The master planner shows saved phases, weeks and days.</span>
          </div>
        </div>
      ) : days === null ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontFamily: 'JetBrains Mono', fontSize: 11, letterSpacing: '0.12em' }}>LOADING…</div>
      ) : columns.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center' }}><div className="mono" style={{ fontSize: 11, color: 'var(--text-3)' }}>NOTHING TO SHOW</div></div>
      ) : (
        <div className="scroller" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '14px 14px 40px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 'min-content' }}>
            {columns.map(col => <PlannerColumn key={col.key} col={col}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

function PlannerColumn({ col }) {
  const day = col.day;
  const sections = day ? [...(day.workout_sections || [])].sort((a, b) => a.sort_order - b.sort_order) : [];
  return (
    <div style={{ width: 300, flexShrink: 0 }}>
      {/* Column header */}
      <button onClick={col.onOpen} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%', marginBottom: 8 }}>
        <div style={{ padding: '8px 10px', background: 'var(--bg-2)', border: '1px solid var(--line-strong)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.title}</div>
            <div className="mono" style={{ fontSize: 8.5, color: 'var(--text-3)', letterSpacing: '0.08em', marginTop: 2 }}>{col.sub.toUpperCase()}</div>
          </div>
          <IconChevronRight size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }}/>
        </div>
      </button>

      {!day || sections.length === 0 ? (
        <button onClick={col.onOpen} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}>
          <div style={{ padding: '22px 12px', textAlign: 'center', borderRadius: 10, border: '1px dashed var(--line-strong)', background: 'var(--bg-1)' }}>
            <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-3)', letterSpacing: '0.1em' }}>REST DAY</div>
            <div className="mono" style={{ fontSize: 8.5, color: 'var(--accent)', letterSpacing: '0.08em', marginTop: 6 }}>+ ADD WORKOUT</div>
          </div>
        </button>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {sections.map((s, i) => <PlannerSection key={i} s={s}/>)}
        </div>
      )}
    </div>
  );
}

function PlannerSection({ s }) {
  const col = sectionColor(s.kind);
  const exercises = [...(s.section_exercises || [])].sort((a, b) => a.sort_order - b.sort_order);
  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderLeft: `2px solid ${col}`, borderBottom: '1px solid var(--line)' }}>
        <span style={{ fontSize: 11, fontWeight: 700 }}>{s.title || SECTION_LABEL[s.kind] || 'Block'}</span>
        <span className="mono" style={{ fontSize: 7.5, color: 'var(--text-3)', letterSpacing: '0.1em', fontWeight: 700 }}>{sectionTag(s.kind)}</span>
      </div>
      <div style={{ padding: 8, display: 'grid', gap: 8 }}>
        {exercises.length === 0 && <div className="mono" style={{ fontSize: 9, color: 'var(--text-3)', padding: '4px 2px' }}>No exercises</div>}
        {exercises.map((ex, i) => <PlannerExercise key={i} ex={ex} idx={i}/>)}
      </div>
    </div>
  );
}

function PlannerExercise({ ex, idx }) {
  const sets = [...(ex.exercise_sets || [])].sort((a, b) => a.set_index - b.set_index);
  const alts = Array.isArray(ex.alternates) ? ex.alternates : [];
  return (
    <div style={{ background: 'var(--bg-1)', border: '1px solid var(--line)', borderRadius: 8, padding: '7px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: sets.length ? 6 : 0 }}>
        <span className="mono" style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 700, flexShrink: 0 }}>{idx + 1}.</span>
        <div style={{ width: 22, height: 22, borderRadius: 5, flexShrink: 0, background: `center/cover url('${ex.img_url || ''}'), var(--bg-3)` }}/>
        <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
        {ex.superset_group != null && <span className="mono" style={{ fontSize: 7, fontWeight: 800, color: 'var(--accent-2)', flexShrink: 0 }}>SS</span>}
      </div>

      {alts.length > 0 && (
        <div className="mono" style={{ fontSize: 8, color: 'var(--text-3)', letterSpacing: '0.04em', margin: '0 0 6px 26px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          ALT: {alts.map(a => a.name).join(', ')}
        </div>
      )}

      {sets.length > 0 && (
        <div style={{ marginLeft: 26 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 1fr', gap: 2, fontSize: 7.5 }} className="mono">
            <span style={{ color: 'var(--text-3)', letterSpacing: '0.06em' }}>SET</span>
            <span style={{ color: 'var(--text-3)', letterSpacing: '0.06em' }}>{ex.timed ? 'TIME' : 'KG'}</span>
            <span style={{ color: 'var(--text-3)', letterSpacing: '0.06em' }}>{ex.timed ? '' : 'REPS'}</span>
            <span style={{ color: 'var(--text-3)', letterSpacing: '0.06em' }}>REST</span>
          </div>
          {sets.map((st, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 1fr', gap: 2, fontSize: 9, padding: '2px 0', borderTop: '1px solid var(--line)' }} className="mono">
              <span style={{ color: st.kind === 'WARMUP' ? 'var(--c-amber)' : 'var(--text-2)', fontWeight: 700 }}>{st.kind === 'WARMUP' ? 'W' : i + 1}</span>
              <span style={{ color: 'var(--text)' }}>{ex.timed ? fmtSecs(st.time_secs) : (st.weight_kg > 0 ? st.weight_kg : 'BW')}</span>
              <span style={{ color: 'var(--text)' }}>{ex.timed ? '' : (st.reps_text || st.reps || '—')}</span>
              <span style={{ color: 'var(--text-3)' }}>{fmtSecs(st.rest_secs)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const selSt = {
  appearance: 'auto', background: 'var(--bg-2)', border: '1px solid var(--line-strong)', borderRadius: 8,
  padding: '8px 10px', color: 'var(--text)', outline: 'none', fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 600,
};
