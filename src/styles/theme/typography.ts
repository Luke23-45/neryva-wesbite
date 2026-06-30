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
  },

  weights: {
    regular: 400,
    medium: 500,
  },

  letterSpacing: {
    normal: '0',
    label: '0.04em',
  },
} as const;

export type Typography = typeof typography;
