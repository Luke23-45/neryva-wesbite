// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { parseRunEvent, useChatSession, useTrySession } from './useChat';
import type { SseMessage } from '@lib/engine/sse';

vi.mock('react-hot-toast', () => {
  const fn = vi.fn() as never;
  const success = vi.fn() as never;
  const error = vi.fn() as never;
  return { default: Object.assign(fn, { success, error }) };
});

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const engineMock = vi.fn();

vi.mock('@lib/engine/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@lib/engine/client')>();
  return { ...actual, engine: (...args: unknown[]) => engineMock(...args) };
});

type StreamOpts = { onEvent: (message: SseMessage) => void };
let capturedOnEvent: ((message: SseMessage) => void) | null = null;

vi.mock('@hooks/engine/useEventStream', () => ({
  useEventStream: (opts: StreamOpts) => {
    capturedOnEvent = opts.onEvent;
    return 'closed';
  },
}));

const TRANSCRIPT = {
  messages: [
    { id: 'u1', role: 'user', text: 'Where is my refund?', created_at: null },
    { id: 'a1', role: 'agent', text: 'Refunds land in 5–10 days.', created_at: null },
  ],
};

function routeEngine() {
  engineMock.mockImplementation((url: string, options?: { method?: string }) => {
    if (typeof url === 'string' && url.includes('/test-runs') && options?.method === 'POST') {
      const n = engineMock.mock.calls.filter((c) => String(c[0]).includes('/test-runs')).length;
      return Promise.resolve({ conversation_id: `conv-${n}`, message_id: `m-${n}`, run_id: `run-${n}` });
    }
    if (typeof url === 'string' && url.includes('/messages') && (!options?.method || options?.method === 'GET')) {
      return Promise.resolve(TRANSCRIPT);
    }
    return Promise.resolve({});
  });
}

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function chunk(text: string): SseMessage {
  // Real engine wire: event `delta` + {case:'assistantChunk', value:{text,isFinal}}
  return { id: 'e-chunk', event: 'delta', data: JSON.stringify({ case: 'assistantChunk', value: { text, isFinal: false } }) };
}

function terminal(state: string, reason: string | null): SseMessage {
  // Real engine wire: event `run.failed` + {message_id, terminal_reason}
  return { id: 'e-term', event: 'run.failed', data: JSON.stringify({ message_id: 'm-1', terminal_reason: reason ?? state }) };
}

beforeEach(() => {
  engineMock.mockReset();
  capturedOnEvent = null;
  vi.mocked(toast.error).mockReset();
  vi.useFakeTimers();
  routeEngine();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('parseRunEvent reason (C13 stop lines)', () => {
  it('carries terminal_reason through for the wall-clock stop', () => {
    const event = parseRunEvent({ id: 'e', event: 'run.failed', data: JSON.stringify({ message_id: 'm-9', terminal_reason: 'budget_exceeded' }) });
    expect(event.terminal).toBe(true);
    expect(event.failed).toBe(true);
    expect(event.reason).toBe('budget_exceeded');
  });

  it('carries the classified failure cause from the run.failed envelope (A2-68)', () => {
    const event = parseRunEvent({
      id: 'e-68',
      event: 'run.failed',
      data: JSON.stringify({ case: 'terminal', value: { code: 'TOOL_POLICY_DENIED', message: 'tool policy denied: create_ticket' } }),
    });
    expect(event.terminal).toBe(true);
    expect(event.failed).toBe(true);
    expect(event.reason).toBe('tool policy denied: create_ticket');
    // The literal failure token stays in state so stop-line classifiers
    // (describeTryStop) still see it; the human reason stays in reason.
    expect(event.state).toBe('failed');
  });

  it('parses the assistantChunk envelope into live text', () => {
    const event = parseRunEvent({
      id: 'e-19',
      event: 'delta',
      data: JSON.stringify({ case: 'assistantChunk', value: { text: 'The answer is paris.', isFinal: true } }),
    });
    expect(event.kind).toBe('chunk');
    expect(event.text).toBe('The answer is paris.');
  });

  it('parses toolCall/toolResult envelopes into tool notices', () => {
    const proposed = parseRunEvent({
      id: 'e-t1',
      event: 'tool-call',
      data: JSON.stringify({ case: 'toolCall', value: { toolCallId: 'tc-1', toolName: 'search_tickets' } }),
    });
    expect(proposed.kind).toBe('tool');
    expect(proposed.tool).toBe('search_tickets');
    const done = parseRunEvent({
      id: 'e-t2',
      event: 'tool-result',
      data: JSON.stringify({ case: 'toolResult', value: { toolCallId: 'tc-1', status: 'SUCCEEDED' } }),
    });
    expect(done.kind).toBe('tool');
    expect(done.failed).toBe(false);
  });

  it('A3-21 — toolCall args and toolCallId survive parsing for correlation', () => {
    const call = parseRunEvent({
      id: 'e-t3',
      event: 'tool-call',
      data: JSON.stringify({
        case: 'toolCall',
        value: { toolCallId: 'call_abc', toolName: 'create_ticket', arguments: { title: 'billing issue' } },
      }),
    });
    expect(call.toolCallId).toBe('call_abc');
    expect(call.toolArgs).toEqual({ title: 'billing issue' });
    const result = parseRunEvent({
      id: 'e-t4',
      event: 'tool-result',
      data: JSON.stringify({ case: 'toolResult', value: { toolCallId: 'call_abc', status: 'SUCCEEDED' } }),
    });
    // The result wire frame carries no tool name — only the call id for
    // the session to correlate.
    expect(result.toolCallId).toBe('call_abc');
    expect(result.tool).toBeNull();
  });

  it('A3-20 — approval frames expose the approvalId for the inline card', () => {
    const pending = parseRunEvent({
      id: 'e-a1',
      event: 'approval',
      data: JSON.stringify({
        case: 'approval',
        value: { state: 'PENDING', approvalId: 'aprv_run1_2_call_xyz' },
      }),
    });
    expect(pending.state).toBe('approval:pending');
    expect(pending.approvalId).toBe('aprv_run1_2_call_xyz');
  });

  it('parses the lifecycle envelope and dotted terminal frames', () => {
    const lc = parseRunEvent({
      id: 'e-lc',
      event: 'lifecycle',
      data: JSON.stringify({ case: 'lifecycle', value: { toState: 'DISPATCHED', fromState: 'ACCEPTED' } }),
    });
    expect(lc.kind).toBe('lifecycle');
    expect(lc.state).toBe('DISPATCHED');
    const term = parseRunEvent({ id: 'e-t', event: 'run.completed', data: JSON.stringify({ message_id: 'm-2', terminal_reason: 'completed' }) });
    expect(term.terminal).toBe(true);
    expect(term.failed).toBe(false);
  });
});

describe('useTrySession', () => {
  it('rejects empty and overlong prompts without a turn', async () => {
    const { result } = renderHook(() => useTrySession('agent-1', 'v1', null), { wrapper: wrapper() });
    let ok = true;
    await act(async () => {
      ok = result.current.send('   ');
    });
    expect(ok).toBe(false);
    await act(async () => {
      ok = result.current.send('x'.repeat(8193));
    });
    expect(ok).toBe(false);
    expect(result.current.turns).toHaveLength(0);
    expect(vi.mocked(toast.error)).toHaveBeenCalledTimes(2);
    expect(engineMock).not.toHaveBeenCalled();
  });

  it('streams chunks live and settles the authoritative text on terminal', async () => {
    const { result } = renderHook(() => useTrySession('agent-1', 'v1', null), { wrapper: wrapper() });
    await act(async () => {
      result.current.send('Where is my refund?');
    });
    expect(result.current.turns).toHaveLength(1);
    expect(result.current.turns[0].status).toBe('streaming');
    expect(result.current.turns[0].conversationId).toBe('conv-1');

    await act(async () => {
      capturedOnEvent?.(chunk('Refunds '));
      capturedOnEvent?.(chunk('land soon.'));
    });
    expect(result.current.turns[0].liveText).toBe('Refunds land soon.');

    await act(async () => {
      capturedOnEvent?.({ id: 'e-done', event: 'run.completed', data: JSON.stringify({ message_id: 'm-done', terminal_reason: 'completed' }) });
    });
    expect(result.current.turns[0].status).toBe('done');
    // Settled from the transcript with the shared parser — not the live tail.
    expect(result.current.turns[0].agentText).toBe('Refunds land in 5–10 days.');
    expect(result.current.turns[0].stop).toBeNull();
    expect(result.current.isBusy).toBe(false);
  });

  it('names the wall-clock dimension on engine FAILED, never a merged limit line', async () => {
    const { result } = renderHook(() => useTrySession('agent-1', 'v1', null), { wrapper: wrapper() });
    await act(async () => {
      result.current.send('Where is my refund?');
    });
    await act(async () => {
      capturedOnEvent?.(terminal('FAILED', 'budget_exceeded_wall_clock'));
    });
    const turn = result.current.turns[0];
    expect(turn.status).toBe('error');
    expect(turn.stop?.kind).toBe('wall-clock');
    expect(turn.notices.some((n) => n.kind === 'error' && n.text.includes('budget_exceeded_wall_clock'))).toBe(true);
  });

  it('surfaces tool and usage events as notices, never dropped', async () => {
    const { result } = renderHook(() => useTrySession('agent-1', 'v1', null), { wrapper: wrapper() });
    await act(async () => {
      result.current.send('Where is my order?');
    });
    await act(async () => {
      capturedOnEvent?.({ id: 'e-tool', event: 'tool-call', data: JSON.stringify({ case: 'toolCall', value: { toolCallId: 'tc-9', toolName: 'lookup_order' } }) });
      capturedOnEvent?.({ id: 'e-use', event: 'usage', data: JSON.stringify({ case: 'usage', value: { total_tokens: 1204 } }) });
    });
    const kinds = result.current.turns[0].notices.map((n) => n.kind);
    expect(kinds).toContain('tool');
    expect(kinds).toContain('usage');
    expect(result.current.turns[0].notices.some((n) => n.text.includes('lookup_order'))).toBe(true);
    // Raw payloads retained for the trace drawer; chunks never retained.
    expect(result.current.turns[0].rawEvents).toHaveLength(2);
  });

  it('re-ask re-posts the same prompt as a fresh draft-pinned run', async () => {
    const { result } = renderHook(() => useTrySession('agent-1', 'v1', null), { wrapper: wrapper() });
    await act(async () => {
      result.current.send('Where is my refund?');
    });
    const key = result.current.turns[0].key;
    await act(async () => {
      capturedOnEvent?.({ id: 'e-done', event: 'run.completed', data: JSON.stringify({ message_id: 'm-done', terminal_reason: 'completed' }) });
    });
    await act(async () => {
      result.current.reask(key);
    });
    expect(result.current.turns).toHaveLength(2);
    expect(result.current.turns[1].prompt).toBe('Where is my refund?');
    expect(result.current.turns[1].conversationId).toBe('conv-2');
    expect(engineMock.mock.calls.filter((c) => String(c[0]).includes('/test-runs'))).toHaveLength(2);
  });

  it('stop cancels the run and keeps the partial reply honestly', async () => {
    const { result } = renderHook(() => useTrySession('agent-1', 'v1', null), { wrapper: wrapper() });
    await act(async () => {
      result.current.send('Where is my refund?');
    });
    await act(async () => {
      capturedOnEvent?.(chunk('Partial…'));
    });
    await act(async () => {
      result.current.stop();
    });
    expect(engineMock.mock.calls.some((c) => String(c[0]).includes('/runs/run-1/cancel'))).toBe(true);
    expect(result.current.turns[0].status).toBe('done');
    expect(result.current.turns[0].notices.some((n) => n.text.includes('Stopped'))).toBe(true);
    expect(result.current.isBusy).toBe(false);
  });

  it('restores a thread from ?try= with honest copy', async () => {
    const { result } = renderHook(() => useTrySession('agent-1', 'v1', 'conv-9'), { wrapper: wrapper() });
    expect(result.current.turns).toHaveLength(1);
    expect(result.current.turns[0].restored).toBe(true);
    // The transcript fetch settles across timer-backed query ticks.
    await act(async () => {
      for (let i = 0; i < 20; i++) {
        await vi.advanceTimersByTimeAsync(50);
        if (result.current.turns[0]?.prompt !== '') break;
      }
    });
    expect(result.current.turns[0].prompt).toBe('Where is my refund?');
    expect(result.current.turns[0].agentText).toBe('Refunds land in 5–10 days.');
    expect(result.current.turns[0].notices.some((n) => n.text.includes('restored from the server'))).toBe(true);
  });
});

describe('useChatSession reload reattach (A2-65)', () => {
  function routeRuns(runs: Array<{ id: string; state: string }>) {
    engineMock.mockImplementation((url: string) => {
      if (String(url).includes('/conversations/conv-9/runs')) {
        return Promise.resolve({ runs });
      }
      if (String(url).includes('/messages')) {
        return Promise.resolve(TRANSCRIPT);
      }
      return Promise.resolve({});
    });
  }

  it('tails the active run after mount instead of leaving it orphaned', async () => {
    routeRuns([
      { id: 'run-old', state: 'COMPLETED' },
      { id: 'run-live', state: 'RUNNING' },
    ]);
    const { result } = renderHook(() => useChatSession('conv-9', null), { wrapper: wrapper() });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.activeRunId).toBe('run-live');
    expect(result.current.phase).toBe('streaming');
  });

  it('stays idle when every run is terminal', async () => {
    routeRuns([{ id: 'run-old', state: 'COMPLETED' }]);
    const { result } = renderHook(() => useChatSession('conv-9', null), { wrapper: wrapper() });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.activeRunId).toBeNull();
    expect(result.current.phase).toBe('idle');
  });

  it('reattaches under React StrictMode double-effect (regression)', async () => {
    // StrictMode mount runs the reattach effect twice (setup -> cleanup ->
    // setup). The first pass is cancelled while its runs fetch is still
    // pending; the second pass must still perform the lookup. If the
    // "already attempted" ref were set before the fetch resolved, the second
    // pass would see it and skip — leaving the live run orphaned.
    let resolveRuns!: (v: unknown) => void;
    const runsGate = new Promise((res) => { resolveRuns = res; });
    engineMock.mockImplementation((url: string) => {
      if (String(url).includes('/conversations/conv-9/runs')) return runsGate;
      if (String(url).includes('/messages')) return Promise.resolve(TRANSCRIPT);
      return Promise.resolve({});
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const StrictWrapper = ({ children }: { children: React.ReactNode }) => (
      <StrictMode>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </StrictMode>
    );
    const { result } = renderHook(() => useChatSession('conv-9', null), { wrapper: StrictWrapper });
    // Flush the StrictMode setup/cleanup/setup cycle while the fetch is pending.
    await act(async () => { await Promise.resolve(); });
    await act(async () => {
      resolveRuns({ runs: [{ id: 'run-live', state: 'RUNNING' }] });
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(result.current.activeRunId).toBe('run-live');
    expect(result.current.phase).toBe('streaming');
  });
});

describe('create-then-send contract (A2-61/A2-67)', () => {
  function routeCreateThenSend() {
    engineMock.mockImplementation((url: string, options?: { method?: string; body?: unknown }) => {
      const u = String(url);
      if (u.endsWith('/conversations') && options?.method === 'POST') {
        return Promise.resolve({ conversation: { id: 'conv-new' } });
      }
      if (u.includes('/conversations/conv-new/messages') && options?.method === 'POST') {
        return Promise.resolve({ run: { run_id: 'run-new', state: 'ACCEPTED' } });
      }
      if (u.includes('/messages')) {
        return Promise.resolve(TRANSCRIPT);
      }
      return Promise.resolve({});
    });
  }

  it('creates with assistant_id, reads conversation.id, and posts to the NEW thread', async () => {
    routeCreateThenSend();
    const { result } = renderHook(() => useChatSession(null, 'agent-1'), { wrapper: wrapper() });
    await act(async () => {
      await result.current.send('Hello new thread');
    });
    const calls = engineMock.mock.calls.map((c) => ({ url: String(c[0]), method: (c[1] as { method?: string } | undefined)?.method, body: (c[1] as { body?: unknown } | undefined)?.body }));
    const createCall = calls.find((c) => c.url.endsWith('/conversations') && c.method === 'POST');
    expect(createCall).toBeDefined();
    // A2-67: engine CreateConversationDto takes `assistant_id`, never `agent_id`.
    expect(createCall!.body).toEqual({ assistant_id: 'agent-1' });
    // A2-61: engine AcceptMessageDto takes `content` + `attachments`.
    const sendCall = calls.find((c) => c.url.includes('/conversations/conv-new/messages') && c.method === 'POST');
    expect(sendCall).toBeDefined();
    expect(sendCall!.body).toEqual({ content: { text: 'Hello new thread' } });
    // The send must never target the stale null conversation id.
    expect(calls.some((c) => c.url.includes('/conversations/null/messages'))).toBe(false);
    expect(result.current.activeRunId).toBe('run-new');
  });
});

describe('useRenameConversation (A3-05)', () => {
  it('PATCHes the engine title route with { title } and invalidates chat queries', async () => {
    engineMock.mockResolvedValue({});
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
    const wrapper = (function () {
      return function Wrapper({ children }: { children: React.ReactNode }) {
        return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
      };
    })();
    const { useRenameConversation } = await import('./useChat');
    const { result } = renderHook(() => useRenameConversation(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ conversationId: 'conv-9', title: 'Paris trivia' });
    });
    expect(engineMock).toHaveBeenCalledTimes(1);
    const [url, options] = engineMock.mock.calls[0] as [string, { method?: string; body?: unknown }];
    expect(url).toBe('/console/org/org-test/conversations/conv-9/title');
    expect(options.method).toBe('PATCH');
    expect(options.body).toEqual({ title: 'Paris trivia' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['studio', 'conversations'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['studio', 'chat-conversation'] });
    invalidateSpy.mockRestore();
  });
});
