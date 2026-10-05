// @vitest-environment jsdom
/**
 * useSpendMutations — targeted tests for the decoupled mutation wiring:
 * - patchBudget (cap save) is NEVER optimistic: the cached summary keeps the
 *   old cap until the server answers — money must not display a state the
 *   server didn't accept. Its isPending is independent of the other
 *   controls' pending states.
 * - patchBreachAction is optimistic: the cached summary flips immediately
 *   and rolls back when the server rejects.
 * - patchIncludeByok is optimistic with rollback, like the breach radio.
 * - every mutation invalidates the spend query tree on success so panels
 *   re-render from engine state.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { spendKeys, useSpendMutations } from './useSpend';
import type { SpendSummaryView } from '../api';

const ORG = 'org-1';

const hoisted = vi.hoisted(() => ({
  patchSpendBudget: vi.fn(),
  patchIncludeByokSpend: vi.fn(),
  fetchSpendSummary: vi.fn(),
  downloadSpendExport: vi.fn(),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/api', () => ({
  patchSpendBudget: (...args: unknown[]) => hoisted.patchSpendBudget(...args),
  patchIncludeByokSpend: (...args: unknown[]) => hoisted.patchIncludeByokSpend(...args),
  fetchSpendSummary: (...args: unknown[]) => hoisted.fetchSpendSummary(...args),
  downloadSpendExport: (...args: unknown[]) => hoisted.downloadSpendExport(...args),
}));

function summaryFixture(over: Partial<SpendSummaryView['budget']> = {}): SpendSummaryView {
  return {
    window: '7d',
    requests: 0,
    platform_spend_usd: '0',
    byok: { settled_usd: '0', calls: 0, fee: { calls: 0, per_call_credits: 2 } },
    providers: [],
    budget: {
      cap_usd_cents: 5000,
      used_usd: '12.40',
      include_byok_spend: false,
      breach_action: 'refuse',
      ...over,
    },
    fee_config: { byok_fee_credits_per_call: 2, payg_margin_note: '' },
  } as SpendSummaryView;
}

function deferred<T>() {
  let resolve!: (v: T | PromiseLike<T>) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const hook = renderHook(() => useSpendMutations(ORG), { wrapper });
  return { client, ...hook };
}

function cachedBudget(client: QueryClient) {
  return client.getQueryData<SpendSummaryView>(spendKeys.summary(ORG, '7d'))!.budget;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useSpendMutations cap save (patchBudget)', () => {
  it('is never optimistic: the cache keeps the old cap until the server answers', async () => {
    const d = deferred<{ cap_usd_cents: number | null; breach_action: 'refuse' | 'alert_only' }>();
    hoisted.patchSpendBudget.mockImplementation(() => d.promise);
    const { client, result } = setup();
    client.setQueryData(spendKeys.summary(ORG, '7d'), summaryFixture());

    act(() => {
      result.current.patchBudget.mutate({ cap_usd_cents: 2500 });
    });
    await waitFor(() => expect(result.current.patchBudget.isPending).toBe(true));
    // Still the old cap — no optimistic display of unaccepted money state.
    expect(cachedBudget(client).cap_usd_cents).toBe(5000);
    expect(hoisted.patchSpendBudget).toHaveBeenCalledWith(ORG, { cap_usd_cents: 2500 });

    await act(async () => {
      d.resolve({ cap_usd_cents: 2500, breach_action: 'refuse' });
    });
    await waitFor(() => expect(result.current.patchBudget.isPending).toBe(false));
    // Success invalidates the spend tree so panels re-render from engine state.
    expect(
      client.getQueryCache().find({ queryKey: spendKeys.summary(ORG, '7d') })?.state.isInvalidated,
    ).toBe(true);
  });

  it('keeps the old cap on error (nothing to roll back — nothing was shown)', async () => {
    hoisted.patchSpendBudget.mockRejectedValue(new Error('cap rejected'));
    const { client, result } = setup();
    client.setQueryData(spendKeys.summary(ORG, '7d'), summaryFixture());

    let seen: Error | null = null;
    act(() => {
      result.current.patchBudget.mutate(
        { cap_usd_cents: 2500 },
        { onError: (e) => { seen = e; } },
      );
    });
    await waitFor(() => expect(seen).not.toBeNull());
    expect((seen as unknown as Error).message).toBe('cap rejected');
    expect(cachedBudget(client).cap_usd_cents).toBe(5000);
  });

  it('has a pending state independent of the breach radio and BYOK toggle', async () => {
    const d = deferred<{ cap_usd_cents: number | null; breach_action: 'refuse' | 'alert_only' }>();
    hoisted.patchSpendBudget.mockImplementation(() => d.promise);
    const { result } = setup();

    act(() => {
      result.current.patchBudget.mutate({ cap_usd_cents: 2500 });
    });
    await waitFor(() => expect(result.current.patchBudget.isPending).toBe(true));
    // A slow cap PATCH never freezes the other money controls.
    expect(result.current.patchBreachAction.isPending).toBe(false);
    expect(result.current.patchIncludeByok.isPending).toBe(false);

    await act(async () => {
      d.resolve({ cap_usd_cents: 2500, breach_action: 'refuse' });
    });
    await waitFor(() => expect(result.current.patchBudget.isPending).toBe(false));
  });
});

describe('useSpendMutations breach action (patchBreachAction)', () => {
  it('flips the cached radio optimistically and rolls back on server rejection', async () => {
    const d = deferred<{ cap_usd_cents: number | null; breach_action: 'refuse' | 'alert_only' }>();
    hoisted.patchSpendBudget.mockImplementation(() => d.promise);
    const { client, result } = setup();
    client.setQueryData(spendKeys.summary(ORG, '7d'), summaryFixture());

    act(() => {
      result.current.patchBreachAction.mutate('alert_only');
    });
    // Optimistic flip: visible immediately, while the server is still thinking.
    await waitFor(() => expect(cachedBudget(client).breach_action).toBe('alert_only'));
    expect(hoisted.patchSpendBudget).toHaveBeenCalledWith(ORG, { breach_action: 'alert_only' });
    // The cap control is unaffected by the radio's pending state.
    expect(result.current.patchBudget.isPending).toBe(false);

    // Server rejected → rollback restores 'refuse'.
    await act(async () => {
      d.reject(new Error('radio rejected'));
    });
    await waitFor(() => expect(cachedBudget(client).breach_action).toBe('refuse'));
  });

  it('keeps the optimistic flip on success and invalidates the spend tree', async () => {
    hoisted.patchSpendBudget.mockResolvedValue({ cap_usd_cents: 5000, breach_action: 'alert_only' });
    const { client, result } = setup();
    client.setQueryData(spendKeys.summary(ORG, '7d'), summaryFixture());

    act(() => {
      result.current.patchBreachAction.mutate('alert_only');
    });
    await waitFor(() => expect(result.current.patchBreachAction.isPending).toBe(false));
    expect(cachedBudget(client).breach_action).toBe('alert_only');
    expect(
      client.getQueryCache().find({ queryKey: spendKeys.summary(ORG, '7d') })?.state.isInvalidated,
    ).toBe(true);
  });
});

describe('useSpendMutations BYOK toggle (patchIncludeByok)', () => {
  it('is optimistic with rollback, like the breach radio', async () => {
    const d = deferred<Record<string, unknown>>();
    hoisted.patchIncludeByokSpend.mockImplementation(() => d.promise);
    const { client, result } = setup();
    client.setQueryData(spendKeys.summary(ORG, '7d'), summaryFixture());

    act(() => {
      result.current.patchIncludeByok.mutate(true);
    });
    await waitFor(() => expect(cachedBudget(client).include_byok_spend).toBe(true));
    expect(hoisted.patchIncludeByokSpend).toHaveBeenCalledWith(ORG, true);

    await act(async () => {
      d.reject(new Error('toggle rejected'));
    });
    await waitFor(() => expect(cachedBudget(client).include_byok_spend).toBe(false));
  });

  it('per-key rollback: a failed breach flip does not clobber an in-flight BYOK flip', async () => {
    const dBreach = deferred<{ cap_usd_cents: number | null; breach_action: 'refuse' | 'alert_only' }>();
    const dByok = deferred<Record<string, unknown>>();
    hoisted.patchSpendBudget.mockImplementation(() => dBreach.promise);
    hoisted.patchIncludeByokSpend.mockImplementation(() => dByok.promise);
    const { client, result } = setup();
    client.setQueryData(spendKeys.summary(ORG, '7d'), summaryFixture());

    // Both flips in flight: breach first, then BYOK.
    act(() => {
      result.current.patchBreachAction.mutate('alert_only');
    });
    await waitFor(() => expect(cachedBudget(client).breach_action).toBe('alert_only'));
    act(() => {
      result.current.patchIncludeByok.mutate(true);
    });
    await waitFor(() => expect(cachedBudget(client).include_byok_spend).toBe(true));

    // The breach flip fails: only breach_action rolls back. The BYOK flip is
    // still in flight and must keep its optimistic value (a whole-object
    // rollback would restore the pre-BYK snapshot and clobber it).
    await act(async () => {
      dBreach.reject(new Error('radio rejected'));
    });
    await waitFor(() => expect(cachedBudget(client).breach_action).toBe('refuse'));
    expect(cachedBudget(client).include_byok_spend).toBe(true);

    // Clean up: let the BYOK flip succeed.
    await act(async () => {
      dByok.resolve({});
    });
    await waitFor(() => expect(result.current.patchIncludeByok.isPending).toBe(false));
    expect(cachedBudget(client).include_byok_spend).toBe(true);
  });
});
