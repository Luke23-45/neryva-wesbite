/**
 * ════════════════════════════════════════════════════════════════════
 * DESIGN TOKENS — Color System
 * ════════════════════════════════════════════════════════════════════
 *
 * Theme: LIGHT / WHITE.
 *
 * [CORRECTION] A previous pass of this file misread which half of the
 * original tokens was correct and flipped the background to dark navy
 * to match the surface/text/border block. That was backwards — the
 * background values were right, everything else needed to flip to
 * match a WHITE theme instead. This version does that correctly:
 * background stays white, and surface/text/border/accent-as-text/
 * gradients/overlay are all rebuilt and contrast-verified for a white
 * background, not the other way around.
 *
 * This file is built on the Tailwind "slate" gray scale (confirmed:
 * every neutral hex in the original file — #1E293B, #334155, #94A3B8,
 * #CBD5E1, #F8FAFC, #0F172A — is a stock slate-50…slate-900 value).
 * The light theme below mirrors the SAME scale, just using the light
 * end for surfaces/backgrounds and the dark end for text, instead of
 * inventing a new gray palette.
 *
 * ── WCAG contrast, calculated, not eyeballed ────────────────────────
 *   text.primary    on surface (#FFFFFF)     17.85:1   AA ✓✓
 *   text.primary    on background.secondary  17.27:1   AA ✓✓
 *   text.secondary  on surface                7.58:1   AA ✓✓
 *   text.muted      on surface                4.76:1   AA ✓✓ (normal)
 *   border          on surface                1.23:1   (not text — hairline, by design)
 *
 *   IMPORTANT — same trap as last time, caught before shipping it:
 *   the base accent/semantic hex values (teal #14B8A6, coral #F97316,
 *   success #10B981, warning #F59E0B) were tuned to read well as TEXT
 *   on a DARK surface. On WHITE, every one of them fails AA for text:
 *     teal as text on white     2.49:1  FAIL
 *     coral as text on white    2.80:1  FAIL
 *     success as text on white  2.54:1  FAIL
 *     warning as text on white  2.15:1  FAIL
 *     violet as text on white   4.23:1  PASS (large text only)
 *     error as text on white    3.76:1  PASS (large text only)
 *     info as text on white     3.68:1  PASS (large text only)
 *
 *   None of these are "close enough." Each one below now has a
 *   dedicated *Text variant — same hue, walked darker in HSL space
 *   until it actually clears 4.5:1 — for any case where the color is
 *   used as small text (links, status labels, inline warnings) on a
 *   white or near-white surface. The ORIGINAL hex values are kept
 *   unchanged for everything else: filled buttons, icon fills, large
 *   swatches, chart colors — anywhere the color IS the surface rather
 *   than text sitting on top of one, where this contrast rule doesn't
 *   apply.
 * ════════════════════════════════════════════════════════════════════
 */

export const colors = {
  // ═════════════════════════════════════════════════════════════════
  // BACKGROUND COLORS — white, as specified. Restored + reordered
  // from the original file's values, which were correct all along.
  // ═════════════════════════════════════════════════════════════════
  background: {
    primary: '#FFFFFF',    // Pure white — the page background.
    secondary: '#FBFBFD',  // Original "ceramic white" — subtle section alternation.
    tertiary: '#F4F7F9',   // Original "cool spatial gray" — structural backgrounds, code blocks.
  },

  // ═════════════════════════════════════════════════════════════════
  // SURFACE COLORS (Cards, Modals, Elevated Elements)
  // ═════════════════════════════════════════════════════════════════
  // Surface is the SAME white as background.primary on purpose — this
  // is the iOS/macOS pattern (Settings.app, Mail.app): cards don't pop
  // via a darker gray fill, they pop via a hairline border + a soft
  // shadow. Use `border` below for the hairline; add box-shadow at the
  // component level for elevation.
  surface: '#FFFFFF',          // Default surface — pure white, elevation via shadow + border
  surfaceHover: '#F8FAFC',     // slate-50 — barely-there hover tint
  surfaceActive: '#F1F5F9',    // slate-100 — slightly more visible pressed state

  // ═════════════════════════════════════════════════════════════════
  // TEXT COLORS
  // ═════════════════════════════════════════════════════════════════
  text: {
    primary: '#0F172A',    // slate-900 — main text, headings. 17.85:1 on surface.
    secondary: '#475569',  // slate-600 — body text, descriptions. 7.58:1 on surface.
    muted: '#64748B',       // slate-500 — captions, meta text. 4.76:1 on surface.
                             // [FIX] the original dark-theme value (#94A3B8 / slate-400)
                             // only manages 2.56:1 on white and would silently fail —
                             // swapped one step darker on the same scale to actually pass.
    inverse: '#F8FAFC',     // slate-50 — light text, for use on dark chips/badges/filled accent buttons
  },

  // ═════════════════════════════════════════════════════════════════
  // ACCENT COLORS — THE SIGNAL TEAL FAMILY
  // ═════════════════════════════════════════════════════════════════
  accent: {
    // Primary accent — Signal Teal (CTAs, links, highlights)
    teal: '#14B8A6',            // Use for: filled buttons, icon fills, large swatches.
    tealLight: '#5EEAD4',       // Subtle fills, muted backgrounds, chart accents
    tealDark: '#0D9488',        // Active/pressed state for filled teal buttons
    tealText: '#0F8578',        // [NEW] use for: teal LINKS or small text on white/surface.
                                 // Base teal is 2.49:1 as text on white (fails AA) — this is
                                 // the same hue walked darker until it actually clears 4.5:1.
    tealMuted: '#14B8A620',      // [NOTE] renders at 12.5% opacity, not 20% — see ALPHA NOTE

    // Secondary warm accent — used sparingly for emphasis
    coral: '#F97316',           // Use for: filled buttons, icon fills, large swatches.
    coralLight: '#FB923C',      // Subtle fills, muted backgrounds
    coralText: '#C35305',       // [NEW] use for: coral text/links on white. Base coral is
                                 // 2.80:1 as text on white (fails AA); this clears 4.61:1.
    coralMuted: '#F9731620',    // [NOTE] renders at 12.5% opacity, not 20%

    // Tertiary accent — cool complement
    violet: '#8B5CF6',          // Use for: filled buttons, icon fills, large swatches.
                                 // As text on white: 4.23:1 — passes for LARGE text only
                                 // (≥24px, or ≥19px bold). Use violetText below for small text.
    violetLight: '#A78BFA',
    violetText: '#8452F5',      // [NEW] same hue, walked to 4.66:1 — safe for small text/links too.
    violetMuted: '#8B5CF620',   // [NOTE] renders at 12.5% opacity, not 20%
  },

  // ═════════════════════════════════════════════════════════════════
  // SEMANTIC COLORS (Status, Feedback)
  // ═════════════════════════════════════════════════════════════════
  semantic: {
    success: '#10B981',         // Use for: filled badges, icon fills, large swatches.
    successLight: '#34D399',
    successText: '#0C855D',     // [NEW] success as text/labels on white. Base is 2.54:1
                                 // (fails AA); this clears 4.64:1.
    successMuted: '#10B98120',  // [NOTE] renders at 12.5% opacity, not 20%

    warning: '#F59E0B',         // Use for: filled badges, icon fills, large swatches.
    warningLight: '#FBBF24',
    warningText: '#A36907',     // [NEW] warning as text/labels on white. Base is 2.15:1
                                 // (fails AA, the worst offender) — this clears 4.58:1.
    warningMuted: '#F59E0B20',  // [NOTE] renders at 12.5% opacity, not 20%

    error: '#EF4444',           // Use for: filled badges, icon fills, large swatches/headings.
                                 // As text on white: 3.76:1 — large text only.
    errorLight: '#F87171',
    errorText: '#EB1515',       // [NEW] same hue, walked to 4.52:1 — safe for small error
                                 // copy under form fields, not just large banners.
    errorMuted: '#EF444420',    // [NOTE] renders at 12.5% opacity, not 20%

    info: '#3B82F6',            // Use for: filled badges, icon fills, large swatches.
                                 // As text on white: 3.68:1 — large text only.
    infoLight: '#60A5FA',
    infoText: '#1E6FF5',        // [NEW] same hue, walked to 4.52:1 — safe for small text.
    infoMuted: '#3B82F620',     // [NOTE] renders at 12.5% opacity, not 20%
  },

  // ═════════════════════════════════════════════════════════════════
  // BORDER COLORS
  // ═════════════════════════════════════════════════════════════════
  // White-on-white surfaces need real hairline definition — these are
  // intentionally low-contrast against `surface` (1.23:1), which is
  // correct and expected for a border, not a contrast failure to fix.
  border: '#E2E8F0',          // slate-200 — default hairline border (cards, dividers, inputs)
  borderLight: '#F1F5F9',     // slate-100 — even more subtle, internal/nested dividers
  borderAccent: '#14B8A6',    // Accent border, unchanged

  // ═════════════════════════════════════════════════════════════════
  // GRADIENT DEFINITIONS
  // ═════════════════════════════════════════════════════════════════
  gradients: {
    // Primary gradient — hero sections, important CTAs. These are
    // used as filled backgrounds (the gradient IS the surface), not
    // as text, so the original saturated hex values are correct as-is.
    primary: 'linear-gradient(135deg, #14B8A6 0%, #8B5CF6 100%)',

    // [FIX] was a dark navy gradient (#1E293B → #0F172A) meant for
    // dark-theme card backgrounds. Rebuilt for a white theme: a
    // near-imperceptible white-to-very-light-gray wash, the kind
    // Apple uses on flat cards to add just enough depth without
    // looking like a visible gradient.
    subtle: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',

    // Warm gradient — mission sections, human-focused areas. Filled
    // background use, unchanged.
    warm: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)',

    // Dark overlay — left as dark on purpose. Scrims over photography
    // (for text-on-image legibility) are conventionally dark
    // regardless of whether the surrounding UI is light or dark
    // themed — this isn't a leftover, it's a different, narrower use
    // case (image overlays, not page chrome).
    dark: 'linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, #0F172A 100%)',

    // Mesh gradient — modern premium feel.
    // ⚠️ Carried over unchanged, but flagging a real visual difference:
    // these radial layers use teal/violet/coral at 6–12.5% opacity
    // (see ALPHA NOTE). Alpha-blended onto the OLD dark navy surface,
    // saturated color at low opacity reads as a rich colored glow.
    // Alpha-blended onto WHITE, the same math produces a much paler,
    // far more washed-out tint — white desaturates low-opacity color
    // much more aggressively than dark navy does. The mesh will likely
    // look near-invisible on a white page at these opacity values.
    // Left as-is rather than guessing a replacement; worth a visual
    // check in-browser, and likely needs HIGHER opacity (try 35-50%
    // hex suffixes) to read the same way it did on dark.
    mesh: `
      radial-gradient(at 40% 20%, #14B8A620 0px, transparent 50%),
      radial-gradient(at 80% 0%, #8B5CF615 0px, transparent 50%),
      radial-gradient(at 0% 50%, #F9731610 0px, transparent 50%),
      radial-gradient(at 80% 50%, #14B8A610 0px, transparent 50%),
      radial-gradient(at 0% 100%, #8B5CF615 0px, transparent 50%)
    `,

    // Text gradient — for special headings. These two colors
    // (#5EEAD4, #A78BFA) are the *Light variants, chosen because
    // they read well as a gradient FILL behind text (background-clip:
    // text), not as flat text color. Unchanged.
    text: 'linear-gradient(135deg, #5EEAD4 0%, #A78BFA 100%)',
  },

  // ═════════════════════════════════════════════════════════════════
  // OVERLAY COLORS
  // ═════════════════════════════════════════════════════════════════
  overlay: {
    // [FIX] `light`/`medium` were rgba(248,250,252, x) — a near-white
    // tint, meant for subtle hover states ON a dark surface. Tinting
    // near-white onto a surface that's already white/near-white is
    // invisible. Swapped to a dark tint instead, which is the correct
    // direction for hover/pressed feedback on a light theme.
    light: 'rgba(15, 23, 42, 0.04)',   // Barely-there hover tint on white/light surfaces
    medium: 'rgba(15, 23, 42, 0.08)',  // More visible hover/pressed tint
    // `heavy`/`blur` are modal scrims — kept dark, same as `gradients.dark`
    // above, since backdrop scrims are conventionally dark regardless
    // of the surrounding theme.
    heavy: 'rgba(15, 23, 42, 0.8)',
    blur: 'rgba(15, 23, 42, 0.7)',
  },
};

/**
 * ════════════════════════════════════════════════════════════════════
 * ALPHA NOTE — every "*Muted" token above
 * ════════════════════════════════════════════════════════════════════
 * Unchanged from the prior audit: 8-digit hex alpha is base-16, so the
 * "20" suffix on every *Muted token renders at 12.5% opacity, not 20%
 * (32/255 ≈ 12.5%). True 20% would need suffix "33" (51/255 ≈ 20%).
 * Not auto-corrected, since it may be a deliberate look — but now that
 * these sit on white instead of dark navy, low-opacity tints will read
 * noticeably fainter than they did before (see the mesh-gradient note
 * above for the same effect at gradient scale). Worth a visual check;
 * swap "20" → "33" per token if they look too faint on white.
 * ════════════════════════════════════════════════════════════════════
 */
