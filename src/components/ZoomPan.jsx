import React from 'react'

// Pinch-zoom + drag-pan wrapper for the body map on mobile. Buttons are the
// reliable fallback; taps still pass through to children (a small drag is
// swallowed so panning never mis-selects).
export function ZoomPan({ children, min = 1, max = 4, height = 440 }) {
  const [t, setT] = React.useState({ s: 1, x: 0, y: 0 });
  const ptrs  = React.useRef(new Map());
  const last  = React.useRef(null);
  const pinch = React.useRef(null);
  const moved = React.useRef(false);
  const clampS = (s) => Math.min(max, Math.max(min, s));

  const down = (e) => {
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture?.(e.pointerId);
    moved.current = false;
    if (ptrs.current.size === 1) last.current = { x: e.clientX, y: e.clientY };
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), s: t.s };
    }
  };
  const move = (e) => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.current.size >= 2 && pinch.current) {
      const [a, b] = [...ptrs.current.values()];
      const s = clampS(pinch.current.s * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.dist));
      moved.current = true;
      setT(prev => ({ ...prev, s }));
    } else if (ptrs.current.size === 1 && last.current && t.s > 1) {
      const dx = e.clientX - last.current.x, dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved.current = true;
      setT(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    }
  };
  const up = (e) => {
    ptrs.current.delete(e.pointerId);
    if (ptrs.current.size < 2) pinch.current = null;
    if (ptrs.current.size === 0) last.current = null;
  };
  const clickCapture = (e) => { if (moved.current) { e.stopPropagation(); moved.current = false; } };
  const zoom = (f) => setT(prev => ({ ...prev, s: clampS(prev.s * f) }));
  const reset = () => setT({ s: 1, x: 0, y: 0 });
  const panning = ptrs.current.size > 0;

  return (
    <div style={{ position: 'relative' }}>
      <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onClickCapture={clickCapture} onDoubleClick={reset}
        style={{ overflow: 'hidden', borderRadius: 12, touchAction: 'none', height }}>
        <div style={{
          height: '100%', transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`,
          transformOrigin: '50% 50%', transition: panning ? 'none' : 'transform .12s ease',
        }}>{children}</div>
      </div>
      <div style={{ position: 'absolute', right: 8, bottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <ZBtn onClick={() => zoom(1.3)}>+</ZBtn>
        <ZBtn onClick={() => zoom(1 / 1.3)}>−</ZBtn>
        {t.s > 1 && <ZBtn onClick={reset}>⟲</ZBtn>}
      </div>
    </div>
  );
}

function ZBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      all: 'unset', cursor: 'pointer', width: 32, height: 32, borderRadius: 8,
      display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 700,
      background: 'color-mix(in srgb, var(--bg-1) 80%, transparent)', color: 'var(--text)',
      border: '1px solid var(--line-strong)', backdropFilter: 'blur(4px)',
    }}>{children}</button>
  );
}
