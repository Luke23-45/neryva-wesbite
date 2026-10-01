import { useCallback, useEffect, useState } from 'react';

/**
 * Per-section confirmation tracking (C-BUG4/M-BUG3, Option A).
 *
 * Problem: the honest-markers system grades on user-authored content, not
 * default values. A user can review a section, save it with defaults, and
 * still see "Not configured" — misleading, because they DID configure it
 * (they reviewed and confirmed the defaults).
 *
 * Solution: track explicit per-section confirmation. When a section's Save
 * succeeds, mark it confirmed. The projector treats confirmed sections as
 * `ready` (with values subtitle) even when the policy matches engine defaults.
 *
 * Persistence: localStorage per-agent. This is UI state (like the guided
 * setup progress), not agent data — it doesn't belong in the engine.
 * If the user clears storage or switches devices, sections revert to
 * content-based grading (safe default: "Not configured" for untouched).
 *
 * The confirmation is set on SAVE SUCCESS, not on save attempt. A failed
 * save (validation error, 412 conflict, network error) does not confirm.
 */

const STORAGE_PREFIX = 'neryva:section-confirmed:';

function storageKey(assistantId: string): string {
  return `${STORAGE_PREFIX}${assistantId}`;
}

function readConfirmed(assistantId: string | null): Set<string> {
  if (!assistantId || typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(storageKey(assistantId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export function useSectionConfirmation(assistantId: string | null): {
  /** Section IDs the user has explicitly saved/confirmed. */
  confirmed: Set<string>;
  /** Mark a section as confirmed (call on save success). */
  confirm: (sectionId: string) => void;
} {
  const [confirmed, setConfirmed] = useState<Set<string>>(() => readConfirmed(assistantId));

  // If the agent changes, reload from storage.
  useEffect(() => {
    setConfirmed(readConfirmed(assistantId));
  }, [assistantId]);

  const confirm = useCallback(
    (sectionId: string) => {
      if (!assistantId) return;
      setConfirmed((prev) => {
        if (prev.has(sectionId)) return prev;
        const next = new Set(prev);
        next.add(sectionId);
        try {
          localStorage.setItem(storageKey(assistantId), JSON.stringify([...next]));
        } catch {
          // Storage full or unavailable — the in-memory set still works
          // for this session; grading degrades gracefully.
        }
        return next;
      });
    },
    [assistantId],
  );

  return { confirmed, confirm };
}
