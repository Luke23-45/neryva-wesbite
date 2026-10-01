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

const { mockUseToolCatalog, mockUseLatestRunBudget } = vi.hoisted(() => ({
  mockUseToolCatalog: vi.fn(
    (): { data: unknown[]; isPending: boolean; isError: boolean } => ({
      data: [],
      isPending: false,
      isError: false,
    }),
  ),
  mockUseLatestRunBudget: vi.fn(
    (): { diagnostics: unknown; noRunsYet: boolean; isPending: boolean } => ({
      diagnostics: null,
      noRunsYet: false,
      isPending: false,
    }),
  ),
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@hooks/studio/useRunBudgetDiagnostics', () => ({
  useLatestRunBudget: () => mockUseLatestRunBudget(),
}));

vi.mock('@hooks/studio/useSetupTools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupTools')>();
  return {
    ...actual,
    useToolCatalog: () => mockUseToolCatalog(),
  };
});

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
  mockUseLatestRunBudget.mockReturnValue({ diagnostics: null, noRunsYet: false, isPending: false });
  mockUseToolCatalog.mockReturnValue({ data: [], isPending: false, isError: false });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ContextSection', () => {
  it('renders the section title and subtitle above the editor', () => {
    shell();
    expect(screen.getByRole('heading', { name: 'Context' })).toBeTruthy();
    expect(screen.getByText(/What the agent carries into each run/)).toBeTruthy();
  });

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
    // The draft holds raw text while typing; the clamp to 20 applies on commit (blur).
    expect(screen.getByDisplayValue('500')).toBeTruthy();
    await act(async () => {
      fireEvent.blur(screen.getByLabelText('History limit in messages'));
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

  it('commits a custom typed value on blur, clamping to the 1000–200000 contract', async () => {
    shell();
    const input = screen.getByLabelText('Custom context length in tokens');
    // Half-typed values are a draft: no clamping mid-keystroke.
    await act(async () => {
      fireEvent.change(input, { target: { value: '1' } });
    });
    expect(screen.getByDisplayValue('1')).toBeTruthy();
    await act(async () => {
      fireEvent.change(input, { target: { value: '128000' } });
      fireEvent.blur(input);
    });
    expect(screen.getByDisplayValue('128000')).toBeTruthy();
    await act(async () => {
      fireEvent.change(input, { target: { value: '500000' } });
      fireEvent.blur(input);
    });
    expect(screen.getByDisplayValue('200000')).toBeTruthy();
    await act(async () => {
      fireEvent.change(input, { target: { value: '500' } });
      fireEvent.blur(input);
    });
    expect(screen.getByDisplayValue('1000')).toBeTruthy();
  });

  it('reverts the draft on empty or garbage input instead of inventing a value', async () => {
    shell();
    const input = screen.getByLabelText('Custom context length in tokens');
    await act(async () => {
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);
    });
    expect(screen.getByDisplayValue('32000')).toBeTruthy();
    await act(async () => {
      fireEvent.change(input, { target: { value: 'nope' } });
      fireEvent.blur(input);
    });
    expect(screen.getByDisplayValue('32000')).toBeTruthy();
  });

  it('tolerates comma-grouped custom input ("128,000")', async () => {
    shell();
    const input = screen.getByLabelText('Custom context length in tokens');
    await act(async () => {
      fireEvent.change(input, { target: { value: '128,000' } });
      fireEvent.blur(input);
    });
    expect(screen.getByDisplayValue('128000')).toBeTruthy();
  });

  it('saves a committed custom value inside context_policy', async () => {
    shell();
    const input = screen.getByLabelText('Custom context length in tokens');
    await act(async () => {
      fireEvent.change(input, { target: { value: '48000' } });
      fireEvent.blur(input);
    });
    expect(screen.getByDisplayValue('48000')).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.context_policy.max_context_tokens).toBe(48000);
  });

  it('renders read-only static rows with the role explanation for viewers', () => {
    shell({ canAuthor: false });
    expect(screen.getByText(/needs an owner, admin, or developer/)).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Context scope' })).toBeNull();
    expect(screen.queryByLabelText('History limit in messages')).toBeNull();
    expect(screen.getByText(/tokens per run/)).toBeTruthy();
  });

  describe('token budget reporting (read-only)', () => {
    function budgetDefinition(overrides?: Partial<AgentDefinition>): AgentDefinition {
      const def = definitionWith({ memory_scope: 'user', history_limit: 20, summary_enabled: true });
      return { ...def, instructions: '', role: undefined, tools: [], ...overrides };
    }

    it('renders the fixed-prompt estimate from the draft definition', () => {
      // 400 chars → ceil(400/4) + 2 = 102
      shell({ definition: budgetDefinition({ instructions: 'x'.repeat(400) }) });
      expect(screen.getByText(/≈102 of your 32K budget/)).toBeTruthy();
      expect(
        screen.getByText(/knowledge, memories, summaries, and history fill the rest/),
      ).toBeTruthy();
    });

    it('counts role contents and bound tool schemas in the estimate', () => {
      mockUseToolCatalog.mockReturnValue({
        data: [{ name: 'web_search', inputSchema: { type: 'object' }, outputSchema: null }],
        isPending: false,
        isError: false,
      });
      const def = budgetDefinition({
        instructions: 'abcd', // 4 chars → 3
        role: { role: { mode: 'raw', content: 'abcd' } }, // 4 chars → 3
        tools: [{ name: 'web_search', access: 'read', approval: 'never', execution_mode: 'live', enabled: true, expose_description_to_planner: true, log_call_payloads: true }],
      });
      shell({ definition: def });
      // '{"type":"object"}' is 17 chars → ceil(17/4) + 2 = 7; total 3 + 3 + 7 = 13
      expect(screen.getByText(/≈13 of your 32K budget/)).toBeTruthy();
    });

    it('shows — when nothing is measurable, never a 0', () => {
      shell({ definition: budgetDefinition() });
      expect(screen.getByText('Fixed prompt (estimate)')).toBeTruthy();
      expect(screen.getByText('—')).toBeTruthy();
    });

    it('moves the meter denominator with the budget being edited', async () => {
      shell({ definition: budgetDefinition({ instructions: 'x'.repeat(400) }) });
      expect(screen.getByText(/≈102 of your 32K budget/)).toBeTruthy();
      await act(async () => {
        fireEvent.click(screen.getByText('64K'));
      });
      expect(screen.getByText(/≈102 of your 64K budget/)).toBeTruthy();
    });

    it('reports the empty state when the assistant has no runs yet', () => {
      mockUseLatestRunBudget.mockReturnValue({
        diagnostics: null,
        noRunsYet: true,
        isPending: false,
      });
      shell();
      expect(screen.getByText(/No runs yet — usage appears here after the first run/)).toBeTruthy();
    });

    it('reports the latest run usage from ContextPrepared diagnostics', () => {
      mockUseLatestRunBudget.mockReturnValue({
        diagnostics: { maxTokens: 32000, reservedForOutput: 4096, used: 12000, remaining: 15904 },
        noRunsYet: false,
        isPending: false,
      });
      shell();
      expect(screen.getByText(/Last run used ≈12K of 32K budget/)).toBeTruthy();
    });

    it('renders no Recent runs row when runs predate the emission', () => {
      shell();
      expect(screen.queryByText('Recent runs')).toBeNull();
    });
  });

  it('history stepper 19→20→19 round trip reads clean — no phantom unsaved changes (wave-3 P2)', async () => {
    // Guards the Context dirty flag itself: returning to the source value
    // must read clean. (The live "Unsaved changes" through the round trip
    // was builder-level contamination from the Model response-format
    // phantom — fixed at its root in ModelSection — not this section's
    // dirty computation.)
    const onDirtyChange = vi.fn();
    await act(async () => {
      shell({ onDirtyChange });
    });
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Fewer history messages' }));
    });
    expect(screen.getByDisplayValue('19')).toBeTruthy();
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'More history messages' }));
    });
    expect(screen.getByDisplayValue('20')).toBeTruthy();
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
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
