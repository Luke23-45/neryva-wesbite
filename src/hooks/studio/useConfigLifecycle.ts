/**
 * Config lifecycle (ledger G-7) — the engine's config-publish plane:
 * draft → validate → publish → rollback. Org-scoped; keys under
 * ['studio', 'config', orgId, scope].
 *
 * The engine's contract (config-publish.controller.ts):
 * - Every call carries `scope` ∈ CONFIG_SCOPES; reads 400 without it.
 * - Draft:    PUT /config/draft {scope, payload, notes?} → {draft}
 * - Validate: POST /config/draft/validate {scope, payload} → {ok, issues[]}
 * - Publish:  POST /config/publish {scope, from_draft|payload, notes?} → {config} (step-up MFA)
 * - Rollback: POST /config/rollback {scope, to_version, notes?} → {config} (step-up MFA)
 * - History:  GET /config/history?scope= → {versions[], total}
 * - Delivery: GET /config/delivery?scope= → {config, targets[]} (404 when nothing published)
 *
 * There is no canary concept in the config-publish plane — the engine ships
 * every publish to all satellites at once. The console does not invent one.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { runWithStepUp } from '@lib/engine/stepup';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

/** The engine's real config scopes (config-publish.schema.ts CONFIG_SCOPES). */
export const CONFIG_SCOPES = [
  'policy_set',
  'guardrail_profile',
  'quota_profile',
  'model_catalog',
  'knowledge_config',
] as const;
export type ConfigScope = (typeof CONFIG_SCOPES)[number];

export interface ConfigVersion {
  version: number;
  publishedAt: string | null;
  publishedBy: string | null;
  status: string | null;
}

export interface ConfigDraft {
  payload: Record<string, unknown> | null;
  validationStatus: string | null;
  validationIssues: string[] | null;
}

export interface ConfigDeliveryTarget {
  satellite: string;
  status: string | null;
  ackedAt: string | null;
  version: number | null;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function parseConfigVersions(raw: unknown): ConfigVersion[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.versions) ? record.versions : [];
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) return null;
      const item = entry as Record<string, unknown>;
      const version = typeof item.version === 'number' ? item.version : null;
      if (version === null) return null;
      return {
        version,
        publishedAt: str(item.publishedAt),
        publishedBy: str(item.publishedBy),
        status: str(item.status),
      } satisfies ConfigVersion;
    })
    .filter((v): v is ConfigVersion => v !== null);
}

export function parseDraft(raw: unknown): ConfigDraft {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const draft = typeof record.draft === 'object' && record.draft !== null ? (record.draft as Record<string, unknown>) : null;
  const issues = draft && Array.isArray(draft.validationIssues)
    ? draft.validationIssues
        .map((e) => (typeof e === 'string' ? e : typeof e === 'object' && e !== null ? `${str((e as Record<string, unknown>).path) ?? 'payload'}: ${str((e as Record<string, unknown>).message) ?? 'invalid'}` : null))
        .filter((e): e is string => e !== null)
    : null;
  return {
    payload: draft && typeof draft.payload === 'object' && draft.payload !== null ? (draft.payload as Record<string, unknown>) : null,
    validationStatus: draft ? str(draft.validationStatus) : null,
    validationIssues: issues,
  };
}

export function parseDelivery(raw: unknown): ConfigDeliveryTarget[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(record.targets) ? record.targets : [];
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) return null;
      const item = entry as Record<string, unknown>;
      const satellite = str(item.satelliteKey) ?? str(item.satellite);
      if (!satellite) return null;
      return {
        satellite,
        status: str(item.satelliteStatus) ?? str(item.status),
        ackedAt: str(item.ackedAt),
        version: typeof item.version === 'number' ? item.version : null,
      } satisfies ConfigDeliveryTarget;
    })
    .filter((d): d is ConfigDeliveryTarget => d !== null);
}

const CONFIG_KEY = (orgId: string | null, scope: string | null) => ['studio', 'config', orgId, scope] as const;

export function useConfigDraft(scope: ConfigScope | null) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CONFIG_KEY(orgId, scope), 'draft'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/config/draft`, { query: { scope: scope ?? '' } }),
    enabled: !!orgId && !!scope,
    staleTime: 30_000,
    select: parseDraft,
  });
}

export function useConfigHistory(scope: ConfigScope | null) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CONFIG_KEY(orgId, scope), 'history'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/config/history`, { query: { scope: scope ?? '' } }),
    enabled: !!orgId && !!scope,
    staleTime: 30_000,
    select: parseConfigVersions,
  });
}

export function useConfigDelivery(scope: ConfigScope | null) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...CONFIG_KEY(orgId, scope), 'delivery'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/config/delivery`, { query: { scope: scope ?? '' } }),
    enabled: !!orgId && !!scope,
    staleTime: 30_000,
    select: parseDelivery,
    // 404 = nothing published yet for this scope — an honest empty state, not an error.
    retry: (count, error) => (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404 ? false : count < 2),
  });
}

export function useValidateConfigDraft() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (input: { scope: ConfigScope; payload: Record<string, unknown> }) =>
      engine<{ ok?: boolean; issues?: ValidationIssue[] }>(`/console/org/${orgId}/config/draft/validate`, {
        method: 'POST',
        body: { scope: input.scope, payload: input.payload },
      }),
    onError: (error) => toastEngineError(error, 'Validation request failed'),
  });
}

export function useSaveConfigDraft() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { scope: ConfigScope; payload: Record<string, unknown>; notes?: string }) =>
      engine(`/console/org/${orgId}/config/draft`, {
        method: 'PUT',
        body: { scope: input.scope, payload: input.payload, ...(input.notes ? { notes: input.notes } : {}) },
      }),
    onSuccess: (_data, input) => void queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY(orgId, input.scope), 'draft'] }),
    onError: (error) => toastEngineError(error, 'Could not save the draft'),
  });
}

export function useDeleteConfigDraft() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { scope: ConfigScope }) =>
      engine(`/console/org/${orgId}/config/draft`, { method: 'DELETE', query: { scope: input.scope } }),
    onSuccess: (_data, input) => void queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY(orgId, input.scope), 'draft'] }),
    onError: (error) => toastEngineError(error, 'Could not discard the draft'),
  });
}

export function usePublishConfig() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    // Publish is a live-effect act: the engine requires a step-up MFA proof.
    mutationFn: async (input: { scope: ConfigScope; notes?: string }) =>
      runWithStepUp('Publish config', (proof) =>
        engine(`/console/org/${orgId}/config/publish`, {
          method: 'POST',
          body: { scope: input.scope, from_draft: true, ...(input.notes ? { notes: input.notes } : {}) },
          mfaProof: proof,
          idempotent: true,
        }),
      ),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY(orgId, input.scope)] });
    },
    onError: (error) => toastEngineError(error, 'Could not publish the config'),
  });
}

export function useRollbackConfig() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    // Rollback is a live-effect act: the engine requires a step-up MFA proof.
    mutationFn: async (input: { scope: ConfigScope; toVersion: number; notes?: string }) =>
      runWithStepUp('Roll back config', (proof) =>
        engine(`/console/org/${orgId}/config/rollback`, {
          method: 'POST',
          body: { scope: input.scope, to_version: input.toVersion, ...(input.notes ? { notes: input.notes } : {}) },
          mfaProof: proof,
        }),
      ),
    onSuccess: (_data, input) => void queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY(orgId, input.scope)] }),
    onError: (error) => toastEngineError(error, 'Could not roll back the config'),
  });
}
