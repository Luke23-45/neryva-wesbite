import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { UsageView } from './UsageView';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-1' }),
}));

vi.mock('@hooks/studio/useSetupKnowledge', () => ({
  useDocuments: () => ({
    data: [
      { id: 'doc-1', title: 'Refund Policy', state: 'ready' },
      { id: 'doc-2', title: 'Pricing FAQ', state: 'ready' },
    ],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@hooks/studio/useAssistants', () => ({
  useAssistants: () => ({
    data: [{ id: 'agent-1', name: 'Support Bot' }],
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@hooks/studio/useKnowledgeLibrary', () => ({
  useDocumentConsumers: () => ({ data: [], isLoading: false }),
  useAgentDocuments: () => ({ data: [], isLoading: false }),
  useUnusedQueue: () => ({
    data: { windowDays: 30, count: 0, documents: [] },
    isLoading: false,
    isError: false,
  }),
  useCitationQuadrants: () => ({
    data: {
      windowDays: 30,
      quadrants: [
        { quadrant: 'high_high', documentIds: ['doc-1'], count: 1 },
        { quadrant: 'high_low', documentIds: [], count: 0 },
        { quadrant: 'low_high', documentIds: [], count: 0 },
        { quadrant: 'low_low', documentIds: [], count: 0 },
      ],
    },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return { ...actual, Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span> };
});

describe('UsageView', () => {
  it('renders section headers', () => {
    render(<ThemeProvider theme={theme}><UsageView /></ThemeProvider>);
    expect(screen.getByText('Usage')).toBeInTheDocument();
    expect(screen.getAllByText('Documents').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Agents').length).toBeGreaterThan(0);
    expect(screen.getByText('Unused queue')).toBeInTheDocument();
    expect(screen.getByText('Citation quadrants')).toBeInTheDocument();
  });

  it('renders document rows', () => {
    render(<ThemeProvider theme={theme}><UsageView /></ThemeProvider>);
    expect(screen.getByText('Refund Policy')).toBeInTheDocument();
    expect(screen.getByText('Pricing FAQ')).toBeInTheDocument();
  });

  it('renders quadrant cards', () => {
    render(<ThemeProvider theme={theme}><UsageView /></ThemeProvider>);
    expect(screen.getByText('High retrieval · High citation')).toBeInTheDocument();
  });

  it('shows unused queue empty state', () => {
    render(<ThemeProvider theme={theme}><UsageView /></ThemeProvider>);
    expect(screen.getByText('No unused documents')).toBeInTheDocument();
  });
});
