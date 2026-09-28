// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { ApiError } from '@lib/engine/client';
import toast from 'react-hot-toast';
import { InstructionsSection } from './InstructionsSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const saveMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

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

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({ data: [], isPending: false, isError: false }),
}));

vi.mock('@hooks/studio/useSetupTemplates', () => ({
  useAssistantTemplates: () => ({ data: [], isPending: false, isError: false }),
}));

const DEFINITION: AgentDefinition = {
  ...defaultConsumer(),
  model_policy: { allowed_models: ['a/b'], fallback_enabled: false },
  instructions: '## Role\nConcierge.\n\n## Rules\n- Be kind.\n',
};

function shell(props?: Partial<React.ComponentProps<typeof InstructionsSection>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <InstructionsSection
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
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  saveMutate.mockReset();
  updateMutate.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Autosave runs on an 8s debounce — fake timers scoped per timer test. */
function withFakeTimers() {
  vi.useFakeTimers();
}

describe('InstructionsSection composer', () => {
  it('renders blocks from the definition with counters', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByDisplayValue('Concierge.')).toBeTruthy();
    expect(screen.getByDisplayValue('Be kind.')).toBeTruthy();
    expect(screen.getByText(/\/ 20,000 chars/)).toBeTruthy();
    expect(screen.getByText(/tokens \(est\.\)/)).toBeTruthy();
  });

  it('appends a rule on Enter and holds save over the cap', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    const rule = screen.getByDisplayValue('Be kind.');
    fireEvent.keyDown(rule, { key: 'Enter' });
    const inputs = screen.getAllByLabelText(/Rule \d+/);
    expect(inputs.length).toBe(2);
    // Over the cap: held whisper appears, no PUT fires after the debounce.
    const huge = 'x'.repeat(20001);
    fireEvent.change(screen.getByDisplayValue('Concierge.'), { target: { value: huge } });
    expect(screen.getByText(/over the 20,000 cap/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
    expect(saveMutate).not.toHaveBeenCalled();
  });

  it('PUTs the composed text after the debounce when shippable', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.change(screen.getByDisplayValue('Concierge.'), { target: { value: 'Concierge!!' } });
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition; expectedHash: string };
    expect(input.expectedHash).toBe('h1');
    expect(input.definition.instructions).toContain('Concierge!!');
  });

  it('whispers field-level on pasted secrets and never banner-reds', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.change(screen.getByDisplayValue('Be kind.'), {
      target: { value: 'api_key: sk-live-1234567890abcdef' },
    });
    expect(screen.getByText(/Looks like a pasted credential/)).toBeTruthy();
    withFakeTimers();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('adopts the draft on 409 with guidance (Room parity, no new dialog)', async () => {
    withFakeTimers();
    saveMutate.mockImplementationOnce((_input: unknown, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(new ApiError(409, 'conflict', 'a draft version already exists for this assistant'));
    });
    await act(async () => {
      shell({
        definition: { ...DEFINITION, instructions: '' },
        versionId: null,
        versionHash: null,
        isDraft: false,
      });
    });
    // Fresh blank draft: type to force a POST path… (blank source is clean, so
    // seed text first via the composer, then let the debounce fire.)
    fireEvent.change(screen.getByPlaceholderText('You are…'), { target: { value: 'Hello.' } });
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(saveMutate).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(expect.stringMatching(/resumed it/));
  });

  it('caps examples at six with the reason stated, never silently', async () => {
    await act(async () => {
      shell({
        definition: {
          ...DEFINITION,
          instructions: '## Role\nR.\n\n## Examples\n### A\na\n### B\nb\n### C\nc\n### D\nd\n### E\ne\n### F\nf\n',
        },
      });
    });
    expect(screen.queryByText(/Add example/)).toBeNull();
    expect(screen.getByText(/2–3 canonical beats 10 mediocre/)).toBeTruthy();
  });

  it('blurs on Escape inside the composer instead of losing focus silently', async () => {
    await act(async () => {
      shell();
    });
    const role = screen.getByDisplayValue('Concierge.');
    role.focus();
    expect(document.activeElement).toBe(role);
    fireEvent.keyDown(role, { key: 'Escape' });
    expect(document.activeElement).not.toBe(role);
  });

  it('renders read-only for viewers with counters intact', async () => {
    await act(async () => {
      shell({ canAuthor: false });
    });
    expect(screen.getByText(/Concierge\./)).toBeTruthy();
    expect(screen.queryByDisplayValue('Concierge.')).toBeNull();
    expect(screen.queryByText(/Add rule/)).toBeNull();
    expect(screen.getByText(/tokens \(est\.\)/)).toBeTruthy();
  });

  it('raw override pauses the composer with an explicit restore', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByText('Raw'));
    const raw = screen.getByLabelText(/Raw payload/);
    fireEvent.change(raw, { target: { value: 'Completely custom text.' } });
    expect(await screen.findByText(/composer paused/)).toBeTruthy();
    fireEvent.click(screen.getByText('Restore from blocks'));
    fireEvent.click(screen.getByText('Restore'));
    expect(screen.queryByText(/composer paused/)).toBeNull();
  });
});

describe('InstructionsSection save lifecycle (model-less draft regression)', () => {
  const MODEL_LESS: AgentDefinition = {
    ...DEFINITION,
    model_policy: { allowed_models: [], fallback_enabled: false },
  };

  function boot(props?: Partial<React.ComponentProps<typeof InstructionsSection>>) {
    let r: ReturnType<typeof render> | undefined;
    return {
      render: async () => {
        await act(async () => {
          r = shell(props);
        });
        return r!;
      },
      rerender: async (next: Partial<React.ComponentProps<typeof InstructionsSection>>) => {
        await act(async () => {
          r!.rerender(
            <ThemeProvider theme={theme}>
              <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
                <InstructionsSection
                  assistantId="agent-main"
                  definition={DEFINITION}
                  versionId="v1"
                  versionHash="h1"
                  isDraft
                  canAuthor
                  onDirtyChange={() => undefined}
                  saveSignal={0}
                  {...props}
                  {...next}
                />
              </QueryClientProvider>
            </ThemeProvider>,
          );
        });
      },
    };
  }

  it('saves instructions on a model-less draft — a missing model never holds an instructions save', async () => {
    withFakeTimers();
    const b = boot({ definition: MODEL_LESS });
    await b.render();
    // No held whisper about models: the gate is own-section only.
    expect(screen.queryByText(/Pick at least one allowed model/)).toBeNull();
    fireEvent.change(screen.getByDisplayValue('Concierge.'), { target: { value: 'Concierge!!' } });
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition; expectedHash: string };
    expect(input.definition.instructions).toContain('Concierge!!');
  });

  it('explicit Save while held toasts the reason instead of swallowing the click', async () => {
    const over = `## Role\n${'x'.repeat(20001)}\n\n## Rules\n- Be kind.\n`;
    const b = boot({ definition: { ...DEFINITION, instructions: over }, saveSignal: 0 });
    await b.render();
    expect(screen.getByText(/over the 20,000 cap/)).toBeTruthy();
    // Topbar Save (saveSignal) while the section is held must explain itself.
    await b.rerender({ definition: { ...DEFINITION, instructions: over }, saveSignal: 1 });
    expect(updateMutate).not.toHaveBeenCalled();
    expect(saveMutate).not.toHaveBeenCalled();
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(expect.stringMatching(/over the 20,000 cap/));
  });

  it('adopts fresh server text on a stale remount instead of sticking on old text', async () => {
    const OLD = '## Role\nOld role.\n\n## Rules\n- Be kind.\n';
    const NEW = '## Role\nNew role.\n\n## Rules\n- Be kind.\n';
    const b = boot({ definition: { ...DEFINITION, instructions: OLD }, versionHash: 'h1' });
    await b.render();
    expect(screen.getByDisplayValue('Old role.')).toBeTruthy();
    // The refetch delivers a newer revision while the user typed nothing —
    // the section must converge on the server text rather than stick.
    await b.rerender({ definition: { ...DEFINITION, instructions: NEW }, versionHash: 'h2' });
    expect(screen.getByDisplayValue('New role.')).toBeTruthy();
  });

  it('keeps local edits over a newer server revision (edits always win)', async () => {
    const OLD = '## Role\nOld role.\n\n## Rules\n- Be kind.\n';
    const SERVER = '## Role\nServer role.\n\n## Rules\n- Be kind.\n';
    const b = boot({ definition: { ...DEFINITION, instructions: OLD }, versionHash: 'h1' });
    await b.render();
    fireEvent.change(screen.getByDisplayValue('Old role.'), { target: { value: 'My unsaved edit.' } });
    await b.rerender({ definition: { ...DEFINITION, instructions: SERVER }, versionHash: 'h2' });
    expect(screen.getByDisplayValue('My unsaved edit.')).toBeTruthy();
  });
});
