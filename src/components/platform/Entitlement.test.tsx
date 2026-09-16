import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { EntitlementBanner, EntitlementGate, useEntitlement } from './Entitlement';
import { OrgContext, type OrgContextValue, type EntitlementState, type OrgRole } from '@/Context/OrgContext';

const DAY_MS = 86_400_000;

/** Router context — the banner's CTAs are router <Link>s. RouterProvider
 * renders the matched route, so the test UI rides as the route component. */
async function withRouter(ui: React.ReactElement) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const platformRoute = createRoute({ getParentRoute: () => rootRoute, path: '/platform', component: () => ui });
  const billingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/platform/billing', component: () => null });
  const router = createRouter({
    routeTree: rootRoute.addChildren([platformRoute, billingRoute]),
    history: createMemoryHistory({ initialEntries: ['/platform'] }),
  });
  await router.load();
  return <RouterProvider router={router} />;
}

function orgValue(overrides: { role?: OrgRole; state?: EntitlementState }): OrgContextValue {
  const role = overrides.role ?? 'owner';
  const state = overrides.state ?? 'active';
  return {
    orgId: 'org_1',
    orgs: [{ orgId: 'org_1', role, name: 'Aurora Labs' }],
    role,
    name: 'Aurora Labs',
    setActive: () => undefined,
    adoptOrg: () => undefined,
    atLeast: () => role === 'owner' || role === 'admin' || role === 'developer',
    canManageMembers: role === 'owner' || role === 'admin',
    entitlementState: () => state,
  };
}

async function renderWithOrg(overrides: { role?: OrgRole; state?: EntitlementState }, ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const routed = await withRouter(ui);
  return render(
    <QueryClientProvider client={client}>
      <OrgContext.Provider value={orgValue(overrides)}>{routed}</OrgContext.Provider>
    </QueryClientProvider>,
  );
}

function stubEntitlements(rows: Array<{ product: string; msRemaining: number | null }>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/entitlements')) {
        return new Response(
          JSON.stringify({
            entitlements: rows.map((r) => ({
              product: r.product,
              plan: 'studio-team',
              status: 'trial',
              msRemaining: r.msRemaining,
            })),
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ error: { code: 'not_found', message: `unexpected ${url}` } }), { status: 404 });
    }),
  );
}

function Flags() {
  const info = useEntitlement('agent_studio');
  return (
    <div
      data-testid="flags"
      data-write-blocked={String(info.writeBlocked)}
      data-read-blocked={String(info.readBlocked)}
    />
  );
}

describe('useEntitlement flags', () => {
  it.each([
    ['active', 'false', 'false'],
    ['trial', 'false', 'false'],
    ['past_due', 'true', 'false'],
    ['suspended', 'true', 'false'],
    ['none', 'false', 'true'],
    ['expired', 'false', 'true'],
  ] as const)('%s → writeBlocked=%s readBlocked=%s', async (state, writeBlocked, readBlocked) => {
    await renderWithOrg({ state }, <Flags />);
    const flags = screen.getByTestId('flags');
    expect(flags.dataset.writeBlocked).toBe(writeBlocked);
    expect(flags.dataset.readBlocked).toBe(readBlocked);
  });
});

describe('EntitlementBanner', () => {
  beforeEach(() => {
    stubEntitlements([{ product: 'agent_studio', msRemaining: 21 * DAY_MS }]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing while active', async () => {
    const { container } = await renderWithOrg({ state: 'active' }, <EntitlementBanner product="agent_studio" displayName="Agent Studio" />);
    expect(container.textContent).toBe('');
  });

  it('shows the trial countdown with the review link for deciders', async () => {
    await renderWithOrg({ state: 'trial', role: 'owner' }, <EntitlementBanner product="agent_studio" displayName="Agent Studio" />);
    await waitFor(() => expect(screen.getByText(/21 days left/)).toBeInTheDocument());
    expect(screen.getByText('Review products')).toBeInTheDocument();
  });

  it('hides the CTA from non-deciders', async () => {
    await renderWithOrg({ state: 'trial', role: 'reader' }, <EntitlementBanner product="agent_studio" displayName="Agent Studio" />);
    await waitFor(() => expect(screen.getByText(/Agent Studio trial/)).toBeInTheDocument());
    expect(screen.queryByText('Review products')).not.toBeInTheDocument();
  });

  it('points past_due at billing and never blames the user', async () => {
    await renderWithOrg({ state: 'past_due' }, <EntitlementBanner product="agent_studio" />);
    expect(screen.getByText('Payment needed.')).toBeInTheDocument();
    expect(screen.getByText('Open billing')).toBeInTheDocument();
  });

  it('describes suspension as recoverable', async () => {
    await renderWithOrg({ state: 'suspended' }, <EntitlementBanner product="agent_studio" />);
    expect(screen.getByText(/is suspended/)).toBeInTheDocument();
    expect(screen.getByText('Open billing')).toBeInTheDocument();
  });

  it('gives deciders the enable path on none, others the ask', async () => {
    const owner = await renderWithOrg({ state: 'none', role: 'owner' }, <EntitlementBanner product="agent_studio" />);
    expect(screen.getByText('Review products')).toBeInTheDocument();
    owner.unmount();
    await renderWithOrg({ state: 'none', role: 'reader' }, <EntitlementBanner product="agent_studio" />);
    expect(screen.getByText(/Ask an owner or billing manager/)).toBeInTheDocument();
    expect(screen.queryByText('Review products')).not.toBeInTheDocument();
  });
});

describe('EntitlementGate', () => {
  beforeEach(() => {
    stubEntitlements([]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders children while reads are alive', async () => {
    await renderWithOrg({ state: 'active' }, <EntitlementGate product="agent_studio"><p>real content</p></EntitlementGate>);
    expect(screen.getByText('real content')).toBeInTheDocument();
  });

  it('swaps the page for the honest brief on none', async () => {
    await renderWithOrg({ state: 'none', role: 'owner' }, <EntitlementGate product="agent_studio" displayName="Agent Studio"><p>real content</p></EntitlementGate>);
    expect(screen.queryByText('real content')).not.toBeInTheDocument();
    expect(screen.getByText('Agent Studio isn’t enabled yet')).toBeInTheDocument();
    expect(screen.getByText('Review products')).toBeInTheDocument();
  });
});
