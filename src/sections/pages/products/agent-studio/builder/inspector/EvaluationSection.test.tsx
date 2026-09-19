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
import { EvaluationSection } from './EvaluationSection';
import type { EvalRun } from '@hooks/studio/useSetupEval';
import type { AgentVersion } from '@hooks/studio/useAgentAuthoring';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const evaluateMutate = vi.fn();
let evaluateError: unknown = null;
let runsData: EvalRun[] = [];
let versionsData: AgentVersion[] = [];
let datasetsData = [{ id: 'd1', name: 'template:support-concierge@3', description: null, createdAt: null }];
let provenanceData: { template: { slug: string; version: string; definition_hash: string | null } | null } | null = {
  template: { slug: 'support-concierge', version: '3', definition_hash: null },
};
let templateData: { releasePolicy?: { required?: unknown[] } } | null = {
  releasePolicy: { required: ['refund_policy_cited', { regression_no_worse_than: 0.02 }] },
};
let notificationsData: { items: { id: string; title: string; message: string | null; category: string | null; link: string | null; createdAt: string | null; read: boolean; data: Record<string, unknown> | null }[] } = { items: [] };

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useAssistantVersions: () => ({ data: versionsData }),
    useEvaluateVersion: () => ({ mutate: evaluateMutate, isPending: false, error: evaluateError }),
    useVersionProvenance: () => ({ data: provenanceData }),
  };
});

vi.mock('@hooks/studio/useSetupEval', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupEval')>();
  return {
    ...actual,
    useEvalRuns: () => ({ data: runsData, refetch: vi.fn() }),
    useEvalDatasets: () => ({ data: datasetsData }),
    useEvalRunPolling: () => undefined,
    useCreateEvalDataset: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

vi.mock('@hooks/studio/useSetupTemplates', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTemplates')>();
  return {
    ...actual,
    useAssistantTemplate: () => ({ data: templateData }),
  };
});

vi.mock('@hooks/studio/useNotifications', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useNotifications')>();
  return {
    ...actual,
    useNotificationsList: () => ({ data: notificationsData }),
  };
});

const VERSION_ROW: AgentVersion = {
  id: 'v3',
  version: 3,
  status: 'DRAFT',
  hash: 'b77c1d00',
  createdAt: null,
  publishedAt: null,
  publishedBy: null,
  rollbackOf: null, parentVersionId: null,
  updatedAt: '2026-09-18T10:30:00Z',
  definition: null,
};

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
  provenance: { dataset_content_hash: 'a9f1', seed: 7, block_reasons: [], warnings: [] },
  isShadow: false,
  results: { cases: [], checks: [{ name: 'refund_policy_cited', passed: true }] },
  environment: null,
};

async function shell(props?: Partial<React.ComponentProps<typeof EvaluationSection>>) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <EvaluationSection
            assistantId="agent-1"
            versionId="v3"
            versionHash="b77c1d00"
            versionStatus="DRAFT"
            isDraft
            canAuthor
            role="owner"
            {...props}
          />
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
  versionsData = [VERSION_ROW];
  datasetsData = [{ id: 'd1', name: 'template:support-concierge@3', description: null, createdAt: null }];
  provenanceData = { template: { slug: 'support-concierge', version: '3', definition_hash: null } };
  templateData = { releasePolicy: { required: ['refund_policy_cited', { regression_no_worse_than: 0.02 }] } };
  notificationsData = { items: [] };
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EvaluationSection (builder Evaluator satellite)', () => {
  it('blocks without a runnable version, never offering a run', async () => {
    await shell({ versionId: null, isDraft: false, versionStatus: null });
    expect(screen.getByText(/retired versions never execute/)).toBeTruthy();
    // The dock stays visible but disabled with the reason — never a dead click.
    expect(screen.getByTitle(/No DRAFT or PUBLISHED version to evaluate/)).toBeDisabled();
  });

  it('shows seeded-dataset state and evaluates draft-pinned', async () => {
    await shell();
    expect(screen.getByText(/Seeded by support-concierge@3/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Evaluate version/));
    expect(evaluateMutate).toHaveBeenCalledTimes(1);
    expect(evaluateMutate.mock.calls[0]?.[0]).toMatchObject({ versionId: 'v3', attemptsPerCase: 1 });
  });

  it('renders the stale banner first when the draft moved', async () => {
    runsData = [PASS_RUN];
    versionsData = [{ ...VERSION_ROW, updatedAt: '2026-09-18T13:00:00Z' }];
    await shell();
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/Stale decision/);
    // Banner precedes the decision pills in document order.
    const bannerPos = alert.compareDocumentPosition(screen.getByText('PASS'));
    expect(bannerPos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('badges shadow rows as never-gating', async () => {
    runsData = [{ ...PASS_RUN, id: 'run-s', isShadow: true }];
    await shell();
    expect(screen.getByText(/shadow — never gates/)).toBeTruthy();
  });

  it('opens the no-dataset fix path on the 400, never a dead end', async () => {
    evaluateError = new ApiError(400, 'validation_failed', 'Request validation failed', {
      dataset_id: 'no template dataset for this assistant — install from a template or pass dataset_id explicitly',
    });
    datasetsData = [];
    provenanceData = { template: null };
    await shell();
    expect(screen.getByText(/No dataset to evaluate against/)).toBeTruthy();
    expect(screen.getByText(/Install a template/)).toBeTruthy();
    expect(screen.getByText(/Open Datasets/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/New dataset name/), { target: { value: 'refund-regressions' } });
    expect(screen.getByText(/Create dataset/)).toBeTruthy();
  });

  it('renders viewers read-only with the role truth', async () => {
    await shell({ canAuthor: false, role: 'reader' });
    expect(screen.getByText(/Viewing only/)).toBeTruthy();
    expect(screen.queryByText(/Evaluate version/)).toBeNull();
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

  it('surfaces drift notifications with the shadow truth', async () => {
    notificationsData = {
      items: [
        {
          id: 'n1',
          title: 'Model drift on Returns Helper',
          message: 'Catalog drift detected (acme/sonnet (entry_changed)) — a shadow re-evaluation started.',
          category: 'assistant.model_drift',
          link: null,
          createdAt: '2026-09-18T12:00:00Z',
          read: false,
          data: { assistant_id: 'agent-1', drifted: [{ alias: 'acme/sonnet', reason: 'entry_changed' }] },
        },
      ],
    };
    runsData = [{ ...PASS_RUN, id: 'run-s', isShadow: true }];
    await shell();
    expect(screen.getByText(/Model drift on Returns Helper/)).toBeTruthy();
    expect(screen.getByText(/shadow — never gates/)).toBeTruthy();
  });
});
