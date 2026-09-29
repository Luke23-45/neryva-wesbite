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
import { CasesNewSection } from './CasesNewSection';
import type { EvalDataset } from '@hooks/studio/useSetupEval';

let mockRole = 'owner';
let mockDatasets: EvalDataset[] = [
  { id: 'd1', name: 'refund-regressions', description: null, createdAt: '2026-09-01' },
];

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

const addMutate = vi.fn();

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
    useAddEvalCases: () => ({
      mutate: (input: unknown, opts?: { onSuccess?: () => void }) => {
        addMutate(input, opts);
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
  const casesNewRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/datasets/$datasetId/cases/new',
    component: () => shell(<CasesNewSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, casesNewRoute])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  mockDatasets = [{ id: 'd1', name: 'refund-regressions', description: null, createdAt: '2026-09-01' }];
  addMutate.mockClear();
  sessionStorage.clear();
  localStorage.clear();
});

const NEW_PATH = '/agent-studio/evaluations/datasets/d1/cases/new';
const LIST_PATH = '/agent-studio/evaluations';

function fillValidDraft(text = 'What is the refund policy?') {
  fireEvent.change(screen.getByLabelText('Input text (required)'), { target: { value: text } });
}

/** Simulates the engine accepting the append: the section must exit via the return contract. */
async function succeedAdd() {
  const opts = addMutate.mock.calls[0]?.[1] as { onSuccess?: () => void } | undefined;
  expect(opts?.onSuccess).toBeTypeOf('function');
  await act(async () => {
    opts?.onSuccess?.();
  });
}

describe('CasesNewSection role gate + dataset bounce', () => {
  it('bounces a reader to the evaluations list and renders nothing', async () => {
    const router = await routerAt(NEW_PATH, 'reader');
    expect(router.state.location.pathname).toBe(LIST_PATH);
    expect(screen.queryByText('Add cases — refund-regressions')).toBeNull();
    expect(screen.queryByLabelText('Input text (required)')).toBeNull();
  });

  it('renders the builder for an owner', async () => {
    await routerAt(NEW_PATH);
    expect(screen.getByText('Add cases — refund-regressions')).toBeTruthy();
    expect(screen.getByLabelText('Input text (required)')).toBeTruthy();
    expect(screen.getByLabelText('Must contain (one per line)')).toBeTruthy();
    expect(screen.getByLabelText('Must not contain (one per line)')).toBeTruthy();
    expect(screen.getByLabelText(/State assertions/)).toBeTruthy();
    expect(screen.getByLabelText(/Expected document ids/)).toBeTruthy();
    expect(screen.getByLabelText(/Rubric instructions/)).toBeTruthy();
    expect(screen.getByLabelText('Min score')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Another case' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Preview JSON' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    // Back row: ‹ Evaluations (the chevron is aria-hidden, so the name is "Evaluations")
    expect(screen.getByRole('link', { name: 'Evaluations' })).toHaveProperty(
      'href',
      expect.stringContaining(LIST_PATH),
    );
  });

  it('renders the builder for a developer (setup:author)', async () => {
    await routerAt(NEW_PATH, 'developer');
    expect(screen.getByText('Add cases — refund-regressions')).toBeTruthy();
  });

  it('bounces an unknown dataset id to the evaluations list', async () => {
    const router = await routerAt('/agent-studio/evaluations/datasets/nope/cases/new');
    expect(router.state.location.pathname).toBe(LIST_PATH);
    expect(screen.queryByLabelText('Input text (required)')).toBeNull();
  });
});

describe('CasesNewSection returnTo contract (C14)', () => {
  it('Done lands on the threaded returnTo after a successful add', async () => {
    const router = await routerAt(`${NEW_PATH}?returnTo=/agent-studio/evaluations/runs/xyz`);
    fillValidDraft();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add 1 case' }));
    });
    expect(addMutate).toHaveBeenCalledWith(
      expect.objectContaining({ datasetId: 'd1' }),
      expect.anything(),
    );
    await succeedAdd();
    expect(router.state.location.pathname).toBe('/agent-studio/evaluations/runs/xyz');
  });

  it('Cancel honors the threaded returnTo', async () => {
    const router = await routerAt(`${NEW_PATH}?returnTo=/agent-studio/evaluations/runs/xyz`);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(router.state.location.pathname).toBe('/agent-studio/evaluations/runs/xyz');
  });

  it('falls back to the evaluations list when no returnTo is threaded', async () => {
    const router = await routerAt(NEW_PATH);
    fillValidDraft();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add 1 case' }));
    });
    await succeedAdd();
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });

  it.each([
    ['https://evil.example', 'absolute URL'],
    ['/admin', 'non-/agent-studio/ path'],
  ])('rejects a hostile returnTo (%s) and falls back to the evaluations list', async (hostile) => {
    const router = await routerAt(`${NEW_PATH}?returnTo=${encodeURIComponent(hostile)}`);
    fillValidDraft();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add 1 case' }));
    });
    await succeedAdd();
    expect(router.state.location.pathname).toBe(LIST_PATH);
  });
});

describe('CasesNewSection validation parity with the old modal', () => {
  it('rejects an empty draft: per-case problem shown, Add disabled with the reason as title', async () => {
    await routerAt(NEW_PATH);
    expect(screen.getByText('Case text is required (1–8192 chars).')).toBeTruthy();
    const add = screen.getByRole('button', { name: 'Add 1 case' });
    expect(add).toHaveProperty('disabled', true);
    expect(add).toHaveProperty('title', 'Case text is required (1–8192 chars).');
    expect(addMutate).not.toHaveBeenCalled();
  });

  it('enables Add once the single draft validates, posting the built body', async () => {
    await routerAt(NEW_PATH);
    fillValidDraft();
    const add = screen.getByRole('button', { name: 'Add 1 case' });
    expect(add).toHaveProperty('disabled', false);
    expect(screen.queryByText('Case text is required (1–8192 chars).')).toBeNull();
    await act(async () => {
      fireEvent.click(add);
    });
    expect(addMutate).toHaveBeenCalledTimes(1);
    const [input] = addMutate.mock.calls[0];
    expect(input).toEqual({
      datasetId: 'd1',
      cases: [{ input: { text: 'What is the refund policy?' } }],
    });
  });

  it('keeps Add N cases disabled until every draft validates (repeatable drafts)', async () => {
    await routerAt(NEW_PATH);
    fillValidDraft('First case');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Another case' }));
    });
    const add2 = screen.getByRole('button', { name: 'Add 2 cases' });
    expect(add2).toHaveProperty('disabled', true);
    // The second draft is the invalid one — fill it via its own labelled field.
    const inputs = screen.getAllByLabelText('Input text (required)');
    expect(inputs).toHaveLength(2);
    fireEvent.change(inputs[1], { target: { value: 'Second case' } });
    expect(screen.getByRole('button', { name: 'Add 2 cases' })).toHaveProperty('disabled', false);
  });

  it('removes a draft and toggles the JSON preview of the valid bodies', async () => {
    await routerAt(NEW_PATH);
    fillValidDraft('Preview me');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Preview JSON' }));
    });
    const pre = document.querySelector('pre');
    expect(pre?.textContent).toContain('Preview me');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Hide JSON' }));
    });
    expect(document.querySelector('pre')).toBeNull();
  });

  it('Remove drops the draft and its validation state', async () => {
    await routerAt(NEW_PATH);
    fillValidDraft('Keep me');
    fireEvent.click(screen.getByRole('button', { name: 'Another case' }));
    expect(screen.getByText('Case 2')).toBeTruthy();
    // Two drafts: the Remove buttons appear. Remove the second one.
    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    expect(removeButtons).toHaveLength(2);
    fireEvent.click(removeButtons[1]);
    expect(screen.queryByText('Case 2')).toBeNull();
    expect(screen.getByText('Case 1')).toBeTruthy();
    // The surviving draft keeps its content; Remove hides again on one draft.
    expect(screen.getByLabelText('Input text (required)')).toHaveValue('Keep me');
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull();
  });
});
