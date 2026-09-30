/**
 * useRunBudgetDiagnostics — read-only usage reporting for the Context
 * section's Token budget block.
 *
 * Chain: newest conversation for the assistant
 *   → `GET /console/org/:orgId/conversations?assistant_id=:assistantId&limit=1`
 *   → its latest run
 *   → `GET /console/org/:orgId/conversations/:conversationId/runs?limit=1`
 *   (engine orders runs newest-first)
 *   → the run's events
 *   → `GET /console/org/:orgId/runs/:runId/events?limit=100`
 *   → the newest ContextPrepared transition's `budgetDiagnostics` payload.
 *
 * Real wire shape (verified against the engine: MCP route stores
 * `eventType: String(EventType)` — the numeric enum as a string — and
 * `payload: { case, value }` where value is the proto-JSON LifecycleBody):
 *
 *   {
 *     "eventType": "1",            // RUN_LIFECYCLE
 *     "engineSequence": 3,
 *     "payload": {
 *       "case": "lifecycle",
 *       "value": {
 *         "fromState": "LOAD_CONTEXT",
 *         "toState": "CONTEXT_LOADED",
 *         "reason": "citations:3",
 *         "budgetDiagnostics": {
 *           "maxTokens": 32000, "reservedForOutput": 4096,
 *           "used": 12000, "remaining": 15904
 *         }
 *       }
 *     }
 *   }
 *
 * The domain kind "ContextPrepared" exists only producer-side; on the wire
 * it is the LOAD_CONTEXT → CONTEXT_LOADED lifecycle transition. Matching on
 * anything else (e.g. eventType === 'ContextPrepared') matches nothing.
 *
 * Everything here is defensive: the emission is new, so most runs predate
 * it; malformed payloads are ignored silently (render nothing, never a lie).
 * No writes, no dirty state — pure reporting.
 */
import { useQuery } from '@tanstack/react-query';
import { useOrg } from '@/Context/OrgContext';
import { engine } from '@lib/engine/client';
import { parseRuns } from './useChat';

export interface BudgetDiagnostics {
  maxTokens: number;
  reservedForOutput: number;
  used: number;
  remaining: number;
  wouldExceedBy?: number | undefined;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Validate a ContextPrepared budgetDiagnostics payload. Every required
 * field must be a finite number; wouldExceedBy is optional. Garbage →
 * null (the caller renders nothing).
 */
export function parseBudgetDiagnostics(raw: unknown): BudgetDiagnostics | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const maxTokens = finiteNumber(r.maxTokens);
  const reservedForOutput = finiteNumber(r.reservedForOutput);
  const used = finiteNumber(r.used);
  const remaining = finiteNumber(r.remaining);
  if (maxTokens === null || reservedForOutput === null || used === null || remaining === null) {
    return null;
  }
  const diagnostics: BudgetDiagnostics = { maxTokens, reservedForOutput, used, remaining };
  const wouldExceedBy = finiteNumber(r.wouldExceedBy);
  if (wouldExceedBy !== null) diagnostics.wouldExceedBy = wouldExceedBy;
  return diagnostics;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function eventKind(entry: unknown): string | null {
  const e = asRecord(entry);
  if (!e) return null;
  const kind = e.eventType ?? e.event_type;
  return typeof kind === 'string' ? kind : null;
}

/**
 * The wire eventType for a lifecycle transition, as stored by the engine's
 * MCP route (`String(EventType)` — the numeric enum as a string). The enum
 * name is accepted too, defensively, in case a future surface normalizes it.
 */
const LIFECYCLE_EVENT_TYPES = new Set(['1', 'RUN_LIFECYCLE']);

/**
 * Extract the ContextPrepared diagnostics from a stored run event, or null.
 * Matches the real wire shape: a RUN_LIFECYCLE event whose payload is the
 * lifecycle case carrying the LOAD_CONTEXT → CONTEXT_LOADED transition,
 * with budgetDiagnostics on the proto-JSON value. Any other lifecycle
 * transition (run_started, …) or any malformed shape → null.
 */
function contextPreparedDiagnostics(entry: unknown): BudgetDiagnostics | null {
  if (!LIFECYCLE_EVENT_TYPES.has(eventKind(entry) ?? '')) return null;
  const payload = asRecord(asRecord(entry)?.payload);
  if (payload?.case !== 'lifecycle') return null;
  const value = asRecord(payload.value);
  if (value?.fromState !== 'LOAD_CONTEXT' || value?.toState !== 'CONTEXT_LOADED') {
    return null;
  }
  return parseBudgetDiagnostics(value.budgetDiagnostics);
}

function eventSequence(entry: unknown): number {
  const e = asRecord(entry);
  if (!e) return -1;
  const seq = e.engineSequence ?? e.engine_sequence;
  return typeof seq === 'number' && Number.isFinite(seq) ? seq : -1;
}

function asEventList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const r = asRecord(raw);
  if (r) {
    if (Array.isArray(r.events)) return r.events;
    if (Array.isArray(r.items)) return r.items;
  }
  return [];
}

/**
 * The newest ContextPrepared transition's budgetDiagnostics, or null when no
 * event carries a valid one (runs predate the emission, or the payload is
 * garbage). Newest wins by engine_sequence; ties keep the later row.
 */
export function findLatestBudgetDiagnostics(eventsRaw: unknown): BudgetDiagnostics | null {
  let best: BudgetDiagnostics | null = null;
  let bestSeq = -1;
  for (const entry of asEventList(eventsRaw)) {
    const diagnostics = contextPreparedDiagnostics(entry);
    if (!diagnostics) continue;
    const seq = eventSequence(entry);
    if (seq >= bestSeq) {
      best = diagnostics;
      bestSeq = seq;
    }
  }
  return best;
}

function parseConversationIds(raw: unknown): string[] {
  const r = asRecord(raw);
  const list = r && Array.isArray(r.conversations) ? r.conversations : [];
  const ids: string[] = [];
  for (const entry of list) {
    const e = asRecord(entry);
    const id = e && (typeof e.id === 'string' ? e.id : null);
    if (id) ids.push(id);
  }
  return ids;
}

export interface LatestRunBudget {
  /**
   * True only when the assistant provably has no runs yet (the conversation
   * and run listings both succeeded empty) — the "No runs yet" empty
   * state. False on any error or while loading: unknown is not empty.
   */
  noRunsYet: boolean;
  /** Newest valid ContextPrepared diagnostics, or null (predates emission). */
  diagnostics: BudgetDiagnostics | null;
  isPending: boolean;
}

export function useLatestRunBudget(
  assistantId: string | null,
  options?: { enabled?: boolean },
): LatestRunBudget {
  const { orgId } = useOrg();
  const enabled = (options?.enabled ?? true) && !!orgId && !!assistantId;

  const conversations = useQuery({
    queryKey: ['studio', 'assistant-latest-conversation', orgId, assistantId],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/conversations?assistant_id=${assistantId}&limit=1`),
    enabled,
    staleTime: 30_000,
    select: parseConversationIds,
  });
  const conversationId = conversations.data?.[0] ?? null;

  const runs = useQuery({
    queryKey: ['studio', 'chat-runs', orgId, conversationId],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/conversations/${conversationId}/runs?limit=1`),
    enabled: enabled && !!conversationId && !conversations.isPending,
    staleTime: 30_000,
    select: parseRuns,
  });
  const runId = runs.data?.[0]?.id ?? null;

  const events = useQuery({
    queryKey: ['studio', 'run-budget-events', orgId, runId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/runs/${runId}/events?limit=100`),
    enabled: enabled && !!runId && !runs.isPending,
    staleTime: 30_000,
    select: findLatestBudgetDiagnostics,
  });

  const noRunsYet =
    enabled &&
    !conversations.isPending &&
    !conversations.isError &&
    (conversations.data?.length === 0 ||
      (!runs.isPending && !runs.isError && (runs.data?.length ?? 0) === 0));

  return {
    noRunsYet,
    diagnostics: events.data ?? null,
    isPending: conversations.isPending || runs.isPending || events.isPending,
  };
}
