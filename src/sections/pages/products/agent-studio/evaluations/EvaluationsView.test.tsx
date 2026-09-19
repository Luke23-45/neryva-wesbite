// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { EvaluationsView } from './EvaluationsView';
import type { EvalRun } from '@hooks/studio/useSetupEval';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const startMutate = vi.fn();
let runsData: EvalRun[] = [];

vi.mock('@hooks/studio/useSetupEval', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupEval')>();
  return {
    ...actual,
    useEvalDatasets: () => ({
      data: [
        { id: 'd1', name: 'template:support-concierge@3', description: 'Seeded suite', createdAt: '2026-09-01' },
        { id: 'd2', name: 'refund-regressions', description: null, createdAt: null },
      ],
    }),
    useCreateEvalDataset: () => ({ mutate: vi.fn(), isPending: false }),
    useAddEvalCases: () => ({ mutate: vi.fn(), isPending: false }),
    useEvalRuns: () => ({ data: runsData, refetch: vi.fn(), isPending: false, isError: false }),
    useStartEvalRun: () => ({ mutate: startMutate, isPending: false }),
    useDatasetRecall: () => ({ data: undefined, isPending: false, isError: true, error: new Error('off'), refetch: vi.fn() }),
  };
});

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({ data: [] }),
}));

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useAssistantVersions: () => ({ data: [] }),
  };
});

function run(overrides: Partial<EvalRun> & { id: string }): EvalRun {
  return {
    datasetId: 'd1',
    assistantVersionId: 'v3',
    state: 'completed',
    attemptsPerCase: 1,
    decision: 'PASS',
    score: '0.9312',
    startedBy: 'owner-1',
    startedAt: '2026-09-18T10:00:00Z',
    finishedAt: '2026-09-18T11:00:00Z',
    releasePolicyVersion: null,
    provenance: {},
    isShadow: false,
    results: null,
    environment: null,
    ...overrides,
  };
}

async function shell() {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <EvaluationsView />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

beforeEach(() => {
  startMutate.mockReset();
  runsData = [];
});

afterEach(() => {
  document.body.style.overflow = '';
});

describe('EvaluationsView (C10 extends — badges, filters, re-run, results)', () => {
  it('badges seeded datasets by origin', async () => {
    await shell();
    expect(screen.getByText('Seeded by support-concierge@3')).toBeTruthy();
    expect(screen.getAllByText('Custom').length).toBeGreaterThan(0);
  });

  it('filters runs locally and states the cap honesty', async () => {
    runsData = [run({ id: 'r1', decision: 'PASS' }), run({ id: 'r2', decision: 'BLOCK', score: '0.4100' })];
    await shell();
    expect(screen.getByText(/cap 100, filtered locally/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Decision/), { target: { value: 'BLOCK' } });
    expect(screen.queryByText('0.9312')).toBeNull();
    expect(screen.getByText('0.4100')).toBeTruthy();
  });

  it('re-runs with the same dataset and attempts, stated', async () => {
    runsData = [run({ id: 'r1', attemptsPerCase: 2 })];
    await shell();
    fireEvent.click(screen.getByText('Re-run'));
    expect(startMutate).toHaveBeenCalledWith(
      expect.objectContaining({ datasetId: 'd1', assistantVersionId: 'v3', attemptsPerCase: 2 }),
    );
  });

  it('opens results with failing-case anatomy and the add-only honesty', async () => {
    runsData = [
      run({
        id: 'r1',
        decision: 'WARN',
        results: {
          cases: [{ case_id: 'case_014', attempt: 1, passed: false, score: 0.42, failure_reason: 'missing contain "30 days"' }],
          checks: [{ name: 'tone_calm', passed: false }],
        },
      }),
    ];
    await shell();
    fireEvent.click(screen.getByText('Results'));
    expect(screen.getByText(/Failing cases · 1/)).toBeTruthy();
    expect(screen.getByText(/case_014/)).toBeTruthy();
    expect(screen.getByText(/aren’t listable/)).toBeTruthy();
  });

  it('badges shadow rows as never-gating', async () => {
    runsData = [run({ id: 'r1', isShadow: true })];
    await shell();
    expect(screen.getByText(/shadow — never gates/)).toBeTruthy();
  });
});
