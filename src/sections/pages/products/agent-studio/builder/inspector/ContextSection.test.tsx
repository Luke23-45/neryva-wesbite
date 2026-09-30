// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { ContextSection } from './ContextSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const updateMutate = vi.fn();

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useSaveDraftVersion: () => ({ mutate: vi.fn(), isPending: false }),
    useUpdateDraftVersion: () => ({ mutate: updateMutate, isPending: false }),
  };
});

function definitionWith(context: Partial<AgentDefinition['context_policy']>): AgentDefinition {
  const def = defaultConsumer();
  return { ...def, instructions: '## Role\\nR.\\n', context_policy: { ...def.context_policy, ...context } };
}

function shell(props?: Partial<React.ComponentProps<typeof ContextSection>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ContextSection
          assistantId="agent-main"
          definition={definitionWith({ memory_scope: 'user', history_limit: 20, summary_enabled: true })}
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
  updateMutate.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ContextSection', () => {
  it('renders the single context_policy editor: history 1–20, 5 scope pills, summary toggle', () => {
    shell();
    const group = screen.getByRole('group', { name: 'Context scope' });
    expect(group.querySelectorAll('button')).toHaveLength(5);
    expect(screen.getByDisplayValue('20')).toBeTruthy();
    expect(screen.getByText(/Runs serve up to the 20 most recent/)).toBeTruthy();
    expect(screen.getByText(/rolling summary/)).toBeTruthy();
    const summary = screen.getByRole('group', { name: 'Conversation summary' });
    expect(summary.querySelectorAll('button')).toHaveLength(2);
    expect(screen.getByText(/No sources pinned — runs use the Knowledge library as configured/)).toBeTruthy();
    expect(screen.getByText(/Read-only — pin sources in the Knowledge section/)).toBeTruthy();
  });

  it('steps history within 1–20 and clamps typed overflow', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Fewer history messages' }));
    });
    expect(screen.getByDisplayValue('19')).toBeTruthy();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('History limit in messages'), { target: { value: '500' } });
    });
    expect(screen.getByDisplayValue('20')).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'More history messages' }));
    });
    expect(screen.getByDisplayValue('20')).toBeTruthy();
  });

  it('toggling summary off autosaves the honest status copy', async () => {
    shell();
    const summary = screen.getByRole('group', { name: 'Conversation summary' });
    await act(async () => {
      fireEvent.click(summary.querySelectorAll('button')[1] as HTMLElement);
    });
    expect(screen.getByText(/No automatic summaries — runs always read the raw window/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.context_policy.summary_enabled).toBe(false);
    expect(sent.definition.context_policy.history_limit).toBe(20);
  });

  it('lists pinned knowledge sources read-only', () => {
    shell({ definition: definitionWith({ knowledge_sources: ['help-center'] }) });
    expect(screen.getByText('help-center')).toBeTruthy();
    expect(screen.queryByText(/No sources pinned/)).toBeNull();
  });

  it('renders the context-length block: 5 preset pills, a custom input, and the budget report', () => {
    shell();
    const presets = screen.getByRole('group', { name: 'Context length presets' });
    expect(presets.querySelectorAll('button')).toHaveLength(5);
    expect(screen.getByText('8K')).toBeTruthy();
    expect(screen.getByText('128K')).toBeTruthy();
    expect(screen.getByLabelText('Custom context length in tokens')).toBeTruthy();
    expect(screen.getByDisplayValue('32000')).toBeTruthy();
    expect(screen.getByText(/The token budget for everything a run assembles/)).toBeTruthy();
    expect(screen.getByText(/When content exceeds the budget/)).toBeTruthy();
    expect(screen.getByText(/fails closed instead of guessing/)).toBeTruthy();
  });

  it('reads a legacy draft without the key as the 32000 engine default', () => {
    const def = definitionWith({ memory_scope: 'user', history_limit: 20, summary_enabled: true });
    delete (def.context_policy as Partial<typeof def.context_policy>).max_context_tokens;
    shell({ definition: def });
    expect(screen.getByDisplayValue('32000')).toBeTruthy();
    const presets = screen.getByRole('group', { name: 'Context length presets' });
    const active = Array.from(presets.querySelectorAll('button')).filter(
      (b) => b.getAttribute('aria-pressed') === 'true',
    );
    expect(active).toHaveLength(1);
    expect(active[0]?.textContent).toBe('32K');
  });

  it('selecting a preset autosaves it inside context_policy', async () => {
    shell();
    const presets = screen.getByRole('group', { name: 'Context length presets' });
    await act(async () => {
      fireEvent.click(screen.getByText('64K'));
    });
    expect(presets.querySelectorAll('button')[3]?.getAttribute('aria-pressed')).toBe('true');
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.context_policy.max_context_tokens).toBe(64000);
  });

  it('clamps a custom typed value to the 1000–200000 contract', async () => {
    shell();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Custom context length in tokens'), { target: { value: '500000' } });
    });
    expect(screen.getByDisplayValue('200000')).toBeTruthy();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Custom context length in tokens'), { target: { value: '500' } });
    });
    expect(screen.getByDisplayValue('1000')).toBeTruthy();
  });

  it('renders read-only static rows with the role explanation for viewers', () => {
    shell({ canAuthor: false });
    expect(screen.getByText(/needs an owner, admin, or developer/)).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Context scope' })).toBeNull();
    expect(screen.queryByLabelText('History limit in messages')).toBeNull();
    expect(screen.getByText(/tokens per run/)).toBeTruthy();
  });
});

describe('ContextSection save lifecycle (model-less draft regression)', () => {
  it('saves on a model-less draft — the shared pipeline never throws on empty models', async () => {
    const def = definitionWith({ memory_scope: 'user', history_limit: 20, summary_enabled: true });
    def.model_policy = { allowed_models: [], fallback_enabled: false };
    await act(async () => {
      shell({ definition: def });
    });
    const summary = screen.getByRole('group', { name: 'Conversation summary' });
    await act(async () => {
      fireEvent.click(summary.querySelectorAll('button')[1] as HTMLElement);
    });
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.context_policy.summary_enabled).toBe(false);
    expect(sent.definition.model_policy.allowed_models).toEqual([]);
  });
});
