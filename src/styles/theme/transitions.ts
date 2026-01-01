export const transitions = {
    // ═══════════════════════════════════════════════════════════════
    // DURATION
    // ═══════════════════════════════════════════════════════════════
    duration: {
        instant: '0ms',
        fast: '150ms',       // Micro-interactions, hovers
        normal: '300ms',     // Component transitions
        slow: '500ms',       // Page transitions, reveals
        glacial: '800ms',    // Hero animations
    },

    // ═══════════════════════════════════════════════════════════════
    // EASING CURVES
    // ═══════════════════════════════════════════════════════════════
    easing: {
        // Standard entries
        ease: 'ease',
        easeIn: 'ease-in',
        easeOut: 'ease-out',
        easeInOut: 'ease-in-out',
        linear: 'linear',

        // Custom curves - Premium feel
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',        // Material Design standard
        smoothIn: 'cubic-bezier(0.4, 0, 1, 1)',        // Accelerate
        smoothOut: 'cubic-bezier(0, 0, 0.2, 1)',       // Decelerate
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Playful bounce
        snappy: 'cubic-bezier(0.25, 0.1, 0.25, 1)',   // Quick and precise
        gentle: 'cubic-bezier(0.19, 1, 0.22, 1)',     // Soft entrance
    },

    // ═══════════════════════════════════════════════════════════════
    // PRESETS
    // ═══════════════════════════════════════════════════════════════
    preset: {
        // For hover states
        hover: '150ms cubic-bezier(0.4, 0, 0.2, 1)',

        // For component state changes
        default: '300ms cubic-bezier(0.4, 0, 0.2, 1)',

        // For enter animations
        enter: '300ms cubic-bezier(0, 0, 0.2, 1)',

        // For exit animations
        exit: '200ms cubic-bezier(0.4, 0, 1, 1)',

        // For page transitions
        page: '500ms cubic-bezier(0.4, 0, 0.2, 1)',

        // For spring-like effects
        spring: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
};
