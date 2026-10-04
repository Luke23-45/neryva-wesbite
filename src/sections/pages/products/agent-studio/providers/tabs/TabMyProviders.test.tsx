// @vitest-environment jsdom
/**
 * Providers Phase 5 — Wave B: TabMyProviders targeted tests.
 * - empty state renders the two primary actions
 * - free tier renders the honest nothing-to-manage note
 * - cards render sorted by priority
 * - priority move swaps via patch
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { TabMyProviders } from './TabMyProviders';
import type { ProviderCredentialView } from '@/sections/pages/products/agent-studio/providers/api';

const hoisted = vi.hoisted(() => ({
  tier: 'payg' as string,
  credentials: [] as ProviderCredentialView[],
  patchMutate: vi.fn(),
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-1' }),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/hooks/useOrgTier', () => ({
  useOrgTier: () => hoisted.tier,
}));

vi.mock('@/sections/pages/products/agent-studio/providers/hooks/useProviderCredentials', () => ({
  useCredentials: () => ({
    data: { credentials: hoisted.credentials },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCredentialMutations: () => ({
    create: { mutate: vi.fn(), isPending: false },
    patch: { mutate: hoisted.patchMutate, isPending: false, mutateAsync: vi.fn() },
    verify: { mutate: vi.fn(), isPending: false, mutateAsync: vi.fn() },
    rotate: { mutate: vi.fn(), isPending: false, mutateAsync: vi.fn() },
    revoke: { mutate: vi.fn(), isPending: false, mutateAsync: vi.fn() },
  }),
  useCredentialUsage: () => ({ data: undefined, isLoading: false }),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/sections/pages/products/agent-studio/providers/api')>();
  return { ...original, fetchGroupedModels: vi.fn().mockResolvedValue({ platform: [], byok: [] }) };
});

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, style }: { to: string; children: React.ReactNode; style?: React.CSSProperties }) => (
    <a href={to} style={style}>
      {children}
    </a>
  ),
}));

function cred(id: string, priority: number, overrides: Partial<ProviderCredentialView> = {}): ProviderCredentialView {
  return {
    id,
    provider: 'openai',
    label: `Key ${id}`,
    external_ref: id,
    source: 'byok',
    status: 'active',
    secret_fingerprint: `sk-…${id.slice(-4)}`,
    created_at: '2026-10-01T00:00:00Z',
    rotated_at: null,
    revoked_at: null,
    revocation_reason: null,
    compromised: false,
    priority,
    enabled: true,
    allowed_models: null,
    allowed_assistants: null,
    shared_capacity_fallback: 'use_shared',
    transport: 'openai-compatible',
    base_url: null,
    custom_header_names: null,
    verification_status: 'verified',
    verified_at: '2026-10-01T00:00:00Z',
    last_probe_latency_ms: 100,
    discovered_models: [],
    zdr_attestation: null,
    region_attestation: null,
    attested_by: null,
    attested_at: null,
    manual_model_declarations: [],
    ...overrides,
  };
}

function renderTab() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <TabMyProviders />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.tier = 'payg';
  hoisted.credentials = [];
});

describe('TabMyProviders', () => {
  it('empty state shows both primary actions', () => {
    renderTab();
    expect(screen.getByText('No API keys connected')).toBeTruthy();
    // Header action + empty-state action.
    expect(screen.getAllByRole('button', { name: 'Connect API Key' })).toHaveLength(2);
    expect(screen.getByRole('link', { name: /Connect Custom Endpoint \(Enterprise\)/ })).toBeTruthy();
  });

  it('free tier renders the nothing-to-manage note', () => {
    hoisted.tier = 'free';
    renderTab();
    expect(screen.getByText(/nothing to connect or manage here/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Connect API Key' })).toBeNull();
  });

  it('renders cards sorted by priority', () => {
    hoisted.credentials = [cred('c2', 1), cred('c1', 0)];
    renderTab();
    const cards = screen.getAllByLabelText(/API key: Key /);
    expect(cards[0].getAttribute('aria-label')).toBe('API key: Key c1');
    expect(cards[1].getAttribute('aria-label')).toBe('API key: Key c2');
  });

  it('priority move swaps priorities via patch', () => {
    hoisted.credentials = [cred('c1', 0), cred('c2', 1)];
    renderTab();
    fireEvent.click(screen.getByRole('button', { name: 'Move Key c1 down' }));
    expect(hoisted.patchMutate).toHaveBeenCalledWith(
      { id: 'c1', patch: { priority: 1 } },
      expect.anything(),
    );
  });

  it('opening Connect API Key shows the verify-first form', () => {
    renderTab();
    fireEvent.click(screen.getAllByRole('button', { name: 'Connect API Key' })[0]);
    expect(screen.getByLabelText('Connect API key form')).toBeTruthy();
    // Connect is disabled until a successful probe.
    expect(screen.getByRole('button', { name: 'Connect key' })).toBeDisabled();
  });
});
