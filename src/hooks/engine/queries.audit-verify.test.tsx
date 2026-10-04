import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-1', role: 'owner', orgs: [], name: null }),
}));

const engineMock = vi.fn();
vi.mock('@lib/engine/client', () => ({
  engine: (...args: unknown[]) => engineMock(...args),
}));

import { useAuditVerify } from './queries';

/**
 * P2-4 — the console never called `GET /console/org/:orgId/audit/verify`,
 * so the "hash-chained … with receipts" subtitle described an unverified
 * property. The hook is the view's contract with that endpoint: disabled
 * by default (on-demand refetch), typed `{ ok, checked, first_break }`.
 */
function Wrapper({ children }: { children: ReactNode }) {
  // One client per hook mount — creating it inline would wipe the query
  // cache on every re-render and `result.current.data` would never settle.
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useAuditVerify', () => {
  beforeEach(() => {
    engineMock.mockReset();
  });

  it('does not fetch on mount (on-demand only)', () => {
    engineMock.mockResolvedValue({ ok: true, checked: 500, first_break: null });
    renderHook(() => useAuditVerify(), { wrapper: Wrapper });
    expect(engineMock).not.toHaveBeenCalled();
  });

  it('calls the verify endpoint for the active org on refetch', async () => {
    engineMock.mockResolvedValue({ ok: true, checked: 500, first_break: null });
    const { result } = renderHook(() => useAuditVerify(), { wrapper: Wrapper });

    const res = await result.current.refetch();

    expect(engineMock).toHaveBeenCalledTimes(1);
    expect(engineMock).toHaveBeenCalledWith('/console/org/org-1/audit/verify');
    expect(res.data).toEqual({ ok: true, checked: 500, first_break: null });
  });

  it('surfaces a chain break with the first_break position', async () => {
    engineMock.mockResolvedValue({ ok: false, checked: 500, first_break: 'evt-abc123' });
    const { result } = renderHook(() => useAuditVerify(), { wrapper: Wrapper });

    // The query is disabled by default: the view consumes the refetch
    // promise (see ActivityView), so the test asserts on that contract —
    // the observer's `data` does not settle for a disabled query in v5.
    const res = await result.current.refetch();

    expect(res.data).toEqual({ ok: false, checked: 500, first_break: 'evt-abc123' });
  });

  it('does not retry a failed verification', async () => {
    engineMock.mockRejectedValue(new Error('Forbidden'));
    const { result } = renderHook(() => useAuditVerify(), { wrapper: Wrapper });

    const res = await result.current.refetch();

    expect(res.isError).toBe(true);
    expect(engineMock).toHaveBeenCalledTimes(1);
  });
});
