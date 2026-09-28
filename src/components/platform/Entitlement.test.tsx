import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { EntitlementBanner, EntitlementGate } from './Entitlement';
import { useEntitlement } from './useEntitlement';
import { OrgContext, type OrgContextValue, type EntitlementState, type OrgRole } from '@/Context/OrgContext';

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
  it('renders nothing while active', async () => {
    const { container } = await renderWithOrg({ state: 'active' }, <EntitlementBanner product="agent_studio" displayName="Agent Studio" />);
    expect(container.textContent).toBe('');
  });

  it.each(['owner', 'reader'] as const)('renders nothing on trial for %s — no trial UI is offered', async (role) => {
    const { container } = await renderWithOrg({ state: 'trial', role }, <EntitlementBanner product="agent_studio" displayName="Agent Studio" />);
    expect(container.textContent).toBe('');
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

  it('gives deciders the billing path on none, others the ask', async () => {
    const owner = await renderWithOrg({ state: 'none', role: 'owner' }, <EntitlementBanner product="agent_studio" />);
    expect(screen.getByText('Open billing')).toBeInTheDocument();
    expect(screen.getByText(/add billing to get started/)).toBeInTheDocument();
    owner.unmount();
    await renderWithOrg({ state: 'none', role: 'reader' }, <EntitlementBanner product="agent_studio" />);
    expect(screen.getByText(/Ask an owner or billing manager/)).toBeInTheDocument();
    expect(screen.queryByText('Open billing')).not.toBeInTheDocument();
  });

  it('gives deciders the billing path on expired too', async () => {
    await renderWithOrg({ state: 'expired', role: 'owner' }, <EntitlementBanner product="agent_studio" />);
    expect(screen.getByText('Open billing')).toBeInTheDocument();
    expect(screen.queryByText(/trial/i)).not.toBeInTheDocument();
  });
});

describe('EntitlementGate', () => {
  it('renders children while reads are alive', async () => {
    await renderWithOrg({ state: 'active' }, <EntitlementGate product="agent_studio"><p>real content</p></EntitlementGate>);
    expect(screen.getByText('real content')).toBeInTheDocument();
  });

  it('swaps the page for the honest brief on none', async () => {
    await renderWithOrg({ state: 'none', role: 'owner' }, <EntitlementGate product="agent_studio" displayName="Agent Studio"><p>real content</p></EntitlementGate>);
    expect(screen.queryByText('real content')).not.toBeInTheDocument();
    expect(screen.getByText('Agent Studio isn’t enabled yet')).toBeInTheDocument();
    expect(screen.getByText('Open billing')).toBeInTheDocument();
    expect(screen.queryByText(/trial/i)).not.toBeInTheDocument();
  });
});
