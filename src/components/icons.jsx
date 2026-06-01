import React from 'react'

// Lightweight inline SVG icons. Stroke-based, currentColor.
export const Icon = ({ d, size = 18, sw = 1.6, fill = 'none', children, viewBox = '0 0 24 24', style }) =>
  <svg width={size} height={size} viewBox={viewBox} fill={fill} stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {d ? <path d={d} /> : children}
  </svg>;

export const IconHome = (p) => <Icon {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></Icon>;
export const IconDumbbell = (p) => <Icon {...p}><path d="M2 12h2M20 12h2M6 7v10M18 7v10M9 9v6h6V9z" /></Icon>;
export const IconActivity = (p) => <Icon {...p} d="M3 12h4l3-9 4 18 3-9h4" />;
export const IconUser = (p) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></Icon>;
export const IconBell = (p) => <Icon {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8z" /><path d="M10 21a2 2 0 0 0 4 0" /></Icon>;
export const IconPlay = (p) => <Icon {...p} fill="currentColor" sw={0}><path d="M8 5v14l11-7z" /></Icon>;
export const IconPause = (p) => <Icon {...p}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></Icon>;
export const IconCheck = (p) => <Icon {...p} d="M4 12l5 5L20 6" />;
export const IconChevronRight = (p) => <Icon {...p} d="M9 6l6 6-6 6" />;
export const IconChevronLeft = (p) => <Icon {...p} d="M15 6l-6 6 6 6" />;
export const IconPlus = (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
export const IconX2 = (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>;
export const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>;
export const IconFlame = (p) => <Icon {...p}><path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 2 2 2-1z" /><path d="M6 14a6 6 0 0 0 12 0" /></Icon>;
export const IconCalendar = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></Icon>;
export const IconTrend = (p) => <Icon {...p} d="M3 17l6-6 4 4 8-8" />;
export const IconSwap = (p) => <Icon {...p}><path d="M7 4 4 7l3 3" /><path d="M4 7h11a4 4 0 0 1 4 4" /><path d="M17 20l3-3-3-3" /><path d="M20 17H9a4 4 0 0 1-4-4" /></Icon>;
export const IconMetronome = (p) => <Icon {...p}><path d="M9 3h6l3 18H6L9 3z" /><path d="M12 3v10" /><path d="M12 13l4-4" /></Icon>;
export const IconClipboard = (p) => <Icon {...p}><rect x="6" y="4" width="12" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M9 10h6M9 14h4" /></Icon>;
export const IconScale = (p) => <Icon {...p}><path d="M12 3v3" /><circle cx="12" cy="7" r="1.5" fill="currentColor" /><path d="M5 9h14l-2.5 6a3 3 0 0 1-9 0L5 9z" /><path d="M4 21h16" /></Icon>;
export const IconCamera2 = (p) => <Icon {...p}><path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L18 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="12.5" r="3.2" /></Icon>;
export const IconDoc = (p) => <Icon {...p}><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></Icon>;
export const IconHeart = (p) => <Icon {...p} d="M12 21s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z" />;
export const IconTarget = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></Icon>;
export const IconTimer = (p) => <Icon {...p}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></Icon>;
export const IconMore = (p) => <Icon {...p} fill="currentColor" sw={0}><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></Icon>;
export const IconChart = (p) => <Icon {...p}><path d="M3 21h18" /><path d="M6 17V9M11 17V5M16 17v-7M21 17v-4" /></Icon>;
export const IconBolt = (p) => <Icon {...p} fill="currentColor" sw={0}><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></Icon>;
export const IconBook = (p) => <Icon {...p}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" /><path d="M4 5v14" /><path d="M9 7h6M9 11h6" /></Icon>;
export const IconArrowUp = (p) => <Icon {...p} d="M12 19V5M5 12l7-7 7 7" />;
export const IconTrophy = (p) => <Icon {...p}><path d="M7 4h10v4a5 5 0 0 1-10 0V4z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" /><path d="M10 14.5V17M14 14.5V17M8 21h8M9 21a3 3 0 0 1 6 0" /></Icon>;
export const IconSun = (p) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>;
export const IconMoon = (p) => <Icon {...p} d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />;
export const IconBand = (p) => <Icon {...p}><path d="M4 9c0-2 2-3 4-3s4 1 4 3-2 3-4 3M12 15c0 2 2 3 4 3s4-1 4-3-2-3-4-3" /><path d="M8 9h8" /></Icon>;
export const IconLeaf = (p) => <Icon {...p}><path d="M4 20c0-9 7-16 16-16 0 9-7 16-16 16z" /><path d="M9 15c2-3 5-5 8-6" /></Icon>;
