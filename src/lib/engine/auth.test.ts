import { beforeEach, describe, expect, it } from 'vitest';
import { attemptSilentAuth, isSafeReturnPath } from './auth';

describe('isSafeReturnPath', () => {
  it('accepts in-app paths with query strings', () => {
    expect(isSafeReturnPath('/platform')).toBe(true);
    expect(isSafeReturnPath('/agent-studio/chat?assistant=abc')).toBe(true);
    expect(isSafeReturnPath('/platform/auth/callback?code=x&state=y')).toBe(true);
    expect(isSafeReturnPath('/')).toBe(true);
  });

  it('rejects anything that could leave the app', () => {
    expect(isSafeReturnPath(null)).toBe(false);
    expect(isSafeReturnPath(undefined)).toBe(false);
    expect(isSafeReturnPath('')).toBe(false);
    expect(isSafeReturnPath('https://evil.test/phish')).toBe(false);
    expect(isSafeReturnPath('http://localhost:3001/health/live')).toBe(false);
    expect(isSafeReturnPath('//evil.test/platform')).toBe(false);
    expect(isSafeReturnPath('javascript:alert(1)')).toBe(false);
    expect(isSafeReturnPath('/\\evil.test')).toBe(false);
    expect(isSafeReturnPath('/platform\r\nSet-Cookie: x')).toBe(false);
  });
});

/**
 * Regression: the silent (prompt=none iframe) flow and the interactive login
 * used to share the neryva.oauth_state / neryva.pkce_verifier sessionStorage
 * keys. On slow networks the iframe's late failure/timeout wiped the keys an
 * in-flight "Continue with email" had just stored, so every callback died
 * with "Login state mismatch". The flows now keep separate keys; these tests
 * pin the isolation on both silent-failure paths.
 */
describe('attemptSilentAuth key isolation', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('a silent-flow timeout never wipes an in-flight interactive login', async () => {
    // What beginLogin() stores before navigating to the OP.
    sessionStorage.setItem('neryva.pkce_verifier', 'interactive-verifier');
    sessionStorage.setItem('neryva.oauth_state', 'interactive-state');
    // Silent flow starts, gets no postMessage, and fails on its short test
    // timeout (50ms under vitest).
    const ok = await attemptSilentAuth();
    expect(ok).toBe(false);
    expect(sessionStorage.getItem('neryva.oauth_state')).toBe('interactive-state');
    expect(sessionStorage.getItem('neryva.pkce_verifier')).toBe('interactive-verifier');
  });

  it('a late silent-flow error postMessage never wipes an in-flight interactive login', async () => {
    sessionStorage.setItem('neryva.pkce_verifier', 'interactive-verifier');
    sessionStorage.setItem('neryva.oauth_state', 'interactive-state');
    const pending = attemptSilentAuth();
    // Let the async setup (PKCE challenge + message listener) complete.
    await new Promise((r) => setTimeout(r, 10));
    // The iframe reports login_required AFTER the interactive login stored
    // its keys — the exact interleaving that used to destroy the login.
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: window.location.origin,
        data: { type: 'neryva:silent-auth', error: 'login_required' },
      }),
    );
    const ok = await pending;
    expect(ok).toBe(false);
    expect(sessionStorage.getItem('neryva.oauth_state')).toBe('interactive-state');
    expect(sessionStorage.getItem('neryva.pkce_verifier')).toBe('interactive-verifier');
  });
});
