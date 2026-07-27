export const radii = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  round: '50%',
} as const;

export type Radii = typeof radii;
