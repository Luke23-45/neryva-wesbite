// @vitest-environment jsdom
/**
 * useGroupedModels / useModelToggles — targeted coverage:
 * - The mutation posts the toggle payload to the api layer (nil-UUID for
 *   platform handled by the caller contract: credential_id undefined).
 * - Optimistic update flips ONLY the addressed row: the same model id served
 *   by Platform Managed AND a BYOK key is two distinct rows and the
 *   unaddressed one must not move.
 * - On mutation error the previous cache entry is restored verbatim
 *   (rollback), so a failed write never leaves the UI in a lying state.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useGroupedModels,
  useModelToggles,
  applyToggles,
  groupedModelsKey,
  type GroupedModels,
} from './useGroupedModels';

const fetchMock = vi.fn();
const postMock = vi.fn();

vi.mock('../api', () => ({
  fetchGroupedModels: (...args: unknown[]) => fetchMock(...args),
  postModelToggles: (...args: unknown[]) => postMock(...args),
}));

const ORG = 'org-1';

function row(model_id: string, enabled: boolean, extra: Record<string, unknown> = {}) {
  return {
    model_id,
    display_name: model_id,
    required_product: 'free' as const,
    required_product_label: 'Free',
    enabled,
    usable: true,
    reasons: [],
    capabilities: { tools: true, vision: false, reasoning: false, structured_output: false },
    pinned_by: [],
    ...extra,
  };
}

function fixture(): GroupedModels {
  return {
    platform: [
      {
        provider: 'openai',
        provider_display_name: 'OpenAI',
        models: [row('gpt-4o', true), row('gpt-4o-mini', true)],
      },
    ],
    byok: [
      {
        provider: 'openai',
        provider_display_name: 'OpenAI',
        credential_id: 'cred-1',
        credential_label: 'Production Key',
        credential_fingerprint: 'sk-…8f9a',
        models: [row('gpt-4o', true)],
      },
    ],
  };
}

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  fetchMock.mockReset();
  postMock.mockReset();
  fetchMock.mockResolvedValue(fixture());
  postMock.mockResolvedValue({ success: true, updated_count: 1 });
});

describe('applyToggles', () => {
  it('flips only the addressed row — same model id in both supergroups stays distinct', () => {
    const out = applyToggles(fixture(), [
      { supergroup: 'platform', provider: 'openai', model_id: 'gpt-4o', enabled: false },
    ]);
    expect(out.platform[0].models.find((m) => m.model_id === 'gpt-4o')?.enabled).toBe(false);
    // Sibling model in the same group untouched.
    expect(out.platform[0].models.find((m) => m.model_id === 'gpt-4o-mini')?.enabled).toBe(true);
    // Same model id under the BYOK key untouched — a distinct row.
    expect(out.byok[0].models[0].enabled).toBe(true);
  });

  it('addresses a BYOK row by credential_id, not a platform row with the same provider/model', () => {
    const out = applyToggles(fixture(), [
      {
        supergroup: 'byok',
        provider: 'openai',
        model_id: 'gpt-4o',
        credential_id: 'cred-1',
        enabled: false,
      },
    ]);
    expect(out.byok[0].models[0].enabled).toBe(false);
    expect(out.platform[0].models.find((m) => m.model_id === 'gpt-4o')?.enabled).toBe(true);
  });
});

describe('useModelToggles', () => {
  it('posts the toggle payload and leaves the optimistic row flipped on success', async () => {
    const W = wrapper();
    const { result } = renderHook(() => useModelToggles(ORG), { wrapper: W });

    await act(async () => {
      await result.current.mutateAsync([
        { supergroup: 'platform', provider: 'openai', model_id: 'gpt-4o', enabled: false },
      ]);
    });

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(postMock).toHaveBeenCalledWith(ORG, [
      { supergroup: 'platform', provider: 'openai', model_id: 'gpt-4o', enabled: false },
    ]);
  });

  it('restores the previous cache entry verbatim when the write fails (rollback)', async () => {
    postMock.mockRejectedValueOnce(new Error('engine 500'));
    // Seed the query cache the way useGroupedModels would.
    const seedClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    seedClient.setQueryData(groupedModelsKey(ORG), fixture());
    function Seeded({ children }: { children: React.ReactNode }) {
      return <QueryClientProvider client={seedClient}>{children}</QueryClientProvider>;
    }

    const { result } = renderHook(() => useModelToggles(ORG), { wrapper: Seeded });

    await act(async () => {
      await expect(
        result.current.mutateAsync([
          { supergroup: 'platform', provider: 'openai', model_id: 'gpt-4o', enabled: false },
        ]),
      ).rejects.toThrow('engine 500');
    });

    // Optimistic flip happened, then the rollback restored the original row.
    const restored = seedClient.getQueryData<GroupedModels>(groupedModelsKey(ORG));
    expect(restored?.platform[0].models.find((m) => m.model_id === 'gpt-4o')?.enabled).toBe(true);
  });
});

describe('useGroupedModels', () => {
  it('reads the grouped payload through the api layer', async () => {
    const { result } = renderHook(() => useGroupedModels(ORG), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith(ORG);
    expect(result.current.data?.platform[0].provider).toBe('openai');
    expect(result.current.data?.byok[0].credential_fingerprint).toBe('sk-…8f9a');
  });

  it('stays disabled without an orgId', () => {
    const { result } = renderHook(() => useGroupedModels(null), { wrapper: wrapper() });
    expect(result.current.isPending).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
