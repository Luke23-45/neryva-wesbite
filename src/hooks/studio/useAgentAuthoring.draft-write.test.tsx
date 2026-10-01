// @vitest-environment jsdom
/**
 * G-BUG7 regression: draft writes must stay pending until the base-hash
 * refresh lands.
 *
 * Root cause: useUpdateDraftVersion's onSuccess invalidated the authoring
 * queries fire-and-forget, so `isPending` flipped false the moment the PUT
 * resolved — while the refetch carrying the NEW version hash was still in
 * flight. Any save fired in that window (unmount flush on section switch,
 * manual Save signal) sent the STALE If-Match hash and raised a false 412
 * against our own write, even though both payloads were semantically
 * identical. Awaiting the invalidation keeps the mutation pending until the
 * fresh hash has landed, so the save machine's existing `pending` gates
 * (autosave debounce, unmount flush) serialize correctly.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { engine } from '@lib/engine/client';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { useAssistantVersions, useUpdateDraftVersion } from './useAgentAuthoring';

vi.mock('@lib/engine/client', () => ({ engine: vi.fn() }));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

const mockEngine = vi.mocked(engine);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useUpdateDraftVersion base-hash serialization (G-BUG7)', () => {
  beforeEach(() => {
    mockEngine.mockReset();
  });

  it('stays pending until the invalidating versions refetch resolves', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const getUrls: string[] = [];
    const putUrls: string[] = [];
    let getImpl: () => Promise<unknown> = () => Promise.resolve({ versions: [] });
    const putDeferred = deferred<unknown>();
    mockEngine.mockImplementation((url: string) => {
      if (url.endsWith('/draft')) {
        putUrls.push(url);
        return putDeferred.promise;
      }
      getUrls.push(url);
      return getImpl();
    });

    // An active observer on the versions query — without one, invalidation
    // has no refetch to await and the race this test guards would be vacuous.
    const d1 = deferred<unknown>();
    getImpl = () => d1.promise;
    const observer = renderHook(() => useAssistantVersions('a1'), { wrapper: wrapper(client) });
    await waitFor(() => expect(getUrls).toHaveLength(1));
    await act(async () => {
      d1.resolve({ versions: [] });
    });
    await waitFor(() => expect(observer.result.current.isSuccess).toBe(true));

    const writer = renderHook(() => useUpdateDraftVersion('a1', 'v1'), { wrapper: wrapper(client) });

    // Fire the save; the PUT stays unresolved until we release it.
    act(() => {
      writer.result.current.mutate({ definition: defaultConsumer(), expectedHash: 'h0' });
    });
    await waitFor(() => expect(putUrls).toHaveLength(1));
    expect(writer.result.current.isPending).toBe(true);

    // Release the PUT but hold the refetch: the mutation must STILL be
    // pending — the new version hash has not landed yet.
    const d2 = deferred<unknown>();
    getImpl = () => d2.promise;
    await act(async () => {
      putDeferred.resolve({});
    });
    await waitFor(() => expect(getUrls).toHaveLength(2));
    expect(writer.result.current.isPending).toBe(true);

    // The refetch lands with the new hash: only now may the mutation settle.
    await act(async () => {
      d2.resolve({ versions: [{ id: 'v1', status: 'DRAFT', hash: 'h1' }] });
    });
    await waitFor(() => expect(writer.result.current.isPending).toBe(false));
    expect(writer.result.current.isSuccess).toBe(true);
  });
});
