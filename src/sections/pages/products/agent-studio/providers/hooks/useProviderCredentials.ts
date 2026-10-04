/**
 * Providers Phase 5 — Wave B: react-query hooks for provider credentials.
 *
 * Wraps the shared `../api.ts` contract (N-1/N-2/N-3/N-7). Every mutation
 * invalidates the credential list query so cards re-render from server
 * state. Error copy is rendered by callers from `ApiError.message` only —
 * never stack traces or raw upstream bodies.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCredential,
  fetchCredentialUsage,
  fetchCredentials,
  patchCredential,
  revokeCredential,
  rotateCredential,
  verifyCredential,
  type CreateCredentialInput,
  type CredentialUsageView,
  type ProviderCredentialView,
} from '../api';

export const providerCredentialsKeys = {
  all: (orgId: string) => ['org', orgId, 'provider-credentials'] as const,
  list: (orgId: string) => [...providerCredentialsKeys.all(orgId), 'list'] as const,
  usage: (orgId: string, id: string, window: '7d' | '30d') =>
    [...providerCredentialsKeys.all(orgId), 'usage', id, window] as const,
};

export type PatchCredentialInput = Omit<
  Partial<Omit<CreateCredentialInput, 'provider' | 'secret'>>,
  'allowed_models' | 'allowed_assistants'
> & {
  enabled?: boolean;
  /**
   * The Omit above is load-bearing: intersecting `allowed_models?: string[]`
   * (from the Partial) with `allowed_models?: string[] | null` would narrow
   * back to `string[]`. The engine PATCH explicitly accepts `null` to clear
   * a filter while `undefined` leaves it unchanged — see the cast at the
   * call site.
   */
  allowed_models?: string[] | null;
  allowed_assistants?: string[] | null;
};

/** Credential list for Tab B. Disabled until an org id is present. */
export function useCredentials(orgId: string | null) {
  return useQuery({
    queryKey: providerCredentialsKeys.list(orgId ?? 'none'),
    queryFn: () => fetchCredentials(orgId as string),
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

/** Per-credential observability (N-7): requests, spend, error breakdown. */
export function useCredentialUsage(orgId: string | null, id: string, window: '7d' | '30d') {
  return useQuery<CredentialUsageView>({
    queryKey: providerCredentialsKeys.usage(orgId ?? 'none', id, window),
    queryFn: () => fetchCredentialUsage(orgId as string, id, window),
    enabled: !!orgId && !!id,
    staleTime: 60_000,
  });
}

export interface CredentialMutations {
  create: ReturnType<typeof useMutation<{ credential: ProviderCredentialView }, Error, CreateCredentialInput>>;
  patch: ReturnType<typeof useMutation<{ credential: ProviderCredentialView }, Error, { id: string; patch: PatchCredentialInput }>>;
  verify: ReturnType<typeof useMutation<{ credential: ProviderCredentialView }, Error, string>>;
  rotate: ReturnType<typeof useMutation<{ credential: ProviderCredentialView }, Error, { id: string; secret: string }>>;
  revoke: ReturnType<typeof useMutation<{ credential: ProviderCredentialView }, Error, { id: string; reason?: string }>>;
}

/**
 * All credential mutations for one org. Each invalidates the list query on
 * success so every card reflects server state (no optimistic patching of
 * secrets-adjacent rows).
 */
export function useCredentialMutations(orgId: string): CredentialMutations {
  const queryClient = useQueryClient();
  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: providerCredentialsKeys.list(orgId) });

  const create = useMutation({
    mutationFn: (input: CreateCredentialInput) => createCredential(orgId, input),
    onSuccess: () => invalidateList(),
  });
  const patch = useMutation({
    mutationFn: ({ id, patch: body }: { id: string; patch: PatchCredentialInput }) =>
      // Cast: api.ts types allowed_models as string[] but the engine PATCH
      // accepts null (clear filter) — see PatchCredentialInput.
      patchCredential(orgId, id, body as Parameters<typeof patchCredential>[2]),
    onSuccess: () => invalidateList(),
  });
  const verify = useMutation({
    mutationFn: (id: string) => verifyCredential(orgId, id),
    onSuccess: () => invalidateList(),
  });
  const rotate = useMutation({
    mutationFn: ({ id, secret }: { id: string; secret: string }) =>
      rotateCredential(orgId, id, secret),
    onSuccess: () => invalidateList(),
  });
  const revoke = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      revokeCredential(orgId, id, reason),
    onSuccess: () => invalidateList(),
  });

  return { create, patch, verify, rotate, revoke };
}
