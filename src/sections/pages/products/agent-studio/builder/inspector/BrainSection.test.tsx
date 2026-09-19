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

vi.mock('@hooks/studio/useSetupModels', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupModels')>();
  return {
    ...actual,
    useModelAvailability: () => ({
      data: [
        { provider: 'a', modelId: 'b', ref: 'a/b', displayName: 'A B', contextWindowTokens: null, maxOutputTokens: null, capabilities: {}, residency: null, usable: true, reasons: [] },
        { provider: 'c', modelId: 'd', ref: 'c/d', displayName: 'C D', contextWindowTokens: null, maxOutputTokens: null, capabilities: {}, residency: null, usable: true, reasons: [] },
      ],
      isPending: false,
      isFetching: false,
      isError: false,
    }),
    useModelCosts: () => ({ data: [], isPending: false, isFetching: false, isError: false }),
  };
});

vi.mock('@hooks/studio/useSetupProviders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupProviders')>();
  return {
    ...actual,
    useProviderCredentials: () => ({ data: [], isPending: false, isError: false }),
    useCreateProviderCredential: () => ({ mutate: vi.fn(), isPending: false }),
    useRotateProviderCredential: () => ({ mutate: vi.fn(), isPending: false }),
    useRevokeProviderCredential: () => ({ mutate: vi.fn(), isPending: false }),
  };
});

const DEFINITION: AgentDefinition = {
  ...defaultConsumer(),
  instructions: '## Role\nConcierge.\n',
  model_policy: { allowed_models: ['a/b'], fallback_enabled: false },
};

function shell(props?: Partial<React.ComponentProps<typeof BrainSection>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <BrainSection
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
});

afterEach(() => {
  vi.useRealTimers();
});

function withFakeTimers() {
  vi.useFakeTimers();
}

describe('BrainSection policy', () => {
  it('resolves the primary with usability and writes fallback flips', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    expect(screen.getAllByText('A B').length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByLabelText('Fallback'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition; expectedHash: string };
    expect(input.expectedHash).toBe('h1');
    expect(input.definition.model_policy.fallback_enabled).toBe(true);
    expect(input.definition.model_policy.allowed_models).toEqual(['a/b']);
  });

  it('applies presets as param patches (inspectable map, autosaved)', async () => {
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

  it('holds save on out-of-range params with named messages', async () => {
    withFakeTimers();
    await act(async () => {
      shell({
        definition: { ...DEFINITION, model_params: { temperature: 9 } },
      });
    });
    // Sliders cannot leave range by construction — out-of-range arrives from
    // stored data, and the section holds with the range named (never clamps).
    expect(screen.getByText(/Temperature must be 0–2/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('holds save on invalid schemas with the failure named', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByText(/Advanced/));
    fireEvent.change(screen.getByLabelText(/Output schema/), { target: { value: '{nope' } });
    expect(screen.getByText(/Not valid JSON/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('reorders the fallback chain through the picker', async () => {
    withFakeTimers();
    await act(async () => {
      shell({ definition: { ...DEFINITION, model_policy: { allowed_models: ['a/b', 'c/d'], fallback_enabled: true } } });
    });
    fireEvent.click(screen.getByLabelText('Move a/b down'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_policy.allowed_models).toEqual(['c/d', 'a/b']);
  });

  it('renders the 412 dialog with the policy diff and saves over fresh', async () => {
    withFakeTimers();
    updateMutate.mockImplementationOnce((_input: unknown, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(new ApiError(412, 'precondition_failed', 'stale', { expected: 'h1', current: 'h2' }));
    });
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('Fallback'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(screen.getByText(/Someone saved first/)).toBeTruthy();
    fireEvent.click(screen.getByText(/Save mine over theirs/));
    expect(updateMutate).toHaveBeenCalledTimes(2);
    const retry = updateMutate.mock.calls[1][0] as { expectedHash: string; definition: AgentDefinition };
    expect(retry.expectedHash).toBe('h2');
    expect(retry.definition.model_policy.fallback_enabled).toBe(true);
  });

  it('renders read-only for viewers (policy visible, controls dead)', async () => {
    await act(async () => {
      shell({ canAuthor: false });
    });
    expect(screen.getAllByText('A B').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByLabelText('Fallback')).toBeNull();
    // Profiles stay visible (readable policy) but dead.
    const scholar = screen.getByText('Scholar').closest('button');
    expect(scholar?.disabled).toBe(true);
    expect(screen.getByText(/Off|On — next allowed/)).toBeTruthy();
  });
});
