/**
 * Brand voice model (C03 PLAN.md §3) — PURE, zero imports.
 *
 * Deliberately minimal: brand is a single ≤2000-char voice statement, not a
 * block system (§2 scoping). The engine contract: optional string, blank
 * omitted on the wire (NULL row), read back as '' — empty is the VALID
 * platform-default state, never an error.
 */

export const BRAND_LIMIT = 2000;

export function isBrandEmpty(text: string): boolean {
  return text.trim().length === 0;
}

/** Payload length = raw chars (what ships, what the cap counts). */
export function countBrandChars(text: string): number {
  return text.length;
}

/** Token estimate, Room parity (~chars/4), ALWAYS labeled "(est.)" at render. */
export function estimateBrandTokens(chars: number): number {
  return Math.ceil(chars / 4);
}
