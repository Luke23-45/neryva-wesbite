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
import { WebhooksView } from './WebhooksView';
import type { WebhookEventCatalogEntry, WebhookSummary } from '@hooks/studio/useWebhooks';

let mockRole = 'owner';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

function webhook(overrides?: Partial<WebhookSummary>): WebhookSummary {
  return {
    id: 'wh_1',
    url: 'https://hooks.example.com/neryva',
    events: ['*'],
    status: 'active',
    description: 'order events',
    secretHint: '•••c123',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z',
    ...overrides,
  };
}

const catalogData: WebhookEventCatalogEntry[] = [
  { type: 'agent.published', description: 'An agent was published.' },
];

vi.mock('@hooks/studio/useWebhooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useWebhooks')>();
  return {
    ...actual,
    useWebhooks: () => ({ data: [webhook()], isPending: false, isError: false }),
    useWebhookEvents: () => ({ data: catalogData, isPending: false, isError: false }),
    useWebhookDeliveries: () => ({ data: [], isPending: false, isError: false, refetch: vi.fn() }),
    useDeleteWebhook: () => ({ mutate: vi.fn(), isPending: false }),
    useRotateWebhookSecret: () => ({ mutate: vi.fn(), isPending: false }),
    useTestWebhook: () => ({ mutate: vi.fn(), isPending: false }),
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

const LIST_PATH = '/agent-studio/integrations/webhooks';

async function routerAt(initialPath: string, role = 'owner') {
  mockRole = role;
  const rootRoute = createRootRoute();
  // Flat layout at the webhooks base path, mirroring the section harnesses:
  // nested layout/webhooks/index route trees render an empty body here.
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/integrations/webhooks',
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: () => shell(<WebhooksView />),
  });
  const newProbe = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/new',
    component: () => shell(<div>webhook new section</div>),
  });
  const editProbe = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/$webhookId/edit',
    component: () => shell(<div>webhook edit section</div>),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, newProbe, editProbe])]),
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
  localStorage.clear();
});

/**
 * The create/edit modals are gone: the list now navigates to the dedicated
 * sections. Only the alert-class interruptions remain (rotate-secret
 * reveal, delete confirm).
 */
describe('WebhooksView navigation', () => {
  it('navigates to the new-webhook section instead of opening a modal', async () => {
    const router = await routerAt(LIST_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /New webhook/ }));
    });
    expect(router.state.location.pathname).toBe(`${LIST_PATH}/new`);
    expect(screen.getByText('webhook new section')).toBeTruthy();
  });

  it('navigates to the edit-webhook section instead of opening a modal', async () => {
    const router = await routerAt(LIST_PATH);
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Edit https://hooks.example.com/neryva' }),
      );
    });
    expect(router.state.location.pathname).toBe(`${LIST_PATH}/wh_1/edit`);
    expect(screen.getByText('webhook edit section')).toBeTruthy();
  });

  it('keeps no create/edit form modal in the view', async () => {
    await routerAt(LIST_PATH);
    expect(screen.queryByRole('button', { name: 'Create webhook' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull();
  });
});

describe('WebhooksView write permissions', () => {
  it.each(['reader', 'billing'])(
    'disables the write controls for a %s with the denied reason',
    async (role) => {
      await routerAt(LIST_PATH, role);
      const denied = 'This action requires an owner, admin, or developer';
      const newButton = screen.getByRole('button', { name: /New webhook/ });
      expect(newButton).toHaveProperty('disabled', true);
      expect(newButton.getAttribute('title')).toContain(denied);
      for (const name of [
        `Test https://hooks.example.com/neryva`,
        `Rotate secret for https://hooks.example.com/neryva`,
        `Edit https://hooks.example.com/neryva`,
        `Delete https://hooks.example.com/neryva`,
      ]) {
        const action = screen.getByRole('button', { name });
        expect(action).toHaveProperty('disabled', true);
        expect(action.getAttribute('title')).toContain(denied);
      }
    },
  );

  it.each(['owner', 'admin', 'developer'])('enables the write controls for a %s', async (role) => {
    await routerAt(LIST_PATH, role);
    expect(screen.getByRole('button', { name: /New webhook/ })).toHaveProperty('disabled', false);
    expect(
      screen.getByRole('button', { name: `Edit https://hooks.example.com/neryva` }),
    ).toHaveProperty('disabled', false);
  });
});

describe('WebhooksView interrupted rotate reveal', () => {
  const MARKER = 'neryva:webhook-pending-rotate-reveal';

  it('shows an honest banner after a refresh-during-rotate-reveal', async () => {
    // Simulate the refresh: the in-memory secret is gone, the marker survives.
    sessionStorage.setItem(MARKER, 'wh_1');
    await routerAt(LIST_PATH);
    expect(screen.getByRole('heading', { name: 'Signing secret already revealed' })).toBeTruthy();
    expect(
      screen.getByText(/shown exactly once and can't be displayed again/i),
    ).toBeTruthy();
  });

  it('dismissing the banner clears the marker', async () => {
    sessionStorage.setItem(MARKER, 'wh_1');
    await routerAt(LIST_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    });
    expect(sessionStorage.getItem(MARKER)).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Signing secret already revealed' })).toBeNull();
  });

  it('shows no banner when no rotate was interrupted', async () => {
    await routerAt(LIST_PATH);
    expect(screen.queryByRole('heading', { name: 'Signing secret already revealed' })).toBeNull();
  });
});
