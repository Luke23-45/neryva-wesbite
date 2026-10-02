// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
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
import { InviteSection } from './InviteSection';
import { GroupCreateSection } from './GroupCreateSection';
import { ServiceAccountCreateSection } from './ServiceAccountCreateSection';

let mockRole: string = 'owner';
let mockCanManageMembers = true;

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole, canManageMembers: mockCanManageMembers }),
}));

const inviteMutate = vi.fn();
const groupMutate = vi.fn();
const saMutate = vi.fn();

vi.mock('@hooks/engine/mutations', () => ({
  useInviteMember: () => ({
    mutate: (input: unknown, opts?: { onSuccess?: (r: unknown) => void; onError?: (e: unknown) => void }) => {
      inviteMutate(input, opts);
      opts?.onSuccess?.({ accept_url: 'https://console.example/invite/abc', expires_at: '2026-10-06T00:00:00Z' });
    },
    isPending: false,
  }),
  useCreateGroup: () => ({
    mutate: (input: unknown, opts?: { onSuccess?: (r: unknown) => void }) => {
      groupMutate(input, opts);
      opts?.onSuccess?.({ id: 'g-1' });
    },
    isPending: false,
  }),
  useCreateServiceAccount: () => ({
    mutate: (input: unknown, opts?: { onSuccess?: (r: unknown) => void }) => {
      saMutate(input, opts);
      opts?.onSuccess?.({ token: 'neryva_sa_test_token' });
    },
    isPending: false,
  }),
}));

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

async function routerAt(initialPath: string, role = 'owner', canManage = true) {
  mockRole = role;
  mockCanManageMembers = canManage;
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/teams',
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: () => shell(<div>teams list</div>),
  });
  const inviteRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/invite',
    component: () => shell(<InviteSection />),
  });
  const groupRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/groups/new',
    component: () => shell(<GroupCreateSection />),
  });
  const saRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/service-accounts/new',
    component: () => shell(<ServiceAccountCreateSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, inviteRoute, groupRoute, saRoute])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  mockCanManageMembers = true;
  inviteMutate.mockClear();
  groupMutate.mockClear();
  saMutate.mockClear();
  sessionStorage.clear();
});

describe('Teams section role-gate bounces', () => {
  it.each([
    ['/agent-studio/teams/invite'],
    ['/agent-studio/teams/groups/new'],
    ['/agent-studio/teams/service-accounts/new'],
  ])('bounces a non-manager off %s to the teams list', async (path) => {
    const router = await routerAt(path, 'reader', false);
    expect(router.state.location.pathname).toBe('/agent-studio/teams');
  });

  it('renders the invite section for a manager', async () => {
    const router = await routerAt('/agent-studio/teams/invite');
    expect(router.state.location.pathname).toBe('/agent-studio/teams/invite');
    expect(screen.getByPlaceholderText('teammate@company.com')).toBeTruthy();
  });
});

describe('Invite shown-once link', () => {
  it('writes the reveal marker when the manual link is generated', async () => {
    await routerAt('/agent-studio/teams/invite');
    fireEvent.change(screen.getByPlaceholderText('teammate@company.com'), {
      target: { value: 'teammate@company.com' },
    });
    fireEvent.click(screen.getByText('Create invite link'));
    expect(inviteMutate).toHaveBeenCalled();
    expect(sessionStorage.getItem('teams:invite:revealed')).toBe('teammate@company.com');
    expect((screen.getByLabelText('One-time invitation link') as HTMLInputElement).value).toBe(
      'https://console.example/invite/abc',
    );
  });

  it('shows the already-revealed state on refresh instead of the link', async () => {
    sessionStorage.setItem('teams:invite:revealed', 'teammate@company.com');
    await routerAt('/agent-studio/teams/invite');
    expect(screen.getByText(/already generated in this session/)).toBeTruthy();
    expect(screen.queryByPlaceholderText('teammate@company.com')).toBeNull();
  });
});

describe('Service-account shown-once token', () => {
  it('writes the reveal marker when the token is issued', async () => {
    await routerAt('/agent-studio/teams/service-accounts/new');
    fireEvent.change(screen.getByPlaceholderText('e.g. ci-pipeline'), { target: { value: 'ci-pipeline' } });
    fireEvent.click(screen.getByText('Create'));
    expect(saMutate).toHaveBeenCalled();
    expect(sessionStorage.getItem('teams:service-account:revealed')).toBe('ci-pipeline');
    expect(screen.getByText('neryva_sa_test_token')).toBeTruthy();
  });

  it('shows the already-revealed state on refresh instead of the token', async () => {
    sessionStorage.setItem('teams:service-account:revealed', 'ci-pipeline');
    await routerAt('/agent-studio/teams/service-accounts/new');
    expect(screen.getByText(/already generated in this session/)).toBeTruthy();
    expect(screen.queryByPlaceholderText('e.g. ci-pipeline')).toBeNull();
  });
});
