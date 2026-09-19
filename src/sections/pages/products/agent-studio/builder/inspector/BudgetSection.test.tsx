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
      data: [{ provider: 'a', model: 'good', ref: 'a/good', costMicrosPer1kInput: 3_000_000, costMicrosPer1kOutput: 15_000_000, costMicrosPer1kCachedInput: 300_000, currency: 'USD', effectiveFrom: null }],
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
  it('renders 5 caps with unset whispers, cost-unchecked stated loudly', () => {
    shell();
    for (const label of ['Spend cap', 'Total tokens', 'Tool calls', 'Model calls', 'Wall clock']) {
      expect(screen.getByLabelText(new RegExp(`^${label}`))).toBeTruthy();
    }
    expect(screen.getByText(/No spend cap/)).toBeTruthy();
    expect(screen.getByText(/cost-unchecked/)).toBeTruthy();
    expect(screen.getByText(/Rough, not the bill/)).toBeTruthy();
    expect(screen.getByText(/fails closed/)).toBeTruthy();
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
    // Explicit undefined stringifies away and the wire omits it (toWire !== undefined).
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

  it('estimates at uncached rates with the reported cached price', () => {
    shell({ definition: definitionWith({ max_cost_cents: 500, max_total_tokens: 20_000 }) });
    expect(screen.getByText(/cached-in \$0\.3000\/1k/)).toBeTruthy();
    expect(screen.getByText(/~\$360\.00 per 20,000-token run \(your cap\)/)).toBeTruthy();
  });

  it('renders read-only with the role explanation for viewers', () => {
    shell({ canAuthor: false });
    expect(screen.getByText(/needs an owner, admin, or developer/)).toBeTruthy();
    expect(screen.queryByLabelText(/Spend cap/)).toBeNull();
  });
});
