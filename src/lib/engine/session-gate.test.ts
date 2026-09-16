import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requireEngineSession, requireOnboardedSession } from './session-gate';
import { useSessionStore } from './auth';
import { queryClient } from '../queryClient';

// The gate redirects through the router, not the browser: capture the
// redirect target instead of performing navigation.
vi.mock('@tanstack/react-router', () => ({
  redirect: (options: unknown) => {
    throw { __testRedirect: options };
  },
}));

function resetSession() {
  sessionStorage.clear();
  useSessionStore.setState({ accessToken: null, account: null, status: 'unknown' });
}

describe('requireEngineSession', () => {
  beforeEach(() => {
    resetSession();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetSession();
  });

  it('restores the session from the refresh token on a cold load', async () => {
    sessionStorage.setItem('neryva.refresh_token', 'refresh-me');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/auth/token')) {
          return new Response(JSON.stringify({ access_token: 'a.access', refresh_token: 'r2', expires_in: 900 }), { status: 200 });
        }
        if (url.includes('/auth/me')) {
          return new Response(
            JSON.stringify({ account: { id: 'acc_1', email: 'ada@neryva.test', display_name: 'Ada Lovelace' } }),
            { status: 200 },
          );
        }
        return new Response(null, { status: 404 });
      }),
    );

    await expect(requireEngineSession()).resolves.toBeUndefined();
    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(useSessionStore.getState().accessToken).toBe('a.access');
  });

  it('redirects anonymous users to the branded sign-in with the deep link as return', async () => {
    // No refresh token — the session is dead. The gate must NOT mint PKCE
    // material or touch the OP itself: it routes into /auth, which owns the
    // provider buttons (and their connection-hint bypass) from there.
    const outcome = await requireEngineSession().then(
      () => ({ redirected: false, target: null }) as const,
      (thrown: unknown) => ({ redirected: true, target: thrown }) as const,
    );
    expect(outcome.redirected).toBe(true);
    expect(outcome.target).toEqual({
      __testRedirect: { to: '/auth', search: { return: expect.any(String) } },
    });
    // No OP material minted by the gate — /auth owns the login start.
    expect(sessionStorage.getItem('neryva.pkce_verifier')).toBeNull();
    expect(sessionStorage.getItem('neryva.oauth_state')).toBeNull();
    expect(sessionStorage.getItem('neryva.post_login_return')).toBeNull();
    expect(useSessionStore.getState().status).toBe('anonymous');
  });
});

/**
 * The onboarding route gate (F1-7): `/agent-studio`, `/deployment`, and the
 * `/platform/*` console must send an account that still owes /platform/welcome
 * there — and must NEVER trap a signed-in user when the lookup fails.
 */
describe('requireOnboardedSession', () => {
  function authenticate() {
    useSessionStore.setState({ accessToken: 'a.access', account: null, status: 'authenticated' });
  }

  function stubMe(payload: unknown, status = 200) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(payload), { status })),
    );
  }

  /** Resolve the gate into a comparable outcome instead of a thrown redirect. */
  async function attempt() {
    return requireOnboardedSession().then(
      () => ({ redirected: false, target: null }) as const,
      (thrown: unknown) => ({ redirected: true, target: thrown }) as const,
    );
  }

  beforeEach(() => {
    resetSession();
    queryClient.clear();
    // The gate must swallow ANY lookup failure. Retries are off here so the 5xx
    // case resolves immediately — the production retry policy would otherwise
    // add seconds of backoff to a unit test.
    queryClient.setDefaultOptions({ queries: { retry: false } });
    window.history.pushState({}, '', '/agent-studio/dashboard');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetSession();
    queryClient.clear();
    window.history.pushState({}, '', '/');
  });

  it('leaves anonymous sessions alone — the shells own that path', async () => {
    stubMe({ account: { id: 'acc_1', onboarding: { needed: true } } });
    expect(await attempt()).toEqual({ redirected: false, target: null });
  });

  it('sends an account that still owes onboarding to the welcome screen, deep link preserved', async () => {
    authenticate();
    stubMe({ account: { id: 'acc_1', onboarding: { needed: true } } });
    expect(await attempt()).toEqual({
      redirected: true,
      target: { __testRedirect: { to: '/platform/welcome', search: { return: '/agent-studio/dashboard' } } },
    });
  });

  it('lets an onboarded account through', async () => {
    authenticate();
    stubMe({ account: { id: 'acc_1', onboarding: { needed: false } } });
    expect(await attempt()).toEqual({ redirected: false, target: null });
  });

  it('never traps: a failing lookup advances instead of redirecting', async () => {
    authenticate();
    stubMe({ error: { code: 'internal_error', message: 'boom' } }, 500);
    expect(await attempt()).toEqual({ redirected: false, target: null });
  });

  it('treats an engine build without the flag as onboarded (positive truth only)', async () => {
    authenticate();
    stubMe({ account: { id: 'acc_1', display_name: 'Ada' } });
    expect(await attempt()).toEqual({ redirected: false, target: null });
  });

  it('never redirects the welcome screen onto itself', async () => {
    authenticate();
    window.history.pushState({}, '', '/platform/welcome?return=%2Fplatform');
    stubMe({ account: { id: 'acc_1', onboarding: { needed: true } } });
    expect(await attempt()).toEqual({ redirected: false, target: null });
  });
});
