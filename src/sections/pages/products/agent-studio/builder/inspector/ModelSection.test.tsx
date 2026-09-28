// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { ApiError } from '@lib/engine/client';
import toast from 'react-hot-toast';
import { ModelSection } from './ModelSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const saveMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    // Locked-row subscription links stand in as plain anchors — routing is
    // out of scope here; the href is what we assert.
    Link: ({ children, to }: { children?: ReactNode; to?: string }) => <a href={to ?? '#'}>{children}</a>,
  };
});

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
        { provider: 'a', modelId: 'b', ref: 'a/b', displayName: 'A B', contextWindowTokens: null, maxOutputTokens: null, capabilities: {}, residency: null, usable: true, reasons: [], requiredProduct: 'free', requiredProductLabel: 'Free' },
        { provider: 'c', modelId: 'd', ref: 'c/d', displayName: 'C D', contextWindowTokens: null, maxOutputTokens: null, capabilities: {}, residency: null, usable: true, reasons: [], requiredProduct: null, requiredProductLabel: null },
        { provider: 'e', modelId: 'f', ref: 'e/f', displayName: 'E F', contextWindowTokens: null, maxOutputTokens: null, capabilities: {}, residency: null, usable: false, reasons: ['subscription_required'], requiredProduct: 'payg', requiredProductLabel: 'Pay-as-you-go' },
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

function shell(props?: Partial<React.ComponentProps<typeof ModelSection>>) {
  const onDirtyChange = vi.fn();
  const ui = render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ModelSection
          assistantId="agent-main"
          definition={DEFINITION}
          versionId="v1"
          versionHash="h1"
          isDraft
          canAuthor
          onDirtyChange={onDirtyChange}
          saveSignal={0}
          {...props}
        />
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { onDirtyChange, ui };
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

describe('ModelSection policy', () => {
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

  it('shows the selected models and the other params in the header card', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/RESOLVED · FIRST SERVES/)).toBeTruthy();
    expect(screen.getAllByText('A B').length).toBeGreaterThanOrEqual(1);
    // The selected ref shows in the header card and in the picker row.
    expect(screen.getAllByText(/a\/b/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders subscription-locked rows with the product label and billing path', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/LOCKED/)).toBeTruthy();
    expect(screen.getByText(/Requires Pay-as-you-go — you don't have that/)).toBeTruthy();
    const link = screen.getByRole('link', { name: /view subscription options/i }) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/agent-studio/settings/billing');
  });

  it('holds save on out-of-range params with named messages', async () => {
    withFakeTimers();
    await act(async () => {
      shell({
        definition: { ...DEFINITION, model_params: { temperature: 9 } },
      });
    });
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

  it('propagates dirty state to the parent', async () => {
    withFakeTimers();
    let onDirtyChange!: ReturnType<typeof vi.fn>;
    await act(async () => {
      ({ onDirtyChange } = shell());
    });
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    fireEvent.click(screen.getByLabelText('Fallback'));
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });

  it('flushes pending edits on unmount instead of dropping them', async () => {
    withFakeTimers();
    let ui!: ReturnType<typeof render>;
    await act(async () => {
      ({ ui } = shell());
    });
    fireEvent.click(screen.getByLabelText('Fallback'));
    // Unmount before the 8s debounce fires — the flush must still save.
    await act(async () => {
      ui.unmount();
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.model_policy.fallback_enabled).toBe(true);
  });

  it('adopts a 409 draft opened elsewhere and keeps editing', async () => {
    withFakeTimers();
    saveMutate.mockImplementationOnce((_input: unknown, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(new ApiError(409, 'conflict', 'a draft version already exists for this assistant'));
    });
    await act(async () => {
      shell({ isDraft: false, versionId: null, versionHash: null });
    });
    fireEvent.click(screen.getByLabelText('Fallback'));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(saveMutate).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/draft opened elsewhere/i));
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
    expect(screen.getByText(/Off|On — next allowed/)).toBeTruthy();
  });
});

describe('ModelSection manual save signal', () => {
  it('fires doSave exactly once when saveSignal increments', async () => {
    await act(async () => {
      shell({ saveSignal: 1 });
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
