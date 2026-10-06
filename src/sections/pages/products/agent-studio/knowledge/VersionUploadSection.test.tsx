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
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import toast from 'react-hot-toast';
import { ApiError } from '@lib/engine/client';
import { VersionUploadSection } from './VersionUploadSection';
import type { KnowledgeDocument } from '@hooks/studio/useSetupKnowledge';

let mockCanWrite = true;
let documentsData: KnowledgeDocument[] = [];
let documentsPending = false;
const attachMock = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@lib/engine/capabilities', () => ({
  canSetup: () => mockCanWrite,
}));

vi.mock('@hooks/studio/useAttachmentUpload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useAttachmentUpload')>();
  return {
    ...actual,
    useAttachmentUpload: () => ({
      uploads: [],
      attach: attachMock,
      attachText: vi.fn(),
      reset: vi.fn(),
      dismiss: vi.fn(),
    }),
  };
});

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return {
    ...actual,
    useDocuments: () => ({
      data: documentsData,
      isPending: documentsPending,
      isFetching: false,
      isError: false,
      refetch: vi.fn(),
    }),
  };
});

const DOC: KnowledgeDocument = {
  id: 'd1',
  sourceSlug: 'refund-policy',
  title: 'Refund policy 2026',
  state: 'ready',
  updatedAt: '2026-09-16T10:00:00Z',
  latestVersion: 3,
  origin: 'upload',
  curationStatus: 'unreviewed',
  attributes: {},
};

// createMemoryHistory never wires history.block (no getBlockers/setBlockers),
// so the blocker's intercept dialog cannot appear in jsdom. The guard wiring —
// armed/released states and the exact user-facing copy — is asserted here;
// interception itself is TanStack behavior, live under browser history.
const dirtyGuardCalls: Array<{ dirty: boolean; message: string }> = [];
vi.mock('@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard', () => ({
  useDirtyGuard: (dirty: boolean, message?: string) => {
    dirtyGuardCalls.push({ dirty, message: message ?? '' });
    return { dialog: null };
  },
}));
const lastDirtyGuard = () => dirtyGuardCalls[dirtyGuardCalls.length - 1]!;

const LIBRARY = '/agent-studio/knowledge';
const UPLOAD = '/agent-studio/knowledge/d1/versions/upload';

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
  const uploadRoute = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/$docId/versions/upload',
    component: () => shell(<VersionUploadSection />),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, uploadRoute])]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

function chooseFile(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
}

beforeEach(() => {
  mockCanWrite = true;
  documentsPending = false;
  documentsData = [DOC];
  attachMock.mockReset();
  dirtyGuardCalls.length = 0;
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
});

describe('VersionUploadSection (K-2 — version upload as a routed section)', () => {
  it('renders the document context — current version, pin-immutable copy, no slug/title fields', async () => {
    await routerAt(UPLOAD);
    expect(screen.getByRole('heading', { name: 'Upload new version' })).toBeTruthy();
    expect(screen.getByText(/New version of/)).toBeTruthy();
    expect(screen.getByText(/Current version:/)).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    // K12 pin-resolution copy: the pin address never changes.
    expect(screen.getByText(/The pin address does not change/)).toBeTruthy();
    // Byte-faithful to the modal: single file picker only — no slug field
    // (pin immutable on versions), no title field (document keeps its title).
    expect(document.querySelectorAll('input[type="text"]').length).toBe(0);
    expect(document.querySelectorAll('input[type="file"]').length).toBe(1);
  });

  it('bounces roles without setup:author back to the library before rendering', async () => {
    mockCanWrite = false;
    const router = await routerAt(UPLOAD);
    await act(async () => {});
    expect(router.state.location.pathname).toBe(LIBRARY);
    expect(screen.queryByText('Upload new version')).toBeNull();
  });

  it('bounces unknown document ids back to the library', async () => {
    const router = await routerAt('/agent-studio/knowledge/nope/versions/upload');
    await act(async () => {});
    expect(router.state.location.pathname).toBe(LIBRARY);
  });

  it('refuses unsupported file types with the media-type toast and keeps nothing selected', async () => {
    attachMock.mockResolvedValue(null);
    await routerAt(UPLOAD);
    chooseFile(new File(['x'], 'notes.exe', { type: 'application/x-msdownload' }));
    fireEvent.click(screen.getByRole('button', { name: /Upload new version/ }));
    await act(async () => {});
    expect(attachMock).toHaveBeenCalledWith(
      expect.objectContaining({ targetDocumentId: 'd1', versionOfSlug: 'refund-policy' }),
    );
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(expect.stringMatching(/not a supported type/));
    // Rejected — the selection stays so the user can pick a valid file.
    expect(screen.getByText('notes.exe')).toBeTruthy();
  });

  it('authorizes the upload, toasts, and returns to the library on success', async () => {
    attachMock.mockResolvedValue('session-1');
    const router = await routerAt(UPLOAD);
    chooseFile(new File(['pdf'], 'v4.pdf', { type: 'application/pdf' }));
    fireEvent.click(screen.getByRole('button', { name: /Upload new version/ }));
    await act(async () => {});
    expect(attachMock).toHaveBeenCalledWith(
      expect.objectContaining({ file: expect.any(File), targetDocumentId: 'd1', versionOfSlug: 'refund-policy' }),
    );
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
      'New version authorized — tracking ingestion to READY',
    );
    expect(router.state.location.pathname).toBe(LIBRARY);
  });

  it('names the actionable refusal reason (A4-04) and keeps the selection (A4-09)', async () => {
    attachMock.mockRejectedValue(
      new ApiError(422, 'validation_failed', 'Request validation failed', {
        byte_length: 'exceeds KNOWLEDGE_MAX_UPLOAD_BYTES (1024)',
      }),
    );
    await routerAt(UPLOAD);
    chooseFile(new File(['pdf'], 'v4.pdf', { type: 'application/pdf' }));
    fireEvent.click(screen.getByRole('button', { name: /Upload new version/ }));
    await act(async () => {});
    const err = vi.mocked(toast.error).mock.calls[0]?.[0] as string;
    expect(err).toMatch(/v4\.pdf/);
    expect(err).toMatch(/byte_length: exceeds KNOWLEDGE_MAX_UPLOAD_BYTES/);
    // Refusal keeps the selection on the page — retry without reselecting.
    expect(screen.getByText('v4.pdf')).toBeTruthy();
  });

  it('arms the dirty guard while a file is selected and releases it on submit', async () => {
    attachMock.mockResolvedValue('session-1');
    const router = await routerAt(UPLOAD);
    expect(lastDirtyGuard().dirty).toBe(false);
    chooseFile(new File(['pdf'], 'v4.pdf', { type: 'application/pdf' }));
    const armed = lastDirtyGuard();
    expect(armed.dirty).toBe(true);
    expect(armed.message).toBe(
      'You selected a file but did not upload it. Leaving now discards the selection.',
    );
    // Submit clears the file first — the success navigation is never blocked.
    fireEvent.click(screen.getByRole('button', { name: /Upload new version/ }));
    await act(async () => {});
    expect(lastDirtyGuard().dirty).toBe(false);
    expect(router.state.location.pathname).toBe(LIBRARY);
  });

  it('cancels cleanly with no file selected — guard never arms, navigation completes', async () => {
    const router = await routerAt(UPLOAD);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await act(async () => {});
    expect(dirtyGuardCalls.every((c) => c.dirty === false)).toBe(true);
    expect(router.state.location.pathname).toBe(LIBRARY);
  });
});
