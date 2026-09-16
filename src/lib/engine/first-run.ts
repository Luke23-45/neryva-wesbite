/**
 * First-run helpers (first-run ledger F1-7). Pure — safe to unit-cover.
 *
 * HISTORY — why this file no longer exports a freshness window:
 * the original gate inferred "first login" from `contexts.length === 1` AND
 * `account.created_at` within 30 minutes. That wall clock was provably wrong
 * in production: the first social account completed its first console token
 * exchange 75.8 minutes after creation (its earlier logins died mid-flow in
 * the social interaction / token-CORS era), so the window had closed by the
 * time the browser could reach the app — /platform/welcome never rendered,
 * and nothing could bring it back. The gate is now the server's durable
 * `account.onboarding.needed` (engine table `account_onboarding`).
 *
 * The browser still decides nothing: it reads the server flag and routes.
 */

export interface ContextSummary {
  orgId: string;
  role?: string;
  name?: string | null;
}

/**
 * The server-computed onboarding block from `GET /auth/me` (engine
 * `OnboardingState`). `needed` is the only routing input.
 */
export interface OnboardingState {
  needed: boolean;
  welcome_completed_at: string | null;
  welcome_skipped: boolean;
  consent_version: string | null;
  /** The terms version the account must consent to right now. */
  terms_version: string;
  /** Consent-copy links; empty ⇒ render the statement with no link. */
  terms_url: string;
  privacy_url: string;
}

/**
 * Positive-truth gate: only an explicit `needed: true` re-routes a session to
 * /platform/welcome. A missing block (older engine build, partial payload) or
 * a failed lookup resolves false, so a deployment mismatch or a broken read
 * can never trap a user in the onboarding screen (advance-anyway, F1-6).
 */
export function needsOnboarding(onboarding: OnboardingState | null | undefined): boolean {
  return onboarding?.needed === true;
}

/**
 * Email local-part for prefill defaults. Mirrors the server fallback
 * (`accounts.service` upsert/claims default to the local part), so the UI can
 * never render an undefined name — including exotic IdPs (Apple relay,
 * locked-down GitHub).
 */
export function emailLocalPart(email: string | null | undefined): string {
  if (!email) {
    return 'you';
  }
  const at = email.indexOf('@');
  const local = (at === -1 ? email : email.slice(0, at)).trim();
  return local.length > 0 ? local : 'you';
}
