// @vitest-environment jsdom
/**
 * Step-up store — cancelStepUpFor targeted tests (Round 2 P2).
 * - cancels a pending probe step-up request and closes the modal state
 * - leaves non-probe (e.g. rotate/connect) requests untouched
 * - the rejection is an AbortError so probe handlers treat it as a cancel
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { cancelStepUpFor, requestStepUp, useStepUpStore } from './stepup';

beforeEach(() => {
  useStepUpStore.setState({ proof: null, pending: null });
});

describe('cancelStepUpFor', () => {
  it('fails a pending probe request with an AbortError and clears pending', async () => {
    const pending = requestStepUp('probe custom endpoint');
    expect(useStepUpStore.getState().pending?.act).toBe('probe custom endpoint');
    const settled = pending.then(
      () => 'resolved',
      (err: Error) => err,
    );
    expect(cancelStepUpFor('probe ')).toBe(true);
    const err = (await settled) as Error;
    expect(err.name).toBe('AbortError');
    // The modal renders from `pending` — cleared means dismissed.
    expect(useStepUpStore.getState().pending).toBeNull();
  });

  it('does not touch a pending request for a different act', async () => {
    const pending = requestStepUp('rotate provider key');
    const settled = pending.then(
      () => 'resolved',
      (err: Error) => err.name,
    );
    expect(cancelStepUpFor('probe ')).toBe(false);
    expect(useStepUpStore.getState().pending?.act).toBe('rotate provider key');
    // Clean up: fail it directly so the promise doesn't dangle.
    useStepUpStore.getState().fail(new Error('cleanup'));
    expect(await settled).toBe('Error');
  });

  it('returns false when nothing is pending', () => {
    expect(cancelStepUpFor('probe ')).toBe(false);
  });
});
