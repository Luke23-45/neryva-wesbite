/**
 * Pending-invite stash (first-run ledger F2-2): the bridge between the invite
 * link and the post-login redeem.
 *
 * localStorage BY NECESSITY, not convenience: mobile OAuth app-switches and
 * new-tab sign-ins lose tab-scoped storage and would strand the user
 * post-callback. The value is a short-TTL single-purpose token, email-bound
 * (useless elsewhere); XSS could read it, but XSS already owns the session —
 * CSP is the control. Newest write wins. Router ignores stashes older than
 * 30 minutes; the invite page re-stashes from the URL on every load, so total
 * storage loss self-heals via the email link.
 */

const STASH_KEY = 'neryva.pending_invite';

/** Maximum stash age the post-login router honors. Ledger constant. */
export const INVITE_STASH_MAX_AGE_MS = 30 * 60 * 1000;

export interface PendingInvite {
  inviteId: string;
  token: string;
  savedAt: number;
}

/** Stash an invite handoff (newest wins). Silent no-op on empty input. */
export function writeInviteStash(inviteId: string, token: string): void {
  if (!inviteId || !token) {
    return;
  }
  try {
    const value: PendingInvite = { inviteId, token, savedAt: Date.now() };
    localStorage.setItem(STASH_KEY, JSON.stringify(value));
  } catch {
    /* private mode — the URL self-heal covers the loss */
  }
}

/** Read the stash; null when absent, malformed, or older than the max age. */
export function readInviteStash(nowMs: number = Date.now()): PendingInvite | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STASH_KEY);
  } catch {
    return null;
  }
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PendingInvite>;
    if (
      typeof parsed.inviteId !== 'string' ||
      parsed.inviteId.length === 0 ||
      typeof parsed.token !== 'string' ||
      parsed.token.length === 0 ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null;
    }
    if (nowMs - parsed.savedAt > INVITE_STASH_MAX_AGE_MS) {
      return null;
    }
    return { inviteId: parsed.inviteId, token: parsed.token, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

/** Clear the stash (success + terminal failures). Never throws. */
export function clearInviteStash(): void {
  try {
    localStorage.removeItem(STASH_KEY);
  } catch {
    /* noop */
  }
}

const BANNER_KEY = 'neryva.invite_banner';

export interface InviteBanner {
  orgId: string;
  orgName: string;
  role: string;
  invitedBy: string;
}

/**
 * One-shot join banner, written on redeem success and read by the console
 * home. sessionStorage (tab-scoped, dies with the tab — it describes THIS
 * tab's navigation, not a credential). Dismissed explicitly, never auto.
 */
export function writeInviteBanner(banner: InviteBanner): void {
  try {
    sessionStorage.setItem(BANNER_KEY, JSON.stringify(banner));
  } catch {
    /* private mode — home simply shows no banner */
  }
}

export function readInviteBanner(): InviteBanner | null {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(BANNER_KEY);
  } catch {
    return null;
  }
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<InviteBanner>;
    if (
      typeof parsed.orgId !== 'string' ||
      typeof parsed.orgName !== 'string' ||
      typeof parsed.role !== 'string' ||
      typeof parsed.invitedBy !== 'string'
    ) {
      return null;
    }
    return { orgId: parsed.orgId, orgName: parsed.orgName, role: parsed.role, invitedBy: parsed.invitedBy };
  } catch {
    return null;
  }
}

export function clearInviteBanner(): void {
  try {
    sessionStorage.removeItem(BANNER_KEY);
  } catch {
    /* noop */
  }
}
