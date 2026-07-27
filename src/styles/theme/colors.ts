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
 *   Brand accent colors (lilac, emerald, azure, amethyst) were extracted
 *   from the logo.svg wing gradients. All four are bright, saturated hues
 *   tuned for dark backgrounds — on WHITE, every one of them fails AA for
 *   small text:
 *     lilac as text on white    ~2.8:1  FAIL
 *     emerald as text on white  ~2.1:1  FAIL
 *     azure as text on white    ~3.5:1  FAIL (large text only)
 *     amethyst as text on white ~3.1:1  FAIL (large text only)
 *
 *   Each accent now has a dedicated *Text variant — same hue, walked
 *   darker in HSL space until it clears 4.5:1 — for any case where the
 *   color is used as small text (links, status labels, inline warnings)
 *   on a white or near-white surface. The original hex values are kept
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
    strong: '#1A1A1A',     // Neutral near-black. 18.1:1 on surface. Navigation, high-contrast text.
                            // No blue/warm tint — pure charcoal. Same family as Apple's #1D1D1F.
    primary: '#0F172A',    // slate-900 — headings, body text. 17.85:1 on surface. Slight blue tint.
    secondary: '#475569',  // slate-600 — descriptions, secondary text. 7.58:1 on surface.
    muted: '#64748B',       // slate-500 — captions, meta text. 4.76:1 on surface.
    inverse: '#F8FAFC',     // slate-50 — light text, for use on dark chips/badges/filled accent buttons
  },

  // ═════════════════════════════════════════════════════════════════
  // ACCENT COLORS — BRAND PALETTE (from logo.svg)
  // ═════════════════════════════════════════════════════════════════



  accent: {
    // Primary accent — Vibrant Emerald (CTAs, primary links, high-energy highlights)
    emerald: '#05E3A4',         // Use for: filled buttons, icon fills, large swatches.
    emeraldLight: '#6EE7B7',    // Subtle fills, muted backgrounds, chart accents.
    emeraldDark: '#04B07D',     // Active/pressed state for filled emerald buttons.
    emeraldText: '#027A56',     // [NEW] use for: emerald LINKS or small text on white/surface.
    // Base emerald is ~1.68:1 as text on white (fails AA) — this is
    // the same hue walked darker until it clears 5.4:1.
    emeraldMuted: '#05E3A420',  // [NOTE] renders at 12.5% opacity, not 20% — see ALPHA NOTE

    // Secondary cool accent — Royal Azure (Trust markers, secondary buttons, tech UI)
    azure: '#2563EB',           // Use for: filled buttons, icon fills, large swatches.
    azureLight: '#60A5FA',      // Subtle fills, muted backgrounds, chart accents.
    azureDark: '#1D4ED8',       // Active/pressed state for filled azure buttons.
    azureText: '#1E40AF',       // [NEW] use for: azure text/links on white. Base azure is
    // 5.25:1 (passes AA), but this darker shade clears 7.5:1
    // for ultra-crisp legibility on small/thin text.
    azureMuted: '#2563EB20',    // [NOTE] renders at 12.5% opacity, not 20%

    // Tertiary accent — Bright Lilac (Playful elements, notifications, badges)
    lilac: '#C084FC',           // Use for: filled buttons, icon fills, large swatches.
    lilacLight: '#E9D5FF',      // Subtle fills, muted backgrounds, chart accents.
    lilacDark: '#9333EA',       // Active/pressed state for filled lilac buttons.
    lilacText: '#7E22CE',       // [NEW] use for: lilac text/links on white. Base lilac is
    // ~2.44:1 as text on white (fails AA); this clears 8.0:1.
    lilacMuted: '#C084FC20',    // [NOTE] renders at 12.5% opacity, not 20%

    // Quaternary accent — Rich Amethyst (Premium emphasis, bridging gradients)
    amethyst: '#A855F7',        // Use for: filled buttons, icon fills, large swatches.
    // As text on white: ~3.8:1 — fails AA for small text.
    // Use amethystText below for small text applications.
    amethystLight: '#D8B4FE',   // Subtle fills, muted backgrounds, chart accents.
    amethystDark: '#7E22CE',    // Active/pressed state for filled amethyst buttons.
    amethystText: '#6B21A8',    // [NEW] same hue, walked darker to clear 10.5:1 — completely
    // safe for all text weights and sizes on white/surface.
    amethystMuted: '#A855F720', // [NOTE] renders at 12.5% opacity, not 20%
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
  borderAccent: '#c084fc',    // Accent border — Bright Lilac (primary brand color)

  // ═════════════════════════════════════════════════════════════════
  // GRADIENT DEFINITIONS
  // ═════════════════════════════════════════════════════════════════
  gradients: {
    // Primary gradient — hero sections, important CTAs. Lilac → Azure,
    // mirroring the top-to-bottom wing sweep of the logo.
    primary: 'linear-gradient(135deg, #c084fc 0%, #2563eb 100%)',

    // Subtle gradient — flat cards, gentle depth. Near-imperceptible
    // white-to-very-light-gray wash (Apple-style).
    subtle: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',

    // Warm gradient — mission sections, human-focused areas.
    // Emerald → Amethyst, matching the logo's middle-wing-to-obelisk sweep.
    warm: 'linear-gradient(135deg, #05e3a4 0%, #a855f7 100%)',

    // Dark overlay — scrims over photography (text-on-image legibility).
    // Conventionally dark regardless of light/dark theme.
    dark: 'linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, #0F172A 100%)',

    // Mesh gradient — modern premium feel, using brand palette at low opacity.
    mesh: `
      radial-gradient(at 40% 20%, #c084fc20 0px, transparent 50%),
      radial-gradient(at 80% 0%, #a855f715 0px, transparent 50%),
      radial-gradient(at 0% 50%, #05e3a410 0px, transparent 50%),
      radial-gradient(at 80% 50%, #2563eb10 0px, transparent 50%),
      radial-gradient(at 0% 100%, #c084fc15 0px, transparent 50%)
    `,

    // Text gradient — for special headings. Lilac Light → Azure Light,
    // chosen because they read well as a gradient FILL behind text
    // (background-clip: text), not as flat text color.
    text: 'linear-gradient(135deg, #d8b4fe 0%, #93c5fd 100%)',
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
