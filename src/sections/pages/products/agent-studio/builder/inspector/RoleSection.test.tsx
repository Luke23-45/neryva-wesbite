// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { RoleSection } from './RoleSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const updateMutate = vi.fn();
const onDirtyChange = vi.fn();

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

function definitionWith(role: AgentDefinition['role_policy']): AgentDefinition {
  const def = defaultConsumer();
  return { ...def, role_policy: role };
}

function shell(props?: Partial<React.ComponentProps<typeof RoleSection>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <RoleSection
          assistantId="agent-main"
          definition={definitionWith(undefined)}
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
}

beforeEach(() => {
  updateMutate.mockReset();
  onDirtyChange.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

async function flushAutosave() {
  await act(async () => {
    vi.advanceTimersByTime(8000);
  });
}

describe('RoleSection', () => {
  it('renders all six optional fields with honest empty state — no invented persona', () => {
    shell();
    expect(screen.getByLabelText('Role')).toHaveValue('');
    expect(screen.getByLabelText('Goal')).toHaveValue('');
    expect(screen.getByLabelText('Communication style')).toHaveValue('');
    expect(screen.getByLabelText('Add trait')).toBeInTheDocument();
    expect(screen.getByLabelText('Add knowledge area')).toBeInTheDocument();
    expect(screen.getByLabelText('Add prohibited topic')).toBeInTheDocument();
    expect(screen.getByText('0/10')).toBeInTheDocument();
    expect(screen.getAllByText('0/20')).toHaveLength(2);
    // No fake persona, no preview panel.
    expect(screen.queryByText(/persona/i, { selector: 'h2' })).toBeNull();
  });

  it('loads a stored persona into the fields', () => {
    shell({
      definition: definitionWith({
        role: 'Senior support engineer',
        goal: 'Resolve tickets in one touch.',
        traits: ['calm', 'precise'],
        communication_style: 'Short paragraphs.',
        knowledge_areas: ['billing'],
        prohibited_topics: ['politics'],
      }),
    });
    expect(screen.getByLabelText('Role')).toHaveValue('Senior support engineer');
    expect(screen.getByLabelText('Goal')).toHaveValue('Resolve tickets in one touch.');
    expect(screen.getByLabelText('Communication style')).toHaveValue('Short paragraphs.');
    expect(screen.getByText('calm')).toBeInTheDocument();
    expect(screen.getByText('precise')).toBeInTheDocument();
    expect(screen.getByText('billing')).toBeInTheDocument();
    expect(screen.getByText('politics')).toBeInTheDocument();
  });

  it('autosaves an edited role through the draft-version hook', async () => {
    shell();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'Support concierge' } });
    });
    await flushAutosave();
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.role_policy).toEqual({ role: 'Support concierge' });
  });

  it('adds tags with Enter, removes them with the chip button, never duplicates', async () => {
    shell();
    const input = screen.getByLabelText('Add trait');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'calm' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    expect(screen.getByText('calm')).toBeInTheDocument();
    expect(screen.getByText('1/10')).toBeInTheDocument();
    // Duplicate (with surrounding whitespace) is ignored.
    await act(async () => {
      fireEvent.change(input, { target: { value: ' calm ' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    expect(screen.getAllByText('calm')).toHaveLength(1);
    expect(screen.getByText('1/10')).toBeInTheDocument();
    // Remove via the chip's labeled button.
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove trait calm' }));
    });
    expect(screen.queryByText('calm')).not.toBeInTheDocument();
  });

  it('enforces the tag count cap and trims before storing', async () => {
    shell();
    const input = screen.getByLabelText('Add prohibited topic');
    for (let i = 0; i < 20; i += 1) {
      await act(async () => {
        fireEvent.change(input, { target: { value: `topic ${i}` } });
        fireEvent.keyDown(input, { key: 'Enter' });
      });
    }
    expect(screen.getByText('20/20')).toBeInTheDocument();
    await act(async () => {
      fireEvent.change(input, { target: { value: 'one more' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });
    expect(screen.queryByText('one more')).not.toBeInTheDocument();
    // Trimmed before storing.
    expect(screen.getByText('topic 0')).toBeInTheDocument();
  });

  it('holds the autosave when a member exceeds its cap', async () => {
    shell();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'x'.repeat(201) } });
    });
    await flushAutosave();
    expect(updateMutate).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('at most 200 characters');
  });

  it('clearing every field removes role_policy instead of persisting an empty object', async () => {
    shell({
      definition: definitionWith({ role: 'Support concierge', traits: ['calm'] }),
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Role'), { target: { value: '' } });
      fireEvent.click(screen.getByRole('button', { name: 'Remove trait calm' }));
    });
    await flushAutosave();
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.role_policy).toBeUndefined();
  });

  it('Escape blurs the focused field instead of stranding input', async () => {
    shell();
    const input = screen.getByLabelText('Role') as HTMLInputElement;
    input.focus();
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Escape' });
    });
    expect(document.activeElement).not.toBe(input);
  });

  it('read-only viewers see an honest empty state or the stored values only', () => {
    const { unmount } = shell({ canAuthor: false });
    expect(screen.getByText(/No persona configured/)).toBeInTheDocument();
    unmount();
    shell({
      canAuthor: false,
      definition: definitionWith({ role: 'Support concierge', traits: ['calm'] }),
    });
    expect(screen.getByText('Support concierge')).toBeInTheDocument();
    expect(screen.getByText('calm')).toBeInTheDocument();
    expect(screen.queryByLabelText('Role')).not.toBeInTheDocument();
  });

  it('reports dirty state to the parent guard', async () => {
    shell();
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Goal'), { target: { value: 'Help users.' } });
    });
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });
});
