// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import toast from 'react-hot-toast';
import { MemorySection } from './MemorySection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const saveMutate = vi.fn();
const updateMutate = vi.fn();

vi.mock('react-hot-toast', () => {
  const fn = vi.fn() as never;
  const success = vi.fn() as never;
  const error = vi.fn() as never;
  return { default: Object.assign(fn, { success, error }) };
});

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
  return { ...def, instructions: '## Role\nR.\n', context_policy: { ...def.context_policy, ...context } };
}

const FRESH = definitionWith({ memory_scope: 'user', history_limit: 30 });

function shell(props?: Partial<React.ComponentProps<typeof MemorySection>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemorySection
          assistantId="agent-main"
          definition={FRESH}
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
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('MemorySection', () => {
  it('renders the 4-option scope control with User default, history, and org defaults', () => {
    shell();
    const group = screen.getByRole('group', { name: 'Memory scope' });
    expect(group.querySelectorAll('button')).toHaveLength(4);
    expect(screen.getByText(/never visible across accounts/)).toBeTruthy();
    expect(screen.getByText(/stored, not served/)).toBeTruthy();
    expect(screen.getByText(/rolling summary/)).toBeTruthy();
    expect(screen.getByText(/PII scrubbed before embedding/)).toBeTruthy();
  });

  it('switching scope to none autosaves the context policy', async () => {
    shell();
    const group = screen.getByRole('group', { name: 'Memory scope' });
    await act(async () => {
      fireEvent.click(group.querySelectorAll('button')[3] as HTMLElement);
    });
    expect(screen.getByText(/No memories surface/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.context_policy.memory_scope).toBe('none');
  });

  it('steps history within 1–100 and clamps typed overflow', async () => {
    shell();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'More history messages' }));
    });
    expect(screen.getByDisplayValue('31')).toBeTruthy();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('History limit in messages'), { target: { value: '500' } });
    });
    expect(screen.getByDisplayValue('100')).toBeTruthy();
  });

  it('previews assistant and org rows read-only, never user rows', () => {
    shell();
    expect(screen.getByText(/Assistant fact one/)).toBeTruthy();
    expect(screen.getByText(/Org ships Fridays/)).toBeTruthy();
    expect(screen.getByText(/no preview here/)).toBeTruthy();
  });

  it('renders read-only with the role explanation for viewers', () => {
    shell({ canAuthor: false });
    expect(screen.getByText(/needs an owner, admin, or developer/)).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Memory scope' })).toBeNull();
  });
});
