// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { AgentsView } from './AgentsView';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({
    data: [{ id: 'a1', name: 'Returns Helper', description: null, status: 'live', activeVersionId: 'v1', model: null, updatedAt: null, degradedUntil: null, degradedReason: null, disabledReason: null }],
    isPending: false,
    isError: false,
  }),
}));

vi.mock('@hooks/studio/useFleetHealth', () => ({
  useFleetKnowledgeHealth: () => new Map(),
}));

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useCloneAssistant: () => ({ mutate: vi.fn(), isPending: false, error: null }),
  };
});

async function shell() {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <AgentsView />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const cloneProbe = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/agents/clone',
    validateSearch: (search: Record<string, unknown>) => ({
      sourceId: typeof search.sourceId === 'string' ? search.sourceId : undefined,
      returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
    }),
    component: () => <div>clone page probe</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, cloneProbe]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

describe('AgentsView (row-menu clone routes to the clone page)', () => {
  it('navigates to the clone page preselected instead of one-shot cloning', async () => {
    const router = await shell();
    fireEvent.click(screen.getByLabelText('Actions for Returns Helper'));
    await act(async () => {
      fireEvent.click(screen.getByText('Clone'));
    });
    expect(router.state.location.pathname).toBe('/agent-studio/agents/clone');
    expect(router.state.location.search).toMatchObject({ sourceId: 'a1', returnTo: '/agent-studio/agents' });
    expect(screen.getByText('clone page probe')).toBeTruthy();
  });
});
