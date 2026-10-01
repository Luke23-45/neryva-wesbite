import { describe, expect, it } from 'vitest';
import { ApiError } from './client';
import { describeEngineError, isDemoAllowanceRefusal } from './errors';

describe('describeEngineError', () => {
  it('maps past_due to the paywall panel with a billing way out', () => {
    const view = describeEngineError(new ApiError(402, 'past_due', 'Payment required'));
    expect(view.kind).toBe('paywall');
    expect(view.tone).toBe('warning');
    expect(view.action?.to).toBe('/platform/billing');
    expect(view.retryable).toBe(false);
  });

  it('maps entitlement_required to the billing panel (no trial offered)', () => {
    const view = describeEngineError(new ApiError(403, 'entitlement_required', 'Entitlement required'));
    expect(view.kind).toBe('entitlement');
    expect(view.action?.to).toBe('/platform/billing');
    expect(view.message).not.toMatch(/trial/i);
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

  it('maps the demo weekly-allowance 409 to the policy copy, not "conflicting change"', () => {
    const error = new ApiError(409, 'conflict', 'no usable model on this version — the free demo is unavailable (weekly demo allowance used (20 conversations per week))', {
      demo_reasons: ['demo_conversation_limit_reached'],
    });
    expect(isDemoAllowanceRefusal(error)).toBe(true);
    const view = describeEngineError(error);
    expect(view.tone).toBe('warning');
    expect(view.title).toBe('Demo allowance used');
    expect(view.message).toBe('Your organization has used its 20 free demo conversations for the current rolling 7-day window.');
    expect(view.retryable).toBe(false);
  });

  it('does not mistake other conflicts for the demo allowance refusal', () => {
    const plain = new ApiError(409, 'conflict', 'name taken');
    expect(isDemoAllowanceRefusal(plain)).toBe(false);
    expect(describeEngineError(plain).title).toBe('Conflicting change');
    const otherDemo = new ApiError(409, 'conflict', 'demo unavailable', { demo_reasons: ['demo_provider_disabled'] });
    expect(isDemoAllowanceRefusal(otherDemo)).toBe(false);
    expect(describeEngineError(otherDemo).title).toBe('Conflicting change');
    expect(isDemoAllowanceRefusal(new Error('boom'))).toBe(false);
  });
});
