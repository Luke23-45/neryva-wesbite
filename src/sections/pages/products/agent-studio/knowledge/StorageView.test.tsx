// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { StorageView } from './StorageView';

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
    useStorageMeter: () => ({
      data: {
        maxBytes: 10737418240,
        committedBytes: 5368709120,
        reservedBytes: 0,
        availableBytes: 5368709120,
        warnAtPercent: 80,
        byState: [
          { state: 'ready', bytes: 5000000000, count: 10 },
          { state: 'processing', bytes: 368709120, count: 2 },
        ],
        byOrigin: [{ origin: 'upload', bytes: 5368709120, count: 12 }],
        topDocuments: [
          { documentId: 'doc-1', title: 'Test Doc', bytes: 1000000 },
        ],
        counts: { artifacts: 12, documents: 12, versions: 15, embeddings: 100 },
      },
      isLoading: false,
      isError: false,
    }),
  };
});

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <StorageView />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('StorageView', () => {
  it('renders the storage meter with used/quota', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Storage')).toBeInTheDocument();
    });
    expect(screen.getByText('Used')).toBeInTheDocument();
    expect(screen.getByText('Quota')).toBeInTheDocument();
  });

  it('shows breakdowns by state and origin', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('By state')).toBeInTheDocument();
    });
    expect(screen.getByText('By origin')).toBeInTheDocument();
    expect(screen.getByText('Top 20 documents')).toBeInTheDocument();
  });
});
