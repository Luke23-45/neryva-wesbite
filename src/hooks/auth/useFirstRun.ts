/**
 * First-run data hooks (first-run ledger F1/F2): every backend read/write the
 * welcome screen, invite page, and post-login router perform — as TanStack
 * Query hooks, following the frontend standard (hooks own server state;
 * `engine()` is transport only, never called from views for cached reads).
 *
 * Key families (coherent with the invalidators that own them):
 *  - ['org', 'contexts'] — OrgContext family (`invalidateOrgScope` drops it).
 *  - ['auth', 'invite-preview', inviteId] — auth family (`invalidateAuthScope`
 *    drops it on session change/logout, so one mailbox's preview never leaks
 *    into the next session).
 *  - ['auth', 'me'] — owned by `hooks/auth/useAccount`; the post-login router
 *    primes it via fetchQuery so the welcome page never refetches.
 *
 * Deliberate deviations (documented, not accidental):
 *  - No success/error toasts here. The welcome/invite UX renders exact inline
 *    copy per outcome (ledger tables); a generic toast would double-report.
 *  - `useRedeemInvite` / `useSaveWelcomeNames` skip `useOrgRequired` on
 *    purpose: redeem runs outside any org scope by design, and the welcome
 *    org id comes from the freshness-checked contexts prop.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, engine } from '@lib/engine/client';
import { useSessionStore } from '@lib/engine/auth';
import type { OnboardingState } from '@lib/engine/first-run';
import { invalidateAuthScope, invalidateOrgScope } from '@lib/queryClient';
import { useIsAuthenticated } from './useSession';
import type { EngineAccount } from './useAccount';

// ── Org contexts (freshness input + welcome org) ─────────────────────────────

export interface OrgContextItem {
  orgId: string;
  role: string;
  name: string | null;
}

export async function fetchOrgContexts(): Promise<{ contexts: OrgContextItem[] }> {
  return engine<{ contexts: OrgContextItem[] }>('/console/org/contexts');
}

export function useOrgContexts() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ['org', 'contexts'],
    queryFn: fetchOrgContexts,
    enabled: authenticated,
    staleTime: 30_000,
  });
}

// ── Invite preview (public, pre-login capable) ───────────────────────────────

export interface InvitePreview {
  org_name: string;
  role: string;
  expires_at: string;
  invited_by: string;
  email_hint: string;
}

export function useInvitePreview(inviteId: string | undefined, token: string | undefined) {
  const creds = inviteId && token ? { inviteId, token } : null;
  return useQuery({
    // The token rides the key so a rotated link (same inviteId, new token)
    // never serves the previous token's cached preview within staleTime —
    // a resend would otherwise show a stale invalid/valid verdict for 30s.
    // Memory-only (never persisted); auth-scope invalidation still drops it
    // with one prefix.
    queryKey: ['auth', 'invite-preview', creds?.inviteId, creds?.token ?? null],
    queryFn: () =>
      engine<InvitePreview>(`/console/org/invites/${creds?.inviteId}/preview`, {
        method: 'POST',
        body: { token: creds?.token },
      }),
    // A 404 here is a terminal answer (uniform invalid for every non-usable
    // state) — never retry, never burn rate-limit budget.
    enabled: creds !== null,
    retry: false,
    staleTime: 30_000,
  });
}

// ── Invite redeem (outside any org scope by design) ──────────────────────────

export interface RedeemResult {
  ok: boolean;
  orgId: string;
  role: string;
}

export function useRedeemInvite() {
  // No toast here: the invite page maps exact inline copy per outcome
  // (mismatch/full/terminal/transient) — see InviteSection.
  return useMutation({
    mutationFn: async (input: { inviteId: string; token: string }): Promise<RedeemResult> =>
      engine<RedeemResult>(`/console/org/invites/${input.inviteId}/redeem`, {
        method: 'POST',
        body: { token: input.token },
        idempotent: true,
      }),
  });
}

// ── Onboarding completion + consent (first-run ledger F1-7) ─────────────────

export interface OnboardingCompleteResult {
  ok: true;
  onboarding: OnboardingState;
}

/**
 * Close the first-run gate: records consent (mandatory server-side — a body
 * without it is refused, never recorded as agreement) plus the completion
 * stamp, then writes the SERVER'S answer straight into the `['auth','me']`
 * cache entry the route gate and the welcome page read. That cache write is
 * what makes "once and never again" hold: the very next navigation cannot
 * race a refetch and bounce the user back into the screen they just finished.
 *
 * Rejections are deliberate, not swallowed:
 *  - 409 (consent offered against a stale terms version) → the section
 *    re-renders the current copy and asks again;
 *  - transport/5xx → the section stays with a retry, because advancing on a
 *    failed completion would bounce straight back through the gate.
 */
export function useCompleteOnboarding() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { skipped: boolean; termsVersion: string }): Promise<OnboardingCompleteResult> =>
      engine<OnboardingCompleteResult>('/auth/me/onboarding/welcome', {
        method: 'POST',
        body: { consented: true, skipped: input.skipped, terms_version: input.termsVersion },
        idempotent: true,
      }),
    onSuccess: (result) => {
      client.setQueryData<{ account: EngineAccount } | undefined>(['auth', 'me'], (current) =>
        current ? { account: { ...current.account, onboarding: result.onboarding } } : current,
      );
      void invalidateAuthScope();
      void invalidateOrgScope();
    },
  });
}

// ── Welcome writes (dual optional PATCHes, advance-anyway discipline) ────────

export interface WelcomeWrites {
  displayName: string | null;
  workspaceName: string | null;
  orgId: string;
}

export interface WelcomeWriteResult {
  /** Verbatim server 422 copy per field; null when that write is fine/skipped. */
  nameError: string | null;
  workspaceError: string | null;
  /** A non-validation failure happened (toast + advance anyway). */
  transportFailed: boolean;
  /** True when the display-name write actually landed (chrome sync). */
  nameSaved: boolean;
  /** True when the workspace write actually landed (cache sync). */
  workspaceSaved: boolean;
  savedName: string | null;
}

export function useSaveWelcomeNames() {
  // The mutation never rejects for ApiErrors: 422s and transport failures are
  // DATA (the section decides hold-vs-advance), not exceptions. Only truly
  // unexpected throws escape — the section still advances on those.
  return useMutation({
    mutationFn: async (input: WelcomeWrites): Promise<WelcomeWriteResult> => {
      const tasks: Array<{ key: 'name' | 'workspace'; run: () => Promise<unknown> }> = [];
      if (input.displayName) {
        tasks.push({
          key: 'name',
          run: () =>
            engine('/auth/me', {
              method: 'PATCH',
              body: { display_name: input.displayName },
              idempotent: true,
            }),
        });
      }
      if (input.workspaceName) {
        tasks.push({
          key: 'workspace',
          run: () =>
            engine(`/console/org/${input.orgId}/settings`, {
              method: 'PATCH',
              body: { name: input.workspaceName },
              idempotent: true,
              orgId: input.orgId,
            }),
        });
      }
      const settled = await Promise.allSettled(tasks.map((t) => t.run()));
      let nameError: string | null = null;
      let workspaceError: string | null = null;
      let transportFailed = false;
      let nameSaved = false;
      let workspaceSaved = false;
      settled.forEach((outcome, index) => {
        const key = tasks[index].key;
        if (outcome.status === 'fulfilled') {
          if (key === 'name') {
            nameSaved = true;
          } else {
            workspaceSaved = true;
          }
          return;
        }
        const reason = outcome.reason as unknown;
        if (reason instanceof ApiError && reason.status === 422) {
          if (key === 'name') {
            nameError = reason.message;
          } else {
            workspaceError = reason.message;
          }
        } else {
          transportFailed = true;
        }
      });
      return {
        nameError,
        workspaceError,
        transportFailed,
        nameSaved,
        workspaceSaved,
        savedName: nameSaved ? input.displayName : null,
      };
    },
    onSuccess: (result) => {
      // Keep shell chrome in step without a reload (studio useUpdateAccount
      // pattern); refresh server-derived caches only for what actually saved.
      if (result.savedName) {
        useSessionStore.setState((state) =>
          state.account ? { account: { ...state.account, name: result.savedName } } : state,
        );
      }
      if (result.nameSaved || result.workspaceSaved) {
        void invalidateAuthScope();
        void invalidateOrgScope();
      }
    },
  });
}
