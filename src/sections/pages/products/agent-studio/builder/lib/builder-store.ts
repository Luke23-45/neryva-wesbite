/**
 * Builder UI state (BUILD_PLAN.md §8 — canvas truth, explicitly local).
 * Contract truth lives in React Query (draft/assistant/catalog); this store
 * owns selection, node positions, and the palette filter. Everything persists per agent to localStorage as a
 * non-authoritative cache: a reset degrades cosmetics, never data.
 *
 * v10: the canvas is a FIXED 18-node topology (lane-model.ts) — the
 * satellite working set, binding, deletion, and skip toggling are gone.
 */
import { create } from 'zustand';
import {
  clearPositions,
  readPositions,
  writePositions,
  type SlotKind,
} from './slot-model';

export interface XyPosition {
  x: number;
  y: number;
}

interface BuilderUIState {
  agentId: string | null;
  selectedId: string | null;
  positions: Record<string, XyPosition>;
  paletteFilter: SlotKind | null;

  hydrate: (agentId: string | null) => void;
  select: (id: string | null) => void;
  setPosition: (id: string, pos: XyPosition) => void;
  persistPositions: () => void;
  tidy: () => void;
  setPaletteFilter: (kind: SlotKind | null) => void;
}

export const useBuilderUI = create<BuilderUIState>((set, get) => ({
  agentId: null,
  selectedId: null,
  positions: {},
  paletteFilter: null,

  hydrate: (agentId) => {
    if (agentId === get().agentId && agentId !== null) return;
    if (!agentId) {
      set({ agentId: null, selectedId: null, positions: {}, paletteFilter: null });
      return;
    }
    set({
      agentId,
      selectedId: null,
      positions: readPositions(agentId),
      paletteFilter: null,
    });
  },

  select: (id) => set({ selectedId: id }),

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

  setPaletteFilter: (kind) => set({ paletteFilter: kind }),
}));
