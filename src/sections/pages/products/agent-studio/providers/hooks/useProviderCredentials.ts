/**
 * Providers Phase 5 — Wave B: react-query hooks for provider credentials.
 *
 * Wraps the shared `../api.ts` contract (N-1/N-2/N-3/N-7). Every mutation
 * invalidates the credential list query so cards re-render from server
 * state. Error copy is rendered by callers from `ApiError.message` only —
 * never stack traces or raw upstream bodies.
 *
 * P1-6: the page-level `useCredentialMutations` keeps ONE shared `patch`
 * instance for page-level writes (drag reorder); per-card concerns
 * (enable toggle, fallback, attestations, scope filters) use
 * `usePatchCredentialField` — one independent mutation per concern, so one
 * in-flight patch no longer freezes every control on the card. The enable
 * toggle additionally gets `useOptimisticEnabledToggle` (optimistic with
 * rollback, mirroring the catalog pattern).
 *
 * P1-3: every credential mutation sends an idempotency key (the api layer
 * sets `idempotent: true` on create/patch/rotate/revoke; the create
 * mutation also accepts a caller-supplied key so a form can reuse one key
 * across manual retries of the same intent).
 *
 * Step-up: create/verify/rotate require a fresh MFA proof. They run through
 * `runWithStepUp` — if the proof expired between probe and create, the
 * StepUpModal re-prompts and the call retries with the fresh proof (P2
 * re-proof affordance) instead of surfacing a raw `step_up_required`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { runWithStepUp } from '@/lib/engine/stepup';
import {
  createCredential,
  fetchAssistants,
  fetchCredentialUsage,
  fetchCredentials,
  patchCredential,
  reorderCredentials,
  revokeCredential,
  rotateCredential,
  verifyCredential,
  type AssistantRef,
  type CreateCredentialInput,
  type CredentialUsageView,
  type ProviderCredentialView,
} from '../api';
import { groupedModelsKey } from './useGroupedModels';
import { providerDirectoryKeyPrefix } from './useProviderDirectory';

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

export interface CreateCredentialVariables {
  input: CreateCredentialInput;
  /**
   * Caller-supplied idempotency key. Forms keep one key per submit intent
   * (useRef) so a manual retry after a network failure replays the original
   * create instead of duplicating the credential. When omitted the api
   * layer generates a fresh key per call.
   */
  idempotencyKey?: string;
}

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

/**
 * Org assistant refs (P2): validates `allowed_assistants` scope IDs
 * client-side so a typo fails loudly at save time instead of silently
 * scoping the credential to nobody. Disabled until an org id is present.
 */
export function useAssistantRefs(orgId: string | null) {
  return useQuery<{ assistants: AssistantRef[] }>({
    queryKey: ['org', orgId ?? 'none', 'assistant-refs'],
    queryFn: () => fetchAssistants(orgId as string),
    enabled: !!orgId,
    staleTime: 60_000,
  });
}

export interface CredentialMutations {
  create: ReturnType<typeof useMutation<{ credential: ProviderCredentialView }, Error, CreateCredentialVariables>>;
  patch: ReturnType<typeof useMutation<{ credential: ProviderCredentialView }, Error, { id: string; patch: PatchCredentialInput }>>;
  verify: ReturnType<typeof useMutation<{ credential: ProviderCredentialView }, Error, string>>;
  rotate: ReturnType<typeof useMutation<{ credential: ProviderCredentialView }, Error, { id: string; secret: string }>>;
  revoke: ReturnType<typeof useMutation<{ credential: ProviderCredentialView }, Error, { id: string; reason?: string }>>;
}

function useInvalidateCredentialCaches(orgId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: providerCredentialsKeys.list(orgId) });
    queryClient.invalidateQueries({ queryKey: groupedModelsKey(orgId) });
    queryClient.invalidateQueries({ queryKey: providerDirectoryKeyPrefix(orgId) });
  };
}

/**
 * All credential mutations for one org. Each invalidates the list query on
 * success so every card reflects server state.
 *
 * W23: credential lifecycle changes (create/verify/rotate/revoke/patch) also
 * reshape the N-4 provider directory (discovered-model counts) and the N-5
 * grouped models (BYOK groups appear/disappear) — both queries are
 * invalidated here so the Catalog and Models tabs can never serve stale
 * counts after a credential change. The directory key is invalidated by
 * prefix so every filter variant refetches.
 */
export function useCredentialMutations(orgId: string): CredentialMutations {
  const invalidateCaches = useInvalidateCredentialCaches(orgId);

  const create = useMutation({
    mutationFn: ({ input, idempotencyKey }: CreateCredentialVariables) =>
      runWithStepUp('connect provider key', (proof) =>
        createCredential(orgId, input, { idempotencyKey, mfaProof: proof }),
      ),
    onSuccess: () => invalidateCaches(),
  });
  const patch = useMutation({
    mutationFn: ({ id, patch: body }: { id: string; patch: PatchCredentialInput }) =>
      // Cast: api.ts types allowed_models as string[] but the engine PATCH
      // accepts null (clear filter) — see PatchCredentialInput.
      patchCredential(orgId, id, body as Parameters<typeof patchCredential>[2]),
    onSuccess: () => invalidateCaches(),
  });
  const verify = useMutation({
    mutationFn: (id: string) =>
      runWithStepUp('verify provider key', (proof) => verifyCredential(orgId, id, { mfaProof: proof })),
    onSuccess: () => invalidateCaches(),
  });
  const rotate = useMutation({
    mutationFn: ({ id, secret }: { id: string; secret: string }) =>
      runWithStepUp('rotate provider key', (proof) =>
        rotateCredential(orgId, id, secret, { mfaProof: proof }),
      ),
    onSuccess: () => invalidateCaches(),
  });
  const revoke = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      revokeCredential(orgId, id, reason),
    onSuccess: () => invalidateCaches(),
  });

  return { create, patch, verify, rotate, revoke };
}

/**
 * usePatchCredentialField (P1-6) — one INDEPENDENT patch mutation per call.
 * KeyCard renders one per concern (fallback, attestations, scope filters) so
 * one in-flight patch no longer disables every unrelated control on the
 * card. Each instance carries its own `isPending`/`isError` state.
 */
export function usePatchCredentialField(orgId: string) {
  const invalidateCaches = useInvalidateCredentialCaches(orgId);
  return useMutation({
    mutationFn: ({ id, patch: body }: { id: string; patch: PatchCredentialInput }) =>
      patchCredential(orgId, id, body as Parameters<typeof patchCredential>[2]),
    onSuccess: () => invalidateCaches(),
  });
}

/**
 * useOptimisticEnabledToggle (P1-6) — the card's enable switch flips
 * immediately and rolls back on failure, mirroring the catalog's
 * `useModelToggles` optimistic pattern. A toast-worthy error is returned
 * to the caller via `onError` (KeyCard renders it as an inline alert).
 */
export function useOptimisticEnabledToggle(orgId: string) {
  const queryClient = useQueryClient();
  const listKey = providerCredentialsKeys.list(orgId);
  const invalidateCaches = useInvalidateCredentialCaches(orgId);

  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      patchCredential(orgId, id, { enabled }),
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const prev = queryClient.getQueryData<{ credentials: ProviderCredentialView[] }>(listKey);
      if (prev) {
        queryClient.setQueryData(listKey, {
          ...prev,
          credentials: prev.credentials.map((c) => (c.id === id ? { ...c, enabled } : c)),
        });
      }
      return { prev };
    },
    onError: (_error, _variables, context) => {
      if (context?.prev) queryClient.setQueryData(listKey, context.prev);
    },
    onSettled: () => invalidateCaches(),
  });
}

/**
 * useReorderPriorities (P1-3) — atomic drag reorder. ONE request carries
 * the full (id → priority) map to `POST .../reorder`, which applies it in
 * a single server-side transaction (all-or-nothing). Replaces the old
 * two-PATCH swap, which could half-apply.
 *
 * Optimistic: the list cache is reordered immediately for a responsive
 * drag; a failed reorder rolls the cache back to the pre-drop order and
 * the error is returned to the caller (MyProvidersPage renders it as an
 * alert — never swallowed). A dedicated mutation instance, so a reorder
 * in flight never disables card controls.
 */
export function useReorderPriorities(orgId: string) {
  const queryClient = useQueryClient();
  const listKey = providerCredentialsKeys.list(orgId);
  const invalidateCaches = useInvalidateCredentialCaches(orgId);

  return useMutation({
    mutationFn: (items: Array<{ id: string; priority: number }>) =>
      reorderCredentials(orgId, items),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const prev = queryClient.getQueryData<{ credentials: ProviderCredentialView[] }>(listKey);
      if (prev) {
        const priorityById = new Map(items.map((item) => [item.id, item.priority]));
        queryClient.setQueryData(listKey, {
          ...prev,
          credentials: prev.credentials.map((c) =>
            priorityById.has(c.id) ? { ...c, priority: priorityById.get(c.id) as number } : c,
          ),
        });
      }
      return { prev };
    },
    onError: (_error, _variables, context) => {
      if (context?.prev) queryClient.setQueryData(listKey, context.prev);
    },
    onSettled: () => invalidateCaches(),
  });
}
