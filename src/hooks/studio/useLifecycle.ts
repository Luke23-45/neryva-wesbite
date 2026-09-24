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
  createdAt: string | null;
  expiresAt: string | null;
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
 * status, createdAt, expiresAt, ... }] } — camelCase rows.
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
        createdAt: str(item.createdAt),
        expiresAt: str(item.expiresAt),
        reason: str(item.holdReason),
      } satisfies LegalHold;
    })
    .filter((h): h is LegalHold => h !== null);
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
    mutationFn: async (input: { conversationIds: string[] }) =>
      engine(`/console/org/${orgId}/lifecycle/exports`, {
        method: 'POST',
        body: { conversation_ids: input.conversationIds },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...LIFECYCLE_KEY(orgId), 'exports'] }),
    onError: (error) => toastEngineError(error, 'Could not request the export'),
  });
}

export function useDownloadExport() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (exportId: string) => {
      await engineDownload(`/console/org/${orgId}/lifecycle/exports/${exportId}/download`);
    },
    onError: (error) => toastEngineError(error, 'Could not download the export — downloads are one-time'),
  });
}
