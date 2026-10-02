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
const expireMutate = vi.fn();

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
    useExpireMemory: () => ({ mutate: expireMutate, isPending: false }),
    usePurgeMemories: () => ({ mutate: purgeMutate, isPending: false }),
    useMemoryCounts: () => ({
      data: { organization: 1, user: 1, assistant: 1 },
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    }),
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
  expireMutate.mockReset();
  window.history.replaceState(null, '', '/');
});

describe('MemoryView library page (C08)', () => {
  it('renders the policy strip and org rows with TTL pills', async () => {
    await shell();
    expect(screen.getAllByText(/PII scrubbed before embedding/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/30 days/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Ships on Fridays/)).toBeTruthy();
    // 27-day TTL renders as a pill (in 27d, or in 26d at the day boundary).
    expect(screen.getByText(/in 2[67]d/)).toBeTruthy();
    // Other scopes stay behind their own filter.
    expect(screen.queryByText(/morning standup/)).toBeNull();
  });

  it('shows scope counts on the tabs', async () => {
    await shell();
    expect(screen.getByRole('tab', { name: /Organization · 1/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /User · 1/ })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /Assistant · 1/ })).toBeTruthy();
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

  it('expands a row to show the detail panel with actions', async () => {
    await shell();
    await act(async () => {
      fireEvent.click(screen.getByText(/Ships on Fridays/));
    });
    // Detail panel shows scope, visibility, author, source.
    expect(screen.getByText(/SCOPE/)).toBeTruthy();
    expect(screen.getByText(/VISIBILITY/)).toBeTruthy();
    // Row actions are in the expanded panel.
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Expire now' })).toBeTruthy();
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
    // Expand the row to reveal the Delete action.
    await act(async () => {
      fireEvent.click(screen.getByText(/Ships on Fridays/));
    });
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

  it('expires a memory immediately with a confirm', async () => {
    await shell();
    await act(async () => {
      fireEvent.click(screen.getByText(/Ships on Fridays/));
    });
    const expireButtons = screen.getAllByRole('button', { name: 'Expire now' });
    await act(async () => {
      fireEvent.click(expireButtons[0]);
    });
    expect(screen.getByText(/Expire this memory now/)).toBeTruthy();
    // The confirm dialog has its own Expire now button.
    const confirmButtons = screen.getAllByRole('button', { name: 'Expire now' });
    await act(async () => {
      fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    });
    expect(expireMutate).toHaveBeenCalledTimes(1);
    expect(vi.mocked(expireMutate).mock.calls[0]?.[0]).toBe('m1');
  });

  it('selects rows and exports them as JSON', async () => {
    await shell();
    const checkboxes = screen.getAllByRole('checkbox');
    // First checkbox is "select all" — click it.
    await act(async () => {
      fireEvent.click(checkboxes[0]);
    });
    expect(screen.getByText(/1 selected/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Export/ })).toBeTruthy();
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
    // Expand the row — the Delete action in the panel is disabled for readers.
    await act(async () => {
      fireEvent.click(screen.getByText(/Ships on Fridays/));
    });
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Expire now' })).toHaveProperty('disabled', true);
  });
});
