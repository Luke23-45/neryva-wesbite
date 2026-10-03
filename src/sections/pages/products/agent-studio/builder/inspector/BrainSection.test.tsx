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
        definition: { ...defaultConsumer(), instructions: '## Role\nR.\n' },
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
