// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import toast from 'react-hot-toast';
import { GuardrailsSection } from './GuardrailsSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const saveMutate = vi.fn();
const updateMutate = vi.fn();
const telemetryData = vi.fn((): { windowDays: number; refusals: { topic: string; refusals: number }[] } | undefined => undefined);

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
    useGuardrailTelemetry: () => ({ data: telemetryData(), isLoading: false, isError: false }),
  };
});

function definitionWith(guardrails: AgentDefinition['guardrails']): AgentDefinition {
  const def = defaultConsumer();
  return { ...def, instructions: '## Role\nR.\n', guardrails };
}

const FULL_GUARDRAILS: AgentDefinition['guardrails'] = {
  pii_redaction: true,
  input_policy: '',
  output_policy: '',
  execution_mode: 'blocking',
  pii_entities: ['email', 'phone', 'payment_card', 'government_id', 'api_keys', 'addresses'],
  pii_action: 'token',
  pii_applies_to: ['storage', 'logs'],
  notify_owner: false,
  attach_to_trace: true,
  deny_topics: [],
};

const FRESH = definitionWith({ ...FULL_GUARDRAILS });

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
  telemetryData.mockReset();
  telemetryData.mockReturnValue(undefined);
  vi.mocked(toast.success).mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('GuardrailsSection', () => {
  it('renders the SectionPage header with a live mode pill and the four safeguard groups', () => {
    shell();
    expect(screen.getByRole('heading', { name: 'Guardrails' })).toBeTruthy();
    expect(screen.getByText(/Blocking · 4 layers/)).toBeTruthy();
    expect(screen.getByText(/What the agent must never let through/)).toBeTruthy();
    expect(screen.getByRole('tablist', { name: 'input screening level' })).toBeTruthy();
    expect(screen.getByRole('tablist', { name: 'output screening level' })).toBeTruthy();
    expect(screen.getByLabelText('PII redaction')).toBeTruthy();
    expect(screen.getByRole('tablist', { name: 'Guardrail execution mode' })).toBeTruthy();
    expect(screen.getAllByText('Deny topics').length).toBeGreaterThanOrEqual(1);
  });

  it('input Off writes the none key and warns that violations pass through', async () => {
    shell();
    const list = screen.getByRole('tablist', { name: 'input screening level' });
    await act(async () => {
      fireEvent.click(within(list).getByRole('tab', { name: 'Off' }));
    });
    expect(screen.getByText(/violations pass through unscreened/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    // 'none' is the console's Off key — the engine resolver honors it as disabled.
    expect(sent.definition.guardrails.input_policy).toBe('none');
  });

  it('output Brand-safe writes brand-safe', async () => {
    shell();
    const list = screen.getByRole('tablist', { name: 'output screening level' });
    await act(async () => {
      fireEvent.click(within(list).getByRole('tab', { name: 'Brand-safe' }));
    });
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.guardrails.output_policy).toBe('brand-safe');
  });

  it('PII toggle off warns and autosaves', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getByLabelText('PII redaction'));
    });
    expect(screen.getByText(/identifiers reach storage, logs, and the provider/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.guardrails.pii_redaction).toBe(false);
  });

  it('entity chips toggle and ride the same save', async () => {
    shell();
    const chip = screen.getByRole('button', { name: 'Addresses' });
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    await act(async () => {
      fireEvent.click(chip);
    });
    expect(chip.getAttribute('aria-pressed')).toBe('false');
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.guardrails.pii_entities).not.toContain('addresses');
    expect(sent.definition.guardrails.pii_entities).toContain('email');
  });

  it('redaction action and applies-to scope write through', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Drop sentence' }));
    });
    const traces = screen.getByRole('button', { name: 'Traces' });
    await act(async () => {
      fireEvent.click(traces);
    });
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.guardrails.pii_action).toBe('drop');
    expect(sent.definition.guardrails.pii_applies_to).toContain('traces');
  });

  it('flipping to logging states the no-refusal law, updates the pill, and autosaves', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Logging' }));
    });
    expect(screen.getByText(/Logging — verdicts recorded, nothing is refused/)).toBeTruthy();
    expect(screen.getByText(/ships as a new draft/)).toBeTruthy();
    expect(screen.getByText(/Logging · 4 layers/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.guardrails.execution_mode).toBe('logging');
  });

  it('violation-action chips toggle notify_owner and attach_to_trace', async () => {
    shell();
    const notify = screen.getByRole('button', { name: 'Notify owner' });
    expect(notify.getAttribute('aria-pressed')).toBe('false');
    await act(async () => {
      fireEvent.click(notify);
    });
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.guardrails.notify_owner).toBe(true);
  });

  it('deny topics add, dedupe, and remove', async () => {
    shell();
    const input = screen.getByLabelText('New deny topic');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'legal advice' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    });
    expect(screen.getByText('legal advice')).toBeTruthy();
    // Duplicate (case-insensitive) is rejected with a message, not added.
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Legal Advice' } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    });
    expect(screen.getByText(/already denied/)).toBeTruthy();
    // Remove it.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove deny topic legal advice' }));
    });
    expect(screen.queryByText('legal advice')).toBeNull();
  });

  it('deny-topic rows show real refusal counts, never invented zeros', async () => {
    telemetryData.mockReturnValue({
      windowDays: 30,
      refusals: [{ topic: 'legal advice', refusals: 12 }],
    });
    shell({
      definition: definitionWith({ ...FULL_GUARDRAILS, deny_topics: ['legal advice', 'medical'] }),
    });
    expect(screen.getByText(/12 refusals · 30d/)).toBeTruthy();
    // 'medical' has no telemetry — no count shown, not a zero.
    const medicalRow = screen.getByText('medical').closest('li');
    expect(medicalRow?.textContent).not.toMatch(/refusals/);
  });

  it('shows custom names honestly in Advanced with resolved behavior', async () => {
    shell({ definition: definitionWith({ ...FULL_GUARDRAILS, input_policy: 'acme-lenient' }) });
    expect(screen.getByText(/Custom name “acme-lenient”/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByText(/Custom policy names/));
    });
    // The honesty note appears both under the screening row and in Advanced.
    expect(screen.getAllByText(/screens like Default/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText(/Custom input policy name/)).toBeTruthy();
  });

  it('renders read-only with the role explanation for viewers', () => {
    shell({ canAuthor: false });
    expect(screen.getByText(/need an owner, admin, or developer/)).toBeTruthy();
    expect(screen.queryByRole('tablist', { name: 'input screening level' })).toBeNull();
    expect(screen.getByText(/Blocking · 4 layers/)).toBeTruthy();
  });
});
