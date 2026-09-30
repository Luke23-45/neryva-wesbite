// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { MemorySection } from './MemorySection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const ASSISTANT_ROWS = [{ id: 'm-a1', content: 'Assistant fact one', scopeType: 'assistant', visibility: 'private' }];
const ORG_ROWS = [{ id: 'm-o1', content: 'Org ships Fridays', scopeType: 'organization', visibility: 'organization' }];

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return {
    ...actual,
    useMemories: (scopeType?: string) => ({
      data: scopeType === 'assistant' ? ASSISTANT_ROWS : ORG_ROWS,
      isPending: false,
      isError: false,
    }),
    useOrgMemoryPolicy: () => ({ policy: { scrub: 'redact', ttlSeconds: 2_592_000 }, isPending: false, isError: false }),
  };
});

function definitionWith(context: Partial<AgentDefinition['context_policy']>): AgentDefinition {
  const def = defaultConsumer();
  return { ...def, instructions: '## Role\\nR.\\n', context_policy: { ...def.context_policy, ...context } };
}

const FRESH = definitionWith({ memory_scope: 'user', history_limit: 20 });

function shell(props?: Partial<React.ComponentProps<typeof MemorySection>>) {
  const onDirtyChange = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemorySection
          assistantId="agent-main"
          definition={FRESH}
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
  return { onDirtyChange };
}

describe('MemorySection', () => {
  it('reports scope, history, and context length read-only and points at the Context node', () => {
    shell();
    // No editing controls: scope pills, the history stepper, and the
    // context-length control live in the Context node now.
    expect(screen.queryByRole('group', { name: 'Memory scope' })).toBeNull();
    expect(screen.queryByLabelText('History limit in messages')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Context length presets' })).toBeNull();
    expect(screen.getByText(/Set in the Context section/)).toBeTruthy();
    expect(screen.getByText(/20 messages/)).toBeTruthy();
    // Context-owned (D-N1): the token budget is reported read-only here.
    expect(screen.getByText(/32K tokens per run/)).toBeTruthy();
    expect(screen.getByText(/PII scrubbed before embedding/)).toBeTruthy();
  });

  it('reports a custom context length read-only', () => {
    shell({ definition: definitionWith({ max_context_tokens: 64000 }) });
    expect(screen.getByText(/64K tokens per run/)).toBeTruthy();
  });

  it('always reports clean — nothing here writes', () => {
    const { onDirtyChange } = shell({ definition: definitionWith({ memory_scope: 'none' }) });
    expect(onDirtyChange).toHaveBeenCalledWith(false);
    expect(onDirtyChange).not.toHaveBeenCalledWith(true);
  });

  it('previews assistant and org rows read-only, never user rows', () => {
    // A4-23: preview shows only when the policy scope can actually serve
    // library rows — 'assistant' scope previews assistant rows.
    const { unmount } = render(
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <MemorySection
            assistantId="agent-main"
            definition={definitionWith({ memory_scope: 'assistant', history_limit: 20 })}
            versionId="v1"
            versionHash="h1"
            isDraft
            canAuthor
            onDirtyChange={() => undefined}
            saveSignal={0}
          />
        </QueryClientProvider>
      </ThemeProvider>,
    );
    expect(screen.getByText(/Assistant fact one/)).toBeTruthy();
    expect(screen.queryByText(/Org ships Fridays/)).toBeNull();
    unmount();
    // 'organization' scope previews org rows.
    render(
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <MemorySection
            assistantId="agent-main"
            definition={definitionWith({ memory_scope: 'org', history_limit: 20 })}
            versionId="v1"
            versionHash="h1"
            isDraft
            canAuthor
            onDirtyChange={() => undefined}
            saveSignal={0}
          />
        </QueryClientProvider>
      </ThemeProvider>,
    );
    expect(screen.getByText(/Org ships Fridays/)).toBeTruthy();
    expect(screen.queryByText(/Assistant fact one/)).toBeNull();
  });

  it('shows the denied-capability note for viewers', () => {
    shell({ canAuthor: false });
    expect(screen.getByText(/needs an owner, admin, or developer/)).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Memory scope' })).toBeNull();
  });

  it('renders the loading state without a definition', () => {
    shell({ definition: null });
    expect(screen.getByText(/Loading the draft/)).toBeTruthy();
  });
});
