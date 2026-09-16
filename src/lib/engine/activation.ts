/**
 * Activation record (first-run ledger F3): first successful assistant run in
 * the org (production or test-run) is the locked activation event.
 *
 * This module is the IN-SESSION complement only: a tab-scoped mark that lets
 * the UI react immediately (refresh server truth, show progress) without
 * double-firing. The record of truth stays server-side — `GET
 * /console/onboarding` → `activation.first_activation_at` (earliest COMPLETED
 * standard/test run per org). Never derive cohorts from these marks.
 */

const keyFor = (orgId: string): string => `neryva.activation_${orgId}`;

export interface ActivationMark {
  runId: string;
  at: string;
}

/**
 * Record an in-session activation for the org. Returns true when newly marked
 * this tab (callers refresh server truth then); false when already marked.
 * Never throws.
 */
export function markActivation(orgId: string | null, runId: string): boolean {
  if (!orgId || !runId) {
    return false;
  }
  try {
    if (sessionStorage.getItem(keyFor(orgId))) {
      return false;
    }
    const mark: ActivationMark = { runId, at: new Date().toISOString() };
    sessionStorage.setItem(keyFor(orgId), JSON.stringify(mark));
    return true;
  } catch {
    // Private mode: report new so callers still refresh server truth.
    return true;
  }
}

/** Read this tab's in-session mark for the org (null when none). Never throws. */
export function readActivation(orgId: string | null): ActivationMark | null {
  if (!orgId) {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(keyFor(orgId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<ActivationMark>;
    if (typeof parsed.runId !== 'string' || typeof parsed.at !== 'string') {
      return null;
    }
    return { runId: parsed.runId, at: parsed.at };
  } catch {
    return null;
  }
}
