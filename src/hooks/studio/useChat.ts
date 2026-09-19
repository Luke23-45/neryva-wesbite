/**
 * The chat session (ledger C-1/C-2/C-5, decision D-8: engine-native) —
 * conversations and runs live in the engine's conversations module, run
 * events stream over the engine SSE endpoint, and the console renders.
 *
 * The orchestration contract:
 *  - create conversation (binding an agent when the chat was opened with
 *    `?agent=<id>`),  - POST the user turn (starts a run),  - stream the
 *    run's events (assistant chunks, tool calls, usage, lifecycle),
 *  - cancel a running turn,  - the transcript refetches from the engine
 *    after each terminal event so the server stays the record.
 *
 * Payloads are parsed defensively — the event taxonomy follows the Neryva
 * MCP run-event contract, and anything unrecognized renders as a raw
 * lifecycle row rather than being dropped.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';
import { markActivation } from '@lib/engine/activation';
import { useEventStream } from '@hooks/engine/useEventStream';
import type { SseMessage } from '@lib/engine/sse';
import { useTestRun } from './useAgentAuthoring';
import {
  TRY_COPY,
  describeTryStop,
  validateTryPrompt,
  type TryStop,
} from '../../sections/pages/products/agent-studio/builder/lib/try-model';

// ─── Parsing ─────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'agent';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string | null;
}

export interface RunSummary {
  id: string;
  status: string | null;
  startedAt: string | null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function textFromContent(content: unknown): string | null {
  if (typeof content === 'string' && content.trim() !== '') {
    return content;
  }
  if (Array.isArray(content)) {
    const parts = content
      .map((part) => (typeof part === 'object' && part !== null ? str((part as Record<string, unknown>).text) : typeof part === 'string' ? part : null))
      .filter((t): t is string => t !== null);
    return parts.length > 0 ? parts.join('') : null;
  }
  if (typeof content === 'object' && content !== null) {
    return str((content as Record<string, unknown>).text);
  }
  return null;
}

export function parseConversationMessages(raw: unknown): ChatMessage[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : [record.messages, record.items].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.message_id);
      if (!id) {
        return null;
      }
      const roleRaw = (str(item.role) ?? str(item.sender) ?? str(item.author) ?? 'agent').toLowerCase();
      const role: ChatRole = roleRaw.includes('user') || roleRaw.includes('human') ? 'user' : 'agent';
      const text = str(item.text) ?? textFromContent(item.content) ?? str(item.body) ?? '';
      return { id, role, text, createdAt: str(item.created_at) } satisfies ChatMessage;
    })
    .filter((m): m is ChatMessage => m !== null);
}

export function parseRuns(raw: unknown): RunSummary[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : [record.runs, record.items].find(Array.isArray) ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id) ?? str(item.run_id);
      if (!id) {
        return null;
      }
      return { id, status: str(item.status) ?? str(item.state), startedAt: str(item.started_at) ?? str(item.created_at) } satisfies RunSummary;
    })
    .filter((r): r is RunSummary => r !== null);
}

export interface ParsedRunEvent {
  kind: 'chunk' | 'tool' | 'usage' | 'lifecycle' | 'other';
  text: string | null;
  tool: string | null;
  usage: string | null;
  state: string | null;
  /** Reported stop reason (`reason`/`terminal_reason`) — C13 stop lines. */
  reason: string | null;
  terminal: boolean;
  failed: boolean;
}

const TERMINAL_STATES = ['completed', 'succeeded', 'failed', 'cancelled', 'canceled', 'expired'];

/** Run-event wire format follows the Neryva MCP taxonomy; parse defensively. */
export function parseRunEvent(message: SseMessage): ParsedRunEvent {
  let payload: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(message.data);
    payload = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : { text: message.data };
  } catch {
    payload = { text: message.data };
  }

  const eventType = str(payload.type) ?? str(payload.event_type) ?? str(payload.event) ?? message.event ?? '';
  const body = typeof payload.payload === 'object' && payload.payload !== null ? (payload.payload as Record<string, unknown>) : payload;
  const delta = typeof body.delta === 'object' && body.delta !== null ? (body.delta as Record<string, unknown>) : {};

  const text =
    str(body.text) ??
    str(body.delta) ??
    str(delta.text) ??
    textFromContent(body.content) ??
    textFromContent(payload.content) ??
    null;
  const tool = str(body.tool) ?? str(body.tool_name) ?? str(body.tool_id);
  const usage = typeof body.usage === 'object' && body.usage !== null
    ? Object.entries(body.usage as Record<string, unknown>)
        .filter(([, v]) => typeof v === 'number')
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`)
        .join(' · ') || null
    : null;
  const state = str(body.state) ?? str(body.status) ?? str(payload.state) ?? str(payload.status);
  const reason = str(body.reason) ?? str(body.terminal_reason) ?? str(body.terminalReason) ?? str(payload.reason);

  const lower = eventType.toLowerCase();
  if (lower.includes('tool')) {
    return { kind: 'tool', text, tool, usage, state, reason, terminal: false, failed: lower.includes('fail') };
  }
  if (lower.includes('usage') || usage !== null) {
    return { kind: 'usage', text, tool, usage, state, reason, terminal: false, failed: false };
  }
  if (TERMINAL_STATES.some((t) => lower.includes(t) || state?.toLowerCase().includes(t))) {
    return { kind: 'lifecycle', text, tool, usage, state: state ?? eventType, reason, terminal: true, failed: lower.includes('fail') || state?.toLowerCase().includes('fail') === true };
  }
  if (text !== null && (lower.includes('chunk') || lower.includes('message') || lower.includes('assistant') || message.event === null)) {
    return { kind: 'chunk', text, tool, usage, state, reason, terminal: false, failed: false };
  }
  return { kind: 'lifecycle', text, tool, usage, state: state ?? (eventType || null), reason, terminal: false, failed: false };
}

// ─── Queries & mutations ─────────────────────────────────────────────

export function useConversationMessages(conversationId: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['studio', 'chat-messages', orgId, conversationId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/conversations/${conversationId}/messages`),
    enabled: (options?.enabled ?? true) && !!orgId && !!conversationId,
    staleTime: 15_000,
    select: parseConversationMessages,
  });
}

export function useConversationRuns(conversationId: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['studio', 'chat-runs', orgId, conversationId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/conversations/${conversationId}/runs`),
    enabled: (options?.enabled ?? true) && !!orgId && !!conversationId,
    staleTime: 15_000,
    select: parseRuns,
  });
}

export function useConversationStatus(conversationId: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['studio', 'chat-conversation', orgId, conversationId],
    queryFn: () => engine<unknown>(`/console/org/${orgId}/conversations/${conversationId}`),
    enabled: (options?.enabled ?? true) && !!orgId && !!conversationId,
    staleTime: 30_000,
  });
}

export function useCreateConversation() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { agentId?: string | null; title?: string }) =>
      engine<unknown>(`/console/org/${orgId}/conversations`, {
        method: 'POST',
        body: {
          ...(input.agentId ? { agent_id: input.agentId } : {}),
          ...(input.title ? { title: input.title } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['studio', 'conversations'] }),
    onError: (error) => toastEngineError(error, 'Could not start the conversation'),
  });
}

export function useSendChatMessage(conversationId: string | null) {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (input: { text: string; attachmentIds?: string[] }) =>
      engine<unknown>(`/console/org/${orgId}/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: {
          text: input.text,
          ...(input.attachmentIds?.length ? { attachment_ids: input.attachmentIds } : {}),
        },
      }),
    onError: (error) => toastEngineError(error, 'Could not send the message'),
  });
}

export function useCancelRun() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (runId: string) =>
      engine(`/console/org/${orgId}/runs/${runId}/cancel`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['studio', 'chat-runs'] });
      void queryClient.invalidateQueries({ queryKey: ['studio', 'chat-messages'] });
    },
    onError: (error) => toastEngineError(error, 'Could not cancel the run'),
  });
}

export function useUpdateConversationStatus() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { conversationId: string; status: string }) =>
      engine(`/console/org/${orgId}/conversations/${input.conversationId}/status`, {
        method: 'POST',
        body: { status: input.status },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['studio', 'conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['studio', 'chat-conversation'] });
    },
    onError: (error) => toastEngineError(error, 'Could not update the conversation'),
  });
}

// ─── The session orchestrator ────────────────────────────────────────

export type RunPhase = 'idle' | 'creating' | 'sending' | 'streaming' | 'accepted' | 'done' | 'error';

export interface RunNotice {
  id: string;
  kind: 'tool' | 'usage' | 'status' | 'error';
  text: string;
}

/**
 * Drives one conversation: server transcript + live streaming overlay,
 * run discovery from the send response, SSE tail, cancel, and the
 * "accepted but no runtime answered" honest state.
 */
export function useChatSession(conversationId: string | null, agentId: string | null) {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const create = useCreateConversation();
  const sendMessage = useSendChatMessage(conversationId);
  const cancel = useCancelRun();

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [live, setLive] = useState<{ user: ChatMessage | null; assistantText: string }>({ user: null, assistantText: '' });
  const [notices, setNotices] = useState<RunNotice[]>([]);

  const stream = useEventStream({
    path: `/console/org/${orgId}/runs/${activeRunId ?? '_'}/events/stream`,
    enabled: !!orgId && !!activeRunId,
    onEvent: (message) => {
      const event = parseRunEvent(message);
      if (event.kind === 'chunk' && event.text) {
        setLive((prev) => ({ ...prev, assistantText: prev.assistantText + event.text }));
      } else if (event.kind === 'tool') {
        setNotices((prev) => [
          ...prev,
          { id: message.id ?? String(Date.now()) + Math.random(), kind: event.failed ? 'error' : 'tool', text: event.tool ? `Tool call · ${event.tool}` : 'Tool call' },
        ]);
      } else if (event.kind === 'usage' && event.usage) {
        setNotices((prev) => [...prev, { id: message.id ?? String(Date.now()) + Math.random(), kind: 'usage', text: event.usage as string }]);
      } else if (event.terminal) {
        finalize(event.state ?? 'completed', event.failed);
      }
    },
  });

  const finalize = (state: string, failed: boolean) => {
    const runId = activeRunId;
    setActiveRunId(null);
    setPhase(failed ? 'error' : 'done');
    if (failed) {
      setNotices((prev) => [...prev, { id: `err-${Date.now()}`, kind: 'error', text: `The run ended with state "${state}".` }]);
    } else {
      // First-run ledger F3-1: a successful run in the org IS the activation
      // event (production or test-run — both complete here). Case-insensitive:
      // the parser preserves the server's case (COMPLETED) while terminal
      // detection lowercases. Mark in-session once per org per tab and refresh
      // server truth; the server's earliest-COMPLETED query stays the record
      // (never these marks).
      const lowerState = state.toLowerCase();
      const succeeded = lowerState === 'completed' || lowerState === 'succeeded';
      if (succeeded && runId && markActivation(orgId, runId)) {
        void queryClient.invalidateQueries({ queryKey: ['studio', 'onboarding'] });
      }
    }
    void queryClient.invalidateQueries({ queryKey: ['studio', 'chat-messages', orgId, conversationId] });
    void queryClient.invalidateQueries({ queryKey: ['studio', 'chat-runs', orgId, conversationId] });
  };

  const send = async (text: string, attachmentIds?: string[]) => {
    if (phase === 'streaming' || phase === 'sending' || phase === 'creating') {
      return;
    }
    setLive({ user: { id: `live-${Date.now()}`, role: 'user', text, createdAt: null }, assistantText: '' });
    setNotices([]);
    let id = conversationId;

    try {
      if (!id) {
        setPhase('creating');
        const created = await create.mutateAsync({ agentId });
        const record = typeof created === 'object' && created !== null ? (created as Record<string, unknown>) : {};
        id = str(record.id) ?? str(record.conversation_id);
        if (!id) {
          setPhase('error');
          setNotices([{ id: `e-${Date.now()}`, kind: 'error', text: 'The conversation was created but no id came back — try again.' }]);
          return;
        }
        if (conversationId === null) {
          // Hand the new thread id to the URL so refresh/recent-chats bind.
          window.history.replaceState(null, '', `/agent-studio/chat?chat=${encodeURIComponent(id)}`);
        }
      }

      setPhase('sending');
      const response = await sendMessage.mutateAsync({ text, attachmentIds });
      const record = typeof response === 'object' && response !== null ? (response as Record<string, unknown>) : {};
      const runRecord = typeof record.run === 'object' && record.run !== null ? (record.run as Record<string, unknown>) : record;
      const runId = str(runRecord.run_id) ?? str(runRecord.runId) ?? str(runRecord.id);

      if (runId) {
        setActiveRunId(runId);
        setPhase('streaming');
        // If the SSE tail produces nothing (no satellite attached), the
        // accepted state surfaces honestly instead of faking a reply.
        window.setTimeout(() => {
          setPhase((current) => (current === 'streaming' ? 'accepted' : current));
        }, 15_000);
      } else {
        // Synchronous transcript update — refetch and clear the overlay.
        await queryClient.invalidateQueries({ queryKey: ['studio', 'chat-messages', orgId, id] });
        setPhase('done');
      }
    } catch {
      setPhase('error');
    }
  };

  const stop = () => {
    if (activeRunId) {
      cancel.mutate(activeRunId);
    }
  };

  const reset = () => {
    setActiveRunId(null);
    setPhase('idle');
    setLive({ user: null, assistantText: '' });
    setNotices([]);
  };

  const isBusy = phase === 'creating' || phase === 'sending' || phase === 'streaming';

  return useMemo(
    () => ({ live, notices, phase, isBusy, send, stop, reset, activeRunId, streamStatus: stream }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, notices, phase, activeRunId, stream, conversationId, agentId, orgId],
  );
}

// ─── Try session (C13) ─────────────────────────────────────────────

/**
 * One Try session: every send is a fresh `POST test-runs` (a new
 * draft-pinned conversation), because follow-up posts and regenerate
 * resolve through the published pointer (`pickVersionPin`) and would
 * silently leave the draft pin (`conversations.service.ts:377-394`,
 * `regenerateMessage:926-934`). Re-ask re-posts the same prompt text —
 * an honest re-run, never the engine regenerate path.
 *
 * Transport reuses `useEventStream` + the full `parseRunEvent` taxonomy
 * (chunk → live overlay; tool/usage → notices; terminal → finalize);
 * the transcript stays the record and per-turn texts settle from it.
 */

export type TryTurnStatus = 'sending' | 'streaming' | 'accepted' | 'done' | 'error';

export interface TryTurn {
  key: string;
  prompt: string;
  conversationId: string | null;
  runId: string | null;
  liveText: string;
  /** Authoritative agent text, settled from the transcript on finalize. */
  agentText: string;
  notices: RunNotice[];
  status: TryTurnStatus;
  stop: TryStop | null;
  /** Raw non-chunk event payloads (capped) — the trace renders only these. */
  rawEvents: string[];
  /** Seeded from `?try=` — prompt/texts fill from the server transcript. */
  restored: boolean;
}

const TRY_POLL_MS = 3000;
const TRY_POLL_ROUNDS = 30;

let tryTurnCounter = 0;

function nextTryKey(): string {
  tryTurnCounter += 1;
  return `try-${Date.now()}-${tryTurnCounter}`;
}

export function useTrySession(assistantId: string | null, versionId: string | null, restoredConversationId: string | null) {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const testRun = useTestRun(assistantId);
  const cancel = useCancelRun();

  const [turns, setTurns] = useState<TryTurn[]>(() =>
    restoredConversationId
      ? [
          {
            key: `restored-${restoredConversationId}`,
            prompt: '',
            conversationId: restoredConversationId,
            runId: null,
            liveText: '',
            agentText: '',
            notices: [{ id: `restore-${restoredConversationId}`, kind: 'status', text: TRY_COPY.reloadRestored }],
            status: 'done',
            stop: null,
            rawEvents: [],
            restored: true,
          },
        ]
      : [],
  );
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [pollLeft, setPollLeft] = useState(0);
  const pollTimer = useRef<number | null>(null);
  const acceptedTimer = useRef<number | null>(null);
  // Latest-ref so the parked SSE callback never closes over stale turns.
  const turnsRef = useRef(turns);
  useEffect(() => {
    turnsRef.current = turns;
  });

  const activeTurn = turns.find((t) => t.key === activeKey) ?? null;
  const activeConversationId = activeTurn?.conversationId ?? (turns.length > 0 ? turns[turns.length - 1].conversationId : null);
  const activeRunId = activeTurn?.runId ?? null;

  const messages = useConversationMessages(activeConversationId, { enabled: activeConversationId !== null });

  const patchTurn = (key: string, patch: Partial<TryTurn>) => {
    setTurns((prev) => prev.map((t) => (t.key === key ? { ...t, ...patch } : t)));
  };

  const pushNotice = (key: string, notice: RunNotice) => {
    setTurns((prev) => prev.map((t) => (t.key === key ? { ...t, notices: [...t.notices, notice] } : t)));
  };

  const clearTimers = () => {
    if (pollTimer.current !== null) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    if (acceptedTimer.current !== null) {
      window.clearTimeout(acceptedTimer.current);
      acceptedTimer.current = null;
    }
  };

  useEffect(() => clearTimers, []);

  const finalizeTurn = (key: string, outcome: { failed: boolean; state: string | null; reason: string | null }) => {
    const turn = turnsRef.current.find((t) => t.key === key);
    if (!turn || turn.status === 'done' || turn.status === 'error') {
      return;
    }
    setActiveKey((current) => (current === key ? null : current));
    setPollLeft(0);
    if (acceptedTimer.current !== null) {
      window.clearTimeout(acceptedTimer.current);
      acceptedTimer.current = null;
    }
    const stop = describeTryStop({ state: outcome.state, reason: outcome.reason });
    if (outcome.failed && stop.kind !== 'none') {
      pushNotice(key, { id: `stop-${key}`, kind: 'error', text: `${stop.headline} ${stop.detail}` });
    } else if (outcome.failed) {
      pushNotice(key, { id: `stop-${key}`, kind: 'error', text: `The run ended with state "${outcome.state ?? 'failed'}".` });
    }
    patchTurn(key, { status: outcome.failed ? 'error' : 'done', stop: outcome.failed ? stop : null });
    if (turn.conversationId) {
      const conversationId = turn.conversationId;
      void queryClient.invalidateQueries({ queryKey: ['studio', 'chat-messages', orgId, conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['studio', 'chat-runs', orgId, conversationId] });
      // Settle the authoritative text from the transcript with the SAME
      // parser the query uses — never a parallel derivation.
      void queryClient
        .refetchQueries({ queryKey: ['studio', 'chat-messages', orgId, conversationId] })
        .then(() => {
          const raw = queryClient.getQueryData(['studio', 'chat-messages', orgId, conversationId]);
          const parsed = parseConversationMessages(raw);
          const agentText = parsed.filter((m) => m.role === 'agent' && m.text.trim() !== '').map((m) => m.text).join('\n\n');
          const userText = parsed.find((m) => m.role === 'user' && m.text.trim() !== '')?.text ?? '';
          patchTurn(key, {
            agentText: agentText !== '' ? agentText : turn.liveText,
            ...(userText !== '' ? { prompt: turn.prompt !== '' ? turn.prompt : userText } : {}),
          });
        });
    } else {
      patchTurn(key, { agentText: turn.liveText });
    }
  };

  const stream = useEventStream({
    path: `/console/org/${orgId}/runs/${activeRunId ?? '_'}/events/stream`,
    enabled: !!orgId && activeRunId !== null,
    onEvent: (message) => {
      const key = activeKey;
      if (!key) return;
      const event = parseRunEvent(message);
      // Retain raw non-chunk payloads (capped) — the trace drawer renders
      // only what arrived, never synthesized rows.
      if (event.kind !== 'chunk') {
        const raw = message.data;
        setTurns((prev) =>
          prev.map((t) => (t.key === key ? { ...t, rawEvents: [...t.rawEvents.slice(-49), raw] } : t)),
        );
      }
      if (event.kind === 'chunk' && event.text) {
        const text = event.text;
        setTurns((prev) => prev.map((t) => (t.key === key ? { ...t, liveText: t.liveText + text } : t)));
      } else if (event.kind === 'tool') {
        pushNotice(key, {
          id: message.id ?? `tool-${key}-${Date.now()}`,
          kind: event.failed ? 'error' : 'tool',
          text: event.tool ? `Tool call · ${event.tool}` : 'Tool call',
        });
      } else if (event.kind === 'usage' && event.usage) {
        pushNotice(key, { id: message.id ?? `usage-${key}-${Date.now()}`, kind: 'usage', text: event.usage });
      } else if (event.terminal) {
        finalizeTurn(key, { failed: event.failed, state: event.state, reason: event.reason });
      }
    },
  });

  // Durable backstop: poll the transcript until the assistant replies. The
  // tick reads the CURRENT conversation through the client + turnsRef —
  // never the closed-over query object (the conversation id lands async
  // after the POST resolves).
  useEffect(() => {
    if (pollTimer.current !== null) {
      window.clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
    if (!activeKey || pollLeft <= 0) {
      return;
    }
    const key = activeKey;
    pollTimer.current = window.setInterval(() => {
      setPollLeft((left) => {
        if (left <= 1) {
          if (pollTimer.current !== null) {
            window.clearInterval(pollTimer.current);
            pollTimer.current = null;
          }
          return 0;
        }
        const conversationId = turnsRef.current.find((t) => t.key === key)?.conversationId ?? null;
        if (!conversationId) {
          return left - 1;
        }
        void queryClient
          .refetchQueries({ queryKey: ['studio', 'chat-messages', orgId, conversationId] })
          .then(() => {
            const raw = queryClient.getQueryData(['studio', 'chat-messages', orgId, conversationId]);
            if (parseConversationMessages(raw).some((m) => m.role === 'agent' && m.text.trim() !== '')) {
              finalizeTurn(key, { failed: false, state: 'completed', reason: null });
            }
          });
        return left - 1;
      });
    }, TRY_POLL_MS);
    return () => {
      if (pollTimer.current !== null) {
        window.clearInterval(pollTimer.current);
        pollTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, pollLeft, orgId, queryClient]);

  // A restored thread fills its texts from the server transcript once it loads.
  const restoredKey = turns.find((t) => t.restored && t.prompt === '')?.key ?? null;
  const restoredMessages = (messages.data ?? []).filter((m) => m.text.trim() !== '');
  useEffect(() => {
    if (!restoredKey || restoredMessages.length === 0) {
      return;
    }
    const userText = restoredMessages.find((m) => m.role === 'user')?.text ?? '';
    const agentText = restoredMessages
      .filter((m) => m.role === 'agent')
      .map((m) => m.text)
      .join('\n\n');
    patchTurn(restoredKey, { prompt: userText, agentText });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoredKey, messages.dataUpdatedAt]);

  const send = (text: string): boolean => {
    const validation = validateTryPrompt(text);
    if (!validation.ok) {
      toast.error(validation.error);
      return false;
    }
    if (!versionId) {
      toast.error(TRY_COPY.noRunnableVersion);
      return false;
    }
    if (activeKey !== null) {
      toast.error(TRY_COPY.activeRunConflict);
      return false;
    }
    const prompt = text.trim();
    const key = nextTryKey();
    setTurns((prev) => [
      ...prev,
      { key, prompt, conversationId: null, runId: null, liveText: '', agentText: '', notices: [], status: 'sending', stop: null, rawEvents: [], restored: false },
    ]);
    setActiveKey(key);
    void testRun
      .mutateAsync({ versionId, text: prompt })
      .then((result) => {
        if (!result.conversation_id) {
          patchTurn(key, { status: 'error' });
          pushNotice(key, { id: `noconv-${key}`, kind: 'error', text: 'The test run returned no conversation — try again.' });
          setActiveKey((current) => (current === key ? null : current));
          return;
        }
        patchTurn(key, { conversationId: result.conversation_id, runId: result.run_id ?? null, status: 'streaming' });
        setPollLeft(TRY_POLL_ROUNDS);
        // If the SSE tail produces nothing, the accepted state surfaces
        // honestly instead of faking a reply (useChatSession precedent).
        acceptedTimer.current = window.setTimeout(() => {
          setTurns((prev) => (prev.find((t) => t.key === key)?.status === 'streaming' ? prev.map((t) => (t.key === key ? { ...t, status: 'accepted' } : t)) : prev));
        }, 15_000);
      })
      .catch(() => {
        patchTurn(key, { status: 'error' });
        setActiveKey((current) => (current === key ? null : current));
      });
    return true;
  };

  const reask = (key: string): boolean => {
    const turn = turnsRef.current.find((t) => t.key === key);
    if (!turn || turn.prompt === '') {
      return false;
    }
    return send(turn.prompt);
  };

  const stop = () => {
    const turn = turnsRef.current.find((t) => t.key === activeKey);
    if (!turn) {
      return;
    }
    if (turn.runId) {
      cancel.mutate(turn.runId);
    }
    pushNotice(turn.key, { id: `stopreq-${turn.key}`, kind: 'status', text: 'Stopped — the partial reply above is all that streamed.' });
    finalizeTurn(turn.key, { failed: false, state: 'cancelled', reason: null });
  };

  const clearSession = () => {
    clearTimers();
    setActiveKey(null);
    setPollLeft(0);
    setTurns([]);
  };

  const isBusy = activeKey !== null;

  return useMemo(
    () => ({ turns, activeKey, isBusy, send, stop, reask, clearSession, messages, streamStatus: stream }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [turns, activeKey, messages.data, messages.isPending, stream],
  );
}
