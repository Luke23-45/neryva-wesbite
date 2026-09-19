// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { EvalResults } from './EvalResults';
import type { EvalRun } from '@hooks/studio/useSetupEval';

const BASE_RUN: EvalRun = {
  id: 'run-1',
  datasetId: 'd1',
  assistantVersionId: 'v3',
  state: 'completed',
  attemptsPerCase: 2,
  decision: 'WARN',
  score: '0.8801',
  startedBy: 'owner-1',
  startedAt: '2026-09-18T10:00:00Z',
  finishedAt: '2026-09-18T11:00:00Z',
  releasePolicyVersion: 3,
  provenance: {
    dataset_content_hash: 'a9f1c2d3e4',
    seed: 7,
    block_reasons: [],
    warnings: ['threshold groundedness unevaluated (no worker metric)'],
  },
  isShadow: false,
  results: {
    cases: [
      { case_id: 'case_014', attempt: 1, passed: false, score: 0.42, failure_reason: 'missing contain "30 days"', response_excerpt: 'We process returns whenever…' },
      { case_id: 'case_015', attempt: 1, passed: true, score: 1 },
    ],
    checks: [
      { name: 'refund_policy_cited', passed: true },
      { name: 'tone_calm', passed: false },
    ],
  },
  environment: null,
};

function shell(run: EvalRun = BASE_RUN, props?: Partial<React.ComponentProps<typeof EvalResults>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <EvalResults
          run={run}
          versionStatus="DRAFT"
          versionUpdatedAt="2026-09-18T10:30:00Z"
          versionHash="b77c1d00e5"
          datasetName="refund-regressions"
          required={['refund_policy_cited', 'tone_calm', { regression_no_worse_than: 0.02 }]}
          onReRun={() => undefined}
          onAddCases={() => undefined}
          {...props}
        />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

afterEach(() => {
  document.body.style.overflow = '';
});

describe('EvalResults (shared truth — stale first, reported only)', () => {
  it('renders the decision with gate copy and the required-vs-optional split', () => {
    shell();
    expect(screen.getByText('WARN')).toBeTruthy();
    expect(screen.getByText(/required checks/)).toBeTruthy();
    expect(screen.getByText(/refund_policy_cited/)).toBeTruthy();
    expect(screen.getByText(/may not drop more than 0\.02/)).toBeTruthy();
  });

  it('puts the stale banner first with times, never invented hashes', () => {
    shell(BASE_RUN, { versionUpdatedAt: '2026-09-18T12:00:00Z' });
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toMatch(/Stale decision/);
    expect(alert.textContent).toContain('WARN');
    expect(alert.textContent).toMatch(/re-run/);
    expect(alert.textContent).not.toMatch(/a41f/);
  });

  it('badges shadow rows as never-gating instead of grading them', () => {
    shell({ ...BASE_RUN, isShadow: true, decision: 'PASS' });
    expect(screen.getByText(/shadow — never gates/)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows failing-case anatomy with the add-only honesty note', () => {
    shell();
    expect(screen.getByText(/Failing cases · 1/)).toBeTruthy();
    expect(screen.getByText(/case_014/)).toBeTruthy();
    expect(screen.getByText(/missing contain/)).toBeTruthy();
    expect(screen.getByText(/512 max/)).toBeTruthy();
    expect(screen.getByText(/aren’t listable/)).toBeTruthy();
  });

  it('states unknown freshness instead of claiming fresh', () => {
    shell(BASE_RUN, { versionUpdatedAt: null });
    expect(screen.getByText('Freshness unknown')).toBeTruthy();
    expect(screen.getByText(/Cannot prove this verdict is fresh/)).toBeTruthy();
  });

  it('offers re-run and provenance copy, hides re-run while busy', () => {
    shell();
    expect(screen.getAllByText(/Re-run with same dataset/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Copy full/)).toBeTruthy();
    cleanup();
    shell(BASE_RUN, { onReRun: null });
    expect(screen.queryByText(/Re-run with same dataset/)).toBeNull();
  });

  it('re-run fires the same-dataset repeat', () => {
    const onReRun = vi.fn();
    shell(BASE_RUN, { onReRun });
    fireEvent.click(screen.getAllByText(/Re-run with same dataset/)[0]);
    expect(onReRun).toHaveBeenCalledTimes(1);
  });

  it('states unknown template on cross-agent rows instead of legacy posture', () => {
    shell(BASE_RUN, { required: null });
    expect(screen.getByText(/resolve on the version surface/)).toBeTruthy();
  });
});
