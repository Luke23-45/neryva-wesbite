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
import { MemoryPanel } from './MemoryPanel';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const DEFINITION = {
  ...defaultConsumer(),
  context_policy: { history_limit: 100, summary_enabled: true, knowledge_sources: [], memory_scope: 'user' as const },
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
  };
});

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return {
    ...actual,
    useOrgMemoryPolicy: () => ({ policy: { scrub: 'redact', ttlSeconds: 2_592_000 }, isPending: false, isError: false }),
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
          <MemoryPanel agentId="agent-1" />
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

describe('MemoryPanel', () => {
  it('renders scope consequence, served-20 history note, compaction, and org defaults', async () => {
    await shell();
    expect(screen.getByText(/never visible across accounts/)).toBeTruthy();
    expect(screen.getByText(/runs serve the 20 most recent/)).toBeTruthy();
    expect(screen.getByText(/rolling summary/)).toBeTruthy();
    expect(screen.getByText(/Scrub redact/)).toBeTruthy();
    expect(screen.getByText(/Default TTL 30 days/)).toBeTruthy();
  });

  it('never displays the stored-but-unread summary flag', async () => {
    await shell();
    expect(screen.queryByText(/summariz/i)).toBeNull();
    expect(screen.getByText(/Edit in builder/).getAttribute('href')).toMatch(/build/);
  });
});
