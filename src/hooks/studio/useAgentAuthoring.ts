/**
 * Agent authoring (team_setup_ledger.md E0/F-D) — the full assistants
 * lifecycle over the engine, on the EXACT contract
 * (`engine/src/modules/assistants/assistants.controller.ts`,
 * `assistants.service.ts`, `validation.ts`, `dto.ts`):
 *
 * - wire shape is the engine payload (see `@lib/engine/agent-payload` —
 *   the ONLY mapping module; this hook never maps inline);
 * - version writes send the FULL payload at top level (R-1: CreateVersionDto
 *   admits instructions/model_params/budget_policy since the ENG-1 patch);
 * - draft edits carry `If-Match: <hash>` (stale → 412 with both hashes);
 * - every mutation is idempotent; every failure toasts verbatim.
 *
 * Row truths: assistants `{id, organization_id, name, description,
 * active_version_id, disabled_at/by/reason, …}` (camelCase drizzle rows);
 * versions carry `version` (0 = DRAFT sentinel), `status`, `hash`, the five
 * policy columns + instructions/model_params/budget_policy. The assistant
 * GET carries NO definition — definitions live on versions.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine, engineDownload, ApiError } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';
import {
  defaultConsumer,
  fromEnginePayload,
  toEnginePayload,
  type ConsumerDefinition,
  type ConsumerTool,
} from '@lib/engine/agent-payload';
import { validateConsumer } from '@lib/engine/setup-caps';
import { useModelAvailability } from './useSetupModels';
import { BUILT_IN_TOOLS, useToolCatalog } from './useSetupTools';
import { useAssistantTemplate } from './useSetupTemplates';
import { useEvalRuns } from './useSetupEval';
import { useDocuments } from './useSetupKnowledge';
import { describeRequiredCheck } from '@/sections/pages/products/agent-studio/builder/lib/eval-model';
import {
  classifyPublishRefusal,
  derivePublishReadiness,
  type PublishReadinessRow,
  type ReadinessVerdict,
} from '@/sections/pages/products/agent-studio/builder/lib/publish-model';

/** Editor model = the consumer definition (single mapping module owns it). */
export type AgentDefinition = ConsumerDefinition;
export type ToolPolicy = ConsumerTool;

/** Picker values for memory scope — all 4 engine options, `user` first (the
 *  engine + contract default; C08 resolved the stale "omit user" guidance). */
export const MEMORY_SCOPES = ['user', 'none', 'conversation', 'org'] as const;

export const defaultDefinition = defaultConsumer;
/** @deprecated import validateConsumer from `@lib/engine/setup-caps` instead. */
export const validateDefinition = validateConsumer;

// ─── Reads ─────────────────────────────────────────────────────────────

export interface AssistantDetail {
  id: string;
  name: string;
  description: string | null;
  activeVersionId: string | null;
  disabledAt: string | null;
  disabledBy: string | null;
  disabledReason: string | null;
  /** Degraded waiver clock (C15 — absent on older engines, never invented). */
  degradedUntil: string | null;
  degradedReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function parseDetail(raw: unknown): AssistantDetail | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const nested = typeof record.assistant === 'object' && record.assistant !== null ? (record.assistant as Record<string, unknown>) : record;
  const id = str(nested.id) ?? str(nested.assistant_id);
  if (!id) {
    return null;
  }
  const pick = (...keys: string[]): string | null => {
    for (const key of keys) {
      const hit = str(nested[key]);
      if (hit) {
        return hit;
      }
    }
    return null;
  };
  return {
    id,
    name: pick('name', 'display_name') ?? 'Untitled agent',
    description: pick('description', 'summary'),
    activeVersionId: pick('activeVersionId', 'active_version_id', 'published_version_id'),
    disabledAt: pick('disabledAt', 'disabled_at'),
    disabledBy: pick('disabledBy', 'disabled_by'),
    disabledReason: pick('disabledReason', 'disabled_reason'),
    degradedUntil: pick('degradedUntil', 'degraded_until'),
    degradedReason: pick('degradedReason', 'degraded_reason'),
    createdAt: pick('createdAt', 'created_at'),
    updatedAt: pick('updatedAt', 'updated_at'),
  };
}

const AUTHORING_KEY = ['studio', 'assistants'] as const;

export function useAssistant(assistantId: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...AUTHORING_KEY, orgId, 'detail', assistantId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/assistants/${assistantId}`),
    enabled: (options?.enabled ?? true) && !!orgId && !!assistantId,
    staleTime: 15_000,
    select: parseDetail,
  });
}

export interface AgentVersion {
  id: string;
  /** Monotonic number (0 = DRAFT sentinel). */
  version: number;
  status: string | null;
  hash: string | null;
  createdAt: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
  rollbackOf: string | null;
  definition: AgentDefinition | null;
  /** Row write time — C10 staleness compares it against run finish (D10). */
  updatedAt: string | null;
  /** Fork point / restored target (C15 lineage — absent on older engines). */
  parentVersionId: string | null;
}

export function parseVersions(raw: unknown): AgentVersion[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : [record.versions, record.items].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry): AgentVersion | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.version_id);
      if (!id) {
        return null;
      }
      const version = typeof item.version === 'number' ? item.version : null;
      return {
        id,
        version: version ?? 0,
        status: str(item.status) ?? str(item.state),
        hash: str(item.hash),
        createdAt: str(item.createdAt) ?? str(item.created_at),
        publishedAt: str(item.publishedAt) ?? str(item.published_at),
        publishedBy: str(item.publishedBy) ?? str(item.published_by) ?? str(item.created_by) ?? str(item.author),
        rollbackOf: str(item.rollbackOf) ?? str(item.rollback_of),
        parentVersionId: str(item.parentVersionId) ?? str(item.parent_version_id),
        updatedAt: str(item.updatedAt) ?? str(item.updated_at),
        definition: fromEnginePayload(item),
      } satisfies AgentVersion;
    })
    .filter((v): v is AgentVersion => v !== null);
}

export function useAssistantVersions(assistantId: string | null) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...AUTHORING_KEY, orgId, 'versions', assistantId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/assistants/${assistantId}/versions`),
    enabled: !!orgId && !!assistantId,
    staleTime: 15_000,
    select: parseVersions,
  });
}

/** The editable definition: the DRAFT version when one exists, else the active version, else blank. */
export function useAssistantDefinition(assistantId: string | null, opts?: { prefer?: 'draft' | 'active' }) {
  const versions = useAssistantVersions(assistantId);
  const detail = useAssistant(assistantId);
  return {
    ...versions,
    data:
      versions.data === undefined
        ? undefined
        : (() => {
            const rows = versions.data;
            const draft = rows.find((v) => v.status === 'DRAFT') ?? null;
            const active = detail.data?.activeVersionId ? rows.find((v) => v.id === detail.data?.activeVersionId) ?? null : null;
            // The detail view (read-only) must show what SERVES, not the draft.
            // The builder (editable) keeps the draft-preferred default.
            const source = opts?.prefer === 'active' ? (active ?? draft) : (draft ?? active);
            return {
              definition: source?.definition ?? defaultConsumer(),
              versionId: source?.id ?? null,
              hash: source?.hash ?? null,
              status: source?.status ?? null,
              isDraft: draft !== null,
              isLive: active !== null,
            };
          })(),
  };
}

export interface VersionProvenance {
  template: { slug: string; version: string; definition_hash: string | null } | null;
  manifestHash: string | null;
  updateAvailable: 'major' | 'minor' | 'none';
  lastEvaluation: { decision: string; score: string | null; finishedAt: string | null } | null;
}

export function parseProvenance(raw: unknown): VersionProvenance | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const record = raw as Record<string, unknown>;
  const nested = typeof record.provenance === 'object' && record.provenance !== null ? (record.provenance as Record<string, unknown>) : record;
  const template = typeof nested.template === 'object' && nested.template !== null ? (nested.template as Record<string, unknown>) : null;
  const last = typeof nested.last_evaluation === 'object' && nested.last_evaluation !== null ? (nested.last_evaluation as Record<string, unknown>) : null;
  const update = str(nested.update_available);
  return {
    template: template && str(template.slug) ? { slug: str(template.slug) as string, version: str(template.version) ?? '', definition_hash: str(template.definition_hash) } : null,
    manifestHash: str(nested.manifest_hash),
    updateAvailable: update === 'major' || update === 'minor' ? update : 'none',
    lastEvaluation: last && str(last.decision) ? { decision: str(last.decision) as string, score: str(last.score), finishedAt: str(last.finished_at) } : null,
  };
}

export function useVersionProvenance(assistantId: string | null, versionId: string | null) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...AUTHORING_KEY, orgId, 'provenance', assistantId, versionId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/assistants/${assistantId}/versions/${versionId}/provenance`),
    enabled: !!orgId && !!assistantId && !!versionId,
    staleTime: 30_000,
    select: parseProvenance,
  });
}

export interface KnowledgeHealthPin {
  sourceSlug: string;
  resolved: boolean;
  documentId: string | null;
  state: string | null;
  /** Per-model embedding coverage (C05 — engine returns it; null on older engines). */
  embeddingComplete: boolean | null;
}

export function parseKnowledgeHealth(raw: unknown): { degraded: boolean; pins: KnowledgeHealthPin[] } {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const pins = Array.isArray(record.pins) ? record.pins : [];
  return {
    degraded: record.degraded === true,
    pins: pins
      .map((entry) => {
        if (typeof entry !== 'object' || entry === null) {
          return null;
        }
        const pin = entry as Record<string, unknown>;
        return {
          sourceSlug: str(pin.source_slug) ?? '',
          resolved: pin.resolved === true,
          documentId: str(pin.document_id),
          state: str(pin.state),
          embeddingComplete: typeof pin.embedding_complete === 'boolean' ? pin.embedding_complete : null,
        } satisfies KnowledgeHealthPin;
      })
      .filter((p): p is KnowledgeHealthPin => p !== null),
  };
}

/** ACTIVE-version pins × live document states — drives the degraded banner. All roles. */
export function useKnowledgeHealth(assistantId: string | null) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...AUTHORING_KEY, orgId, 'knowledge-health', assistantId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/assistants/${assistantId}/knowledge-health`),
    enabled: !!orgId && !!assistantId,
    staleTime: 30_000,
    select: parseKnowledgeHealth,
  });
}

// ─── Publish readiness (C14 — single derivation, both surfaces) ──────

// Row/gate shapes live in the pure model (unit-tested without queries);
// this module only feeds them query data and re-exports the shapes.
export type {
  DerivedReadiness,
  PublishGateId,
  PublishReadinessRow,
  PublishVersionLite,
  ReadinessVerdict,
  RefusalFix,
} from '@/sections/pages/products/agent-studio/builder/lib/publish-model';

export interface PublishReadiness {
  version: AgentVersion | null;
  activeVersion: AgentVersion | null;
  templateSlug: string | null;
  templateVersion: string | null;
  rows: PublishReadinessRow[];
  verdict: ReadinessVerdict;
  /** True when every REQUIRED row passes (or the degraded one is acked). */
  publishable: boolean;
  needsAcknowledge: boolean;
  unresolvedSlugs: string[];
  unreadySlugs: string[];
  /** Advisory only — deep-equal content still re-pins a drifted manifest. */
  noChangeHint: boolean;
  requiredChecks: Array<{ label: string; detail: string | null }>;
  decision: string | null;
  decisionFinishedAt: string | null;
  evalRunning: boolean;
  isPending: boolean;
  isError: boolean;
  retry: () => void;
}

/**
 * The publish gate read — thin query composer over the pure
 * `derivePublishReadiness` (PLAN.md §5 — the ship section and the detail
 * panel share this, never two derivations). Composed reads only — no
 * dedicated required-checks endpoint exists (PLAN §8 D1).
 */
export function usePublishReadiness(
  assistantId: string | null,
  versionId: string | null,
  options?: { acknowledged?: boolean; enabled?: boolean },
): PublishReadiness {
  const acknowledged = options?.acknowledged === true;
  const enabled = (options?.enabled ?? true) && !!assistantId && !!versionId;
  const versions = useAssistantVersions(enabled ? assistantId : null);
  const detail = useAssistant(enabled ? assistantId : null);
  const provenance = useVersionProvenance(enabled ? assistantId : null, enabled ? versionId : null);
  const templateSlug = provenance.data?.template?.slug ?? null;
  const templateVersion = provenance.data?.template?.version ?? null;
  const template = useAssistantTemplate(enabled ? templateSlug : null, templateVersion ?? undefined);
  const models = useModelAvailability(enabled ? { enabled: true } : { enabled: false });
  const catalog = useToolCatalog(enabled ? { enabled: true } : { enabled: false });
  const health = useKnowledgeHealth(enabled ? assistantId : null);
  const documents = useDocuments();
  const evalRuns = useEvalRuns(undefined, { enabled });

  const version = versions.data?.find((v) => v.id === versionId) ?? null;
  const activeVersion = detail.data?.activeVersionId
    ? (versions.data?.find((v) => v.id === detail.data?.activeVersionId) ?? null)
    : null;
  const definition = version?.definition ?? null;

  const libraryStates: Record<string, string | undefined> = {};
  for (const doc of documents.data ?? []) {
    if (doc.sourceSlug) {
      libraryStates[doc.sourceSlug] = doc.state;
    }
  }

  const derived = derivePublishReadiness({
    version:
      version && definition
        ? {
            id: version.id,
            version: version.version,
            status: version.status,
            hash: version.hash,
            updatedAt: version.updatedAt,
            definition,
          }
        : null,
    versionsLoaded: versions.data !== undefined,
    activeDefinition: activeVersion?.definition ?? null,
    templateRequired: Array.isArray(template.data?.releasePolicy?.required)
      ? (template.data?.releasePolicy?.required as unknown[])
      : [],
    templateLoaded: provenance.data !== undefined && (templateSlug === null || template.data !== undefined),
    models: models.data?.map((m) => ({ ref: m.ref, usable: m.usable })),
    catalog: catalog.data?.map((t) => ({ name: t.name, enabled: t.enabled, hash: t.hash })),
    toolBuiltins: BUILT_IN_TOOLS,
    healthPins: health.data?.pins,
    libraryStates,
    documentsLoaded: documents.data !== undefined,
    evalRuns: evalRuns.data?.map((r) => ({
      assistantVersionId: r.assistantVersionId,
      state: r.state,
      decision: r.decision,
      isShadow: r.isShadow,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
    })),
    acknowledged,
  });

  const isPending =
    versions.isPending ||
    detail.isPending ||
    provenance.isPending ||
    (templateSlug !== null && template.isPending) ||
    models.isPending ||
    catalog.isPending ||
    health.isPending ||
    documents.isPending ||
    evalRuns.isPending;
  const isError =
    versions.isError ||
    detail.isError ||
    provenance.isError ||
    (templateSlug !== null && template.isError) ||
    models.isError ||
    catalog.isError ||
    health.isError ||
    documents.isError ||
    evalRuns.isError;

  return {
    version,
    activeVersion,
    templateSlug,
    templateVersion,
    ...derived,
    requiredChecks: (Array.isArray(template.data?.releasePolicy?.required)
      ? (template.data?.releasePolicy?.required as unknown[])
      : []
    ).map(describeRequiredCheck),
    isPending,
    isError,
    retry: () => {
      void versions.refetch();
      void detail.refetch();
      void provenance.refetch();
      void template.refetch();
      void models.refetch();
      void catalog.refetch();
      void health.refetch();
      void documents.refetch();
      void evalRuns.refetch();
    },
  };
}

// ─── Structured diff ───────────────────────────────────────────────────

export interface DefinitionDiffRow {
  path: string;
  kind: 'added' | 'removed' | 'changed';
  from: string;
  to: string;
}

function flatten(value: unknown, prefix: string, out: Map<string, string>): void {
  if (value === null || typeof value !== 'object') {
    out.set(prefix, Array.isArray(value) ? JSON.stringify(value) : String(value));
    return;
  }
  if (Array.isArray(value)) {
    out.set(prefix, JSON.stringify(value));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    flatten(child, prefix ? `${prefix}.${key}` : key, out);
  }
}

/** Leaf-level diff of two definitions — added/removed/changed paths. */
export function diffDefinitions(from: AgentDefinition, to: AgentDefinition): DefinitionDiffRow[] {
  const a = new Map<string, string>();
  const b = new Map<string, string>();
  flatten(from, '', a);
  flatten(to, '', b);
  const rows: DefinitionDiffRow[] = [];
  for (const [path, value] of a) {
    if (!b.has(path)) {
      rows.push({ path, kind: 'removed', from: value, to: '' });
    } else if (b.get(path) !== value) {
      rows.push({ path, kind: 'changed', from: value, to: b.get(path) as string });
    }
  }
  for (const [path, value] of b) {
    if (!a.has(path)) {
      rows.push({ path, kind: 'added', from: '', to: value });
    }
  }
  return rows.sort((x, y) => x.path.localeCompare(y.path));
}

// ─── Writes ────────────────────────────────────────────────────────────

function useInvalidateAuthoring() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...AUTHORING_KEY] });
  };
}

export interface CreateAssistantResult {
  assistantId: string | null;
  versionId: string | null;
  template: string | null;
  hash: string | null;
}

export function useCreateAssistant() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; template?: { slug: string; version?: string }; definition?: AgentDefinition }) => {
      const raw = await engine<Record<string, unknown>>(`/console/org/${orgId}/assistants`, {
        method: 'POST',
        body: {
          name: input.name,
          ...(input.description ? { description: input.description } : {}),
          ...(input.template ? { template: input.template } : {}),
          ...(input.definition ? { definition: toEnginePayload(input.definition) } : {}),
        },
        idempotent: true,
      });
      const assistant = typeof raw.assistant === 'object' && raw.assistant !== null ? (raw.assistant as Record<string, unknown>) : {};
      const result: CreateAssistantResult = {
        assistantId: str(assistant.id) ?? str(raw.assistant_id) ?? null,
        versionId: str(raw.version_id) ?? null,
        template: str(raw.template),
        hash: str(raw.hash),
      };
      await queryClient.invalidateQueries({ queryKey: [...AUTHORING_KEY] });
      return result;
    },
    onError: (error) => toastEngineError(error, 'Could not create the agent'),
  });
}

/** Mutation key shared by both draft-write mutations — the builder top bar
 * derives its honest "Saving…" readout from it (A2-23). */
export const DRAFT_WRITE_MUTATION_KEY = ['studio', 'assistants', 'draft-write'] as const;

/** Saves the edited definition as a new immutable draft version (full payload at top level — R-1). */
export function useSaveDraftVersion(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationKey: [...DRAFT_WRITE_MUTATION_KEY],
    mutationFn: async (definition: AgentDefinition) =>
      engine(`/console/org/${orgId}/assistants/${assistantId}/versions`, {
        method: 'POST',
        body: toEnginePayload(definition),
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not save the draft'),
  });
}

/**
 * Iterative draft edit with optimistic concurrency. If-Match carries the
 * hash from the freshest version GET (REQUIRED — the server 400s without
 * it); a stale hash 412s with both hashes for merge-or-reload (F-D4).
 */
export function useUpdateDraftVersion(assistantId: string | null, versionId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationKey: [...DRAFT_WRITE_MUTATION_KEY],
    mutationFn: async (input: { definition: AgentDefinition; expectedHash: string }) =>
      engine(`/console/org/${orgId}/assistants/${assistantId}/versions/${versionId}/draft`, {
        method: 'PUT',
        body: toEnginePayload(input.definition),
        headers: { 'If-Match': input.expectedHash },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    // 412s are owned by the editor's merge-or-reload panel (both hashes +
    // diff) — a toast here would double-surface the same refusal.
    onError: (error) => {
      if (!(error instanceof ApiError && error.status === 412)) {
        toastEngineError(error, 'Could not save the draft');
      }
    },
  });
}

/** Abandons a DRAFT (published history untouched). */
export function useDiscardDraft(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (versionId: string) =>
      engine(`/console/org/${orgId}/assistants/${assistantId}/versions/${versionId}/draft`, { method: 'DELETE', idempotent: true }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not discard the draft'),
  });
}

/**
 * Publishes a draft version (owner/admin). No step-up: the engine demands no
 * fresh proof on this route — runWithStepUp would only ever add a phantom
 * MFA prompt, so this calls the engine directly and honestly.
 *
 * Typed refusals (400/409 — the publish ceremony owns them) skip the toast;
 * the caller MUST render the branch (see `classifyPublishRefusal`). Anything
 * untyped still toasts verbatim as the fallback.
 */
export interface PublishedVersionRef {
  id: string | null;
  version: number | null;
  hash: string | null;
}

export function parsePublishedVersion(raw: unknown): PublishedVersionRef {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const row = typeof record.version === 'object' && record.version !== null ? (record.version as Record<string, unknown>) : record;
  const pickStr = (...keys: string[]): string | null => {
    for (const key of keys) {
      if (typeof row[key] === 'string' && (row[key] as string).trim() !== '') {
        return row[key] as string;
      }
    }
    return null;
  };
  const num = typeof row.version === 'number' && Number.isFinite(row.version) ? (row.version as number) : null;
  return { id: pickStr('id', 'version_id'), version: num, hash: pickStr('hash') };
}

export function usePublishVersion(assistantId: string | null) {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (input: { versionId: string; acknowledgeDegradedKnowledge?: boolean }) => {
      const raw = await engine<unknown>(`/console/org/${orgId}/assistants/${assistantId}/versions/${input.versionId}/publish`, {
        method: 'POST',
        body: input.acknowledgeDegradedKnowledge === true ? { acknowledge_degraded_knowledge: true } : {},
        idempotent: true,
      });
      return parsePublishedVersion(raw);
    },
    onSuccess: () => {
      invalidate();
      // Pointer swing moves eval + operate truth too (decision freshness,
      // banners, rollouts read the active version) — assistants-only
      // invalidation would leave them stale.
      void queryClient.invalidateQueries({ queryKey: ['studio', 'setup', 'eval'] });
    },
    onError: (error) => {
      if (classifyPublishRefusal(error) === 'unknown') {
        toastEngineError(error, 'Could not publish the version');
      }
    },
  });
}

export function useRetireVersion(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (versionId: string) =>
      engine(`/console/org/${orgId}/assistants/${assistantId}/versions/${versionId}/retire`, { method: 'POST', idempotent: true }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not retire the version'),
  });
}

/** Assistant-level rollback: to_version_id is REQUIRED (the server 400s `{}`). Same typed-refusal contract as publish. */
export function useRollbackAssistant(assistantId: string | null) {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (input: { toVersionId: string; acknowledgeDegradedKnowledge?: boolean }) => {
      const raw = await engine<unknown>(`/console/org/${orgId}/assistants/${assistantId}/rollback`, {
        method: 'POST',
        body: {
          to_version_id: input.toVersionId,
          ...(input.acknowledgeDegradedKnowledge === true ? { acknowledge_degraded_knowledge: true } : {}),
        },
        idempotent: true,
      });
      return parsePublishedVersion(raw);
    },
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ['studio', 'setup', 'eval'] });
    },
    onError: (error) => {
      if (classifyPublishRefusal(error) === 'unknown') {
        toastEngineError(error, 'Could not roll back the agent');
      }
    },
  });
}

/** Pre-publish test conversation pinned to the version (draft-capable). Returns conversation/message/run ids. */
export function useTestRun(assistantId: string | null) {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (input: { versionId: string; text: string }) =>
      engine<{ conversation_id?: string; message_id?: string; run_id?: string | null }>(
        `/console/org/${orgId}/assistants/${assistantId}/versions/${input.versionId}/test-runs`,
        { method: 'POST', body: { text: input.text }, idempotent: true },
      ),
    onError: (error) => toastEngineError(error, 'Could not start the test run'),
  });
}

/** Formal evaluation (R-2: drafts evaluate pre-publish with a synthesized snapshot). Returns `{eval_run_id}`. */
export function useEvaluateVersion(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (input: { versionId: string; datasetId?: string; environment?: string; attemptsPerCase?: number }) =>
      engine<{ eval_run_id?: string }>(`/console/org/${orgId}/assistants/${assistantId}/versions/${input.versionId}/evaluate`, {
        method: 'POST',
        body: {
          ...(input.datasetId ? { dataset_id: input.datasetId } : {}),
          ...(input.environment ? { environment: input.environment } : {}),
          ...(typeof input.attemptsPerCase === 'number' ? { attempts_per_case: input.attemptsPerCase } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not start the evaluation'),
  });
}

export function useExportVersion(assistantId: string | null) {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (versionId: string) => {
      await engineDownload(`/console/org/${orgId}/assistants/${assistantId}/versions/${versionId}/export`);
    },
    onError: (error) => toastEngineError(error, 'Could not export the version'),
  });
}

export function useImportVersion(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      engine(`/console/org/${orgId}/assistants/${assistantId}/versions/import`, {
        method: 'POST',
        body: payload,
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not import the definition'),
  });
}

/** Clone: fetch the source's active/draft definition and create a new agent from it (round-tripped through the mapper). */
export function useCloneAssistant() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (input: { assistantId: string; name?: string }) => {
      const versions = parseVersions(await engine<unknown>(`/console/org/${orgId}/assistants/${input.assistantId}/versions`));
      const detail = parseDetail(await engine<unknown>(`/console/org/${orgId}/assistants/${input.assistantId}`));
      if (!detail) {
        throw new Error('The agent to clone could not be read');
      }
      const draft = versions.find((v) => v.status === 'DRAFT') ?? null;
      const active = detail.activeVersionId ? (versions.find((v) => v.id === detail.activeVersionId) ?? null) : null;
      const definition = (draft ?? active)?.definition ?? defaultConsumer();
      const created = await engine<Record<string, unknown>>(`/console/org/${orgId}/assistants`, {
        method: 'POST',
        body: {
          name: input.name ?? `${detail.name} (copy)`,
          ...(detail.description ? { description: detail.description } : {}),
          definition: toEnginePayload(definition),
        },
        idempotent: true,
      });
      const createdAssistant = typeof created.assistant === 'object' && created.assistant !== null ? (created.assistant as Record<string, unknown>) : {};
      return {
        assistantId: str(createdAssistant.id) ?? null,
        versionId: str(created.version_id) ?? null,
        template: null,
        hash: str(created.hash) ?? null,
      } satisfies CreateAssistantResult;
    },
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not clone the agent'),
  });
}

/** Version snapshot — fetched lazily for the version diff (snapshot + provenance). */
export function useVersionSnapshot(assistantId: string | null, versionId: string | null) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...AUTHORING_KEY, orgId, 'snapshot', assistantId, versionId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/assistants/${assistantId}/versions/${versionId}/snapshot`),
    enabled: !!orgId && !!assistantId && !!versionId,
    staleTime: 60_000,
    select: (raw: unknown) => {
      const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
      const snapshot = typeof record.snapshot === 'object' && record.snapshot !== null ? record.snapshot : raw;
      return { definition: fromEnginePayload(snapshot), provenance: parseProvenance(raw) };
    },
  });
}

/** Deletes an agent — the engine rejects when conversations exist (409). */
export function useDeleteAssistant() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (assistantId: string) => engine<{ ok: true }>(`/console/org/${orgId}/assistants/${assistantId}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not delete the agent — archive its conversations first'),
  });
}

/** Kill switch: disable (audited, blocks run acceptance) / enable. */
export function useDisableAssistant(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (reason?: string) =>
      engine(`/console/org/${orgId}/assistants/${assistantId}/disable`, {
        method: 'POST',
        body: reason ? { reason } : {},
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not disable the agent'),
  });
}

export function useEnableAssistant(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async () => engine(`/console/org/${orgId}/assistants/${assistantId}/enable`, { method: 'POST', idempotent: true }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not enable the agent'),
  });
}
