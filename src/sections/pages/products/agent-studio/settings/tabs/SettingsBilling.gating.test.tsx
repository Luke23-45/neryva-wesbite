// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
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
import { SettingsBilling } from './SettingsBilling';

// Wave-7 gap 6: role varies per test, so it lives in hoisted mutable state.
const orgState = vi.hoisted(() => ({
  role: 'owner' as 'owner' | 'admin' | 'billing' | 'developer' | 'reader',
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({
    orgId: 'org-test',
    name: 'Test Org',
    role: orgState.role,
    entitlementState: () => 'active',
  }),
}));

// Mock at the HTTP layer: every engine read the page fires is recorded here.
// A regression (an ungated hook) shows up as a request to one of the gated
// paths — the test below fails. The fixtures mimic the real engine shapes.
const requested = vi.hoisted(() => ({ paths: [] as string[] }));

vi.mock('@lib/engine/client', () => ({
  engine: vi.fn(async (path: string) => {
    requested.paths.push(path);
    if (path.endsWith('/entitlements')) {
      return {
        entitlements: [
          { product: 'agent_studio', plan: 'payg', status: 'active', seats: null, periodEnd: null, msRemaining: null },
        ],
      };
    }
    if (path.endsWith('/limits')) return { products: [] };
    if (path.endsWith('/enterprise/status')) return { enterprise: false };
    if (path.endsWith('/credits/wallet')) return { wallet: { available: 1200, reserved: 0, total: 1200 } };
    if (path.endsWith('/invoices')) return { invoices: [] };
    throw new Error(`unexpected engine path in SettingsBilling test: ${path}`);
  }),
}));

const GATED = {
  wallet: '/console/billing/org-test/credits/wallet',
  invoices: '/console/billing/org-test/invoices',
  enterprise: '/console/billing/org-test/enterprise/status',
  limits: '/console/org/org-test/limits',
};
const ENTITLEMENTS = '/console/org/org-test/entitlements';

async function shell() {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <SettingsBilling />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  cleanup();
  orgState.role = 'owner';
  requested.paths = [];
});

describe('SettingsBilling (wave-7 gap 6: role-gated billing reads)', () => {
  it('a reader fires none of the four doomed queries and sees honest restricted copy', async () => {
    orgState.role = 'reader';
    await shell();
    // The ungated entitlements read still fires (every role may read it) —
    // once it lands, any ungated read would have fired too.
    await waitFor(() => expect(requested.paths).toContain(ENTITLEMENTS));

    expect(requested.paths).not.toContain(GATED.wallet);
    expect(requested.paths).not.toContain(GATED.invoices);
    expect(requested.paths).not.toContain(GATED.enterprise);
    expect(requested.paths).not.toContain(GATED.limits);

    // Dashboard convention: honest "not visible to your role" copy, naming
    // the exact role set each endpoint allows.
    expect(screen.getByText(/Credit balance is visible to owner, admin, and billing roles/)).toBeTruthy();
    expect(screen.getByText(/Quota and limits are visible to owner, admin, billing, and developer roles/)).toBeTruthy();
    expect(screen.getByText(/Invoices are visible to owner, admin, and billing roles/)).toBeTruthy();

    // The subscription card still derives from the reader-readable
    // entitlements read — no eternal skeleton, no fabricated state. The
    // name renders twice (plan name + status pill).
    expect(screen.getAllByText('Pay-as-you-go').length).toBeGreaterThan(0);
  });

  it('a developer fires only the two queries the engine allows them (enterprise + limits)', async () => {
    orgState.role = 'developer';
    await shell();
    // The engine 403s wallet + invoices for developers (@Roles owner/admin/
    // billing) but allows enterprise/status + /limits.
    await waitFor(() => expect(requested.paths).toContain(GATED.enterprise));
    expect(requested.paths).toContain(GATED.limits);
    expect(requested.paths).not.toContain(GATED.wallet);
    expect(requested.paths).not.toContain(GATED.invoices);

    expect(screen.getByText(/Credit balance is visible to owner, admin, and billing roles/)).toBeTruthy();
    expect(screen.getByText(/Invoices are visible to owner, admin, and billing roles/)).toBeTruthy();
    // No restricted copy for the reads developers are allowed.
    expect(screen.queryByText(/Quota and limits are visible/)).toBeNull();
  });

  it('an owner fires all four queries and sees no restricted copy', async () => {
    orgState.role = 'owner';
    await shell();
    await waitFor(() => expect(requested.paths).toContain(GATED.invoices));
    expect(requested.paths).toContain(GATED.wallet);
    expect(requested.paths).toContain(GATED.enterprise);
    expect(requested.paths).toContain(GATED.limits);

    expect(screen.queryByText(/visible to owner, admin/)).toBeNull();
    // Real wallet data renders (1,200 credits from the fixture).
    expect(screen.getByText(/1,200 credits/)).toBeTruthy();
    // Empty limits payload renders the honest empty state, not a skeleton.
    expect(screen.getByText(/No quota snapshot/)).toBeTruthy();
  });
});
