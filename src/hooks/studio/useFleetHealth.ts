/**
 * Fleet knowledge health (SIDEBAR_LEDGER.md P2) — the single implementation of
 * the deliberate fleet-small N+1 (the list endpoint carries no health):
 * per-agent `knowledge-health` reads, 60s stale, identical query keys wherever
 * consumed (AgentsView list + Agents Overview share cache, never refetch).
 */
import { useQueries } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { useOrg } from '@/Context/OrgContext';
import { parseKnowledgeHealth } from './useAgentAuthoring';
import type { AssistantSummary } from './useAssistants';

export function useFleetKnowledgeHealth(assistants: AssistantSummary[] | undefined) {
  const { orgId } = useOrg();
  const list = assistants ?? [];
  const healthQueries = useQueries({
    queries: list.map((assistant) => ({
      queryKey: ['studio', 'assistants', orgId, 'knowledge-health', assistant.id],
      queryFn: () =>
        engine<unknown>(`/console/org/${orgId}/assistants/${assistant.id}/knowledge-health`),
      enabled: !!orgId,
      staleTime: 60_000,
      select: parseKnowledgeHealth,
    })),
  });
  return new Map(
    list.map((assistant, index) => [assistant.id, healthQueries[index]?.data?.degraded === true]),
  );
}
