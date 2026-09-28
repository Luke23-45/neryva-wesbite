/**
 * Shared draft autosave (A2-23) — the single 8s debounce every inspector
 * section writes through, plus the unmount flush the bug required.
 *
 * Root cause it fixes: each section owned its edits in local component state
 * with an 8-second debounced save, and only the selected section stays
 * mounted. Switching sections unmounted the editor, the effect cleanup
 * cancelled the pending timer, and the edits died silently — while the top
 * bar kept reporting "Saved". The flush below makes a section switch persist
 * instead of discard, under the exact same gates as the timer.
 */
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { AUTOSAVE_MS } from './draft-save';

export interface DraftAutosaveGates {
  canAuthor: boolean;
  /** Local edits differ from the last loaded definition. */
  dirty: boolean;
  /** Shippability gate — unshippable content must never be written. */
  blocked: boolean | null | undefined;
  /** Truthy while an unresolved 412 merge-or-reload dialog is open. */
  conflict: unknown;
  /** Truthy while adopting a refetched draft as the save target. */
  adoptingActive: boolean | null | undefined;
  /** A save mutation is already in flight. */
  pending: boolean;
  /** The draft definition prop is loaded. */
  definition: unknown;
}

function shippable(g: DraftAutosaveGates): boolean {
  return (
    !!g.canAuthor && !!g.dirty && !g.blocked && !g.conflict && !g.adoptingActive && !g.pending && !!g.definition
  );
}

/**
 * Debounced draft save shared by every inspector section.
 *
 * @param gates   the save gates (same semantics the eight sections inlined)
 * @param doSave  the section's save callback (POST-or-PUT with 409/412 handling)
 * @param resetDeps values that restart the debounce countdown (the section's
 *                  draft content, e.g. `composed` / `current`)
 */
export function useDraftAutosave(
  gates: DraftAutosaveGates,
  doSave: () => void,
  resetDeps: readonly unknown[] = [],
): void {
  const latest = useRef({ gates, doSave });
  latest.current = { gates, doSave };

  const { canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition } = gates;

  // While mounted: debounce the save. Reading doSave through the ref keeps
  // the timer firing the latest closure even if the callback identity lags
  // the effect's dependency snapshot.
  useEffect(() => {
    if (!shippable({ canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition })) return;
    const timer = window.setTimeout(() => {
      latest.current.doSave();
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
    // resetDeps restarts the countdown on content change; doSave rides the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition, ...resetDeps]);

  // On unmount only (empty deps): flush a pending dirty edit instead of
  // dropping it. Section switches unmount the editor — without this, edits
  // typed inside the debounce window never reached the API. Effect re-runs
  // must NOT flush (that would defeat the debounce); only the unmount does.
  useEffect(() => {
    return () => {
      const { gates: g, doSave: save } = latest.current;
      if (!shippable(g)) return;
      save();
    };
  }, []);
}

/**
 * Manual-save signal (topbar Save button / Ctrl+S / ⌘S) shared by every
 * inspector section. Routes through the section's doSave, but never fails
 * silently: when the save is held, the exact reason toasts instead of the
 * click being swallowed. (A held save + card switch used to look like "save
 * is not working" — the user clicked Save, nothing happened, and the next
 * card showed the old text with no explanation.)
 */
export function useManualSaveSignal(
  saveSignal: number,
  doSave: () => void,
  hold: {
    canAuthor: boolean;
    blocked: boolean | null | undefined;
    conflict: unknown;
    /** Human reason for the hold, surfaced when the user explicitly saves. */
    holdReason: () => string | null;
  },
): void {
  const latest = useRef({ doSave, hold });
  // Written in an effect (not during render): the firing effect below runs
  // after this one on every commit, so it always sees the current closure.
  useEffect(() => {
    latest.current = { doSave, hold };
  });
  useEffect(() => {
    if (saveSignal <= 0) return;
    const { doSave: save, hold: h } = latest.current;
    // Mirrors doSave's own guards: nothing to do when unauthorized, and an
    // open 412 dialog already explains itself — no toast on top of it.
    if (!h.canAuthor || h.conflict) return;
    if (h.blocked) {
      toast.error(h.holdReason() ?? 'Save is held — fix the issue above and try again.');
      return;
    }
    save();
  }, [saveSignal]);
}
