/**
 * Brand voice model — PURE (imports only the shared modal-block parsers).
 *
 * Brand is one modal text block ({ mode, content }), the same block
 * vocabulary as Role text fields (raw | markdown | json — role-fields.ts
 * is the single parser). The engine contract: optional block, blank
 * omitted on the wire (NULL row), read back as absent — empty is the
 * VALID platform-default state, never an error. Caps apply to the PARSED
 * value (mode is not content).
 */

import {
  parseRoleTextField,
  readRoleBlock,
  type RoleFieldBlock,
  type RoleFieldMode,
} from '@lib/engine/role-fields';

export const BRAND_LIMIT = 2000;

/** Brand voice — one modal text field. Absent = platform default. */
export type BrandVoice = RoleFieldBlock;

export type BrandMode = RoleFieldMode;

export const BRAND_MODES: readonly BrandMode[] = ['raw', 'markdown', 'json'] as const;

/** Lenient block read: garbage → undefined (never a guess). */
export function readBrandBlock(value: unknown): BrandVoice | undefined {
  return readRoleBlock(value);
}

/** True when the block is absent or blank (blank in any mode — a JSON
 * `"\"\""` parses to the empty string, which is blank). Unparseable content
 * is NOT empty: the user typed something, the caps layer flags the parse
 * failure, and the empty state must not hide their content. */
export function isBrandEmpty(value: unknown): boolean {
  const block = readBrandBlock(value);
  if (block === undefined) return true;
  const parsed = parseRoleTextField(block);
  return parsed !== undefined && parsed.trim() === '';
}

/**
 * Parsed voice text, or undefined when absent / blank / unparseable
 * (lenient — the engine is the authority and 400s on save).
 */
export function parseBrandVoice(value: unknown): string | undefined {
  const block = readBrandBlock(value);
  const parsed = block ? parseRoleTextField(block) : undefined;
  if (parsed === undefined) return undefined;
  const text = parsed.trim();
  return text === '' ? undefined : text;
}

/** Parsed voice text, '' when absent / blank / unparseable (never undefined). */
export function parseBrandTextField(value: unknown): string {
  return parseBrandVoice(value) ?? '';
}

/** True when the block holds a parseable, non-blank voice. */
export function brandVoiceHasValue(value: unknown): boolean {
  return parseBrandVoice(value) !== undefined;
}

/** Cap chars = PARSED chars — the engine's brandSchema measures the parsed
 * value (mode is not content). Unparseable reads as 0 here; the caps
 * layer reports the parse failure as its own issue. */
export function countBrandChars(value: unknown): number {
  const block = readBrandBlock(value);
  const parsed = block ? parseRoleTextField(block) : undefined;
  return parsed === undefined ? 0 : parsed.length;
}

/** Token estimate, Room parity (~chars/4), ALWAYS labeled "(est.)" at render. */
export function estimateBrandTokens(chars: number): number {
  return Math.ceil(chars / 4);
}

/** Default mode for a fresh brand block (matches Role text fields). */
export function defaultBrandMode(): BrandMode {
  return 'raw';
}
