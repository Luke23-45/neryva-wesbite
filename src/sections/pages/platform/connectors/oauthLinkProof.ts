import type { ConnectorAccount } from '@hooks/studio/useSetupConnectors';

/**
 * Server-side proof that an OAuth dance actually bound tokens (L3): the
 * engine's callback persists the sealed token bundle (`hasCredentials`) and
 * flips the account `active` (`connectors.service.ts handleOAuthCallback`).
 *
 * The proof is dance-scoped, not org-wide: the callback names the account it
 * bound (`?oauth=connected&account=<id>`), and the landing page verifies THAT
 * account's live server state via `findVerifiedOAuthAccount`. A hand-typed
 * `?oauth=connected` with no (or an unlinked) account id fails closed; a
 * hand-typed account id can only ever surface true statements, because the
 * page asserts "this account is linked" against live server state — never
 * "the dance just ran".
 */
export function isOAuthLinked(account: ConnectorAccount): boolean {
  return account.state === 'active' && account.hasCredentials === true;
}

/**
 * Returns the callback-named account iff it is currently linked on the
 * server. `undefined` account id, unknown id, or a not-linked account all
 * resolve to `undefined` (fail closed — the landing page renders
 * "not confirmed", never success).
 */
export function findVerifiedOAuthAccount(
  accounts: ConnectorAccount[],
  accountId: string | undefined,
): ConnectorAccount | undefined {
  if (!accountId) return undefined;
  return accounts.find((a) => a.id === accountId && isOAuthLinked(a));
}
