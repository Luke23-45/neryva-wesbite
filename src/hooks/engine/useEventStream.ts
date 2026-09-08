/**
 * React binding over `connectEventStream` (F-11): lifecycle-managed SSE for
 * live surfaces (run events, activity tails). Callbacks are held in refs so
 * consumers can pass inline lambdas without resubscribing the stream.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { connectEventStream, type SseMessage, type StreamStatus } from '@lib/engine/sse';

type StreamQuery = Record<string, string | number | boolean | undefined>;

export function useEventStream(options: {
  path: string;
  query?: StreamQuery;
  /** false parks the stream (no connection) — e.g. before a run exists. */
  enabled?: boolean;
  onEvent: (message: SseMessage) => void;
  onStatus?: (status: StreamStatus) => void;
}): StreamStatus {
  const { path, query, enabled = true } = options;
  const [status, setStatus] = useState<StreamStatus>('closed');
  const onEventRef = useRef(options.onEvent);
  const onStatusRef = useRef(options.onStatus);
  // Latest-ref pattern: sync inside an effect so render stays pure.
  useEffect(() => {
    onEventRef.current = options.onEvent;
    onStatusRef.current = options.onStatus;
  });

  // The query object participates in the connect effect through a JSON
  // identity: callers can pass inline literals without resubscribing.
  const queryJson = JSON.stringify(query ?? null);
  const stableQuery = useMemo<StreamQuery | undefined>(
    () => (queryJson === 'null' ? undefined : (JSON.parse(queryJson) as StreamQuery)),
    [queryJson],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const handle = connectEventStream({
      path,
      query: stableQuery,
      onEvent: (message) => onEventRef.current(message),
      onStatus: (next) => {
        setStatus(next);
        onStatusRef.current?.(next);
      },
    });
    return () => handle.close();
  }, [path, stableQuery, enabled]);

  // A parked stream reports closed without a state round-trip.
  return enabled ? status : 'closed';
}
