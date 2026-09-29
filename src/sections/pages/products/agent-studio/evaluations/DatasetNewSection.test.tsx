// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createBrowserHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { DatasetNewSection } from './DatasetNewSection';
import { EVAL_DATASET_NAME_MAX, EVAL_DATASET_DESC_MAX } from '@hooks/studio/useSetupEval';

let mockRole = 'owner';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

const createMutate = vi.fn();

vi.mock('@hooks/studio/useSetupEval', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupEval')>();
  return {
    ...actual,
    useCreateEvalDataset: () => ({
      mutate: (input: unknown, opts?: { onSuccess?: () => void }) => {
        createMutate(input, opts);
      },
      isPending: false,
    }),
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

async function routerAt(initialPath: string, role = 'owner') {
  mockRole = role;
  // Browser history, not memory history: the installed @tanstack/history only
  // wires navigation blockers for the browser backend (memory-history block()
  // is a silent no-op there), and it is the backend the production app uses.
  window.history.replaceState(null, '', initialPath);
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/evaluations',
    validateSearch: (search: Record<string, unknown>) => ({
      returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
    }),
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: () => shell(<div>evaluations list</div>),
  });
  const datasetNewRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/datasets/new',
    component: () => shell(<DatasetNewSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, datasetNewRoute])]),
    history: createBrowserHistory(),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  createMutate.mockClear();
  sessionStorage.clear();
  localStorage.clear();
});

const NEW_PATH = '/agent-studio/evaluations/datasets/new';
const LIST_PATH = '/agent-studio/evaluations';

function fillName(value = 'refund-regressions') {
  fireEvent.change(screen.getByLabelText(/Name/), { target: { value } });
}

/** Simulates the engine accepting the create: the section must exit via the return contract. */
async function succeedCreate() {
  const opts = createMutate.mock.calls[0]?.[1] as { onSuccess?: () => void } | undefined;
  expect(opts?.onSuccess).toBeTypeOf('function');
  await act(async () => {
    opts?.onSuccess?.();
  });
}

describe('DatasetNewSection role gate', () => {
  it('bounces a reader to the evaluations list and renders nothing', async () => {
    const router = await routerAt(NEW_PATH, 'reader');
    expect(router.state.location.pathname).toBe(LIST_PATH);
    expect(screen.queryByText('New dataset')).toBeNull();
    expect(screen.queryByLabelText(/Name/)).toBeNull();
  });

  it('renders the form for an owner', async () => {
    await routerAt(NEW_PATH);
    expect(screen.getByText('New dataset')).toBeTruthy();
    expect(screen.getByLabelText(/Name/)).toBeTruthy();
    expect(screen.getByLabelText(/Description/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create' })).toBeTruthy();
    // Back row: ‹ Evaluations (the chevron is aria-hidden, so the name is "Evaluations")
    expect(screen.getByRole('link', { name: 'Evaluations' })).toHaveProperty(
      'href',
      expect.stringContaining(LIST_PATH),
    );
  });

  it('renders the form for a developer (setup:author)', async () => {
    await routerAt(NEW_PATH, 'developer');
    expect(screen.getByText('New dataset')).toBeTruthy();
  });
});

describe('DatasetNewSection validation parity with the old modal', () => {
  it('keeps Create disabled until the name is non-blank', async () => {
    await routerAt(NEW_PATH);
    expect(screen.getByRole('button', { name: 'Create' })).toHaveProperty('disabled', true);
    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'Create' })).toHaveProperty('disabled', true);
    fillName();
    expect(screen.getByRole('button', { name: 'Create' })).toHaveProperty('disabled', false);
    expect(createMutate).not.toHaveBeenCalled();
  });

  it('caps name and description at the engine truncation limits (E-02)', async () => {
    await routerAt(NEW_PATH);
    expect(screen.getByLabelText(/Name/)).toHaveProperty('maxLength', EVAL_DATASET_NAME_MAX);
    expect(screen.getByLabelText(/Description/)).toHaveProperty('maxLength', EVAL_DATASET_DESC_MAX);
    expect(EVAL_DATASET_NAME_MAX).toBe(128);
    expect(EVAL_DATASET_DESC_MAX).toBe(2048);
  });

  it('posts the trimmed name and omits an empty description', async () => {
    await routerAt(NEW_PATH);
    fillName('  padded-name  ');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    });
    expect(createMutate).toHaveBeenCalledTimes(1);
    expect(createMutate.mock.calls[0][0]).toEqual({ name: 'padded-name' });
  });

  it('posts the trimmed description when present', async () => {
    await routerAt(NEW_PATH);
    fillName();
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: '  guards refunds  ' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    });
    expect(createMutate.mock.calls[0][0]).toEqual({ name: 'refund-regressions', description: 'guards refunds' });
  });
});

describe('DatasetNewSection returnTo contract (C14)', () => {
  it('Create success lands on the threaded returnTo', async () => {
    const router = await routerAt(`${NEW_PATH}?returnTo=/agent-studio/evaluations/runs/xyz`);
    fillName();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    });
    await succeedCreate();
    expect(router.state.location.pathname).toBe('/agent-studio/evaluations/runs/xyz');
  });

  it('Create success falls back to the evaluations list without a returnTo', async () => {
    const router = await routerAt(NEW_PATH);
    fillName();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    });
    await succeedCreate();
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });

  it('Cancel honors the threaded returnTo', async () => {
    const router = await routerAt(`${NEW_PATH}?returnTo=/agent-studio/evaluations/runs/xyz`);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(router.state.location.pathname).toBe('/agent-studio/evaluations/runs/xyz');
  });

  it.each([
    ['https://evil.example', 'absolute URL'],
    ['/admin', 'non-/agent-studio/ path'],
  ])('rejects a hostile returnTo (%s) and falls back to the evaluations list', async (hostile) => {
    const router = await routerAt(`${NEW_PATH}?returnTo=${encodeURIComponent(hostile)}`);
    fillName();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    });
    await succeedCreate();
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });
});

describe('DatasetNewSection dirty guard', () => {
  it('blocks Cancel and the back row while the draft is unsent', async () => {
    const router = await routerAt(NEW_PATH);
    fillName();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(screen.getByText('Leave without saving?')).toBeTruthy();
    expect(router.state.location.pathname).toBe(NEW_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Stay' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Evaluations' }));
    });
    expect(screen.getByText('Leave without saving?')).toBeTruthy();
    expect(router.state.location.pathname).toBe(NEW_PATH);
  });

  it('releases the guard on the committed-submit navigation (no leave dialog after Create)', async () => {
    const router = await routerAt(NEW_PATH);
    fillName();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    });
    await succeedCreate();
    // Committed — arrival, not a blocker dialog.
    expect(router.state.location.pathname).toBe(LIST_PATH);
    expect(screen.queryByText('Leave without saving?')).toBeNull();
  });

  it('does not trip the guard on Cancel from a pristine form', async () => {
    const router = await routerAt(NEW_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(screen.queryByText('Leave without saving?')).toBeNull();
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });
});
