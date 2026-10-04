// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
import AgentStudioProvidersCustomPage from './AgentStudioProvidersCustomPage';
import type { OrgTier } from '@/sections/pages/products/agent-studio/providers/hooks/useOrgTier';

let tier: OrgTier = 'payg';
vi.mock('@/sections/pages/products/agent-studio/providers/hooks/useOrgTier', () => ({
  useOrgTier: () => tier,
}));

// PageHead is react-helmet-async chrome — not the subject of the gate test.
vi.mock('@components/common/PageHead', () => ({
  PageHead: () => null,
}));

// Wave B owns the real form; the gate test only verifies the page hands off
// to it for enterprise orgs (vi.mock intercepts the page's import).
vi.mock('@/sections/pages/products/agent-studio/providers/custom/CustomProviderForm', () => ({
  CustomProviderForm: ({ credentialId }: { credentialId?: string }) => (
    <div data-testid="custom-provider-form" data-credential-id={credentialId ?? ''} />
  ),
}));

async function renderAt(path: string) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const newRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/providers/custom/new',
    component: AgentStudioProvidersCustomPage,
  });
  const editRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/providers/custom/$credentialId/edit',
    component: AgentStudioProvidersCustomPage,
  });
  const stub = (p: string) =>
    createRoute({ getParentRoute: () => rootRoute, path: p, component: () => null });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      newRoute,
      editRoute,
      stub('/agent-studio/providers'),
      stub('/agent-studio/settings/pricing'),
      stub('/contact'),
    ]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  await router.load();
  const result = render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { router, ...result };
}

beforeEach(() => {
  tier = 'payg';
});

describe('AgentStudioProvidersCustomPage enterprise gate', () => {
  it('non-enterprise orgs see the honest upgrade page with sales contact and a way back', async () => {
    tier = 'payg';
    await renderAt('/agent-studio/providers/custom/new');

    expect(screen.getByText('Custom endpoints are an Enterprise feature')).toBeTruthy();
    const sales = screen.getByRole('link', { name: /contact sales/i });
    expect(sales.getAttribute('href')).toBe('/contact');
    const plans = screen.getByRole('link', { name: /view plans/i });
    expect(plans.getAttribute('href')).toBe('/agent-studio/settings/pricing');
    const back = screen.getByRole('link', { name: /back to providers/i });
    expect(back.getAttribute('href')).toBe('/agent-studio/providers');
    // The form never renders for gated tiers.
    expect(screen.queryByTestId('custom-provider-form')).toBeNull();
  });

  it('unknown tier is also gated (fail-closed on the client mirror)', async () => {
    tier = 'unknown';
    await renderAt('/agent-studio/providers/custom/new');

    expect(screen.getByText('Custom endpoints are an Enterprise feature')).toBeTruthy();
  });

  it('free tier hitting the edit route is gated too', async () => {
    tier = 'free';
    await renderAt('/agent-studio/providers/custom/cred-123/edit');

    expect(screen.getByText('Custom endpoints are an Enterprise feature')).toBeTruthy();
  });

  it('enterprise orgs get the dedicated form page (new mode)', async () => {
    tier = 'enterprise';
    await renderAt('/agent-studio/providers/custom/new');

    await waitFor(() => {
      expect(screen.getByTestId('custom-provider-form')).toBeTruthy();
    });
    expect(screen.getByRole('heading', { name: 'Connect custom provider' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /back to providers/i })).toBeTruthy();
    expect(screen.queryByText('Custom endpoints are an Enterprise feature')).toBeNull();
  });

  it('enterprise orgs get the dedicated form page (edit mode passes the credential id)', async () => {
    tier = 'enterprise';
    await renderAt('/agent-studio/providers/custom/cred-123/edit');

    await waitFor(() => {
      expect(screen.getByTestId('custom-provider-form')).toBeTruthy();
    });
    expect(screen.getByTestId('custom-provider-form').getAttribute('data-credential-id')).toBe(
      'cred-123',
    );
    expect(screen.getByRole('heading', { name: 'Edit custom provider' })).toBeTruthy();
  });
});
