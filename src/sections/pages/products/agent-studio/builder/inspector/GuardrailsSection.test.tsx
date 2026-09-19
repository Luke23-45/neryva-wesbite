// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import toast from 'react-hot-toast';
import { GuardrailsSection } from './GuardrailsSection';
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

function definitionWith(guardrails: AgentDefinition['guardrails']): AgentDefinition {
  const def = defaultConsumer();
  return { ...def, instructions: '## Role\nR.\n', guardrails };
}

const FRESH = definitionWith({ pii_redaction: true, input_policy: '', output_policy: '', execution_mode: 'blocking' });

function shell(props?: Partial<React.ComponentProps<typeof GuardrailsSection>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <GuardrailsSection
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

describe('GuardrailsSection', () => {
  it('renders protection presets, PII, and the blocking indicator on a fresh draft', () => {
    shell();
    expect(screen.getByRole('group', { name: 'input screening preset' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'output screening preset' })).toBeTruthy();
    expect(screen.getByText(/Blocking — violating content is refused/)).toBeTruthy();
    expect(screen.getByText(/past runs keep/)).toBeTruthy();
  });

  it('flipping to logging states the no-refusal law and autosaves the draft', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Logging' }));
    });
    expect(screen.getByText(/Logging — verdicts recorded, nothing is refused/)).toBeTruthy();
    expect(screen.getByText(/ships as a new draft/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.guardrails.execution_mode).toBe('logging');
  });

  it('switching input off warns that violations pass through', async () => {
    shell();
    const group = screen.getByRole('group', { name: 'input screening preset' });
    await act(async () => {
      fireEvent.click(group.querySelectorAll('button')[2] as HTMLElement);
    });
    expect(screen.getByText(/violations pass through unscreened/)).toBeTruthy();
  });

  it('shows custom names honestly in Advanced with resolved behavior', async () => {
    shell({ definition: definitionWith({ pii_redaction: true, input_policy: 'acme-lenient', output_policy: '', execution_mode: 'blocking' }) });
    expect(screen.getByText(/Custom name “acme-lenient”/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByText(/Custom policy names/));
    });
    expect(screen.getByText(/screens like Default/)).toBeTruthy();
  });

  it('renders read-only with the role explanation for viewers', () => {
    shell({ canAuthor: false });
    expect(screen.getByText(/need an owner, admin, or developer/)).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'input screening preset' })).toBeNull();
  });
});
