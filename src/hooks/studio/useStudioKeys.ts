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

export interface KeyDetail {
  id: string;
  name: string | null;
  prefix: string | null;
  role: string | null;
  scopes: string[];
  revoked: boolean | null;
  expiresAt: string | null;
  createdAt: string | null;
  lastUsedAt: string | null;
  usageCount: number | null;
  projectId: string | null;
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
  const binding = typeof nested.binding === 'object' && nested.binding !== null ? (nested.binding as Record<string, unknown>) : nested;
  return {
    id,
    name: str(nested.name),
    prefix: str(nested.prefix),
    role: str(nested.role),
    scopes: Array.isArray(nested.scopes) ? nested.scopes.filter((s): s is string => typeof s === 'string') : [],
    revoked: typeof nested.revoked === 'boolean' ? nested.revoked : null,
    expiresAt: str(nested.expires_at) ?? str(nested.expiresAt),
    createdAt: str(nested.created_at) ?? str(nested.createdAt),
    lastUsedAt: str(nested.last_used_at) ?? str(nested.lastUsedAt),
    usageCount: typeof nested.usage_count === 'number' ? nested.usage_count : typeof nested.usageCount === 'number' ? nested.usageCount : null,
    projectId: str(binding.project_id) ?? str(binding.projectId) ?? str(nested.project_id),
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
    onSuccess: () => // Shares the engine list cache so issue/revoke/rotate stay in step
      // with the /platform key surfaces.
      void queryClient.invalidateQueries({ queryKey: ['engine', 'keys'] }),
    onError: (error) => toastEngineError(error, 'Could not rotate the key'),
  });
}

export function useUpdateKey() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { keyId: string; name?: string; scopes?: string[] }) => {
      const body: Record<string, unknown> = {};
      if (input.name !== undefined) body.name = input.name;
      if (input.scopes !== undefined) body.scopes = input.scopes;
      return engine(`/console/org/${orgId}/keys/${input.keyId}`, { method: 'PATCH', body });
    },
    onSuccess: () => // Shares the engine list cache so issue/revoke/rotate stay in step
      // with the /platform key surfaces.
      void queryClient.invalidateQueries({ queryKey: ['engine', 'keys'] }),
    onError: (error) => toastEngineError(error, 'Could not update the key'),
  });
}

export function useBindKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { keyId: string; projectId: string }) =>
      engine(`/console/studio-furniture/keys/${input.keyId}/bind`, { method: 'POST', body: { project_id: input.projectId } }),
    onSuccess: () => // Shares the engine list cache so issue/revoke/rotate stay in step
      // with the /platform key surfaces.
      void queryClient.invalidateQueries({ queryKey: ['engine', 'keys'] }),
    onError: (error) => toastEngineError(error, 'Could not bind the key to the project'),
  });
}

export function useUnbindKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { keyId: string }) =>
      engine(`/console/studio-furniture/keys/${input.keyId}/unbind`, { method: 'POST' }),
    onSuccess: () => // Shares the engine list cache so issue/revoke/rotate stay in step
      // with the /platform key surfaces.
      void queryClient.invalidateQueries({ queryKey: ['engine', 'keys'] }),
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
