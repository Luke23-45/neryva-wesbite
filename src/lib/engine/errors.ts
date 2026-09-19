/**
 * Engine error → UI mapping (frontend-engine-integration-plan A5).
 *
 * One pure function describes every `ApiError` for the whole app: panels
 * (`EngineErrorState` for queries) and toasts (`toastEngineError` for
 * mutations) both read from here, so a `past_due` or `step_up_required`
 * surfaces with the same words everywhere.
 *
 * Copy follows the access-model: nothing dead-ends — every state names the
 * way out (billing CTA, trial review, retry).
 */
import toast from 'react-hot-toast';
import { ApiError } from './client';

export type EngineErrorKind =
  | 'auth' // session dead — re-entry
  | 'paywall' // 402 past_due / seat_limit_reached — billing or seats CTA
  | 'entitlement' // 403 entitlement_required — trial/review CTA
  | 'forbidden' // 403 role-based
  | 'rate' // 429 / quota_exceeded(events)
  | 'retry' // 5xx / network / serialization_failure — worth trying again
  | 'conflict' // 409 gate refusals + 412 stale — fix-path panels, not bare toasts
  | 'input' // validation_failed / not_found — user-fixable
  | 'gone' // resource_purged — retention/GDPR tombstone
  | 'generic';

export interface EngineErrorView {
  kind: EngineErrorKind;
  tone: 'error' | 'warning';
  title: string;
  message: string;
  /** In-app route for the way out (paywall → billing, entitlement → console home). */
  action?: { label: string; to: string };
  retryable: boolean;
}

export function describeEngineError(error: unknown): EngineErrorView {
  if (!(error instanceof ApiError)) {
    return {
      kind: 'generic',
      tone: 'error',
      title: 'Something went wrong',
      message: error instanceof Error ? error.message : 'Unexpected error — try again.',
      retryable: true,
    };
  }

  switch (error.code) {
    case 'unauthenticated':
      return {
        kind: 'auth',
        tone: 'error',
        title: 'Session ended',
        message: 'Your session has expired. Sign in again to continue where you left off.',
        retryable: false,
      };
    case 'past_due':
      return {
        kind: 'paywall',
        tone: 'warning',
        title: 'Payment needed',
        message: 'A payment on this organization failed, so changes are paused until billing is settled. Your data is safe and read access continues.',
        action: { label: 'Open billing', to: '/platform/billing' },
        retryable: false,
      };
    case 'entitlement_required':
      return {
        kind: 'entitlement',
        tone: 'warning',
        title: 'Not enabled for this organization',
        message: 'This product isn’t active for your organization yet. Start a trial from the console home, or ask an owner or billing manager to enable it.',
        action: { label: 'Review products', to: '/platform' },
        retryable: false,
      };
    case 'forbidden':
    case 'denied_by_default':
      return {
        kind: 'forbidden',
        tone: 'error',
        title: 'You don’t have access to this',
        message: 'Your role doesn’t include this capability. An owner or admin can grant access.',
        retryable: false,
      };
    case 'rate_limited':
      return {
        kind: 'rate',
        tone: 'warning',
        title: 'Too many requests',
        message: error.retryAfterSeconds
          ? `You’re moving fast — try again in ${error.retryAfterSeconds} seconds.`
          : 'You’re moving fast — try again in a moment.',
        retryable: true,
      };
    case 'step_up_required':
      return {
        kind: 'retry',
        tone: 'warning',
        title: 'Verification required',
        message: 'This action needs a fresh authenticator code to confirm it’s you.',
        retryable: true,
      };
    case 'not_found':
      return {
        kind: 'input',
        tone: 'error',
        title: 'Not found',
        message: 'This resource doesn’t exist or was removed.',
        retryable: false,
      };
    case 'seat_limit_reached':
      return {
        kind: 'paywall',
        tone: 'warning',
        title: 'No seats left',
        message: error.message || 'All seats are in use — add seats to invite more members.',
        retryable: false,
      };
    case 'quota_exceeded':
      return {
        kind: 'rate',
        tone: 'warning',
        title: 'Limit reached',
        message: error.message || 'A usage limit was reached — retry after the window resets.',
        retryable: true,
      };
    case 'precondition_failed':
      return {
        kind: 'conflict',
        tone: 'warning',
        title: 'Changed since you opened it',
        message: 'Someone saved a newer version while you were editing. Reload their changes and re-apply yours — nothing was overwritten.',
        retryable: false,
      };
    case 'serialization_failure':
      return {
        kind: 'retry',
        tone: 'error',
        title: 'Busy — safe to retry',
        message: 'The request collided with another change. Retry with the same input.',
        retryable: true,
      };
    case 'resource_purged':
      return {
        kind: 'gone',
        tone: 'error',
        title: 'Removed',
        message: error.message || 'This resource was removed and is no longer available.',
        retryable: false,
      };
    case 'validation_failed':
      return {
        kind: 'input',
        tone: 'error',
        title: 'Invalid input',
        message: error.message,
        retryable: false,
      };
    case 'conflict':
    case 'idempotency_conflict':
    case 'idempotency_in_flight':
      return {
        kind: 'input',
        tone: 'error',
        title: 'Conflicting change',
        message: error.message || 'This resource changed in the meantime — review it and try again.',
        retryable: true,
      };
    case 'service_unavailable':
    case 'internal_error':
      return {
        kind: 'retry',
        tone: 'error',
        title: 'The engine hit a snag',
        message: error.requestId ? `${error.message} (request ${error.requestId})` : error.message,
        retryable: true,
      };
    case 'network_error':
      return {
        kind: 'retry',
        tone: 'error',
        title: 'Can’t reach the Neryva engine',
        message: 'Check your connection and try again.',
        retryable: true,
      };
    default:
      return {
        kind: 'generic',
        tone: 'error',
        title: 'Something went wrong',
        message: error.message,
        retryable: true,
      };
  }
}

/**
 * Mutation-side error surface (react-hot-toast). Preserved copy: the server
 * message is usually the best toast; the two special cases below get
 * dedicated words because their raw messages are machinery, not guidance.
 */
export function toastEngineError(error: unknown, fallback = 'Something went wrong — try again.'): void {
  if (error instanceof ApiError) {
    if (error.code === 'rate_limited' && error.retryAfterSeconds) {
      toast.error(`Too many requests — retry in ${error.retryAfterSeconds}s`);
      return;
    }
    if (error.code === 'idempotency_conflict') {
      toast.error('This action was already submitted with different input');
      return;
    }
    toast.error(error.message);
    return;
  }
  toast.error(fallback);
}
