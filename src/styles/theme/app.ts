/**
 * ════════════════════════════════════════════════════════════════════
 * DESIGN TOKENS — App Shell (dark)
 * ════════════════════════════════════════════════════════════════════
 *
 * The product apps — Agent Studio and Deployment — run on a dark,
 * precise chrome that is a distinct surface family from the light
 * marketing site. Every value the app surfaces need lives here; app
 * views must never hardcode a hex or rgba again.
 *
 * Principles:
 *   - Surfaces are near-black with layered white-alpha fills, never gray.
 *   - Depth comes from hairline borders + soft shadows, not brightness.
 *   - Text is a single hue (#e5e7eb-tinted white) stepped by alpha.
 *   - Status colorways are { fg, bg, border } triplets tuned for dark.
 *
 * Addressing: `theme.app.*` (kept out of `colors` so the light
 * marketing palette stays the only thing under `theme.colors`).
 */

export const app = {
  /** Native form controls + scrollbars render dark while an app shell is mounted. */
  colorScheme: 'dark' as const,

  /** Page-level backgrounds. */
  bg: {
    base: '#0b0d12',  // content canvas
    raised: '#0d1016', // sidebar gradient start
    deep: '#0a0c11',   // gradient end / deepest layer
  },

  /** Card/panel fills — white-alpha over the near-black base. */
  surface: {
    subtle: 'rgba(255, 255, 255, 0.02)', // panels, cards
    tint: 'rgba(255, 255, 255, 0.04)',   // wells, inputs, inactive segments
    hover: 'rgba(255, 255, 255, 0.05)',  // hover tint
    active: 'rgba(255, 255, 255, 0.08)', // pressed / emphasized fill
  },

  /** Hairlines. */
  border: {
    hairline: 'rgba(255, 255, 255, 0.04)', // internal dividers, table rows
    default: 'rgba(255, 255, 255, 0.06)',  // panels, topbars, inputs
    strong: 'rgba(255, 255, 255, 0.08)',   // emphasized edges, hover borders
    focus: 'rgba(147, 197, 253, 0.45)',    // focused input border
  },

  /** Text — one hue, stepped by alpha. */
  text: {
    primary: '#f5f7fb',                      // titles, values, key UI
    body: '#e6e9ef',                         // default body
    secondary: 'rgba(229, 231, 235, 0.72)',  // list items, secondary labels
    muted: 'rgba(229, 231, 235, 0.55)',      // subtitles, meta
    faint: 'rgba(229, 231, 235, 0.45)',      // captions, footnotes
    ghost: 'rgba(229, 231, 235, 0.40)',      // placeholders, disabled
    inverse: '#0b0d12',                      // text on light fills
    link: '#93c5fd',                         // inline links on dark
    linkHover: '#bfdbfe',                    // hover state for inline links
  },

  /** Status colorways — fg/bg/border triplets tuned for dark surfaces. */
  status: {
    success:  { fg: '#34d399', bg: 'rgba(16, 185, 129, 0.10)', border: 'rgba(16, 185, 129, 0.30)' },
    warning:  { fg: '#fbbf24', bg: 'rgba(245, 158, 11, 0.10)', border: 'rgba(245, 158, 11, 0.30)' },
    error:    { fg: '#f87171', bg: 'rgba(239, 68, 68, 0.10)',  border: 'rgba(239, 68, 68, 0.30)' },
    info:     { fg: '#93c5fd', bg: 'rgba(59, 130, 246, 0.10)', border: 'rgba(59, 130, 246, 0.30)' },
    emerald:  { fg: '#6ee7b7', bg: 'rgba(5, 227, 164, 0.10)',  border: 'rgba(5, 227, 164, 0.30)' },
    azure:    { fg: '#93c5fd', bg: 'rgba(37, 99, 235, 0.10)',  border: 'rgba(37, 99, 235, 0.30)' },
    lilac:    { fg: '#d8b4fe', bg: 'rgba(192, 132, 252, 0.10)', border: 'rgba(192, 132, 252, 0.30)' },
    amethyst: { fg: '#d8b4fe', bg: 'rgba(168, 85, 247, 0.10)', border: 'rgba(168, 85, 247, 0.30)' },
    neutral:  { fg: 'rgba(229, 231, 235, 0.75)', bg: 'rgba(255, 255, 255, 0.04)', border: 'rgba(255, 255, 255, 0.08)' },
  },

  /** App typography scale — dense UI sizes; page titles are the exception. */
  type: {
    micro: '11px',     // timestamps, kbd hints
    caption: '12px',   // labels, links, buttons
    body: '13px',      // default UI text
    bodyLg: '14px',    // emphasis, topbar titles
    title: '15px',     // panel titles
    pageTitle: '26px', // view title
    metric: '30px',    // metric card values
  },

  /** App-surface shadows (darker + softer than the light-theme set). */
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.30)',
    md: '0 4px 16px rgba(0, 0, 0, 0.35)',
    popover: '0 12px 40px rgba(0, 0, 0, 0.45)',
    drawer: '24px 0 60px rgba(0, 0, 0, 0.50)',
  },

  /** Drawer/menu scrims. */
  scrim: 'rgba(0, 0, 0, 0.55)',

  /** Scrollbar thumb fill for app surfaces. */
  scrollbar: 'rgba(255, 255, 255, 0.10)',
} as const;

export type AppTheme = typeof app;
export type AppStatusKey = keyof typeof app.status;
