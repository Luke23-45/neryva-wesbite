/**
 * Data lifecycle (ledger G-5) — the engine's lifecycle module: GDPR/DSR
 * exports, retention, and tombstones. Org-scoped; keys under
 * ['studio', 'lifecycle', orgId].
 *
 * Export download is a one-time presigned link — the UI surfaces it but
 * never caches or re-serves the URL.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine, engineDownload } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

export interface LifecycleExport {
  id: string;
  status: string | null;
  requestedAt: string | null;
  completedAt: string | null;
  resourceType: string | null;
}

export interface LegalHold {
  id: string;
  status: string | null;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: string | null;
  reason: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function parseExports(raw: unknown): LifecycleExport[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : [record.exports, record.items].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) return null;
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.export_id);
      if (!id) return null;
      return {
        id,
        status: str(item.status) ?? str(item.state),
        requestedAt: str(item.requested_at) ?? str(item.created_at),
        completedAt: str(item.completed_at),
        resourceType: str(item.resource_type) ?? str(item.type),
      } satisfies LifecycleExport;
    })
    .filter((e): e is LifecycleExport => e !== null);
}

export function parseLegalHolds(raw: unknown): LegalHold[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.holds) ? record.holds : Array.isArray(record.legal_holds) ? record.legal_holds : [];
  if (!Array.isArray(list)) return [];
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) return null;
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.hold_id);
      if (!id) return null;
      return {
        id,
        status: str(item.status) ?? str(item.state),
        resourceType: str(item.resource_type),
        resourceId: str(item.resource_id),
        createdAt: str(item.created_at),
        reason: str(item.reason) ?? str(item.note),
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
    mutationFn: async () =>
      engine(`/console/org/${orgId}/lifecycle/exports`, { method: 'POST', body: {}, idempotent: true }),
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
    onError: (error) => toastEngineError(error, 'Could not download the export — one-time links expire'),
  });
}
