export const colors = {
    // ═══════════════════════════════════════════════════════════════
    // BACKGROUND COLORS
    // ═══════════════════════════════════════════════════════════════
    background: {
        // Primary dark background - deep, sophisticated slate
        primary: '#0F172A',      // Deep Navy - Main background

        // Secondary backgrounds for sections
        secondary: '#1E293B',    // Slate Gray - Card backgrounds, elevated surfaces

        // Tertiary for subtle depth
        tertiary: '#334155',     // Mid Slate - Hover states, borders
    },

    // ═══════════════════════════════════════════════════════════════
    // SURFACE COLORS (Cards, Modals, Elevated Elements)
    // ═══════════════════════════════════════════════════════════════
    surface: '#1E293B',         // Default surface
    surfaceHover: '#334155',    // Hovered surface
    surfaceActive: '#475569',   // Active/pressed surface
    surfaceBorder: '#334155',   // Surface borders

    // ═══════════════════════════════════════════════════════════════
    // TEXT COLORS
    // ═══════════════════════════════════════════════════════════════
    text: {
        primary: '#F8FAFC',      // Titanium White - Main text, headings
        secondary: '#CBD5E1',    // Soft gray - Body text, descriptions
        muted: '#94A3B8',        // Muted Silver - Captions, meta text
        inverse: '#0F172A',      // Dark text on light backgrounds
    },

    // ═══════════════════════════════════════════════════════════════
    // ACCENT COLORS - THE SIGNAL TEAL FAMILY
    // ═══════════════════════════════════════════════════════════════
    accent: {
        // Primary accent - Signal Teal (CTAs, links, highlights)
        teal: '#14B8A6',
        tealLight: '#5EEAD4',     // Hover states, gradients
        tealDark: '#0D9488',      // Active states
        tealMuted: '#14B8A620',   // Backgrounds with transparency

        // Secondary warm accent - Used sparingly for emphasis
        coral: '#F97316',         // Warnings, important highlights
        coralLight: '#FB923C',    // Hover state
        coralMuted: '#F9731620',  // Background transparency

        // Tertiary accent - Cool complement
        violet: '#8B5CF6',        // Special highlights, innovation
        violetLight: '#A78BFA',
        violetMuted: '#8B5CF620',
    },

    // ═══════════════════════════════════════════════════════════════
    // SEMANTIC COLORS (Status, Feedback)
    // ═══════════════════════════════════════════════════════════════
    semantic: {
        success: '#10B981',       // Positive, confirmed
        successLight: '#34D399',
        successMuted: '#10B98120',

        warning: '#F59E0B',       // Attention needed
        warningLight: '#FBBF24',
        warningMuted: '#F59E0B20',

        error: '#EF4444',         // Error, critical
        errorLight: '#F87171',
        errorMuted: '#EF444420',

        info: '#3B82F6',          // Informational
        infoLight: '#60A5FA',
        infoMuted: '#3B82F620',
    },

    // ═══════════════════════════════════════════════════════════════
    // BORDER COLORS
    // ═══════════════════════════════════════════════════════════════
    border: '#334155',          // Default border
    borderLight: '#475569',     // Lighter border
    borderAccent: '#14B8A6',    // Accent border

    // ═══════════════════════════════════════════════════════════════
    // GRADIENT DEFINITIONS
    // ═══════════════════════════════════════════════════════════════
    gradients: {
        // Primary gradient - Hero sections, important CTAs
        primary: 'linear-gradient(135deg, #14B8A6 0%, #8B5CF6 100%)',

        // Subtle gradient - Backgrounds, cards
        subtle: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',

        // Warm gradient - Mission sections, human-focused areas
        warm: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',

        // Dark gradient - Overlays
        dark: 'linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, #0F172A 100%)',

        // Mesh gradient - Modern premium feel
        mesh: `
      radial-gradient(at 40% 20%, #14B8A620 0px, transparent 50%),
      radial-gradient(at 80% 0%, #8B5CF615 0px, transparent 50%),
      radial-gradient(at 0% 50%, #F9731610 0px, transparent 50%),
      radial-gradient(at 80% 50%, #14B8A610 0px, transparent 50%),
      radial-gradient(at 0% 100%, #8B5CF615 0px, transparent 50%)
    `,

        // Text gradient - For special headings
        text: 'linear-gradient(135deg, #5EEAD4 0%, #A78BFA 100%)',
    },

    // ═══════════════════════════════════════════════════════════════
    // OVERLAY COLORS
    // ═══════════════════════════════════════════════════════════════
    overlay: {
        light: 'rgba(248, 250, 252, 0.05)',
        medium: 'rgba(248, 250, 252, 0.1)',
        heavy: 'rgba(15, 23, 42, 0.8)',
        blur: 'rgba(15, 23, 42, 0.7)',
    },
};
