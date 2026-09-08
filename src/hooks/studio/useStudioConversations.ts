/**
 * Studio conversations — summary reads (ledger S-3/S-4).
 *
 * Listing uses the engine-native conversations module
 * (`GET /console/org/:orgId/conversations`) — recorded as the interim D-8
 * decision for *listing*; the chat-send path (streaming) is still governed
 * by D-8 and lands with Group C. Deep links carry `?chat=<id>`; the
 * conversations viewer (C-7) will honor the param.
 */
import { useQuery } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { useOrg } from '@/Context/OrgContext';

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string | null;
  status: string | null;
  agentId: string | null;
  agentName: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function parseConversations(raw: unknown): ConversationSummary[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw)
    ? raw
    : [record.conversations, record.items, record.threads].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  const parsed = list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.conversation_id) ?? str(item.thread_id);
      if (!id) {
        return null;
      }
      const agent = typeof item.agent === 'object' && item.agent !== null ? (item.agent as Record<string, unknown>) : null;
      return {
        id,
        title: str(item.title) ?? str(item.name) ?? str(item.summary) ?? 'Untitled conversation',
        updatedAt: str(item.updated_at) ?? str(item.last_message_at) ?? str(item.created_at),
        status: str(item.status) ?? str(item.state),
        agentId: str(item.agent_id) ?? str(item.assistant_id) ?? (agent ? str(agent.id) : null),
        agentName: (agent ? str(agent.name) : null) ?? str(item.agent_name),
      } satisfies ConversationSummary;
    })
    .filter((c): c is ConversationSummary => c !== null);

  return parsed.sort((a, b) => {
    const at = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const bt = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    if (Number.isNaN(at) || Number.isNaN(bt)) {
      return 0;
    }
    return bt - at;
  });
}

export function useConversations(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['studio', 'conversations', orgId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/conversations`),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 15_000,
    select: parseConversations,
  });
}
