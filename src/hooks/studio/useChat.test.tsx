// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { parseRunEvent, useTrySession } from './useChat';
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
  return { id: 'e-chunk', event: 'message', data: JSON.stringify({ type: 'chunk', text }) };
}

function terminal(state: string, reason: string | null): SseMessage {
  return { id: 'e-term', event: 'run.failed', data: JSON.stringify({ type: 'run.failed', state, ...(reason ? { reason } : {}) }) };
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
    const event = parseRunEvent({ id: 'e', event: 'run.failed', data: JSON.stringify({ type: 'run.failed', state: 'FAILED', terminal_reason: 'budget_exceeded' }) });
    expect(event.terminal).toBe(true);
    expect(event.failed).toBe(true);
    expect(event.reason).toBe('budget_exceeded');
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
      capturedOnEvent?.({ id: 'e-done', event: 'run.completed', data: JSON.stringify({ type: 'run.completed', state: 'COMPLETED' }) });
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
      capturedOnEvent?.({ id: 'e-tool', event: 'tool.call', data: JSON.stringify({ type: 'tool.call', tool: 'lookup_order' }) });
      capturedOnEvent?.({ id: 'e-use', event: 'usage', data: JSON.stringify({ type: 'usage', usage: { total_tokens: 1204 } }) });
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
      capturedOnEvent?.({ id: 'e-done', event: 'run.completed', data: JSON.stringify({ type: 'run.completed', state: 'COMPLETED' }) });
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
