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
import { RunNewSection } from './RunNewSection';
import type { EvalDataset } from '@hooks/studio/useSetupEval';

let mockRole = 'owner';
const mockDatasets: EvalDataset[] = [
  { id: 'd1', name: 'refund-regressions', description: null, createdAt: '2026-09-01' },
];
const mockAssistants = [{ id: 'a1', name: 'support-bot' }];
let mockVersions = [
  { id: 'v-pub', version: 3, status: 'PUBLISHED', hash: 'abcdef1234567890' },
  { id: 'v-draft', version: 0, status: 'DRAFT', hash: 'draft1234567890' },
];

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

const startMutate = vi.fn();

vi.mock('@hooks/studio/useSetupEval', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupEval')>();
  return {
    ...actual,
    useEvalDatasets: () => ({
      data: mockDatasets,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useStartEvalRun: () => ({
      mutate: (input: unknown, opts?: { onSuccess?: () => void }) => {
        startMutate(input, opts);
      },
      isPending: false,
    }),
  };
});

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({
    data: mockAssistants,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

vi.mock('@hooks/studio/useAgentAuthoring', () => ({
  useAssistantVersions: () => ({
    data: mockVersions,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
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
  const runNewRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/runs/new',
    component: () => shell(<RunNewSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, runNewRoute])]),
    history: createBrowserHistory(),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  mockVersions = [
    { id: 'v-pub', version: 3, status: 'PUBLISHED', hash: 'abcdef1234567890' },
    { id: 'v-draft', version: 0, status: 'DRAFT', hash: 'draft1234567890' },
  ];
  startMutate.mockClear();
  sessionStorage.clear();
  localStorage.clear();
});

const NEW_PATH = '/agent-studio/evaluations/runs/new';
const LIST_PATH = '/agent-studio/evaluations';

function datasetPicker() {
  return screen.getByLabelText('Dataset', { selector: 'select' });
}
function assistantPicker() {
  return screen.getByLabelText('Assistant (to locate published versions)', { selector: 'select' });
}
function versionPicker() {
  return screen.getByLabelText('Published version', { selector: 'select' });
}

function pickDataset() {
  fireEvent.change(datasetPicker(), { target: { value: 'd1' } });
}
function pickAssistant() {
  fireEvent.change(assistantPicker(), { target: { value: 'a1' } });
}
function pickPublishedVersion() {
  fireEvent.change(versionPicker(), { target: { value: 'v-pub' } });
}

/** Simulates the engine accepting the run: the section must exit via the return contract. */
async function succeedStart() {
  const opts = startMutate.mock.calls[0]?.[1] as { onSuccess?: () => void } | undefined;
  expect(opts?.onSuccess).toBeTypeOf('function');
  await act(async () => {
    opts?.onSuccess?.();
  });
}

describe('RunNewSection role gate', () => {
  it('bounces a reader to the evaluations list and renders nothing', async () => {
    const router = await routerAt(NEW_PATH, 'reader');
    expect(router.state.location.pathname).toBe(LIST_PATH);
    expect(screen.queryByText('Start eval run')).toBeNull();
    expect(screen.queryByLabelText('Dataset', { selector: 'select' })).toBeNull();
  });

  it('renders the run configuration for an owner', async () => {
    await routerAt(NEW_PATH);
    expect(screen.getByText('Start eval run')).toBeTruthy();
    expect(datasetPicker()).toBeTruthy();
    expect(assistantPicker()).toBeTruthy();
    expect(versionPicker()).toBeTruthy();
    expect(screen.getByLabelText('Attempts per case (1–5)')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Start run' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Evaluations' })).toHaveProperty(
      'href',
      expect.stringContaining(LIST_PATH),
    );
  });
});

describe('RunNewSection run-config semantics (parity with the old modal)', () => {
  it('keeps Start run disabled until a dataset and version are chosen', async () => {
    await routerAt(NEW_PATH);
    expect(screen.getByRole('button', { name: 'Start run' })).toHaveProperty('disabled', true);
    pickDataset();
    expect(screen.getByRole('button', { name: 'Start run' })).toHaveProperty('disabled', true);
    pickAssistant();
    pickPublishedVersion();
    expect(screen.getByRole('button', { name: 'Start run' })).toHaveProperty('disabled', false);
    expect(startMutate).not.toHaveBeenCalled();
  });

  it('lists only PUBLISHED versions — drafts are excluded', async () => {
    await routerAt(NEW_PATH);
    pickAssistant();
    const options = Array.from(versionPicker().querySelectorAll('option')).map((o) => o.value);
    expect(options).toContain('v-pub');
    expect(options).not.toContain('v-draft');
  });

  it('resets the version when the assistant changes', async () => {
    await routerAt(NEW_PATH);
    pickAssistant();
    pickPublishedVersion();
    expect(versionPicker()).toHaveValue('v-pub');
    fireEvent.change(assistantPicker(), { target: { value: '' } });
    expect(versionPicker()).toHaveValue('');
  });

  it('posts the identical start payload: dataset, trimmed version id, clamped attempts', async () => {
    await routerAt(NEW_PATH);
    pickDataset();
    pickAssistant();
    pickPublishedVersion();
    fireEvent.change(screen.getByLabelText('Attempts per case (1–5)'), { target: { value: '3' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start run' }));
    });
    expect(startMutate).toHaveBeenCalledTimes(1);
    expect(startMutate.mock.calls[0][0]).toEqual({
      datasetId: 'd1',
      assistantVersionId: 'v-pub',
      attemptsPerCase: 3,
    });
  });

  it('clamps attempts below 1 and above 5', async () => {
    await routerAt(NEW_PATH);
    pickDataset();
    pickAssistant();
    pickPublishedVersion();
    fireEvent.change(screen.getByLabelText('Attempts per case (1–5)'), { target: { value: '99' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start run' }));
    });
    expect(startMutate.mock.calls[0][0]).toMatchObject({ attemptsPerCase: 5 });

    startMutate.mockClear();
    fireEvent.change(screen.getByLabelText('Attempts per case (1–5)'), { target: { value: '0' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start run' }));
    });
    expect(startMutate.mock.calls[0][0]).toMatchObject({ attemptsPerCase: 1 });
  });
});

describe('RunNewSection returnTo contract (C14)', () => {
  it('Start run success lands on the threaded returnTo', async () => {
    const router = await routerAt(`${NEW_PATH}?returnTo=/agent-studio/evaluations/runs/xyz`);
    pickDataset();
    pickAssistant();
    pickPublishedVersion();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start run' }));
    });
    await succeedStart();
    expect(router.state.location.pathname).toBe('/agent-studio/evaluations/runs/xyz');
  });

  it('falls back to the evaluations list without a returnTo', async () => {
    const router = await routerAt(NEW_PATH);
    pickDataset();
    pickAssistant();
    pickPublishedVersion();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start run' }));
    });
    await succeedStart();
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });

  it('rejects a hostile returnTo and falls back to the evaluations list', async () => {
    const router = await routerAt(`${NEW_PATH}?returnTo=${encodeURIComponent('https://evil.example')}`);
    pickDataset();
    pickAssistant();
    pickPublishedVersion();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start run' }));
    });
    await succeedStart();
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });
});

describe('RunNewSection dirty guard', () => {
  it('blocks the back-row navigation while the run configuration is unsent', async () => {
    const router = await routerAt(NEW_PATH);
    pickDataset();
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Evaluations' }));
    });
    expect(screen.getByText('Leave without saving?')).toBeTruthy();
    expect(router.state.location.pathname).toBe(NEW_PATH);
  });

  it('does not block when the configuration is pristine', async () => {
    const router = await routerAt(NEW_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(screen.queryByText('Leave without saving?')).toBeNull();
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });
});
