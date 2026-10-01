/**
 * Purpose form model (C01 Identity) — engine binds as constants:
 * name trimmed 2–128 (`assistants.service.ts:1953`), description ≤512
 * (`schema.ts:29`). Pure: validity and the 409 one-tap-rename suggestion.
 */

export const NAME_MIN = 2;
export const NAME_MAX = 128;
export const DESCRIPTION_MAX = 512;

export function isNameValid(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= NAME_MIN && trimmed.length <= NAME_MAX;
}

/**
 * Description cap (19-24): the wire sends the trimmed description
 * (PurposeInspector sends `desc.trim()` on both create and rename), so the
 * cap counts the trimmed value — exact, never conservative-rejecting input
 * the engine would accept.
 */
export function isDescriptionValid(description: string): boolean {
  return description.trim().length <= DESCRIPTION_MAX;
}

/** One-tap rename recovery: "Billing" → "Billing 2" → "Billing 3" … — never exceeds NAME_MAX. */
export function suggestRename(name: string): string {
  const trimmed = name.trim();
  const match = /^(.*)\s(\d+)$/.exec(trimmed);
  const stem = match ? match[1] : trimmed;
  const suffix = ` ${match ? Number(match[2]) + 1 : 2}`;
  // A name already at NAME_MAX would overflow by appending — shorten the
  // stem to fit the suffix instead of producing an invalid suggestion.
  return `${stem.slice(0, NAME_MAX - suffix.length).trimEnd()}${suffix}`;
}
