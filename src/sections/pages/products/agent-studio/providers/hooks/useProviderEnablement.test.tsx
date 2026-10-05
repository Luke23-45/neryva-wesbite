// @vitest-environment jsdom
/**
 * useSetProviderEnabled — the catalog ACCESS toggle:
 * - Optimistically flips connection.enabled in the directory cache.
 * - Rolls back verbatim on error.
 * - Invalidates the directory prefix on settle.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSetProviderEnabled } from './useProviderEnablement';
import { providerDirectoryKeyPrefix } from './useProviderDirectory';
import { groupedModelsKey } from './useGroupedModels';
import type { ProviderDirectoryEntry } from '../api';

const postMock = vi.hoisted(() => vi.fn());

vi.mock('../api', () => ({
  setProviderEnabled: (...args: unknown[]) => postMock(...args),
}));

function dirEntry(provider: string, enabled: boolean): ProviderDirectoryEntry {
  return {
    provider,
    display_name: provider,
    model_count: 1,
    models: [],
    door: 'platform',
    section: 'Test',
    pricing_mode: 'per_model',
    data_quality: 'complete',
    data_quality_reasons: [],
    capabilities: [],
    connection: { has_active_credential: false, enabled },
    min_required_product: 'free',
    min_required_product_label: 'Free',
  };
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const key = [...providerDirectoryKeyPrefix('org-1'), { search: '' }] as const;
  client.setQueryData(key, {
    providers: [dirEntry('openai', true), dirEntry('anthropic', false)],
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, key, wrapper };
}

beforeEach(() => {
  postMock.mockReset();
});

describe('useSetProviderEnabled', () => {
  it('optimistically flips the row and posts the enablement', async () => {
    postMock.mockResolvedValue({ enablement: { provider: 'anthropic', enabled: true } });
    const { client, key, wrapper } = setup();
    const { result } = renderHook(() => useSetProviderEnabled('org-1'), { wrapper });

    await act(async () => {
      result.current.mutate({ provider: 'anthropic', enabled: true });
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock.mock.calls[0]).toEqual(['org-1', 'anthropic', true]);

    await waitFor(() => expect(result.current.isPending).toBe(false));
    const data = client.getQueryData<{ providers: ProviderDirectoryEntry[] }>(key);
    expect(data?.providers.find((p) => p.provider === 'anthropic')?.connection.enabled).toBe(true);
    // Untouched rows are never rewritten.
    expect(data?.providers.find((p) => p.provider === 'openai')?.connection.enabled).toBe(true);
  });

  it('rolls back verbatim on error', async () => {
    postMock.mockRejectedValue(new Error('forbidden'));
    const { client, key, wrapper } = setup();
    const { result } = renderHook(() => useSetProviderEnabled('org-1'), { wrapper });

    await act(async () => {
      result.current.mutate(
        { provider: 'openai', enabled: false },
        { onError: () => undefined },
      );
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    const data = client.getQueryData<{ providers: ProviderDirectoryEntry[] }>(key);
    expect(data?.providers.find((p) => p.provider === 'openai')?.connection.enabled).toBe(true);
  });

  it('a failed toggle does not clobber a concurrent toggle', async () => {
    postMock.mockImplementation((_orgId: unknown, provider: unknown) =>
      provider === 'openai'
        ? Promise.reject(new Error('forbidden'))
        : Promise.resolve({ enablement: { provider, enabled: true } }),
    );
    const { client, key, wrapper } = setup();
    const { result } = renderHook(() => useSetProviderEnabled('org-1'), { wrapper });

    await act(async () => {
      result.current.mutate(
        { provider: 'openai', enabled: false },
        { onError: () => undefined },
      );
      result.current.mutate({ provider: 'anthropic', enabled: true });
    });

    // openai flips back only after its own failure; anthropic's optimistic
    // flip must survive the whole time — never wiped by openai's rollback.
    await waitFor(() => {
      const data = client.getQueryData<{ providers: ProviderDirectoryEntry[] }>(key);
      expect(data?.providers.find((p) => p.provider === 'openai')?.connection.enabled).toBe(true);
      expect(data?.providers.find((p) => p.provider === 'anthropic')?.connection.enabled).toBe(true);
    });
  });

  it('invalidates the grouped models query on settle (governance cascade)', async () => {
    postMock.mockResolvedValue({ enablement: { provider: 'anthropic', enabled: true } });
    const { client, wrapper } = setup();
    const spy = vi.spyOn(client, 'invalidateQueries');
    const { result } = renderHook(() => useSetProviderEnabled('org-1'), { wrapper });

    await act(async () => {
      result.current.mutate({ provider: 'anthropic', enabled: true });
    });

    await waitFor(() => expect(result.current.isPending).toBe(false));
    const keys = spy.mock.calls.map((c) => (c[0] as { queryKey: unknown }).queryKey);
    expect(keys).toContainEqual([...providerDirectoryKeyPrefix('org-1')]);
    expect(keys).toContainEqual([...groupedModelsKey('org-1')]);
  });
});
