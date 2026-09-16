/**
 * Post-login router (first-run ledger F1-3 / F2-4): where the OP callback lands
 * after a successful code exchange.
 *
 * Precedence (fixed — do not reorder without a ledger amendment):
 *   1. Usable invite stash → the invite page (F2 owns the rest).
 *   2. Invite URL riding as the return target (stash lost, link kept) → invite
 *      page with the token re-attached (the page re-stashes from the URL).
 *   3. The server's first-run gate is OPEN (`account.onboarding.needed`, F1-7:
 *      the account has never completed /platform/welcome, or its recorded
 *      consent predates the current terms version) → welcome.
 *   4. Otherwise → the stashed return target (already validated by the exchange).
 *
 * Step 3 used to be a wall-clock heuristic (one context + an account row under
 * 30 minutes old). That stranded real users: the first social account of this
 * deployment reached its first successful token exchange 75.8 minutes after
 * creation, so the window had closed and the screen never appeared. The gate is
 * durable server state now — see engine `account_onboarding`.
 *
 * Lookup failure at step 3 falls through to step 4: a broken contexts/account
 * read must never strand a fresh login (advance-anyway).
 */
import { isSafeReturnPath } from './auth';
import { needsOnboarding } from './first-run';
import { readInviteStash } from './invite-stash';
import { queryClient } from '../queryClient';
import { fetchOrgContexts } from '@/hooks/auth/useFirstRun';
import { fetchAccountProfile } from '@/hooks/auth/useAccount';

export interface PostLoginDestination {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
}

const WELCOME_PATH = '/platform/welcome';
const INVITE_PATH_RE = /^\/platform\/invites\/([^/?#]+)(?:\?([^#]*))?$/;

function inviteDestinationFromPath(path: string): PostLoginDestination | null {
  const match = INVITE_PATH_RE.exec(path);
  if (!match) {
    return null;
  }
  let inviteId: string;
  try {
    inviteId = decodeURIComponent(match[1]);
  } catch {
    return null;
  }
  if (!inviteId) {
    return null;
  }
  const urlToken = new URLSearchParams(match[2] ?? '').get('token');
  const stash = readInviteStash();
  // Never mix credentials across invites: the stash token rides only with its
  // own invite id.
  const token = urlToken ?? (stash && stash.inviteId === inviteId ? stash.token : null);
  if (!token) {
    return null;
  }
  return { to: '/platform/invites/$inviteId', params: { inviteId }, search: { token } };
}

export async function resolvePostLoginDestination(fallback: string): Promise<PostLoginDestination> {
  const safeFallback = isSafeReturnPath(fallback) ? fallback : '/platform';

  const stash = readInviteStash();
  if (stash) {
    return {
      to: '/platform/invites/$inviteId',
      params: { inviteId: stash.inviteId },
      search: { token: stash.token },
    };
  }

  const inviteFromFallback = inviteDestinationFromPath(safeFallback);
  if (inviteFromFallback) {
    return inviteFromFallback;
  }

  if (safeFallback !== WELCOME_PATH) {
    try {
      // fetchQuery (not a bare fetch): the router PRIMES the exact cache keys
      // the welcome page reads (['org','contexts'] + ['auth','me']), so a
      // fresh login never flies the same reads twice.
      const [, meRes] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: ['org', 'contexts'],
          queryFn: fetchOrgContexts,
          staleTime: 30_000,
        }),
        queryClient.fetchQuery({
          queryKey: ['auth', 'me'],
          queryFn: fetchAccountProfile,
          staleTime: 30_000,
        }),
      ]);
      // The server's durable first-run gate (F1-7): an account that has never
      // completed /platform/welcome routes there regardless of its age — the
      // wall clock it replaced stranded exactly the users whose first login
      // died mid-flow (network failure, dropped interaction, fixed CORS bug).
      if (needsOnboarding(meRes.account.onboarding)) {
        return safeFallback === '/platform'
          ? { to: WELCOME_PATH }
          : { to: WELCOME_PATH, search: { return: safeFallback } };
      }
    } catch {
      // Fall through to the return target (see module doc).
    }
  }

  return { to: safeFallback };
}
