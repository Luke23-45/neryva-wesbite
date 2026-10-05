/**
 * Providers Phase 5 — Wave B: key-card status-pill matrix (pure, unit-tested).
 *
 * Kept in its own module so KeyCard.tsx exports only components
 * (react-refresh rule).
 */
import type { StatusTone } from '@/components/common/ui/StatusPill';
import type { ProviderCredentialView } from '@/sections/pages/products/agent-studio/providers/api';

export interface StatusPillData {
  tone: StatusTone;
  text: string;
}

/**
 * Status-pill matrix. `lastError` is the engine probe failure detail from
 * the most recent verify attempt on this card.
 *
 * Revocation is read from the separate lifecycle `status` field (P0-2): a
 * revoked credential keeps its last verification_status forever, so
 * matching revocation on verification_status was dead code. The engine
 * never emits 'verifying' (probes are synchronous — the row goes
 * unverified → verified/failed), so that fictional state is gone from the
 * type and unhandled here.
 */
export function statusPillFor(
  credential: Pick<ProviderCredentialView, 'verification_status' | 'last_probe_latency_ms' | 'status'>,
  lastError?: string | null,
): StatusPillData {
  if (credential.status === 'revoked') return { tone: 'neutral', text: 'Revoked' };
  switch (credential.verification_status) {
    case 'verified':
      return {
        tone: 'success',
        text:
          credential.last_probe_latency_ms != null
            ? `Verified (${credential.last_probe_latency_ms}ms)`
            : 'Verified',
      };
    case 'failed': {
      // Founder key-cards design: amber "Failed: {code}" — the code is the
      // leading 3-digit status from the most recent verify attempt's engine
      // detail. No server-side failure reason exists, so without a recent
      // local verify attempt the pill is a plain "Failed".
      const code = lastError?.match(/^\d{3}/)?.[0];
      return { tone: 'warning', text: code ? `Failed: ${code}` : 'Failed' };
    }
    case 'unverified':
    default:
      return { tone: 'warning', text: 'Unverified' };
  }
}
