import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

/**
 * Slot contract for the merged builder topbar (LEDGER.md T13, fixed T19).
 *
 * The builder page renders inside `StudioShell` via `<Outlet/>`, which owns
 * the single 48px app topbar. Context flows down, never up — so the slots
 * state lives ABOVE the shell: the route layout (`AgentStudioShellPage`)
 * renders `BuilderTopbarSlotsProvider` around `StudioShell`, `AgentBuilder`
 * publishes its slots into it with `usePublishBuilderTopbarSlots`, and
 * `StudioShell` reads them with `useBuilderTopbarSlots`.
 *
 * (T13 originally put the provider inside `AgentBuilder`, below the shell —
 * the shell always read `null` and the merged topbar never rendered. T19
 * moved the provider above the shell.)
 *
 * `null` means no builder chrome — non-builder pages and the builder's
 * loading/not-found states render the shell topbar untouched.
 *
 * Two contexts, deliberately (T19 loop fix): the publisher (`AgentBuilder`)
 * must NOT re-render when slots change, or publish → provider update →
 * publisher re-render → new slots identity → publish… spins forever. So the
 * setter lives in its own context whose value is the stable `useState`
 * setter, and the publisher subscribes to that alone.
 */
export interface BuilderTopbarSlots {
  /** 24px mark + breadcrumb + Draft/Live pills. */
  identity: ReactNode;
  /** Save readout + Save + Test run + Publish (+badge). */
  actions: ReactNode;
}

const SlotsStateContext = createContext<BuilderTopbarSlots | null>(null);

const NOOP_SET_SLOTS = (_slots: BuilderTopbarSlots | null): void => {};
const SetSlotsContext = createContext<(slots: BuilderTopbarSlots | null) => void>(NOOP_SET_SLOTS);

/** Reads the published slots — what `StudioShell` renders. */
export function useBuilderTopbarSlots(): BuilderTopbarSlots | null {
  return useContext(SlotsStateContext);
}

/**
 * Returns the publish function. Stable across renders and safe outside a
 * provider (standalone test renders get a no-op) — never throws, and never
 * subscribes the caller to slots changes.
 */
export function useSetBuilderTopbarSlots(): (slots: BuilderTopbarSlots | null) => void {
  return useContext(SetSlotsContext);
}

/**
 * Owns the slots state. Render above `StudioShell` in the route layout —
 * never inside the page being slotted.
 */
export function BuilderTopbarSlotsProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<BuilderTopbarSlots | null>(null);
  return (
    <SetSlotsContext.Provider value={setSlots}>
      <SlotsStateContext.Provider value={slots}>{children}</SlotsStateContext.Provider>
    </SetSlotsContext.Provider>
  );
}

/**
 * Publishes this component's slots to the layout provider and clears them
 * on unmount, so stale builder chrome never lingers on other pages.
 */
export function usePublishBuilderTopbarSlots(slots: BuilderTopbarSlots | null): void {
  const setSlots = useSetBuilderTopbarSlots();
  useEffect(() => {
    setSlots(slots);
    return () => setSlots(null);
  }, [slots, setSlots]);
}
