/**
 * ════════════════════════════════════════════════════════════════════
 *  MOTION FOUNDATION — Apple-grade spring & easing presets.
 * ════════════════════════════════════════════════════════════════════
 *
 *  All animations in the studio resolve through these presets. Single
 *  source of truth — never inline a `stiffness` or `damping` value.
 *
 *  Naming mirrors Apple's HIG motion categories:
 *    snap      — fast, decisive (button presses, tab switches)
 *    spring    — default for content appearing (cards, panels)
 *    gentle    — large surfaces (modals, sheets, sidebars)
 *    bouncy    — feedback interactions (toggles, badge counts)
 *    exit      — symmetric to spring, for exits
 *
 *  Easing curves come from Apple's reference:
 *    expressive — cubic-bezier(0.32, 0.72, 0, 1)  content entering/leaving
 *    standard   — cubic-bezier(0.4, 0, 0.2, 1)    generic UI motion
 *    precise    — cubic-bezier(0.33, 1, 0.68, 1)  decelerate-only
 * ════════════════════════════════════════════════════════════════════
 */

import type { Transition, Variants } from 'framer-motion';

// ─── Easing tokens ───────────────────────────────────────────────────
export const ease = {
  /** Cubic-bezier(0.32, 0.72, 0, 1) — Apple's expressive default. */
  expressive: [0.32, 0.72, 0, 1] as const,
  /** Cubic-bezier(0.4, 0, 0.2, 1) — Material's standard, also used by Apple for generic motion. */
  standard: [0.4, 0, 0.2, 1] as const,
  /** Cubic-bezier(0.33, 1, 0.68, 1) — decelerate, precise. */
  precise: [0.33, 1, 0.68, 1] as const,
  /** Cubic-bezier(0.16, 1, 0.3, 1) — "premium ease", our landing-page signature. */
  premium: [0.16, 1, 0.3, 1] as const,
};

// ─── Spring presets ──────────────────────────────────────────────────
export const spring = {
  /** Snappy, decisive — button presses, tab indicators, dot pulses. */
  snap: { type: 'spring' as const, stiffness: 480, damping: 32, mass: 0.8 },
  /** Default for content appearing — cards, panels, popovers. */
  spring: { type: 'spring' as const, stiffness: 260, damping: 26, mass: 0.9 },
  /** Large surfaces — modals, sheets, sidebars. Slightly slower, heavier. */
  gentle: { type: 'spring' as const, stiffness: 220, damping: 28, mass: 1.05 },
  /** Feedback interactions — toggles, badge counts. Slight overshoot. */
  bouncy: { type: 'spring' as const, stiffness: 340, damping: 22, mass: 0.8 },
  /** Symmetric exit — used for content leaving, matches spring above. */
  exit: { type: 'spring' as const, stiffness: 240, damping: 30, mass: 1 },
};

// ─── Common transitions (non-spring) ─────────────────────────────────
export const t = {
  /** 160ms — hover, focus rings. */
  fast: { duration: 0.16, ease: ease.standard } satisfies Transition,
  /** 240ms — generic UI motion. */
  base: { duration: 0.24, ease: ease.standard } satisfies Transition,
  /** 360ms — large surfaces entering. */
  slow: { duration: 0.36, ease: ease.expressive } satisfies Transition,
  /** 480ms — hero reveals, hero-stagger. */
  hero: { duration: 0.48, ease: ease.expressive } satisfies Transition,
};

// ─── Stagger orchestrator (the "fadeUp" pattern, used everywhere) ────
/**
 * Build a staggered fade-up container with Apple-style spring children.
 *
 *   const v = fadeUp({ delay: 0.05, distance: 10 });
 *   <motion.div variants={v} initial="hidden" animate="visible" custom={0}>
 *
 * `custom` is the child's index — children with higher `custom` get
 * larger delays. Pass `0` for the parent if you want it to fade in too.
 */
export function fadeUp(opts: { delay?: number; distance?: number; stagger?: number } = {}) {
  const { delay = 0, distance = 12, stagger = 0.04 } = opts;
  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: { ...spring.spring, delay: 0 },
    },
  };
  return { container, item };
}

/** Simple iOS-style tap-down + lift interaction. */
export const tap = {
  whileTap: { scale: 0.97 },
  transition: spring.snap,
};

/** Hover-and-lift (cards, tiles). */
export const lift = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.985 },
  transition: spring.snap,
};

// ─── App page reveal ──────────────────────────────────────────────────
/**
 * Standard dashboard page entrance: fade-up with the premium ease,
 * staggered by index. Pass the element's order as `custom`.
 *
 *   <motion.div variants={pageItem} initial="hidden" animate="visible" custom={0}>
 */
export const pageItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: ease.premium, delay: 0.05 + i * 0.06 },
  }),
};
