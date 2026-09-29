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
import { ApiError } from '@lib/engine/client';
import { WebhookEditSection } from './WebhookEditSection';
import type { WebhookEventCatalogEntry, WebhookSummary } from '@hooks/studio/useWebhooks';

let mockRole = 'owner';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

const updateMutate = vi.fn();

let webhooksState: {
  data?: WebhookSummary[];
  isPending: boolean;
  isError: boolean;
  error?: unknown;
} = { data: [], isPending: false, isError: false };

const catalogData: WebhookEventCatalogEntry[] = [
  { type: 'agent.published', description: 'An agent was published.' },
  { type: 'run.completed', description: 'A run finished.' },
];

vi.mock('@hooks/studio/useWebhooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useWebhooks')>();
  return {
    ...actual,
    useWebhooks: () => webhooksState,
    useWebhookEvents: () => ({ data: catalogData, isPending: false, isError: false }),
    useUpdateWebhook: () => ({ mutate: updateMutate, isPending: false, reset: vi.fn() }),
  };
});

vi.mock('@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard', () => ({
  useDirtyGuard: vi.fn(() => ({ dialog: null })),
}));

vi.mock('react-hot-toast', () => {
  const fn = vi.fn() as never;
  const success = vi.fn() as never;
  const error = vi.fn() as never;
  return { default: Object.assign(fn, { success, error }) };
});

function webhook(overrides?: Partial<WebhookSummary>): WebhookSummary {
  return {
    id: 'wh_1',
    url: 'https://hooks.example.com/neryva',
    events: ['agent.published'],
    status: 'active',
    description: 'order events',
    secretHint: '•••c123',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-02T10:00:00Z',
    ...overrides,
  };
}

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

const EDIT_PATH = '/agent-studio/integrations/webhooks/wh_1/edit';
const LIST_PATH = '/agent-studio/integrations/webhooks';

async function routerAt(initialPath: string, role = 'owner') {
  mockRole = role;
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/integrations/webhooks',
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: () => shell(<div>webhooks list</div>),
  });
  const editRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/$webhookId/edit',
    component: () => shell(<WebhookEditSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, editRoute])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

async function guardMock() {
  const mod = await import('@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard');
  return vi.mocked(mod.useDirtyGuard);
}

function urlInput() {
  return screen.getByLabelText(/Destination URL/) as HTMLInputElement;
}

function saveButton() {
  return screen.getByRole('button', { name: 'Save changes' });
}

/** Simulates the engine accepting the update: the section must return to the list. */
async function succeedUpdate() {
  const opts = updateMutate.mock.calls[0]?.[1] as { onSuccess?: () => void } | undefined;
  expect(opts?.onSuccess).toBeTypeOf('function');
  await act(async () => {
    opts?.onSuccess?.();
  });
}

beforeEach(() => {
  mockRole = 'owner';
  webhooksState = { data: [webhook()], isPending: false, isError: false };
  updateMutate.mockClear();
  sessionStorage.clear();
  localStorage.clear();
});

describe('WebhookEditSection routing gates', () => {
  it('bounces an unknown webhook id back to the list and renders nothing', async () => {
    const router = await routerAt('/agent-studio/integrations/webhooks/wh_nope/edit');
    expect(router.state.location.pathname).toBe(LIST_PATH);
    expect(screen.queryByRole('heading', { name: 'Edit webhook' })).toBeNull();
  });

  it('bounces to the list when the engine 404s the webhooks read', async () => {
    webhooksState = {
      data: undefined,
      isPending: false,
      isError: true,
      error: new ApiError(404, 'not_found', 'webhooks module disabled'),
    };
    const router = await routerAt(EDIT_PATH);
    expect(router.state.location.pathname).toBe(LIST_PATH);
    expect(screen.queryByRole('heading', { name: 'Edit webhook' })).toBeNull();
  });
});

describe('WebhookEditSection prefill', () => {
  it('prefills url, description, events, and status from the webhook', async () => {
    await routerAt(EDIT_PATH);
    expect(urlInput().value).toBe('https://hooks.example.com/neryva');
    expect((screen.getByLabelText(/Description/) as HTMLInputElement).value).toBe('order events');
    expect(screen.getByRole('button', { name: 'agent.published' })).toBeTruthy();
    expect(screen.getByText('The webhook receives deliveries.')).toBeTruthy();
  });

  it('falls back to "All events (*)" when the webhook has no subscriptions', async () => {
    webhooksState = { data: [webhook({ events: [] })], isPending: false, isError: false };
    await routerAt(EDIT_PATH);
    expect(screen.getByRole('button', { name: /All events/ })).toBeTruthy();
    expect(screen.getByText('This webhook receives every event type.')).toBeTruthy();
  });
});

describe('WebhookEditSection validation and save', () => {
  it('disables Save for an invalid URL', async () => {
    await routerAt(EDIT_PATH);
    expect(saveButton().hasAttribute('disabled')).toBe(false);
    await act(async () => {
      fireEvent.change(urlInput(), { target: { value: 'not-a-url' } });
    });
    expect(saveButton().hasAttribute('disabled')).toBe(true);
  });

  it('sends a trimmed URL, events, null description when blanked, and status on save', async () => {
    const router = await routerAt(EDIT_PATH);
    // Separate acts per interaction: each mirrors a discrete user task so
    // React flushes the state update before the next element is queried.
    // (Batching several fireEvents in one act can leave a later click
    // holding a stale render's closure.)
    await act(async () => {
      fireEvent.change(urlInput(), { target: { value: '  https://hooks.example.com/v2  ' } });
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Description/), { target: { value: '' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));
    });
    await act(async () => {
      fireEvent.click(saveButton());
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as {
      webhookId: string;
      url: string;
      events: string[];
      description: string | null;
      status: string;
    };
    expect(input.webhookId).toBe('wh_1');
    expect(input.url).toBe('https://hooks.example.com/v2');
    expect(input.events).toEqual(['agent.published']);
    expect(input.description).toBeNull();
    expect(input.status).toBe('disabled');
    await succeedUpdate();
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });

  it('keeps the description when it is unchanged', async () => {
    await routerAt(EDIT_PATH);
    await act(async () => {
      fireEvent.change(urlInput(), { target: { value: 'https://hooks.example.com/changed' } });
      fireEvent.click(saveButton());
    });
    const input = updateMutate.mock.calls[0][0] as { description: string | null };
    expect(input.description).toBe('order events');
  });

  it('shows the disabled-status hint copy', async () => {
    await routerAt(EDIT_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));
    });
    expect(screen.getByText('Disabled webhooks keep their history but receive nothing.')).toBeTruthy();
  });

  it('navigates back to the list on Cancel', async () => {
    const router = await routerAt(EDIT_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });
});

describe('WebhookEditSection dirty guard', () => {
  it('arms on any field change and stays disarmed when pristine', async () => {
    const guard = await guardMock();
    await routerAt(EDIT_PATH);
    expect(guard).toHaveBeenLastCalledWith(false, expect.any(String));
    await act(async () => {
      fireEvent.change(urlInput(), { target: { value: 'https://hooks.example.com/changed' } });
    });
    expect(guard).toHaveBeenLastCalledWith(true, expect.any(String));
  });

  it('releases the guard on the committed-save navigation', async () => {
    // The file-level useDirtyGuard mock cannot observe the release: the
    // success navigation unmounts the section in the same commit, so the
    // intermediate submitted=true render never commits. Swap in the real
    // guard for this test and assert the user-visible contract instead —
    // the committed save navigates without tripping the leave dialog.
    const guard = await guardMock();
    const actual = await vi.importActual<
      typeof import('@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard')
    >('@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard');
    guard.mockImplementation(actual.useDirtyGuard);
    try {
      const router = await routerAt(EDIT_PATH);
      await act(async () => {
        fireEvent.change(urlInput(), { target: { value: 'https://hooks.example.com/changed' } });
      });
      await act(async () => {
        fireEvent.click(saveButton());
      });
      await succeedUpdate();
      expect(router.state.location.pathname).toBe(LIST_PATH);
      expect(screen.queryByText('Leave without saving?')).toBeNull();
    } finally {
      guard.mockImplementation(() => ({ dialog: <></> }));
    }
  });
});

describe('WebhookEditSection permission gate', () => {
  it.each(['reader', 'billing'])('bounces a %s to the webhook list and renders nothing', async (role) => {
    const router = await routerAt(EDIT_PATH, role);
    expect(router.state.location.pathname).toBe(LIST_PATH);
    expect(screen.queryByRole('heading', { name: 'Edit webhook' })).toBeNull();
    expect(screen.queryByLabelText(/Destination URL/)).toBeNull();
  });

  it.each(['owner', 'admin', 'developer'])('renders the form for a %s', async (role) => {
    await routerAt(EDIT_PATH, role);
    expect(screen.getByRole('heading', { name: 'Edit webhook' })).toBeTruthy();
    expect(screen.getByLabelText(/Destination URL/)).toBeTruthy();
  });
});
