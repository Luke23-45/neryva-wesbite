/**
 * Social sign-in providers configured on this deployment
 * (`GET /login/providers` — public, deployment-scoped).
 *
 * Architecture note: social initiation is uid-bound by design (the engine
 * refuses to redirect strangers to an IdP — `/login/:uid/social/:provider`
 * validates a real OP interaction). The console therefore never starts a
 * social flow directly; `beginLogin()` opens the OP, whose interaction page
 * renders exactly these providers. The console reflects availability so
 * the entry screen never promises less than the OP delivers.
 */
import { useQuery } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';

export interface LoginProvider {
  key: string;
  label: string;
}

export function useLoginProviders() {
  return useQuery({
    queryKey: ['engine', 'login-providers'],
    queryFn: () => engine<{ providers: LoginProvider[] }>('/login/providers'),
    staleTime: 10 * 60_000,
  });
}
