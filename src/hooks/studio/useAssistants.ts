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
  /** Derived lifecycle: disabled | live | new (identity rows carry no status column). */
  status: 'disabled' | 'live' | 'new';
  /** Publish pointer (null until first publish) — drives setup-funnel + fleet badges without N+1 version reads. */
  activeVersionId: string | null;
  model: string | null;
  updatedAt: string | null;
  /**
   * Lifecycle passthrough (same list response, no extra reads — powers the
   * Overview needs-attention queue with reasons). Null when the row lacks them.
   */
  degradedUntil: string | null;
  degradedReason: string | null;
  disabledReason: string | null;
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
    .map((entry): AssistantSummary | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.assistant_id) ?? str(item.agent_id);
      if (!id) {
        return null;
      }
      // Identity rows carry no status/model columns (definitions live on
      // versions): derive the lifecycle state honestly — disabled > live >
      // new. Model resolution per row is an N+1 the list endpoint does not
      // offer; the fleet view enriches this in the operate pass (F-E5).
      const disabledAt = str(item.disabledAt) ?? str(item.disabled_at);
      const activeVersionId = str(item.activeVersionId) ?? str(item.active_version_id);
      return {
        id,
        name: str(item.name) ?? str(item.display_name) ?? str(item.title) ?? 'Untitled agent',
        description: str(item.description) ?? str(item.summary),
        status: disabledAt ? 'disabled' : activeVersionId ? 'live' : 'new',
        activeVersionId,
        model: null,
        updatedAt: str(item.updatedAt) ?? str(item.updated_at),
        degradedUntil: str(item.degradedUntil) ?? str(item.degraded_until),
        degradedReason: str(item.degradedReason) ?? str(item.degraded_reason),
        disabledReason: str(item.disabledReason) ?? str(item.disabled_reason),
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

export const ASSISTANTS_PAGE_SIZE = 25;

export type AssistantPageSort = 'newest' | 'name';

export type AssistantPageCursor =
  | { before: string; beforeId: string }
  | { afterName: string; afterId: string };

export interface AssistantsPage {
  assistants: AssistantSummary[];
  nextCursor: AssistantPageCursor | null;
}

function parsePageCursor(raw: unknown): AssistantPageCursor | null {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const before = typeof record.before === 'string' ? record.before : undefined;
  const beforeId = typeof record.before_id === 'string' ? record.before_id : undefined;
  if (before !== undefined && beforeId !== undefined) return { before, beforeId };
  const afterName = typeof record.after_name === 'string' ? record.after_name : undefined;
  const afterId = typeof record.after_id === 'string' ? record.after_id : undefined;
  if (afterName !== undefined && afterId !== undefined) return { afterName, afterId };
  // Half or foreign cursors never silently restart the list — callers treat
  // null as "no further pages", and the engine 400s malformed cursors that
  // reach it. A cursor this function cannot read is a dead end, not page one.
  return null;
}

function parseAssistantsPage(raw: unknown): AssistantsPage {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return { assistants: parseAssistants(raw), nextCursor: parsePageCursor(record.next_cursor) };
}

/** Exported for unit tests (pure envelope parsing, no I/O). */
export { parseAssistantsPage };

/** Stable query-key fragment for a cursor (cursor identity is value-based). */
export function pageCursorKey(cursor: AssistantPageCursor | null | undefined): string {
  if (!cursor) return '';
  return 'before' in cursor ? `b:${cursor.before}:${cursor.beforeId}` : `a:${cursor.afterName}:${cursor.afterId}`;
}

export function useAssistantsPage(input: {
  sort?: AssistantPageSort;
  q?: string;
  cursor?: AssistantPageCursor | null;
  enabled?: boolean;
}) {
  const { orgId } = useOrg();
  const sort = input.sort ?? 'newest';
  const q = input.q && input.q.trim() !== '' ? input.q.trim() : undefined;
  const cursor = input.cursor ?? null;
  return useQuery({
    queryKey: ['studio', 'assistants', orgId, 'page', sort, q ?? '', pageCursorKey(cursor)],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/assistants`, {
        query: {
          limit: ASSISTANTS_PAGE_SIZE,
          sort,
          ...(q !== undefined ? { q } : {}),
          ...(cursor && 'before' in cursor ? { before: cursor.before, before_id: cursor.beforeId } : {}),
          ...(cursor && 'afterName' in cursor ? { after_name: cursor.afterName, after_id: cursor.afterId } : {}),
        },
      }),
    enabled: (input.enabled ?? true) && !!orgId,
    staleTime: 15_000,
    select: parseAssistantsPage,
  });
}
