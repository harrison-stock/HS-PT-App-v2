import React from 'react'
import { ASSIGNED_WORKOUTS } from '../data/index'
import { HEX_RATIO, Hex, HexBackButton } from '../components/hex'
import { IconBand, IconCalendar, IconCheck, IconChevronLeft, IconChevronRight, IconClock, IconDumbbell, IconFlame, IconLeaf, IconTarget } from '../components/icons'

// Workouts screen — clean Everfit-inspired layout.
// Main = week schedule. Tap a session → bottom-sheet PREVIEW (hero, description,
// equipment chips, accordion sections). Tap a section in preview → full-screen
// section detail with exercise rows. Tap an exercise row → exercise detail (mock).

export function Workouts({ go, openPreview }) {
  const [workouts, setWorkouts] = React.useState(ASSIGNED_WORKOUTS);
  const [weekOffset, setWeekOffset] = React.useState(0);
  const [previewId, setPreviewId] = React.useState(null);
  const [reschedulingId, setReschedulingId] = React.useState(null);

  const anchor = new Date(2026, 3, 27); // Mon Apr 27 2026
  const today = '2026-04-28';

  const fmtDate = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  const weekStart = new Date(anchor);
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const workoutsByDate = React.useMemo(() => {
    const m = {};
    workouts.forEach((w) => {(m[w.date] = m[w.date] || []).push(w);});
    return m;
  }, [workouts]);

  const tagDot = (t) => t === 'CARDIO' ? 'var(--c-coral)' : t === 'RECOVERY' ? 'var(--c-amber)' : 'var(--accent)';

  const reschedule = (id, newDate) => {
    setWorkouts((prev) => prev.map((w) => w.id === id ? { ...w, date: newDate, dateLabel: 'Rescheduled' } : w));
    setReschedulingId(null);
  };

  React.useEffect(() => {
    if (openPreview) setPreviewId(openPreview);
  }, [openPreview]);

  const previewWorkout = workouts.find((w) => w.id === previewId);
  const weekLabel = `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  const dayName = (dt) => dt.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  return (
    <div className="scroller" style={{ padding: '0 16px 110px', paddingTop: 64 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <div>
          <div className="label">// PROGRAMME</div>
          <div className="h-bold" style={{ fontSize: 24, marginTop: 4 }}>SCHEDULE</div>
        </div>
      </div>

      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={() => setWeekOffset((o) => o - 1)} aria-label="Previous week" style={{ all: 'unset', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 34 * HEX_RATIO, height: 34 }}>
          <Hex size={34} square style={{ background: 'var(--bg-2)', border: '1px solid var(--line-strong)', color: 'var(--text)' }}>
            <IconChevronLeft size={14} />
          </Hex>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="h-bold" style={{ fontSize: 13 }}>{weekLabel.toUpperCase()}</div>
          <button onClick={() => setWeekOffset(0)} className="mono" style={{
            background: 'none', border: 0, color: weekOffset === 0 ? 'var(--accent)' : 'var(--text-3)',
            fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', marginTop: 2
          }}>{weekOffset === 0 ? '● THIS WEEK' : 'GO TO TODAY'}</button>
        </div>
        <button onClick={() => setWeekOffset((o) => o + 1)} aria-label="Next week" style={{ all: 'unset', cursor: 'pointer', display: 'grid', placeItems: 'center', width: 34 * HEX_RATIO, height: 34 }}>
          <Hex size={34} square style={{ background: 'var(--bg-2)', border: '1px solid var(--line-strong)', color: 'var(--text)' }}>
            <IconChevronRight size={14} />
          </Hex>
        </button>
      </div>

      {/* Reschedule banner */}
      {reschedulingId &&
      <div className="card" style={{
        marginBottom: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 10,
        borderColor: 'color-mix(in srgb, var(--accent) 50%, transparent)',
        background: 'var(--accent-soft)'
      }}>
          <IconCalendar size={16} style={{ color: 'var(--accent)' }} />
          <div style={{ flex: 1, fontSize: 12 }}>
            <div className="label" style={{ color: 'var(--accent)' }}>// MOVE SESSION</div>
            <div style={{ marginTop: 2 }}>Tap a day below to reschedule</div>
          </div>
          <button className="btn-ghost" onClick={() => setReschedulingId(null)}>CANCEL</button>
        </div>
      }

      {/* Compact week rows */}
      <div style={{ display: 'grid', gap: 8 }}>
        {weekDates.map((dt) => {
          const dateStr = fmtDate(dt);
          const dayWorkouts = workoutsByDate[dateStr] || [];
          const isToday = dateStr === today;
          const isPast = dateStr < today;
          const isResched = reschedulingId !== null;

          return (
            <div key={dateStr}
            onClick={() => isResched && reschedule(reschedulingId, dateStr)}
            style={{
              display: 'grid', gridTemplateColumns: '48px 1fr', gap: 12,
              padding: '12px 14px',
              background: isToday ? 'linear-gradient(90deg, var(--accent-soft), transparent 40%), var(--bg-2)' : 'var(--bg-2)',
              border: '1px solid ' + (isResched ? 'var(--accent)' : isToday ? 'color-mix(in srgb, var(--accent) 40%, var(--line))' : 'var(--line)'),
              borderRadius: 12,
              opacity: isPast && !isToday ? 0.55 : 1,
              cursor: isResched ? 'pointer' : 'default'
            }}>
              {/* Date column */}
              <div style={{ textAlign: 'center', borderRight: '1px solid var(--line)', paddingRight: 10 }}>
                <div className="mono" style={{
                  fontSize: 9, letterSpacing: '0.14em',
                  color: isToday ? 'var(--accent)' : 'var(--text-3)'
                }}>{dayName(dt)}</div>
                <div className="h-bold" style={{
                  fontSize: 22, marginTop: 2, lineHeight: 1,
                  color: isToday ? 'var(--accent)' : 'var(--text)'
                }}>{dt.getDate()}</div>
                {isToday && <div className="mono" style={{ fontSize: 8, color: 'var(--accent)', letterSpacing: '0.14em', marginTop: 2 }}>TODAY</div>}
              </div>

              {/* Sessions column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                {dayWorkouts.length === 0 &&
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.08em', padding: '6px 0' }}>
                    REST DAY
                  </div>
                }
                {dayWorkouts.map((w) => {
                  const done = w.status === 'completed';
                  return (
                    <button key={w.id}
                    onClick={(e) => {if (!isResched) {e.stopPropagation();done ? go('sessionresults') : setPreviewId(w.id);}}}
                    style={{
                      all: 'unset', cursor: isResched ? 'inherit' : 'pointer',
                      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10,
                      alignItems: 'center', padding: '8px 10px',
                      background: done ? `color-mix(in srgb, ${tagDot(w.tag)} 15%, var(--bg-3))` : 'var(--bg-3)',
                      border: '1px solid ' + (done ? `color-mix(in srgb, ${tagDot(w.tag)} 45%, transparent)` : 'var(--line)'),
                      borderRadius: 10
                    }}>
                    {done ?
                      <Hex size={18} square style={{
                        background: tagDot(w.tag), flexShrink: 0,
                        color: 'var(--on-accent)',
                        boxShadow: `0 0 calc(6px * var(--glow)) ${tagDot(w.tag)}`
                      }}>
                      <IconCheck size={10} sw={3} />
                    </Hex> :
                      <Hex size={11} square style={{
                        flexShrink: 0,
                        background: tagDot(w.tag),
                        boxShadow: `0 0 calc(6px * var(--glow)) ${tagDot(w.tag)}`
                      }} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
                        {w.name}
                      </div>
                      <div className="mono" style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.1em', marginTop: 2 }}>
                        {w.tag} · {w.duration}M · {w.exercises} EX
                        {done && <span style={{ color: tagDot(w.tag), marginLeft: 8 }}>· ✓ DONE</span>}
                      </div>
                    </div>
                    <IconChevronRight size={14} style={{ color: 'var(--text-3)' }} />
                  </button>);
                })}
              </div>
            </div>);

        })}
      </div>

      {/* Preview sheet */}
      {previewWorkout &&
      <WorkoutPreview
        w={previewWorkout}
        onClose={() => setPreviewId(null)}
        onStart={() => {setPreviewId(null);go('log');}}
        onReschedule={() => {setReschedulingId(previewWorkout.id);setPreviewId(null);}} />

      }
    </div>);

}

// ── PREVIEW (Everfit-style) ──────────────────────────────────────
export function WorkoutPreview({ w, onClose, onStart, onReschedule }) {
  // Drill-down state: which section is opened in detail view
  const [openSection, setOpenSection] = React.useState(null);
  // Accordion: which section is expanded inline
  const [expandedSection, setExpandedSection] = React.useState(null);

  const sections = w.sections || [
  // fallback for workouts without sections
  { kind: 'MAIN', title: 'Workout', minutes: w.duration, items: w.preview, intro: '' }];


  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(7,7,12,0.55)',
      backdropFilter: 'blur(6px)',
      animation: 'fadeIn .2s ease'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes slideRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'absolute', inset: 0,
        background: 'var(--bg-1)',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp .25s ease'
      }}>
        {openSection ?
        <SectionDetail s={openSection} onBack={() => setOpenSection(null)} /> :
        <PreviewBody
          w={w}
          sections={sections}
          expanded={expandedSection}
          onToggle={(idx) => setExpandedSection(expandedSection === idx ? null : idx)}
          onOpenSection={(s) => setOpenSection(s)}
          onClose={onClose}
          onStart={onStart}
          onReschedule={onReschedule} />

        }
      </div>
    </div>);

}

function PreviewBody({ w, sections, expanded, onToggle, onOpenSection, onClose, onStart, onReschedule }) {
  return (
    <>
      {/* Hero image with overlaid back/menu */}
      <div style={{
        height: 260, position: 'relative', flexShrink: 0,
        background: `linear-gradient(180deg, rgba(7,7,12,0.35) 0%, transparent 30%, rgba(17,22,26,0.95) 100%), url('${w.img}') center/cover, var(--bg-3)`
      }}>
        <HexBackButton onClick={onClose} variant="overlay" size={38}
        style={{ position: 'absolute', top: 14, left: 14, zIndex: 2 }} />

        {/* Title block at bottom */}
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 16 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 999,
              background: 'var(--accent-2)', color: 'var(--on-accent)',
              fontFamily: 'JetBrains Mono', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em'
            }}>
              <IconTarget size={11} />
              {(w.phase || 'BUILD · WK 5/16').toUpperCase()}
            </span>
          </div>
          <div className="h-bold" style={{
            fontSize: 26, lineHeight: 1.1,
            color: '#fff',
            textShadow: '0 2px 16px rgba(0,0,0,0.85)'
          }}>
            {w.name.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="scroller" style={{ flex: 1, padding: '16px 18px 0', minHeight: 0 }}>
        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconClock size={12} style={{ color: 'var(--accent)' }} />
            {w.duration} mins
          </span>
          <span style={{ width: 3, height: 3, background: 'var(--text-3)', borderRadius: '50%' }} />
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.06em' }}>
            {sections.length} sections
          </span>
          <span style={{ width: 3, height: 3, background: 'var(--text-3)', borderRadius: '50%' }} />
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.06em' }}>
            {sections.reduce((n, s) => n + s.items.length, 0)} exercises
          </span>
        </div>

        {/* Equipment */}
        {w.equipment &&
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {w.equipment.map((eq) =>
          <span key={eq} style={{
            padding: '5px 10px', borderRadius: 6,
            background: 'var(--bg-3)',
            border: '1px solid var(--line)',
            fontSize: 11, color: 'var(--text-2)', fontWeight: 500
          }}>{eq}</span>
          )}
          </div>
        }

        {/* Description */}
        {w.description &&
        <div style={{
          color: 'var(--text-2)', lineHeight: 1.55,
          marginBottom: 22, whiteSpace: 'pre-line', fontFamily: "\"JetBrains Mono\"", fontSize: "12px"
        }}>
            {w.description}
          </div>
        }

        {/* Sections list */}
        <div style={{ display: 'grid', gap: 10, marginBottom: 100 }}>
          {sections.map((s, si) =>
          <SectionAccordion
            key={si} s={s} index={si}
            expanded={expanded === si}
            onToggle={() => onToggle(si)}
            onOpen={() => onOpenSection(s)} />

          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '14px 18px 28px',
        background: 'linear-gradient(180deg, transparent, var(--bg-1) 30%)',
        display: 'flex', gap: 10
      }}>
        <button style={{ all: 'unset', cursor: 'pointer', flex: '0 0 auto', display: 'grid', placeItems: 'center' }} onClick={onReschedule} aria-label="Reschedule">
          <Hex size={48} square style={{ background: 'var(--bg-2)', border: '1px solid var(--line-strong)', color: 'var(--text)' }}>
            <IconCalendar size={16} />
          </Hex>
        </button>
        {w.status === 'completed' ?
        <button className="btn-ghost" style={{ flex: 1, borderColor: 'var(--lime)', color: 'var(--lime)' }} onClick={onClose}>
            VIEW LOG
          </button> :

        <button className="btn-primary" style={{ flex: 1, padding: '14px' }} onClick={onStart}>
            START WORKOUT
          </button>
        }
      </div>
    </>);

}

// ── ACCORDION SECTION ROW ────────────────────────────────────────
function SectionAccordion({ s, index, expanded, onToggle, onOpen }) {
  const color = sectionColor(s.kind);
  return (
    <div style={{
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      borderRadius: 14,
      overflow: 'hidden'
    }}>
      {/* Header — tap to expand inline */}
      <button onClick={onToggle} style={{
        all: 'unset', cursor: 'pointer', width: '100%',
        padding: '14px 16px',
        display: 'grid', gridTemplateColumns: '34px 1fr auto', gap: 12,
        alignItems: 'center'
      }}>
        <Hex size={30} square style={{
          background: `color-mix(in srgb, ${color} 16%, transparent)`,
          border: `1px solid color-mix(in srgb, ${color} 38%, transparent)`,
          color
        }}>{(sectionIcon(s.kind))(15)}</Hex>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.2, fontFamily: "\"JetBrains Mono\"" }}>
            {s.title}
          </div>
          <div className="mono" style={{
            fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em', marginTop: 3
          }}>
            {s.items.length} EXERCISES · {s.minutes} MIN
          </div>
        </div>
        <div style={{
          color: 'var(--text-3)',
          transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform .2s'
        }}>
          <IconChevronRight size={16} />
        </div>
      </button>

      {/* Always-visible exercise list for this zone */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'grid', gap: 2 }}>
          {s.items.map((e, i) =>
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center',
            padding: '7px 0', borderTop: i === 0 ? '1px solid var(--line)' : '1px solid color-mix(in srgb, var(--line) 55%, transparent)'
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 1.5, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 500, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace" }}>
              {e.name}
            </span>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-3)', letterSpacing: '0.04em', flexShrink: 0 }}>
              {e.target}
            </span>
          </div>
          )}
        </div>
      </div>

      {/* Expanded body */}
      {expanded &&
      <div style={{
        padding: '0 16px 14px',
        borderTop: '1px solid var(--line)',
        animation: 'slideUp .2s ease'
      }}>
          {s.intro &&
        <div style={{
          fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.55,
          padding: '12px 0', whiteSpace: 'pre-line', fontFamily: "'JetBrains Mono', monospace"
        }}>
              {s.intro}
            </div>
        }
          <button onClick={(e) => {e.stopPropagation();onOpen();}} style={{
          all: 'unset', cursor: 'pointer', width: '100%',
          marginTop: 10, padding: '10px',
          textAlign: 'center',
          background: 'var(--bg-3)',
          border: '1px solid var(--line-strong)',
          borderRadius: 8,
          fontFamily: 'JetBrains Mono', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.14em', color: 'var(--accent)',
          boxSizing: 'border-box'
        }}>
            VIEW SECTION DETAIL →
          </button>
        </div>
      }
    </div>);

}

// ── EXERCISE ROW (clean Everfit style) ───────────────────────────
function ExerciseRow({ e, idx, color, large }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12,
      alignItems: 'center', padding: large ? '10px 0' : '8px 0',
      borderBottom: large ? '1px solid var(--line)' : 'none'
    }}>
      <div style={{
        width: large ? 56 : 44, height: large ? 56 : 44, borderRadius: 10, flexShrink: 0,
        background: `url('${e.img || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&q=70'}') center/cover, var(--bg-3)`,
        position: 'relative',
        border: '1px solid var(--line-strong)'
      }}>
        {/* Play overlay (video) */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 10,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.35))',
          display: 'grid', placeItems: 'center'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" opacity="0.95">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: large ? 15 : 13.5, fontWeight: 600, lineHeight: 1.25 }}>
          {e.name}
        </div>
        <div className="mono" style={{
          fontSize: 10.5, color: 'var(--text-3)', letterSpacing: '0.04em', marginTop: 3
        }}>
          {e.load && e.load !== '—' ? `${e.load} · ` : ''}{e.target}
        </div>
      </div>
      <IconChevronRight size={14} style={{ color: 'var(--text-3)' }} />
    </div>);

}

// ── SECTION DETAIL (full-screen) ─────────────────────────────────
function SectionDetail({ s, onBack }) {
  const color = sectionColor(s.kind);
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'var(--bg-1)',
      display: 'flex', flexDirection: 'column',
      animation: 'slideRight .25s ease'
    }}>
      {/* Top bar */}
      <div style={{
        padding: '54px 18px 12px',
        display: 'grid', gridTemplateColumns: '40px 1fr 40px', alignItems: 'center', gap: 8,
        borderBottom: '1px solid var(--line)'
      }}>
        <HexBackButton onClick={onBack} size={36} />
        <div style={{ textAlign: 'center' }}>
          <div className="mono" style={{
            fontSize: 9, letterSpacing: '0.16em', color,
            fontWeight: 600
          }}>SECTION</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{s.title}</div>
        </div>
        <div />
      </div>

      {/* Body */}
      <div className="scroller" style={{ flex: 1, padding: '20px 18px 28px' }}>
        <div className="h-bold" style={{ fontSize: 22, lineHeight: 1.1, marginBottom: 8 }}>
          {s.title.toUpperCase()}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconClock size={12} style={{ color }} />
            {s.minutes} mins
          </span>
          <span style={{ width: 3, height: 3, background: 'var(--text-3)', borderRadius: '50%' }} />
          <span className="mono" style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: '0.06em' }}>
            {s.items.length} exercises
          </span>
        </div>

        {/* Intro */}
        {s.intro &&
        <div style={{
          fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6,
          marginBottom: 22, whiteSpace: 'pre-line'
        }}>
            {s.intro}
          </div>
        }

        {/* Exercise list — clean rows */}
        <div className="label" style={{ margin: '4px 0 10px' }}>// EXERCISES</div>
        <div>
          {s.items.map((e, i) => <ExerciseRow key={i} e={e} idx={i} color={color} large />)}
        </div>
      </div>
    </div>);

}

// ── HELPERS ──────────────────────────────────────────────────────
// Cute little icon per equipment type (12px, inherits currentColor).
function equipIcon(name) {
  const n = (name || '').toLowerCase();
  const sw = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (/bike|cycle|spin/.test(n)) return <svg {...sw}><circle cx="6" cy="17" r="3.2" /><circle cx="18" cy="17" r="3.2" /><path d="M6 17l4-7h5l3 7M10 10l-1-3h-2M14.5 10L17 7" /></svg>;
  if (/row/.test(n)) return <svg {...sw}><path d="M3 12h6l2-2 6 2 4-1M5 12v4M21 11v5" /><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none" /></svg>;
  if (/tread|run|cross|elliptic/.test(n)) return <svg {...sw}><circle cx="9" cy="4.5" r="1.6" /><path d="M8 9l-2 5 3 1 1 5M10 10l4 2 3-1M6 21l2-6" /></svg>;
  if (/barbell|bar\b/.test(n)) return <svg {...sw}><path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" /></svg>;
  if (/dumbbell|db\b|free/.test(n)) return <svg {...sw}><path d="M4 8v8M7 6v12M17 6v12M20 8v8M7 12h10" /></svg>;
  if (/kettle/.test(n)) return <svg {...sw}><path d="M9 7a3 3 0 0 1 6 0" /><path d="M7 9h10l1.5 8a2 2 0 0 1-2 2.5H7.5a2 2 0 0 1-2-2.5L7 9z" /></svg>;
  if (/band|cable|rope/.test(n)) return <svg {...sw}><path d="M4 6c6 0 6 12 16 12" /><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" /></svg>;
  if (/bench/.test(n)) return <svg {...sw}><path d="M3 10h18M5 10v6M19 10v6M4 13h2M18 13h2" /></svg>;
  if (/mat|floor|body/.test(n)) return <svg {...sw}><rect x="3" y="8" width="18" height="8" rx="2" /><path d="M7 8v8" /></svg>;
  // machine / leg press / default
  return <svg {...sw}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 5v14M14 9h3M14 13h3" /></svg>;
}

function iconBtn(top, side, align = 'left') {
  return {
    position: 'absolute',
    top, [align]: side,
    width: 36, height: 36, borderRadius: '50%',
    background: 'rgba(0,0,0,0.45)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.15)',
    display: 'grid', placeItems: 'center',
    color: 'var(--text)', cursor: 'pointer',
    zIndex: 2
  };
}

function sectionColor(kind) {
  return kind === 'PULSE_RAISER' ? 'var(--c-coral)' :
  kind === 'BANDED' ? 'var(--c-amber)' :
  kind === 'COOLDOWN' ? 'var(--accent-2)' :
  'var(--accent)';
}

// Cute phase icon per section kind (matches the active-workout phase strip).
function sectionIcon(kind) {
  return kind === 'PULSE_RAISER' ? (s) => <IconFlame size={s} /> :
  kind === 'BANDED' ? (s) => <IconBand size={s} /> :
  kind === 'COOLDOWN' ? (s) => <IconLeaf size={s} /> :
  (s) => <IconDumbbell size={s} />;
}

Workouts = Workouts;
WorkoutPreview = WorkoutPreview;
