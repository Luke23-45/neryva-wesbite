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
    useAttachmentUpload: () => ({ uploads: [], attach: attachMock, attachText: attachTextMock, reset: vi.fn() }),
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
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <KnowledgeView />
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
  attachMock.mockReset();
  attachTextMock.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

async function openPasteTab() {
  await act(async () => {
    shell();
  });
  fireEvent.click(screen.getByText('Upload', { selector: 'button' }));
  fireEvent.click(screen.getByText('Paste text'));
}

describe('KnowledgeView library page (C05)', () => {
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

  it('guards pasted JSON with a named error and never starts a session', async () => {
    await openPasteTab();
    fireEvent.click(screen.getByText('JSON'));
    fireEvent.change(screen.getByPlaceholderText(/refunds within 30 days/), { target: { value: '{broken' } });
    fireEvent.change(screen.getByPlaceholderText('kebab-case, 3–64 chars'), { target: { value: 'pasted-policy' } });
    fireEvent.click(screen.getByText('Ingest paste'));
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(expect.stringMatching(/valid JSON/i));
    expect(attachTextMock).not.toHaveBeenCalled();
  });

  it('ingests valid paste through the shared session flow', async () => {
    attachTextMock.mockResolvedValueOnce('session-9');
    await openPasteTab();
    fireEvent.change(screen.getByPlaceholderText('Paste the source text…'), { target: { value: 'Refunds within 30 days.' } });
    fireEvent.change(screen.getByPlaceholderText('kebab-case, 3–64 chars'), { target: { value: 'pasted-policy' } });
    fireEvent.click(screen.getByText('Ingest paste'));
    await act(async () => undefined);
    expect(attachTextMock).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'pasted-policy', mediaType: 'text/markdown' }),
    );
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(expect.stringMatching(/tracking ingestion/i));
  });
});
