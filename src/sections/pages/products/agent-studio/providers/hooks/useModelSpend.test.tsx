// @vitest-environment jsdom
/**
 * Providers Phase 7 — useModelSpend targeted tests.
 * - list query calls fetchModelSpend with (orgId, window)
 * - enabled=false / orgId=null fires no fetch
 * - returned data surfaces through the hook
 * - the queryKey is exactly ['org', orgId, 'spend', 'models', window]
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { spendKeys } from './useSpend';
import { useModelSpend } from './useModelSpend';
import type { ModelSpendResponse } from '../api';

const hoisted = vi.hoisted(() => ({
  fetchModelSpend: vi.fn(),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/api', () => ({
  fetchModelSpend: hoisted.fetchModelSpend,
}));

const modelSpend: ModelSpendResponse = {
  window: '7d',
  total_spend_usd: '12.34',
  rows: [
    {
      provider: 'openai',
      provider_display_name: 'OpenAI',
      model_id: 'gpt-4o-mini',
      model_display_name: 'GPT-4o mini',
      source: 'platform',
      requests: 100,
      prompt_tokens: 5000,
      completion_tokens: 1000,
      total_tokens: 6000,
      spend_usd: '12.34',
      pricing_basis: 'list',
      vs_last_window_pct: 25.5,
    },
  ],
};

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.fetchModelSpend.mockResolvedValue(modelSpend);
});

describe('useModelSpend', () => {
  it('calls fetchModelSpend with (orgId, window) and surfaces the data', async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useModelSpend('org-1', '7d'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(hoisted.fetchModelSpend).toHaveBeenCalledWith('org-1', '7d');
    expect(hoisted.fetchModelSpend).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(modelSpend);
  });

  it('uses the 30d window when asked', async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useModelSpend('org-1', '30d'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(hoisted.fetchModelSpend).toHaveBeenCalledWith('org-1', '30d');
  });

  it('fires no fetch when orgId is null', () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useModelSpend(null, '7d'), { wrapper: Wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(hoisted.fetchModelSpend).not.toHaveBeenCalled();
  });

  it('fires no fetch when enabled=false', () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useModelSpend('org-1', '7d', false), {
      wrapper: Wrapper,
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(hoisted.fetchModelSpend).not.toHaveBeenCalled();
  });

  it('uses the exact queryKey ["org", orgId, "spend", "models", window]', () => {
    expect(spendKeys.models('org-9', '30d')).toEqual(['org', 'org-9', 'spend', 'models', '30d']);
  });
});
