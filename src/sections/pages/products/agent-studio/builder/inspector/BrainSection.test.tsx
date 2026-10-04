// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { ApiError } from '@lib/engine/client';
import toast from 'react-hot-toast';
import { BrainSection } from './BrainSection';
import { OrgContext, type OrgContextValue } from '@/Context/OrgContext';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const saveMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock('react-hot-toast', () => {
  // The real default export is callable (toast('msg')) with .success/.error
  // attached — the mock must be too, or bare toast() calls throw.
  const toastFn = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() });
  return { default: toastFn };
});

// BrainSection reads the org role for the denied-copy; the section under
// test is authorable, so stub an owner role. No network: no queries fire
// without an assistant fetch in this tree.
const stubOrg: OrgContextValue = {
  orgId: 'org-test',
  orgs: [],
  role: 'owner',
  name: null,
  setActive: () => {},
  adoptOrg: () => {},
  atLeast: () => true,
  canManageMembers: true,
  entitlementState: () => 'active',
};

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useSaveDraftVersion: () => ({ mutate: saveMutate, isPending: false }),
    useUpdateDraftVersion: () => ({ mutate: updateMutate, isPending: false }),
    useAssistantDefinition: () => ({
      data: {
        // Live version for the 412 dialog: carries a thinking budget another
        // tab set (Wave B proof target).
        definition: {
          ...defaultConsumer(),
          instructions: '## Role\nR.\n',
          model_params: { reasoning_budget_tokens: 7500 },
        },
        versionId: 'v9',
        hash: 'h2',
        status: 'DRAFT',
        isDraft: true,
      },
      isPending: false,
      isFetching: false,
      isError: false,
    }),
  };
});

const DEFINITION: AgentDefinition = {
  ...defaultConsumer(),
  instructions: '## Role\nConcierge.\n',
  model_policy: { allowed_models: ['a/b'], fallback_enabled: false },
};

function tree(props?: Partial<React.ComponentProps<typeof BrainSection>>) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <OrgContext.Provider value={stubOrg}>
          <BrainSection
            assistantId="agent-main"
            definition={DEFINITION}
            versionId="v1"
            versionHash="h1"
            isDraft
            canAuthor
            onDirtyChange={() => undefined}
            saveSignal={0}
            {...props}
          />
        </OrgContext.Provider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function shell(props?: Partial<React.ComponentProps<typeof BrainSection>>) {
  return render(tree(props));
}

beforeEach(() => {
  saveMutate.mockReset();
  updateMutate.mockReset();
  vi.mocked(toast.success).mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

function withFakeTimers() {
  vi.useFakeTimers();
}

describe('BrainSection profiles', () => {
  it('lists the reasoning profiles with inspectable param maps', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText('Clerk')).toBeTruthy();
    expect(screen.getByText('Scholar')).toBeTruthy();
    expect(screen.getByText('Creator')).toBeTruthy();
    // Model picking, fallback, and raw params live in the Model node now.
    expect(screen.queryByText(/allowed models/i)).toBeNull();
    expect(screen.queryByLabelText('Fallback')).toBeNull();
  });

  it('applies a preset as a model_params patch (autosaved)', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByText('Scholar'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_params.temperature).toBe(0.7);
    expect(input.definition.model_params.reasoning_effort).toBe('high');
    expect(input.definition.model_params.max_output_tokens).toBe(16000);
  });

  it('preserves output_schema when a preset lands (params wholesale)', async () => {
    withFakeTimers();
    await act(async () => {
      shell({
        definition: { ...DEFINITION, model_params: { output_schema: '{"type":"object"}' } },
      });
    });
    fireEvent.click(screen.getByText('Scholar'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_params.output_schema).toBe('{"type":"object"}');
  });

  it('marks the preset that matches the current params', async () => {
    await act(async () => {
      shell({
        definition: {
          ...DEFINITION,
          model_params: { temperature: 0.7, top_p: 1, max_output_tokens: 16000, reasoning_effort: 'high' },
        },
      });
    });
    expect(screen.getByText('Current')).toBeTruthy();
  });

  it('renders the 412 dialog and saves over fresh', async () => {
    withFakeTimers();
    updateMutate.mockImplementationOnce((_input: unknown, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(new ApiError(412, 'precondition_failed', 'stale', { expected: 'h1', current: 'h2' }));
    });
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByText('Scholar'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(screen.getByText(/Someone saved first/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Save mine over theirs/));
    expect(updateMutate).toHaveBeenCalledTimes(2);
    const retry = updateMutate.mock.calls[1][0] as { expectedHash: string; definition: AgentDefinition };
    expect(retry.expectedHash).toBe('h2');
    expect(retry.definition.model_params.temperature).toBe(0.7);
  });

  it('renders read-only for viewers (profiles visible, controls dead)', async () => {
    await act(async () => {
      shell({ canAuthor: false });
    });
    const scholar = screen.getByText('Scholar').closest('button');
    expect(scholar?.disabled).toBe(true);
  });
});

describe('BrainSection manual save signal', () => {
  it('fires doSave exactly once when saveSignal increments', async () => {
    // Mounting at a non-zero signal must NOT fire (G-BUG7: the counter
    // outlives the section — only a change while mounted is a real signal).
    let ui: ReturnType<typeof render>;
    await act(async () => {
      ui = render(tree({ saveSignal: 0 }));
    });
    expect(updateMutate).not.toHaveBeenCalled();
    await act(async () => {
      ui.rerender(tree({ saveSignal: 1 }));
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { expectedHash: string };
    expect(input.expectedHash).toBe('h1');
  });

  it('does not save on mount when saveSignal is 0', async () => {
    await act(async () => {
      shell();
    });
    expect(updateMutate).not.toHaveBeenCalled();
    expect(saveMutate).not.toHaveBeenCalled();
  });
});

describe('BrainSection reasoning budget', () => {
  it('round-trips reasoning_budget_tokens through readParams/buildNext', async () => {
    let ui: ReturnType<typeof render>;
    await act(async () => {
      ui = render(
        tree({
          saveSignal: 0,
          definition: { ...DEFINITION, model_params: { reasoning_budget_tokens: 5000 } },
        }),
      );
    });
    await act(async () => {
      ui.rerender(
        tree({
          saveSignal: 1,
          definition: { ...DEFINITION, model_params: { reasoning_budget_tokens: 5000 } },
        }),
      );
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_params.reasoning_budget_tokens).toBe(5000);
  });

  it('keeps a previously-set budget when a preset applies', async () => {
    withFakeTimers();
    await act(async () => {
      shell({
        definition: {
          ...DEFINITION,
          model_params: {
            temperature: 0.2,
            top_p: 1,
            max_output_tokens: 8000,
            reasoning_effort: 'low',
            reasoning_budget_tokens: 5000,
          },
        },
      });
    });
    fireEvent.click(screen.getByText('Scholar'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    // Preset params land…
    expect(input.definition.model_params.temperature).toBe(0.7);
    expect(input.definition.model_params.reasoning_effort).toBe('high');
    expect(input.definition.model_params.max_output_tokens).toBe(16000);
    // …while the thinking budget rides along untouched from local state.
    expect(input.definition.model_params.reasoning_budget_tokens).toBe(5000);
  });

  it('adopts the live budget on conflict "reload theirs"', async () => {
    withFakeTimers();
    updateMutate.mockImplementationOnce((_input: unknown, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(new ApiError(412, 'precondition_failed', 'stale', { expected: 'h1', current: 'h2' }));
    });
    let ui: ReturnType<typeof render>;
    await act(async () => {
      ui = render(tree({ saveSignal: 0 }));
    });
    fireEvent.click(screen.getByText('Scholar'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(screen.getByText(/Someone saved first/)).toBeTruthy();
    // The mocked live version carries reasoning_budget_tokens: 7500.
    fireEvent.click(screen.getByText(/Reload theirs/));
    expect(screen.queryByText(/Someone saved first/)).toBeNull();
    await act(async () => {
      ui.rerender(tree({ saveSignal: 1 }));
    });
    const calls = updateMutate.mock.calls;
    expect(calls).toHaveLength(2);
    const retry = calls[1][0] as { definition: AgentDefinition };
    expect(retry.definition.model_params.reasoning_budget_tokens).toBe(7500);
  });

  it('passes out-of-range budget values through verbatim (engine validates)', async () => {
    // The builder never clamps: 999999 exceeds the engine's 1–100000 range,
    // and the payload must still carry it verbatim; the engine rejects it and
    // the Model node's paramIssues gate holds the save.
    let ui: ReturnType<typeof render>;
    await act(async () => {
      ui = render(
        tree({
          saveSignal: 0,
          definition: { ...DEFINITION, model_params: { reasoning_budget_tokens: 999999 } },
        }),
      );
    });
    await act(async () => {
      ui.rerender(
        tree({
          saveSignal: 1,
          definition: { ...DEFINITION, model_params: { reasoning_budget_tokens: 999999 } },
        }),
      );
    });
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_params.reasoning_budget_tokens).toBe(999999);
  });
});
