// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { VersionsPanel, VersionsPanelActions } from './VersionsPanel';
import type { AgentVersion } from '@hooks/studio/useAgentAuthoring';

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

const VERSIONS: AgentVersion[] = [
  { id: 'v0', version: 0, status: 'DRAFT', hash: 'a41f', createdAt: '2026-09-18T12:00', publishedAt: null, publishedBy: null, rollbackOf: null, parentVersionId: null, updatedAt: null, definition: null },
  { id: 'v1', version: 1, status: 'PUBLISHED', hash: 'c11c', createdAt: '2026-09-10', publishedAt: '2026-09-10', publishedBy: 'u1', rollbackOf: null, parentVersionId: null, updatedAt: null, definition: null },
  { id: 'v2', version: 2, status: 'PUBLISHED', hash: 'b77c', createdAt: '2026-09-11', publishedAt: '2026-09-11', publishedBy: 'u1', rollbackOf: null, parentVersionId: null, updatedAt: null, definition: null },
];

const importMutate = vi.fn();
const rollbackMutate = vi.fn();

vi.mock('@hooks/studio/useAgentAuthoring', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAgentAuthoring')>();
  return {
    ...actual,
    useAssistantVersions: () => ({ data: VERSIONS, isPending: false, isError: false }),
    useRollbackAssistant: () => ({ mutate: rollbackMutate, isPending: false }),
    useRetireVersion: () => ({ mutate: vi.fn(), isPending: false }),
    useExportVersion: () => ({ mutate: vi.fn(), isPending: false }),
    useVersionSnapshot: () => ({ data: undefined }),
    useImportVersion: () => ({ mutate: importMutate, isPending: false, error: null }),
    usePublishReadiness: () => ({
      version: null,
      activeVersion: null,
      templateSlug: null,
      templateVersion: null,
      rows: [],
      verdict: 'unknown',
      publishable: false,
      needsAcknowledge: false,
      unresolvedSlugs: [],
      unreadySlugs: [],
      noChangeHint: false,
      requiredChecks: [],
      decision: null,
      decisionFinishedAt: null,
      evalRunning: false,
      isPending: false,
      isError: false,
      retry: vi.fn(),
    }),
  };
});

vi.mock('@hooks/studio/useSetupOperate', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupOperate')>();
  return {
    ...actual,
    useMemberNameMap: () => ({ nameOf: () => 'owner' }),
  };
});

async function shell(
  highlightVersionId: string | null = null,
  onReviewPublish: (id: string) => void = () => undefined,
) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <VersionsPanelActions agentId="agent-1" activeVersionId="v2" />
          <VersionsPanel
            agentId="agent-1"
            activeVersionId="v2"
            highlightVersionId={highlightVersionId}
            onDismissHighlight={() => undefined}
            onReviewPublish={onReviewPublish}
          />
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
  return router;
}

beforeEach(() => {
  importMutate.mockReset();
  rollbackMutate.mockReset();
});

describe('VersionsPanel (import + rollback navigate to sections)', () => {
  it('navigates to the import section when Import is clicked', async () => {
    const router = await shell();
    fireEvent.click(screen.getByText('Import'));
    expect(router.state.location.pathname).toBe('/agent-studio/agents/agent-1/versions/import');
  });

  it('navigates to the rollback section when Rollback is clicked', async () => {
    const router = await shell();
    fireEvent.click(screen.getByText('Rollback'));
    expect(router.state.location.pathname).toBe('/agent-studio/agents/agent-1/versions/rollback');
  });

  it('highlights the imported draft row with a banner, never silently', async () => {
    await shell('v0');
    expect(screen.getByText(/Imported as draft — review then publish/)).toBeTruthy();
    fireEvent.click(screen.getByText('Dismiss'));
  });
});

describe('VersionsPanel (C14 publish alignment)', () => {
  it('routes draft publish through the gate instead of direct-mutating', async () => {
    const onReviewPublish = vi.fn();
    await shell(null, onReviewPublish);
    fireEvent.click(screen.getByText('Review & publish'));
    expect(onReviewPublish).toHaveBeenCalledWith('v0');
  });

});
