// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '@styles/theme';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { KnowledgeView } from './KnowledgeView';

const attachMock = vi.fn();
const attachTextMock = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@lib/engine/capabilities', () => ({
  canSetup: () => true,
  setupDeniedCopy: () => '',
  useCanSetup: () => () => true,
}));

vi.mock('@hooks/studio/useAttachmentUpload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAttachmentUpload')>();
  return {
    ...actual,
    useAttachmentUpload: () => ({
      uploads: [],
      attach: attachMock,
      attachText: attachTextMock,
      reset: vi.fn(),
      dismiss: vi.fn(),
    }),
  };
});

const DOCS = [
  { id: 'd1', sourceSlug: 'refund-policy', title: 'Refund policy 2026', state: 'ready', updatedAt: '2026-09-16T10:00:00Z', latestVersion: 3 },
];

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return {
    ...actual,
    useDocuments: () => ({ data: DOCS, isPending: false, isFetching: false, isError: false }),
    useRenameDocumentSlug: () => ({ mutate: vi.fn(), isPending: false }),
    useKnowledgeSearch: () => ({ data: [], isPending: false, isFetching: false, isError: false }),
  };
});

async function shell() {
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/knowledge',
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <KnowledgeView />
        </QueryClientProvider>
      </ThemeProvider>
    ),
  });
  const uploadRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/upload',
    component: () => <div>upload section</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, uploadRoute])]),
    history: createMemoryHistory({ initialEntries: ['/agent-studio/knowledge'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  attachMock.mockReset();
  attachTextMock.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe('KnowledgeView library page (C05)', () => {
  it('routes the Upload header button to the upload section', async () => {
    let router: Awaited<ReturnType<typeof shell>> | undefined;
    await act(async () => {
      router = await shell();
    });
    fireEvent.click(screen.getByText('Upload', { selector: 'button' }));
    expect(router?.state.location.pathname).toBe('/agent-studio/knowledge/upload');
    expect(await screen.findByText('upload section')).toBeTruthy();
  });

  it('states the retention truth — no delete verb, coverage is per-agent', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/no delete verb/)).toBeTruthy();
    expect(screen.getByText(/coverage.*per-agent/i)).toBeTruthy();
  });

  it('routes memories to the Memory library (C08 migration — moved, not copied)', async () => {
    await act(async () => {
      shell();
    });
    expect(screen.getByText(/moved there from this page, not copied/)).toBeTruthy();
    expect(screen.getByText(/Memory library/).getAttribute('href')).toMatch(/memory/);
    expect(screen.queryByLabelText(/New memory/)).toBeNull();
  });
});
