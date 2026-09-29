export const typography = {
  fonts: {
    sans: '"IBM Plex Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
  },

  // Font sizes — desktop values; use breakpoints for mobile overrides
  sizes: {
    display: '64px',
    h1: '48px',
    h2: '34px',
    h3: '24px',
    bodyLg: '20px',
    body: '17px',
    small: '14px',
    label: '12px',
  },

  // Mobile font sizes
  sizesMobile: {
    display: '42px',
    h1: '36px',
    h2: '28px',
    h3: '22px',
    bodyLg: '18px',
    body: '16px',
    small: '14px',
    label: '12px',
  },

  lineHeights: {
    display: 1.02,
    heading: 1.12,
    h2: 1.15,
    h3: 1.25,
    bodyLg: 1.55,
    body: 1.65,
    small: 1.5,
    label: 1.25,
    compact: 1.35,
    // App-surface line heights (Agent Studio foundation pass). Marketing scale
    // above is for the light site; dense dark UI uses these two.
    appBody: 1.6,  // default UI text — collapses the 1.5/1.55/1.65 drift
    appTight: 1.3, // display / tight text — collapses the 1.0/1.4 drift
  },

  weights: {
    regular: 400,
    medium: 500,
    // True semibold. The inspector previously used 650 in 16 files — 650 is not
    // a real IBM Plex Sans weight and renders unpredictably (rounds toward 700).
    // 600 also wins by occurrences (34 vs 31). All emphasis normalizes here.
    semibold: 600,
  },

  letterSpacing: {
    normal: '0',
    label: '0.04em',
    micro: '-0.005em', // adopted micro-tightening for UI text
    tight: '-0.01em',  // display text
    wide: '0.08em',    // all-caps micro-labels
  },
} as const;

export type Typography = typeof typography;
