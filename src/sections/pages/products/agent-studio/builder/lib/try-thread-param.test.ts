import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { readTryParam, resetTryParam, writeTryParam } from './try-thread-param';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});

describe('try-thread pointer (?try=)', () => {
  it('reads blank as absent and round-trips the pointer', () => {
    expect(readTryParam()).toBeNull();
    writeTryParam('conv-1');
    expect(readTryParam()).toBe('conv-1');
    expect(window.location.search).toContain('try=conv-1');
    // Idempotent — no history spam for the same pointer.
    const spy = vi.spyOn(window.history, 'replaceState');
    writeTryParam('conv-1');
    expect(spy).not.toHaveBeenCalled();
  });

  it('resets without touching sibling params', () => {
    window.history.replaceState(null, '', '/?agent=a1&try=conv-1');
    resetTryParam();
    expect(readTryParam()).toBeNull();
    expect(window.location.search).toContain('agent=a1');
    expect(window.location.search).not.toContain('try=');
  });
});
