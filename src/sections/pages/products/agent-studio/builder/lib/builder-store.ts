/**
 * Builder UI state (BUILD_PLAN.md §8 — canvas truth, explicitly local).
 * Contract truth lives in React Query (draft/assistant/catalog); this store
 * owns selection, the satellite working set, node positions, skips, and the
 * palette filter. Everything persists per agent to localStorage as a
 * non-authoritative cache: a reset degrades cosmetics, never data.
 */
import { create } from 'zustand';
import {
  clearPositions,
  defaultSatellites,
  KIND_ORDER,
  newSatelliteId,
  readPositions,
  readSatellites,
  readSkipped,
  writePositions,
  writeSatellites,
  writeSkipped,
  type SatelliteView,
  type SlotKind,
} from './slot-model';

export interface XyPosition {
  x: number;
  y: number;
}

export type BindResult = 'ok' | 'missing' | 'occupied' | 'duplicate' | 'invalid';

interface BuilderUIState {
  agentId: string | null;
  selectedId: string | null;
  satellites: SatelliteView[];
  positions: Record<string, XyPosition>;
  skipped: string[];
  paletteFilter: SlotKind | null;

  hydrate: (agentId: string | null) => void;
  select: (id: string | null) => void;
  addSatellite: () => string;
  bindSatellite: (id: string, kind: SlotKind, opts?: { force?: boolean }) => BindResult;
  /**
   * Removes a satellite from the working set. Allowed for empty cards always,
   * and for bound satellites ONLY when the caller verified the kind holds no
   * draft config (`draftEmpty: true`) — anything configured stays mandatory
   * (slot-model §4 rule 2). The rail re-summons on demand (rule 3).
   */
  deleteSatellite: (id: string, opts?: { draftEmpty?: boolean }) => boolean;
  setPosition: (id: string, pos: XyPosition) => void;
  persistPositions: () => void;
  tidy: () => void;
  toggleSkip: (id: string) => void;
  setPaletteFilter: (kind: SlotKind | null) => void;
}

function persist(agentId: string | null, state: Pick<BuilderUIState, 'satellites' | 'skipped'>): void {
  if (!agentId) return;
  writeSatellites(agentId, state.satellites);
  writeSkipped(agentId, state.skipped);
}

export const useBuilderUI = create<BuilderUIState>((set, get) => ({
  agentId: null,
  selectedId: null,
  satellites: defaultSatellites(),
  positions: {},
  skipped: [],
  paletteFilter: null,

  hydrate: (agentId) => {
    if (agentId === get().agentId && agentId !== null) return;
    if (!agentId) {
      set({ agentId: null, selectedId: null, satellites: defaultSatellites(), positions: {}, skipped: [], paletteFilter: null });
      return;
    }
    set({
      agentId,
      selectedId: null,
      satellites: readSatellites(agentId) ?? defaultSatellites(),
      positions: readPositions(agentId),
      skipped: readSkipped(agentId),
      paletteFilter: null,
    });
  },

  select: (id) => set({ selectedId: id }),

  addSatellite: () => {
    const id = newSatelliteId();
    const satellites = [...get().satellites, { id, kind: null }];
    set({ satellites, selectedId: id });
    persist(get().agentId, { satellites, skipped: get().skipped });
    return id;
  },

  bindSatellite: (id, kind, opts) => {
    // Runtime gate: drag payloads are untrusted strings (OS file drops reach
    // onDrop with arbitrary dataTransfer). Unknown kinds never enter the
    // working set, so the projector's KIND_META lookup cannot miss.
    if (!(KIND_ORDER as readonly string[]).includes(kind)) return 'invalid';
    const { satellites } = get();
    const target = satellites.find((s) => s.id === id);
    if (!target) return 'missing';
    if (target.kind !== null && opts?.force !== true) return 'occupied';
    if (target.kind === kind) return 'ok';
    if (satellites.some((s) => s.id !== id && s.kind === kind)) return 'duplicate';
    const next = satellites.map((s) => (s.id === id ? { ...s, kind } : s));
    set({ satellites: next });
    persist(get().agentId, { satellites: next, skipped: get().skipped });
    return 'ok';
  },

  deleteSatellite: (id, opts) => {
    const { satellites } = get();
    const target = satellites.find((s) => s.id === id);
    if (!target) return false;
    if (target.kind !== null && opts?.draftEmpty !== true) return false;
    const next = satellites.filter((s) => s.id !== id);
    set({
      satellites: next,
      selectedId: get().selectedId === id ? null : get().selectedId,
    });
    persist(get().agentId, { satellites: next, skipped: get().skipped });
    return true;
  },

  setPosition: (id, pos) => {
    set((state) => ({ positions: { ...state.positions, [id]: pos } }));
  },

  persistPositions: () => {
    const { agentId, positions } = get();
    if (agentId) writePositions(agentId, positions);
  },

  tidy: () => {
    const { agentId } = get();
    if (agentId) clearPositions(agentId);
    set({ positions: {} });
  },

  toggleSkip: (id) => {
    const { skipped } = get();
    const next = skipped.includes(id) ? skipped.filter((s) => s !== id) : [...skipped, id];
    set({ skipped: next });
    persist(get().agentId, { satellites: get().satellites, skipped: next });
  },

  setPaletteFilter: (kind) => set({ paletteFilter: kind }),
}));

/** Convenience selector: the bound kind for a satellite id (null when empty/missing). */
export function satelliteKind(satellites: SatelliteView[], id: string): SlotKind | null {
  return satellites.find((s) => s.id === id)?.kind ?? null;
}
