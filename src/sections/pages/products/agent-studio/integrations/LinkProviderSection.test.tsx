// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';
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
import { LinkProviderSection } from './LinkProviderSection';

let mockRole: string = 'owner';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

vi.mock('@hooks/studio/useSetupConnectors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupConnectors')>();
  return {
    ...actual,
    useLinkConnector: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

async function routerAt(initialPath: string, role = 'owner') {
  mockRole = role;
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/integrations',
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: () => shell(<div>integrations list</div>),
  });
  const linkRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/link/$provider',
    component: () => shell(<LinkProviderSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, linkRoute])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  sessionStorage.clear();
});

describe('LinkProviderSection routing gates', () => {
  it('bounces an unknown provider back to the integrations list', async () => {
    const router = await routerAt('/agent-studio/integrations/link/bogus-provider');
    expect(router.state.location.pathname).toBe('/agent-studio/integrations');
  });

  it('bounces a reader (no setup:author) back to the integrations list', async () => {
    const router = await routerAt('/agent-studio/integrations/link/notion', 'reader');
    expect(router.state.location.pathname).toBe('/agent-studio/integrations');
  });

  it('renders the section for a known provider with write rights', async () => {
    const router = await routerAt('/agent-studio/integrations/link/notion');
    expect(router.state.location.pathname).toBe('/agent-studio/integrations/link/notion');
  });
});
