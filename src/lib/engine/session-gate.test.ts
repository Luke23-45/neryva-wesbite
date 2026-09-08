import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requireEngineSession } from './session-gate';
import { useSessionStore } from './auth';

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
          return new Response(JSON.stringify({ sub: 'acc_1', email: 'ada@neryva.test', name: 'Ada Lovelace' }), { status: 200 });
        }
        return new Response(null, { status: 404 });
      }),
    );

    await expect(requireEngineSession()).resolves.toBeUndefined();
    expect(useSessionStore.getState().status).toBe('authenticated');
    expect(useSessionStore.getState().accessToken).toBe('a.access');
  });

  it('redirects anonymous users to the OP with the deep link stashed, and parks the router', async () => {
    // No refresh token — the session is dead. beginLogin stashes the current
    // path, mints PKCE material, and hands off to the OP.
    const gate = requireEngineSession();
    let settled = false;
    void gate.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );

    await vi.waitFor(() => {
      expect(sessionStorage.getItem('neryva.pkce_verifier')).toBeTruthy();
      expect(sessionStorage.getItem('neryva.oauth_state')).toBeTruthy();
      expect(sessionStorage.getItem('neryva.post_login_return')).toBeTruthy();
    });
    // The guard parks the router while the full-page redirect is in flight.
    expect(settled).toBe(false);
    expect(useSessionStore.getState().status).toBe('anonymous');
  });
});
