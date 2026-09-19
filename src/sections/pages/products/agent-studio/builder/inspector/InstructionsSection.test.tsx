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
