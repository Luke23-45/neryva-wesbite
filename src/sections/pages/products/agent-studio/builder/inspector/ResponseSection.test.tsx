// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { ResponseSection } from './ResponseSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const updateMutate = vi.fn();

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

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
  updateMutate.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ResponseSection', () => {
  it('treats an absent policy as engine defaults (markdown, citations on, streaming auto)', () => {
    shell();
    expect(screen.getByRole('button', { name: 'Markdown' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Plain text' }).getAttribute('aria-pressed')).toBe('false');
    const citations = screen.getByRole('group', { name: 'Citations' });
    expect(citations.querySelectorAll('button[aria-pressed="true"]')[0]?.textContent).toBe('On');
    const streaming = screen.getByRole('group', { name: 'Streaming' });
    expect(streaming.querySelectorAll('button[aria-pressed="true"]')[0]?.textContent).toBe('Auto');
    expect(screen.getByText(/Markdown · citations on · streaming Auto/)).toBeTruthy();
  });

  it('renders the honest whispers for every control', () => {
    shell();
    expect(screen.getByText(/Plain text strips formatting — use it for SMS\/voice-style channels/)).toBeTruthy();
    expect(screen.getByText(/Off hides source links even when the agent used retrieved knowledge/)).toBeTruthy();
    expect(screen.getByText(/Auto lets each channel decide; some channels always buffer/)).toBeTruthy();
  });

  it('switching to plain text writes the FULL policy object on autosave', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Plain text' }));
    });
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    // The render triple rides response_policy; the Advanced pair lives in
    // model_params (the engine's responsePolicySchema is strict).
    expect(sent.definition.response_policy).toEqual({
      output_format: 'plain',
      citations_enabled: true,
      streaming: 'auto',
    });
    expect(sent.definition.response_policy).not.toHaveProperty('reasoning_effort');
    expect(sent.definition.response_policy).not.toHaveProperty('top_p');
    expect(sent.definition.model_params.reasoning_effort).toBeUndefined();
    expect(sent.definition.model_params.top_p).toBeUndefined();
  });

  it('advanced edits reasoning effort and top-p with honest whispers', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Advanced/ }));
    });
    // Engine enum: minimal | low | medium | high; Default = absent.
    expect(screen.getByRole('button', { name: 'Minimal' }).getAttribute('aria-pressed')).toBe('false');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'High' }));
    });
    expect(screen.getByText(/Only meaningful when the model supports reasoning/)).toBeTruthy();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Top-p (0 to 1)'), { target: { value: '0.9' } });
    });
    expect(screen.getByText(/Lower = more focused, higher = more varied/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    // The Advanced pair writes model_params, never response_policy.
    expect(sent.definition.model_params).toMatchObject({ reasoning_effort: 'high', top_p: 0.9 });
    expect(sent.definition.response_policy).toEqual({
      output_format: 'markdown',
      citations_enabled: true,
      streaming: 'auto',
    });
    expect(sent.definition.response_policy).not.toHaveProperty('reasoning_effort');
    expect(sent.definition.response_policy).not.toHaveProperty('top_p');
  });

  it('renders read-only static rows with the role explanation for viewers', () => {
    shell({
      canAuthor: false,
      definition: definitionWithPolicy({ output_format: 'plain', citations_enabled: false, streaming: 'off' }),
    });
    expect(screen.getByText(/needs an owner, admin, or developer/)).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Output format' })).toBeNull();
  });
});
