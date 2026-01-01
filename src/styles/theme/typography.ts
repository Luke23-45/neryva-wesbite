export const typography = {
    // ═══════════════════════════════════════════════════════════════
    // FONT FAMILIES
    // ═══════════════════════════════════════════════════════════════
    fontFamily: {
        // Headings - Modern, geometric, authoritative
        heading: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

        // Body - Clean, highly legible, professional
        body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

        // Code/Data - Technical accuracy, monospace
        mono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    },

    // ═══════════════════════════════════════════════════════════════
    // FONT SIZES (Using a modular scale with 1.25 ratio)
    // ═══════════════════════════════════════════════════════════════
    fontSize: {
        '2xs': '0.625rem',    // 10px - Fine print
        xs: '0.75rem',        // 12px - Captions, meta
        sm: '0.875rem',       // 14px - Small body text
        base: '1rem',         // 16px - Default body
        md: '1.125rem',       // 18px - Large body
        lg: '1.25rem',        // 20px - Lead text
        xl: '1.5rem',         // 24px - H5
        '2xl': '1.875rem',    // 30px - H4
        '3xl': '2.25rem',     // 36px - H3
        '4xl': '3rem',        // 48px - H2
        '5xl': '3.75rem',     // 60px - H1
        '6xl': '4.5rem',      // 72px - Display
        '7xl': '6rem',        // 96px - Hero
    },

    // ═══════════════════════════════════════════════════════════════
    // FONT WEIGHTS
    // ═══════════════════════════════════════════════════════════════
    fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
    },

    // ═══════════════════════════════════════════════════════════════
    // LINE HEIGHTS
    // ═══════════════════════════════════════════════════════════════
    lineHeight: {
        none: 1,
        tight: 1.15,
        snug: 1.25,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
    },

    // ═══════════════════════════════════════════════════════════════
    // LETTER SPACING
    // ═══════════════════════════════════════════════════════════════
    letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
    },
};

// Predefined text styles for consistency
export const textStyles = {
    // ═══════════════════════════════════════════════════════════════
    // HEADING STYLES
    // ═══════════════════════════════════════════════════════════════
    displayHero: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize['7xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.lineHeight.tight,
        letterSpacing: typography.letterSpacing.tight,
    },

    displayLarge: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize['6xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.lineHeight.tight,
        letterSpacing: typography.letterSpacing.tight,
    },

    h1: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize['5xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.lineHeight.tight,
        letterSpacing: typography.letterSpacing.tight,
    },

    h2: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize['4xl'],
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.snug,
        letterSpacing: typography.letterSpacing.tight,
    },

    h3: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.snug,
    },

    h4: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.snug,
    },

    h5: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.normal,
    },

    h6: {
        fontFamily: typography.fontFamily.heading,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.normal,
    },

    // ═══════════════════════════════════════════════════════════════
    // BODY STYLES
    // ═══════════════════════════════════════════════════════════════
    bodyLarge: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.relaxed,
    },

    body: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.relaxed,
    },

    bodySmall: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.relaxed,
    },

    // ═══════════════════════════════════════════════════════════════
    // SPECIAL STYLES
    // ═══════════════════════════════════════════════════════════════
    lead: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.relaxed,
    },

    caption: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.wide,
    },

    overline: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.lineHeight.normal,
        letterSpacing: typography.letterSpacing.widest,
        textTransform: 'uppercase' as const,
    },

    code: {
        fontFamily: typography.fontFamily.mono,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.normal,
        lineHeight: typography.lineHeight.normal,
    },

    label: {
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        lineHeight: typography.lineHeight.normal,
    },
};
