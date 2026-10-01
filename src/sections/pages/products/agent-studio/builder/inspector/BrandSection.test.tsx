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
import type { BrandVoice } from '../lib/brand-model';

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
        definition: { ...defaultConsumer(), brand: undefined },
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
          definition: { brand: { mode: 'raw', content: 'Short sentences. Contractions always.' } },
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

const VOICE: BrandVoice = { mode: 'raw', content: 'Short sentences.' };

const DEFINITION: AgentDefinition = {
  ...defaultConsumer(),
  model_policy: { allowed_models: ['a/b'], fallback_enabled: false },
  instructions: '## Role\nConcierge.\n',
  brand: VOICE,
};

function openEditor() {
  // The collapsed card is the only way in — click it to open the focused editor.
  const cards = screen.getAllByRole('button', { name: 'Edit Brand voice' });
  fireEvent.click(cards[0]);
}

function backToPage() {
  fireEvent.click(screen.getByRole('button', { name: 'Back to Brand voice' }));
}

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

function withFakeTimers() {
  vi.useFakeTimers();
}

describe('BrandSection voice', () => {
  it('renders the voice with counter and corrected composition microcopy', async () => {
    await act(async () => {
      shell();
    });
    // The collapsed card shows the saved preview; the rail carries the cap.
    expect(screen.getByText('Short sentences.')).toBeTruthy();
    expect(screen.getByText(/\/ 2,000 chars/)).toBeTruthy();
    // D2: the copy states the true composition order — after instructions and role.
    expect(screen.getByText(/composed into the system prompt after instructions and role/i)).toBeTruthy();
  });

  it('offers raw/markdown/json mode selection inside the focused editor', async () => {
    await act(async () => {
      shell();
    });
    openEditor();
    const group = screen.getByRole('tablist', { name: 'Editing surface' });
    expect(group).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Plain' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Markdown' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'JSON' })).toBeTruthy();
  });

  it('states the platform default when blank (never implied)', async () => {
    await act(async () => {
      shell({ definition: { ...DEFINITION, brand: undefined } });
    });
    expect(screen.getByText(/Platform default voice — nothing set/)).toBeTruthy();
  });

  it('holds save over the cap with the caps message verbatim', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    openEditor();
    fireEvent.change(screen.getByDisplayValue('Short sentences.'), { target: { value: 'x'.repeat(2001) } });
    // The editor pushes the draft to the section after 2s; back out to read the hold.
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    backToPage();
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
    openEditor();
    fireEvent.change(screen.getByDisplayValue('Short sentences.'), {
      target: { value: 'api_key: sk-live-1234567890abcdef' },
    });
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    backToPage();
    expect(screen.getByText(/ships into every reply/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('PUTs the modal block after Done and the autosave debounce', async () => {
    withFakeTimers();
    await act(async () => {
      shell();
    });
    openEditor();
    fireEvent.change(screen.getByDisplayValue('Short sentences.'), { target: { value: 'Short sentences! Contractions.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition; expectedHash: string };
    expect(input.expectedHash).toBe('h1');
    expect(input.definition.brand).toEqual({ mode: 'raw', content: 'Short sentences! Contractions.' });
  });

  it('holds the save when JSON mode content is not a JSON string', async () => {
    withFakeTimers();
    await act(async () => {
      shell({ definition: { ...DEFINITION, brand: { mode: 'json', content: '"ok"' } } });
    });
    openEditor();
    // The JSON surface edits raw JSON, not the parsed string.
    fireEvent.change(screen.getByDisplayValue('"ok"'), { target: { value: 'not json' } });
    await act(async () => {
      vi.advanceTimersByTime(2500);
    });
    backToPage();
    expect(screen.getByText(/not valid in its selected mode/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('inserts template voices only with explicit replace-consent', async () => {
    await act(async () => {
      shell({ definition: { ...DEFINITION, brand: { mode: 'raw', content: 'Mine first.' } } });
    });
    fireEvent.click(screen.getByText(/Use a voice sample/));
    fireEvent.click(screen.getByText('Support Triage'));
    // Consent gate: nothing applied yet — the card still shows the old voice.
    expect(screen.getByText('Mine first.')).toBeTruthy();
    expect(screen.getByText(/Replace the current voice/)).toBeTruthy();
    fireEvent.click(screen.getByText('Use this voice'));
    // The voice appears in both the template row and the editor — assert presence.
    expect(screen.getAllByText('Short sentences. Contractions always.').length).toBeGreaterThan(0);
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
    openEditor();
    fireEvent.change(screen.getByDisplayValue('Short sentences.'), { target: { value: 'My bold voice.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
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
      shell({ definition: { ...DEFINITION, brand: undefined }, versionId: null, versionHash: null, isDraft: false });
    });
    openEditor();
    fireEvent.change(screen.getByPlaceholderText(/Never say/), { target: { value: 'Brave voice.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
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

describe('BrandSection voice-sample panel', () => {
  it('keeps a user-collapsed panel collapsed across a sub-editor open/close', async () => {
    await act(async () => {
      shell({ definition: { ...DEFINITION, brand: undefined } });
    });
    const toggle = screen.getByRole('button', { name: /Use a voice sample/ });
    // Empty brand → the panel starts open; the user collapses it.
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // Opening the focused editor unmounts the page subtree — closing it
    // must not resurrect the panel (collapse state lives at the root).
    openEditor();
    backToPage();
    expect(screen.getByRole('button', { name: /Use a voice sample/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByText('Support Triage')).toBeNull();
  });

  it('keeps a user-expanded panel expanded across a sub-editor open/close', async () => {
    await act(async () => {
      shell();
    });
    const toggle = screen.getByRole('button', { name: /Use a voice sample/ });
    // Non-empty brand → the panel starts collapsed; the user expands it.
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    openEditor();
    backToPage();
    expect(screen.getByRole('button', { name: /Use a voice sample/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Support Triage')).toBeTruthy();
  });

  it('renders the toggle flat — no blue selection tint in any state', async () => {
    await act(async () => {
      shell({ definition: { ...DEFINITION, brand: undefined } });
    });
    const toggle = screen.getByRole('button', { name: /Use a voice sample/ });
    const background = getComputedStyle(toggle).backgroundColor;
    // Flat console palette: surface.subtle, never the info.bg blue tint
    // that read as a selection state.
    expect(background).toBe(theme.app.surface.subtle);
    expect(background).not.toContain('59, 130, 246');
    expect(getComputedStyle(toggle).color).not.toContain('147, 197, 253');
    // Expanded state keeps the same flat treatment — no selection tint.
    fireEvent.click(toggle);
    const expandedBackground = getComputedStyle(
      screen.getByRole('button', { name: /Use a voice sample/ }),
    ).backgroundColor;
    expect(expandedBackground).toBe(theme.app.surface.subtle);
    expect(expandedBackground).not.toContain('59, 130, 246');
  });
});
describe('BrandSection save lifecycle (model-less draft regression)', () => {
  it('saves brand on a model-less draft — a missing model never holds a brand save', async () => {
    withFakeTimers();
    await act(async () => {
      shell({
        definition: {
          ...DEFINITION,
          model_policy: { allowed_models: [], fallback_enabled: false },
        },
      });
    });
    expect(screen.queryByText(/Pick at least one allowed model/)).toBeNull();
    openEditor();
    fireEvent.change(screen.getByDisplayValue('Short sentences.'), { target: { value: 'Brave voice.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await act(async () => {
      vi.advanceTimersByTime(9000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const input = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(input.definition.brand).toEqual({ mode: 'raw', content: 'Brave voice.' });
  });
});
