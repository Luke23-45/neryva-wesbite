/**
 * Org API keys — the surfaces the shared engine hooks don't cover yet
 * (ledger T-4): key detail, rotate, rename/rescope, and the project
 * binding plane. List/issue/revoke live in @hooks/engine.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { runWithStepUp } from '@lib/engine/stepup';
import { useOrg } from '@/Context/OrgContext';

export interface KeyDetailEvent {
  action: string | null;
  actorId: string | null;
  createdAt: string | null;
}

export interface KeyDetail {
  id: string;
  name: string | null;
  prefix: string | null;
  role: string | null;
  scopes: string[];
  revoked: boolean | null;
  expiresAt: string | null;
  /** Days until expiry as computed by the engine (null when the key never expires). */
  daysToExpiry: number | null;
  createdAt: string | null;
  lastUsedAt: string | null;
  usageCount: number | null;
  projectId: string | null;
  /** ≤50 most recent `key.*` audit rows for this key (engine K-3). */
  events: KeyDetailEvent[];
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function parseKeyDetail(raw: unknown): KeyDetail | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const nested = typeof record.key === 'object' && record.key !== null ? (record.key as Record<string, unknown>) : record;
  const id = str(nested.id) ?? str(nested.key_id);
  if (!id) {
    return null;
  }
  // The engine returns `project_binding: { project_id } | null` (keys.service
  // detail, K-3). `binding` is kept only as a legacy fallback — reading it
  // first was NEW-1 (drawer always showed "Not bound").
  const projectBinding =
    typeof nested.project_binding === 'object' && nested.project_binding !== null
      ? (nested.project_binding as Record<string, unknown>)
      : null;
  const legacyBinding = typeof nested.binding === 'object' && nested.binding !== null ? (nested.binding as Record<string, unknown>) : null;
  const rawEvents = Array.isArray(nested.events) ? nested.events : [];
  return {
    id,
    name: str(nested.name),
    prefix: str(nested.prefix),
    role: str(nested.role),
    scopes: Array.isArray(nested.scopes) ? nested.scopes.filter((s): s is string => typeof s === 'string') : [],
    revoked: typeof nested.revoked === 'boolean' ? nested.revoked : null,
    expiresAt: str(nested.expires_at) ?? str(nested.expiresAt),
    daysToExpiry:
      typeof nested.days_to_expiry === 'number' ? nested.days_to_expiry : typeof nested.daysToExpiry === 'number' ? nested.daysToExpiry : null,
    createdAt: str(nested.created_at) ?? str(nested.createdAt),
    lastUsedAt: str(nested.last_used_at) ?? str(nested.lastUsedAt),
    usageCount: typeof nested.usage_count === 'number' ? nested.usage_count : typeof nested.usageCount === 'number' ? nested.usageCount : null,
    projectId:
      str(projectBinding?.project_id) ?? str(projectBinding?.projectId) ?? str(legacyBinding?.project_id) ?? str(legacyBinding?.projectId) ?? str(nested.project_id),
    events: rawEvents
      .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
      .map((e) => ({ action: str(e.action), actorId: str(e.actor_id) ?? str(e.actorId), createdAt: str(e.created_at) ?? str(e.createdAt) })),
  };
}

export function useKeyDetail(keyId: string | null) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['studio', 'keys', orgId, 'detail', keyId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/keys/${keyId}`),
    enabled: !!orgId && !!keyId,
    staleTime: 30_000,
    select: parseKeyDetail,
  });
}


export function useRotateKey() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { keyId: string }) =>
      runWithStepUp('Rotate API key', (proof) =>
        engine<{ key?: string; secret?: string }>(`/console/org/${orgId}/keys/${input.keyId}/rotate`, {
          method: 'POST',
          ...(proof ? { mfaProof: proof } : {}),
        }),
      ),
    onSuccess: () => {
      // Shares the engine list cache so issue/revoke/rotate stay in step
      // with the /platform key surfaces.
      void queryClient.invalidateQueries({ queryKey: ['engine', 'keys'] });
      // P5-E21: the key drawer reads useKeyDetail (['studio','keys',…,'detail'],
      // staleTime 30s) which the ['engine','keys'] invalidation does not touch —
      // without this the open drawer showed the old name/binding/usage for up
      // to 30s after the mutation it just performed.
      void queryClient.invalidateQueries({ queryKey: ['studio', 'keys'] });
    },
    onError: (error) => toastEngineError(error, 'Could not rotate the key'),
  });
}

export function useUpdateKey() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    // NEW-5: the engine requires @RequireStepUp() on PATCH /keys/:keyId —
    // a raw mutation meant every rename failed with step_up_required.
    // runWithStepUp acquires the MFA proof on demand, exactly like rotate.
    mutationFn: async (input: { keyId: string; name?: string; scopes?: string[] }) =>
      runWithStepUp('Rename API key', (proof) => {
        const body: Record<string, unknown> = {};
        if (input.name !== undefined) body.name = input.name;
        if (input.scopes !== undefined) body.scopes = input.scopes;
        return engine(`/console/org/${orgId}/keys/${input.keyId}`, {
          method: 'PATCH',
          body,
          ...(proof ? { mfaProof: proof } : {}),
        });
      }),
    onSuccess: () => {
      // Shares the engine list cache so issue/revoke/rotate stay in step
      // with the /platform key surfaces.
      void queryClient.invalidateQueries({ queryKey: ['engine', 'keys'] });
      // P5-E21: the key drawer reads useKeyDetail (['studio','keys',…,'detail'],
      // staleTime 30s) which the ['engine','keys'] invalidation does not touch —
      // without this the open drawer showed the old name/binding/usage for up
      // to 30s after the mutation it just performed.
      void queryClient.invalidateQueries({ queryKey: ['studio', 'keys'] });
    },
    onError: (error) => toastEngineError(error, 'Could not update the key'),
  });
}

export function useBindKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { keyId: string; projectId: string }) =>
      engine(`/console/studio-furniture/keys/${input.keyId}/bind`, { method: 'POST', body: { project_id: input.projectId } }),
    onSuccess: () => {
      // Shares the engine list cache so issue/revoke/rotate stay in step
      // with the /platform key surfaces.
      void queryClient.invalidateQueries({ queryKey: ['engine', 'keys'] });
      // P5-E21: the key drawer reads useKeyDetail (['studio','keys',…,'detail'],
      // staleTime 30s) which the ['engine','keys'] invalidation does not touch —
      // without this the open drawer showed the old name/binding/usage for up
      // to 30s after the mutation it just performed.
      void queryClient.invalidateQueries({ queryKey: ['studio', 'keys'] });
    },
    onError: (error) => toastEngineError(error, 'Could not bind the key to the project'),
  });
}

export function useUnbindKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { keyId: string }) =>
      engine(`/console/studio-furniture/keys/${input.keyId}/unbind`, { method: 'POST' }),
    onSuccess: () => {
      // Shares the engine list cache so issue/revoke/rotate stay in step
      // with the /platform key surfaces.
      void queryClient.invalidateQueries({ queryKey: ['engine', 'keys'] });
      // P5-E21: the key drawer reads useKeyDetail (['studio','keys',…,'detail'],
      // staleTime 30s) which the ['engine','keys'] invalidation does not touch —
      // without this the open drawer showed the old name/binding/usage for up
      // to 30s after the mutation it just performed.
      void queryClient.invalidateQueries({ queryKey: ['studio', 'keys'] });
    },
    onError: (error) => toastEngineError(error, 'Could not unbind the key'),
  });
}

export type KeyExpiryChoice = '30d' | '90d' | '1y' | 'never';

/** The wizard's expiry choice → the engine's absolute `expires_at`. */
export function expiresAtFromChoice(choice: KeyExpiryChoice, from = new Date()): string | undefined {
  const days = choice === '30d' ? 30 : choice === '90d' ? 90 : choice === '1y' ? 365 : null;
  if (days === null) {
    return undefined;
  }
  const at = new Date(from);
  at.setDate(at.getDate() + days);
  return at.toISOString();
}
