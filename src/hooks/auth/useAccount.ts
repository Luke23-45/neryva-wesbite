/**
 * The signed-in Engine account (`GET /auth/me` — L1, session scope).
 *
 * The OP session store holds the token + basic claims; this hook is the
 * canonical account profile read (display name, verification, MFA level)
 * for settings and chrome. Keyed under the auth domain so sign-out
 * invalidation drops it with one prefix.
 */
import { useQuery } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import type { OnboardingState } from '@lib/engine/first-run';
import { useIsAuthenticated } from './useSession';

export interface EngineAccount {
  id: string;
  email: string;
  email_verified: boolean;
  display_name: string | null;
  mfa_level: string;
  status: string;
  /** Account creation stamp — display/telemetry only; it no longer drives the
   *  first-run gate (F1-7 replaced the 30-minute wall clock with server state). */
  created_at: string;
  last_login_at: string | null;
  /**
   * The server's first-run gate (F1-7). Optional on purpose: an older engine
   * build omits it, and `needsOnboarding` treats "absent" as "gate closed" so
   * a deployment mismatch can never trap a user in onboarding.
   */
  onboarding?: OnboardingState;
}

/**
 * The canonical profile fetch. Exported so non-React callers (the post-login
 * router, the onboarding route gate) prime the exact same `['auth','me']`
 * cache entry this hook reads instead of inventing a second request shape.
 */
export async function fetchAccountProfile(): Promise<{ account: EngineAccount }> {
  return engine<{ account: EngineAccount }>('/auth/me');
}

export function useAccount() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchAccountProfile,
    enabled: authenticated,
    staleTime: 60_000,
  });
}
