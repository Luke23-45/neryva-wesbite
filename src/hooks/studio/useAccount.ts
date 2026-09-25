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
  pendingEmail: string | null;
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
  return {
    id,
    email: str(nested.email),
    name: str(nested.name) ?? str(nested.display_name),
    emailVerified: typeof verifiedRaw === 'boolean' ? verifiedRaw : null,
    pendingEmail: str(nested.pending_email) ?? str(nested.pendingEmail),
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

export function useRequestEmailChange() {
  return useMutation({
    mutationFn: async (newEmail: string) =>
      engine('/auth/me/email-change/request', { method: 'POST', body: { new_email: newEmail } }),
    // The pending email surfaces from /auth/me on the next refetch — the
    // account query is invalidated by the confirm step.
    onError: (error) => toastEngineError(error, 'Could not start the email change'),
  });
}

export function useConfirmEmailChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) =>
      engine('/auth/me/email-change/confirm', { method: 'POST', body: { code } }),
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
  status: 'none' | 'pending' | 'scheduled' | string;
  scheduledPurgeAt: string | null;
}

export function parseDeletionStatus(raw: unknown): DeletionStatus {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const deletion = typeof record.deletion === 'object' && record.deletion !== null ? (record.deletion as Record<string, unknown>) : record;
  return {
    status: str(deletion.status) ?? 'none',
    scheduledPurgeAt: str(deletion.scheduled_purge_at) ?? str(deletion.scheduledPurgeAt),
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

export function useRequestAccountDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => engine('/auth/me/delete', { method: 'POST', body: { confirmation: 'delete' } }),
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
