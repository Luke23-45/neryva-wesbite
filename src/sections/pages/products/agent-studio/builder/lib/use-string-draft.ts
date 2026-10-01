import { useCallback, useEffect, useState, type KeyboardEvent } from 'react';

/**
 * String-draft pattern for numeric text inputs.
 *
 * Problem it solves: parse-on-keystroke (`Number(raw)` in `onChange`) cannot
 * survive intermediate typing states — typing "0.9" passes through "0." which
 * `Number()` coerces to 0, snapping the field and swallowing the "."; "abc"
 * becomes NaN which renders literally (the `?? ''` fallback only catches
 * null/undefined, not NaN); and backspacing a NaN field is impossible because
 * every intermediate re-parses to NaN.
 *
 * This hook holds the raw text in local state while typing. The committed
 * numeric value only changes on explicit commit (blur or Enter):
 * - Empty string commits to `undefined` (clears the value and its validation).
 * - A string that parses to a finite number commits that number.
 * - Anything else is rejected: the draft reverts to the last committed value
 *   and the caller is notified via `onInvalid` (for an inline message).
 * Escape reverts the draft without committing.
 *
 * The committed value never holds NaN — NaN cannot be typed, pasted, or
 * committed through this hook.
 */
export function useStringDraft(
  committed: number | undefined,
  onCommit: (value: number | undefined) => void,
  options?: {
    /** Format the committed value for display (default: String(value)). */
    format?: (value: number) => string;
    /** Called when a non-empty draft fails to parse (for inline messaging). */
    onInvalid?: (raw: string) => void;
  },
): {
  /** The text to render in the input (draft while focused, committed otherwise). */
  value: string;
  onChange: (raw: string) => void;
  onBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
} {
  const format = options?.format ?? String;
  const [draft, setDraft] = useState<string | null>(null);

  // If the committed value changes from outside (e.g. reset, remote update),
  // drop any in-progress draft so the field reflects the new truth.
  useEffect(() => {
    setDraft(null);
  }, [committed]);

  const commit = useCallback(() => {
    // Blur/Enter with no in-progress draft (plain tab-through) must not
    // touch the committed value — only an actual edit commits. Without this
    // guard, merely focusing and leaving a field would clear it (empty draft
    // commits `undefined`).
    if (draft === null) return;
    const raw = draft.trim();
    if (raw === '') {
      onCommit(undefined);
    } else {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        onCommit(parsed);
      } else {
        options?.onInvalid?.(raw);
      }
    }
    setDraft(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, onCommit]);

  return {
    value: draft ?? (committed === undefined ? '' : format(committed)),
    onChange: (raw: string) => setDraft(raw),
    onBlur: commit,
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.currentTarget.blur();
      } else if (event.key === 'Escape') {
        setDraft(null);
        event.currentTarget.blur();
      }
    },
  };
}
