/**
 * Resizable + collapsible builder sidebars (ledger T15): width limits,
 * clamping, and localStorage persistence for the palette rail and the
 * inspector panel.
 *
 * All storage access is guarded — private-mode / quota failures never throw.
 * jsdom-safe: every entry point guards `typeof window`.
 */

export interface PanelLimits {
  min: number;
  max: number;
  default: number;
}

export const PALETTE_LIMITS: PanelLimits = { min: 208, max: 480, default: 272 };
export const INSPECTOR_LIMITS: PanelLimits = { min: 300, max: 640, default: 360 };

export const STORAGE_KEY = 'neryva.builder.panelLayout.v1';

export interface PanelLayout {
  paletteWidth: number;
  inspectorWidth: number;
  paletteCollapsed: boolean;
  inspectorCollapsed: boolean;
}

export const DEFAULT_LAYOUT: PanelLayout = {
  paletteWidth: PALETTE_LIMITS.default,
  inspectorWidth: INSPECTOR_LIMITS.default,
  paletteCollapsed: false,
  inspectorCollapsed: false,
};

/** Clamp a width into the panel limits; non-finite input → default. */
export function clampWidth(v: number, limits: PanelLimits): number {
  if (!Number.isFinite(v)) return limits.default;
  return Math.min(limits.max, Math.max(limits.min, v));
}

function validWidth(v: unknown, limits: PanelLimits): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= limits.min && v <= limits.max
    ? v
    : limits.default;
}

function validBool(v: unknown): boolean {
  return typeof v === 'boolean' ? v : false;
}

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Load the persisted layout; any corrupt/missing/out-of-range value → default. */
export function loadPanelLayout(): PanelLayout {
  try {
    const store = storage();
    if (!store) return { ...DEFAULT_LAYOUT };
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LAYOUT };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_LAYOUT };
    const p = parsed as Record<string, unknown>;
    return {
      paletteWidth: validWidth(p.paletteWidth, PALETTE_LIMITS),
      inspectorWidth: validWidth(p.inspectorWidth, INSPECTOR_LIMITS),
      paletteCollapsed: validBool(p.paletteCollapsed),
      inspectorCollapsed: validBool(p.inspectorCollapsed),
    };
  } catch {
    return { ...DEFAULT_LAYOUT };
  }
}

/** Persist the layout; storage failures are swallowed, never thrown. */
export function savePanelLayout(state: PanelLayout): void {
  try {
    const store = storage();
    if (!store) return;
    store.setItem(
      STORAGE_KEY,
      JSON.stringify({
        paletteWidth: clampWidth(state.paletteWidth, PALETTE_LIMITS),
        inspectorWidth: clampWidth(state.inspectorWidth, INSPECTOR_LIMITS),
        paletteCollapsed: validBool(state.paletteCollapsed),
        inspectorCollapsed: validBool(state.inspectorCollapsed),
      }),
    );
  } catch {
    // Private mode / quota exceeded — the layout simply isn't persisted.
  }
}
