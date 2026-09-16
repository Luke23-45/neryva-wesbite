/**
 * Social sign-in providers configured on this deployment
 * (`GET /login/providers` — public, deployment-scoped).
 *
 * Architecture note: social initiation is uid-bound by design (the engine
 * refuses to redirect strangers to an IdP — `/login/:uid/social/:provider`
 * validates a real OP interaction). The console therefore never deep-links
 * an IdP; it names the chosen provider on the authorize URL
 * (`beginLogin(returnTo, { connection: key })`) and the OP routes straight
 * to that provider's initiate, skipping its generic page. This hook feeds
 * exactly the keys the OP will honor, so the entry screen never promises
 * less — or more — than the OP delivers.
 */
import { useQuery } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';

export interface LoginProvider {
  key: string;
  label: string;
}

export function useLoginProviders() {
  return useQuery({
    queryKey: ['auth', 'login-providers'],
    queryFn: () => engine<{ providers: LoginProvider[] }>('/login/providers'),
    staleTime: 10 * 60_000,
  });
}
