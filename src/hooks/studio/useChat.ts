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
  /** A3-21 — the tool-call's arguments, when the wire carries them. */
  toolArgs: unknown;
  /** A3-21 — correlates a toolResult with its toolCall. */
  toolCallId: string | null;
  usage: string | null;
  /** A3-20 — the approval reference from an approval SSE frame. */
  approvalId: string | null;
  state: string | null;
  /** Reported stop reason (`reason`/`terminal_reason`) — C13 stop lines. */
  reason: string | null;
  terminal: boolean;
  failed: boolean;
}

const TERMINAL_STATES = ['completed', 'succeeded', 'failed', 'cancelled', 'canceled', 'expired'];

/** Run states that are done — anything else is still live and re-attachable. */
const TERMINAL_RUN_STATES = new Set(TERMINAL_STATES);

/**
 * Parse one engine SSE run-event frame.
 *
 * Actual wire protocol (conversations.service.ts SSE serialization):
 *  - the SSE `event:` line carries a semantic name (`delta`, `lifecycle`,
 *    `tool-call`, `tool-result`, `usage`, `approval`, `terminal`,
 *    `run.completed`, `run.failed`, `error`, …),
 *  - the `data:` payload is the `{case, value}` run-event envelope
 *    (event-mapper.ts), except the dotted terminal frames which are
 *    `{"message_id": "...", "terminal_reason": "..."}`.
 *
 * There is no `type` / `event_type` / nested `event` discriminator on the
 * wire — the parser keys off `message.event` + `payload.case`.
 */
export function parseRunEvent(message: SseMessage): ParsedRunEvent {
  let payload: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(message.data);
    payload = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : { text: message.data };
  } catch {
    payload = { text: message.data };
  }

  const eventName = (message.event ?? '').toLowerCase();
  const envelope = str(payload.case);
  const value =
    typeof payload.value === 'object' && payload.value !== null
      ? (payload.value as Record<string, unknown>)
      : {};

  const base: ParsedRunEvent = {
    kind: 'other',
    text: null,
    tool: null,
    toolArgs: null,
    toolCallId: null,
    usage: null,
    approvalId: null,
    state: null,
    reason: null,
    terminal: false,
    failed: false,
  };

  // Dotted terminal frames: event `run.completed` / `run.failed`.
  // run.failed carries the failRun envelope {"case":"terminal","value":
  // {"code":"…","message":"…"}} — the classified cause (e.g.
  // TOOL_POLICY_DENIED / "tool policy denied: create_ticket") — while
  // run.completed carries {"message_id": "…", "terminal_reason": "…"}.
  if (eventName.startsWith('run.')) {
    // `value` is the decoded envelope `value` object above ({} when the
    // payload is the dotted terminal_reason shape).
    const terminalValue = str(payload.case) === 'terminal' ? value : {};
    const reason =
      str(terminalValue.message) ?? str(payload.terminal_reason) ?? str(payload.terminalReason) ?? null;
    const failed = eventName.includes('fail');
    // The wire carries no separate state field — the event name IS the
    // state. Keep the literal failure token in `state` so stop-line
    // classifiers (describeTryStop) still see it; the human reason stays
    // in `reason`.
    const reasonLower = (reason ?? '').toLowerCase();
    const state = failed
      ? (reasonLower.includes('fail') ? reason : 'failed')
      : (reason ?? 'completed');
    return {
      ...base,
      kind: 'lifecycle',
      state,
      reason,
      terminal: true,
      failed,
    };
  }
  if (eventName === 'error') {
    return {
      ...base,
      kind: 'lifecycle',
      text: str(payload.message) ?? null,
      state: 'error',
      terminal: false,
      failed: true,
    };
  }

  switch (envelope) {
    case 'assistantChunk':
      return { ...base, kind: 'chunk', text: str(value.text) };
    case 'model':
      // Model-call bookkeeping — not user-visible text.
      return { ...base, kind: 'other', state: str(value.modelId) };
    case 'toolCall':
      return {
        ...base,
        kind: 'tool',
        tool: str(value.toolName) ?? str(value.tool),
        toolCallId: str(value.toolCallId) ?? str(value.tool_call_id),
        // A3-21 — the wire may carry `arguments` (string or object) or
        // `args`; keep whatever arrived so the UI can render it verbatim.
        toolArgs: (value.arguments ?? value.args ?? null) as unknown,
      };
    case 'toolResult': {
      const failed = str(value.status)?.toUpperCase() === 'FAILED';
      return {
        ...base,
        kind: 'tool',
        failed,
        state: str(value.status),
        // A3-21 — the result carries no tool name, only the call id; the
        // session correlates it with the earlier toolCall frame.
        toolCallId: str(value.toolCallId) ?? str(value.tool_call_id),
        tool: str(value.toolName) ?? str(value.tool),
      };
    }
    case 'approval': {
      const approvalState = str(value.state);
      return {
        ...base,
        kind: 'lifecycle',
        state: approvalState ? `approval:${approvalState.toLowerCase()}` : 'approval',
        text: approvalState ? `Approval ${approvalState}` : null,
        // A3-20 — the approval reference; the card fetches the full record
        // (summary, action type, expiry) from the approvals API.
        approvalId: str(value.approvalId) ?? str(value.approval_id) ?? str(value.approvalRef),
      };
    }
    case 'lifecycle':
      return { ...base, kind: 'lifecycle', state: str(value.toState) };
    case 'terminal': {
      const code = str(value.code);
      const terminalMessage = str(value.message);
      const failed = !(code?.toLowerCase().includes('complet') ?? false);
      return { ...base, kind: 'lifecycle', state: code, reason: terminalMessage, text: terminalMessage, terminal: true, failed };
    }
    case 'usage': {
      const usage = usageText(value);
      return { ...base, kind: 'usage', usage };
    }
    case 'retrieval':
    case 'memory':
    case 'checkpoint':
    case 'policy':
    case 'media':
    case 'thinking':
      return { ...base, kind: 'lifecycle', state: envelope };
    default:
      break;
  }

  // Envelope-less fallback keyed on the SSE event name alone.
  if (eventName === 'delta') {
    return { ...base, kind: 'other' };
  }
  if (eventName.includes('tool')) {
    return { ...base, kind: 'tool', tool: str(value.toolName) ?? str(value.tool) };
  }
  if (eventName === 'usage') {
    return { ...base, kind: 'usage', usage: usageText(value) };
  }
  if (TERMINAL_STATES.some((t) => eventName.includes(t))) {
    return { ...base, kind: 'lifecycle', state: eventName, terminal: true, failed: eventName.includes('fail') };
  }
  return { ...base, kind: 'lifecycle', state: eventName || null };
}

function usageText(value: Record<string, unknown>): string | null {
  const parts = Object.entries(value)
    .filter(([, v]) => typeof v === 'number')
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

// ─── Queries & mutations ─────────────────────────────────────────────

export function useConversationMessages(conversationId: string | null, options?: { enabled?: boolean }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: ['studio', 'chat-messages', orgId, conversationId],
    queryFn: async () => {
      // A3-47 — the engine pages `/messages` (default 50, cap 100, oldest
      // first) and exposes only `next_cursor`. A single page would silently
      // drop a long thread's NEWEST messages, so walk the cursor until the
      // thread is complete. Pages arrive oldest→newest; the merged list
      // stays in that order.
      const all: ChatMessage[] = [];
      let after = 0;
      for (;;) {
        const page = await engine<unknown>(
          `/console/org/${orgId}/conversations/${conversationId}/messages?after=${after}&limit=100`,
        );
        const record = typeof page === 'object' && page !== null ? (page as Record<string, unknown>) : {};
        const rows = parseConversationMessages(page);
        all.push(...rows);
        const nextCursor = record.next_cursor;
        if (typeof nextCursor !== 'number' || rows.length === 0) {
          break;
        }
        after = nextCursor;
      }
      return all;
    },
    enabled: (options?.enabled ?? true) && !!orgId && !!conversationId,
    staleTime: 15_000,
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
      engine<{ conversation?: { id?: string } }>(`/console/org/${orgId}/conversations`, {
        method: 'POST',
        // Engine contract: CreateConversationDto requires `assistant_id`
        // (assistant == agent in studio vocabulary); the created id lives
        // at `conversation.id` in the response.
        body: {
          ...(input.agentId ? { assistant_id: input.agentId } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['studio', 'conversations'] }),
    onError: (error) => toastEngineError(error, 'Could not start the conversation'),
  });
}

export function useSendChatMessage() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (input: { conversationId: string; text: string; attachmentIds?: string[] }) =>
      engine<unknown>(`/console/org/${orgId}/conversations/${input.conversationId}/messages`, {
        method: 'POST',
        // Engine contract: AcceptMessageDto takes `content` + `attachments`,
        // not the legacy `text` / `attachment_ids` shape.
        body: {
          content: { text: input.text },
          ...(input.attachmentIds?.length ? { attachments: input.attachmentIds } : {}),
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

/** Rename a conversation (A3-05) — PATCH title; honest errors via toast, rejection propagates to the caller. */
export function useRenameConversation() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { conversationId: string; title: string }) =>
      engine(`/console/org/${orgId}/conversations/${input.conversationId}/title`, {
        method: 'PATCH',
        body: { title: input.title },
        idempotent: true,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['studio', 'conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['studio', 'chat-conversation'] });
    },
    onError: (error) => toastEngineError(error, 'Could not rename the conversation'),
  });
}

// ─── The session orchestrator ────────────────────────────────────────

/**
 * A3-40 — thumbs up/down on an assistant message. The engine owns feedback
 * persistence; this is a fire-and-forget record with an honest toast on
 * failure. The optimistic UI state lives in the message list.
 */
export function useRecordFeedback() {
  const { orgId } = useOrg();
  return useMutation({
    mutationFn: async (input: { conversationId: string; messageId: string; rating: 'up' | 'down' }) =>
      engine(`/console/org/${orgId}/conversations/${input.conversationId}/messages/${input.messageId}/feedback`, {
        method: 'POST',
        body: { rating: input.rating },
        idempotent: true,
      }),
    onError: (error) => toastEngineError(error, 'Could not record feedback'),
  });
}

export type RunPhase = 'idle' | 'creating' | 'sending' | 'streaming' | 'accepted' | 'done' | 'error';

export interface RunNotice {
  id: string;
  kind: 'tool' | 'usage' | 'status' | 'error' | 'approval';
  text: string;
  /** A3-21 — rich tool-call rendering: name, args, status, correlation id. */
  toolCall?: { name: string | null; args: unknown; status: string | null; callId: string | null } | null;
  /** A3-20 — inline approval card payload (fetched from the approvals API). */
  approval?: ApprovalRequest | null;
  /**
   * A3-23 — the send failed and the session kept the text, so the notice
   * can offer an honest retry instead of stranding the message.
   */
  retryable?: boolean;
}

/**
 * A3-20 — the approval record the inline card renders. Fetched from
 * `GET /console/org/:org/approvals?state=PENDING` and matched to the SSE
 * frame by `approvalRef` (the wire's `approvalId`). The engine stores no
 * tool arguments on the approval — the card shows what exists and never
 * invents args.
 */
export interface ApprovalRequest {
  id: string;
  runId: string;
  approvalRef: string;
  summary: string;
  actionType: string;
  expiresAt: string | null;
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
  const sendMessage = useSendChatMessage();
  const cancel = useCancelRun();

  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [phase, setPhase] = useState<RunPhase>('idle');
  const [live, setLive] = useState<{ user: ChatMessage | null; assistantText: string }>({ user: null, assistantText: '' });
  const [notices, setNotices] = useState<RunNotice[]>([]);
  // A3-25 — stop() flips this the moment the user hits Stop; the terminal
  // SSE frame clears it. The composer shows "Stopping…" instead of a dead
  // Stop button while the cancel is in flight.
  const [stopping, setStopping] = useState(false);

  // A3-43 — finalize runs from the SSE callback; read the run id through a
  // ref so a terminal frame can never clear a NEWER run's state, and so the
  // live overlay is dropped before the transcript refetch lands.
  const activeRunIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef(conversationId);
  const phaseRef = useRef(phase);
  // A3-44 — set while send() creates a thread so the switch-reset below does
  // not wipe the session that just created the conversation.
  const justCreatedRef = useRef<string | null>(null);
  // A3-21 — toolCallId → {name, args}: the toolResult wire frame carries
  // no tool name, only the call id, so the result is correlated with the
  // earlier toolCall frame for rendering.
  const toolCallsRef = useRef(new Map<string, { name: string | null; args: unknown }>());
  // A3-20 — approval refs already surfaced, so a re-delivered frame does
  // not duplicate the card.
  const approvalsRef = useRef(new Set<string>());
  // A3-21 — toolCallId → tool name, resolved from the approval record.
  // The toolResult wire frame carries no tool name (only the call id), and
  // the toolCall frame is never emitted by any producer (zero type-3 rows
  // in run_events) — so for approval-gated tools the approval's summary
  // (which IS the tool name) is the only honest source of the name.
  // Keyed by the call-id FRAGMENT from the approval ref (the ref truncates
  // the id to 15 hex chars); lookup is by prefix match.
  const approvalNamesRef = useRef(new Map<string, string>());
  // A3-23 — the text of the last failed send; retrySend re-posts it so the
  // error notice can offer a real retry. Cleared on every new send.
  const failedSendRef = useRef<string | null>(null);

  const stream = useEventStream({
    path: `/console/org/${orgId}/runs/${activeRunId ?? '_'}/events/stream`,
    enabled: !!orgId && !!activeRunId,
    onEvent: (message) => {
      const event = parseRunEvent(message);
      if (event.kind === 'chunk' && event.text) {
        setLive((prev) => ({ ...prev, assistantText: prev.assistantText + event.text }));
      } else if (event.kind === 'tool') {
        // A3-21 — remember the call so the later result can name it; render
        // the call itself with its arguments when the wire carries them.
        // (In practice no producer emits the toolCall frame today; the
        // branch below stays correct if one ever does.)
        if (event.toolCallId && event.tool) {
          toolCallsRef.current.set(event.toolCallId, { name: event.tool, args: event.toolArgs });
        }
        const known = event.toolCallId ? toolCallsRef.current.get(event.toolCallId) : undefined;
        // A3-21 — the toolResult frame carries no name; resolve it through
        // the approval record (gated tools) when the call frame didn't.
        // The approval ref embeds a TRUNCATED call id
        // (`aprv_<run>_<turn>_call_<15hex>` vs the full `call_<16hex>`), so
        // match by prefix, not equality.
        let approvedName;
        if (event.toolCallId) {
          for (const [frag, name] of approvalNamesRef.current) {
            if (event.toolCallId.startsWith(frag)) { approvedName = name; break; }
          }
        }
        const name = event.tool ?? known?.name ?? approvedName ?? null;
        const args = event.toolArgs ?? known?.args ?? null;
        const status = event.state ?? null;
        const label = name ?? event.toolCallId ?? 'unknown tool';
        // A3-22 — a failed result names the tool and the failure; never a
        // bare "Tool call".
        const text = event.failed
          ? `Tool call · ${label} — failed${status ? ` (${status})` : ''}`
          : status
            ? `Tool call · ${label} — ${status.toLowerCase()}`
            : `Tool call · ${label}`;
        setNotices((prev) => [
          ...prev,
          {
            id: message.id ?? `tool-${Date.now()}-${Math.random()}`,
            kind: event.failed ? 'error' : 'tool',
            text,
            toolCall: { name, args, status, callId: event.toolCallId },
          },
        ]);
      } else if (event.kind === 'usage' && event.usage) {
        setNotices((prev) => [...prev, { id: message.id ?? String(Date.now()) + Math.random(), kind: 'usage', text: event.usage as string }]);
      } else if (event.state?.startsWith('approval:')) {
        // A3-20 — the approval frame is minimal (state + approvalId); the
        // card needs the full record, so fetch it and surface inline.
        const approvalState = event.state.slice('approval:'.length);
        const approvalRef = event.approvalId;
        if (approvalState === 'pending' && approvalRef && !approvalsRef.current.has(approvalRef)) {
          approvalsRef.current.add(approvalRef);
          const runId = activeRunIdRef.current;
          void (async () => {
            try {
              const list = await engine<{ approvals?: Array<Record<string, unknown>> }>(
                `/console/org/${orgId}/approvals?state=PENDING`,
              );
              const rows = Array.isArray(list.approvals) ? list.approvals : [];
              const match =
                rows.find((a) => str(a.approvalRef) === approvalRef) ??
                rows.find((a) => str(a.id) === approvalRef) ??
                (runId ? rows.find((a) => str(a.runId) === runId || str(a.run_id) === runId) : undefined);
              if (!match) {
                setNotices((prev) => [
                  ...prev,
                  { id: `appr-${approvalRef}`, kind: 'status', text: `An approval is waiting (${approvalRef}) — open Approvals to decide.` },
                ]);
                return;
              }
              const approval: ApprovalRequest = {
                id: str(match.id) ?? approvalRef,
                runId: str(match.runId) ?? str(match.run_id) ?? runId ?? '',
                approvalRef: str(match.approvalRef) ?? approvalRef,
                summary: str(match.summary) ?? 'tool call',
                actionType: str(match.actionType) ?? str(match.action_type) ?? '',
                expiresAt: str(match.expiresAt) ?? str(match.expires_at),
              };
              // A3-21 — the approval ref embeds the tool call id
              // (`aprv_<runId>_<seq>_call_<hex>`); the summary IS the tool
              // name, so later toolResult frames for this call can be named.
              const callMatch = /call_[0-9a-f]+/i.exec(approval.approvalRef);
              if (callMatch) {
                approvalNamesRef.current.set(callMatch[0], approval.summary);
              }
              setNotices((prev) => [
                ...prev,
                { id: `appr-${approval.id}`, kind: 'approval', text: `Approval needed: ${approval.summary}`, approval },
              ]);
            } catch {
              setNotices((prev) => [
                ...prev,
                { id: `appr-${approvalRef}`, kind: 'status', text: `An approval is waiting (${approvalRef}) — open Approvals to decide.` },
              ]);
            }
          })();
        } else if (approvalState === 'approved' || approvalState === 'denied' || approvalState === 'expired') {
          // The card resolves itself once the decision lands.
          setNotices((prev) => prev.filter((n) => n.kind !== 'approval'));
        }
      } else if (event.terminal) {
        // A2-68: carry the classified terminal reason (e.g. "tool policy
        // denied: create_ticket") so the failure notice names the cause.
        finalize(event.state ?? 'completed', event.failed, event.reason);
      }
    },
  });

  // Keep the refs mirroring state (the switch-reset also writes
  // activeRunIdRef directly when it needs the value within the same effect
  // run). Readers are event/SSE callbacks, which always run post-commit.
  useEffect(() => {
    activeRunIdRef.current = activeRunId;
    conversationIdRef.current = conversationId;
    phaseRef.current = phase;
  }, [activeRunId, conversationId, phase]);
  // A3-44 — switch-reset + A2-65 reload reattach live here: the session
  // is keyed to ONE conversation, so a prop switch detaches A's overlay,
  // notices and stream before B reattaches to its own active run.
  // A2-65 — reload reattach: on mount, ask the engine for the
  // conversation's runs and tail the active one instead of leaving a
  // running run orphaned with no live stream.
  const reattachedRef = useRef<string | null>(null);
  const prevConversationIdRef = useRef<string | null>(conversationId);
  useEffect(() => {
    const prev = prevConversationIdRef.current;
    prevConversationIdRef.current = conversationId;
    let didReset = false;
    if (prev !== conversationId) {
      // Switched threads. Exempt the thread send() just created — its
      // replaceState navigation fires this effect with the new id, and
      // resetting there would wipe the in-flight turn.
      if (justCreatedRef.current !== conversationId) {
        activeRunIdRef.current = null;
        setActiveRunId(null);
        setPhase('idle');
        setLive({ user: null, assistantText: '' });
        setNotices([]);
        setStopping(false);
        toolCallsRef.current.clear();
        approvalsRef.current.clear();
        approvalNamesRef.current.clear();
        reattachedRef.current = null;
        didReset = true;
      } else {
        justCreatedRef.current = null;
      }
    }
    // didReset bypasses the phase guard: setPhase('idle') above has not
    // flushed yet, but the session IS idle — B may reattach immediately.
    if (!orgId || !conversationId || activeRunIdRef.current !== null || (!didReset && phaseRef.current !== 'idle')) {
      return;
    }
    if (reattachedRef.current === conversationId) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const raw = await engine<unknown>(`/console/org/${orgId}/conversations/${conversationId}/runs`);
        if (cancelled) {
          return;
        }
        const runs = parseRuns(raw);
        const active = runs.find((r) => {
          const s = (r.status ?? '').toLowerCase();
          return s !== '' && !TERMINAL_RUN_STATES.has(s);
        });
        // A2-65: mark attempted only after the fetch resolves. Setting the
        // ref before the await breaks React StrictMode (dev double-invokes
        // the effect: the first pass is cancelled, the remount sees the ref
        // and skips, so reattach never happens).
        reattachedRef.current = conversationId;
        if (active) {
          activeRunIdRef.current = active.id;
          setActiveRunId(active.id);
          setPhase('streaming');
        }
      } catch {
        // Reattach is best-effort — a failed lookup leaves the session idle.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, conversationId]);

  const finalize = (state: string, failed: boolean, reason: string | null = null) => {
    // A3-43 — read the run id from the ref: the terminal frame must settle
    // the run it belongs to, never a newer run that started since.
    const runId = activeRunIdRef.current;
    activeRunIdRef.current = null;
    setActiveRunId(null);
    setPhase(failed ? 'error' : 'done');
    // A3-25 — the terminal frame is the cancel landing; drop the stopping
    // indicator.
    setStopping(false);
    if (failed) {
      // A2-68: the terminal frame names the real cause (e.g. "tool policy
      // denied: create_ticket") — render it, never just the state.
      const text = reason ? `The run failed: ${reason}.` : `The run ended with state "${state}".`;
      setNotices((prev) => [...prev, { id: `err-${Date.now()}`, kind: 'error', text }]);
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
    // A3-43 — the transcript is the record: drop the live overlay FIRST so
    // the stale streaming text can never render alongside the refetched
    // authoritative rows, then refetch. A refetch (not invalidate) keeps
    // this atomic from the UI's perspective — no flicker of missing rows.
    setLive({ user: null, assistantText: '' });
    const cid = conversationIdRef.current;
    void queryClient.refetchQueries({ queryKey: ['studio', 'chat-messages', orgId, cid] });
    void queryClient.invalidateQueries({ queryKey: ['studio', 'chat-runs', orgId, cid] });
  };

  const send = async (text: string, attachmentIds?: string[]) => {
    if (phase === 'streaming' || phase === 'sending' || phase === 'creating') {
      return;
    }
    setLive({ user: { id: `live-${Date.now()}`, role: 'user', text, createdAt: null }, assistantText: '' });
    setNotices([]);
    // A3-23 — a new send supersedes any failed one.
    failedSendRef.current = null;
    let id = conversationId;

    try {
      if (!id) {
        setPhase('creating');
        const created = await create.mutateAsync({ agentId });
        // Engine contract: the created id lives at `conversation.id`.
        const createdRecord = typeof created === 'object' && created !== null ? (created as Record<string, unknown>) : {};
        const nested = typeof createdRecord.conversation === 'object' && createdRecord.conversation !== null
          ? (createdRecord.conversation as Record<string, unknown>)
          : {};
        id = str(nested.id);
        if (!id) {
          setPhase('error');
          setNotices([{ id: `e-${Date.now()}`, kind: 'error', text: 'The conversation was created but no id came back — try again.' }]);
          return;
        }
        if (conversationId === null) {
          // Hand the new thread id to the URL so refresh/recent-chats bind.
          window.history.replaceState(null, '', `/agent-studio/chat?chat=${encodeURIComponent(id)}`);
          // A3-44 — the replaceState above fires the switch-reset with the
          // new id; exempt it so this in-flight turn survives.
          justCreatedRef.current = id;
        }
      }

      setPhase('sending');
      // The conversation id is resolved above — pass it per-call so a
      // just-created thread (conversationId prop was null) hits the new
      // thread's endpoint, not /conversations/null/messages.
      const response = await sendMessage.mutateAsync({ conversationId: id, text, attachmentIds });
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
      // A3-23 — a failed send leaves an inline notice AND keeps the text
      // for the retry path (the composer already cleared its input).
      failedSendRef.current = text;
      setNotices([{ id: `e-${Date.now()}`, kind: 'error', text: 'Could not send the message — check your connection and try again.', retryable: true }]);
    }
  };

  /**
   * A3-23 — re-post the text of the last failed send. Gated on the same
   * phase guard as send(); a successful send clears the stored text.
   */
  const retrySend = () => {
    const text = failedSendRef.current;
    if (!text || phase === 'streaming' || phase === 'sending' || phase === 'creating') {
      return;
    }
    void send(text);
  };

  const stop = () => {
    if (activeRunIdRef.current) {
      // A3-25 — enter the cancelling state immediately; the terminal frame
      // (via finalize) settles it. If the cancel request itself fails,
      // drop the state so the stop affordance never wedges on.
      setStopping(true);
      cancel.mutate(activeRunIdRef.current, { onError: () => setStopping(false) });
    }
  };

  /**
   * A3-41/A3-42 — regenerate the latest assistant reply through the real
   * engine endpoint. No user message is appended: the engine re-runs the
   * latest user turn in place (branch pointer, immutable rows). The new
   * run's chunks stream into the live overlay; the superseded reply drops
   * out when the transcript refetches on finalize.
   */
  const regenerate = async () => {
    const id = conversationIdRef.current;
    if (!id || phaseRef.current === 'streaming' || phaseRef.current === 'sending' || phaseRef.current === 'creating') {
      return;
    }
    setPhase('sending');
    setNotices([]);
    setLive({ user: null, assistantText: '' });
    try {
      const result = await engine<{ run_id?: string; runId?: string }>(
        `/console/org/${orgId}/conversations/${id}/regenerate`,
        { method: 'POST', body: {}, idempotent: true },
      );
      const runId = str(result.run_id) ?? str(result.runId);
      if (!runId) {
        setPhase('error');
        setNotices([{ id: `e-${Date.now()}`, kind: 'error', text: 'The regenerate request returned no run — try again.' }]);
        return;
      }
      activeRunIdRef.current = runId;
      setActiveRunId(runId);
      setPhase('streaming');
      // Same honest accepted-state backstop as send(): if the SSE tail
      // produces nothing, say so instead of faking a reply.
      window.setTimeout(() => {
        setPhase((current) => (current === 'streaming' ? 'accepted' : current));
      }, 15_000);
    } catch (error) {
      setPhase('error');
      toastEngineError(error, 'Could not regenerate the response');
    }
  };

  /**
   * A3-40 — edit-and-resend on a user message. The engine replaces the
   * message (branch: original gains `superseded_by`, the edit carries
   * `branched_from`) and starts a new run over the edited text. The
   * rejection propagates so the inline editor keeps the draft on failure.
   */
  const editMessage = async (messageId: string, text: string) => {
    const id = conversationIdRef.current;
    if (!id || phaseRef.current === 'streaming' || phaseRef.current === 'sending' || phaseRef.current === 'creating') {
      return;
    }
    setPhase('sending');
    setNotices([]);
    try {
      const result = await engine<{ run_id?: string; runId?: string }>(
        `/console/org/${orgId}/conversations/${id}/edit`,
        {
          method: 'POST',
          body: { message_id: messageId, content: { text } },
          idempotent: true,
        },
      );
      const runId = str(result.run_id) ?? str(result.runId);
      if (!runId) {
        // The edit landed but no run came back — refetch and settle.
        setLive({ user: null, assistantText: '' });
        await queryClient.refetchQueries({ queryKey: ['studio', 'chat-messages', orgId, id] });
        setPhase('done');
        return;
      }
      activeRunIdRef.current = runId;
      setActiveRunId(runId);
      setPhase('streaming');
      window.setTimeout(() => {
        setPhase((current) => (current === 'streaming' ? 'accepted' : current));
      }, 15_000);
    } catch (error) {
      setPhase('error');
      toastEngineError(error, 'Could not resend the edited message');
      throw error;
    }
  };

  const reset = () => {
    setActiveRunId(null);
    setPhase('idle');
    setLive({ user: null, assistantText: '' });
    setNotices([]);
    setStopping(false);
    toolCallsRef.current.clear();
    approvalsRef.current.clear();
    approvalNamesRef.current.clear();
  };

  const isBusy = phase === 'creating' || phase === 'sending' || phase === 'streaming';

  return useMemo(
    () => ({ live, notices, phase, isBusy, stopping, send, stop, reset, regenerate, editMessage, retrySend, activeRunId, streamStatus: stream }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live, notices, phase, stopping, activeRunId, stream, conversationId, agentId, orgId],
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
