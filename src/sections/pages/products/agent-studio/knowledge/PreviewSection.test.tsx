// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { PreviewSection } from './PreviewSection';
import type { DocumentPreview } from '@hooks/studio/useSetupKnowledge';

let previewData: DocumentPreview | null | undefined = undefined;
let previewPending = false;

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return {
    ...actual,
    useDocumentPreview: () => ({
      data: previewData,
      isPending: previewPending,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    }),
  };
});

const PREVIEW: DocumentPreview = {
  id: 'd1',
  sourceSlug: 'refund-policy',
  title: 'Refund policy 2026',
  state: 'ready',
  latestVersion: 3,
  totalChunks: 2,
  truncated: false,
  chunks: [
    { sequence: 1, text: 'First chunk text.', byteStart: 0, byteEnd: 128 },
    { sequence: 2, text: 'Second chunk text.', byteStart: 128, byteEnd: 256 },
  ],
};

const PATH = '/agent-studio/knowledge/d1/preview';

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

async function routerAt(initialPath: string) {
  const rootRoute = createRootRoute();
  const layoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/knowledge',
    component: () => <Outlet />,
  });
  const indexRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/',
    component: () => shell(<div>knowledge list</div>),
  });
  const previewRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/$docId/preview',
    component: () => shell(<PreviewSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, previewRoute])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  previewPending = false;
  previewData = { ...PREVIEW, chunks: PREVIEW.chunks.map((c) => ({ ...c })) };
});

describe('PreviewSection (K-2 — document preview as a routed section)', () => {
  it('renders the stored text — state pill, version, chunk count, bytes, sequence order', async () => {
    await routerAt(PATH);
    expect(screen.getByRole('heading', { name: 'Document preview' })).toBeTruthy();
    expect(screen.getByText('Refund policy 2026')).toBeTruthy();
    expect(screen.getByText('ready')).toBeTruthy();
    expect(screen.getByText(/version 3 · 2 chunks/)).toBeTruthy();
    // Chunks render in the server's sequence order (the server contract).
    const texts = screen.getAllByText(/chunk text\./).map((el) => el.textContent);
    expect(texts).toEqual(['First chunk text.', 'Second chunk text.']);
    expect(screen.getByText(/chunk #1/)).toBeTruthy();
    expect(screen.getByText(/bytes 0–128/)).toBeTruthy();
    expect(screen.getByText(/chunk #2/)).toBeTruthy();
    expect(screen.getByText(/bytes 128–256/)).toBeTruthy();
    // The back row returns to the library.
    const back = screen.getByText(/Knowledge/, { selector: 'a' });
    expect(back.getAttribute('href')).toBe('/agent-studio/knowledge');
  });

  it('discloses the server-capped window when the tail is cut', async () => {
    previewData = { ...PREVIEW, totalChunks: 10, truncated: true };
    await routerAt(PATH);
    expect(screen.getByText(/Showing the first 2 of 10 chunks/)).toBeTruthy();
  });

  it('shows the pre-READY empty state when no chunks are stored yet', async () => {
    previewData = { ...PREVIEW, chunks: [], totalChunks: 0, state: 'processing' };
    await routerAt(PATH);
    expect(screen.getByText(/No stored text yet/)).toBeTruthy();
    expect(screen.getByText('processing')).toBeTruthy();
  });

  it('shows the unavailable state when the preview cannot be read', async () => {
    previewData = null;
    await routerAt(PATH);
    expect(screen.getByText('Preview unavailable')).toBeTruthy();
    expect(screen.getByText('The stored text could not be read.')).toBeTruthy();
  });

  it('is read-only — no form controls, no write affordances', async () => {
    await routerAt(PATH);
    expect(document.querySelectorAll('input, textarea, select').length).toBe(0);
    expect(document.querySelectorAll('button').length).toBe(0);
  });
});
