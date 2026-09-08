/**
 * Studio assistants — summary reads for search/navigation (palette S-3,
 * later A-1). The full authoring API lands with Group A; this hook only
 * lists.
 */
import { useQuery } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { useOrg } from '@/Context/OrgContext';

export interface AssistantSummary {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  model: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function parseAssistants(raw: unknown): AssistantSummary[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw)
    ? raw
    : [record.assistants, record.agents, record.items].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.assistant_id) ?? str(item.agent_id);
      if (!id) {
        return null;
      }
      const policy = typeof item.model_policy === 'object' && item.model_policy !== null
        ? (item.model_policy as Record<string, unknown>)
        : null;
      const allowed = policy && Array.isArray(policy.allowed_models)
        ? policy.allowed_models.filter((m): m is string => typeof m === 'string')
        : [];
      return {
        id,
        name: str(item.name) ?? str(item.display_name) ?? str(item.title) ?? 'Untitled agent',
        description: str(item.description) ?? str(item.summary),
        status: str(item.status) ?? str(item.state),
        model: str(item.model) ?? (allowed.length > 0 ? allowed[0] : null),
      } satisfies AssistantSummary;
    })
    .filter((a): a is AssistantSummary => a !== null);
}

export function useAssistants(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['studio', 'assistants', orgId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/assistants`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 15_000,
    select: parseAssistants,
  });
}
