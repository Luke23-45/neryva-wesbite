/**
 * Knowledge Library data hooks (Library Phases 1–4 backend).
 *
 * React Query hooks over the EXACT engine contract
 * (`engine/src/modules/knowledge/knowledge.controller.ts`):
 *
 * Scopes (Phase 1):
 * - GET scopes → {scopes: [...]}; GET scopes/:slug → {scope, pins, exclusions, bindings};
 * - POST scopes {slug, name, description?, filters?, version_policy?, threshold_override?, rerank_profile?} → {scope};
 * - PATCH scopes/:slug {...} → {scope}; DELETE scopes/:slug → {deleted};
 * - POST scopes/:slug/simulate {query, top_k?, threshold?, agent_id?, mode?} → {trace_id, hits, trace}.
 *
 * Usage (Phase 2):
 * - GET documents/:id/consumers?days= → {document_id, window_days, consumers};
 * - GET agents/:id/documents?days= → {agent_id, window_days, documents};
 * - GET documents/unused?days= → {window_days, count, documents};
 * - GET analytics/citation-quadrants?days= → {window_days, quadrants}.
 *
 * Storage (Phase 2):
 * - GET knowledge/quota → {quota: {max_bytes, committed_bytes, reserved_bytes, ...}, breakdowns, top_documents}.
 *
 * Curation & provenance (Phase 3):
 * - POST documents/:id/curate {action} → {document_id, curation_status, reviewer_id};
 * - GET documents/:id/provenance → {document_id, origin, provenance, owner_id, ...};
 * - POST documents/:id/owner {owner_id} → {document_id, owner_id};
 * - POST knowledge/explain {query, document_id?, attribute_filter?} → {trace_id, hits, trace}.
 *
 * Intelligence (Phase 4):
 * - GET knowledge/recall-gaps?days= → {days, gaps};
 * - GET documents/:id/near-duplicates?threshold= → {document_id, threshold, hits};
 * - GET knowledge/recommendations → {recommendations};
 * - POST knowledge/eval/datasets {name, description?} → {dataset_id, name};
 * - POST knowledge/eval/datasets/:id/cases {query, expected_document_ids, scope_filter?} → {case_id};
 * - POST knowledge/eval/datasets/:id/run {k?} → {run_id, avg_recall, avg_precision, avg_ndcg, avg_mrr};
 * - GET knowledge/eval/runs/:runId → run with results;
 * - GET knowledge/eval/datasets/:id/trends?limit= → {dataset_id, runs}.
 *
 * Health findings: GET knowledge/health/findings (+ dismiss/snooze
 * mutations) — read surface over LibraryHealthService.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

export const LIBRARY_KEY = ['studio', 'knowledge', 'library'] as const;

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

// ------------------------------------------------------------------
// Scopes (Phase 1)
// ------------------------------------------------------------------

export interface KnowledgeScope {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  filters: { clauses: Array<Record<string, string[]>> } | null;
  versionPolicy: string | null;
  thresholdOverride: number | null;
  rerankProfile: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function parseScope(item: Record<string, unknown>): KnowledgeScope | null {
  const id = str(item.id);
  const slug = str(item.slug);
  if (!id || !slug) return null;
  return {
    id,
    slug,
    name: str(item.name) ?? slug,
    description: str(item.description),
    filters: (item.filters as KnowledgeScope['filters']) ?? null,
    versionPolicy: str(item.version_policy) ?? str(item.versionPolicy),
    thresholdOverride: num(item.threshold_override) ?? num(item.thresholdOverride),
    rerankProfile: str(item.rerank_profile) ?? str(item.rerankProfile),
    createdAt: str(item.created_at) ?? str(item.createdAt),
    updatedAt: str(item.updated_at) ?? str(item.updatedAt),
  };
}

export interface ScopeDetail {
  scope: KnowledgeScope | null;
  pins: Array<{ documentId: string; pinnedBy: string | null }>;
  exclusions: string[];
  bindings: Array<{ agentId: string; priority: number }>;
}

function parseScopeDetail(raw: unknown): ScopeDetail | null {
  const record = asRecord(raw);
  const scopeRaw = asRecord(record.scope);
  const scope = parseScope(scopeRaw);
  if (!scope) return null;
  const pins = Array.isArray(record.pins)
    ? record.pins
        .map((p) => asRecord(p))
        .filter((p) => typeof p.documentId === 'string' || typeof p.document_id === 'string')
        .map((p) => ({
          documentId: (str(p.documentId) ?? str(p.document_id)) as string,
          pinnedBy: str(p.pinnedBy) ?? str(p.pinned_by),
        }))
    : [];
  const exclusions = Array.isArray(record.exclusions)
    ? record.exclusions.filter((e): e is string => typeof e === 'string')
    : [];
  const bindings = Array.isArray(record.bindings)
    ? record.bindings
        .map((b) => asRecord(b))
        .filter((b) => typeof b.agentId === 'string' || typeof b.agent_id === 'string')
        .map((b) => ({
          agentId: (str(b.agentId) ?? str(b.agent_id)) as string,
          priority: num(b.priority) ?? 0,
        }))
    : [];
  return { scope, pins, exclusions, bindings };
}

export function useScopes() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'scopes'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/scopes`),
    enabled: !!orgId,
    staleTime: 15_000,
    select: (raw) => {
      const list = asRecord(raw).scopes;
      if (!Array.isArray(list)) return [] as KnowledgeScope[];
      return list
        .map((entry) => parseScope(asRecord(entry)))
        .filter((s): s is KnowledgeScope => s !== null);
    },
  });
}

export function useScope(slug: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'scopes', slug],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/scopes/${slug}`),
    enabled: !!orgId && !!slug && (options?.enabled ?? true),
    staleTime: 15_000,
    select: parseScopeDetail,
  });
}

export interface CreateScopeInput {
  slug: string;
  name: string;
  description?: string | null;
  filters?: { clauses: Array<Record<string, string[]>> };
  versionPolicy?: string;
  thresholdOverride?: number | null;
  rerankProfile?: string | null;
}

export function useCreateScope() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateScopeInput) =>
      engine<unknown>(`/console/org/${orgId}/scopes`, {
        method: 'POST',
        body: {
          slug: input.slug,
          name: input.name,
          description: input.description ?? null,
          filters: input.filters,
          version_policy: input.versionPolicy,
          threshold_override: input.thresholdOverride ?? null,
          rerank_profile: input.rerankProfile ?? null,
        },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...LIBRARY_KEY, orgId, 'scopes'] }),
    onError: (error) => toastEngineError(error, 'Could not create the scope'),
  });
}

export type UpdateScopeInput = Partial<Omit<CreateScopeInput, 'slug'>>;

export function useUpdateScope() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { slug: string } & UpdateScopeInput) =>
      engine<unknown>(`/console/org/${orgId}/scopes/${input.slug}`, {
        method: 'PATCH',
        body: {
          name: input.name,
          description: input.description,
          filters: input.filters,
          version_policy: input.versionPolicy,
          threshold_override: input.thresholdOverride,
          rerank_profile: input.rerankProfile,
        },
        idempotent: true,
      }),
    onSuccess: (_data, variables) =>
      void queryClient.invalidateQueries({ queryKey: [...LIBRARY_KEY, orgId, 'scopes', variables.slug] }),
    onError: (error) => toastEngineError(error, 'Could not update the scope'),
  });
}

export function useDeleteScope() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slug: string) =>
      engine<unknown>(`/console/org/${orgId}/scopes/${slug}`, {
        method: 'DELETE',
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...LIBRARY_KEY, orgId, 'scopes'] }),
    onError: (error) => toastEngineError(error, 'Could not delete the scope'),
  });
}

export interface SimulateScopeInput {
  slug: string;
  query: string;
  topK?: number;
  threshold?: number;
  agentId?: string;
  mode?: string;
}

export interface SimulateScopeResult {
  traceId: string | null;
  hits: Array<{
    chunkId: string;
    documentId: string;
    score: number;
    text: string;
    title: string | null;
  }>;
  trace: Record<string, unknown> | null;
}

export function useSimulateScope() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (input: SimulateScopeInput): Promise<SimulateScopeResult> => {
      const raw = await engine<unknown>(`/console/org/${orgId}/scopes/${input.slug}/simulate`, {
        method: 'POST',
        body: {
          query: input.query,
          top_k: input.topK ?? 10,
          threshold: input.threshold,
          agent_id: input.agentId,
          mode: input.mode,
        },
      });
      const record = asRecord(raw);
      const hits = Array.isArray(record.hits) ? record.hits : [];
      return {
        traceId: str(record.trace_id),
        hits: hits.map((h) => {
          const hit = asRecord(h);
          return {
            chunkId: str(hit.chunkId) ?? str(hit.chunk_id) ?? '',
            documentId: str(hit.documentId) ?? str(hit.document_id) ?? '',
            score: num(hit.score) ?? 0,
            text: typeof hit.text === 'string' ? hit.text : '',
            title: str(hit.title),
          };
        }),
        trace: (record.trace as Record<string, unknown> | null) ?? null,
      };
    },
    onError: (error) => toastEngineError(error, 'Simulation failed'),
  });
}

// ------------------------------------------------------------------
// Usage — reverse views (Phase 2)
// ------------------------------------------------------------------

export interface DocumentConsumer {
  agentId: string | null;
  agentName: string | null;
  retrievalCount: number;
  citationCount: number;
  lastRetrievedAt: string | null;
}

export function useDocumentConsumers(documentId: string | null, days = 30, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'documents', documentId, 'consumers', days],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/documents/${documentId}/consumers`, {
        query: { days },
      }),
    enabled: !!orgId && !!documentId && (options?.enabled ?? true),
    staleTime: 30_000,
    select: (raw) => {
      const list = asRecord(raw).consumers;
      if (!Array.isArray(list)) return [] as DocumentConsumer[];
      return list.map((entry) => {
        const item = asRecord(entry);
        return {
          agentId: str(item.agentId) ?? str(item.agent_id),
          agentName: str(item.agentName) ?? str(item.agent_name),
          retrievalCount: num(item.retrievalCount) ?? num(item.retrieval_count) ?? 0,
          citationCount: num(item.citationCount) ?? num(item.citation_count) ?? 0,
          lastRetrievedAt: str(item.lastRetrievedAt) ?? str(item.last_retrieved_at),
        };
      });
    },
  });
}

export interface AgentDocumentUsage {
  documentId: string;
  title: string | null;
  retrievalCount: number;
  citationCount: number;
  lastRetrievedAt: string | null;
}

export function useAgentDocuments(agentId: string | null, days = 30, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'agents', agentId, 'documents', days],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/agents/${agentId}/documents`, {
        query: { days },
      }),
    enabled: !!orgId && !!agentId && (options?.enabled ?? true),
    staleTime: 30_000,
    select: (raw) => {
      const list = asRecord(raw).documents;
      if (!Array.isArray(list)) return [] as AgentDocumentUsage[];
      return list.map((entry) => {
        const item = asRecord(entry);
        return {
          documentId: (str(item.documentId) ?? str(item.document_id) ?? '') as string,
          title: str(item.title),
          retrievalCount: num(item.retrievalCount) ?? num(item.retrieval_count) ?? 0,
          citationCount: num(item.citationCount) ?? num(item.citation_count) ?? 0,
          lastRetrievedAt: str(item.lastRetrievedAt) ?? str(item.last_retrieved_at),
        };
      });
    },
  });
}

export interface UnusedDocument {
  documentId: string;
  createdAt: string;
  byteSize: number | null;
}

export function useUnusedQueue(days = 30) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'documents', 'unused', days],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/documents/unused`, {
        query: { days },
      }),
    enabled: !!orgId,
    staleTime: 60_000,
    select: (raw) => {
      const record = asRecord(raw);
      const list = Array.isArray(record.documents) ? record.documents : [];
      return {
        windowDays: num(record.window_days) ?? days,
        count: num(record.count) ?? list.length,
        documents: list.map((entry) => {
          const item = asRecord(entry);
          return {
            documentId: (str(item.documentId) ?? str(item.document_id) ?? '') as string,
            createdAt: str(item.createdAt) ?? str(item.created_at) ?? '',
            byteSize: num(item.byteSize) ?? num(item.byte_size),
          } as UnusedDocument;
        }),
      };
    },
  });
}

export interface CitationQuadrant {
  quadrant: string;
  documentIds: string[];
  count: number;
}

export function useCitationQuadrants(days = 30) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'analytics', 'citation-quadrants', days],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/analytics/citation-quadrants`, {
        query: { days },
      }),
    enabled: !!orgId,
    staleTime: 60_000,
    select: (raw) => {
      const record = asRecord(raw);
      const list = Array.isArray(record.quadrants) ? record.quadrants : [];
      return {
        windowDays: num(record.window_days) ?? days,
        quadrants: list.map((entry) => {
          const item = asRecord(entry);
          const ids = Array.isArray(item.documentIds)
            ? item.documentIds
            : Array.isArray(item.document_ids)
              ? item.document_ids
              : [];
          return {
            quadrant: str(item.quadrant) ?? '',
            documentIds: ids.filter((id): id is string => typeof id === 'string'),
            count: num(item.count) ?? 0,
          } as CitationQuadrant;
        }),
      };
    },
  });
}

// ------------------------------------------------------------------
// Storage meter (Phase 2)
// ------------------------------------------------------------------

export interface StorageMeter {
  maxBytes: number | null;
  committedBytes: number;
  reservedBytes: number;
  availableBytes: number;
  warnAtPercent: number | null;
  byState: Array<{ state: string; bytes: number; count: number }>;
  byOrigin: Array<{ origin: string; bytes: number; count: number }>;
  topDocuments: Array<{ documentId: string; title: string | null; bytes: number }>;
  counts: {
    artifacts: number;
    documents: number;
    versions: number;
    embeddings: number;
  };
}

export function useStorageMeter() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'quota'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/knowledge/quota`),
    enabled: !!orgId,
    staleTime: 30_000,
    select: (raw): StorageMeter | null => {
      const record = asRecord(raw);
      const quota = asRecord(record.quota);
      if (!quota) return null;
      const toNum = (v: unknown): number => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string' && v.trim() !== '') {
          const n = Number(v);
          return Number.isFinite(n) ? n : 0;
        }
        return 0;
      };
      const byState = Array.isArray(record.by_state)
        ? record.by_state.map((e) => {
            const i = asRecord(e);
            return { state: str(i.state) ?? '', bytes: toNum(i.bytes), count: toNum(i.count) };
          })
        : [];
      const byOrigin = Array.isArray(record.by_origin)
        ? record.by_origin.map((e) => {
            const i = asRecord(e);
            return { origin: str(i.origin) ?? '', bytes: toNum(i.bytes), count: toNum(i.count) };
          })
        : [];
      const topDocuments = Array.isArray(record.top_documents)
        ? record.top_documents.map((e) => {
            const i = asRecord(e);
            return {
              documentId: (str(i.documentId) ?? str(i.document_id) ?? '') as string,
              title: str(i.title),
              bytes: toNum(i.bytes),
            };
          })
        : [];
      const counts = asRecord(record.counts);
      return {
        maxBytes: quota.max_bytes === null || quota.max_bytes === undefined ? null : toNum(quota.max_bytes),
        committedBytes: toNum(quota.committed_bytes),
        reservedBytes: toNum(quota.reserved_bytes),
        availableBytes: toNum(quota.available_bytes),
        warnAtPercent: quota.warn_at_percent == null ? null : toNum(quota.warn_at_percent),
        byState,
        byOrigin,
        topDocuments,
        counts: {
          artifacts: toNum(counts.artifacts),
          documents: toNum(counts.documents),
          versions: toNum(counts.versions),
          embeddings: toNum(counts.embeddings),
        },
      };
    },
  });
}

// ------------------------------------------------------------------
// Curation & provenance (Phase 3)
// ------------------------------------------------------------------

export type CurationAction = 'unreviewed' | 'curated' | 'verified' | 'deprecated' | 'rejected';

export function useCurateDocument() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { documentId: string; action: CurationAction }) =>
      engine<{ document_id: string; curation_status: string; reviewer_id: string }>(
        `/console/org/${orgId}/documents/${input.documentId}/curate`,
        {
          method: 'POST',
          body: { action: input.action },
          idempotent: true,
        },
      ),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [...LIBRARY_KEY, orgId, 'documents', variables.documentId] });
      void queryClient.invalidateQueries({ queryKey: ['studio', 'setup', 'knowledge', orgId, 'documents'] });
    },
    onError: (error) => toastEngineError(error, 'Could not update curation status'),
  });
}

export interface DocumentProvenance {
  documentId: string;
  origin: string;
  provenance: Record<string, unknown>;
  ownerId: string | null;
  reviewerId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  sourceArtifactId: string;
}

export function useDocumentProvenance(documentId: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'documents', documentId, 'provenance'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/documents/${documentId}/provenance`),
    enabled: !!orgId && !!documentId && (options?.enabled ?? true),
    staleTime: 30_000,
    select: (raw): DocumentProvenance | null => {
      const record = asRecord(raw);
      const id = str(record.document_id);
      if (!id) return null;
      return {
        documentId: id,
        origin: str(record.origin) ?? 'unknown',
        provenance: asRecord(record.provenance),
        ownerId: str(record.owner_id),
        reviewerId: str(record.reviewer_id),
        reviewedAt: str(record.reviewed_at),
        createdAt: str(record.created_at) ?? '',
        sourceArtifactId: str(record.source_artifact_id) ?? '',
      };
    },
  });
}

export function useSetDocumentOwner() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { documentId: string; ownerId: string | null }) =>
      engine<{ document_id: string; owner_id: string | null }>(
        `/console/org/${orgId}/documents/${input.documentId}/owner`,
        {
          method: 'POST',
          body: { owner_id: input.ownerId },
          idempotent: true,
        },
      ),
    onSuccess: (_data, variables) =>
      void queryClient.invalidateQueries({
        queryKey: [...LIBRARY_KEY, orgId, 'documents', variables.documentId, 'provenance'],
      }),
    onError: (error) => toastEngineError(error, 'Could not assign the owner'),
  });
}

export interface ExplainRetrievalInput {
  query: string;
  documentId?: string;
  attributeFilter?: Record<string, string[]>;
}

export interface WhyNotStep {
  check: string;
  passed: boolean;
  detail: string;
}

export interface WhyNotResult {
  document_id: string;
  found: boolean;
  steps: WhyNotStep[];
  final_reason: string;
}

export interface ExplainRetrievalResult {
  traceId: string | null;
  hits: Array<{
    chunkId: string;
    documentId: string;
    score: number;
    text: string;
    title: string | null;
  }>;
  trace: Record<string, unknown> | null;
  whyNot: WhyNotResult | null;
}

export function useExplainRetrieval() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (input: ExplainRetrievalInput): Promise<ExplainRetrievalResult> => {
      const raw = await engine<unknown>(`/console/org/${orgId}/knowledge/explain`, {
        method: 'POST',
        body: {
          query: input.query,
          document_id: input.documentId,
          attribute_filter: input.attributeFilter,
        },
      });
      const record = asRecord(raw);
      const hits = Array.isArray(record.hits) ? record.hits : [];
      const trace = asRecord(record.trace);
      const whyNotRaw = trace.why_not ?? record.why_not;
      return {
        traceId: str(record.trace_id),
        hits: hits.map((h) => {
          const hit = asRecord(h);
          return {
            chunkId: str(hit.chunkId) ?? str(hit.chunk_id) ?? '',
            documentId: str(hit.documentId) ?? str(hit.document_id) ?? '',
            score: num(hit.score) ?? 0,
            text: typeof hit.text === 'string' ? hit.text : '',
            title: str(hit.title),
          };
        }),
        trace: Object.keys(trace).length > 0 ? trace : null,
        whyNot: whyNotRaw ? (whyNotRaw as WhyNotResult) : null,
      };
    },
    onError: (error) => toastEngineError(error, 'Explain failed'),
  });
}

// ------------------------------------------------------------------
// Intelligence (Phase 4)
// ------------------------------------------------------------------

export interface RecallGap {
  queryHash: string;
  queryPreview: string;
  gapType: 'zero_results' | 'negative_feedback' | 'should_have_used' | string;
  occurrenceCount: number;
  candidateDocumentIds: string[];
  detectedAt: string | null;
}

export function useRecallGaps(days = 7) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'recall-gaps', days],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/knowledge/recall-gaps`, {
        query: { days },
      }),
    enabled: !!orgId,
    staleTime: 60_000,
    select: (raw) => {
      const record = asRecord(raw);
      const list = Array.isArray(record.gaps) ? record.gaps : [];
      return {
        days: num(record.days) ?? days,
        gaps: list.map((entry) => {
          const item = asRecord(entry);
          const candidates = Array.isArray(item.candidateDocumentIds)
            ? item.candidateDocumentIds
            : Array.isArray(item.candidate_document_ids)
              ? item.candidate_document_ids
              : [];
          return {
            queryHash: str(item.queryHash) ?? str(item.query_hash) ?? '',
            queryPreview: str(item.queryPreview) ?? str(item.query_preview) ?? '',
            gapType: str(item.gapType) ?? str(item.gap_type) ?? 'zero_results',
            occurrenceCount: num(item.occurrenceCount) ?? num(item.occurrence_count) ?? 0,
            candidateDocumentIds: candidates.filter((c): c is string => typeof c === 'string'),
            detectedAt: str(item.detectedAt) ?? str(item.detected_at),
          } as RecallGap;
        }),
      };
    },
  });
}

export interface NearDuplicateHit {
  documentId: string;
  similarity: number;
}

export function useNearDuplicates(
  documentId: string | null,
  threshold = 0.8,
  options?: { enabled?: boolean },
) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'documents', documentId, 'near-duplicates', threshold],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/documents/${documentId}/near-duplicates`, {
        query: { threshold },
      }),
    enabled: !!orgId && !!documentId && (options?.enabled ?? true),
    staleTime: 60_000,
    select: (raw) => {
      const record = asRecord(raw);
      const list = Array.isArray(record.hits) ? record.hits : Array.isArray(record.duplicates) ? record.duplicates : [];
      return {
        documentId: str(record.document_id) ?? documentId ?? '',
        threshold: num(record.threshold) ?? threshold,
        hits: list.map((entry) => {
          const item = asRecord(entry);
          return {
            documentId: (str(item.documentId) ?? str(item.document_id) ?? '') as string,
            similarity: num(item.similarity) ?? 0,
          } as NearDuplicateHit;
        }),
      };
    },
  });
}

export interface Recommendation {
  type: 'deprecate_unused' | 'review_rejected' | 'merge_duplicates' | 'fill_recall_gap' | 'curate_low_confidence' | string;
  severity: 'info' | 'warning' | 'action' | string;
  title: string;
  detail: string;
  documentIds: string[];
  suggestedAction: string;
}

export function useRecommendations() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'recommendations'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/knowledge/recommendations`),
    enabled: !!orgId,
    staleTime: 60_000,
    select: (raw) => {
      const list = asRecord(raw).recommendations;
      if (!Array.isArray(list)) return [] as Recommendation[];
      return list.map((entry) => {
        const item = asRecord(entry);
        const ids = Array.isArray(item.documentIds)
          ? item.documentIds
          : Array.isArray(item.document_ids)
            ? item.document_ids
            : [];
        return {
          type: str(item.type) ?? '',
          severity: str(item.severity) ?? 'info',
          title: str(item.title) ?? '',
          detail: str(item.detail) ?? '',
          documentIds: ids.filter((id): id is string => typeof id === 'string'),
          suggestedAction: str(item.suggestedAction) ?? str(item.suggested_action) ?? '',
        } as Recommendation;
      });
    },
  });
}

export interface EvalDatasetSummary {
  id: string;
  name: string;
}

export function useCreateEvalDataset() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string }) =>
      engine<{ dataset_id: string; name: string }>(`/console/org/${orgId}/knowledge/eval/datasets`, {
        method: 'POST',
        body: { name: input.name, description: input.description },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...LIBRARY_KEY, orgId, 'eval'] }),
    onError: (error) => toastEngineError(error, 'Could not create the eval dataset'),
  });
}

export function useAddEvalCase() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (input: {
      datasetId: string;
      query: string;
      expectedDocumentIds: string[];
      scopeFilter?: Record<string, unknown>;
    }) =>
      engine<{ case_id: string }>(`/console/org/${orgId}/knowledge/eval/datasets/${input.datasetId}/cases`, {
        method: 'POST',
        body: {
          query: input.query,
          expected_document_ids: input.expectedDocumentIds,
          scope_filter: input.scopeFilter,
        },
        idempotent: true,
      }),
    onError: (error) => toastEngineError(error, 'Could not add the eval case'),
  });
}

export interface EvalRunSummary {
  runId: string;
  avgRecall: number | null;
  avgPrecision: number | null;
  avgNdcg: number | null;
  avgMrr: number | null;
}

export function useRunEval() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { datasetId: string; k?: number }): Promise<EvalRunSummary> => {
      const raw = await engine<unknown>(`/console/org/${orgId}/knowledge/eval/datasets/${input.datasetId}/run`, {
        method: 'POST',
        body: { k: input.k ?? 10 },
      });
      const record = asRecord(raw);
      return {
        runId: str(record.run_id) ?? '',
        avgRecall: num(record.avg_recall),
        avgPrecision: num(record.avg_precision),
        avgNdcg: num(record.avg_ndcg),
        avgMrr: num(record.avg_mrr),
      };
    },
    onSuccess: (_data, variables) =>
      void queryClient.invalidateQueries({ queryKey: [...LIBRARY_KEY, orgId, 'eval', variables.datasetId] }),
    onError: (error) => toastEngineError(error, 'Eval run failed'),
  });
}

export interface EvalCaseResult {
  caseId: string;
  recallAtK: number;
  precisionAtK: number;
  ndcg: number;
  mrr: number;
  retrievedDocumentIds: string[];
}

export interface EvalRun {
  id: string;
  datasetId: string;
  k: number;
  startedAt: string | null;
  completedAt: string | null;
  avgRecall: number | null;
  avgPrecision: number | null;
  avgNdcg: number | null;
  avgMrr: number | null;
  results: EvalCaseResult[];
}

export function useEvalRun(runId: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'eval', 'runs', runId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/knowledge/eval/runs/${runId}`),
    enabled: !!orgId && !!runId && (options?.enabled ?? true),
    staleTime: 30_000,
    select: (raw): EvalRun | null => {
      const record = asRecord(raw);
      const id = str(record.id);
      if (!id) return null;
      const results = Array.isArray(record.results) ? record.results : [];
      return {
        id,
        datasetId: str(record.datasetId) ?? str(record.dataset_id) ?? '',
        k: num(record.k) ?? 10,
        startedAt: str(record.startedAt) ?? str(record.started_at),
        completedAt: str(record.completedAt) ?? str(record.completed_at),
        avgRecall: num(record.avgRecall) ?? num(record.avg_recall),
        avgPrecision: num(record.avgPrecision) ?? num(record.avg_precision),
        avgNdcg: num(record.avgNdcg) ?? num(record.avg_ndcg),
        avgMrr: num(record.avgMrr) ?? num(record.avg_mrr),
        results: results.map((entry) => {
          const item = asRecord(entry);
          const retrieved = Array.isArray(item.retrievedDocumentIds)
            ? item.retrievedDocumentIds
            : Array.isArray(item.retrieved_document_ids)
              ? item.retrieved_document_ids
              : [];
          return {
            caseId: str(item.caseId) ?? str(item.case_id) ?? '',
            recallAtK: num(item.recallAtK) ?? num(item.recall_at_k) ?? 0,
            precisionAtK: num(item.precisionAtK) ?? num(item.precision_at_k) ?? 0,
            ndcg: num(item.ndcg) ?? 0,
            mrr: num(item.mrr) ?? 0,
            retrievedDocumentIds: retrieved.filter((d): d is string => typeof d === 'string'),
          } as EvalCaseResult;
        }),
      };
    },
  });
}

export interface EvalTrendPoint {
  id: string;
  k: number;
  startedAt: string | null;
  avgRecall: number | null;
  avgPrecision: number | null;
  avgNdcg: number | null;
  avgMrr: number | null;
}

export function useEvalTrends(datasetId: string | null, limit = 20, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'eval', datasetId, 'trends', limit],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/knowledge/eval/datasets/${datasetId}/trends`, {
        query: { limit },
      }),
    enabled: !!orgId && !!datasetId && (options?.enabled ?? true),
    staleTime: 60_000,
    select: (raw) => {
      const record = asRecord(raw);
      const list = Array.isArray(record.runs) ? record.runs : [];
      return {
        datasetId: str(record.dataset_id) ?? datasetId ?? '',
        runs: list.map((entry) => {
          const item = asRecord(entry);
          return {
            id: str(item.id) ?? '',
            k: num(item.k) ?? 10,
            startedAt: str(item.startedAt) ?? str(item.started_at),
            avgRecall: num(item.avgRecall) ?? num(item.avg_recall),
            avgPrecision: num(item.avgPrecision) ?? num(item.avg_precision),
            avgNdcg: num(item.avgNdcg) ?? num(item.avg_ndcg),
            avgMrr: num(item.avgMrr) ?? num(item.avg_mrr),
          } as EvalTrendPoint;
        }),
      };
    },
  });
}

export interface EvalDataset {
  id: string;
  name: string;
  description: string | null;
  caseCount: number;
  lastRunAt: string | null;
  createdAt: string;
}

export function useEvalDatasets() {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'eval', 'datasets'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/knowledge/eval/datasets`),
    enabled: !!orgId,
    staleTime: 30_000,
    select: (raw): EvalDataset[] => {
      const list = asRecord(raw).datasets;
      if (!Array.isArray(list)) return [];
      return list.map((entry) => {
        const item = asRecord(entry);
        return {
          id: str(item.id) ?? '',
          name: str(item.name) ?? '',
          description: str(item.description),
          caseCount: num(item.caseCount) ?? num(item.case_count) ?? 0,
          lastRunAt: str(item.lastRunAt) ?? str(item.last_run_at),
          createdAt: str(item.createdAt) ?? str(item.created_at) ?? '',
        } as EvalDataset;
      });
    },
  });
}

// ------------------------------------------------------------------
// Memory timeline (Phase 2.4)
// ------------------------------------------------------------------

export interface MemoryTimelineEvent {
  id: string;
  memoryId: string | null;
  fromState: string | null;
  toState: string;
  actorType: string | null;
  actorId: string | null;
  runId: string | null;
  source: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export function useMemoryTimeline(memoryId: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'memories', memoryId, 'timeline'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/memories/${memoryId}/timeline`),
    enabled: !!orgId && !!memoryId && (options?.enabled ?? true),
    staleTime: 30_000,
    select: (raw): MemoryTimelineEvent[] => {
      const record = asRecord(raw);
      const list = Array.isArray(record.events) ? record.events : Array.isArray(record.timeline) ? record.timeline : [];
      return list.map((entry) => {
        const item = asRecord(entry);
        return {
          id: str(item.id) ?? '',
          memoryId: str(item.memoryId) ?? str(item.memory_id),
          fromState: str(item.fromState) ?? str(item.from_state),
          toState: str(item.toState) ?? str(item.to_state) ?? '',
          actorType: str(item.actorType) ?? str(item.actor_type),
          actorId: str(item.actorId) ?? str(item.actor_id),
          runId: str(item.runId) ?? str(item.run_id),
          source: str(item.source),
          reason: str(item.reason),
          metadata: asRecord(item.metadata),
          createdAt: str(item.createdAt) ?? str(item.created_at) ?? '',
        } as MemoryTimelineEvent;
      });
    },
  });
}

// ------------------------------------------------------------------
// Health findings
// ------------------------------------------------------------------

export type FindingSeverity = 'info' | 'warning' | 'critical';
export type FindingStatus = 'open' | 'snoozed' | 'resolved' | 'dismissed';

export interface HealthFinding {
  id: string;
  findingType: string;
  severity: FindingSeverity;
  subjectType: string;
  subjectId: string | null;
  fingerprint: string;
  details: Record<string, unknown>;
  status: FindingStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
}

export function useHealthFindings(status: FindingStatus = 'open') {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...LIBRARY_KEY, orgId, 'health', 'findings', status],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/knowledge/health/findings`, {
        query: { status },
      }),
    enabled: !!orgId,
    staleTime: 30_000,
    select: (raw) => {
      const record = asRecord(raw);
      const list = Array.isArray(record.findings) ? record.findings : [];
      return {
        status: (str(record.status) as FindingStatus | null) ?? status,
        count: num(record.count) ?? list.length,
        findings: list.map((entry) => {
          const item = asRecord(entry);
          return {
            id: str(item.id) ?? '',
            findingType: str(item.findingType) ?? str(item.finding_type) ?? '',
            severity: ((str(item.severity) as FindingSeverity | null) ?? 'info') as FindingSeverity,
            subjectType: str(item.subjectType) ?? str(item.subject_type) ?? '',
            subjectId: str(item.subjectId) ?? str(item.subject_id),
            fingerprint: str(item.fingerprint) ?? '',
            details: asRecord(item.details),
            status: ((str(item.status) as FindingStatus | null) ?? 'open') as FindingStatus,
            firstSeenAt: str(item.firstSeenAt) ?? str(item.first_seen_at) ?? '',
            lastSeenAt: str(item.lastSeenAt) ?? str(item.last_seen_at) ?? '',
            resolvedAt: str(item.resolvedAt) ?? str(item.resolved_at),
          } as HealthFinding;
        }),
      };
    },
  });
}

export function useDismissFinding() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fingerprint: string) =>
      engine<unknown>(`/console/org/${orgId}/knowledge/health/findings/${encodeURIComponent(fingerprint)}/dismiss`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...LIBRARY_KEY, orgId, 'health', 'findings'] });
    },
    onError: (error) => toastEngineError(error, 'Dismiss failed'),
  });
}

export function useSnoozeFinding() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fingerprint: string) =>
      engine<unknown>(`/console/org/${orgId}/knowledge/health/findings/${encodeURIComponent(fingerprint)}/snooze`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...LIBRARY_KEY, orgId, 'health', 'findings'] });
    },
    onError: (error) => toastEngineError(error, 'Snooze failed'),
  });
}
