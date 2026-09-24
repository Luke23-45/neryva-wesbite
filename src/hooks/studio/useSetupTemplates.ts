/**
 * Assistant templates (team_setup_ledger.md F-B) over the EXACT contract
 * (`engine/src/modules/assistants/templates.controller.ts`,
 * `templates.service.ts:62-135`):
 *
 * - GET assistant-templates → {templates: TemplateListEntry[]} where each
 *   entry is {template (registry row), available (COMPATIBLE?), compatibility
 *   {status, reasons: [{code, detail}]}, installed, update_available
 *   major|minor|none}. Compatibility surfaces truth, never hiding —
 *   `required_tool_missing` rows block install at the engine TPL-2.2 gate;
 *   the other reason codes are advisory.
 * - GET assistant-templates/:slug?version= → single registry row
 *   {slug, version, status, family, definition (pure 8-key engine payload),
 *   bindings, eval_ref, release_policy, hash, min_engine_schema}.
 * - Install = POST assistants {template: {slug, version?}} (one-TX copy:
 *   assistant + DRAFT v0 + install row + provisioning outbox; NEVER
 *   publishes). See useCreateAssistant.
 *
 * Reason codes (exact): required_model_capability_missing |
 * required_tool_missing | knowledge_source_missing |
 * provider_credential_missing — each renders with its fix link.
 */
import { useQuery } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { useOrg } from '@/Context/OrgContext';

const TEMPLATES_KEY = ['studio', 'setup', 'templates'] as const;

/** Shared list family — install success invalidates it (installed flags). */
export const TEMPLATES_QUERY_KEY = TEMPLATES_KEY;

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export type CompatibilityReasonCode =
  | 'required_model_capability_missing'
  | 'required_tool_missing'
  | 'knowledge_source_missing'
  | 'provider_credential_missing';

export interface CompatibilityReason {
  code: string;
  detail: string;
}

export interface BindingTool {
  name: string;
  built_in?: boolean;
  effect_class?: string;
  approval_requirement?: string;
  when_to_use?: string;
}

export interface RegistryTemplate {
  slug: string;
  version: string;
  status: string;
  family: string;
  definition: Record<string, unknown>;
  bindings: {
    tools: { required: BindingTool[] };
    knowledge: { required: string[]; notes?: string };
    channels: { channels: string[]; caps?: Record<string, unknown> };
  };
  evalRef: {
    evaluators?: { evaluators: Array<{ name: string; version: string; kind: string; checks: string[] }>; attempts_per_case?: number; seed?: number };
    rubric_markdown?: string;
    cases?: Array<{ input: string; context_refs?: string[]; expected_behavior?: string; must_cite?: string[]; must_not?: string[]; tools_expected?: string[] }>;
  } | null;
  releasePolicy: {
    release_policy_version?: number;
    required?: Array<string | Record<string, unknown>>;
    thresholds?: Record<string, number>;
    critical_failures?: string[];
  } | null;
  hash: string | null;
  minEngineSchema: number | null;
}

export interface TemplateListEntry {
  template: RegistryTemplate;
  available: boolean;
  compatible: boolean;
  reasons: CompatibilityReason[];
  installed: boolean;
  updateAvailable: 'major' | 'minor' | 'none';
}

function parseRegistryTemplate(raw: unknown): RegistryTemplate | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const item = raw as Record<string, unknown>;
  const slug = str(item.slug);
  if (!slug) {
    return null;
  }
  const bindings = typeof item.bindings === 'object' && item.bindings !== null ? (item.bindings as Record<string, unknown>) : {};
  const tools = typeof bindings.tools === 'object' && bindings.tools !== null ? (bindings.tools as Record<string, unknown>) : {};
  const knowledge = typeof bindings.knowledge === 'object' && bindings.knowledge !== null ? (bindings.knowledge as Record<string, unknown>) : {};
  const channels = typeof bindings.channels === 'object' && bindings.channels !== null ? (bindings.channels as Record<string, unknown>) : {};
  const requiredTools: BindingTool[] = [];
  if (Array.isArray(tools.required)) {
    for (const candidate of tools.required) {
      if (typeof candidate !== 'object' || candidate === null) {
        continue;
      }
      const tool = candidate as Record<string, unknown>;
      const name = str(tool.name);
      if (!name) {
        continue;
      }
      requiredTools.push({
        name,
        ...(typeof tool.built_in === 'boolean' ? { built_in: tool.built_in } : {}),
        ...(str(tool.effect_class) ? { effect_class: str(tool.effect_class) as string } : {}),
        ...(str(tool.approval_requirement) ? { approval_requirement: str(tool.approval_requirement) as string } : {}),
        ...(str(tool.when_to_use) ? { when_to_use: str(tool.when_to_use) as string } : {}),
      });
    }
  }
  const evalRaw = item.evalRef ?? item.eval_ref;
  const policyRaw = item.releasePolicy ?? item.release_policy;
  const schemaRaw = item.minEngineSchema ?? item.min_engine_schema;
  return {
    slug,
    version: str(item.version) ?? '',
    status: str(item.status) ?? 'unknown',
    family: str(item.family) ?? 'general',
    definition: typeof item.definition === 'object' && item.definition !== null ? (item.definition as Record<string, unknown>) : {},
    bindings: {
      tools: { required: requiredTools },
      knowledge: {
        required: Array.isArray(knowledge.required) ? knowledge.required.filter((s): s is string => typeof s === 'string') : [],
        ...(str(knowledge.notes) ? { notes: str(knowledge.notes) as string } : {}),
      },
      channels: {
        channels: Array.isArray(channels.channels) ? channels.channels.filter((c): c is string => typeof c === 'string') : [],
        ...(typeof channels.caps === 'object' && channels.caps !== null ? { caps: channels.caps as Record<string, unknown> } : {}),
      },
    },
    // Live rows serialize camelCase, older fixtures snake_case — accept
    // both (C11 D2: the snake-only read nulled these on live responses).
    evalRef: typeof evalRaw === 'object' && evalRaw !== null ? (evalRaw as RegistryTemplate['evalRef']) : null,
    releasePolicy: typeof policyRaw === 'object' && policyRaw !== null ? (policyRaw as RegistryTemplate['releasePolicy']) : null,
    hash: str(item.hash),
    minEngineSchema: typeof schemaRaw === 'number' ? schemaRaw : null,
  };
}

export function parseTemplateList(raw: unknown): TemplateListEntry[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.templates) ? record.templates : [];
  return list
    .map((entry): TemplateListEntry | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const template = parseRegistryTemplate(item.template ?? item);
      if (!template) {
        return null;
      }
      const compatibility = typeof item.compatibility === 'object' && item.compatibility !== null ? (item.compatibility as Record<string, unknown>) : {};
      const reasons = Array.isArray(compatibility.reasons)
        ? compatibility.reasons
            .map((r) => {
              if (typeof r !== 'object' || r === null) {
                return null;
              }
              const reason = r as Record<string, unknown>;
              return { code: str(reason.code) ?? 'unknown', detail: str(reason.detail) ?? '' };
            })
            .filter((r): r is CompatibilityReason => r !== null)
        : [];
      const compatible = compatibility.status === 'COMPATIBLE';
      const update = str(item.update_available);
      return {
        template,
        available: typeof item.available === 'boolean' ? item.available : compatible,
        compatible,
        reasons,
        installed: item.installed === true,
        updateAvailable: update === 'major' || update === 'minor' ? update : 'none',
      };
    })
    .filter((t): t is TemplateListEntry => t !== null);
}

export function useAssistantTemplates(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...TEMPLATES_KEY, orgId, 'list'],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/assistant-templates`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 60_000,
    select: parseTemplateList,
  });
}

export function useAssistantTemplate(slug: string | null, version?: string) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...TEMPLATES_KEY, orgId, 'detail', slug, version ?? null],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/assistant-templates/${slug}`, {
        query: version ? { version } : {},
      }),
    enabled: !!orgId && !!slug,
    staleTime: 300_000,
    select: (raw: unknown) => {
      const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
      const inner = typeof record.template === 'object' && record.template !== null ? record.template : raw;
      return parseRegistryTemplate(inner);
    },
  });
}

/**
 * Fix per compatibility reason code (ledger F-B1 — each row links its fix).
 * Tool pins additionally resolve inside the install checklist (live catalog
 * state); unresolved pins block install at the engine TPL-2.2 gate, so the
 * checklist link is the path to unblocking.
 */
export function reasonFix(code: string): { label: string; to: string } | null {
  switch (code) {
    case 'required_model_capability_missing':
      return { label: 'Review models', to: '/agent-studio/models' };
    case 'required_tool_missing':
      return { label: 'Open tool catalog', to: '/agent-studio/tools' };
    case 'knowledge_source_missing':
      return { label: 'Map knowledge', to: '/agent-studio/knowledge' };
    case 'provider_credential_missing':
      return { label: 'Add credentials', to: '/agent-studio/models' };
    default:
      return null;
  }
}
