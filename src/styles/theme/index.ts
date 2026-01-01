import { colors } from './colors';
import { typography, textStyles } from './typography';
import { spacing, spacingAliases } from './spacing';
import { radii } from './radii';
import { shadows } from './shadows';
import { breakpoints, media } from './breakpoints';
import { transitions } from './transitions';
import { zIndices } from './zIndices';
import { motionConfig } from './animations';

export const theme = {
    colors,
    typography,
    textStyles,
    spacing: { ...spacing, ...spacingAliases },
    radii,
    shadows,
    breakpoints,
    media,
    transitions,
    zIndices,
    animations: motionConfig,

    // Semantic shortcuts
    sizes: {
        maxWidth: '1280px',
        maxWidthWide: '1536px',
        maxWidthNarrow: '768px',
        navHeight: '80px',
        navHeightMobile: '64px',
        footerHeight: '400px',
    },
};

export type Theme = typeof theme;
