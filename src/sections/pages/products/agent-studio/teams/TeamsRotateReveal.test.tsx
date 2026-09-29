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
import { TeamsView } from './TeamsView';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner', canManageMembers: true }),
}));

const rotateMutate = vi.fn();

vi.mock('@hooks/engine/queries', () => ({
  useOrgSummary: () => ({ data: { members: { total: 1, active: 1, suspended: 0 }, pendingInvites: 0, serviceAccounts: { total: 1, active: 1 }, groups: 0, maxMembers: 25, seats: [] }, isPending: false, isError: false, refetch: vi.fn() }),
  useMembers: () => ({ data: { members: [] }, isPending: false, isError: false, refetch: vi.fn() }),
  useInvites: () => ({ data: { invites: [] }, isPending: false, isError: false, refetch: vi.fn() }),
  useGroups: () => ({ data: { groups: [] }, isPending: false, isError: false, refetch: vi.fn() }),
  useServiceAccounts: () => ({
    data: {
      serviceAccounts: [
        {
          id: 'sa-1',
          name: 'CI',
          description: 'pipeline',
          status: 'active',
          scopes: ['studio:read'],
          tokenLastUsedAt: null,
          createdAt: null,
        },
      ],
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@hooks/engine/mutations', () => ({
  useResendInvite: () => ({ mutate: vi.fn(), isPending: false }),
  useRevokeInvite: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteGroup: () => ({ mutate: vi.fn(), isPending: false }),
  useRotateServiceAccountToken: () => ({
    mutate: (input: unknown, opts?: { onSuccess?: (r: unknown) => void }) => {
      rotateMutate(input, opts);
      opts?.onSuccess?.({ token: 'neryva_sa_rotated_token' });
    },
    isPending: false,
  }),
  useDisableServiceAccount: () => ({ mutate: vi.fn(), isPending: false }),
  useEnableServiceAccount: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteServiceAccount: () => ({ mutate: vi.fn(), isPending: false }),
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

async function routerAt(initialPath: string) {
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/teams',
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: () => shell(<TeamsView />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  rotateMutate.mockClear();
  sessionStorage.clear();
});

describe('TeamsView rotate shown-once token', () => {
  it('writes the reveal marker when a rotated token is issued', async () => {
    await routerAt('/agent-studio/teams');
    fireEvent.click(screen.getByRole('button', { name: 'Rotate token for CI' }));
    expect(screen.getByText(/Rotate token for/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }));
    expect(rotateMutate).toHaveBeenCalled();
    expect(sessionStorage.getItem('teams:service-account:rotate:revealed:sa-1')).toBe('CI');
    expect(screen.getByText('neryva_sa_rotated_token')).toBeTruthy();
  });

  it('restores the already-revealed state on refresh instead of silently losing the token', async () => {
    sessionStorage.setItem('teams:service-account:rotate:revealed:sa-1', 'CI');
    await routerAt('/agent-studio/teams');
    expect(screen.getByText(/already shown/)).toBeTruthy();
    expect(screen.queryByText('neryva_sa_rotated_token')).toBeNull();
    // Recovery path: rotating again returns to the confirm form.
    fireEvent.click(screen.getByRole('button', { name: 'Rotate again' }));
    expect(screen.getByText(/Rotate token for/)).toBeTruthy();
  });
});
