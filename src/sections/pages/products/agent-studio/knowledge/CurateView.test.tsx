// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { CurateView } from './CurateView';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@hooks/studio/useKnowledgeLibrary', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useKnowledgeLibrary')>();
  return {
    ...actual,
    useDocumentProvenance: () => ({
      data: {
        documentId: 'doc-test',
        origin: 'upload',
        provenance: { source: 'test' },
        ownerId: null,
        reviewerId: null,
        reviewedAt: null,
        createdAt: new Date().toISOString(),
        sourceArtifactId: 'artifact-1',
      },
      isLoading: false,
      isError: false,
    }),
    useCurateDocument: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
    useSetDocumentOwner: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  };
});

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return {
    ...actual,
    useDocuments: () => ({
      data: [{ id: 'doc-test', curationStatus: 'unreviewed' }],
      isLoading: false,
    }),
  };
});

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useParams: () => ({ docId: 'doc-test' }),
  };
});

vi.mock('./SectionBackRow', () => ({
  SectionBackRow: ({ label }: { label: string }) => <a href="#">{label}</a>,
}));

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <CurateView />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('CurateView', () => {
  it('renders current status and actions', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Curate document')).toBeInTheDocument();
    });
    expect(screen.getByText('Current status')).toBeInTheDocument();
    expect(screen.getByText('Set curation')).toBeInTheDocument();
    expect(screen.getByText('Curated')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('shows provenance section', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Provenance')).toBeInTheDocument();
    });
    expect(screen.getByText('Provenance JSON')).toBeInTheDocument();
  });
});
