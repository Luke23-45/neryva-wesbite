// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDraftAutosave, useManualSaveSignal, type DraftAutosaveGates } from './use-draft-autosave';
import { AUTOSAVE_MS } from './draft-save';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => {
  const base = vi.fn();
  return { default: Object.assign(base, { success: vi.fn(), error: vi.fn() }) };
});

const toastError = vi.mocked(toast.error);
const toastBase = vi.mocked(toast);

/**
 * A2-23 regression: inspector sections unmount when the user switches
 * sections. Edits typed inside the 8s debounce window used to die with the
 * unmounted component (the effect cleanup cancelled the timer) while the
 * top bar reported "Saved". The shared hook must flush on unmount.
 */
function shippable(overrides: Partial<DraftAutosaveGates> = {}): DraftAutosaveGates {
  return {
    canAuthor: true,
    dirty: true,
    blocked: false,
    conflict: null,
    adoptingActive: false,
    pending: false,
    definition: { model: 'openai/gpt-4o-mini' },
    ...overrides,
  };
}

describe('useDraftAutosave (A2-23)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('flushes a pending dirty edit on unmount instead of dropping it', () => {
    const doSave = vi.fn();
    const { unmount } = renderHook(() => useDraftAutosave(shippable(), doSave, ['draft-content']));
    // Unmount well inside the debounce window — the timer never fired.
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(doSave).not.toHaveBeenCalled();
    unmount();
    expect(doSave).toHaveBeenCalledTimes(1);
  });

  it('still debounces while mounted: one save per settled window', () => {
    const doSave = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ gates, content }) => useDraftAutosave(gates, doSave, [content]),
      { initialProps: { gates: shippable(), content: 'a' } },
    );
    // Keystrokes restart the countdown.
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    rerender({ gates: shippable(), content: 'ab' });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(doSave).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(doSave).toHaveBeenCalledTimes(1);
    // The save landed: parent clears dirty (definition converges), so the
    // unmount must not fire a duplicate.
    rerender({ gates: shippable({ dirty: false }), content: 'ab' });
    unmount();
    expect(doSave).toHaveBeenCalledTimes(1);
  });

  it('does not flush when a save is already in flight', () => {
    const doSave = vi.fn();
    const { unmount } = renderHook(() => useDraftAutosave(shippable({ pending: true }), doSave, ['x']));
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    unmount();
    expect(doSave).not.toHaveBeenCalled();
  });

  it.each([
    ['blocked content', shippable({ blocked: true })],
    ['clean state', shippable({ dirty: false })],
    ['open conflict dialog', shippable({ conflict: { serverHash: 'a', localHash: 'b' } })],
    ['mid-adopt', shippable({ adoptingActive: true })],
    ['no definition loaded', shippable({ definition: null })],
  ])('does not flush on unmount when %s', (_label, gates) => {
    const doSave = vi.fn();
    const { unmount } = renderHook(() => useDraftAutosave(gates, doSave, ['x']));
    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_MS + 1000);
    });
    expect(doSave).not.toHaveBeenCalled();
    unmount();
    expect(doSave).not.toHaveBeenCalled();
  });
});

describe('useManualSaveSignal (loud held saves)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function hold(overrides: Record<string, unknown> = {}) {
    return {
      canAuthor: true,
      blocked: false as boolean | null | undefined,
      conflict: null as unknown,
      pending: false,
      holdReason: () => 'Trim to save.',
      ...overrides,
    };
  }

  it('does nothing while the signal is 0', () => {
    const doSave = vi.fn();
    renderHook(() => useManualSaveSignal(0, doSave, hold({ blocked: true })));
    expect(doSave).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('fires doSave on an explicit signal when nothing holds it', () => {
    const doSave = vi.fn();
    const { rerender } = renderHook(({ signal }) => useManualSaveSignal(signal, doSave, hold()), {
      initialProps: { signal: 0 },
    });
    rerender({ signal: 1 });
    expect(doSave).toHaveBeenCalledTimes(1);
    expect(toastError).not.toHaveBeenCalled();
  });

  it('does not fire on mount when the signal predates the mount (stale signal from an earlier section)', () => {
    // The counter survives section switches (AgentBuilder owns it). A
    // section mounting after N saves must not treat the pre-existing value
    // as a fresh save intent — that spontaneous PUT raced the previous
    // section's in-flight draft-write with a stale If-Match and raised a
    // false 412 ("Someone saved first") with no user-initiated save.
    const doSave = vi.fn();
    renderHook(() => useManualSaveSignal(3, doSave, hold()));
    expect(doSave).not.toHaveBeenCalled();
    expect(toastBase).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('fires only for a signal increment that happens while mounted', () => {
    const doSave = vi.fn();
    const { rerender } = renderHook(({ signal }) => useManualSaveSignal(signal, doSave, hold()), {
      initialProps: { signal: 2 },
    });
    // Mount with a pre-existing value: no spontaneous save.
    expect(doSave).not.toHaveBeenCalled();
    // A genuine increment while mounted: fires exactly once.
    rerender({ signal: 3 });
    expect(doSave).toHaveBeenCalledTimes(1);
    // Re-render with the same value: no duplicate.
    rerender({ signal: 3 });
    expect(doSave).toHaveBeenCalledTimes(1);
  });

  it('toasts the hold reason instead of silently swallowing a held save', () => {
    const doSave = vi.fn();
    const { rerender } = renderHook(({ signal }) => useManualSaveSignal(signal, doSave, hold({ blocked: true })), {
      initialProps: { signal: 0 },
    });
    rerender({ signal: 1 });
    expect(doSave).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledWith('Trim to save.');
  });

  it('falls back to a generic message when no reason is provided', () => {
    const doSave = vi.fn();
    const { rerender } = renderHook(
      ({ signal }) => useManualSaveSignal(signal, doSave, hold({ blocked: true, holdReason: () => null })),
      { initialProps: { signal: 0 } },
    );
    rerender({ signal: 1 });
    expect(doSave).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('held'));
  });

  it('stays quiet when an unresolved conflict dialog is open', () => {
    const doSave = vi.fn();
    const { rerender } = renderHook(
      ({ signal }) => useManualSaveSignal(signal, doSave, hold({ blocked: true, conflict: { open: true } })),
      { initialProps: { signal: 0 } },
    );
    rerender({ signal: 1 });
    expect(doSave).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });

  it('coalesces the manual signal while a save is in flight instead of firing a duplicate PUT (G-BUG7)', () => {
    const doSave = vi.fn();
    const { rerender } = renderHook(({ signal }) => useManualSaveSignal(signal, doSave, hold({ pending: true })), {
      initialProps: { signal: 0 },
    });
    rerender({ signal: 1 });
    // No duplicate PUT — the in-flight save already covers the edits.
    expect(doSave).not.toHaveBeenCalled();
    // …but never silent: the hold is announced, not swallowed.
    expect(toastBase).toHaveBeenCalledTimes(1);
    expect(toastBase).toHaveBeenCalledWith(expect.stringContaining('already in progress'));
    expect(toastError).not.toHaveBeenCalled();
  });

  it('fires the manual signal once the in-flight save settles', () => {
    const doSave = vi.fn();
    const { rerender } = renderHook(
      ({ signal, pending }) => useManualSaveSignal(signal, doSave, hold({ pending })),
      { initialProps: { signal: 0, pending: true } },
    );
    rerender({ signal: 1, pending: true });
    expect(doSave).not.toHaveBeenCalled();
    rerender({ signal: 2, pending: false });
    expect(doSave).toHaveBeenCalledTimes(1);
  });
});

/**
 * P2 flow-chrome: closing the tab inside the 8s autosave window silently
 * lost edits — React never runs the unmount cleanup on page unload. The
 * pagehide/beforeunload flush below reuses the exact unmount-flush gates
 * (no duplicated logic), so a tab close persists instead of discarding.
 */
describe('useDraftAutosave tab-close flush', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function pagehide() {
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
  }

  function beforeunload() {
    act(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });
  }

  it('flushes a pending dirty edit on pagehide (tab close)', () => {
    const doSave = vi.fn();
    const { unmount } = renderHook(() => useDraftAutosave(shippable(), doSave, ['x']));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(doSave).not.toHaveBeenCalled();
    pagehide();
    expect(doSave).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('dedupes beforeunload + pagehide into a single flush (no G-BUG7 duplicate PUT)', () => {
    const doSave = vi.fn();
    const { unmount } = renderHook(() => useDraftAutosave(shippable(), doSave, ['x']));
    // Desktop tab close fires both events for the same unload.
    beforeunload();
    pagehide();
    expect(doSave).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('re-arms on pageshow so a second close after bfcache restore still flushes', () => {
    const doSave = vi.fn();
    const { unmount } = renderHook(() => useDraftAutosave(shippable(), doSave, ['x']));
    pagehide();
    expect(doSave).toHaveBeenCalledTimes(1);
    act(() => {
      window.dispatchEvent(new Event('pageshow'));
    });
    pagehide();
    expect(doSave).toHaveBeenCalledTimes(2);
    unmount();
  });

  it.each([
    ['blocked content', shippable({ blocked: true })],
    ['clean state', shippable({ dirty: false })],
    ['in-flight save', shippable({ pending: true })],
    ['open conflict dialog', shippable({ conflict: { serverHash: 'a', localHash: 'b' } })],
    ['no definition loaded', shippable({ definition: null })],
  ])('does not flush on pagehide when %s', (_label, gates) => {
    const doSave = vi.fn();
    const { unmount } = renderHook(() => useDraftAutosave(gates, doSave, ['x']));
    pagehide();
    expect(doSave).not.toHaveBeenCalled();
    unmount();
  });
});
