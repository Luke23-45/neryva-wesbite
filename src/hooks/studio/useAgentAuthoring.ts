/**
 * Agent authoring (ledger A-1..A-5) — the full assistants lifecycle over
 * the engine: list/detail/create, immutable versions (draft → publish →
 * retire), rollback, export/import, and the definition model the editor
 * round-trips.
 *
 * The definition mirrors the agent-definition v1 contract
 * (`products/agent-studio/contracts/agent-definition/v1.schema.json`).
 * Server payloads are parsed defensively — partial definitions merge over
 * the defaults — so the engine stays the source of truth while the UI
 * survives contract refinement during integration.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine, engineDownload } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { runWithStepUp } from '@lib/engine/stepup';
import { useOrg } from '@/Context/OrgContext';

// ─── Definition model ────────────────────────────────────────────────

export interface ToolPolicy {
  id: string;
  /** When a human must approve this tool's calls. */
  approval: 'never' | 'on_effect' | 'always';
}

export interface AgentDefinition {
  instructions: string;
  model_policy: {
    allowed_models: string[];
    fallback_enabled: boolean;
    max_output_tokens: number;
  };
  context_policy: {
    history_limit: number;
    summary_enabled: boolean;
    knowledge_sources: string[];
    memory_scope: string;
    max_context_tokens: number;
  };
  tools: ToolPolicy[];
  guardrails: {
    pii_redaction: boolean;
    input_policy: string;
    output_policy: string;
  };
  budget_policy: {
    max_model_calls: number;
    max_tool_calls: number;
    max_wall_clock_ms: number;
    max_token_budget: number;
    max_cost_cents: number;
    max_recursion_depth: number;
  };
  retrieval_policy: {
    knowledge_max_results: number;
    memory_max_results: number;
    hybrid_retrieval: boolean;
  };
  brand: string;
}

export const MEMORY_SCOPES = ['none', 'conversation', 'org'] as const;

/** ⛔ E-1 interim: the model allowlist is static until the registry lands. */
export const MODEL_CATALOG = ['reasoner', 'instant', 'researcher'];

export function defaultDefinition(): AgentDefinition {
  return {
    instructions: '',
    model_policy: {
      allowed_models: [MODEL_CATALOG[0]],
      fallback_enabled: true,
      max_output_tokens: 4096,
    },
    context_policy: {
      history_limit: 20,
      summary_enabled: true,
      knowledge_sources: [],
      memory_scope: 'conversation',
      max_context_tokens: 32_000,
    },
    tools: [],
    guardrails: {
      pii_redaction: true,
      input_policy: '',
      output_policy: '',
    },
    budget_policy: {
      max_model_calls: 12,
      max_tool_calls: 12,
      max_wall_clock_ms: 120_000,
      max_token_budget: 100_000,
      max_cost_cents: 500,
      max_recursion_depth: 3,
    },
    retrieval_policy: {
      knowledge_max_results: 6,
      memory_max_results: 4,
      hybrid_retrieval: true,
    },
    brand: '',
  };
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function numOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function obj(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

/** Merge a (possibly partial) server definition over the defaults. */
export function parseDefinition(raw: unknown): AgentDefinition {
  const base = defaultDefinition();
  if (typeof raw !== 'object' || raw === null) {
    return base;
  }
  const r = raw as Record<string, unknown>;
  const model = obj(r.model_policy);
  const context = obj(r.context_policy);
  const guardrails = obj(r.guardrails);
  const budget = obj(r.budget_policy);
  const retrieval = obj(r.retrieval_policy);

  const allowedModels = Array.isArray(model.allowed_models)
    ? model.allowed_models.filter((m): m is string => typeof m === 'string')
    : base.model_policy.allowed_models;

  const tools = Array.isArray(r.tools)
    ? r.tools
        .map((t) => {
          const tool = obj(t);
          const id = str(tool.id) ?? str(tool.tool_id) ?? str(tool.name);
          if (!id) {
            return null;
          }
          const approval = str(tool.approval) ?? str(tool.approval_requirement) ?? 'never';
          return {
            id,
            approval: (['never', 'on_effect', 'always'].includes(approval) ? approval : 'never') as ToolPolicy['approval'],
          } satisfies ToolPolicy;
        })
        .filter((t): t is ToolPolicy => t !== null)
    : base.tools;

  const knowledgeSources = Array.isArray(context.knowledge_sources)
    ? context.knowledge_sources.filter((s): s is string => typeof s === 'string')
    : base.context_policy.knowledge_sources;

  return {
    instructions: str(r.instructions) ?? base.instructions,
    model_policy: {
      allowed_models: allowedModels.length > 0 ? allowedModels : base.model_policy.allowed_models,
      fallback_enabled: boolOr(model.fallback_enabled, base.model_policy.fallback_enabled),
      max_output_tokens: numOr(model.max_output_tokens, base.model_policy.max_output_tokens),
    },
    context_policy: {
      history_limit: numOr(context.history_limit, base.context_policy.history_limit),
      summary_enabled: boolOr(context.summary_enabled, base.context_policy.summary_enabled),
      knowledge_sources: knowledgeSources,
      memory_scope: str(context.memory_scope) ?? base.context_policy.memory_scope,
      max_context_tokens: numOr(context.max_context_tokens, base.context_policy.max_context_tokens),
    },
    tools,
    guardrails: {
      pii_redaction: boolOr(guardrails.pii_redaction, base.guardrails.pii_redaction),
      input_policy: str(guardrails.input_policy) ?? base.guardrails.input_policy,
      output_policy: str(guardrails.output_policy) ?? base.guardrails.output_policy,
    },
    budget_policy: {
      max_model_calls: numOr(budget.max_model_calls, base.budget_policy.max_model_calls),
      max_tool_calls: numOr(budget.max_tool_calls, base.budget_policy.max_tool_calls),
      max_wall_clock_ms: numOr(budget.max_wall_clock_ms, base.budget_policy.max_wall_clock_ms),
      max_token_budget: numOr(budget.max_token_budget, base.budget_policy.max_token_budget),
      max_cost_cents: numOr(budget.max_cost_cents, base.budget_policy.max_cost_cents),
      max_recursion_depth: numOr(budget.max_recursion_depth, base.budget_policy.max_recursion_depth),
    },
    retrieval_policy: {
      knowledge_max_results: numOr(retrieval.knowledge_max_results, base.retrieval_policy.knowledge_max_results),
      memory_max_results: numOr(retrieval.memory_max_results, base.retrieval_policy.memory_max_results),
      hybrid_retrieval: boolOr(retrieval.hybrid_retrieval, base.retrieval_policy.hybrid_retrieval),
    },
    brand: str(r.brand) ?? base.brand,
  };
}

// ─── Validation ──────────────────────────────────────────────────────

/** Returns the first blocking problem, or null when the draft is valid. */
export function validateDefinition(d: AgentDefinition): string | null {
  if (!d.instructions.trim()) {
    return 'Instructions are required — the agent has nothing to run on without them.';
  }
  if (d.model_policy.allowed_models.length === 0) {
    return 'Pick at least one allowed model.';
  }
  if (d.model_policy.max_output_tokens <= 0 || d.model_policy.max_output_tokens > 200_000) {
    return 'Max output tokens must be between 1 and 200,000.';
  }
  if (d.context_policy.history_limit < 0 || d.context_policy.max_context_tokens <= 0) {
    return 'Context limits must be non-negative (history) and positive (context tokens).';
  }
  for (const [key, value] of Object.entries(d.budget_policy)) {
    if (value < 0) {
      return `Budget "${key.replace(/_/g, ' ')}" cannot be negative.`;
    }
  }
  if (d.tools.some((t) => !t.id.trim())) {
    return 'Every tool needs an id.';
  }
  return null;
}

// ─── Structured diff (A-4) ───────────────────────────────────────────

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

// ─── Assistant reads/writes ──────────────────────────────────────────

export interface AssistantDetail {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  definition: AgentDefinition;
  currentVersionId: string | null;
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
  const definitionRaw = nested.definition ?? nested.config ?? nested.snapshot ?? null;
  return {
    id,
    name: str(nested.name) ?? str(nested.display_name) ?? 'Untitled agent',
    description: str(nested.description) ?? str(nested.summary),
    status: str(nested.status) ?? str(nested.state),
    definition: parseDefinition(definitionRaw),
    currentVersionId: str(nested.current_version_id) ?? str(nested.published_version_id) ?? str(nested.version_id),
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

export function useCreateAssistant() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string; definition?: AgentDefinition }) =>
      engine<{ id?: string; assistant_id?: string }>(`/console/org/${orgId}/assistants`, {
        method: 'POST',
        body: {
          name: input.name,
          ...(input.description ? { description: input.description } : {}),
          ...(input.definition ? { definition: input.definition } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [...AUTHORING_KEY] }),
    onError: (error) => toastEngineError(error, 'Could not create the agent'),
  });
}

export interface AgentVersion {
  id: string;
  status: string | null;
  createdAt: string | null;
  createdBy: string | null;
  definition: AgentDefinition | null;
}

export function parseVersions(raw: unknown): AgentVersion[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : [record.versions, record.items].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.version_id);
      if (!id) {
        return null;
      }
      return {
        id,
        status: str(item.status) ?? str(item.state),
        createdAt: str(item.created_at),
        createdBy: str(item.created_by) ?? str(item.author),
        definition: item.definition !== undefined ? parseDefinition(item.definition) : null,
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

function useInvalidateAuthoring() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: [...AUTHORING_KEY] });
  };
}

/** Saves the edited definition as a new immutable draft version. */
export function useSaveDraftVersion(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (definition: AgentDefinition) =>
      engine(`/console/org/${orgId}/assistants/${assistantId}/versions`, {
        method: 'POST',
        body: { definition },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not save the draft'),
  });
}

/** Publishes a draft version (privileged — step-up with auto-retry). */
export function usePublishVersion(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (versionId: string) =>
      runWithStepUp('Publish agent version', (proof) =>
        engine(`/console/org/${orgId}/assistants/${assistantId}/versions/${versionId}/publish`, {
          method: 'POST',
          ...(proof ? { mfaProof: proof } : {}),
        }),
      ),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not publish the version'),
  });
}

export function useRetireVersion(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (versionId: string) =>
      engine(`/console/org/${orgId}/assistants/${assistantId}/versions/${versionId}/retire`, { method: 'POST' }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not retire the version'),
  });
}

/** Assistant-level rollback: re-publishes the prior version's content. */
export function useRollbackAssistant(assistantId: string | null) {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (input: { toVersionId?: string }) =>
      engine(`/console/org/${orgId}/assistants/${assistantId}/rollback`, {
        method: 'POST',
        body: input.toVersionId ? { to_version_id: input.toVersionId } : {},
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not roll back the agent'),
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

/** Clone: fetch the source's definition and create a new agent from it. */
export function useCloneAssistant() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (input: { assistantId: string; name?: string }) => {
      const source = await engine<unknown>(`/console/org/${orgId}/assistants/${input.assistantId}`);
      const detail = parseDetail(source);
      if (!detail) {
        throw new Error('The agent to clone could not be read');
      }
      return engine<{ id?: string; assistant_id?: string }>(`/console/org/${orgId}/assistants`, {
        method: 'POST',
        body: {
          name: input.name ?? `${detail.name} (copy)`,
          ...(detail.description ? { description: detail.description } : {}),
          definition: detail.definition,
        },
        idempotent: true,
      });
    },
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not clone the agent'),
  });
}

/** Version snapshot — fetched lazily for the version diff. */
export function useVersionSnapshot(assistantId: string | null, versionId: string | null) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...AUTHORING_KEY, orgId, 'snapshot', assistantId, versionId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/assistants/${assistantId}/versions/${versionId}/snapshot`),
    enabled: !!orgId && !!assistantId && !!versionId,
    staleTime: 60_000,
    select: (raw: unknown) => parseDefinition(raw),
  });
}

/** Deletes an agent — the engine rejects when conversations exist (409). */
export function useDeleteAssistant() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateAuthoring();
  return useMutation({
    mutationFn: async (assistantId: string) =>
      engine<{ ok: true }>(`/console/org/${orgId}/assistants/${assistantId}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not delete the agent — archive its conversations first'),
  });
}
