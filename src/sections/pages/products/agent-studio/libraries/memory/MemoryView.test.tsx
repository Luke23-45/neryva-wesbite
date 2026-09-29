// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { MemoryView } from './MemoryView';

let mockRole: string | null = 'owner';
const deleteMutate = vi.fn();
const purgeMutate = vi.fn();

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

const ROWS = [
  { id: 'm1', content: 'Ships on Fridays; freeze Thursdays', scopeType: 'organization', scopeId: null, visibility: 'organization', expiresAt: new Date(Date.now() + 27 * 86_400_000).toISOString(), createdAt: '2026-09-10T00:00:00Z', sourceRef: null, provenance: 'user_authored', confidence: 1, validFrom: '2026-09-10T00:00:00Z', invalidAt: null, supersedes: null, embeddingModel: 'granted-embed-3', updatedAt: '2026-09-10T00:00:00Z' },
  { id: 'm2', content: 'Prefers morning standup notes', scopeType: 'user', scopeId: 'user-9', visibility: 'private', expiresAt: null, createdAt: '2026-09-12T00:00:00Z', sourceRef: { proposal_id: 'p-1' }, provenance: 'memory_proposal', confidence: '0.920', validFrom: null, invalidAt: null, supersedes: null, embeddingModel: null, updatedAt: null },
  { id: 'm3', content: 'Assistant checkout playbook', scopeType: 'assistant', scopeId: 'agent-9', visibility: 'private', expiresAt: '2026-01-01T00:00:00Z', createdAt: '2026-05-01T00:00:00Z', sourceRef: null, provenance: null, confidence: null, validFrom: null, invalidAt: null, supersedes: null, embeddingModel: null, updatedAt: null },
];

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return {
    ...actual,
    useMemories: (scopeType?: string, scopeId?: string) => ({
      data: ROWS.filter((r) => (scopeType ? r.scopeType === scopeType : true) && (scopeId ? r.scopeId === scopeId : true)),
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    }),
    useCreateMemory: () => ({ mutate: vi.fn(), isPending: false }),
    useDeleteMemory: () => ({ mutate: deleteMutate, isPending: false }),
    usePurgeMemories: () => ({ mutate: purgeMutate, isPending: false }),
    useOrgMemoryPolicy: () => ({ policy: { scrub: 'redact', ttlSeconds: 2_592_000 }, isPending: false, isError: false }),
  };
});

async function shell() {
  const rootRoute = createRootRoute();
  const librariesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/memory',
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => librariesRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <MemoryView />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  // Stubs for the Phase 3 section routes (wired by the coordinator at review).
  const newRoute = createRoute({
    getParentRoute: () => librariesRoute,
    path: '/new',
    component: () => <div>new memory section</div>,
  });
  const detailRoute = createRoute({
    getParentRoute: () => librariesRoute,
    path: '/$memoryId',
    component: () => <div>memory detail section</div>,
  });
  const editRoute = createRoute({
    getParentRoute: () => librariesRoute,
    path: '/$memoryId/edit',
    component: () => <div>memory edit section</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([librariesRoute.addChildren([indexRoute, newRoute, detailRoute, editRoute])]),
    history: createMemoryHistory({ initialEntries: ['/agent-studio/memory'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  deleteMutate.mockReset();
  purgeMutate.mockReset();
  window.history.replaceState(null, '', '/');
});

describe('MemoryView library page (C08)', () => {
  it('renders the policy strip and org rows with relative dates', async () => {
    await shell();
    expect(screen.getByText(/PII scrubbed before embedding/)).toBeTruthy();
    expect(screen.getByText(/Default TTL: 30 days/)).toBeTruthy();
    expect(screen.getByText(/Ships on Fridays/)).toBeTruthy();
    expect(screen.getByText(/in 27 days/)).toBeTruthy();
    // Other scopes stay behind their own filter.
    expect(screen.queryByText(/morning standup/)).toBeNull();
  });

  it('searches content with an empty-state on no match', async () => {
    await shell();
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/Search content/), { target: { value: 'fridays' } });
    });
    expect(screen.getByText(/Ships on Fridays/)).toBeTruthy();
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/Search content/), { target: { value: 'zzz-no-match' } });
    });
    expect(screen.getByText(/No memories match this search/)).toBeTruthy();
  });

  it('Detail navigates to the dedicated section (no modal)', async () => {
    const router = await shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Detail' }));
    });
    expect(router.state.location.pathname).toBe('/agent-studio/memory/m1');
    expect(screen.getByText('memory detail section')).toBeTruthy();
  });

  it('New memory navigates to the composer section (no modal)', async () => {
    const router = await shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'New memory' }));
    });
    expect(router.state.location.pathname).toBe('/agent-studio/memory/new');
    expect(screen.getByText('new memory section')).toBeTruthy();
  });

  it('shows scope ids behind the assistant filter, narrowable by deep-link', async () => {
    window.history.replaceState(null, '', '/?scope=assistant&scope_id=agent-9');
    await shell();
    expect(screen.getByText(/Assistant checkout playbook/)).toBeTruthy();
    expect(screen.getByText(/agent-9/)).toBeTruthy();
    expect(screen.queryByText(/Ships on Fridays/)).toBeNull();
  });

  it('deletes one row at a time with an audited confirm', async () => {
    await shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    });
    expect(screen.getByText(/tombstoned/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete memory' }));
    });
    expect(deleteMutate).toHaveBeenCalledTimes(1);
    expect(vi.mocked(deleteMutate).mock.calls[0]?.[0]).toBe('m1');
  });

  it('purges by text with bounds, then reports the tombstoned count', async () => {
    purgeMutate.mockImplementation((_input, opts?: { onSuccess?: (data: { purged: number }) => void }) =>
      opts?.onSuccess?.({ purged: 14 }),
    );
    await shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Purge by text/ }));
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Text to purge'), { target: { value: 'ab' } });
    });
    expect(screen.getByText(/3–128 characters/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Purge matches' })).toHaveProperty('disabled', true);
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Text to purge'), { target: { value: 'acme-contract-2024' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Purge matches' }));
    });
    expect(purgeMutate).toHaveBeenCalledTimes(1);
    expect(vi.mocked(purgeMutate).mock.calls[0]?.[0]).toBe('acme-contract-2024');
    expect(screen.getByText(/Purged 14 memories/)).toBeTruthy();
    expect(screen.getByText(/never stored/)).toBeTruthy();
  });

  it('gates purge and delete for readers with named roles', async () => {
    mockRole = 'reader';
    await shell();
    expect(screen.getByRole('button', { name: /Purge by text/ })).toHaveProperty('disabled', true);
    const row = screen.getByText(/Ships on Fridays/).parentElement?.parentElement as HTMLElement;
    expect(within(row).getByRole('button', { name: 'Delete' })).toHaveProperty('disabled', true);
  });
});
