// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
import { ProvidersPage } from './ProvidersPage';

vi.mock('@/sections/pages/products/agent-studio/providers/api', () => ({
  fetchProviderDirectory: vi.fn(async () => ({ providers: [] })),
}));

// The shell test owns tab visibility + switching only. Waves B/C own their
// tab internals, so the lazy tabs are mocked here (vi.mock intercepts the
// lazy() dynamic import too — same resolved module).
vi.mock('@/sections/pages/products/agent-studio/providers/tabs/TabMyProviders', () => ({
  default: () => <div>My providers surface</div>,
}));
vi.mock('@/sections/pages/products/agent-studio/providers/tabs/TabModels', () => ({
  default: () => <div>Models surface</div>,
}));

let studioState = 'none';
let enterpriseProducts: Array<{ key: string; entitlement_state: string }> = [];

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({
    orgId: 'org-test',
    role: 'owner',
    entitlementState: (product: string) => (product === 'agent_studio' ? studioState : 'none'),
  }),
}));

/**
 * Renders the real shell with the given tier inputs. The ['org','home'] cache
 * is seeded like OrgProvider would; omit the seed to simulate the still-loading
 * 'unknown' tier.
 */
async function renderShell(seedHome: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (seedHome) {
    client.setQueryData(['org', 'home'], {
      products: [
        { key: 'agent_studio', entitlement_state: studioState },
        ...enterpriseProducts,
      ],
    });
  }
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const providersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/providers',
    component: () => <ProvidersPage />,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([providersRoute]),
    history: createMemoryHistory({ initialEntries: ['/agent-studio/providers'] }),
  });
  await router.load();
  const result = render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>,
  );
  await waitFor(() => {
    expect(screen.getByRole('tablist')).toBeTruthy();
  });
  return { router, ...result };
}

beforeEach(() => {
  studioState = 'none';
  enterpriseProducts = [];
});

describe('ProvidersPage tab visibility matrix', () => {
  it('free tier: hides "My providers" (platform keys, nothing to manage)', async () => {
    studioState = 'none';
    await renderShell(true);

    expect(screen.queryByRole('tab', { name: 'My providers' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'Catalog' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Models' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /spend & budgets/i })).toBeTruthy();
  });

  it('payg tier: shows "My providers"', async () => {
    studioState = 'active';
    await renderShell(true);

    expect(screen.getByRole('tab', { name: 'My providers' })).toBeTruthy();
  });

  it('enterprise tier: shows "My providers"', async () => {
    studioState = 'active';
    enterpriseProducts = [{ key: 'agent_studio_enterprise', entitlement_state: 'active' }];
    await renderShell(true);

    expect(screen.getByRole('tab', { name: 'My providers' })).toBeTruthy();
  });

  it('unknown tier (home still loading): renders the full set, server gates actions', async () => {
    studioState = 'active';
    await renderShell(false);

    expect(screen.getByRole('tab', { name: 'My providers' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Catalog' })).toBeTruthy();
  });

  it('switching to My providers renders the tab surface', async () => {
    studioState = 'active';
    await renderShell(true);

    fireEvent.click(screen.getByRole('tab', { name: 'My providers' }));
    await waitFor(() => {
      expect(screen.getByText('My providers surface')).toBeTruthy();
    });
  });

  it('switching to Models renders the tab surface', async () => {
    studioState = 'active';
    await renderShell(true);

    fireEvent.click(screen.getByRole('tab', { name: 'Models' }));
    await waitFor(() => {
      expect(screen.getByText('Models surface')).toBeTruthy();
    });
  });

  it('Spend & budgets is honestly disabled — clicking it never activates a tab', async () => {
    studioState = 'active';
    await renderShell(true);

    const spend = screen.getByRole('button', { name: /spend & budgets/i });
    expect(spend.getAttribute('disabled')).not.toBeNull();
    fireEvent.click(spend);
    // Still on the Catalog tab content (the empty-catalog state from the mock).
    await waitFor(() => {
      expect(screen.getByText('The provider catalog is empty.')).toBeTruthy();
    });
    expect(screen.queryByText(/connected api keys/i)).toBeNull();
  });
});
