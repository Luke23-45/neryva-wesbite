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
import { ApiError } from '@lib/engine/client';
import { EvaluatePanel } from './EvaluatePanel';
import type { AgentVersion } from '@hooks/studio/useAgentAuthoring';
import type { EvalRun } from '@hooks/studio/useSetupEval';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const evaluateMutate = vi.fn();
let evaluateError: unknown = null;
let runsData: EvalRun[] = [];

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useEvaluateVersion: () => ({ mutate: evaluateMutate, isPending: false, error: evaluateError }),
    useVersionProvenance: () => ({
      data: { template: { slug: 'support-concierge', version: '3', definition_hash: null } },
    }),
  };
});

vi.mock('@hooks/studio/useSetupEval', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupEval')>();
  return {
    ...actual,
    useEvalDatasets: () => ({ data: [{ id: 'd1', name: 'refund-regressions', description: null, createdAt: null }] }),
    useEvalRuns: () => ({ data: runsData, refetch: vi.fn() }),
    useEvalRunPolling: () => undefined,
  };
});

vi.mock('@hooks/studio/useSetupTemplates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTemplates')>();
  return {
    ...actual,
    useAssistantTemplate: () => ({ data: { releasePolicy: { required: ['refund_policy_cited'] } } }),
  };
});

const VERSIONS: AgentVersion[] = [
  { id: 'v3', version: 3, status: 'DRAFT', hash: 'b77c1d00', createdAt: null, publishedAt: null, publishedBy: null, rollbackOf: null, parentVersionId: null, updatedAt: '2026-09-18T10:30:00Z', definition: null },
];

const PASS_RUN: EvalRun = {
  id: 'run-1',
  datasetId: 'd1',
  assistantVersionId: 'v3',
  state: 'completed',
  attemptsPerCase: 1,
  decision: 'PASS',
  score: '0.9312',
  startedBy: 'owner-1',
  startedAt: '2026-09-18T10:00:00Z',
  finishedAt: '2026-09-18T11:00:00Z',
  releasePolicyVersion: 3,
  provenance: { block_reasons: [], warnings: [] },
  isShadow: false,
  results: { cases: [], checks: [{ name: 'refund_policy_cited', passed: true }] },
  environment: null,
};

async function shell(versions: AgentVersion[] = VERSIONS) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <EvaluatePanel agentId="agent-1" versions={versions} />
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
  evaluateMutate.mockReset();
  evaluateError = null;
  runsData = [];
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.style.overflow = '';
});

describe('EvaluatePanel (dedicated version surface — shared results truth)', () => {
  it('asks for a draft when nothing is evaluable', async () => {
    await shell([]);
    expect(screen.getByText(/retired versions never execute/)).toBeTruthy();
  });

  it('renders the stale banner first when the draft moved', async () => {
    runsData = [{ ...PASS_RUN }];
    const staleVersions = [{ ...VERSIONS[0], updatedAt: '2026-09-18T13:00:00Z' }];
    await shell(staleVersions);
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/Stale decision/);
    const bannerPos = alert.compareDocumentPosition(screen.getByText('PASS'));
    expect(bannerPos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('opens the no-dataset fix path on the 400', async () => {
    evaluateError = new ApiError(400, 'validation_failed', 'Request validation failed', {
      dataset_id: 'no template dataset for this assistant — install from a template or pass dataset_id explicitly',
    });
    await shell();
    expect(screen.getByText(/No dataset to evaluate against/)).toBeTruthy();
    expect(screen.getByText(/Install a template/)).toBeTruthy();
  });

  it('re-runs with the same dataset and attempts', async () => {
    runsData = [{ ...PASS_RUN, attemptsPerCase: 2 }];
    await shell();
    fireEvent.click(screen.getAllByText(/Re-run with same dataset/)[0]);
    expect(evaluateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ versionId: 'v3', datasetId: 'd1', attemptsPerCase: 2 }),
      expect.anything(),
    );
  });

  it('badges shadow verdicts as never-gating', async () => {
    runsData = [{ ...PASS_RUN, id: 'run-s', isShadow: true }];
    await shell();
    expect(screen.getByText(/shadow — never gates/)).toBeTruthy();
  });
});
