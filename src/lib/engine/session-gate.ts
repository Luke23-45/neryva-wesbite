/**
 * Route-level session gate for the auth-gated app shells (`/agent-studio`,
 * `/deployment`, and every `/platform/*` route except the OP callback).
 *
 * `beforeLoad` semantics:
 *  - `unknown` (cold load): await `hydrate()` — the sessionStorage refresh
 *    token restores the session, else the silent `prompt=none` iframe tries
 *    the OP cookie session, else the session is proven dead.
 *  - `authenticated`: pass through.
 *  - `anonymous`: redirect into the branded `/auth` page with the deep link
 *    as `?return=` (validated there) — never straight at the raw OP, so the
 *    user always sees the product sign-in with the provider bypass.
 *
 * Note: this guard must NOT cover `/platform/auth/callback`. That route is
 * declared on the root route and sits at the top level of the route tree —
 * keep it out of the guarded shells' children or the OP bounce loops.
 */
import { redirect } from '@tanstack/react-router';
import { useSessionStore } from './auth';
import { needsOnboarding } from './first-run';
import { queryClient } from '../queryClient';
import { fetchAccountProfile } from '@/hooks/auth/useAccount';

export async function requireEngineSession(): Promise<void> {
  const status = useSessionStore.getState().status;
  if (status === 'authenticated') {
    return;
  }
  if (status === 'unknown') {
    await useSessionStore.getState().hydrate();
    if (useSessionStore.getState().status === 'authenticated') {
      return;
    }
  }
  const here = window.location.pathname + window.location.search;
  throw redirect({ to: '/auth', search: { return: here } });
}

/**
 * The onboarding gate (first-run ledger F1-7) for the authenticated app
 * surfaces: `/agent-studio`, `/deployment`, and the `/platform/*` console.
 *
 * Enforcement rule — POSITIVE TRUTH ONLY:
 * an account is sent to `/platform/welcome` only when the server explicitly
 * says `onboarding.needed`. A failed lookup, a transient network error, or an
 * engine that predates the flag all resolve to "let them through", because a
 * broken read must never trap or bounce a signed-in user (F1-6 discipline).
 * Welcome stays satisfiable exactly once: completing it (consent + continue,
 * or consent + skip) closes the gate server-side, so no guard can loop.
 *
 * Anonymous/unknown is deliberately NOT this guard's business: `/platform`
 * renders its own sign-in card, and the two app shells run
 * `requireEngineSession` first. Returning here keeps each guard single-purpose.
 *
 * The `['auth','me']` read is primed through the shared query client so the
 * welcome page and the shell never fly the same request twice.
 */
export async function requireOnboardedSession(): Promise<void> {
  if (useSessionStore.getState().status !== 'authenticated') {
    return;
  }
  let needed = false;
  try {
    const me = await queryClient.fetchQuery({
      queryKey: ['auth', 'me'],
      queryFn: fetchAccountProfile,
      staleTime: 30_000,
    });
    needed = needsOnboarding(me?.account?.onboarding);
  } catch {
    // Lookup failure ⇒ advance-anyway (see the rule above).
    return;
  }
  if (!needed) {
    return;
  }
  const here = window.location.pathname + window.location.search;
  if (here.startsWith('/platform/welcome')) {
    // Already there (or arriving with the same target): never self-redirect.
    return;
  }
  throw redirect({ to: '/platform/welcome', search: { return: here } });
}
