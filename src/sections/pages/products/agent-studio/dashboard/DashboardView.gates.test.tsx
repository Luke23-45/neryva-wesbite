import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { DashboardView } from './DashboardView';

// D-01 gate wiring (console field audit): DashboardView gates the usage
// series query on `can('billing:view')` — owner/admin/billing only — and
// renders honest role copy for the rest instead of firing a doomed request
// the engine would 403. These tests render the REAL DashboardView against a
// stubbed engine and assert on the wire: the `enabled: canViewUsage` wiring
// is the system under test. Reverting it to always-enabled fires the reader
// request and fails the first test (non-vacuity verified 2026-09-29).
//
// `capabilities.role-gates.test.ts` pins the static permission matrix only;
// THIS file pins the live D-01 gate wiring.

// D-01: role varies per test, so it lives in hoisted mutable state.
const orgState = vi.hoisted(() => ({ role: 'reader' as 'reader' | 'owner' }));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({
    orgId: 'org-test',
    orgs: [],
    role: orgState.role,
    name: 'Test Org',
    setActive: () => {},
    adoptOrg: () => {},
    atLeast: () => false,
    canManageMembers: false,
    entitlementState: () => 'active' as const,
  }),
}));

function payloadFor(url: string): unknown {
  if (url.includes('/entitlements')) return { entitlements: [] };
  if (url.includes('/approvals')) return { approvals: [] };
  if (url.includes('/audit')) return { events: [] };
  if (url.includes('/series/')) return { series: [] };
  if (url.includes('/limits')) return { products: [] };
  return {};
}

function stubEngine() {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      return new Response(JSON.stringify(payloadFor(url)), { status: 200 });
    }),
  );
  return calls;
}

// Every `to=` target the dashboard and its SetupChecklist child link to —
// TanStack <Link> must resolve against a registered route.
const LINK_TARGETS = [
  '/agent-studio/activity',
  '/agent-studio/conversations',
  '/agent-studio/agents',
  '/agent-studio/templates',
  '/agent-studio/knowledge',
  '/agent-studio/providers',
  '/agent-studio/channels',
  '/agent-studio/approvals',
];

async function renderDashboard() {
  const rootRoute = createRootRoute({
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <DashboardView />
          <Outlet />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const children = LINK_TARGETS.map((path) =>
    createRoute({ getParentRoute: () => rootRoute, path, component: () => <Outlet /> }),
  );
  const router = createRouter({
    routeTree: rootRoute.addChildren(children),
    history: createMemoryHistory({ initialEntries: ['/agent-studio/activity'] }),
  });
  await router.load();
  render(<RouterProvider router={router} />);
}

beforeEach(() => {
  cleanup();
  orgState.role = 'reader';
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('DashboardView (D-01 gate wiring — the real useUsageSeries)', () => {
  it('fires no usage-series request for reader and renders the honest role copy', async () => {
    const calls = stubEngine();
    orgState.role = 'reader';
    await renderDashboard();
    // The honest copy proves the component mounted and evaluated the gate…
    expect(
      await screen.findByText(/Usage data is visible to owner, admin, and billing roles/),
    ).toBeInTheDocument();
    // …without the billing-gated request ever leaving the client.
    await new Promise((r) => setTimeout(r, 150));
    expect(calls.filter((c) => c.includes('/console/usage/'))).toHaveLength(0);
  });

  it('fires the usage-series request for owner — entitled roles are not blocked', async () => {
    const calls = stubEngine();
    orgState.role = 'owner';
    await renderDashboard();
    await waitFor(() =>
      expect(calls.some((c) => c.includes('/console/usage/org-test/series/agent_studio'))).toBe(true),
    );
    // …and the honest copy is gone for entitled roles.
    expect(
      screen.queryByText(/Usage data is visible to owner, admin, and billing roles/),
    ).not.toBeInTheDocument();
  });
});
