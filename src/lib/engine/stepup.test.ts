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

describe('request (Round 4 P2: no orphaned promises)', () => {
  it('rejects the previous pending request instead of orphaning it', async () => {
    const first = requestStepUp('rotate provider key');
    const firstSettled = first.then(
      () => 'resolved',
      (err: Error) => err,
    );
    // A second request while the first is still pending: the first caller
    // must fail loudly, never hang on an unsettled promise.
    const second = requestStepUp('connect provider key');
    const err = (await firstSettled) as Error;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/superseded/);
    // The second request is the live one.
    expect(useStepUpStore.getState().pending?.act).toBe('connect provider key');
    // Clean up so the promise doesn't dangle.
    useStepUpStore.getState().fail(new Error('cleanup'));
    await expect(second).rejects.toThrow('cleanup');
  });

  it('a cached proof still short-circuits without touching pending', async () => {
    useStepUpStore.setState({
      proof: { value: 'proof-1', expiresAt: Date.now() + 60_000 },
      pending: null,
    });
    await expect(requestStepUp('rotate provider key')).resolves.toBe('proof-1');
    expect(useStepUpStore.getState().pending).toBeNull();
  });
});
