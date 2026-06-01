import React from 'react'
import { HexBackButton, Hex } from '../components/hex'
import { IconSun, IconMoon, IconCheck } from '../components/icons'

// Profile — simple account screen reached by tapping the initials hex.
// Change name, change email, log out.
export function Profile({ go, user, onSave, onLogout, theme, onThemeChange }) {
  const [name, setName] = React.useState(user?.name || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [dob, setDob] = React.useState(user?.dob || '');
  const [saved, setSaved] = React.useState(false);

  const dirty = name.trim() !== (user?.name || '') || email.trim() !== (user?.email || '') || dob !== (user?.dob || '');
  const initials = (name || 'U').trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();

  const save = () => {
    if (!dirty || !name.trim()) return;
    onSave({ name: name.trim(), email: email.trim(), dob });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <div className="scroller" style={{ padding: '0 16px 40px', paddingTop: 64 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0 18px' }}>
        <HexBackButton onClick={() => go('dashboard')} size={36} />
        <div>
          <div className="label" style={{ marginBottom: 4 }}>// ACCOUNT</div>
          <div className="h-bold" style={{ fontSize: 18, lineHeight: 1, color: 'var(--heading-deep)' }}>PROFILE</div>
        </div>
      </div>

      {/* Identity */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, margin: '8px 0 24px' }}>
        <Hex size={84} square style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          fontFamily: 'Orbitron', fontSize: 26, color: 'var(--on-accent)', fontWeight: 800,
          boxShadow: '0 0 calc(22px * var(--glow)) var(--accent-glow)',
        }}>{initials}</Hex>
        <div style={{ textAlign: 'center' }}>
          <div className="h-bold" style={{ fontSize: 18, color: 'var(--heading-deep)' }}>{name || '—'}</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3, letterSpacing: '0.04em' }}>{email || '—'}</div>
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: 'grid', gap: 14 }}>
        <Field label="FULL NAME">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
            style={inputStyle} />
        </Field>
        <Field label="EMAIL">
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@email.com"
            style={inputStyle} />
        </Field>
        <Field label="DATE OF BIRTH">
          <input value={dob} onChange={e => setDob(e.target.value)} type="date"
            style={inputStyle} />
        </Field>
      </div>

      {/* Appearance */}
      <div className="label" style={{ margin: '22px 0 7px' }}>// APPEARANCE</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { v: 'light', label: 'LIGHT', Icon: IconSun },
          { v: 'dark',  label: 'DARK',  Icon: IconMoon },
        ].map(opt => {
          const active = (theme || 'dark') === opt.v;
          return (
            <button key={opt.v} onClick={() => onThemeChange && onThemeChange(opt.v)} style={{
              all: 'unset', cursor: 'pointer', flex: 1,
              padding: '14px 12px', borderRadius: 12, textAlign: 'center',
              background: active ? 'var(--accent-soft)' : 'var(--bg-2)',
              border: '1px solid ' + (active ? 'var(--accent)' : 'var(--line)'),
              boxShadow: active ? '0 0 calc(10px * var(--glow)) var(--accent-glow)' : 'none',
            }}>
              <div style={{ display: 'grid', placeItems: 'center', color: active ? 'var(--accent)' : 'var(--text-3)' }}>
                <opt.Icon size={22} sw={active ? 2 : 1.6} />
              </div>
              <div className="mono" style={{
                fontSize: 11, letterSpacing: '0.14em', fontWeight: 700, marginTop: 8,
                color: active ? 'var(--accent)' : 'var(--text-2)',
              }}>{opt.label}</div>
            </button>
          );
        })}
      </div>

      {/* Save */}
      <button onClick={save} disabled={!dirty || !name.trim()} className="btn-primary"
        style={{
          width: '100%', marginTop: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          color: 'var(--heading-deep)',
          opacity: (!dirty || !name.trim()) ? 0.5 : 1,
          cursor: (!dirty || !name.trim()) ? 'not-allowed' : 'pointer',
        }}>
        {saved ? <><IconCheck size={14} /> SAVED</> : 'SAVE CHANGES'}
      </button>

      {/* Log out */}
      <button onClick={onLogout} style={{
        width: '100%', marginTop: 28,
        padding: '13px 16px', borderRadius: 12,
        background: 'transparent',
        border: '1px solid color-mix(in srgb, var(--c-coral) 45%, var(--line))',
        color: 'var(--c-coral)', cursor: 'pointer',
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 600, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        Log Out
      </button>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'var(--bg-2)',
  border: '1px solid var(--line)',
  borderRadius: 12,
  padding: '13px 14px',
  color: 'var(--text)',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 14, fontWeight: 500,
  outline: 'none',
  boxSizing: 'border-box',
};

function Field({ label, children }) {
  return (
    <div>
      <div className="label" style={{ marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  );
}
