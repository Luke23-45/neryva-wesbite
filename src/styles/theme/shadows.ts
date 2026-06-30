export const shadows = {
  sm: '0 1px 2px rgba(17, 20, 24, 0.06)',
  md: '0 2px 8px rgba(17, 20, 24, 0.08)',
  lg: '0 4px 16px rgba(17, 20, 24, 0.10)',
  focus: '0 0 0 3px rgba(36, 88, 211, 0.32)',
} as const;

export type Shadows = typeof shadows;
