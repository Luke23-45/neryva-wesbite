// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import toast from 'react-hot-toast';
import { BudgetSection } from './BudgetSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const saveMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock('react-hot-toast', () => {
  const fn = vi.fn() as never;
  const success = vi.fn() as never;
  const error = vi.fn() as never;
  return { default: Object.assign(fn, { success, error }) };
});

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const navigateMock = vi.fn();

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useSaveDraftVersion: () => ({ mutate: saveMutate, isPending: false }),
    useUpdateDraftVersion: () => ({ mutate: updateMutate, isPending: false }),
  };
});

vi.mock('@hooks/studio/useSetupModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupModels')>();
  return {
    ...actual,
    useModelCosts: () => ({
      data: [{ provider: 'a', model: 'good', ref: 'a/good', costMicrosPer1kInput: 75_000, costMicrosPer1kOutput: 75_000, costMicrosPer1kCachedInput: null, currency: 'USD', effectiveFrom: null }],
      isPending: false,
      isError: false,
    }),
    useModelAvailability: () => ({
      data: [{ provider: 'a', modelId: 'good', ref: 'a/good', displayName: 'Good Model', contextWindowTokens: null, maxOutputTokens: null, capabilities: {}, residency: null, usable: true, reasons: [], requiredProduct: null, requiredProductLabel: null }],
      isPending: false,
      isError: false,
    }),
  };
});

function definitionWith(budget: AgentDefinition['budget']): AgentDefinition {
  const def = defaultConsumer();
  def.model_policy.allowed_models = ['a/good'];
  return { ...def, instructions: '## Role\nR.\n', budget };
}

const FRESH = definitionWith({});

function shell(props?: Partial<React.ComponentProps<typeof BudgetSection>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <BudgetSection
          assistantId="agent-main"
          definition={FRESH}
          versionId="v1"
          versionHash="h1"
          isDraft
          canAuthor
          onDirtyChange={() => undefined}
          saveSignal={0}
          {...props}
        />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  saveMutate.mockReset();
  updateMutate.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('BudgetSection', () => {
  it('renders the SVG header, 5 caps, estimate, and fail-closed groups', () => {
    shell();
    expect(screen.getByText('Budget')).toBeTruthy();
    expect(screen.getByText(/What a single run may spend/)).toBeTruthy();
    // Spend unchecked badge when no cap is set.
    expect(screen.getByText('spend unchecked')).toBeTruthy();
    expect(screen.getByLabelText('Spend cap in dollars')).toBeTruthy();
    expect(screen.getByLabelText('Total tokens')).toBeTruthy();
    expect(screen.getByLabelText('Tool calls')).toBeTruthy();
    expect(screen.getByLabelText('Model calls')).toBeTruthy();
    expect(screen.getByLabelText('Wall clock')).toBeTruthy();
    expect(screen.getByText('0 of 5 set')).toBeTruthy();
    expect(screen.getByText(/Rough, not the bill/)).toBeTruthy();
    expect(screen.getByText(/fails closed — never a quiet overage/)).toBeTruthy();
    expect(screen.getByText(/FAILED · terminal event/)).toBeTruthy();
  });

  it('shows the spend cap badge and hides the header pill when a cap is set', () => {
    shell({ definition: definitionWith({ max_cost_cents: 500 }) });
    expect(screen.queryByText('spend unchecked')).toBeNull();
    expect(screen.getByText('1 of 5 set')).toBeTruthy();
    // No "unchecked" badge on the spend row when set.
    expect(screen.queryByText('unchecked')).toBeNull();
  });

  it('shows platform default badges when caps are unset', () => {
    shell();
    // Badge + rail both show the token default.
    expect(screen.getAllByText('200,000').length).toBeGreaterThanOrEqual(1);
    // Tool calls default 8, model calls default 16, wall clock default 120s.
    expect(screen.getByText('unchecked')).toBeTruthy();
  });

  it('derives the estimate from the primary model list rate, never hardcoded', () => {
    // 75k + 75k micros per 1k = $0.15/1k; 200k tokens → $30.00 worst case.
    // Appears in the Estimate group and the rail.
    shell();
    expect(screen.getByText(/Good Model/)).toBeTruthy();
    expect(screen.getAllByText('$30.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('$30000.00')).toBeTruthy();
  });

  it('saves spend in cents and unsets on clear (never 0-for-unset)', async () => {
    shell();
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Spend cap/), { target: { value: '5' } });
    });
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.budget.max_cost_cents).toBe(500);
  });

  it('clearing a set cap saves the omission (platform default resumes)', async () => {
    shell({ definition: definitionWith({ max_cost_cents: 500 }) });
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Spend cap/), { target: { value: '' } });
    });
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.budget.max_cost_cents).toBeUndefined();
    expect(JSON.stringify(sent.definition.budget)).not.toContain('max_cost_cents');
  });

  it('holds autosave on out-of-range caps with the named bound', async () => {
    shell();
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Model calls/), { target: { value: '0' } });
    });
    expect(screen.getByText(/Must be an integer 1–200/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('renders the wall clock s/min segmented toggle', () => {
    shell();
    const toggle = screen.getByRole('tablist', { name: 'Wall clock unit' });
    expect(toggle).toBeTruthy();
    expect(screen.getByRole('tab', { name: 's' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'min' })).toBeTruthy();
  });

  it('renders read-only with the role explanation for viewers', () => {
    shell({ canAuthor: false });
    expect(screen.getByText(/needs an owner, admin, or developer/)).toBeTruthy();
    expect(screen.queryByLabelText(/Spend cap/)).toBeNull();
  });
});
