export const breakpoints = {
  mobile: '760px',
  tablet: '1024px',
  desktop: '1280px',
} as const;

export const containers = {
  page: '1200px',
  prose: '720px',
  wide: '1440px',
} as const;

export const media = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.tablet})`,
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
} as const;

export type Breakpoints = typeof breakpoints;
export type Containers = typeof containers;
export type Media = typeof media;
