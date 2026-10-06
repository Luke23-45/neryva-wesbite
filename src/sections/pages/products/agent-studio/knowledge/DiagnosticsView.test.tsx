// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import { DiagnosticsView } from './DiagnosticsView';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const mockMutate = vi.fn();
let mockData: unknown = null;

vi.mock('@hooks/studio/useKnowledgeLibrary', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useKnowledgeLibrary')>();
  return {
    ...actual,
    useExplainRetrieval: () => ({
      mutate: mockMutate,
      get data() { return mockData; },
      isPending: false,
      isError: false,
    }),
  };
});

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useParams: () => ({ docId: 'doc-test' }),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

vi.mock('./SectionBackRow', () => ({
  SectionBackRow: ({ children, to, label }: { children?: React.ReactNode; to: string; label: string }) => (
    <a href={to}>{label}{children}</a>
  ),
}));

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <DiagnosticsView />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('DiagnosticsView', () => {
  it('renders query input and diagnose button', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Diagnostics')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('Enter the query to diagnose…')).toBeInTheDocument();
    expect(screen.getByText('Diagnose')).toBeInTheDocument();
  });

  it('calls explain on diagnose', async () => {
    renderView();
    const input = screen.getByPlaceholderText('Enter the query to diagnose…');
    fireEvent.change(input, { target: { value: 'refund policy' } });
    fireEvent.click(screen.getByText('Diagnose'));
    expect(mockMutate).toHaveBeenCalledWith({
      query: 'refund policy',
      documentId: 'doc-test',
    });
  });

  it('shows empty state before diagnosis', async () => {
    renderView();
    await waitFor(() => {
      expect(screen.getByText('Run a diagnosis')).toBeInTheDocument();
    });
  });
});
