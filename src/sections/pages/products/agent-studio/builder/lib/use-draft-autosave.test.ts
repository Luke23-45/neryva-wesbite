// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDraftAutosave, type DraftAutosaveGates } from './use-draft-autosave';
import { AUTOSAVE_MS } from './draft-save';

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
