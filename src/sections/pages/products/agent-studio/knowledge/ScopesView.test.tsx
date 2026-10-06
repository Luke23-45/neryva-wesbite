// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  };
});

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@hooks/studio/useKnowledgeLibrary', () => ({
  useScopes: () => ({
    data: [
      {
        id: '1',
        slug: 'support',
        name: 'Support',
        description: null,
        filters: null,
        versionPolicy: 'follow_latest_ready',
        thresholdOverride: null,
        rerankProfile: null,
        createdAt: null,
        updatedAt: '2026-10-06T10:00:00Z',
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useDeleteScope: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@styles/motion', () => ({
  pageItem: {},
}));

import { ScopesView } from './ScopesView';

function renderWithProviders(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </QueryClientProvider>,
  );
}

describe('ScopesView', () => {
  it('renders scope rows', () => {
    renderWithProviders(<ScopesView />);
    expect(screen.getByText('Support')).toBeTruthy();
    expect(screen.getByText('support')).toBeTruthy();
  });

  it('renders new scope button', () => {
    renderWithProviders(<ScopesView />);
    expect(screen.getByText('New scope')).toBeTruthy();
  });
});
