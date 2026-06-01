import React from 'react'
import { NOTIFICATIONS } from '../data/index'
import { HexBackButton, Hex } from '../components/hex'
import { IconUser, IconTrophy, IconCalendar, IconFlame, IconHeart } from '../components/icons'

// Notifications — athlete-side activity feed reached from the dashboard bell.
export function Notifications({ go }) {
  const [items, setItems] = React.useState(NOTIFICATIONS);
  const today = items.filter((n) => n.today);
  const earlier = items.filter((n) => !n.today);
  const unread = items.filter((n) => n.unread).length;

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, unread: false })));

  return (
    <div className="scroller" style={{ padding: '0 16px 110px', paddingTop: 64 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HexBackButton onClick={() => go('dashboard')} size={36} />
          <div>
            <div className="label" style={{ marginBottom: 4 }}>// ACTIVITY</div>
            <div className="h-bold" style={{ fontSize: 20, lineHeight: 1, color: 'var(--heading-deep)' }}>
              NOTIFICATIONS{unread > 0 && <span style={{ color: 'var(--accent)' }}> · {unread}</span>}
            </div>
          </div>
        </div>
        {unread > 0 &&
        <button onClick={markAllRead} className="mono" style={{
          all: 'unset', cursor: 'pointer', color: 'var(--accent)',
          fontSize: 10, letterSpacing: '0.1em', fontWeight: 600
        }}>MARK ALL READ</button>
        }
      </div>

      {today.length > 0 && <>
        <div className="label" style={{ margin: '4px 4px 8px' }}>// TODAY</div>
        <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
          {today.map((n) => <NotifRow key={n.id} n={n} onTap={() => go(n.kind === 'reminder' ? 'workouts' : 'notifications')} />)}
        </div>
      </>}

      {earlier.length > 0 && <>
        <div className="label" style={{ margin: '4px 4px 8px' }}>// EARLIER</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {earlier.map((n) => <NotifRow key={n.id} n={n} onTap={() => {}} />)}
        </div>
      </>}
    </div>);
}

function NotifRow({ n, onTap }) {
  const meta = NOTIF_META[n.kind] || NOTIF_META.coach;
  const Icon = meta.icon;
  return (
    <button onClick={onTap} style={{ all: 'unset', cursor: 'pointer', display: 'block' }}>
      <div className="card" style={{
        padding: 12, display: 'grid', gridTemplateColumns: '38px 1fr', gap: 12, alignItems: 'flex-start',
        borderColor: n.unread ? `color-mix(in srgb, ${meta.color} 40%, var(--line))` : 'var(--line)',
        background: n.unread ? `color-mix(in srgb, ${meta.color} 7%, var(--bg-2))` : 'var(--bg-2)'
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
            <span className="mono" style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.06em', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              {n.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, boxShadow: `0 0 5px ${meta.color}` }} />}
              {n.when.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45, marginTop: 4 }}>{n.body}</div>
        </div>
      </div>
    </button>);
}

const NOTIF_META = {
  coach:       { icon: (p) => <IconUser {...p} />,     color: 'var(--accent)' },
  pr:          { icon: (p) => <IconTrophy {...p} />,   color: 'var(--c-amber)' },
  reminder:    { icon: (p) => <IconCalendar {...p} />, color: 'var(--accent-2)' },
  achievement: { icon: (p) => <IconFlame {...p} />,    color: 'var(--c-coral)' },
  schedule:    { icon: (p) => <IconCalendar {...p} />, color: 'var(--c-blue)' },
  health:      { icon: (p) => <IconHeart {...p} />,    color: 'var(--c-pink)' },
};
