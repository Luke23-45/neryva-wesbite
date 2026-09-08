import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
import { NotificationsPopover } from './NotificationsPopover';

const NOTIFICATIONS_PAYLOAD = {
  notifications: [
    { id: 'n1', title: 'Trial ending soon', message: '3 days left', read_at: null, created_at: '2026-09-06T10:00:00Z' },
    { id: 'n2', title: 'Conversation resolved', read_at: '2026-09-06T09:00:00Z' },
  ],
  unread_count: 1,
};

const STATUS_OPERATIONAL = { overall: 'operational', components: [], satellites: [], announcements: [] };

function stubEngine(payloads: {
  notifications?: unknown;
  status?: unknown;
  errorPaths?: string[];
}) {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (payloads.errorPaths?.some((p) => url.includes(p))) {
        return new Response(JSON.stringify({ error: { code: 'internal_error', message: 'boom' } }), { status: 500 });
      }
      if (url.includes('/console/notifications')) {
        return new Response(JSON.stringify(payloads.notifications ?? NOTIFICATIONS_PAYLOAD), { status: 200 });
      }
      if (url.includes('/console/status')) {
        return new Response(JSON.stringify(payloads.status ?? STATUS_OPERATIONAL), { status: 200 });
      }
      return new Response(JSON.stringify({ error: { code: 'not_found', message: `unexpected ${url}` } }), { status: 404 });
    }),
  );
  return calls;
}

async function renderPopover() {
  const rootRoute = createRootRoute({ component: () => <NotificationsPopover /> });
  const activityRoute = createRoute({ getParentRoute: () => rootRoute, path: '/agent-studio/activity', component: () => <Outlet /> });
  const router = createRouter({
    routeTree: rootRoute.addChildren([activityRoute]),
    history: createMemoryHistory({ initialEntries: ['/agent-studio/activity'] }),
  });
  await router.load();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('NotificationsPopover', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the unread badge, rows, and relative times from the engine', async () => {
    stubEngine({});
    renderPopover();
    const bell = await screen.findByRole('button', { name: 'Notifications (1 unread)' });
    fireEvent.click(bell);
    expect(await screen.findByText('Trial ending soon')).toBeInTheDocument();
    expect(screen.getByText('Conversation resolved')).toBeInTheDocument();
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('marks all read through the engine', async () => {
    const calls = stubEngine({});
    renderPopover();
    fireEvent.click(await screen.findByRole('button', { name: 'Notifications (1 unread)' }));
    const markAll = await screen.findByRole('button', { name: 'Mark all read' });
    fireEvent.click(markAll);
    await waitFor(() => expect(calls.some((c) => c.includes('/console/notifications/read-all'))).toBe(true));
  });

  it('renders the empty state when there is nothing', async () => {
    stubEngine({ notifications: { notifications: [], unread_count: 0 } });
    renderPopover();
    fireEvent.click(await screen.findByRole('button', { name: 'Notifications' }));
    expect(await screen.findByText('You’re all caught up')).toBeInTheDocument();
  });

  it('surfaces announcements with dismissal persisted per id', async () => {
    stubEngine({
      status: {
        overall: 'operational',
        announcements: [{ id: 'a1', title: 'Scheduled maintenance', message: 'On Saturday', created_at: '2026-09-05T10:00:00Z' }],
      },
    });
    renderPopover();
    fireEvent.click(await screen.findByRole('button', { name: /^Notifications/ }));
    expect(await screen.findByText('Scheduled maintenance')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss announcement' }));
    expect(screen.queryByText('Scheduled maintenance')).not.toBeInTheDocument();
    const dismissed = JSON.parse(window.localStorage.getItem('neryva.announcements.dismissed') ?? '[]');
    expect(dismissed).toEqual(['a1']);
  });

  it('degrades to an inline retry row when the engine fails', async () => {
    stubEngine({ errorPaths: ['/console/notifications'] });
    renderPopover();
    fireEvent.click(await screen.findByRole('button', { name: /^Notifications/ }));
    expect(await screen.findByText(/Couldn’t load notifications/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/ })).toBeInTheDocument();
  });
});
