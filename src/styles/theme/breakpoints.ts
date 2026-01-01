export const breakpoints = {
    xs: '320px',    // Small phones
    sm: '480px',    // Large phones
    md: '768px',    // Tablets
    lg: '1024px',   // Small laptops
    xl: '1280px',   // Laptops
    '2xl': '1536px', // Large screens
    '3xl': '1920px', // Full HD
    '4xl': '2560px', // 2K and up
};

// Media query helpers
export const media = {
    xs: `@media (min-width: ${breakpoints.xs})`,
    sm: `@media (min-width: ${breakpoints.sm})`,
    md: `@media (min-width: ${breakpoints.md})`,
    lg: `@media (min-width: ${breakpoints.lg})`,
    xl: `@media (min-width: ${breakpoints.xl})`,
    '2xl': `@media (min-width: ${breakpoints['2xl']})`,
    '3xl': `@media (min-width: ${breakpoints['3xl']})`,

    // Max-width variants for mobile-first edge cases
    maxXs: `@media (max-width: ${breakpoints.xs})`,
    maxSm: `@media (max-width: ${breakpoints.sm})`,
    maxMd: `@media (max-width: ${breakpoints.md})`,
    maxLg: `@media (max-width: ${breakpoints.lg})`,

    // Hover capability detection
    hover: '@media (hover: hover)',
    touch: '@media (hover: none)',

    // Motion preferences
    reducedMotion: '@media (prefers-reduced-motion: reduce)',
};
