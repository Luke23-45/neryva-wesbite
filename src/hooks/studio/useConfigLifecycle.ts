/**
 * Config lifecycle (ledger G-7) — the engine's config-publish plane:
 * draft → validate → publish → rollback. Org-scoped; keys under
 * ['studio', 'config', orgId, scope].
 *
 * The engine's contract (config-publish.controller.ts):
 * - Every call carries `scope` ∈ CONFIG_SCOPES; reads 400 without it.
 * - Draft:    PUT /config/draft {scope, product?, payload, notes?} → {draft}
 * - Validate: POST /config/draft/validate {scope, payload} → {ok, issues[]}
 * - Publish:  POST /config/publish {scope, product?, from_draft|payload, notes?} → {config} (step-up MFA)
 * - Rollback: POST /config/rollback {scope, product?, to_version, notes?} → {config} (step-up MFA)
 * - History:  GET /config/history?scope=&product= → {versions[], total}
 * - Delivery: GET /config/delivery?scope=&product= → {config, targets[]} (404 when nothing published)
 * - Re-notify: POST /config/delivery/re-notify {scope, product?} → re-fanout (owner/admin)
 *
 * `product` (C-16) keys the (org, scope, product) triple the engine
 * publishes under. Empty means the org-level config. Reads and writes
 * carry it identically — a product-scoped draft never leaks into the
 * org-level view.
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

/**
 * Scopes the console offers for draft → validate → publish (C-P0-13).
 *
 * The engine's full vocabulary has five scopes, but `policy_set`,
 * `guardrail_profile`, and `quota_profile` have no engine or runtime
 * consumer — `configPublish.latest()` is only ever called with
 * `model_catalog` / `knowledge_config`. Publishing one of those three
 * validates, versions, fans out, and gets ACKed while being applied by
 * nothing, so presenting the publish UX for them would be a
 * green-looking no-op. The console therefore only offers the scopes
 * something actually reads. The engine endpoints still accept all five
 * scopes for API clients.
 */
export const PUBLISHABLE_SCOPES = ['model_catalog', 'knowledge_config'] as const;
export type PublishableConfigScope = (typeof PUBLISHABLE_SCOPES)[number];

export interface ConfigVersion {
  version: number;
  publishedAt: string | null;
  publishedBy: string | null;
  status: string | null;
  /** C-13: the audit rationale recorded at publish/rollback time (≤512). */
  notes: string | null;
}

export interface ConfigDraft {
  payload: Record<string, unknown> | null;
  validationStatus: string | null;
  validationIssues: string[] | null;
  /** C-13: the audit rationale stored with the draft (≤512). */
  notes: string | null;
}

export interface ConfigDeliveryTarget {
  satellite: string;
  /**
   * Satellite registry lease state (live|stale|offline|never|unknown) —
   * the satellites sweeper's machine, NOT delivery ACK state. An ACKed
   * satellite can still read `stale` here. Never compare this to 'acked'.
   */
  satelliteStatus: string | null;
  /** Delivery ACK timestamp — non-null means this satellite ACKed the config version. */
  ackedAt: string | null;
  /** Delivery state derived from `ackedAt` (the engine's ACK signal), never from `satelliteStatus`. */
  deliveryStatus: 'acked' | 'pending';
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
        notes: str(item.notes),
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
    notes: draft ? str(draft.notes) : null,
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
      // C-P0-12: delivery state comes from `ackedAt` (the engine's ACK
      // signal). `satelliteStatus` is the registry lease state and is never
      // the string 'acked' — comparing it produced a permanently-amber pill.
      const ackedAt = str(item.ackedAt);
      return {
        satellite,
        satelliteStatus: str(item.satelliteStatus) ?? str(item.status),
        ackedAt,
        deliveryStatus: ackedAt !== null ? 'acked' : 'pending',
        version: typeof item.version === 'number' ? item.version : null,
      } satisfies ConfigDeliveryTarget;
    })
    .filter((d): d is ConfigDeliveryTarget => d !== null);
}

/**
 * C-16: the engine keys publishes on (org, scope, product); product tags are
 * validated against `^[a-z0-9_]{1,64}$` (config-publish.controller.ts).
 * Empty means the org-level config. Every read and write carries the same
 * product so a product-scoped draft never leaks into the org-level view.
 */
export const PRODUCT_RE = /^[a-z0-9_]{1,64}$/;

export function normalizeProduct(product: string | null | undefined): string | null {
  const p = (product ?? '').trim();
  return p === '' ? null : p;
}

/** Human-readable blocker for the product input; null when valid/empty. */
export function productError(product: string | null | undefined): string | null {
  const p = normalizeProduct(product);
  if (p === null) return null;
  return PRODUCT_RE.test(p) ? null : 'Product allows lowercase letters, digits, underscores (max 64)';
}

function productParam(product: string | null | undefined): Record<string, string> {
  const p = normalizeProduct(product);
  return p === null ? {} : { product: p };
}

const CONFIG_KEY = (orgId: string | null, scope: string | null, product: string | null) =>
  ['studio', 'config', orgId, scope, product] as const;

export function useConfigDraft(scope: ConfigScope | null, product?: string | null) {
  const { orgId } = useOrg();
  const p = normalizeProduct(product);
  return useQuery({
    queryKey: [...CONFIG_KEY(orgId, scope, p), 'draft'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/config/draft`, { query: { scope: scope ?? '', ...productParam(p) } }),
    enabled: !!orgId && !!scope,
    staleTime: 30_000,
    select: parseDraft,
  });
}

export function useConfigHistory(scope: ConfigScope | null, product?: string | null) {
  const { orgId } = useOrg();
  const p = normalizeProduct(product);
  return useQuery({
    queryKey: [...CONFIG_KEY(orgId, scope, p), 'history'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/config/history`, { query: { scope: scope ?? '', ...productParam(p) } }),
    enabled: !!orgId && !!scope,
    staleTime: 30_000,
    select: parseConfigVersions,
  });
}

/** P5-C16: fetch delivery targets; a 404 (nothing published yet for this
 * scope) maps to the empty shape so the UI shows "No deliveries" instead of
 * an error. Extracted for unit testing. */
export async function fetchConfigDelivery(orgId: string, scope: string, product?: string | null): Promise<unknown> {
  try {
    return await engine<unknown>(`/console/org/${orgId}/config/delivery`, { query: { scope, ...productParam(product) } });
  } catch (error) {
    if (error instanceof Error && 'status' in error && (error as { status?: number }).status === 404) {
      return { targets: [] };
    }
    throw error;
  }
}

export function useConfigDelivery(scope: ConfigScope | null, product?: string | null) {
  const { orgId } = useOrg();
  const p = normalizeProduct(product);
  return useQuery({
    queryKey: [...CONFIG_KEY(orgId, scope, p), 'delivery'],
    queryFn: () => fetchConfigDelivery(orgId ?? '', scope ?? '', p),
    enabled: !!orgId && !!scope,
    staleTime: 30_000,
    select: parseDelivery,
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
    mutationFn: async (input: { scope: ConfigScope; product?: string | null; payload: Record<string, unknown>; notes?: string }) =>
      engine(`/console/org/${orgId}/config/draft`, {
        method: 'PUT',
        body: { scope: input.scope, ...productParam(input.product), payload: input.payload, ...(input.notes ? { notes: input.notes } : {}) },
      }),
    onSuccess: (_data, input) => void queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY(orgId, input.scope, normalizeProduct(input.product)), 'draft'] }),
    onError: (error) => toastEngineError(error, 'Could not save the draft'),
  });
}

export function useDeleteConfigDraft() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { scope: ConfigScope; product?: string | null }) =>
      engine(`/console/org/${orgId}/config/draft`, { method: 'DELETE', query: { scope: input.scope, ...productParam(input.product) } }),
    onSuccess: (_data, input) => void queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY(orgId, input.scope, normalizeProduct(input.product)), 'draft'] }),
    onError: (error) => toastEngineError(error, 'Could not discard the draft'),
  });
}

export function usePublishConfig() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    // Publish is a live-effect act: the engine requires a step-up MFA proof.
    mutationFn: async (input: { scope: ConfigScope; product?: string | null; notes?: string }) =>
      runWithStepUp('Publish config', (proof) =>
        engine(`/console/org/${orgId}/config/publish`, {
          method: 'POST',
          body: { scope: input.scope, ...productParam(input.product), from_draft: true, ...(input.notes ? { notes: input.notes } : {}) },
          mfaProof: proof,
          idempotent: true,
        }),
      ),
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY(orgId, input.scope, normalizeProduct(input.product))] });
    },
    onError: (error) => toastEngineError(error, 'Could not publish the config'),
  });
}

export function useRollbackConfig() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    // Rollback is a live-effect act: the engine requires a step-up MFA proof.
    mutationFn: async (input: { scope: ConfigScope; product?: string | null; toVersion: number; notes?: string }) =>
      runWithStepUp('Roll back config', (proof) =>
        engine(`/console/org/${orgId}/config/rollback`, {
          method: 'POST',
          body: { scope: input.scope, ...productParam(input.product), to_version: input.toVersion, ...(input.notes ? { notes: input.notes } : {}) },
          mfaProof: proof,
        }),
      ),
    onSuccess: (_data, input) => void queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY(orgId, input.scope, normalizeProduct(input.product))] }),
    onError: (error) => toastEngineError(error, 'Could not roll back the config'),
  });
}

/**
 * C-18: re-run fanout for the latest version of (scope, product) — catches
 * satellites activated after publish and nudges stalled pullers.
 * Owner/admin only; the engine 403s everyone else.
 *
 * `buildRenotifyRequest` is the pure, unit-testable core: path + body.
 */
export function buildRenotifyRequest(orgId: string, scope: ConfigScope, product?: string | null) {
  return {
    path: `/console/org/${orgId}/config/delivery/re-notify`,
    body: { scope, ...productParam(product) },
  };
}

export function useRenotifyConfig() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { scope: ConfigScope; product?: string | null }) => {
      const { path, body } = buildRenotifyRequest(orgId ?? '', input.scope, input.product);
      return engine(path, { method: 'POST', body });
    },
    onSuccess: (_data, input) =>
      void queryClient.invalidateQueries({ queryKey: [...CONFIG_KEY(orgId, input.scope, normalizeProduct(input.product)), 'delivery'] }),
    onError: (error) => toastEngineError(error, 'Could not re-notify satellites'),
  });
}
