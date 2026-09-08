/**
 * Fetch-based SSE client (F-11).
 *
 * The engine's stream endpoints are Server-Sent Events with `id:`-based
 * replay. Native `EventSource` cannot send an `Authorization` header, so
 * this client streams via `fetch` + ReadableStream and speaks the SSE
 * wire protocol itself:
 *
 *  - incremental parser (events split across chunks, multi-line `data:`,
 *    comments, CR/LF/CRLF line endings including a CR split across a
 *    chunk boundary),
 *  - automatic reconnect with exponential backoff + jitter, replaying
 *    from the last seen event id via the `Last-Event-ID` header,
 *  - one token refresh attempt on 401 before giving up (a dead session
 *    stops the stream with status 'error' — no infinite retry),
 *  - visibility-aware pausing: the connection drops while the tab is
 *    hidden and resumes on return.
 */
import { ENGINE_BASE, authorizationHeader } from './client';
import { refreshTokens } from './auth';

export interface SseMessage {
  /** Last `id:` field seen on the event (drives replay). */
  id: string | null;
  /** `event:` field, or null for the default 'message' type. */
  event: string | null;
  /** `data:` payload — multi-line data is joined with '\n'. */
  data: string;
}

export function createSseParser(onMessage: (message: SseMessage) => void): {
  push: (chunk: string) => void;
  flush: () => void;
  lastEventId: () => string | null;
} {
  let buffer = '';
  let lastId: string | null = null;
  let eventField: string | null = null;
  let idField: string | null = null;
  let dataLines: string[] = [];

  const dispatch = () => {
    if (dataLines.length === 0) {
      eventField = null;
      idField = null;
      return;
    }
    if (idField !== null) {
      lastId = idField;
    }
    onMessage({ id: idField, event: eventField, data: dataLines.join('\n') });
    eventField = null;
    idField = null;
    dataLines = [];
  };

  const processLine = (line: string) => {
    if (line === '') {
      dispatch();
      return;
    }
    if (line.startsWith(':')) {
      return; // comment / keep-alive
    }
    let field: string;
    let value: string;
    const colon = line.indexOf(':');
    if (colon === -1) {
      field = line;
      value = '';
    } else {
      field = line.slice(0, colon);
      value = line.slice(colon + 1);
      if (value.startsWith(' ')) {
        value = value.slice(1);
      }
    }
    switch (field) {
      case 'data':
        dataLines.push(value);
        break;
      case 'event':
        eventField = value;
        break;
      case 'id':
        if (!value.includes('\0')) {
          idField = value;
        }
        break;
      case 'retry':
        break; // the engine's reconnect hint — backoff policy is client-side
      default:
        break;
    }
  };

  return {
    push(chunk: string) {
      buffer += chunk;
      let guard = 0;
      while (guard++ < 10_000) {
        const cr = buffer.indexOf('\r');
        const lf = buffer.indexOf('\n');
        if (cr === -1 && lf === -1) {
          return;
        }
        if (lf === -1 || (cr !== -1 && cr < lf)) {
          // A trailing lone '\r' may be the first half of a '\r\n' that
          // arrives in the next chunk — hold it until more input or flush().
          if (cr === buffer.length - 1) {
            return;
          }
          const line = buffer.slice(0, cr);
          buffer = buffer.slice(cr + (buffer[cr + 1] === '\n' ? 2 : 1));
          processLine(line);
        } else {
          const line = buffer.slice(0, lf);
          buffer = buffer.slice(lf + 1);
          processLine(line);
        }
      }
    },
    flush() {
      if (buffer !== '') {
        const line = buffer;
        buffer = '';
        processLine(line);
      }
      dispatch();
    },
    lastEventId: () => lastId,
  };
}

export type StreamStatus = 'connecting' | 'open' | 'closed' | 'error';

export interface EventStreamOptions {
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  onEvent: (message: SseMessage) => void;
  onStatus?: (status: StreamStatus) => void;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
  backoffBaseMs?: number;
  backoffMaxMs?: number;
  pauseWhenHidden?: boolean;
  /** Injectable for tests — the stream ends when this fires. */
  externalSignal?: AbortSignal;
}

export interface EventStreamHandle {
  close: () => void;
}

function buildStreamUrl(path: string, query?: EventStreamOptions['query']): string {
  const base = `${ENGINE_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const url = new URL(base, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export function connectEventStream(options: EventStreamOptions): EventStreamHandle {
  const fetchImpl = options.fetchImpl ?? fetch.bind(window);
  const backoffBaseMs = options.backoffBaseMs ?? 1000;
  const backoffMaxMs = options.backoffMaxMs ?? 15_000;
  const pauseWhenHidden = options.pauseWhenHidden ?? true;

  let closed = false;
  let attempt = 0;
  let lastEventId: string | null = null;
  let controller: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';

  const setStatus = (status: StreamStatus) => {
    options.onStatus?.(status);
  };

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, ms);
    });

  const backoffDelay = () =>
    Math.min(backoffMaxMs, backoffBaseMs * 2 ** attempt) * (0.8 + Math.random() * 0.4);

  const headers = (): Record<string, string> => {
    const h: Record<string, string> = { accept: 'text/event-stream', 'cache-control': 'no-cache' };
    const auth = authorizationHeader();
    if (auth) {
      h.authorization = auth;
    }
    if (lastEventId) {
      h['last-event-id'] = lastEventId;
    }
    return h;
  };

  const waitVisible = () =>
    new Promise<void>((resolve) => {
      const onChange = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', onChange);
          resolve();
        }
      };
      document.addEventListener('visibilitychange', onChange);
    });

  const onVisibilityChange = () => {
    if (typeof document === 'undefined') {
      return;
    }
    const isHidden = document.visibilityState === 'hidden';
    if (isHidden && !closed) {
      hidden = true;
      controller?.abort();
    } else if (!isHidden) {
      hidden = false;
    }
  };
  if (pauseWhenHidden && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  const run = async () => {
    while (!closed) {
      if (pauseWhenHidden && hidden) {
        await waitVisible();
        if (closed) {
          break;
        }
      }

      controller = new AbortController();
      if (options.externalSignal) {
        options.externalSignal.addEventListener('abort', () => controller?.abort(), { once: true });
      }
      setStatus('connecting');

      let response: Response;
      try {
        response = await fetchImpl(buildStreamUrl(options.path, options.query), {
          method: 'GET',
          headers: headers(),
          credentials: 'include',
          signal: controller.signal,
        });
      } catch {
        if (closed) {
          break;
        }
        attempt += 1;
        await sleep(backoffDelay());
        continue;
      }

      if (response.status === 401) {
        // One renewal attempt; a session that can't refresh is dead — the
        // session store has already been cleared by refreshTokens().
        const fresh = closed ? null : await refreshTokens().catch(() => null);
        if (fresh) {
          continue;
        }
        setStatus('error');
        return;
      }

      if (!response.ok || !response.body) {
        if (closed) {
          break;
        }
        attempt += 1;
        await sleep(backoffDelay());
        continue;
      }

      setStatus('open');
      attempt = 0;
      const parser = createSseParser((message) => {
        if (message.id) {
          lastEventId = message.id;
        }
        options.onEvent(message);
      });

      try {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (closed) {
            await reader.cancel().catch(() => undefined);
            break;
          }
          if (done) {
            break;
          }
          parser.push(decoder.decode(value, { stream: true }));
        }
        parser.flush();
      } catch {
        // aborted (tab hidden / closed) or the connection dropped — either
        // way the loop below decides what happens next
      }

      if (closed) {
        break;
      }
      attempt += 1;
      await sleep(backoffDelay());
    }
    if (closed) {
      setStatus('closed');
    }
  };

  void run();

  return {
    close() {
      if (closed) {
        return;
      }
      closed = true;
      if (timer) {
        clearTimeout(timer);
      }
      controller?.abort();
      if (pauseWhenHidden && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
      setStatus('closed');
    },
  };
}
