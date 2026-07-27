import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { breakpoints, containers, media } from './breakpoints';
import { radii } from './radii';
import { shadows } from './shadows';
import { transitions } from './transitions';
import { zIndices } from './zIndices';

export const theme = {
  colors,
  typography,
  spacing,
  breakpoints,
  containers,
  media,
  radii,
  shadows,
  transitions,
  zIndices,
} as const;

export type Theme = typeof theme;
