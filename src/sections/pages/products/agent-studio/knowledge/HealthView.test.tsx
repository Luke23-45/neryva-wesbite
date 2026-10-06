import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { HealthView } from './HealthView';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  };
});

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-1' }),
}));

vi.mock('@hooks/studio/useKnowledgeLibrary', () => ({
  useHealthFindings: () => ({
    data: {
      status: 'open',
      count: 1,
      findings: [
        {
          id: 'f-1',
          findingType: 'quota_warning',
          severity: 'warning',
          subjectType: 'organization',
          subjectId: null,
          fingerprint: 'quota:org-1',
          details: {},
          status: 'open',
          firstSeenAt: new Date(Date.now() - 3600_000).toISOString(),
          lastSeenAt: new Date().toISOString(),
          resolvedAt: null,
        },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useDismissFinding: () => ({ mutate: vi.fn(), isPending: false }),
  useSnoozeFinding: () => ({ mutate: vi.fn(), isPending: false }),
}));

describe('HealthView', () => {
  it('renders finding cards', () => {
    render(<ThemeProvider theme={theme}><HealthView /></ThemeProvider>);
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('Storage quota warning')).toBeInTheDocument();
    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  it('renders filter dropdowns', () => {
    render(<ThemeProvider theme={theme}><HealthView /></ThemeProvider>);
    expect(screen.getByLabelText('Severity filter')).toBeInTheDocument();
    expect(screen.getByLabelText('Type filter')).toBeInTheDocument();
  });

  it('shows action buttons', () => {
    render(<ThemeProvider theme={theme}><HealthView /></ThemeProvider>);
    expect(screen.getByText('View storage')).toBeInTheDocument();
    expect(screen.getByText('Dismiss')).toBeInTheDocument();
  });
});
