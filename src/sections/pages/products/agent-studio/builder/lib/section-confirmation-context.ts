import { createContext, useContext } from 'react';

/**
 * Context for per-section confirmation (C-BUG4/M-BUG3, Option A).
 *
 * Sections call `confirmSection(sectionId)` when their Save succeeds.
 * The projector reads the confirmed set (via AgentBuilder) to grade
 * confirmed sections as `ready` even at engine defaults.
 *
 * Provided by AgentBuilder; defaults to a no-op for tests/legacy callers.
 */
export const SectionConfirmationContext = createContext<{
  confirmSection: (sectionId: string) => void;
}>({
  confirmSection: () => undefined,
});

export function useSectionConfirmationContext(): (sectionId: string) => void {
  return useContext(SectionConfirmationContext).confirmSection;
}
