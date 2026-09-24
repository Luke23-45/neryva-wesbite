/**
 * Knowledge reads/writes (team_setup_ledger.md F-A2/A3/A4/A7/A9) over the
 * EXACT contract (`engine/src/modules/knowledge/knowledge.controller.ts`,
 * `harness-parity.controller.ts`):
 *
 * - GET documents?limit= → {documents: [{id, source_slug, title, state,
 *   updated_at, latest_version}]} (newest-first, default 50 / max 200);
 * - POST documents/:id/source-slug {source_slug} → {ok:true} (409 collision);
 * - GET documents/:id/preview?chunks= → {document, total_chunks, truncated,
 *   chunks: [{sequence, text, source_range}]} (latest version, windowed);
 * - DELETE documents/:id → {retired: true} (tombstone; state='retired',
 *   unreachable by retrieval, mapping kept);
 * - GET documents/search?query&limit= → {hits: [{chunkId, documentId,
 *   documentVersionId, sequence, text, sourceRange, score, title?}]}
 *   (query ≤512, limit 1..20 default 5 — unconstrained console search);
 * - GET memories?scope_type&scope_id → {memories};
 * - POST memories {content, scope_type?, scope_id?} (scope defaults to
 *   organization server-side);
 * - POST memory-proposals/:id/decision {decision, scope_type?, scope_id?}
 *   (owner/admin);
 * - POST memories/:id/delete (owner/admin/developer — the R-6 path).
 * - POST memories/purge {substring 3..128} → {purged} (owner/admin, DSR,
 *   tombstones, hash-only audit).
 * - Org memory policy (scrub + default TTL) reads off the org profile
 *   preferences with the engine's fail-open rules (useOrgMemoryPolicy).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';
import { useOrgProfile } from '@hooks/engine/queries';
import {
  parseOrgMemoryPolicy,
  validatePurgeSubstring,
  type OrgMemoryPolicy,
} from '@/sections/pages/products/agent-studio/builder/lib/memory-model';

export const KNOWLEDGE_KEY = ['studio', 'setup', 'knowledge'] as const;

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export type DocumentState = 'processing' | 'ready' | 'failed' | 'retired' | string;

export interface KnowledgeDocument {
  id: string;
  sourceSlug: string;
  title: string | null;
  state: DocumentState;
  updatedAt: string | null;
  latestVersion: number | null;
}

export function parseDocuments(raw: unknown): KnowledgeDocument[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.documents) ? record.documents : [];
  return list
    .map((entry): KnowledgeDocument | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id);
      if (!id) {
        return null;
      }
      const latest = item.latest_version;
      return {
        id,
        sourceSlug: str(item.source_slug) ?? '',
        title: str(item.title),
        state: str(item.state) ?? 'processing',
        updatedAt: str(item.updated_at),
        latestVersion: typeof latest === 'number' ? latest : typeof latest === 'string' && latest.trim() !== '' ? Number(latest) : null,
      };
    })
    .filter((d): d is KnowledgeDocument => d !== null);
}

export function useDocuments(limit?: number) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...KNOWLEDGE_KEY, orgId, 'documents', limit ?? null],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/documents`, {
        query: limit !== undefined ? { limit } : {},
      }),
    enabled: !!orgId,
    staleTime: 15_000,
    select: parseDocuments,
  });
}

export function useRenameDocumentSlug() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { documentId: string; sourceSlug: string }) =>
      engine(`/console/org/${orgId}/documents/${input.documentId}/source-slug`, {
        method: 'POST',
        body: { source_slug: input.sourceSlug },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...KNOWLEDGE_KEY, orgId, 'documents'] }),
    onError: (error) => toastEngineError(error, 'Could not rename the pin address'),
  });
}

/**
 * A4-05 — document removal is a tombstone (engine sets state='retired';
 * retired docs are unreachable by retrieval, the mapping is kept). No
 * silent disappearance: the row flips to the retired pill, never vanishes.
 */
export function useDeleteDocument() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) =>
      engine(`/console/org/${orgId}/documents/${documentId}`, {
        method: 'DELETE',
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...KNOWLEDGE_KEY, orgId, 'documents'] }),
    onError: (error) => toastEngineError(error, 'Could not retire the document'),
  });
}

export interface DocumentPreviewChunk {
  sequence: number;
  text: string;
  byteStart: number | null;
  byteEnd: number | null;
}

export interface DocumentPreview {
  id: string;
  sourceSlug: string;
  title: string | null;
  state: DocumentState;
  latestVersion: number | null;
  totalChunks: number;
  truncated: boolean;
  chunks: DocumentPreviewChunk[];
}

export function parseDocumentPreview(raw: unknown): DocumentPreview | null {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const doc = typeof record.document === 'object' && record.document !== null ? (record.document as Record<string, unknown>) : null;
  if (!doc || typeof doc.id !== 'string') {
    return null;
  }
  const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
  const rangeOf = (value: unknown): { byteStart: number | null; byteEnd: number | null } => {
    let range: Record<string, unknown> | null = null;
    if (typeof value === 'object' && value !== null) {
      range = value as Record<string, unknown>;
    } else if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        range = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
      } catch {
        range = null;
      }
    }
    return {
      byteStart: num(range?.byteStart) ?? num(range?.byte_start),
      byteEnd: num(range?.byteEnd) ?? num(range?.byte_end),
    };
  };
  const chunks = Array.isArray(record.chunks) ? record.chunks : [];
  return {
    id: doc.id,
    sourceSlug: str(doc.source_slug) ?? '',
    title: str(doc.title),
    state: str(doc.state) ?? 'processing',
    latestVersion:
      typeof doc.latest_version === 'number'
        ? doc.latest_version
        : typeof doc.latest_version === 'string' && doc.latest_version.trim() !== ''
          ? Number(doc.latest_version)
          : null,
    totalChunks: num(record.total_chunks) ?? chunks.length,
    truncated: record.truncated === true,
    chunks: chunks
      .map((entry): DocumentPreviewChunk | null => {
        if (typeof entry !== 'object' || entry === null) {
          return null;
        }
        const item = entry as Record<string, unknown>;
        if (typeof item.text !== 'string') {
          return null;
        }
        const range = rangeOf(item.source_range);
        return {
          sequence: num(item.sequence) ?? 0,
          text: item.text,
          byteStart: range.byteStart,
          byteEnd: range.byteEnd,
        };
      })
      .filter((c): c is DocumentPreviewChunk => c !== null),
  };
}

/**
 * A4-01 — document preview: latest-version chunks in sequence order
 * (capped server-side; `truncated` says when the tail is cut). The preview
 * is the stored text agents retrieve — what the user pinned, verifiable.
 */
export function useDocumentPreview(documentId: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...KNOWLEDGE_KEY, orgId, 'documents', documentId, 'preview'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/documents/${documentId}/preview`),
    enabled: (options?.enabled ?? true) && !!orgId && !!documentId,
    staleTime: 30_000,
    select: parseDocumentPreview,
  });
}

export interface KnowledgeHit {
  chunkId: string;
  documentId: string;
  documentVersionId: string;
  sequence: number;
  text: string;
  byteStart: number | null;
  byteEnd: number | null;
  score: number;
  title: string | null;
}

export function parseSearchHits(raw: unknown): KnowledgeHit[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.hits) ? record.hits : [];
  return list
    .map((entry): KnowledgeHit | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const chunkId = str(item.chunkId) ?? str(item.chunk_id);
      const documentId = str(item.documentId) ?? str(item.document_id);
      if (!chunkId || !documentId) {
        return null;
      }
      // sourceRange arrives as an object on fixed engines, a JSON string on
      // older ones (raw-SQL jsonb-as-text) — accept both, snake or camel.
      let range: Record<string, unknown> | null =
        typeof item.sourceRange === 'object' && item.sourceRange !== null ? (item.sourceRange as Record<string, unknown>) : null;
      if (!range && typeof item.sourceRange === 'string') {
        try {
          const parsed: unknown = JSON.parse(item.sourceRange);
          range = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
        } catch {
          range = null;
        }
      }
      const num = (value: unknown): number | null => (typeof value === 'number' && Number.isFinite(value) ? value : null);
      return {
        chunkId,
        documentId,
        documentVersionId: str(item.documentVersionId) ?? str(item.document_version_id) ?? '',
        sequence: typeof item.sequence === 'number' ? item.sequence : 0,
        text: typeof item.text === 'string' ? item.text : '',
        byteStart: num(range?.byteStart) ?? num(range?.byte_start),
        byteEnd: num(range?.byteEnd) ?? num(range?.byte_end),
        score: typeof item.score === 'number' ? item.score : 0,
        title: str(item.title),
      };
    })
    .filter((h): h is KnowledgeHit => h !== null);
}

/** Console search workbench (unconstrained by pins — evaluation surface, not runtime truth). */
export function useKnowledgeSearch(query: string, limit: number, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  const trimmed = query.trim();
  return useQuery({
    queryKey: [...KNOWLEDGE_KEY, orgId, 'search', trimmed, limit],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/documents/search`, { query: { query: trimmed, limit } }),
    enabled: (options?.enabled ?? true) && !!orgId && trimmed.length > 0,
    staleTime: 30_000,
    select: parseSearchHits,
  });
}

export interface MemoryItem {
  id: string;
  content: string | null;
  scopeType: string | null;
  scopeId: string | null;
  status: string | null;
  createdAt: string | null;
  /** Visibility gate (default `organization`) + TTL — same response, no extra reads. */
  visibility: string | null;
  expiresAt: string | null;
  /** Drawer fields (C08): provenance + validity, same list response, no extra reads. */
  sourceRef: Record<string, unknown> | null;
  provenance: string | null;
  confidence: number | null;
  validFrom: string | null;
  invalidAt: string | null;
  supersedes: string | null;
  embeddingModel: string | null;
  updatedAt: string | null;
}

function num(value: unknown): number | null {
  // pg numerics arrive as strings — coerce, never drop.
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

export function parseMemories(raw: unknown): MemoryItem[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.memories) ? record.memories : [];
  return list
    .map((entry): MemoryItem | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id);
      if (!id) {
        return null;
      }
      const sourceRef =
        typeof item.sourceRef === 'object' && item.sourceRef !== null
          ? (item.sourceRef as Record<string, unknown>)
          : typeof item.source_ref === 'object' && item.source_ref !== null
            ? (item.source_ref as Record<string, unknown>)
            : null;
      return {
        id,
        content: str(item.content),
        scopeType: str(item.scopeType) ?? str(item.scope_type),
        scopeId: str(item.scopeId) ?? str(item.scope_id),
        status: str(item.status) ?? str(item.state),
        createdAt: str(item.createdAt) ?? str(item.created_at),
        visibility: str(item.visibility),
        expiresAt: str(item.expiresAt) ?? str(item.expires_at),
        sourceRef,
        provenance: str(item.provenance),
        confidence: num(item.confidence),
        validFrom: str(item.validFrom) ?? str(item.valid_from),
        invalidAt: str(item.invalidAt) ?? str(item.invalid_at),
        supersedes: str(item.supersedes),
        embeddingModel: str(item.embeddingModel) ?? str(item.embedding_model),
        updatedAt: str(item.updatedAt) ?? str(item.updated_at),
      };
    })
    .filter((m): m is MemoryItem => m !== null);
}

/** A4-27: the library is not paginated — the engine clamps list to 1..100
 * (default 50). The UI requests the max and discloses the cap instead of
 * silently truncating; search only filters the loaded page. */
export function useMemories(scopeType?: string, scopeId?: string, limit = 100) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...KNOWLEDGE_KEY, orgId, 'memories', scopeType ?? null, scopeId ?? null, limit],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/memories`, {
        query: { scope_type: scopeType, scope_id: scopeId, limit },
      }),
    enabled: !!orgId,
    staleTime: 15_000,
    select: parseMemories,
  });
}

export function useCreateMemory() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { content: string; scopeType?: 'user' | 'conversation' | 'organization'; scopeId?: string }) =>
      engine(`/console/org/${orgId}/memories`, {
        method: 'POST',
        body: {
          content: input.content,
          ...(input.scopeType ? { scope_type: input.scopeType } : {}),
          ...(input.scopeId ? { scope_id: input.scopeId } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...KNOWLEDGE_KEY, orgId, 'memories'] }),
    onError: (error) => toastEngineError(error, 'Could not save the memory'),
  });
}

/** A4-20 — in-place content edit (PATCH …/memories/:id). Scope/TTL/provenance
 * are not editable; the server re-runs scrub-then-embed and re-stamps the
 * embedding model. Live after an engine restart. */
export function useUpdateMemory() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { memoryId: string; content: string }) =>
      engine(`/console/org/${orgId}/memories/${input.memoryId}`, {
        method: 'PATCH',
        body: { content: input.content },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...KNOWLEDGE_KEY, orgId, 'memories'] }),
    onError: (error) => toastEngineError(error, 'Could not update the memory'),
  });
}

export function useDecideMemoryProposal() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { proposalId: string; decision: 'APPROVED' | 'REJECTED'; scopeType?: string; scopeId?: string }) =>
      engine(`/console/org/${orgId}/memory-proposals/${input.proposalId}/decision`, {
        method: 'POST',
        body: {
          decision: input.decision,
          ...(input.scopeType ? { scope_type: input.scopeType } : {}),
          ...(input.scopeId ? { scope_id: input.scopeId } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...KNOWLEDGE_KEY, orgId, 'memories'] }),
    onError: (error) => toastEngineError(error, 'Could not record the decision'),
  });
}

/** Memory delete via POST …/delete (R-6: the widest-reach path — owner/admin/developer). */
export function useDeleteMemory() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memoryId: string) => engine(`/console/org/${orgId}/memories/${memoryId}/delete`, { method: 'POST', idempotent: true }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...KNOWLEDGE_KEY, orgId, 'memories'] }),
    onError: (error) => toastEngineError(error, 'Could not delete the memory'),
  });
}

/**
 * DSR purge (C08): POST memories/purge {substring 3..128} → {purged: count, truncated: cap-hit}.
 * Owner/admin only; tombstones (retrieval stops, history stays answerable);
 * the audit keeps a hash of the query, never the query (`memory.service.ts`
 * purgeByContent). Client pre-validates bounds; the server remains authority.
 * A4-25: the engine caps a run at 1000 — the truncated flag keeps the UI honest.
 */
export function usePurgeMemories() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (substring: string) => {
      const problem = validatePurgeSubstring(substring);
      if (problem) throw new Error(problem);
      return engine<{ purged: number; truncated: boolean }>(`/console/org/${orgId}/memories/purge`, {
        method: 'POST',
        body: { substring: substring.trim() },
        idempotent: true,
      });
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...KNOWLEDGE_KEY, orgId, 'memories'] }),
    onError: (error) => toastEngineError(error, 'Could not purge memories'),
  });
}

export type { OrgMemoryPolicy };

/**
 * Org memory policy (C08): scrub + default TTL read from the org profile
 * preferences with the engine's fail-open rules (single derivation in
 * memory-model — never re-derived per view). Reuses the profile cache: no new
 * query key, no extra fetch. Read-only here — authoring is PATCH settings
 * (owner/admin), which has no console editor yet (PLAN §8.5).
 */
export function useOrgMemoryPolicy() {
  const profile = useOrgProfile();
  const policy = profile.data ? parseOrgMemoryPolicy(profile.data.settings.preferences) : null;
  return { ...profile, policy };
}
