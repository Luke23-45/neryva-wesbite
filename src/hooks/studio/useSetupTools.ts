/**
 * Tool catalog reads (team_setup_ledger.md F-B4/F-D3; mutations + view land
 * in F3) over the EXACT contract
 * (`engine/src/modules/assistants/tool-catalog.controller.ts`,
 * `tool-catalog.service.ts`):
 *
 * - GET tools/ → {tools} (enabled-only by default; rows carry name,
 *   version, effect_class, approval_requirement, hash — never sealed
 *   credentials);
 * - GET tools/templates → {templates: TOOL_TEMPLATES} (all roles but
 *   billing).
 *
 * Built-ins needing NO catalog row (publish pin check skips them):
 * web_search, request_human_handoff, generate_image, search_knowledge,
 * search_memory.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

const TOOLS_KEY = ['studio', 'setup', 'tools'] as const;

export const BUILT_IN_TOOLS = ['web_search', 'request_human_handoff', 'generate_image', 'search_knowledge', 'search_memory'] as const;

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export interface ToolCatalogEntry {
  id: string;
  name: string;
  version: string | null;
  description: string | null;
  effectClass: string | null;
  approvalRequirement: string | null;
  hash: string | null;
  enabled: boolean | null;
  /** P4 perimeter (C06 — list returns raw rows; absent → null, never invented).
   *  Sealed credentials are NEVER parsed (no field exists for them here). */
  executionEnvironment: string | null;
  allowedEgressDomains: string[] | null;
  /** Binding host derived client-side from httpBinding.url (null when none). */
  bindingHost: string | null;
  /** Raw schemas for the edit drawer (C06 library) — objects only, else null. */
  inputSchema: Record<string, unknown> | null;
  outputSchema: Record<string, unknown> | null;
  rateLimitPerRun: number | null;
}

function strList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const out = value.filter((d): d is string => typeof d === 'string');
  return out;
}

function bindingHostOf(value: unknown): string | null {
  if (typeof value !== 'object' || value === null) return null;
  const url = (value as Record<string, unknown>).url;
  if (typeof url !== 'string') return null;
  try {
    return new URL(url).hostname.toLowerCase() || null;
  } catch {
    return null;
  }
}

export function parseToolCatalog(raw: unknown): ToolCatalogEntry[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.tools) ? record.tools : [];
  return list
    .map((entry): ToolCatalogEntry | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const name = str(item.name);
      if (!name) {
        return null;
      }
      const env = str(item.executionEnvironment) ?? str(item.execution_environment);
      const egressRaw = item.allowedEgressDomains ?? item.allowed_egress_domains;
      const inputSchemaRaw = item.inputSchema ?? item.input_schema;
      const outputSchemaRaw = item.outputSchema ?? item.output_schema;
      const rateRaw = item.rateLimitPerRun ?? item.rate_limit_per_run;
      const asObject = (value: unknown): Record<string, unknown> | null =>
        typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
      return {
        id: str(item.id) ?? '',
        name,
        version: str(item.version),
        description: str(item.description),
        effectClass: str(item.effectClass) ?? str(item.effect_class),
        approvalRequirement: str(item.approvalRequirement) ?? str(item.approval_requirement),
        hash: str(item.hash),
        enabled: typeof item.enabled === 'boolean' ? item.enabled : null,
        executionEnvironment: env,
        allowedEgressDomains: strList(egressRaw),
        bindingHost: bindingHostOf(item.httpBinding ?? item.http_binding),
        inputSchema: asObject(inputSchemaRaw),
        outputSchema: asObject(outputSchemaRaw),
        rateLimitPerRun: typeof rateRaw === 'number' && Number.isFinite(rateRaw) ? rateRaw : null,
      };
    })
    .filter((t): t is ToolCatalogEntry => t !== null);
}

export function useToolCatalog(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...TOOLS_KEY, orgId, 'list'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/tools`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 30_000,
    select: parseToolCatalog,
  });
}

export interface ToolTemplate {
  id: string;
  name: string;
  description: string | null;
  effectClass: string | null;
  approvalRequirement: string | null;
}

export function parseToolTemplates(raw: unknown): ToolTemplate[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.templates) ? record.templates : [];
  return list
    .map((entry): ToolTemplate | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id);
      const name = str(item.name);
      if (!id || !name) {
        return null;
      }
      return {
        id,
        name,
        description: str(item.description),
        effectClass: str(item.effectClass) ?? str(item.effect_class),
        approvalRequirement: str(item.approvalRequirement) ?? str(item.approval_requirement),
      };
    })
    .filter((t): t is ToolTemplate => t !== null);
}

export function useToolTemplates(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...TOOLS_KEY, orgId, 'templates'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/tools/templates`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 300_000,
    select: parseToolTemplates,
  });
}

export const TOOL_EFFECT_CLASSES = ['READ_ONLY', 'MUTATING', 'DESTRUCTIVE'] as const;
export const TOOL_APPROVAL_REQUIREMENTS = ['NONE', 'REQUIRED'] as const;
/** Catalog tool names: `^[a-z][a-z0-9_]{1,63}$` (tool-catalog.service.ts:42). */
export const TOOL_NAME_PATTERN = /^[a-z][a-z0-9_]{1,63}$/;

function useInvalidateTools() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: [...TOOLS_KEY, orgId] });
}

export interface UpsertToolInput {
  name: string;
  effectClass: string;
  approvalRequirement: string;
  inputSchema: Record<string, unknown>;
  version?: string;
  description?: string;
  outputSchema?: Record<string, unknown>;
}

/** PUT tools/:name — path name authoritative (lowercased server-side); effect/approval/input_schema required. */
export function useUpsertTool() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateTools();
  return useMutation({
    mutationFn: async (input: UpsertToolInput) =>
      engine(`/console/org/${orgId}/tools/${input.name.toLowerCase()}`, {
        method: 'PUT',
        body: {
          effect_class: input.effectClass,
          approval_requirement: input.approvalRequirement,
          input_schema: input.inputSchema,
          ...(input.version ? { version: input.version } : {}),
          ...(input.description ? { description: input.description } : {}),
          ...(input.outputSchema ? { output_schema: input.outputSchema } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not save the tool'),
  });
}

/** POST tools/from-template — instantiate a prebuilt template (https URL + optional credential/rate limit). */
export function useToolFromTemplate() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateTools();
  return useMutation({
    mutationFn: async (input: { templateId: string; url: string; credential?: string; rateLimitPerRun?: number }) =>
      engine(`/console/org/${orgId}/tools/from-template`, {
        method: 'POST',
        body: {
          template_id: input.templateId,
          url: input.url,
          ...(input.credential ? { credential: input.credential } : {}),
          ...(typeof input.rateLimitPerRun === 'number' ? { rate_limit_per_run: input.rateLimitPerRun } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not instantiate the tool'),
  });
}

/** PATCH tools/:name/enabled (owner/admin) — publish pin checks read ENABLED rows only. */
export function useSetToolEnabled() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateTools();
  return useMutation({
    mutationFn: async (input: { name: string; enabled: boolean }) =>
      engine(`/console/org/${orgId}/tools/${input.name.toLowerCase()}/enabled`, {
        method: 'PATCH',
        body: { enabled: input.enabled },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not change the tool state'),
  });
}
