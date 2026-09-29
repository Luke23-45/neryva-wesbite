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
import { WebhookNewSection } from './WebhookNewSection';
import type { WebhookEventCatalogEntry, WebhookSummary } from '@hooks/studio/useWebhooks';

let mockRole = 'owner';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

const createMutate = vi.fn();

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
    useCreateWebhook: () => ({ mutate: createMutate, isPending: false }),
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

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

const NEW_PATH = '/agent-studio/integrations/webhooks/new';
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
  const newRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/new',
    component: () => shell(<WebhookNewSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, newRoute])]),
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

function fillUrl(value: string) {
  fireEvent.change(screen.getByLabelText(/Destination URL/), { target: { value } });
}

function createButton() {
  return screen.getByRole('button', { name: 'Create webhook' });
}

/** Simulates the engine accepting the create: the section must land on the success step. */
async function succeedCreate(secret: string | null = 'whsec_test_abc123') {
  const opts = createMutate.mock.calls[0]?.[1] as { onSuccess?: (r: unknown) => void } | undefined;
  expect(opts?.onSuccess).toBeTypeOf('function');
  await act(async () => {
    opts?.onSuccess?.({ id: 'wh_new_1', secret });
  });
}

beforeEach(() => {
  mockRole = 'owner';
  webhooksState = { data: [], isPending: false, isError: false };
  createMutate.mockClear();
  sessionStorage.clear();
  localStorage.clear();
});

describe('WebhookNewSection validation', () => {
  it('renders the form with "All events (*)" preselected and Create disabled', async () => {
    await routerAt(NEW_PATH);
    expect(screen.getByRole('heading', { name: 'New webhook' })).toBeTruthy();
    expect(screen.getByLabelText(/Destination URL/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /All events/ })).toBeTruthy();
    expect(createButton().hasAttribute('disabled')).toBe(true);
  });

  it('enables Create only for a valid http(s) URL', async () => {
    await routerAt(NEW_PATH);
    await act(async () => {
      fillUrl('not-a-url');
    });
    expect(createButton().hasAttribute('disabled')).toBe(true);
    await act(async () => {
      fillUrl('ftp://files.example.com/hook');
    });
    expect(createButton().hasAttribute('disabled')).toBe(true);
    await act(async () => {
      fillUrl('https://hooks.example.com/neryva');
    });
    expect(createButton().hasAttribute('disabled')).toBe(false);
  });

  it('disables Create when every event is deselected', async () => {
    await routerAt(NEW_PATH);
    await act(async () => {
      fillUrl('https://hooks.example.com/neryva');
    });
    expect(createButton().hasAttribute('disabled')).toBe(false);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /All events/ }));
    });
    expect(createButton().hasAttribute('disabled')).toBe(true);
  });
});

describe('WebhookNewSection create flow', () => {
  it('submits a trimmed URL, selected events, and a per-intent idempotency key', async () => {
    await routerAt(NEW_PATH);
    await act(async () => {
      fillUrl('  https://hooks.example.com/neryva  ');
      fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'order events' } });
      fireEvent.click(createButton());
    });
    expect(createMutate).toHaveBeenCalledTimes(1);
    const input = createMutate.mock.calls[0][0] as {
      url: string;
      events: string[];
      description?: string;
      idempotencyKey?: string;
    };
    expect(input.url).toBe('https://hooks.example.com/neryva');
    expect(input.events).toEqual(['*']);
    expect(input.description).toBe('order events');
    expect(input.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('omits the description when it is blank', async () => {
    await routerAt(NEW_PATH);
    await act(async () => {
      fillUrl('https://hooks.example.com/neryva');
      fireEvent.click(createButton());
    });
    const input = createMutate.mock.calls[0][0] as { description?: string };
    expect(input.description).toBeUndefined();
  });

  it('opens the one-time-secret modal showing the secret exactly once, then returns to the list on Done', async () => {
    const guard = await guardMock();
    const router = await routerAt(NEW_PATH);
    await act(async () => {
      fillUrl('https://hooks.example.com/neryva');
    });
    await act(async () => {
      fireEvent.click(createButton());
    });
    await succeedCreate('whsec_test_abc123');
    // Alert-class modal (not a content step): the secret is revealed once.
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('whsec_test_abc123')).toBeTruthy();
    // Committed — the guard released for the modal and the return navigation.
    expect(guard).toHaveBeenLastCalledWith(false, expect.any(String));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /I've saved the secret/ }));
    });
    expect(router.state.location.pathname).toBe(LIST_PATH);
    // Shown once: the secret is gone after the modal closes.
    expect(screen.queryByText('whsec_test_abc123')).toBeNull();
  });

  it('navigates straight to the list when the engine returns no secret', async () => {
    const router = await routerAt(NEW_PATH);
    await act(async () => {
      fillUrl('https://hooks.example.com/neryva');
    });
    await act(async () => {
      fireEvent.click(createButton());
    });
    await succeedCreate(null);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });

  it('navigates back to the list on Cancel', async () => {
    const router = await routerAt(NEW_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });
});

describe('WebhookNewSection dirty guard', () => {
  it('arms while the draft is unsent and stays disarmed when pristine', async () => {
    const guard = await guardMock();
    await routerAt(NEW_PATH);
    expect(guard).toHaveBeenLastCalledWith(false, expect.any(String));
    await act(async () => {
      fillUrl('https://hooks.example.com/neryva');
    });
    expect(guard).toHaveBeenLastCalledWith(true, expect.any(String));
  });

  it('does not trip the guard on Cancel from a pristine form', async () => {
    const guard = await guardMock();
    const router = await routerAt(NEW_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(guard).toHaveBeenLastCalledWith(false, expect.any(String));
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });
});

describe('WebhookNewSection disabled-module gate', () => {
  it('bounces to the webhook list when the engine 404s the webhooks read', async () => {
    webhooksState = {
      data: undefined,
      isPending: false,
      isError: true,
      error: new ApiError(404, 'not_found', 'webhooks module disabled'),
    };
    const router = await routerAt(NEW_PATH);
    expect(router.state.location.pathname).toBe(LIST_PATH);
    expect(screen.queryByRole('heading', { name: 'New webhook' })).toBeNull();
  });
});

describe('WebhookNewSection permission gate', () => {
  it.each(['reader', 'billing'])('bounces a %s to the webhook list and renders nothing', async (role) => {
    const router = await routerAt(NEW_PATH, role);
    expect(router.state.location.pathname).toBe(LIST_PATH);
    expect(screen.queryByRole('heading', { name: 'New webhook' })).toBeNull();
    expect(screen.queryByLabelText(/Destination URL/)).toBeNull();
  });

  it.each(['owner', 'admin', 'developer'])('renders the form for a %s', async (role) => {
    await routerAt(NEW_PATH, role);
    expect(screen.getByRole('heading', { name: 'New webhook' })).toBeTruthy();
    expect(screen.getByLabelText(/Destination URL/)).toBeTruthy();
  });
});

describe('WebhookNewSection refresh-safe secret reveal', () => {
  const MARKER = 'neryva:webhook-pending-secret-reveal';

  it('writes the pending-reveal marker on create-success and clears it on Done', async () => {
    const router = await routerAt(NEW_PATH);
    await act(async () => {
      fillUrl('https://hooks.example.com/neryva');
    });
    await act(async () => {
      fireEvent.click(createButton());
    });
    await succeedCreate('whsec_test_abc123');
    // Marker records the created webhook id; the secret itself is memory-only.
    expect(sessionStorage.getItem(MARKER)).toBe('wh_new_1');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /I've saved the secret/ }));
    });
    expect(router.state.location.pathname).toBe(LIST_PATH);
    expect(sessionStorage.getItem(MARKER)).toBeNull();
  });

  it('shows "already revealed" instead of an empty form after a refresh-during-reveal', async () => {
    // Simulate the refresh: the in-memory secret is gone, the marker survives.
    sessionStorage.setItem(MARKER, 'wh_new_1');
    await routerAt(NEW_PATH);
    expect(screen.getByRole('heading', { name: 'Secret already revealed' })).toBeTruthy();
    expect(screen.queryByLabelText(/Destination URL/)).toBeNull();
    expect(
      screen.getByText(/shown exactly once and can't be displayed again/i),
    ).toBeTruthy();
  });

  it('dismissing the interrupted reveal clears the marker and restores the form', async () => {
    sessionStorage.setItem(MARKER, 'wh_new_1');
    await routerAt(NEW_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    });
    expect(sessionStorage.getItem(MARKER)).toBeNull();
    expect(screen.getByRole('heading', { name: 'New webhook' })).toBeTruthy();
    expect(screen.getByLabelText(/Destination URL/)).toBeTruthy();
  });
});
