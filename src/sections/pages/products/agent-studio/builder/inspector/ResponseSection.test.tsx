// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { ResponseSection } from './ResponseSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const updateMutate = vi.fn();
const navigateMock = vi.fn();

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useSaveDraftVersion: () => ({ mutate: vi.fn(), isPending: false }),
    useUpdateDraftVersion: () => ({ mutate: updateMutate, isPending: false }),
  };
});

function definitionWithPolicy(policy: AgentDefinition['response_policy']): AgentDefinition {
  const def = defaultConsumer();
  return { ...def, instructions: '## Role\\nR.\\n', response_policy: policy };
}

function shell(props?: Partial<React.ComponentProps<typeof ResponseSection>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <ResponseSection
          assistantId="agent-main"
          definition={definitionWithPolicy(undefined)}
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
  navigateMock.mockReset();
});

/** The selected tab inside a segmented group. */
function selectedTab(groupName: string): string | null {
  const group = screen.getByRole('tablist', { name: groupName });
  return group.querySelector('[aria-selected="true"]')?.textContent ?? null;
}

describe('ResponseSection', () => {
  it('treats an absent policy as engine defaults', () => {
    shell();
    expect(selectedTab('Output format')).toBe('Markdown');
    expect(selectedTab('Citations on or off')).toBe('On');
    expect(selectedTab('Citation style')).toBe('Inline links');
    expect(selectedTab('Streaming')).toBe('Auto');
    expect(selectedTab('Length')).toBe('Balanced');
    expect(screen.getByText(/Markdown · citations on · inline · streaming Auto · Balanced/)).toBeTruthy();
  });

  it('renders the honest helper microcopy for every presentation control', () => {
    shell();
    expect(screen.getByText(/Markdown renders rich answers; plain text suits SMS and voice/)).toBeTruthy();
    expect(screen.getByText(/Source links under answers that used retrieved knowledge/)).toBeTruthy();
    expect(screen.getByText(/Token-by-token delivery where the channel supports it/)).toBeTruthy();
    expect(screen.getByText(/Concise fits one screen; detailed adds structure on ask/)).toBeTruthy();
  });

  it('renders the four channel rows with helpers and the buffered footnote', () => {
    shell();
    expect(screen.getByText('Web chat')).toBeTruthy();
    expect(screen.getByText(/Renders markdown, streams tokens/)).toBeTruthy();
    expect(screen.getByText(/Always buffered; the format override is honored/)).toBeTruthy();
    expect(screen.getByText(/Spoken answers; always buffered, the format override is honored/)).toBeTruthy();
    expect(screen.getByText(/Async digest; markdown kept, buffered/)).toBeTruthy();
    expect(
      screen.getByText(/Buffered channels compose the full answer first — streaming settings never apply/),
    ).toBeTruthy();
  });

  it('switching to plain text updates the policy state and header summary', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: 'Plain text' }));
    });
    // The header summary reflects the full resolved policy (defaults filled).
    expect(screen.getByText(/Plain text · citations on · inline · streaming Auto · Balanced/)).toBeTruthy();
    expect(selectedTab('Output format')).toBe('Plain text');
  });

  it('a channel format override is reflected in the UI and marked overridden', async () => {
    shell();
    // SMS format: MD -> Plain
    const smsFormat = screen.getByRole('tablist', { name: 'SMS format' });
    await act(async () => {
      fireEvent.click(smsFormat.querySelectorAll('[role="tab"]')[1]!);
    });
    // The SMS row now shows Plain as selected; Web chat still shows Markdown.
    expect(smsFormat.querySelector('[aria-selected="true"]')?.textContent).toBe('Plain');
    const webchatFormat = screen.getByRole('tablist', { name: 'Web chat format' });
    expect(webchatFormat.querySelector('[aria-selected="true"]')?.textContent).toBe('MD');
  });

  it('generation overrides toggle reveals reasoning effort and top-p, Edit in Model navigates', async () => {
    shell();
    // Inheriting state: chips + Edit in Model link.
    expect(screen.getByText(/reasoning · Medium/)).toBeTruthy();
    expect(screen.getByText(/top-p · 0.95/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByText('Edit in Model'));
    });
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({ search: expect.objectContaining({ slot: 'model' }) }),
    );
    // Flip the toggle open: the override controls appear.
    await act(async () => {
      fireEvent.click(screen.getByRole('switch'));
    });
    expect(screen.getByRole('tablist', { name: 'Reasoning effort' })).toBeTruthy();
    expect(screen.getByLabelText('Top-p (0.05 to 1)')).toBeTruthy();
    // The card icon flips to the warning tone when overrides are active.
    const card = screen.getByRole('tablist', { name: 'Reasoning effort' }).closest('div');
    expect(card).toBeTruthy();
  });

  it('top-p holds raw text while typing and commits the clamped value on blur', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('switch'));
    });
    const input = screen.getByLabelText('Top-p (0.05 to 1)') as HTMLInputElement;
    // No stored top_p: the field starts empty (the chip shows the inherited 0.95).
    expect(input.value).toBe('');
    // Intermediate "0." is held as raw text, not parsed.
    await act(async () => {
      fireEvent.change(input, { target: { value: '0.' } });
    });
    expect(input.value).toBe('0.');
    // Blur commits: "0." parses to 0, floors to the 0.05 minimum.
    await act(async () => {
      fireEvent.blur(input);
    });
    expect(input.value).toBe('0.05');
    // "0.93" snaps to the 0.05 grid → 0.95.
    await act(async () => {
      fireEvent.change(input, { target: { value: '0.93' } });
      fireEvent.blur(input);
    });
    expect(input.value).toBe('0.95');
    // Non-numeric input is rejected: the draft reverts to the committed value.
    await act(async () => {
      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.blur(input);
    });
    expect(input.value).toBe('0.95');
    // Clearing the field commits undefined — the input empties.
    await act(async () => {
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.blur(input);
    });
    expect(input.value).toBe('');
  });

  it('channel streaming offers Auto and clears the override', async () => {
    shell();
    const streaming = screen.getByRole('tablist', { name: 'Email streaming' });
    // Auto is selected by default (no override stored).
    expect(streaming).toBeTruthy();
    const autoTab = within(streaming).getByRole('tab', { name: 'Auto' });
    expect(autoTab.getAttribute('aria-selected')).toBe('true');
    // Setting Off stores the override; back to Auto clears it.
    await act(async () => {
      fireEvent.click(within(streaming).getByRole('tab', { name: 'Off' }));
    });
    expect(within(streaming).getByRole('tab', { name: 'Off' }).getAttribute('aria-selected')).toBe('true');
    await act(async () => {
      fireEvent.click(within(streaming).getByRole('tab', { name: 'Auto' }));
    });
    expect(within(streaming).getByRole('tab', { name: 'Auto' }).getAttribute('aria-selected')).toBe('true');
  });

  it('shows the legacy blocker with Remove field action', async () => {
    const def = definitionWithPolicy(undefined);
    def.model_params = { ...def.model_params, max_context_tokens: 8000 };
    shell({ definition: def });
    expect(screen.getByText('Legacy field blocks saving')).toBeTruthy();
    expect(screen.getByText(/no longer supported by the current plan/)).toBeTruthy();
    // The rail surfaces the save blocker.
    expect(screen.getByText('Save blocker')).toBeTruthy();
    // Remove field is an inline button (no modal) — one in the card, one in the rail.
    expect(screen.getAllByRole('button', { name: 'Remove field' })).toHaveLength(2);
  });

  it('does not arm the legacy blocker for the engine-accepted context_policy field', () => {
    // defaultConsumer() carries context_policy.max_context_tokens: 32000 —
    // the field's current, engine-accepted home. It must never block saving.
    shell({ definition: definitionWithPolicy(undefined) });
    expect(screen.queryByText('Legacy field blocks saving')).toBeNull();
    expect(screen.queryByText('Save blocker')).toBeNull();
  });

  it('renders read-only static rows with the role explanation for viewers', () => {
    shell({
      canAuthor: false,
      definition: definitionWithPolicy({
        output_format: 'plain',
        citations_enabled: false,
        streaming: 'off',
        citations_style: 'footnotes',
        length: 'detailed',
      }),
    });
    expect(screen.getByText(/needs an owner, admin, or developer/)).toBeTruthy();
    expect(screen.queryByRole('tablist', { name: 'Output format' })).toBeNull();
  });
});
