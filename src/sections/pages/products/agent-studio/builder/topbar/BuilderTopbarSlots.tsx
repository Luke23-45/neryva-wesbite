import { createContext, useContext, type ReactNode } from 'react';

/**
 * Slot contract for the merged builder topbar (LEDGER.md T13).
 *
 * The builder page renders inside `StudioShell`, which owns the single 48px
 * app topbar. Rather than stacking a second 56px `BuilderTopBar` row below
 * it, `AgentBuilder` provides these slots and `StudioShell` renders them
 * inline: `identity` in `TopbarLeft` (after the back link, before the search
 * hint) and `actions` at the start of `TopbarRight` (before the `+` icon,
 * with a hairline divider).
 *
 * `null` (the default) means no builder chrome — non-builder pages and the
 * builder's loading/not-found states render the shell topbar untouched.
 */
export interface BuilderTopbarSlots {
  /** 24px mark + breadcrumb + Draft/Live pills. */
  identity: ReactNode;
  /** Save readout + Save + Test run + Publish (+badge). */
  actions: ReactNode;
}

export const BuilderTopbarSlotsContext = createContext<BuilderTopbarSlots | null>(null);

export function useBuilderTopbarSlots(): BuilderTopbarSlots | null {
  return useContext(BuilderTopbarSlotsContext);
}
