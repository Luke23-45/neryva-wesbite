// @vitest-environment jsdom
/**
 * useOrgDefaultModel — targeted coverage:
 * - Returns the org default { provider, model_id } from the api layer.
 * - A null default and a failed fetch surface honestly (data.default null /
 *   isError) — the setup flow falls back to existing behavior in both cases.
 * - Never fires without an org id.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrgDefaultModel, orgDefaultModelKey } from './useOrgDefaultModel';

const fetchMock = vi.fn();

vi.mock('../api', () => ({
  fetchModelDefault: (...args: unknown[]) => fetchMock(...args),
}));

const ORG = 'org-1';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: ORG, role: 'owner' }),
}));

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  fetchMock.mockReset();
});

describe('useOrgDefaultModel', () => {
  it('returns the org default ref from the engine', async () => {
    fetchMock.mockResolvedValue({ default: { provider: 'openai', model_id: 'gpt-4o-mini' } });
    const { result } = renderHook(() => useOrgDefaultModel(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock).toHaveBeenCalledWith(ORG);
    expect(result.current.data).toEqual({ default: { provider: 'openai', model_id: 'gpt-4o-mini' } });
  });

  it('surfaces a null default honestly — no invented selection', async () => {
    fetchMock.mockResolvedValue({ default: null });
    const { result } = renderHook(() => useOrgDefaultModel(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.default).toBeNull();
  });

  it('surfaces fetch failure as an error — callers fall back, never invent', async () => {
    fetchMock.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useOrgDefaultModel(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeUndefined();
  });

  it('uses the org-scoped query key', () => {
    expect(orgDefaultModelKey(ORG)).toEqual(['org', ORG, 'models', 'default']);
  });

  it('does not fetch when disabled', async () => {
    fetchMock.mockResolvedValue({ default: null });
    renderHook(() => useOrgDefaultModel({ enabled: false }), { wrapper: wrapper() });
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
