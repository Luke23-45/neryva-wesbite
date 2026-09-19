// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { ApiError } from '@lib/engine/client';
import toast from 'react-hot-toast';
import { BrandSection } from './BrandSection';
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
        definition: { ...defaultConsumer(), brand: '' },
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

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({ data: [], isPending: false, isError: false }),
}));

vi.mock('@hooks/studio/useSetupTemplates', () => ({
  useAssistantTemplates: () => ({
    data: [
      {
        template: {
          slug: 'support-triage',
          version: '1',
          status: 'RELEASED',
          family: 'support',
          definition: { brand: 'Short sentences. Contractions always.' },
          bindings: { tools: { required: [] }, knowledge: { required: [] }, channels: { channels: [] } },
          evalRef: null,
          releasePolicy: null,
          hash: null,
          minEngineSchema: null,
        },
        available: true,
        compatible: true,
        reasons: [],
        installed: false,
        updateAvailable: 'none',
      },
    ],
    isPending: false,
    isError: false,
  }),
}));

const DEFINITION: AgentDefinition = {
  ...defaultConsumer(),
  model_policy: { allowed_models: ['a/b'], fallback_enabled: false },
  instructions: '## Role\nConcierge.\n',
  brand: 'Short sentences.',
};

function shell(props?: Partial<React.ComponentProps<typeof BrandSection>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <BrandSection
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

function withFakeTimers() {
  vi.useFakeTimers();
}

describe('BrandSection voice', () => {
  it('renders the voice with counter and composition microcopy', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByDisplayValue('Short sentences.')).toBeTruthy();
    expect(screen.getByText(/\/ 2,000 chars/)).toBeTruthy();
    expect(screen.getByText(/Composed into every reply/)).toBeTruthy();
  });

  it('states the platform default when blank (never implied)', async () => {
    await act(async () => {
      shell({ definition: { ...DEFINITION, brand: '' } });
    });
    expect(screen.getByText(/Platform default voice — nothing set/)).toBeTruthy();
  });

  it('holds save over the cap with the caps message verbatim', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.change(screen.getByDisplayValue('Short sentences.'), { target: { value: 'x'.repeat(2001) } });
    expect(screen.getByText(/over the 2,000 cap/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('names the broadcast risk on pasted secrets and holds the save', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.change(screen.getByDisplayValue('Short sentences.'), {
      target: { value: 'api_key: sk-live-1234567890abcdef' },
    });
    expect(screen.getByText(/ships into every reply/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('PUTs the voice after the debounce when shippable', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.change(screen.getByDisplayValue('Short sentences.'), { target: { value: 'Short sentences! Contractions.' } });
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition; expectedHash: string };
    expect(input.expectedHash).toBe('h1');
    expect(input.definition.brand).toBe('Short sentences! Contractions.');
  });

  it('inserts template voices only with explicit replace-consent', async () => {
    await act(async () => {
      shell({ definition: { ...DEFINITION, brand: 'Mine first.' } });
    });
    fireEvent.click(screen.getByText(/Use a voice sample/));
    fireEvent.click(screen.getByText('Support Triage'));
    // Consent gate: nothing applied yet.
    expect(screen.getByDisplayValue('Mine first.')).toBeTruthy();
    expect(screen.getByText(/Replace the current voice/)).toBeTruthy();
    fireEvent.click(screen.getByText('Use this voice'));
    expect(screen.getByDisplayValue('Short sentences. Contractions always.')).toBeTruthy();
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(expect.stringMatching(/every save is a version/));
  });

  it('renders the 412 dialog with the brand diff and saves over with the fresh hash', async () => {
    withFakeTimers();
    updateMutate.mockImplementationOnce((_input: unknown, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(new ApiError(412, 'precondition_failed', 'stale', { expected: 'h1', current: 'h2' }));
    });
    await act(async () => {
      shell();
    });
    fireEvent.change(screen.getByDisplayValue('Short sentences.'), { target: { value: 'My bold voice.' } });
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(screen.getByText(/Someone saved first/)).toBeTruthy();
    expect(screen.getAllByText(/My bold voice\./).length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByText(/Save mine over theirs/));
    expect(updateMutate).toHaveBeenCalledTimes(2);
    const retry = updateMutate.mock.calls[1][0] as { expectedHash: string };
    expect(retry.expectedHash).toBe('h2');
  });

  it('adopts the draft on 409 with guidance', async () => {
    withFakeTimers();
    saveMutate.mockImplementationOnce((_input: unknown, opts?: { onError?: (e: unknown) => void }) => {
      opts?.onError?.(new ApiError(409, 'conflict', 'a draft version already exists for this assistant'));
    });
    await act(async () => {
      shell({ definition: { ...DEFINITION, brand: '' }, versionId: null, versionHash: null, isDraft: false });
    });
    fireEvent.change(screen.getByPlaceholderText(/Never say/), { target: { value: 'Brave voice.' } });
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(saveMutate).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(expect.stringMatching(/resumed it/));
  });

  it('renders read-only for viewers with the counter intact', async () => {
    await act(async () => {
      shell({ canAuthor: false });
    });
    expect(screen.getByText(/Short sentences\./)).toBeTruthy();
    expect(screen.queryByDisplayValue('Short sentences.')).toBeNull();
    expect(screen.getByText(/tokens \(est\.\)/)).toBeTruthy();
  });
});
