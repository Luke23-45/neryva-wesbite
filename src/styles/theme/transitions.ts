export const transitions = {
  duration: {
    fast: '160ms',
    standard: '240ms',
    complex: '480ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    precise: 'cubic-bezier(0.33, 1, 0.68, 1)',
  },
  // Pre-composed transition strings
  fast: '160ms cubic-bezier(0.2, 0, 0, 1)',
  standard: '240ms cubic-bezier(0.2, 0, 0, 1)',
  complex: '480ms cubic-bezier(0.33, 1, 0.68, 1)',
} as const;

export type Transitions = typeof transitions;
