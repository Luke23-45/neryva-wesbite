/**
 * Settings → Workspace branding helpers (console field audit, P2-13/P2-14).
 *
 * The workspace logo now round-trips the engine's `branding.logo_dataurl`
 * (PATCH /console/org/:orgId/settings, validated server-side in
 * org-settings.service.ts: merge-on-write, null/'' clears the key).
 * The old localStorage-only path is kept as a one-time migration fallback:
 * a legacy `studio.workspace.logo` entry rehydrates on mount and is synced
 * to the server on the first save after mount, then deleted.
 *
 * Brand color still has no studio-wide consumer (audit P2-14): the only
 * genuine consumer is the preview rendered on the settings page itself, so
 * the UI copy says exactly that. It round-trips `branding.brand_color` and
 * returns when a real consumer lands.
 */

/**
 * Largest logo file the console accepts. A 700 KB file becomes a ~934 KB
 * data URL — safely under Fastify's default 1 MB JSON body cap (engine
 * main.ts registers no explicit bodyLimit) and well under the engine's own
 * 2_000_000-char `branding.logo_dataurl` cap (org-settings.service.ts).
 * Do NOT raise this without raising the server's body limit first — a
 * larger logo would 413 before ever reaching validation.
 */
export const LOGO_FILE_MAX_BYTES = 700_000;

/** The only data-URL flavors the engine accepts for branding.logo_dataurl. */
export const LOGO_DATA_URL_RE = /^data:image\/(png|jpe?g|webp|svg\+xml);base64,/i;

export function isLogoDataUrl(value: unknown): value is string {
  return typeof value === 'string' && LOGO_DATA_URL_RE.test(value);
}

/** `branding.brand_color` round-trips the engine; anything else → null. */
export function resolveBrandColor(branding: Record<string, unknown>): string | null {
  const color = branding.brand_color;
  return typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color) ? color : null;
}

/**
 * Server is the source of truth; a legacy localStorage entry (pre-server-sync)
 * migrates in on the first save after mount. Server wins on conflict.
 */
export function resolveWorkspaceLogo(
  branding: Record<string, unknown>,
  legacyStored: string | null,
): string | null {
  if (isLogoDataUrl(branding.logo_dataurl)) return branding.logo_dataurl;
  return isLogoDataUrl(legacyStored) ? legacyStored : null;
}

export function readLegacyLogo(key: string): string | null {
  try {
    const stored = localStorage.getItem(key);
    return stored && stored !== '' ? stored : null;
  } catch {
    return null;
  }
}

export function clearLegacyLogo(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable — the server copy is authoritative anyway */
  }
}

/**
 * `logo: null` clears the engine key (org-settings.service.ts deletes the
 * key when the value is null or ''), so removing the logo then saving
 * genuinely deletes it server-side.
 */
export function buildBrandingPayload(
  color: string,
  logo: string | null,
): { brand_color: string; logo_dataurl: string | null } {
  return { brand_color: color, logo_dataurl: logo ?? null };
}
