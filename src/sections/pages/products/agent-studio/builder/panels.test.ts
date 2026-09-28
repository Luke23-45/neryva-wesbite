// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  clampWidth,
  loadPanelLayout,
  savePanelLayout,
  PALETTE_LIMITS,
  INSPECTOR_LIMITS,
  DEFAULT_LAYOUT,
  STORAGE_KEY,
  type PanelLayout,
} from './panels';

const LAYOUT: PanelLayout = {
  paletteWidth: 320,
  inspectorWidth: 420,
  paletteCollapsed: true,
  inspectorCollapsed: false,
};

describe('clampWidth (T15)', () => {
  it('passes through values within the limits', () => {
    expect(clampWidth(300, PALETTE_LIMITS)).toBe(300);
    expect(clampWidth(500, INSPECTOR_LIMITS)).toBe(500);
  });

  it('clamps below the minimum', () => {
    expect(clampWidth(100, PALETTE_LIMITS)).toBe(PALETTE_LIMITS.min);
  });

  it('clamps above the maximum', () => {
    expect(clampWidth(900, PALETTE_LIMITS)).toBe(PALETTE_LIMITS.max);
  });

  it('returns the default for non-finite input', () => {
    expect(clampWidth(NaN, PALETTE_LIMITS)).toBe(PALETTE_LIMITS.default);
    expect(clampWidth(Infinity, INSPECTOR_LIMITS)).toBe(INSPECTOR_LIMITS.default);
  });

  it('never lets the inspector below 300px — its forms are the densest surface', () => {
    expect(clampWidth(250, INSPECTOR_LIMITS)).toBe(300);
    expect(clampWidth(299.9, INSPECTOR_LIMITS)).toBe(300);
    expect(clampWidth(INSPECTOR_LIMITS.min, INSPECTOR_LIMITS)).toBe(300);
  });
});

describe('loadPanelLayout (T15)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns defaults on empty storage', () => {
    expect(loadPanelLayout()).toEqual(DEFAULT_LAYOUT);
  });

  it('returns defaults on corrupt JSON', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadPanelLayout()).toEqual(DEFAULT_LAYOUT);
  });

  it('returns defaults for non-object payloads', () => {
    window.localStorage.setItem(STORAGE_KEY, '42');
    expect(loadPanelLayout()).toEqual(DEFAULT_LAYOUT);
  });

  it('loads a persisted valid state', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(LAYOUT));
    expect(loadPanelLayout()).toEqual(LAYOUT);
  });

  it('falls back per-field for out-of-range widths and non-boolean flags', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        paletteWidth: 10, // below min → default
        inspectorWidth: 9999, // above max → default
        paletteCollapsed: 'yes', // not a boolean → false
        inspectorCollapsed: true,
      }),
    );
    expect(loadPanelLayout()).toEqual({
      paletteWidth: PALETTE_LIMITS.default,
      inspectorWidth: INSPECTOR_LIMITS.default,
      paletteCollapsed: false,
      inspectorCollapsed: true,
    });
  });

  it('never throws when getItem throws (private mode)', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(loadPanelLayout()).toEqual(DEFAULT_LAYOUT);
    spy.mockRestore();
  });
});

describe('savePanelLayout (T15)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('round-trips through loadPanelLayout', () => {
    savePanelLayout(LAYOUT);
    expect(loadPanelLayout()).toEqual(LAYOUT);
  });

  it('clamps on save so storage never holds out-of-range widths', () => {
    savePanelLayout({ paletteWidth: 10, inspectorWidth: 9999, paletteCollapsed: false, inspectorCollapsed: false });
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!) as Record<string, unknown>;
    expect(raw.paletteWidth).toBe(PALETTE_LIMITS.min);
    expect(raw.inspectorWidth).toBe(INSPECTOR_LIMITS.max);
  });

  it('never throws when setItem throws (private mode / quota)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => savePanelLayout(LAYOUT)).not.toThrow();
    spy.mockRestore();
  });
});
