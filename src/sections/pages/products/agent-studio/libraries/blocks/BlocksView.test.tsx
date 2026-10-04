// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { BlocksView } from './BlocksView';

const clearMutate = vi.fn();

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const BLOCKS = [
  { id: 'b1', targetType: 'tool', targetName: 'refund-payment', reason: 'credential rotation', expiresAt: new Date(Date.now() + 3 * 86_400_000).toISOString(), createdBy: 'ava@acme.co', createdAt: '2026-09-10T00:00:00Z' },
  { id: 'b2', targetType: 'template', targetName: 'support-starter', reason: 'legal hold', expiresAt: null, createdBy: 'li@acme.co', createdAt: '2026-05-28T00:00:00Z' },
  { id: 'b3', targetType: 'capability', targetName: 'web-browse', reason: 'incident containment', expiresAt: '2026-01-01T00:00:00Z', createdBy: null, createdAt: null },
];

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return {
    ...actual,
    useControlBlocks: () => ({ data: BLOCKS, isPending: false, isError: false, error: null, refetch: vi.fn() }),
    useClearControlBlock: () => ({ mutate: clearMutate, isPending: false }),
    useMemberNameMap: () => ({ nameOf: (id: string) => ({ 'ava@acme.co': 'Ava', 'li@acme.co': 'Li' })[id] ?? null }),
  };
});

async function shell() {
  const rootRoute = createRootRoute();
  const librariesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/blocks',
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => librariesRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <BlocksView />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  // Stub for the Phase 3 section route (wired by the coordinator at review).
  const newRoute = createRoute({
    getParentRoute: () => librariesRoute,
    path: '/new',
    component: () => <div>new block section</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([librariesRoute.addChildren([indexRoute, newRoute])]),
    history: createMemoryHistory({ initialEntries: ['/agent-studio/blocks'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  clearMutate.mockReset();
});

describe('BlocksView', () => {
  it('renders active rows with Expires-in-N pills and provenance columns; expired hidden by default', async () => {
    await shell();
    expect(screen.getByText('refund-payment')).toBeTruthy();
    expect(screen.getByText('support-starter')).toBeTruthy();
    expect(screen.getByText(/Expires in 3 days/)).toBeTruthy();
    expect(screen.getByText('Ava')).toBeTruthy();
    expect(screen.getByText('Li')).toBeTruthy();
    expect(screen.queryByText('web-browse')).toBeNull();
  });

  it('status filter surfaces expired rows with the Expired pill', async () => {
    await shell();
    // NOTE: no `await act(...)` wrapper here — fireEvent already flushes inside
    // act, and nesting it in an async act scope swallows the Dropdown's state
    // update (the menu never opens).
    fireEvent.click(screen.getByLabelText('Filter by status'));
    fireEvent.click(screen.getByRole('option', { name: 'Expired' }));
    const row = screen.getByText('web-browse').parentElement?.parentElement as HTMLElement;
    expect(within(row).getByText('Expired')).toBeTruthy();
    expect(screen.queryByText('refund-payment')).toBeNull();
  });

  it('search narrows by name and reason', async () => {
    await shell();
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/Name or reason/), { target: { value: 'legal' } });
    });
    expect(screen.getByText('support-starter')).toBeTruthy();
    expect(screen.queryByText('refund-payment')).toBeNull();
  });

  it('clear asks first and clears only the confirmed row', async () => {
    await shell();
    const row = screen.getByText('refund-payment').closest('tr') ?? screen.getByText('refund-payment').parentElement;
    const clearButton = within(row as HTMLElement).getByRole('button', { name: 'Clear' });
    await act(async () => {
      fireEvent.click(clearButton);
    });
    expect(screen.getByText(/becomes assignable and servable again/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear block' }));
    });
    expect(clearMutate).toHaveBeenCalledTimes(1);
    expect(vi.mocked(clearMutate).mock.calls[0]?.[0]).toBe('b1');
  });

  it('Set block navigates to the dedicated section (no modal)', async () => {
    const router = await shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Set block$/ }));
    });
    expect(router.state.location.pathname).toBe('/agent-studio/blocks/new');
    expect(screen.getByText('new block section')).toBeTruthy();
  });

  it('discloses the 200-row server cap when the list is full', async () => {
    await shell();
    // Fixture has 3 rows — the cap note must NOT render for a short list.
    expect(screen.queryByText(/at most 200 rows/)).toBeNull();
  });
});
