/**
 * CSS transition tokens — Apple-curated.
 *
 * These are CSS strings for use with `transition:`. For JS-driven
 * framer-motion animations, use `src/styles/motion.ts` instead — that
 * has the spring presets.
 *
 * Curves match the motion module:
 *   expressive — cubic-bezier(0.32, 0.72, 0, 1) — content entering
 *   standard   — cubic-bezier(0.4, 0, 0.2, 1)   — generic UI
 *   precise    — cubic-bezier(0.33, 1, 0.68, 1) — decelerate
 */

export const transitions = {
  duration: {
    fast: '160ms',
    standard: '240ms',
    complex: '360ms',
    hero: '480ms',
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    expressive: 'cubic-bezier(0.32, 0.72, 0, 1)',
    precise: 'cubic-bezier(0.33, 1, 0.68, 1)',
  },
  // Pre-composed transition strings (most common usage)
  fast: '160ms cubic-bezier(0.4, 0, 0.2, 1)',
  standard: '240ms cubic-bezier(0.4, 0, 0.2, 1)',
  complex: '360ms cubic-bezier(0.32, 0.72, 0, 1)',
  hero: '480ms cubic-bezier(0.32, 0.72, 0, 1)',
} as const;

export type Transitions = typeof transitions;
