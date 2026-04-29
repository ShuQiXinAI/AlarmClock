// alarm-components.jsx — shared design tokens + micro-components

const COLORS = {
  // Deep indigo-violet — primary brand
  primary:      'oklch(0.52 0.30 272)',
  primaryLight: 'oklch(0.95 0.05 272)',
  primaryDark:  'oklch(0.30 0.26 272)',
  // Vivid fuchsia — secondary accent
  accent:      'oklch(0.60 0.29 325)',
  accentLight: 'oklch(0.95 0.06 325)',
  // Hot amber — energy / danger
  danger:      'oklch(0.68 0.22 38)',
  dangerLight: 'oklch(0.96 0.06 38)',
  // Emerald teal — success
  success:      'oklch(0.65 0.20 162)',
  successLight: 'oklch(0.95 0.06 162)',
  // Amber warm
  warning:      'oklch(0.80 0.18 78)',
  warningLight: 'oklch(0.96 0.05 78)',
  // Surfaces
  bg:       'oklch(0.975 0.010 265)',
  surface:  '#ffffff',
  text:     'oklch(0.14 0.05 272)',
  textMuted:'oklch(0.52 0.07 272)',
  border:   'oklch(0.92 0.025 272)',
};

const DISMISS_METHODS = {
  math:  { label: '答题模式', emoji: '🧮', color: 'oklch(0.55 0.30 255)', desc: '做题才能解脱' },
  blink: { label: '眨眼模式', emoji: '👁️', color: 'oklch(0.58 0.29 325)', desc: '睁开你的猪眼' },
  shake: { label: '摇晃模式', emoji: '📳', color: 'oklch(0.65 0.22 38)',  desc: '摇到你清醒'   },
};

const ToggleSwitch = ({ value, onChange }) => {
  const knobOffset = value ? 20 : 2;
  return (
    <div onClick={() => onChange(!value)} style={{
      width: 44, height: 26, background: value ? COLORS.primary : '#d0cce8',
      borderRadius: 13, position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 2, left: knobOffset,
        width: 22, height: 22, background: 'white', borderRadius: '50%',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  );
};

const DismissBadge = ({ method, small }) => {
  const m = DISMISS_METHODS[method];
  if (!m) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      background: m.color + '22', color: m.color, borderRadius: 20,
      padding: small ? '2px 7px' : '3px 10px', fontSize: small ? 10 : 12, fontWeight: 700,
    }}>
      {m.emoji} {m.label}
    </span>
  );
};

const BackButton = ({ onBack, label = '返回' }) => (
  <button onClick={onBack} style={{
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 4,
    color: COLORS.primary, fontSize: 15, fontWeight: 700, padding: '8px 0',
    fontFamily: 'inherit',
  }}>
    <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
      <path d="M8 1L1 7.5L8 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {label}
  </button>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>{children}</div>
);

Object.assign(window, { COLORS, DISMISS_METHODS, ToggleSwitch, DismissBadge, BackButton, SectionLabel });
