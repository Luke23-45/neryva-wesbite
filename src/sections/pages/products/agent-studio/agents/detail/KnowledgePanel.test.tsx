// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { defaultConsumer } from '@lib/engine/agent-payload';
import { KnowledgePanel } from './KnowledgePanel';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const DEFINITION = {
  ...defaultConsumer(),
  instructions: '## Role\nR.\n',
  context_policy: { history_limit: 30, summary_enabled: true, knowledge_sources: ['refund-policy', 'ghost-slug'], memory_scope: 'conversation' },
  knowledge_policy: { retrieval_enabled: true, max_results: 5 },
};

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useAssistantDefinition: () => ({
      data: { definition: DEFINITION, versionId: 'v3', hash: 'h3', status: 'PUBLISHED', isDraft: false },
      isPending: false,
      isFetching: false,
      isError: false,
    }),
    useKnowledgeHealth: () => ({
      data: {
        degraded: true,
        pins: [{ sourceSlug: 'refund-policy', resolved: true, documentId: 'd1', state: 'ready', embeddingComplete: true }],
      },
      isPending: false,
      isError: false,
    }),
  };
});

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return {
    ...actual,
    useDocuments: () => ({
      data: [{ id: 'd1', sourceSlug: 'refund-policy', title: 'Refund policy 2026', state: 'ready', updatedAt: null, latestVersion: 3 }],
      isPending: false,
      isError: false,
    }),
  };
});

async function shell() {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <KnowledgePanel agentId="agent-1" />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
}

describe('KnowledgePanel', () => {
  it('renders pins with document + coverage truth and the publish consequence for unresolved slugs', async () => {
    await shell();
    expect(screen.getByText('refund-policy')).toBeTruthy();
    expect(screen.getByText(/ready-for-retrieval/)).toBeTruthy();
    expect(screen.getByText('ghost-slug')).toBeTruthy();
    expect(screen.getByText(/publish refuses/)).toBeTruthy();
    expect(screen.getByText('degraded')).toBeTruthy();
  });

  it('deep-links out instead of editing (read-only contract)', async () => {
    await shell();
    expect(screen.getByText(/Edit in builder/).getAttribute('href')).toMatch(/build/);
    expect(screen.getByText(/Open Knowledge library/).getAttribute('href')).toMatch(/knowledge/);
  });
});
