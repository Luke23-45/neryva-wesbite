// @vitest-environment jsdom
/**
 * MyProvidersPage — targeted tests (ported from the retired TabMyProviders suite).
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
import { MyProvidersPage } from './MyProvidersPage';
import type { ProviderCredentialView } from '@/sections/pages/products/agent-studio/providers/api';

const hoisted = vi.hoisted(() => ({
  tier: 'payg' as string,
  credentials: [] as ProviderCredentialView[],
  patchMutate: vi.fn(),
  patchMutateAsync: vi.fn(async () => ({})),
  reorderMutate: vi.fn(),
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
    patch: { mutate: hoisted.patchMutate, isPending: false, mutateAsync: hoisted.patchMutateAsync },
    verify: { mutate: vi.fn(), isPending: false, mutateAsync: vi.fn() },
    rotate: { mutate: vi.fn(), isPending: false, mutateAsync: vi.fn() },
    revoke: { mutate: vi.fn(), isPending: false, mutateAsync: vi.fn() },
  }),
  useOptimisticEnabledToggle: () => ({ mutate: vi.fn(), isPending: false }),
  usePatchCredentialField: () => ({ mutate: vi.fn(), isPending: false }),
  useReorderPriorities: () => ({ mutate: hoisted.reorderMutate, isPending: false }),
  useAssistantRefs: () => ({ data: { assistants: [] }, isLoading: false, isError: false }),
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
    provider_display_name: 'OpenAI',
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

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <MyProvidersPage />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.tier = 'payg';
  hoisted.credentials = [];
});

describe('MyProvidersPage', () => {
  it('empty state shows both actions with the same labels and emphasis as the header', () => {
    renderPage();
    expect(screen.getByText('No providers connected')).toBeTruthy();
    // Header action + empty-state action.
    expect(screen.getAllByRole('button', { name: '+ Connect a key' })).toHaveLength(2);
    // Identical labels in both places: "Connect Custom Endpoint" + the Enterprise pill.
    expect(screen.getAllByRole('link', { name: /Connect Custom Endpoint/ })).toHaveLength(2);
    expect(screen.getAllByText('Enterprise')).toHaveLength(2);
  });

  it('free tier renders the nothing-to-manage note', () => {
    hoisted.tier = 'free';
    renderPage();
    expect(screen.getByText(/nothing to connect or manage here/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: '+ Connect a key' })).toBeNull();
  });

  it('renders cards sorted by priority', () => {
    hoisted.credentials = [cred('c2', 1), cred('c1', 0)];
    renderPage();
    const cards = screen.getAllByLabelText(/API key: Key /);
    expect(cards[0].getAttribute('aria-label')).toBe('API key: Key c1');
    expect(cards[1].getAttribute('aria-label')).toBe('API key: Key c2');
  });

  it('priority move applies the full group order via one atomic reorder call', async () => {
    hoisted.credentials = [cred('c1', 0), cred('c2', 1)];
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Move Key c1 down' }));
    // P1-3: a single request carries the group's full new order — the
    // engine applies it in one transaction. No two-PATCH swap anymore.
    await vi.waitFor(() => expect(hoisted.reorderMutate).toHaveBeenCalledTimes(1));
    expect(hoisted.reorderMutate).toHaveBeenCalledWith(
      [
        { id: 'c2', priority: 0 },
        { id: 'c1', priority: 1 },
      ],
      expect.anything(),
    );
    expect(hoisted.patchMutate).not.toHaveBeenCalled();
    expect(hoisted.patchMutateAsync).not.toHaveBeenCalled();
  });

  it('alerts loudly when the atomic reorder fails (hook rolls back)', async () => {
    hoisted.credentials = [cred('c1', 0), cred('c2', 1)];
    hoisted.reorderMutate.mockImplementation((_items: unknown, opts?: { onError?: (e: Error) => void }) =>
      opts?.onError?.(new Error('boom')),
    );
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Move Key c1 down' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent(/Reorder failed/);
  });

  it('renders the skeleton while the tier is still resolving', () => {
    hoisted.tier = 'unknown';
    hoisted.credentials = [cred('c1', 0)];
    renderPage();
    expect(screen.getByLabelText('Loading providers')).toBeTruthy();
    expect(screen.queryByText('Key c1')).toBeNull();
    hoisted.tier = 'payg';
  });

  it('opening + Connect a key shows the verify-first form', () => {
    renderPage();
    fireEvent.click(screen.getAllByRole('button', { name: '+ Connect a key' })[0]);
    expect(screen.getByLabelText('Connect API key form')).toBeTruthy();
    // Connect is disabled until a successful probe.
    expect(screen.getByRole('button', { name: 'Connect key' })).toBeDisabled();
  });

  it('renders provider subheaders in alphabetical order with honest counts', () => {
    hoisted.credentials = [
      cred('a1', 0, { provider: 'openai', provider_display_name: 'OpenAI' }),
      cred('b1', 0, { provider: 'anthropic', provider_display_name: 'Anthropic' }),
      cred('a2', 1, { provider: 'openai', provider_display_name: 'OpenAI' }),
    ];
    renderPage();
    const anthropic = screen.getByText('Anthropic · 1 key');
    const openai = screen.getByText('OpenAI · 2 keys');
    expect(anthropic.compareDocumentPosition(openai) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('reorder with TIED priorities sends distinct priorities reflecting the new display order (Round 2 P0)', async () => {
    // Every UI-created credential shares the engine default priority 0 —
    // the old value-trading swap re-sent an identical map here (the engine
    // 200s, nothing moves, no error). Index-based re-basing must produce
    // an actual order change.
    hoisted.credentials = [cred('c1', 0), cred('c2', 0)];
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Move Key c1 down' }));
    await vi.waitFor(() => expect(hoisted.reorderMutate).toHaveBeenCalledTimes(1));
    const items = hoisted.reorderMutate.mock.calls[0][0] as Array<{ id: string; priority: number }>;
    // New display order is c2-then-c1, carried by DISTINCT priorities.
    expect(items).toEqual([
      { id: 'c2', priority: 0 },
      { id: 'c1', priority: 1 },
    ]);
    expect(new Set(items.map((i) => i.priority)).size).toBe(items.length);
  });

  it('keyboard reorder never crosses provider boundaries', async () => {    hoisted.credentials = [
      cred('a1', 0, { provider: 'anthropic', provider_display_name: 'Anthropic' }),
      cred('o1', 0, { provider: 'openai', provider_display_name: 'OpenAI' }),
      cred('o2', 1, { provider: 'openai', provider_display_name: 'OpenAI' }),
    ];
    renderPage();
    // a1 is alone in its group: moving down is a no-op (the old global
    // code would have swapped its priority with o1's).
    fireEvent.click(screen.getByRole('button', { name: 'Move Key a1 down' }));
    expect(hoisted.reorderMutate).not.toHaveBeenCalled();
    // o1 moves down within openai: one atomic call with the group's full
    // new order (o2 takes priority 0, o1 takes priority 1).
    fireEvent.click(screen.getByRole('button', { name: 'Move Key o1 down' }));
    await vi.waitFor(() => expect(hoisted.reorderMutate).toHaveBeenCalledTimes(1));
    expect(hoisted.reorderMutate).toHaveBeenCalledWith(
      [
        { id: 'o2', priority: 0 },
        { id: 'o1', priority: 1 },
      ],
      expect.anything(),
    );
  });

  it('shows the Edit endpoint entry point only on non-revoked custom cards (Round 2 P0)', () => {
    hoisted.credentials = [
      cred('custom-1', 0, { provider: 'acme', base_url: 'https://llm.example.com/v1' }),
      cred('std-1', 0, { provider: 'openai', base_url: null }),
      cred('custom-revoked', 0, {
        provider: 'acme',
        base_url: 'https://llm.example.com/v1',
        status: 'revoked',
        revoked_at: '2026-10-02T00:00:00Z',
      }),
    ];
    renderPage();
    // Exactly one card gets the entry point: the live custom one. The
    // standard card (no base_url) and the revoked custom card don't.
    expect(screen.getAllByRole('link', { name: /Edit endpoint/ })).toHaveLength(1);
  });
});
