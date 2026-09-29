import { describe, expect, it } from 'vitest';
import { isOAuthLinked, findVerifiedOAuthAccount } from './oauthLinkProof';
import type { ConnectorAccount } from '@hooks/studio/useSetupConnectors';

function account(overrides: Partial<ConnectorAccount>): ConnectorAccount {
  return {
    id: 'acc-1',
    provider: 'google_drive',
    displayName: 'Drive',
    state: 'active',
    lastSyncedAt: null,
    lastError: null,
    hasCredentials: true,
    createdBy: null,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

describe('isOAuthLinked (L3)', () => {
  it('accepts an active account with sealed credentials — the callback proof', () => {
    // The engine callback persists the sealed token bundle (hasCredentials)
    // and flips the account active. This is the per-account proof; the
    // landing page additionally scopes it to the callback-named account id
    // (see findVerifiedOAuthAccount) so a hand-typed ?oauth=connected cannot
    // borrow proof from an unrelated linked account.
    expect(isOAuthLinked(account({ state: 'active', hasCredentials: true }))).toBe(true);
  });

  it('rejects an active account without credentials (e.g. keyless sitemap)', () => {
    expect(isOAuthLinked(account({ state: 'active', hasCredentials: false }))).toBe(false);
  });

  it('rejects a paused account even with credentials', () => {
    expect(isOAuthLinked(account({ state: 'paused', hasCredentials: true }))).toBe(false);
  });

  it('rejects an error-state account even with credentials', () => {
    expect(isOAuthLinked(account({ state: 'error', hasCredentials: true }))).toBe(false);
  });

  it('rejects unknown states', () => {
    expect(isOAuthLinked(account({ state: 'unknown', hasCredentials: true }))).toBe(false);
  });
});

describe('findVerifiedOAuthAccount (NG-1 dance-scoped proof)', () => {
  const linked = account({ id: 'acc-linked', state: 'active', hasCredentials: true });
  const manual = account({ id: 'acc-manual', state: 'active', hasCredentials: true });
  const paused = account({ id: 'acc-paused', state: 'paused', hasCredentials: true });
  const accounts = [linked, manual, paused];

  it('verifies the callback-named account when it is linked', () => {
    expect(findVerifiedOAuthAccount(accounts, 'acc-linked')).toBe(linked);
  });

  it('fails closed when the account id is missing (hand-typed ?oauth=connected)', () => {
    expect(findVerifiedOAuthAccount(accounts, undefined)).toBeUndefined();
  });

  it('fails closed for an unknown account id', () => {
    expect(findVerifiedOAuthAccount(accounts, 'acc-nope')).toBeUndefined();
  });

  it('fails closed when the named account is not linked', () => {
    expect(findVerifiedOAuthAccount(accounts, 'acc-paused')).toBeUndefined();
  });

  it('does not borrow proof from an unrelated linked account', () => {
    // The residual NG-1 case: ?oauth=connected&account=acc-manual where
    // acc-manual is a manually-linked static-credential account. The page may
    // only assert "this account is linked" for the named account — verified
    // live — never success for the dance on acc-linked.
    expect(findVerifiedOAuthAccount(accounts, 'acc-manual')).toBe(manual);
    expect(findVerifiedOAuthAccount(accounts, 'acc-manual')).not.toBe(linked);
  });

  it('fails closed on an empty account list', () => {
    expect(findVerifiedOAuthAccount([], 'acc-linked')).toBeUndefined();
  });
});
