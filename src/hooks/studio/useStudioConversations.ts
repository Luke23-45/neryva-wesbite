/**
 * Studio conversations — summary reads (ledger S-3/S-4).
 *
 * Listing uses the engine-native conversations module
 * (`GET /console/org/:orgId/conversations`) — recorded as the interim D-8
 * decision for *listing*; the chat-send path (streaming) is still governed
 * by D-8 and lands with Group C. Deep links carry `?chat=<id>`; the
 * conversations viewer (C-7) will honor the param.
 */
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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
        updatedAt: str(item.updated_at) ?? str(item.updatedAt) ?? str(item.last_message_at) ?? str(item.lastMessageAt) ?? str(item.created_at) ?? str(item.createdAt),
        status: str(item.status) ?? str(item.state),
        agentId: str(item.agent_id) ?? str(item.agentId) ?? str(item.assistant_id) ?? str(item.assistantId) ?? (agent ? str(agent.id) : null),
        agentName: (agent ? str(agent.name) : null) ?? str(item.agent_name) ?? str(item.agentName),
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

export function useConversations(options?: { enabled?: boolean; limit?: number }) {
  const { orgId } = useOrg();
  // OBS-1: the engine clamps limit to 1..100 and defaults to 50. Callers that
  // need more headroom than the default pass `limit` explicitly; the queryKey
  // carries it so different windows don't share a cache entry.
  const limit = options?.limit;
  return useQuery({
    queryKey: ['studio', 'conversations', orgId, limit ?? null],
    queryFn: () =>
      engine<unknown>(
        `/console/org/${orgId}/conversations${typeof limit === 'number' ? `?limit=${limit}` : ''}`,
      ),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 15_000,
    select: parseConversations,
  });
}

// ─── C1 — cursor-paginated list ("load more") ─────────────────────────────
// The engine pages newest-first (`?before=<ISO>&before_id=<uuid>`, limit
// clamped 1..100) and returns `next_cursor: null` when the page isn't full.
// The old silent 50-cap with no way to reach older threads is gone; the
// console walks the cursor and says so honestly in the UI.

export interface ConversationCursor {
  before: string;
  beforeId: string;
}

export interface ConversationsPage {
  items: ConversationSummary[];
  /** Cursor for the next page; null when the list is exhausted. */
  nextCursor: ConversationCursor | null;
}

const CONVERSATIONS_PAGE_LIMIT = 100;

export function parseConversationsPage(raw: unknown): ConversationsPage {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const items = parseConversations(raw);
  const nc =
    typeof record.next_cursor === 'object' && record.next_cursor !== null
      ? (record.next_cursor as Record<string, unknown>)
      : null;
  const before = nc ? str(nc.before) : null;
  const beforeId = nc ? (str(nc.before_id) ?? str(nc.beforeId)) : null;
  return {
    items,
    nextCursor: before && beforeId ? { before, beforeId } : null,
  };
}

export function useConversationsPaged(options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useInfiniteQuery({
    queryKey: ['studio', 'conversations-paged', orgId],
    queryFn: async ({ pageParam }: { pageParam: ConversationCursor | null }) => {
      const query: Record<string, string> = { limit: String(CONVERSATIONS_PAGE_LIMIT) };
      if (pageParam) {
        query.before = pageParam.before;
        query.before_id = pageParam.beforeId;
      }
      return parseConversationsPage(
        await engine<unknown>(`/console/org/${orgId}/conversations`, { query }),
      );
    },
    initialPageParam: null as ConversationCursor | null,
    // null/undefined from the parser means "no more pages" — react-query
    // only continues while this returns a defined cursor.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 15_000,
  });
}
