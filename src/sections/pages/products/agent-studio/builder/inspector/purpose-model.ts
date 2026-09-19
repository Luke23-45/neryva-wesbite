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

export function isDescriptionValid(description: string): boolean {
  return description.length <= DESCRIPTION_MAX;
}

/** One-tap rename recovery: "Billing" → "Billing 2" → "Billing 3" … */
export function suggestRename(name: string): string {
  const match = /^(.*)\s(\d+)$/.exec(name.trim());
  if (match) {
    return `${match[1]} ${Number(match[2]) + 1}`;
  }
  return `${name.trim()} 2`;
}
