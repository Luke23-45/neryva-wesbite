/**
 * Route-level session gate for the auth-gated app shells (`/agent-studio`,
 * `/deployment`) — the engine-aware replacement for the old marketing-token
 * `requireAuth`.
 *
 * `beforeLoad` semantics:
 *  - `unknown` (cold load): await `hydrate()` — the sessionStorage refresh
 *    token either restores the session or proves it dead.
 *  - `anonymous`: start the OP authorization flow. `beginLogin()` stashes
 *    the current path+search, so the callback returns the user to the exact
 *    deep link that triggered the gate.
 *
 * Note: this guard must NOT cover `/platform/auth/callback`. That route is
 * declared on the root route and sits at the top level of the route tree —
 * keep it out of the guarded shells' children or the OP bounce loops.
 */
import { beginLogin, useSessionStore } from './auth';

export async function requireEngineSession(): Promise<void> {
  const store = useSessionStore.getState();
  if (store.status === 'unknown') {
    await store.hydrate();
  }
  if (!useSessionStore.getState().accessToken) {
    await beginLogin();
    // The full-page redirect to the OP is in flight — park the router so
    // the protected view never flashes underneath it.
    await new Promise<never>(() => {});
  }
}
