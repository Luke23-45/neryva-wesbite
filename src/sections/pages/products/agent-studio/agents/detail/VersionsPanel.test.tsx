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
  onImported: (id: string | null) => void = () => undefined,
  onReviewPublish: (id: string) => void = () => undefined,
) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <VersionsPanelActions agentId="agent-1" activeVersionId="v2" onImported={onImported} />
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
}

beforeEach(() => {
  importMutate.mockReset();
  rollbackMutate.mockReset();
});

describe('VersionsPanel (import pane + highlight landing)', () => {
  it('opens the import pane with Files|Paste tabs and schema honesty', async () => {
    await shell();
    fireEvent.click(screen.getByText('Import'));
    expect(screen.getByText('Paste', { selector: 'button' })).toBeTruthy();
    expect(screen.getByText('File', { selector: 'button' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Exported definition JSON/), {
      target: { value: JSON.stringify({ schema_version: 2, instructions: 'Hi', model_policy: { allowed_models: ['a/good'], fallback_enabled: false } }) },
    });
    expect(screen.getByText(/schema_version 2/)).toBeTruthy();
  });

  it('unwraps .export files instead of 400ing on them', async () => {
    const onImported = vi.fn();
    await shell(null, onImported);
    fireEvent.click(screen.getByText('Import'));
    fireEvent.change(screen.getByLabelText(/Exported definition JSON/), {
      target: {
        value: JSON.stringify({
          export: { schema_version: 2, instructions: 'Hi', model_policy: { allowed_models: ['a/good'], fallback_enabled: false } },
          provenance: { seed: 1 },
        }),
      },
    });
    expect(screen.getByText(/Unwrapped .export/)).toBeTruthy();
    fireEvent.click(screen.getByText('Import as draft'));
    const sent = importMutate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(sent).not.toHaveProperty('export');
    expect(sent).not.toHaveProperty('provenance');
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
    await shell(null, () => undefined, onReviewPublish);
    fireEvent.click(screen.getByText('Review & publish'));
    expect(onReviewPublish).toHaveBeenCalledWith('v0');
  });

  it('opens a rollback picker with every non-live published version', async () => {
    await shell();
    fireEvent.click(screen.getByText('Rollback'));
    expect(screen.getByText('Roll back to a prior version')).toBeTruthy();
    // v1 is the only PUBLISHED ≠ live candidate (v2 is live).
    expect(screen.getByDisplayValue(/v1/)).toBeTruthy();
    expect(screen.getByText(/history is kept, nothing is renamed/)).toBeTruthy();
    fireEvent.click(screen.getByText('Roll back to v1'));
    expect(rollbackMutate).toHaveBeenCalledWith({ toVersionId: 'v1' }, expect.anything());
  });

  it('names the new live version after rollback, unambiguously', async () => {
    await shell();
    fireEvent.click(screen.getByText('Rollback'));
    fireEvent.click(screen.getByText('Roll back to v1'));
    const onSuccess = rollbackMutate.mock.calls[0]?.[1]?.onSuccess as ((r: unknown) => void) | undefined;
    act(() => {
      onSuccess?.({ id: 'v3', version: 3, hash: 'd44e' });
    });
    expect(screen.getByText(/Live is now v3/)).toBeTruthy();
    expect(screen.getByText(/Recorded in Audit/)).toBeTruthy();
  });
});
