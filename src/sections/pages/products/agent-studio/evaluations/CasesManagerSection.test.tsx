// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
import toast from 'react-hot-toast';
import { theme } from '@styles/theme';
import { CasesManagerSection } from './CasesManagerSection';
import type { EvalDataset, EvalCaseList } from '@hooks/studio/useSetupEval';

let mockRole = 'owner';
let mockDatasets: EvalDataset[] = [
  { id: 'd1', name: 'refund-regressions', description: null, createdAt: '2026-09-01' },
];
let mockCaseList: EvalCaseList = {
  cases: [
    {
      id: 'c1',
      sequence: 1,
      input: { text: 'What is the refund policy?' },
      expected: { contains: ['refund'] },
      rubric: null,
      createdAt: '2026-09-01',
    },
  ],
  total: 1,
  limit: 100,
  offset: 0,
};

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
}));

vi.mock('react-hot-toast', () => {
  const fn = vi.fn();
  const success = vi.fn();
  const error = vi.fn();
  return { default: Object.assign(fn, { success, error }) };
});

const updateMutate = vi.fn();
const deleteMutate = vi.fn();
const exportMutate = vi.fn();
const importMutate = vi.fn();
const downloadMock = vi.fn();

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
    useEvalCases: () => ({
      data: mockCaseList,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    }),
    useUpdateEvalCase: () => ({
      mutate: (input: unknown, opts?: { onSuccess?: () => void }) => {
        updateMutate(input, opts);
      },
      isPending: false,
    }),
    useDeleteEvalCase: () => ({
      mutate: (input: unknown, opts?: { onSuccess?: () => void }) => {
        deleteMutate(input, opts);
      },
      isPending: false,
    }),
    useExportEvalDataset: () => ({
      mutate: (input: unknown, opts?: { onSuccess?: (exp: unknown) => void }) => {
        exportMutate(input, opts);
      },
      isPending: false,
    }),
    useImportEvalCases: () => ({
      mutate: (input: unknown, opts?: { onSuccess?: () => void }) => {
        importMutate(input, opts);
      },
      isPending: false,
    }),
    downloadExportedFile: (exp: unknown) => {
      downloadMock(exp);
    },
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
  const casesRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/datasets/$datasetId/cases',
    component: () => shell(<CasesManagerSection />),
  });
  const casesNewRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/datasets/$datasetId/cases/new',
    component: () => shell(<div>cases new placeholder</div>),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, casesRoute, casesNewRoute])]),
    history: createBrowserHistory(),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockRole = 'owner';
  mockDatasets = [{ id: 'd1', name: 'refund-regressions', description: null, createdAt: '2026-09-01' }];
  mockCaseList = {
    cases: [
      {
        id: 'c1',
        sequence: 1,
        input: { text: 'What is the refund policy?' },
        expected: { contains: ['refund'] },
        rubric: null,
        createdAt: '2026-09-01',
      },
    ],
    total: 1,
    limit: 100,
    offset: 0,
  };
  updateMutate.mockClear();
  deleteMutate.mockClear();
  exportMutate.mockClear();
  importMutate.mockClear();
  downloadMock.mockClear();
  vi.mocked(toast.error).mockClear();
  sessionStorage.clear();
  localStorage.clear();
});

const CASES_PATH = '/agent-studio/evaluations/datasets/d1/cases';
const LIST_PATH = '/agent-studio/evaluations';

describe('CasesManagerSection dataset bounce + read access', () => {
  it('bounces an unknown dataset id to the evaluations list', async () => {
    const router = await routerAt('/agent-studio/evaluations/datasets/nope/cases');
    expect(router.state.location.pathname).toBe(LIST_PATH);
    expect(screen.queryByText(/Cases —/)).toBeNull();
  });

  it('renders the manager for an owner with the exact total', async () => {
    await routerAt(CASES_PATH);
    expect(screen.getByText('Cases — refund-regressions')).toBeTruthy();
    expect(screen.getByText('1 case total.')).toBeTruthy();
    expect(screen.getByText('What is the refund policy?')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Evaluations' })).toHaveProperty(
      'href',
      expect.stringContaining(LIST_PATH),
    );
  });

  it('lets a reader view (read is open) but disables write actions with the denied copy', async () => {
    await routerAt(CASES_PATH, 'reader');
    expect(screen.getByText('Cases — refund-regressions')).toBeTruthy();
    const denied = 'This action requires an owner, admin, or developer — your role is reader.';
    expect(screen.getByRole('button', { name: 'Add cases' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Add cases' })).toHaveProperty('title', denied);
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveProperty('title', denied);
    // Export stays available to readers (read access).
    expect(screen.getByRole('button', { name: 'Export JSON' })).toHaveProperty('disabled', false);
  });
});

describe('CasesManagerSection edit interaction', () => {
  it('edits a case through the strict case vocabulary and saves the rebuilt body', async () => {
    await routerAt(CASES_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    });
    // Prefilled from the case via draftFromCase — no forked logic.
    expect(screen.getByLabelText('Input text (required)')).toHaveValue('What is the refund policy?');
    expect(screen.getByLabelText('Must contain (one per line)')).toHaveValue('refund');
    fireEvent.change(screen.getByLabelText('Input text (required)'), {
      target: { value: 'What is the return policy?' },
    });
    const save = screen.getByRole('button', { name: 'Save changes' });
    expect(save).toHaveProperty('disabled', false);
    await act(async () => {
      fireEvent.click(save);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const [input] = updateMutate.mock.calls[0];
    expect(input).toMatchObject({ datasetId: 'd1', caseId: 'c1' });
    expect(input.body).toEqual({
      input: { text: 'What is the return policy?' },
      expected: { contains: ['refund'] },
    });
  });

  it('disables Save with the reason when the edited text is cleared', async () => {
    await routerAt(CASES_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    });
    fireEvent.change(screen.getByLabelText('Input text (required)'), { target: { value: '   ' } });
    const save = screen.getByRole('button', { name: 'Save changes' });
    expect(save).toHaveProperty('disabled', true);
    expect(save).toHaveProperty('title', 'Case text is required (1–8192 chars).');
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('Back to list abandons the edit without saving', async () => {
    await routerAt(CASES_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    });
    fireEvent.change(screen.getByLabelText('Input text (required)'), { target: { value: 'changed' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Back to list' }));
    });
    expect(updateMutate).not.toHaveBeenCalled();
    expect(screen.getByText('What is the refund policy?')).toBeTruthy();
  });

  it('blocks back-row navigation while the edit holds unsent changes', async () => {
    const router = await routerAt(CASES_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    });
    fireEvent.change(screen.getByLabelText('Input text (required)'), { target: { value: 'changed' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('link', { name: 'Evaluations' }));
    });
    expect(screen.getByText('Leave without saving?')).toBeTruthy();
    expect(router.state.location.pathname).toBe(CASES_PATH);
  });
});

describe('CasesManagerSection delete interaction (two-step)', () => {
  it('arms then confirms the delete', async () => {
    await routerAt(CASES_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    });
    expect(screen.getByRole('button', { name: 'Confirm delete' })).toBeTruthy();
    expect(deleteMutate).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    });
    expect(deleteMutate).toHaveBeenCalledTimes(1);
    expect(deleteMutate.mock.calls[0][0]).toEqual({ datasetId: 'd1', caseId: 'c1' });
  });

  it('Cancel disarms the delete without calling the mutation', async () => {
    await routerAt(CASES_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    });
    expect(deleteMutate).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Confirm delete' })).toBeNull();
  });
});

describe('CasesManagerSection export / import', () => {
  it('exports JSON and downloads the file on success', async () => {
    await routerAt(CASES_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }));
    });
    expect(exportMutate).toHaveBeenCalledTimes(1);
    expect(exportMutate.mock.calls[0][0]).toEqual({ datasetId: 'd1', format: 'json' });
    const opts = exportMutate.mock.calls[0][1] as { onSuccess?: (exp: unknown) => void } | undefined;
    const payload = { filename: 'd1.json', content: '{}' };
    await act(async () => {
      opts?.onSuccess?.(payload);
    });
    expect(downloadMock).toHaveBeenCalledWith(payload);
  });

  it('exports CSV with the csv format', async () => {
    await routerAt(CASES_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    });
    expect(exportMutate.mock.calls[0][0]).toEqual({ datasetId: 'd1', format: 'csv' });
  });

  it('fails visibly (A4-44) when the imported file is not valid JSON', async () => {
    await routerAt(CASES_PATH);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    const bad = new File(['this is not json'], 'bad.json', { type: 'application/json' });
    await act(async () => {
      fireEvent.change(input, { target: { files: [bad] } });
    });
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith('Could not import: the file is not valid JSON.');
    });
    expect(importMutate).not.toHaveBeenCalled();
  });

  it('imports a valid JSON export shape', async () => {
    await routerAt(CASES_PATH);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const good = new File([JSON.stringify([{ input: { text: 'x' } }])], 'good.json', {
      type: 'application/json',
    });
    await act(async () => {
      fireEvent.change(input, { target: { files: [good] } });
    });
    await waitFor(() => {
      expect(importMutate).toHaveBeenCalledTimes(1);
    });
    expect(importMutate.mock.calls[0][0]).toMatchObject({ datasetId: 'd1', format: 'json' });
  });
});

describe('CasesManagerSection E-2 entry contract', () => {
  it('Add cases threads returnTo back to the manager section', async () => {
    const router = await routerAt(CASES_PATH);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add cases' }));
    });
    expect(router.state.location.pathname).toBe('/agent-studio/evaluations/datasets/d1/cases/new');
    expect(router.state.location.search).toMatchObject({ returnTo: CASES_PATH });
  });
});
