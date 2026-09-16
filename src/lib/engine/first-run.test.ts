import { describe, expect, it } from 'vitest';
import { emailLocalPart, needsOnboarding, type OnboardingState } from './first-run';

/**
 * The console half of the first-run gate contract (F1-7). The engine owns the
 * state; this module owns the ONE rule the browser applies to it: route only on
 * positive server truth.
 *
 * Regression anchor: the gate used to be `isFreshFirstRun(contexts, created_at)`
 * — a 30-minute wall-clock window that silently skipped the screen for any
 * account whose first login failed and who came back later. Nothing here may
 * reintroduce a time-based input.
 */
function onboarding(overrides: Partial<OnboardingState> = {}): OnboardingState {
  return {
    needed: true,
    welcome_completed_at: null,
    welcome_skipped: false,
    consent_version: null,
    terms_version: '2026-09-16',
    terms_url: '',
    privacy_url: '',
    ...overrides,
  };
}

describe('needsOnboarding', () => {
  it('routes the account only when the server says the gate is open', () => {
    expect(needsOnboarding(onboarding({ needed: true }))).toBe(true);
    expect(needsOnboarding(onboarding({ needed: false }))).toBe(false);
  });

  it('treats a missing block as closed — an older engine must never trap a user', () => {
    expect(needsOnboarding(undefined)).toBe(false);
    expect(needsOnboarding(null)).toBe(false);
  });

  it('treats an absent flag on a present block as closed (partial payload)', () => {
    const partial = { ...onboarding(), needed: undefined as unknown as boolean };
    expect(needsOnboarding(partial)).toBe(false);
  });

  it('decides on `needed` alone, never on the copy fields', () => {
    expect(
      needsOnboarding(onboarding({ needed: false, terms_url: 'https://example.test/terms' })),
    ).toBe(false);
    expect(
      needsOnboarding(onboarding({ needed: true, terms_url: 'https://example.test/terms' })),
    ).toBe(true);
  });

  it('stays open for an account that never completed the screen, however old it is', () => {
    // The exact production shape that used to be skipped: a months-old account
    // with a completion stamp absent. Age is not an input any more.
    const stale = onboarding({
      needed: true,
      welcome_completed_at: null,
      consent_version: null,
    });
    expect(needsOnboarding(stale)).toBe(true);
  });

  it('stays open when a completion predates the current terms version', () => {
    // Server-side re-open (terms bump): the screen must be shown once more.
    const bumped = onboarding({
      needed: true,
      welcome_completed_at: '2026-01-01T00:00:00.000Z',
      consent_version: '2026-01-01',
      terms_version: '2026-09-16',
    });
    expect(needsOnboarding(bumped)).toBe(true);
  });
});

describe('emailLocalPart', () => {
  it('derives the local part of a normal address', () => {
    expect(emailLocalPart('ada@neryva.test')).toBe('ada');
  });

  it('falls back to "you" for empty/absent values', () => {
    expect(emailLocalPart(null)).toBe('you');
    expect(emailLocalPart(undefined)).toBe('you');
    expect(emailLocalPart('')).toBe('you');
    expect(emailLocalPart('   ')).toBe('you');
  });

  it('keeps exotic (IdP-relay) addresses usable', () => {
    expect(emailLocalPart('abc123@privaterelay.appleid.com')).toBe('abc123');
    expect(emailLocalPart('odd-address')).toBe('odd-address');
  });
});