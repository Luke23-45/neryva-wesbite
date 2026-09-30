/**
 * Guided setup flow (?setup=1) — the post-creation walkthrough.
 *
 * After "Create agent" succeeds, the builder continues in build mode with
 * ?setup=1: the bottom bar becomes a Back / Continue stepper that walks the
 * 18 sections in canonical nav order instead of stranding the maker on the
 * Overview. All step math is pure (no React, no I/O) so the walkthrough
 * order is unit-pinnable; AgentBuilder owns rendering and navigation.
 */
import { SECTION_GROUPS } from '../nav/section-groups';

/**
 * Entry step of the walkthrough. Identity was just completed to create the
 * agent, so setup resumes on the next section.
 */
export const SETUP_ENTRY_STEP = 'instructions';

/** Canonical walkthrough order: the 18 section ids in nav order (no overview). */
export function getSetupOrder(): readonly string[] {
  return SECTION_GROUPS.flatMap((group) => group.sections);
}

/** 0-based position of a section in the walkthrough; -1 when not a step. */
export function setupStepIndex(sectionId: string | null | undefined): number {
  if (!sectionId) return -1;
  return getSetupOrder().indexOf(sectionId);
}

/**
 * Next step after `currentId`; null on the last step (the bar renders
 * "Finish" there). Unknown ids and the Overview restart at the entry step.
 */
export function nextSetupSection(currentId: string | null | undefined): string | null {
  const order = getSetupOrder();
  const idx = setupStepIndex(currentId);
  if (idx === -1) return SETUP_ENTRY_STEP;
  return order[idx + 1] ?? null;
}

/** Previous step before `currentId`; null on the first step (no Back). */
export function prevSetupSection(currentId: string | null | undefined): string | null {
  const order = getSetupOrder();
  const idx = setupStepIndex(currentId);
  if (idx <= 0) return null;
  return order[idx - 1] ?? null;
}

// ─── Non-authoritative UI state (window-guarded, try/caught) ────────────────
// Where the walkthrough stood, so a refresh resumes the exact section.
// Cosmetic only — the draft is the only contract truth; a reset restarts the
// walkthrough at the entry step, never loses data.

function setupStorageKey(agentId: string): string {
  return `neryva.builder.${agentId}.setupPosition`;
}

export function readSetupPosition(agentId: string): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(setupStorageKey(agentId));
    if (!raw || setupStepIndex(raw) === -1) return null;
    return raw;
  } catch {
    return null;
  }
}

export function writeSetupPosition(agentId: string, sectionId: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(setupStorageKey(agentId), sectionId);
  } catch {
    // UI state must never break the builder (private mode, quota, SSR).
  }
}

export function clearSetupPosition(agentId: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.removeItem(setupStorageKey(agentId));
  } catch {
    // Covered above — UI state never breaks the builder.
  }
}
