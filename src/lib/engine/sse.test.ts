import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { connectEventStream, createSseParser, type SseMessage } from './sse';

describe('createSseParser', () => {
  it('assembles an event split across chunks, joining multi-line data', () => {
    const seen: SseMessage[] = [];
    const parser = createSseParser((m) => seen.push(m));
    parser.push('id: 42\nevent: run\ndata: hel');
    parser.push('lo\ndata: world\n\n');
    expect(seen).toEqual([{ id: '42', event: 'run', data: 'hello\nworld' }]);
    expect(parser.lastEventId()).toBe('42');
  });

  it('ignores comments and keep-alives without emitting', () => {
    const seen: SseMessage[] = [];
    const parser = createSseParser((m) => seen.push(m));
    parser.push(': ping\n\n: another\n');
    expect(seen).toEqual([]);
  });

  it('handles CRLF line endings and a CR split across chunk boundaries', () => {
    const seen: SseMessage[] = [];
    const parser = createSseParser((m) => seen.push(m));
    parser.push('data: a\r');
    parser.push('\ndata: b\n\n');
    expect(seen).toEqual([{ id: null, event: null, data: 'a\nb' }]);
  });

  it('dispatches on the final line via flush()', () => {
    const seen: SseMessage[] = [];
    const parser = createSseParser((m) => seen.push(m));
    parser.push('data: tail');
    expect(seen).toEqual([]);
    parser.flush();
    expect(seen).toEqual([{ id: null, event: null, data: 'tail' }]);
  });

  it('tolerates field names without a colon and strips one leading space', () => {
    const seen: SseMessage[] = [];
    const parser = createSseParser((m) => seen.push(m));
    parser.push('data:hello\ndata:again\n\n');
    expect(seen).toEqual([{ id: null, event: null, data: 'hello\nagain' }]);
  });
});

describe('connectEventStream', () => {
  const enc = new TextEncoder();

  function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(enc.encode(chunk));
        }
        controller.close();
      },
    });
  }

  /** A stream that delivers its chunks and stays open — the server is alive. */
  function openStream(chunks: string[]): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(enc.encode(chunk));
        }
      },
    });
  }

  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('replays from the last event id on reconnect', async () => {
    const seen: SseMessage[] = [];
    const headersSeen: Array<Record<string, string>> = [];
    let call = 0;

    const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      headersSeen.push(init?.headers as Record<string, string>);
      call += 1;
      if (call === 1) {
        // First connection ends server-side → triggers the reconnect path.
        return new Response(streamOf(['id: 7\ndata: first\n\n']), { status: 200 });
      }
      return new Response(openStream(['id: 8\ndata: second\n\n']), { status: 200 });
    });

    const handle = connectEventStream({
      path: '/console/org/org_1/runs/run_1/events/stream',
      onEvent: (m) => seen.push(m),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      backoffBaseMs: 5,
      backoffMaxMs: 10,
      pauseWhenHidden: false,
    });

    await vi.waitFor(() => expect(seen.map((m) => m.data)).toEqual(['first', 'second']));
    handle.close();

    expect(headersSeen[0]['last-event-id']).toBeUndefined();
    expect(headersSeen[1]?.['last-event-id']).toBe('7');
    expect(headersSeen[0].authorization).toBeUndefined(); // signed-out test env
  });

  it('refreshes the token once on 401 and then streams', async () => {
    // Session refresh plumbing: a refresh token + a token endpoint.
    sessionStorage.setItem('neryva.refresh_token', 'refresh-me');
    let streamCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/token')) {
        return new Response(JSON.stringify({ access_token: 'a.access', expires_in: 900 }), { status: 200 });
      }
      if (url.includes('/auth/me')) {
        return new Response(JSON.stringify({ sub: 'acc_1' }), { status: 200 });
      }
      if (url.includes('/events/stream')) {
        streamCalls += 1;
        if (streamCalls === 1) {
          return new Response(null, { status: 401 });
        }
        return new Response(openStream(['id: 1\ndata: hello\n\n']), { status: 200 });
      }
      return new Response(JSON.stringify({ error: { code: 'not_found', message: 'nope' } }), { status: 404 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const statuses: string[] = [];
    const seen: SseMessage[] = [];
    const handle = connectEventStream({
      path: '/console/org/org_1/runs/run_1/events/stream',
      onEvent: (m) => seen.push(m),
      onStatus: (s) => statuses.push(s),
      backoffBaseMs: 5,
      backoffMaxMs: 10,
      pauseWhenHidden: false,
    });

    await vi.waitFor(() => expect(seen.map((m) => m.data)).toEqual(['hello']));
    handle.close();
    expect(streamCalls).toBe(2);
    expect(statuses).toContain('open');

    sessionStorage.removeItem('neryva.refresh_token');
  });

  it('stops with an error when the session cannot be renewed', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/token')) {
        return new Response(null, { status: 400 }); // refresh fails — session dead
      }
      return new Response(null, { status: 401 });
    });
    vi.stubGlobal('fetch', fetchMock);
    // No refresh token in storage → refresh cannot save the stream.

    const statuses: string[] = [];
    const handle = connectEventStream({
      path: '/console/org/org_1/runs/run_1/events/stream',
      onEvent: () => undefined,
      onStatus: (s) => statuses.push(s),
      fetchImpl: fetchMock as unknown as typeof fetch,
      pauseWhenHidden: false,
    });

    await vi.waitFor(() => expect(statuses).toContain('error'));
    handle.close();
  });
});
