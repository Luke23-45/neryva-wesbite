// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { defaultConsumer } from '@lib/engine/agent-payload';
import toast from 'react-hot-toast';
import { KnowledgeSection } from './KnowledgeSection';
import type { AgentDefinition } from '@hooks/studio/useAgentAuthoring';

const saveMutate = vi.fn();
const updateMutate = vi.fn();
const attachMock = vi.fn();
const attachTextMock = vi.fn();
const renameMutate = vi.fn();
const syncMutate = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const HEALTH = {
  degraded: false,
  pins: [
    { sourceSlug: 'refund-policy', resolved: true, documentId: 'd1', state: 'ready', embeddingComplete: true },
    { sourceSlug: 'faq-2026', resolved: true, documentId: 'd2', state: 'ready', embeddingComplete: true },
  ],
};

const DOCS = [
  { id: 'd1', sourceSlug: 'refund-policy', title: 'Refund policy 2026', state: 'ready', updatedAt: '2026-09-16T10:00:00Z', latestVersion: 3 },
  { id: 'd2', sourceSlug: 'faq-2026', title: 'FAQ 2026', state: 'ready', updatedAt: '2026-09-16T10:00:00Z', latestVersion: 1 },
];

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useSaveDraftVersion: () => ({ mutate: saveMutate, isPending: false }),
    useUpdateDraftVersion: () => ({ mutate: updateMutate, isPending: false }),
    useKnowledgeHealth: () => ({ data: HEALTH, isPending: false, isError: false }),
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

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return {
    ...actual,
    useDocuments: () => ({ data: DOCS, isPending: false, isError: false }),
    useRenameDocumentSlug: () => ({ mutate: renameMutate, isPending: false }),
  };
});

vi.mock('@hooks/studio/useAttachmentUpload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAttachmentUpload')>();
  return {
    ...actual,
    useAttachmentUpload: () => ({ uploads: [], attach: attachMock, attachText: attachTextMock, reset: vi.fn() }),
  };
});

vi.mock('@hooks/studio/useSetupConnectors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupConnectors')>();
  return {
    ...actual,
    useConnectors: () => ({ data: [], isPending: false, isError: false }),
    useSyncConnector: () => ({ mutate: syncMutate, isPending: false }),
  };
});

function definitionWith(pins: string[]): AgentDefinition {
  const def = defaultConsumer();
  return { ...def, instructions: '## Role\nR.\n', context_policy: { ...def.context_policy, knowledge_sources: pins } };
}

function shell(props?: Partial<React.ComponentProps<typeof KnowledgeSection>>) {
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <KnowledgeSection
          assistantId="agent-main"
          definition={definitionWith(['refund-policy', 'faq-2026'])}
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
  attachMock.mockReset();
  attachTextMock.mockReset();
  renameMutate.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('KnowledgeSection pins', () => {
  it('renders retrieval-off deliberate copy and pin rows with coverage', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/answers from instructions and model only/)).toBeTruthy();
    expect(screen.getByText('refund-policy')).toBeTruthy();
    expect(screen.getAllByText(/ready-for-retrieval/).length).toBeGreaterThanOrEqual(1);
  });

  it('unmaps a pin and autosaves the draft without it', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getAllByText('Unmap')[0]);
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.context_policy.knowledge_sources).toEqual(['faq-2026']);
  });

  it('flags unresolved pins with the publish consequence', async () => {
    await act(async () => {
      shell({ definition: definitionWith(['ghost-slug']) });
    });
    expect(screen.getByText(/Unresolved pin — publish refuses/)).toBeTruthy();
  });

  it('holds autosave past the 16-pin contract cap with a named message', async () => {
    vi.useFakeTimers();
    const pins = Array.from({ length: 17 }, (_, i) => `pin-${i}`);
    await act(async () => {
      shell({ definition: definitionWith(pins) });
    });
    expect(screen.getByText(/At most 16 pinned sources/)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).not.toHaveBeenCalled();
  });
});

describe('KnowledgeSection policy', () => {
  it('steps max results and saves the policy', async () => {
    vi.useFakeTimers();
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByLabelText('Increase max results'));
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(updateMutate).toHaveBeenCalledTimes(1);
    const payload = updateMutate.mock.calls[0][0] as { definition: AgentDefinition };
    expect(payload.definition.knowledge_policy?.max_results).toBe(6);
  });
});

describe('KnowledgeSection paste', () => {
  it('guards JSON with a named error and never calls attach', async () => {
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Paste' }));
    fireEvent.change(screen.getByPlaceholderText('Paste the source text…'), { target: { value: '{broken' } });
    fireEvent.change(screen.getByPlaceholderText('kebab-case, 3–64 chars'), { target: { value: 'pasted-policy' } });
    // Default format is Markdown — switch to JSON to trip the guard.
    fireEvent.click(screen.getByText('JSON'));
    fireEvent.click(screen.getByText('Ingest paste'));
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(expect.stringMatching(/valid JSON/i));
    expect(attachTextMock).not.toHaveBeenCalled();
  });

  it('ingests valid paste through the shared session flow', async () => {
    attachTextMock.mockResolvedValueOnce('session-1');
    await act(async () => {
      shell();
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Paste' }));
    fireEvent.click(screen.getByText('JSON'));
    fireEvent.change(screen.getByPlaceholderText(/"policy": "refunds within 30 days/), { target: { value: '{"policy": "30 days"}' } });
    fireEvent.change(screen.getByPlaceholderText('kebab-case, 3–64 chars'), { target: { value: 'pasted-policy' } });
    fireEvent.click(screen.getByText('Ingest paste'));
    await act(async () => undefined);
    expect(attachTextMock).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'pasted-policy', mediaType: 'application/json' }),
    );
  });
});

describe('KnowledgeSection roles', () => {
  it('renders viewers read-only with the role explanation', async () => {
    await act(async () => {
      shell({ canAuthor: false });
    });
    expect(screen.getByText(/Knowledge editing needs/)).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Upload' })).toBeNull();
  });
});
