import React from 'react'
import { supabase } from '../lib/supabase'
import { loadMuscleVolume } from '../lib/muscleVolume'
import { MUSCLE_LABELS } from '../data/index'
import { MUSCLE_BODY } from '../data/musclePaths'
import { BodyMap } from './Progress'
import { Hex } from '../components/hex'
import { IconPlus, IconCheck, IconX2, IconChevronRight } from '../components/icons'

const SEV_COLOR  = { mild: 'var(--c-amber)', moderate: 'var(--c-coral)', severe: '#d93434' };
const SEV_LABEL  = { mild: 'MILD', moderate: 'MODERATE', severe: 'SEVERE' };
const SEV_VAL    = { mild: 0.35, moderate: 0.65, severe: 1.0 };
const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90 };

const labelFor = (g) => MUSCLE_LABELS[g] || g.replace(/([A-Z])/g, ' $1').trim();

// Client-facing Body Map — fifth tab. Two views: muscles worked (volume
// heatmap) and injuries (report / resolve / history).
export function Body({ userId, trainerId, go }) {
  const [view, setView] = React.useState('worked');
  const [side, setSide] = React.useState('front');

  return (
    <div className="scroller" style={{ padding: '0 16px 110px', paddingTop: 64 }}>
      <div style={{ marginBottom: 14 }}>
        <div className="label">// ANATOMY</div>
        <div className="h-bold" style={{ fontSize: 24, marginTop: 4 }}>BODY MAP</div>
      </div>

      {/* View switch */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <ViewTab active={view === 'worked'}   onClick={() => setView('worked')}>MUSCLES WORKED</ViewTab>
        <ViewTab active={view === 'injuries'} onClick={() => setView('injuries')}>INJURIES</ViewTab>
      </div>

      {/* Front / back */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <div className="seg" style={{ padding: 3 }}>
          {['front', 'back'].map(s => (
            <button key={s} className={side === s ? 'active' : ''} onClick={() => setSide(s)} style={{ padding: '5px 12px', fontSize: 9 }}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {view === 'worked'
        ? <WorkedView userId={userId} side={side} go={go} />
        : <InjuriesView userId={userId} trainerId={trainerId} side={side} />}
    </div>
  );
}

// ── MUSCLES WORKED ───────────────────────────────────────────────
function WorkedView({ userId, side, go }) {
  const [range, setRange] = React.useState('30d');
  const [data, setData]   = React.useState(null);
  const [picked, setPicked] = React.useState(null);
  const days = RANGE_DAYS[range];

  React.useEffect(() => {
    if (!userId) { setData({}); return; }
    setData(null); setPicked(null);
    loadMuscleVolume(userId, days).then(setData);
  }, [userId, days]);

  const vol = data || {};
  const maxSets = Math.max(1, ...Object.values(vol).map(d => d.sets));
  const intensity = (g) => Math.min(1, (vol[g]?.sets || 0) / maxSets);
  const pickedVol = picked ? vol[picked] : null;
  const worked = Object.keys(vol).length;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="label">// HEATMAP · LAST {range.toUpperCase()}</div>
        <div className="seg" style={{ padding: 3 }}>
          {['7d', '30d', '90d'].map(r => (
            <button key={r} className={range === r ? 'active' : ''} onClick={() => setRange(r)} style={{ padding: '5px 9px', fontSize: 9 }}>
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {data === null ? (
        <Loading/>
      ) : worked === 0 ? (
        <Empty title="NO TRAINING DATA" sub={`Complete sessions to light up the last ${range}`} />
      ) : (
        <>
          <div className="card" style={{ padding: 16, marginBottom: 12, background: 'radial-gradient(60% 80% at 50% 30%, rgba(0,245,255,0.06), transparent 70%), var(--bg-2)' }}>
            <BodyMap side={side} intensity={intensity} picked={picked} onPick={setPicked} data={vol} labels={MUSCLE_LABELS} heatColor="var(--accent)" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <Mono>LOW</Mono>
              <div style={{ flex: 1, height: 6, borderRadius: 999, margin: '0 10px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.05), color-mix(in srgb, var(--accent) 30%, transparent), var(--accent))' }} />
              <Mono style={{ color: 'var(--accent)' }}>HIGH</Mono>
            </div>
          </div>

          {pickedVol ? (
            <div className="card" style={{ padding: 16, marginBottom: 12, borderColor: 'color-mix(in srgb, var(--accent) 40%, var(--line))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div className="label" style={{ color: 'var(--accent)' }}>// SELECTED</div>
                  <div className="h-bold" style={{ fontSize: 18, marginTop: 4 }}>{labelFor(picked).toUpperCase()}</div>
                  <Mono style={{ marginTop: 3 }}>LAST WORKED · {pickedVol.lastWorked.toUpperCase()}</Mono>
                </div>
                <button onClick={() => setPicked(null)} style={{ all: 'unset', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}><IconX2 size={14}/></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                <Stat label="SETS"   value={pickedVol.sets} />
                <Stat label="REPS"   value={pickedVol.reps} />
                <Stat label="VOLUME" value={`${pickedVol.kg.toLocaleString()}`} unit="kg" />
              </div>
              <button onClick={() => go('progress')} className="btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--heading-deep)' }}>
                VIEW FULL STATS <IconChevronRight size={14}/>
              </button>
            </div>
          ) : (
            <Mono style={{ textAlign: 'center', padding: '4px 0 8px' }}>TAP A HIGHLIGHTED MUSCLE TO SEE ITS VOLUME</Mono>
          )}
        </>
      )}
    </>
  );
}

// ── INJURIES ─────────────────────────────────────────────────────
function InjuriesView({ userId, trainerId, side }) {
  const [injuries, setInjuries] = React.useState(null);
  const [picked, setPicked]     = React.useState(null);
  const [reporting, setReporting] = React.useState(false);

  const reload = React.useCallback(() => {
    if (!userId) { setInjuries([]); return; }
    supabase.from('client_injuries').select('*').eq('client_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setInjuries(data || []));
  }, [userId]);
  React.useEffect(() => { reload(); }, [reload]);

  // Every muscle is interactive so the client can report anywhere.
  const allGroups = React.useMemo(() => {
    const gs = MUSCLE_BODY.groupSlugs?.[side] || {};
    const d = {}; Object.keys(gs).forEach(g => { d[g] = {}; });
    return d;
  }, [side]);

  const list = injuries || [];
  const active = list.filter(i => !i.resolved_at);
  const past   = list.filter(i => i.resolved_at);

  const intensity = React.useCallback((g) => {
    const hits = active.filter(i => i.muscle_group === g);
    if (!hits.length) return 0;
    return Math.max(...hits.map(i => SEV_VAL[i.severity] || 0.5));
  }, [active]);

  const pickedActive = picked ? active.filter(i => i.muscle_group === picked) : [];

  const resolve = async (id) => {
    await supabase.from('client_injuries').update({ resolved_at: new Date().toISOString() }).eq('id', id);
    reload();
  };
  const report = async (severity, note) => {
    await supabase.from('client_injuries').insert({
      client_id: userId, trainer_id: trainerId || null,
      muscle_group: picked, body_side: side, severity, note,
    });
    setReporting(false); reload();
  };

  if (injuries === null) return <Loading/>;

  return (
    <>
      <div className="card" style={{ padding: 16, marginBottom: 12, background: 'radial-gradient(60% 80% at 50% 30%, rgba(238,106,106,0.06), transparent 70%), var(--bg-2)' }}>
        <BodyMap side={side} intensity={intensity} picked={picked}
          onPick={(g) => { setPicked(g === picked ? null : g); setReporting(false); }}
          data={allGroups} labels={MUSCLE_LABELS} heatColor="var(--c-coral)" />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          {Object.entries(SEV_COLOR).map(([sev, col]) => (
            <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Dot color={col}/><Mono>{SEV_LABEL[sev]}</Mono>
            </div>
          ))}
        </div>
      </div>

      {!picked && (
        <Mono style={{ textAlign: 'center', padding: '4px 0 12px' }}>
          TAP ANY MUSCLE TO REPORT OR REVIEW AN INJURY
        </Mono>
      )}

      {/* Selected muscle */}
      {picked && (
        <div className="card" style={{ padding: 14, marginBottom: 12, borderColor: 'color-mix(in srgb, var(--c-coral) 40%, var(--line))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="h-bold" style={{ fontSize: 15 }}>{labelFor(picked).toUpperCase()}</div>
            {!reporting && (
              <button onClick={() => setReporting(true)} style={{
                all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 9, color: 'var(--c-coral)', fontFamily: 'JetBrains Mono', fontWeight: 700,
                border: '1px solid color-mix(in srgb, var(--c-coral) 50%, transparent)', borderRadius: 6, padding: '5px 9px',
              }}><IconPlus size={10}/> REPORT INJURY</button>
            )}
          </div>

          {reporting && <ReportForm onCancel={() => setReporting(false)} onSave={report} />}

          {!reporting && pickedActive.length === 0 && (
            <Mono>No active injuries here. Tap REPORT INJURY to log one.</Mono>
          )}
          {!reporting && pickedActive.map(inj => (
            <div key={inj.id} style={{
              padding: '10px 12px', borderRadius: 8, marginBottom: 6,
              background: `color-mix(in srgb, ${SEV_COLOR[inj.severity]} 10%, var(--bg-3))`,
              border: `1px solid color-mix(in srgb, ${SEV_COLOR[inj.severity]} 35%, transparent)`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <span className="mono" style={{ fontSize: 9, color: SEV_COLOR[inj.severity], fontWeight: 700, letterSpacing: '0.08em' }}>{SEV_LABEL[inj.severity]}</span>
                  {inj.note && <div style={{ fontSize: 12, marginTop: 3, color: 'var(--text)' }}>{inj.note}</div>}
                  <Mono style={{ marginTop: 3 }}>REPORTED {new Date(inj.created_at).toLocaleDateString('en-GB')}</Mono>
                </div>
                <button onClick={() => resolve(inj.id)} style={{
                  all: 'unset', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 9, color: 'var(--accent)', fontFamily: 'JetBrains Mono', fontWeight: 700,
                  border: '1px solid color-mix(in srgb, var(--accent) 50%, transparent)', borderRadius: 6, padding: '5px 9px',
                }}><IconCheck size={10} sw={3}/> RESOLVE</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active summary (all muscles) */}
      {active.length > 0 && (
        <>
          <div className="label" style={{ margin: '4px 4px 8px' }}>// ACTIVE · {active.length}</div>
          <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
            {active.map(inj => (
              <button key={inj.id} onClick={() => { setPicked(inj.muscle_group); setReporting(false); }}
                style={{ all: 'unset', cursor: 'pointer' }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center',
                  padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 8,
                  border: `1px solid color-mix(in srgb, ${SEV_COLOR[inj.severity]} 30%, var(--line))`,
                }}>
                  <Dot color={SEV_COLOR[inj.severity]} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{labelFor(inj.muscle_group)}</div>
                    <Mono style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {SEV_LABEL[inj.severity]}{inj.note ? ` · ${inj.note}` : ''}
                    </Mono>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); resolve(inj.id); }} style={{
                    all: 'unset', cursor: 'pointer', fontSize: 9, color: 'var(--accent)',
                    fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.06em',
                    border: '1px solid color-mix(in srgb, var(--accent) 50%, transparent)', borderRadius: 6, padding: '5px 9px',
                  }}>RESOLVE</button>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Past injuries */}
      <div className="label" style={{ margin: '4px 4px 8px' }}>// PAST INJURIES · {past.length}</div>
      {past.length === 0 ? (
        <Empty title="NO PAST INJURIES" sub="Resolved injuries appear here for your history" />
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {past.map(inj => (
            <div key={inj.id} style={{
              display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center',
              padding: '10px 12px', background: 'var(--bg-2)', borderRadius: 8, border: '1px solid var(--line)', opacity: 0.7,
            }}>
              <Dot color="var(--text-3)" />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{labelFor(inj.muscle_group)}</div>
                <Mono>{SEV_LABEL[inj.severity]}{inj.note ? ` · ${inj.note}` : ''}</Mono>
              </div>
              <span className="mono" style={{ fontSize: 9, color: 'var(--accent)', letterSpacing: '0.06em', flexShrink: 0 }}>
                ✓ {new Date(inj.resolved_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ReportForm({ onCancel, onSave }) {
  const [severity, setSeverity] = React.useState('moderate');
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  return (
    <div style={{ display: 'grid', gap: 10, marginBottom: 6 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {['mild', 'moderate', 'severe'].map(s => (
          <button key={s} onClick={() => setSeverity(s)} style={{
            all: 'unset', cursor: 'pointer', flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8,
            fontSize: 9, fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.08em',
            background: severity === s ? `color-mix(in srgb, ${SEV_COLOR[s]} 18%, var(--bg-3))` : 'var(--bg-3)',
            border: `1px solid ${severity === s ? SEV_COLOR[s] : 'var(--line)'}`,
            color: severity === s ? SEV_COLOR[s] : 'var(--text-3)',
          }}>{SEV_LABEL[s]}</button>
        ))}
      </div>
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
        placeholder="Describe how it feels, when it started, what aggravates it…"
        style={{
          width: '100%', boxSizing: 'border-box', background: 'var(--bg-3)',
          border: '1px solid var(--line-strong)', borderRadius: 8, padding: '10px 11px',
          color: 'var(--text)', outline: 'none', fontFamily: 'JetBrains Mono', fontSize: 12, resize: 'vertical',
        }}/>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} className="btn-ghost" style={{ flex: 1 }}>CANCEL</button>
        <button onClick={async () => { if (saving) return; setSaving(true); await onSave(severity, note.trim()); }}
          className="btn-primary" style={{ flex: 1 }}>{saving ? 'SAVING…' : 'REPORT'}</button>
      </div>
    </div>
  );
}

// ── Shared bits ──────────────────────────────────────────────────
function ViewTab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '11px 12px', borderRadius: 10, cursor: 'pointer',
      background: active ? 'var(--accent-soft)' : 'var(--bg-2)',
      border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
      color: active ? 'var(--accent)' : 'var(--text-2)',
      fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
      boxShadow: active ? '0 0 calc(8px * var(--glow)) var(--accent-glow)' : 'none',
    }}>{children}</button>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div style={{ textAlign: 'center', padding: '10px 6px', borderRadius: 8, background: 'var(--bg-3)', border: '1px solid var(--line)' }}>
      <div className="label" style={{ marginBottom: 4 }}>{label}</div>
      <div className="h-bold" style={{ fontSize: 18, color: 'var(--accent)', lineHeight: 1 }}>
        {value}{unit && <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 1 }}>{unit}</span>}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="card" style={{ padding: 28, textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.12em' }}>LOADING…</div>
    </div>
  );
}

function Empty({ title, sub }) {
  return (
    <div className="card" style={{ padding: 24, textAlign: 'center' }}>
      <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.1em', lineHeight: 1.7 }}>
        {title}<br/><span style={{ fontSize: 9 }}>{sub}</span>
      </div>
    </div>
  );
}

function Mono({ children, style }) {
  return <div className="mono" style={{ fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.06em', lineHeight: 1.5, ...style }}>{children}</div>;
}

function Dot({ color }) {
  return <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }}/>;
}
