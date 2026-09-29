/**
 * The signed-in account (ledger T-1) — GET/PATCH /auth/me plus the email
 * verification / email-change / linked-identity flows. Org-independent;
 * keyed ['studio','account'].
 *
 * A successful name change also updates the OP session store so the shell
 * chrome reflects it without a re-login.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useSessionStore } from '@lib/engine/auth';

export interface AccountInfo {
  id: string;
  email: string | null;
  name: string | null;
  emailVerified: boolean | null;
  timezone: string | null;
  locale: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function parseAccount(raw: unknown): AccountInfo | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const nested = typeof record.account === 'object' && record.account !== null ? (record.account as Record<string, unknown>) : record;
  const id = str(nested.sub) ?? str(nested.id) ?? str(nested.account_id);
  if (!id) {
    return null;
  }
  const verifiedRaw = nested.email_verified ?? nested.emailVerified;
  // P1-7: the engine never returns a pending email (repo-wide grep finds no
  // `pending_email` field; the change code is keyed per account, not per
  // address) — no pendingEmail field is parsed, and no banner can render.
  return {
    id,
    email: str(nested.email),
    name: str(nested.name) ?? str(nested.display_name),
    emailVerified: typeof verifiedRaw === 'boolean' ? verifiedRaw : null,
    timezone: str(nested.timezone) ?? str(nested.time_zone),
    locale: str(nested.locale) ?? str(nested.language),
  };
}

const ACCOUNT_KEY = ['studio', 'account'] as const;

export function useAccount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...ACCOUNT_KEY],
    queryFn: () => engine<unknown>('/auth/me'),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    select: parseAccount,
  });
}

/**
 * The engine's PATCH /auth/me accepts only `display_name` (P7-PF-07: sending
 * `name` 400s every save). Timezone/locale/bio have no engine storage —
 * the controls are honestly disabled (P7-PF-08, same class as A4-80).
 */
export interface AccountPatch {
  display_name?: string;
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: AccountPatch) => engine<unknown>('/auth/me', { method: 'PATCH', body: patch }),
    onSuccess: (_data, patch) => {
      // Keep the shell chrome in step with the server without a re-login.
      if (patch.display_name) {
        useSessionStore.setState((state) =>
          state.account ? { account: { ...state.account, name: patch.display_name ?? null } } : state,
        );
      }
      void queryClient.invalidateQueries({ queryKey: [...ACCOUNT_KEY] });
    },
    onError: (error) => toastEngineError(error, 'Could not save your profile'),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) =>
      engine('/auth/me/password', {
        method: 'POST',
        body: { current_password: input.currentPassword, new_password: input.newPassword },
      }),
    onError: (error) => toastEngineError(error, 'Could not change the password'),
  });
}

export function useRequestEmailVerification() {
  return useMutation({
    mutationFn: async () => engine('/auth/me/email-verification/request', { method: 'POST' }),
    onError: (error) => toastEngineError(error, 'Could not send the verification email'),
  });
}

/**
 * Email change, step 1 — POST /auth/me/email-change/request.
 *
 * The engine re-authenticates here: `current_password` is mandatory when the
 * account has a password set, and a live TOTP/recovery `code` is mandatory
 * when two-factor is enrolled (`email-change.service.ts`). Neither is
 * knowable from GET /auth/me (it exposes no password flag), so the form
 * collects both conditionally and we send exactly the non-empty ones —
 * sending an empty string would trip the engine's verification, not be
 * ignored.
 */
export interface EmailChangeRequest {
  newEmail: string;
  currentPassword?: string;
  code?: string;
}

export function useRequestEmailChange() {
  return useMutation({
    mutationFn: async (input: EmailChangeRequest) => {
      const body: Record<string, string> = { new_email: input.newEmail.trim() };
      const password = input.currentPassword?.trim();
      const code = input.code?.trim();
      if (password) {
        body.current_password = password;
      }
      if (code) {
        body.code = code;
      }
      return engine('/auth/me/email-change/request', { method: 'POST', body });
    },
    onError: (error) => toastEngineError(error, 'Could not start the email change'),
  });
}

/**
 * Email change, step 2 — POST /auth/me/email-change/confirm.
 *
 * The engine requires BOTH fields (`account.controller.ts` 400s on a
 * missing `new_email`); the new address is carried forward from the
 * request step's state, never re-typed, so it cannot desync.
 */
export interface EmailChangeConfirm {
  newEmail: string;
  code: string;
}

export function useConfirmEmailChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: EmailChangeConfirm) =>
      engine('/auth/me/email-change/confirm', {
        method: 'POST',
        body: { new_email: input.newEmail.trim(), code: input.code.trim() },
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...ACCOUNT_KEY] }),
    onError: (error) => toastEngineError(error, 'Could not confirm the email change'),
  });
}

export interface AccountIdentity {
  id: string;
  provider: string;
  identifier: string | null;
}

export function parseIdentities(raw: unknown): AccountIdentity[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw)
    ? raw
    : [record.identities, record.linked_identities].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.identity_id);
      if (!id) {
        return null;
      }
      return {
        id,
        provider: str(item.provider) ?? str(item.provider_type) ?? str(item.issuer) ?? 'Unknown provider',
        identifier: str(item.email) ?? str(item.identifier) ?? str(item.subject),
      } satisfies AccountIdentity;
    })
    .filter((i): i is AccountIdentity => i !== null);
}

export function useIdentities(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...ACCOUNT_KEY, 'identities'],
    queryFn: () => engine<unknown>('/auth/me/identities'),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    select: parseIdentities,
  });
}

export function useUnlinkIdentity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (identityId: string) =>
      engine(`/auth/me/identities/${identityId}/unlink`, { method: 'POST' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...ACCOUNT_KEY, 'identities'] }),
    onError: (error) => toastEngineError(error, 'Could not unlink the account'),
  });
}

export interface DeletionStatus {
  status: 'none' | 'scheduled';
  scheduledPurgeAt: string | null;
}

/**
 * GET /auth/me/deletion-status returns `{ deletion: { scheduled_purge_at } | null }`
 * (`account.controller.ts`) — the engine never emits a `status` field. The
 * account has a pending deletion iff a deletion object is present (P1-10);
 * the old parser read `deletion.status`, always fell back to `'none'`, and
 * hid scheduled deletions from the Danger zone.
 */
export function parseDeletionStatus(raw: unknown): DeletionStatus {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const deletion =
    typeof record.deletion === 'object' && record.deletion !== null
      ? (record.deletion as Record<string, unknown>)
      : null;
  return {
    status: deletion ? 'scheduled' : 'none',
    scheduledPurgeAt: deletion ? (str(deletion.scheduled_purge_at) ?? str(deletion.scheduledPurgeAt)) : null,
  };
}

export function useDeletionStatus(options?: { enabled?: boolean; pollWhilePending?: boolean }) {
  return useQuery({
    queryKey: [...ACCOUNT_KEY, 'deletion-status'],
    queryFn: () => engine<unknown>('/auth/me/deletion-status'),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    refetchInterval: options?.pollWhilePending ? 30_000 : undefined,
    select: parseDeletionStatus,
  });
}

/**
 * Account deletion, step 1 — POST /auth/me/delete.
 *
 * Mirrors the email-change request pattern: the engine re-authenticates here
 * (`account-deletion.service.ts` requires the current password when one is
 * set and a live TOTP/recovery `code` when two-factor is enrolled, 403ing
 * otherwise), so the form collects both and we send exactly the non-empty
 * ones — sending an empty string would trip verification, not be ignored.
 * Scheduling revokes every session immediately; the engine answers
 * `{ scheduled_purge_at }` and the purge itself runs at that timestamp.
 */
export interface DeletionRequest {
  currentPassword?: string;
  code?: string;
}

export function buildDeletionBody(input: DeletionRequest): Record<string, string> {
  const body: Record<string, string> = {};
  const password = input.currentPassword?.trim();
  const code = input.code?.trim();
  if (password) {
    body.password = password;
  }
  if (code) {
    body.code = code;
  }
  return body;
}

export function useRequestAccountDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DeletionRequest) =>
      engine<{ scheduled_purge_at: string }>('/auth/me/delete', { method: 'POST', body: buildDeletionBody(input) }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...ACCOUNT_KEY, 'deletion-status'] }),
    onError: (error) => toastEngineError(error, 'Could not schedule account deletion'),
  });
}

export function useCancelAccountDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => engine('/auth/me/delete/cancel', { method: 'POST' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...ACCOUNT_KEY, 'deletion-status'] }),
    onError: (error) => toastEngineError(error, 'Could not cancel the deletion'),
  });
}
