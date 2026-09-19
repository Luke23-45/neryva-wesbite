import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { describeEngineError } from './errors';

describe('describeEngineError', () => {
  it('maps past_due to the paywall panel with a billing way out', () => {
    const view = describeEngineError(new ApiError(402, 'past_due', 'Payment required'));
    expect(view.kind).toBe('paywall');
    expect(view.tone).toBe('warning');
    expect(view.action?.to).toBe('/platform/billing');
    expect(view.retryable).toBe(false);
  });

  it('maps entitlement_required to the trial/review panel', () => {
    const view = describeEngineError(new ApiError(403, 'entitlement_required', 'Entitlement required'));
    expect(view.kind).toBe('entitlement');
    expect(view.action?.to).toBe('/platform');
  });

  it('maps role denials to a permissions panel without an upgrade lie', () => {
    const view = describeEngineError(new ApiError(403, 'forbidden', 'Denied'));
    expect(view.kind).toBe('forbidden');
    expect(view.action).toBeUndefined();
  });

  it('includes the retry-after hint on rate limits', () => {
    const view = describeEngineError(
      new ApiError(429, 'rate_limited', 'Slow down', { retry_after_seconds: 30 }),
    );
    expect(view.kind).toBe('rate');
    expect(view.message).toContain('30');
    expect(view.retryable).toBe(true);
  });

  it('treats unauthenticated as session re-entry, not a retry', () => {
    const view = describeEngineError(new ApiError(401, 'unauthenticated', 'Expired'));
    expect(view.kind).toBe('auth');
    expect(view.retryable).toBe(false);
  });

  it('marks network and server errors retryable and surfaces request ids', () => {
    const network = describeEngineError(new ApiError(0, 'network_error', 'Cannot reach the Neryva engine'));
    expect(network.kind).toBe('retry');
    const server = describeEngineError(new ApiError(500, 'internal_error', 'Boom', undefined, 'req_9'));
    expect(server.kind).toBe('retry');
    expect(server.message).toContain('req_9');
  });

  it('passes validation messages through verbatim as input errors', () => {
    const view = describeEngineError(new ApiError(422, 'validation_failed', 'Name is too long'));
    expect(view.kind).toBe('input');
    expect(view.message).toBe('Name is too long');
  });

  it('handles non-ApiError unknowns generically', () => {
    const view = describeEngineError(new Error('render blew up'));
    expect(view.kind).toBe('generic');
    expect(view.message).toBe('render blew up');
  });

  it('maps seat_limit_reached to the seats paywall without retry', () => {
    const view = describeEngineError(new ApiError(402, 'seat_limit_reached', 'Payment required: all seats are in use'));
    expect(view.kind).toBe('paywall');
    expect(view.message).toContain('seats are in use');
    expect(view.retryable).toBe(false);
  });

  it('maps quota_exceeded to a retryable rate panel', () => {
    const view = describeEngineError(new ApiError(429, 'quota_exceeded', 'Monthly event limit reached'));
    expect(view.kind).toBe('rate');
    expect(view.retryable).toBe(true);
  });

  it('maps precondition_failed to the merge-or-reload panel (never a bare retry)', () => {
    const view = describeEngineError(new ApiError(412, 'precondition_failed', 'Resource changed since it was read', { expected: 'a', current: 'b' }));
    expect(view.kind).toBe('conflict');
    expect(view.message).toContain('Reload');
    expect(view.retryable).toBe(false);
  });

  it('maps serialization_failure to safe-retry and resource_purged to gone', () => {
    const retry = describeEngineError(new ApiError(409, 'serialization_failure', 'serialization failure, retry'));
    expect(retry.kind).toBe('retry');
    expect(retry.retryable).toBe(true);
    const gone = describeEngineError(new ApiError(410, 'resource_purged', 'purged'));
    expect(gone.kind).toBe('gone');
    expect(gone.retryable).toBe(false);
  });
});
