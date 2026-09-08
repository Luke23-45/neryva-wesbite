/**
 * Step-up MFA state (frontend-engine-integration-plan A2/A5).
 *
 * Privileged mutations call `requestStepUp(act)` and receive a freshly
 * MINTED proof (POST /auth/mfa/proof with a live TOTP code) — never a
 * pasted string. `<StepUpModal/>` mounts once per shell (PlatformShell,
 * the studio session gate) and renders whenever a request is pending;
 * proofs are cached for their engine TTL (5 min) so consecutive
 * privileged acts don't re-prompt.
 *
 * This module is deliberately UI-free so query/mutation hooks can await
 * proofs without importing components.
 */
import { create } from 'zustand';
import { ApiError } from './client';

interface StepUpState {
  proof: { value: string; expiresAt: number } | null;
  pending: { resolve: (proof: string) => void; reject: (err: Error) => void; act: string } | null;
  request: (act: string) => Promise<string>;
  deliver: (proof: string) => void;
  fail: (err: Error) => void;
  clearProof: () => void;
}

export const useStepUpStore = create<StepUpState>((set, get) => ({
  proof: null,
  pending: null,
  request: (act) => {
    const cached = get().proof;
    if (cached && cached.expiresAt > Date.now() + 5_000) {
      return Promise.resolve(cached.value);
    }
    set({ proof: null });
    return new Promise<string>((resolve, reject) => {
      set({ pending: { resolve, reject, act } });
    });
  },
  deliver: (proof) => {
    const pending = get().pending;
    set({ pending: null, proof: { value: proof, expiresAt: Date.now() + 5 * 60_000 } });
    pending?.resolve(proof);
  },
  fail: (err) => {
    const pending = get().pending;
    set({ pending: null });
    pending?.reject(err);
  },
  clearProof: () => set({ proof: null }),
}));

/** Await a valid step-up proof; rejects on user cancel. */
export function requestStepUp(act: string): Promise<string> {
  return useStepUpStore.getState().request(act);
}

/** True when the engine rejected an act because it needs a fresh MFA proof. */
export function isStepUpRequired(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'step_up_required';
}

/**
 * Run a privileged engine call with automatic step-up recovery: on
 * `step_up_required` (typically an expired proof), prompt once via the
 * mounted StepUpModal and retry with the fresh proof. Hooks use this so
 * every privileged act recovers without per-page plumbing.
 */
export async function runWithStepUp<T>(act: string, run: (proof?: string) => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isStepUpRequired(error)) {
      const proof = await requestStepUp(act);
      return run(proof);
    }
    throw error;
  }
}
