/**
 * Config lifecycle (ledger G-7) — the engine's config-publish plane:
 * draft → validate → publish (with canary %) → rollback. Org-scoped;
 * keys under ['studio', 'config', orgId].
 *
 * The config document's schema is per-deployment (the satellite defines
 * what fields it expects) — the editor presents it as JSON so the plane
 * works for any payload the engine validates, without the console
 * hard-coding a schema it doesn't own.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

export interface ConfigVersion {
  version: number;
  publishedAt: string | null;
  publishedBy: string | null;
  canaryPercent: number | null;
  status: string | null;
}

export interface ConfigDraft {
  content: Record<string, unknown> | null;
  validated: boolean | null;
  validationErrors: string[] | null;
}

export interface ConfigDelivery {
  satellite: string;
  status: string | null;
  ackedAt: string | null;
  version: number | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function parseConfigVersions(raw: unknown): ConfigVersion[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : [record.versions, record.history].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) return null;
      const item = entry as Record<string, unknown>;
      const version = typeof item.version === 'number' ? item.version : null;
      if (version === null) return null;
      return {
        version,
        publishedAt: str(item.published_at) ?? str(item.created_at),
        publishedBy: str(item.published_by) ?? str(item.author),
        canaryPercent: typeof item.canary_percent === 'number' ? item.canary_percent : null,
        status: str(item.status) ?? str(item.state),
      } satisfies ConfigVersion;
    })
    .filter((v): v is ConfigVersion => v !== null);
}

export function parseDraft(raw: unknown): ConfigDraft {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const content = typeof record.content === 'object' && record.content !== null
    ? (record.content as Record<string, unknown>)
    : typeof record.draft === 'object' && record.draft !== null
      ? (record.draft as Record<string, unknown>)
      : null;
  const errors = Array.isArray(record.validation_errors)
    ? record.validation_errors.filter((e): e is string => typeof e === 'string')
    : null;
  return {
    content,
    validated: typeof record.validated === 'boolean' ? record.validated : null,
    validationErrors: errors,
  };
}

export function parseDelivery(raw: unknown): ConfigDelivery[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : [record.deliveries, record.satellites].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) return null;
      const item = entry as Record<string, unknown>;
      const satellite = str(item.satellite) ?? str(item.key) ?? str(item.name);
      if (!satellite) return null;
      return {
        satellite,
        status: str(item.status) ?? str(item.state),
        ackedAt: str(item.acked_at) ?? str(item.acknowledged_at),
        version: typeof item.version === 'number' ? item.version : null,
      } satisfies ConfigDelivery;
    })
    .filter((d): d is ConfigDelivery => d !== null);
}

const CONFIG_KEY = (orgId: string | null) => ['studio', 'config', orgId] as const;

export function useConfigDraft() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CONFIG_KEY(orgId), 'draft'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/config/draft`),
    enabled: !!orgId,
    staleTime: 30_000,
    select: parseDraft,
  });
}

export function useConfigHistory() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CONFIG_KEY(orgId), 'history'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/config/history`),
    enabled: !!orgId,
    staleTime: 30_000,
    select: parseConfigVersions,
  });
}

export function useConfigDelivery() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CONFIG_KEY(orgId), 'delivery'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/config/delivery`),
    enabled: !!orgId,
    staleTime: 30_000,
    select: parseDelivery,
  });
}

export function useValidateConfigDraft() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (content: Record<string, unknown>) =>
      engine<{ valid?: boolean; errors?: string[] }>(`/console/org/${orgId}/config/draft/validate`, {
        method: 'POST',
        body: content,
      }),
    onError: (error) => toastEngineError(error, 'Validation request failed'),
  });
}

export function useSaveConfigDraft() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: Record<string, unknown>) =>
      engine(`/console/org/${orgId}/config/draft`, { method: 'PUT', body: content }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY(orgId), 'draft'] }),
    onError: (error) => toastEngineError(error, 'Could not save the draft'),
  });
}

export function useDeleteConfigDraft() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => engine(`/console/org/${orgId}/config/draft`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY(orgId), 'draft'] }),
    onError: (error) => toastEngineError(error, 'Could not discard the draft'),
  });
}

export function usePublishConfig() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { canaryPercent?: number }) =>
      engine(`/console/org/${orgId}/config/publish`, {
        method: 'POST',
        body: { ...(input.canaryPercent !== undefined ? { canary_percent: input.canaryPercent } : {}) },
        idempotent: true,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY(orgId)] });
      void queryClient.invalidateQueries({ queryKey: ['studio', 'config-delivery'] });
    },
    onError: (error) => toastEngineError(error, 'Could not publish the config'),
  });
}

export function useRollbackConfig() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input?: { toVersion?: number }) =>
      engine(`/console/org/${orgId}/config/rollback`, {
        method: 'POST',
        body: input?.toVersion !== undefined ? { to_version: input.toVersion } : {},
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY(orgId)] }),
    onError: (error) => toastEngineError(error, 'Could not roll back the config'),
  });
}
