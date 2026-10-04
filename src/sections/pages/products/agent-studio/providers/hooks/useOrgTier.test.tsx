// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useOrgTier, tierCovers } from './useOrgTier';

let orgId: string | null = 'org-test';
let studioState: string = 'none';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({
    orgId,
    entitlementState: (product: string) => (product === 'agent_studio' ? studioState : 'none'),
  }),
}));

interface ProductRow {
  key: string;
  entitlement_state: string;
}

/** Seed the shared ['org','home'] cache exactly like OrgProvider would. */
function wrapperWith(products?: ProductRow[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (products !== undefined) {
    client.setQueryData(['org', 'home'], { products });
  }
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return Wrapper;
}

describe('useOrgTier', () => {
  beforeEach(() => {
    orgId = 'org-test';
    studioState = 'none';
  });

  it('returns unknown when there is no org context yet', () => {
    orgId = null;
    const { result } = renderHook(() => useOrgTier(), {
      wrapper: wrapperWith([{ key: 'agent_studio', entitlement_state: 'active' }]),
    });
    expect(result.current).toBe('unknown');
  });

  it('returns unknown while the home cache has not landed (never mislabels loading as free)', () => {
    studioState = 'none';
    const { result } = renderHook(() => useOrgTier(), { wrapper: wrapperWith(undefined) });
    expect(result.current).toBe('unknown');
  });

  it("maps studio entitlement 'none' to free", () => {
    studioState = 'none';
    const { result } = renderHook(() => useOrgTier(), {
      wrapper: wrapperWith([{ key: 'agent_studio', entitlement_state: 'none' }]),
    });
    expect(result.current).toBe('free');
  });

  it("maps studio entitlement 'active' to payg when no enterprise product is active", () => {
    studioState = 'active';
    const { result } = renderHook(() => useOrgTier(), {
      wrapper: wrapperWith([{ key: 'agent_studio', entitlement_state: 'active' }]),
    });
    expect(result.current).toBe('payg');
  });

  it('detects enterprise from any active product key containing "enterprise"', () => {
    studioState = 'active';
    const { result } = renderHook(() => useOrgTier(), {
      wrapper: wrapperWith([
        { key: 'agent_studio', entitlement_state: 'active' },
        { key: 'agent_studio_enterprise', entitlement_state: 'active' },
      ]),
    });
    expect(result.current).toBe('enterprise');
  });

  it('ignores non-active enterprise product rows', () => {
    studioState = 'active';
    const { result } = renderHook(() => useOrgTier(), {
      wrapper: wrapperWith([
        { key: 'agent_studio', entitlement_state: 'active' },
        { key: 'agent_studio_enterprise', entitlement_state: 'past_due' },
      ]),
    });
    expect(result.current).toBe('payg');
  });

  it('returns unknown for ambiguous billing states the client must not resolve', () => {
    studioState = 'past_due';
    const { result } = renderHook(() => useOrgTier(), {
      wrapper: wrapperWith([{ key: 'agent_studio', entitlement_state: 'past_due' }]),
    });
    expect(result.current).toBe('unknown');
  });
});

describe('tierCovers', () => {
  it('covers the full matrix honestly', () => {
    expect(tierCovers('free', 'free')).toBe(true);
    expect(tierCovers('free', 'payg')).toBe(false);
    expect(tierCovers('free', 'enterprise')).toBe(false);
    expect(tierCovers('payg', 'free')).toBe(true);
    expect(tierCovers('payg', 'payg')).toBe(true);
    expect(tierCovers('payg', 'enterprise')).toBe(false);
    expect(tierCovers('enterprise', 'enterprise')).toBe(true);
  });

  it("returns null for 'unknown' so callers badge without a CTA", () => {
    expect(tierCovers('unknown', 'free')).toBeNull();
    expect(tierCovers('unknown', 'enterprise')).toBeNull();
  });
});
