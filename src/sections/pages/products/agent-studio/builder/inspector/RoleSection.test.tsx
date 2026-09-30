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

function definitionWith(role: AgentDefinition['role']): AgentDefinition {
  const def = defaultConsumer();
  return { ...def, role };
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

/** The editor pushes its draft into the section every 2s. */
async function pushDraft() {
  await act(async () => {
    vi.advanceTimersByTime(2500);
  });
}

/** Open a collapsed card's focused editor. The card shares its accessible
 *  name with the pencil icon inside it — the card itself is first. */
function openCard(name: string) {
  fireEvent.click(screen.getAllByRole('button', { name: `Edit ${name}` })[0]);
}

/** The editor's non-destructive back link. */
function backToPage() {
  fireEvent.click(screen.getByRole('button', { name: 'Back to Role' }));
}

function saveAndClose() {
  fireEvent.click(screen.getByRole('button', { name: 'Save & close' }));
}

/** Switch the open editor's surface (Plain / Markdown / JSON). */
function setSurface(name: 'Plain' | 'Markdown' | 'JSON') {
  fireEvent.click(screen.getByRole('tab', { name }));
}

describe('RoleSection', () => {
  it('renders all six optional fields as cards with honest empty state — no invented persona', () => {
    shell();
    for (const name of ['Role', 'Goal', 'Traits', 'Communication style', 'Knowledge areas', 'Avoid']) {
      expect(screen.getByRole('button', { name: `Edit ${name}` })).toBeInTheDocument();
    }
    expect(screen.getByText('No role yet')).toBeInTheDocument();
    // No fake persona anywhere on the page.
    expect(screen.queryByText(/support concierge/i)).toBeNull();
  });

  it('loads a stored modal role into the card previews', () => {
    shell({
      definition: definitionWith({
        role: { mode: 'raw', content: 'Senior support engineer' },
        goal: { content: 'Resolve tickets in one touch.' },
        traits: { content: '["calm", "precise"]' },
        communicationStyle: { mode: 'markdown', content: 'Short paragraphs.' },
        knowledgeAreas: { content: '["billing"]' },
        prohibitedTopics: { content: '["politics"]' },
      }),
    });
    expect(screen.getByText('Senior support engineer')).toBeInTheDocument();
    expect(screen.getByText('Resolve tickets in one touch.')).toBeInTheDocument();
    expect(screen.getByText('calm')).toBeInTheDocument();
    expect(screen.getByText('precise')).toBeInTheDocument();
    expect(screen.getByText('billing')).toBeInTheDocument();
    expect(screen.getByText('politics')).toBeInTheDocument();
    // Stored modes are honored — the editor opens on the stored surface.
    openCard('Communication style');
    expect(screen.getByRole('tab', { name: 'Markdown' })).toHaveAttribute('aria-selected', 'true');
  });

  it('autosaves an edited role through the draft-version hook', async () => {
    shell();
    openCard('Role');
    fireEvent.change(screen.getByLabelText('Role content (plain text)'), {
      target: { value: 'Support concierge' },
    });
    saveAndClose();
    await flushAutosave();
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.role).toEqual({ role: { mode: 'raw', content: 'Support concierge' } });
  });

  it('edits list fields as one-per-line text on the Plain surface', async () => {
    shell();
    openCard('Traits');
    setSurface('Plain');
    fireEvent.change(screen.getByLabelText('Traits content (plain text)'), {
      target: { value: 'calm\nprecise' },
    });
    saveAndClose();
    await flushAutosave();
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.role).toEqual({ traits: { mode: 'raw', content: 'calm\nprecise' } });
  });

  it('holds the autosave when a list exceeds its item cap', async () => {
    shell();
    openCard('Avoid');
    setSurface('Plain');
    const items = Array.from({ length: 21 }, (_, i) => `topic ${i}`).join('\n');
    fireEvent.change(screen.getByLabelText('Avoid content (plain text)'), { target: { value: items } });
    await pushDraft();
    backToPage();
    expect(screen.getByRole('alert')).toHaveTextContent('at most 20 items');
    await flushAutosave();
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('holds the autosave when a field exceeds its cap', async () => {
    shell();
    openCard('Role');
    fireEvent.change(screen.getByLabelText('Role content (plain text)'), {
      target: { value: 'x'.repeat(201) },
    });
    // Save & close is fail-closed on the cap, so push the draft and read the
    // section-level hold.
    await pushDraft();
    backToPage();
    expect(screen.getByRole('alert')).toHaveTextContent('at most 200 characters');
    await flushAutosave();
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('holds the autosave when a field is invalid in its selected mode', async () => {
    shell();
    openCard('Role');
    setSurface('JSON');
    fireEvent.change(screen.getByLabelText('JSON content'), { target: { value: 'not json' } });
    await pushDraft();
    backToPage();
    expect(screen.getByRole('alert')).toHaveTextContent('not valid in its selected mode');
    await flushAutosave();
    expect(updateMutate).not.toHaveBeenCalled();
    // Fixing the JSON releases the hold.
    openCard('Role');
    fireEvent.change(screen.getByLabelText('JSON content'), { target: { value: '"Support concierge"' } });
    saveAndClose();
    await flushAutosave();
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.role).toEqual({ role: { mode: 'json', content: '"Support concierge"' } });
  });

  it('surfaces malformed JSON in a list field instead of silently overwriting it', async () => {
    shell({
      definition: definitionWith({
        traits: { mode: 'json', content: '["calm", oops]' },
      }),
    });
    // The card names the problem; the section hold names it too.
    expect(screen.getByText(/invalid — edit to fix/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('not valid in its selected mode');
    // The editor opens on the stored text untouched.
    openCard('Traits');
    expect(screen.getByLabelText('JSON content')).toHaveValue('["calm", oops]');
    // Fixing the JSON brings the parsed list back and releases the save.
    fireEvent.change(screen.getByLabelText('JSON content'), { target: { value: '["calm", "precise"]' } });
    saveAndClose();
    await flushAutosave();
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.role).toEqual({ traits: { mode: 'json', content: '["calm", "precise"]' } });
    expect(screen.getByText('calm')).toBeInTheDocument();
    expect(screen.getByText('precise')).toBeInTheDocument();
  });

  it('clearing every field removes role instead of persisting an empty object', async () => {
    shell({
      definition: definitionWith({
        role: { content: 'Support concierge' },
        traits: { content: '["calm"]' },
      }),
    });
    openCard('Role');
    fireEvent.change(screen.getByLabelText('Role content (plain text)'), { target: { value: '' } });
    saveAndClose();
    openCard('Traits');
    setSurface('Plain');
    fireEvent.change(screen.getByLabelText('Traits content (plain text)'), { target: { value: '' } });
    saveAndClose();
    await flushAutosave();
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const sent = vi.mocked(updateMutate).mock.calls[0]?.[0] as { definition: AgentDefinition };
    expect(sent.definition.role).toBeUndefined();
  });

  it('Escape in the editor returns to the page without saving', async () => {
    shell();
    openCard('Role');
    const area = screen.getByLabelText('Role content (plain text)');
    await act(async () => {
      fireEvent.keyDown(area, { key: 'Escape' });
    });
    // The editor closed — the card is back and nothing was pushed.
    expect(screen.getByRole('button', { name: 'Edit Role' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Role content (plain text)')).toBeNull();
  });

  it('read-only viewers see an honest empty state or the stored values only', () => {
    const { unmount } = shell({ canAuthor: false });
    expect(screen.getByText(/No persona configured/)).toBeInTheDocument();
    unmount();
    shell({
      canAuthor: false,
      definition: definitionWith({
        role: { mode: 'json', content: '"Support concierge"' },
        traits: { mode: 'raw', content: 'calm\nprecise' },
      }),
    });
    // Parsed values render regardless of the stored mode.
    expect(screen.getByText('Support concierge')).toBeInTheDocument();
    expect(screen.getByText('calm')).toBeInTheDocument();
    expect(screen.getByText('precise')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Role' })).not.toBeInTheDocument();
  });

  it('reports dirty state to the parent guard once the editor draft pushes', async () => {
    shell();
    openCard('Goal');
    fireEvent.change(screen.getByLabelText('Goal content (plain text)'), { target: { value: 'Help users.' } });
    await pushDraft();
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  });
});
