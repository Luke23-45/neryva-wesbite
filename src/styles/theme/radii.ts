/**
 * Radii — Apple-style "squircle" scale.
 *
 * Apple uses a tighter corner radius curve than the classic 4/8/12/16
 * progression. Their reference scale (from the iOS/macOS HIG and recent
 * design refreshes):
 *   4 — chips, small tags
 *   8 — inline controls, list rows
 *   10 — buttons, inputs
 *   12 — popovers, dropdowns
 *   14 — cards
 *   16 — panels, large surfaces
 *   20 — sheets, modals
 *   28 — hero surfaces, full-screen sheets
 *
 * Keep the old `sm/md/lg/xl/round` aliases for backwards compatibility
 * with existing components.
 */

export const radii = {
  xs: '4px',
  sm: '8px',
  md: '10px',
  lg: '12px',
  xl: '14px',
  '2xl': '16px',
  '3xl': '20px',
  '4xl': '28px',
  pill: '999px',
  round: '50%',
  // Backwards-compatible aliases — already used throughout the studio.
  legacy: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    round: '50%',
  },
} as const;

export type Radii = typeof radii;
