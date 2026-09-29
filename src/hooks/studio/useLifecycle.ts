/**
 * Data lifecycle (ledger G-5) — the engine's lifecycle module: GDPR/DSR
 * exports, retention, and tombstones. Org-scoped; keys under
 * ['studio', 'lifecycle', orgId].
 *
 * Export download is one-time per export (the engine enforces a single
 * download); the file is served as an attachment with a .json filename.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine, engineDownload } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

export interface LifecycleExport {
  id: string;
  state: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  downloadCount: number | null;
  conversationCount: number | null;
}

export interface LegalHold {
  id: string;
  status: string | null;
  scopeType: string | null;
  scopeId: string | null;
  /** Placement timestamp — the engine wire field is `placedAt` (both lanes). */
  placedAt: string | null;
  expiresAt: string | null;
  /** `releasedAt` is set when a hold is released; null while active. */
  releasedAt: string | null;
  placedBy: string | null;
  reason: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * Engine contract: { export_requests: [{ id, state, createdAt, expiresAt,
 * downloadCount, scope: { conversation_ids }, ... }] } — camelCase rows, and
 * 'ready' (not 'completed') is the downloadable state.
 */
export function parseExports(raw: unknown): LifecycleExport[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.export_requests) ? record.export_requests : [];
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) return null;
      const item = entry as Record<string, unknown>;
      const id = str(item.id);
      if (!id) return null;
      const scope = typeof item.scope === 'object' && item.scope !== null ? (item.scope as Record<string, unknown>) : null;
      const conversationIds = scope && Array.isArray(scope.conversation_ids) ? scope.conversation_ids : null;
      return {
        id,
        state: str(item.state),
        createdAt: str(item.createdAt),
        expiresAt: str(item.expiresAt),
        downloadCount: typeof item.downloadCount === 'number' ? item.downloadCount : null,
        conversationCount: conversationIds ? conversationIds.length : null,
      } satisfies LifecycleExport;
    })
    .filter((e): e is LifecycleExport => e !== null);
}

/**
 * Engine contract: { legal_holds: [{ id, scopeType, scopeId, holdReason,
 * placedBy, status, placedAt, releasedAt, expiresAt, ... }] } — camelCase
 * rows. C-06: the wire field is `placedAt`, not `createdAt` — reading
 * `createdAt` rendered the "Since" column as '—' forever. `createdAt` is
 * kept as a legacy fallback only.
 */
export function parseLegalHolds(raw: unknown): LegalHold[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.legal_holds) ? record.legal_holds : [];
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) return null;
      const item = entry as Record<string, unknown>;
      const id = str(item.id);
      if (!id) return null;
      return {
        id,
        status: str(item.status),
        scopeType: str(item.scopeType),
        scopeId: str(item.scopeId),
        placedAt: str(item.placedAt) ?? str(item.createdAt),
        expiresAt: str(item.expiresAt),
        releasedAt: str(item.releasedAt),
        placedBy: str(item.placedBy),
        reason: str(item.holdReason),
      } satisfies LegalHold;
    })
    .filter((h): h is LegalHold => h !== null);
}

/**
 * The one-time download token is issued once, in the POST /exports
 * response ({ export_request: { download_token } }) — C-05. The console
 * shows it to the requester immediately and never persists it; downloads
 * present it as `?token=`.
 */
export function parseExportToken(raw: unknown): string | null {
  return parseExportRequest(raw).downloadToken;
}

/**
 * The POST /exports response envelope:
 * { export_request: { id, state, expires_at, download_token } }.
 */
export function parseExportRequest(raw: unknown): { id: string | null; downloadToken: string | null } {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const req = record.export_request;
  if (typeof req !== 'object' || req === null) return { id: null, downloadToken: null };
  const r = req as Record<string, unknown>;
  return { id: str(r.id), downloadToken: str(r.download_token) };
}

const LIFECYCLE_KEY = (orgId: string | null) => ['studio', 'lifecycle', orgId] as const;

export function useExports(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIFECYCLE_KEY(orgId), 'exports'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/lifecycle/exports`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
    select: parseExports,
  });
}

export function useLegalHolds(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIFECYCLE_KEY(orgId), 'legal-holds'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/lifecycle/legal-holds`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
    select: parseLegalHolds,
  });
}

export function useRequestExport() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    // The engine builds the manifest from scope.conversation_ids (max 20).
    // An empty scope is accepted but produces an empty archive — the dialog
    // asks the user to pick conversations so exports are never hollow.
    // Resolves with the one-time download token (C-05): the engine issues
    // it exactly once, in this response. The dialog shows it immediately —
    // the token is required for download and never shown again.
    mutationFn: async (input: { conversationIds: string[] }): Promise<{ id: string | null; downloadToken: string | null }> => {
      const raw = await engine<unknown>(`/console/org/${orgId}/lifecycle/exports`, {
        method: 'POST',
        body: { conversation_ids: input.conversationIds },
        idempotent: true,
      });
      return parseExportRequest(raw);
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...LIFECYCLE_KEY(orgId), 'exports'] }),
    onError: (error) => toastEngineError(error, 'Could not request the export'),
  });
}

export function useDownloadExport() {
  const { orgId } = useOrg();
  return useMutation({
    // C-05: the download requires the one-time token issued at creation —
    // the engine binds SHA-256(token) at insert and rejects empty tokens.
    mutationFn: async (input: { exportId: string; token: string }) => {
      await engineDownload(`/console/org/${orgId}/lifecycle/exports/${input.exportId}/download`, { token: input.token });
    },
    onError: (error) => toastEngineError(error, 'Could not download the export — check the download token'),
  });
}

// ─── Governance: legal-hold / purge / retention management (C-08) ────────
// The engine's lifecycle plane was fully live (place/release holds, purge
// enqueue + status, retention-policy upsert, tombstone lookup) while the
// console was read-only for holds and had no purge/retention surface at
// all. These hooks wire the existing owner/admin-gated endpoints; the
// engine 403s non-privileged callers and the error surfaces honestly.

export interface PurgeTask {
  id: string;
  state: string | null;
  step: string | null;
  scopeType: string | null;
  scopeId: string | null;
  reason: string | null;
  lastError: string | null;
  createdAt: string | null;
  finishedAt: string | null;
}

/**
 * Engine contract: { purge_task: { id, state, step, scopeType, scopeId,
 * reason, lastError, createdAt, finishedAt, ... } } — camelCase row.
 */
export function parsePurgeTask(raw: unknown): PurgeTask | null {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const task = record.purge_task;
  if (typeof task !== 'object' || task === null) return null;
  const t = task as Record<string, unknown>;
  const id = str(t.id);
  if (!id) return null;
  return {
    id,
    state: str(t.state),
    step: str(t.step),
    scopeType: str(t.scopeType),
    scopeId: str(t.scopeId),
    reason: str(t.reason),
    lastError: str(t.lastError),
    createdAt: str(t.createdAt),
    finishedAt: str(t.finishedAt),
  };
}

/** Engine vocabularies (lifecycle.controller.ts HoldDto / PurgeDto). Kept
 * here so the dialogs disable honestly instead of letting the engine 400. */
export const HOLD_SCOPE_TYPES = ['organization', 'conversation'] as const;
export const PURGE_SCOPE_TYPES = ['conversation'] as const;
export const PURGE_REASONS = ['user_request', 'retention_expiry', 'org_deletion'] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface HoldInput {
  scopeType: string;
  scopeId: string;
  reason: string;
}

export interface PurgeInput {
  scopeType: string;
  scopeId: string;
  reason: string;
}

export interface RetentionPolicyInput {
  resourceType: string;
  retentionClass: string;
  keepDays: string;
}

/**
 * Validate-then-shape helpers (pure, unit-tested): mirror the engine DTO
 * rules so the dialogs can disable the confirm button with a real message
 * instead of firing a doomed request. Returns `{ body }` on success or
 * `{ error }` with the human-readable blocker.
 */
export function buildHoldBody(input: HoldInput): { body?: { scope_type: string; scope_id?: string; reason: string }; error?: string } {
  if (!(HOLD_SCOPE_TYPES as readonly string[]).includes(input.scopeType)) {
    return { error: `Scope must be one of: ${HOLD_SCOPE_TYPES.join(', ')}` };
  }
  const scopeId = input.scopeId.trim();
  if (input.scopeType === 'conversation' && !UUID_RE.test(scopeId)) {
    return { error: 'Conversation scope needs the conversation id (UUID)' };
  }
  if (input.scopeType === 'organization' && scopeId !== '' && !UUID_RE.test(scopeId)) {
    return { error: 'Scope id must be a UUID when provided' };
  }
  const reason = input.reason.trim();
  if (reason === '') return { error: 'A reason is required — it is the audit record' };
  if (reason.length > 512) return { error: 'Reason is capped at 512 characters' };
  return { body: { scope_type: input.scopeType, ...(scopeId !== '' ? { scope_id: scopeId } : {}), reason } };
}

export function buildPurgeBody(input: PurgeInput): { body?: { scope_type: string; scope_id: string; reason: string }; error?: string } {
  if (!(PURGE_SCOPE_TYPES as readonly string[]).includes(input.scopeType)) {
    return { error: `Scope must be one of: ${PURGE_SCOPE_TYPES.join(', ')}` };
  }
  const scopeId = input.scopeId.trim();
  if (!UUID_RE.test(scopeId)) {
    return { error: 'Scope id must be the conversation id (UUID)' };
  }
  if (!(PURGE_REASONS as readonly string[]).includes(input.reason)) {
    return { error: `Reason must be one of: ${PURGE_REASONS.join(', ')}` };
  }
  return { body: { scope_type: input.scopeType, scope_id: scopeId, reason: input.reason } };
}

export function buildRetentionPolicyBody(input: RetentionPolicyInput): { body?: { resource_type: string; retention_class: string; keep_days: number }; error?: string } {
  const resourceType = input.resourceType.trim();
  const retentionClass = input.retentionClass.trim();
  if (resourceType === '') return { error: 'Resource type is required (e.g. conversation, artifact)' };
  if (retentionClass === '') return { error: 'Retention class is required (e.g. standard, extended)' };
  const keepDays = Number(input.keepDays);
  if (!Number.isInteger(keepDays) || keepDays < 1) {
    return { error: 'Keep-days must be a positive integer' };
  }
  return { body: { resource_type: resourceType, retention_class: retentionClass, keep_days: keepDays } };
}

export function usePlaceLegalHold() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: HoldInput) => {
      const { body, error } = buildHoldBody(input);
      if (!body) throw new Error(error ?? 'Invalid hold input');
      return engine<unknown>(`/console/org/${orgId}/lifecycle/legal-holds`, {
        method: 'POST',
        body,
        idempotent: true,
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...LIFECYCLE_KEY(orgId), 'legal-holds'] }),
    onError: (error) => toastEngineError(error, 'Could not place the legal hold'),
  });
}

export function useReleaseLegalHold() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (holdId: string) =>
      engine<unknown>(`/console/org/${orgId}/lifecycle/legal-holds/${holdId}/release`, {
        method: 'POST',
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...LIFECYCLE_KEY(orgId), 'legal-holds'] }),
    onError: (error) => toastEngineError(error, 'Could not release the legal hold'),
  });
}

export function useUpsertRetentionPolicy() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (input: RetentionPolicyInput) => {
      const { body, error } = buildRetentionPolicyBody(input);
      if (!body) throw new Error(error ?? 'Invalid retention policy input');
      return engine<unknown>(`/console/org/${orgId}/lifecycle/retention-policies`, {
        method: 'POST',
        body,
        idempotent: true,
      });
    },
    onError: (error) => toastEngineError(error, 'Could not save the retention policy'),
  });
}

export function useEnqueuePurge() {
  const { orgId } = useOrg();
  return useMutation({
    // Resolves with the created task so the dialog can show its id/state
    // immediately — there is no task list endpoint, only GET by id.
    mutationFn: async (input: PurgeInput): Promise<{ task: PurgeTask | null }> => {
      const { body, error } = buildPurgeBody(input);
      if (!body) throw new Error(error ?? 'Invalid purge input');
      const raw = await engine<unknown>(`/console/org/${orgId}/lifecycle/purge-tasks`, {
        method: 'POST',
        body,
        idempotent: true,
      });
      return { task: parsePurgeTask(raw) };
    },
    onError: (error) => toastEngineError(error, 'Could not enqueue the purge'),
  });
}

export function usePurgeTask(taskId: string | null) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIFECYCLE_KEY(orgId), 'purge-task', taskId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/lifecycle/purge-tasks/${taskId}`),
    enabled: !!orgId && !!taskId,
    staleTime: 10_000,
    select: parsePurgeTask,
  });
}

export interface TombstoneResult {
  tombstoned: boolean;
  reason: string | null;
}

/** Engine contract: { tombstoned: boolean, reason?: string }. */
export function parseTombstone(raw: unknown): TombstoneResult {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    tombstoned: record.tombstoned === true,
    reason: str(record.reason),
  };
}

/** On-demand lookup (no list endpoint) — the dialog calls this directly. */
export function fetchTombstone(orgId: string, resourceType: string, resourceId: string): Promise<TombstoneResult> {
  return engine<unknown>(
    `/console/org/${orgId}/lifecycle/tombstones/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId)}`,
  ).then(parseTombstone);
}
