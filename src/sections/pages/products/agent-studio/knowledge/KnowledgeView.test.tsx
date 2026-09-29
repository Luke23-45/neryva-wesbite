// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

let mockCanWrite = true;

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

vi.mock('@lib/engine/capabilities', () => ({
  canSetup: () => mockCanWrite,
  setupDeniedCopy: () => '',
  useCanSetup: () => () => mockCanWrite,
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

const renameMutate = vi.fn();
let renameOpts: { onSuccess?: () => void } | undefined;

const deleteMutate = vi.fn();
let deleteOpts: { onSuccess?: () => void } | undefined;

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

vi.mock('@hooks/studio/useSetupKnowledge', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@hooks/studio/useSetupKnowledge')>();
  return {
    ...actual,
    useDocuments: () => ({ data: DOCS, isPending: false, isFetching: false, isError: false }),
    useRenameDocumentSlug: () => ({ mutate: renameMutate, isPending: false }),
    useDeleteDocument: () => ({ mutate: deleteMutate, isPending: false }),
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
  const previewProbe = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/$docId/preview',
    component: () => <div>preview section</div>,
  });
  const versionUploadProbe = createRoute({
    getParentRoute: () => layoutRoute,
    path: '/$docId/versions/upload',
    component: () => <div>version upload section</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([layoutRoute.addChildren([indexRoute, uploadRoute, previewProbe, versionUploadProbe])]),
    history: createMemoryHistory({ initialEntries: ['/agent-studio/knowledge'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return router;
}

beforeEach(() => {
  mockCanWrite = true;
  attachMock.mockReset();
  attachTextMock.mockReset();
  renameMutate.mockReset();
  renameMutate.mockImplementation((_payload: unknown, opts?: typeof renameOpts) => {
    renameOpts = opts;
  });
  renameOpts = undefined;
  deleteMutate.mockReset();
  deleteMutate.mockImplementation((_id: unknown, opts?: typeof deleteOpts) => {
    deleteOpts = opts;
  });
  deleteOpts = undefined;
  dirtyGuardCalls.length = 0;
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

  it('routes the preview action to the preview section', async () => {
    let router: Awaited<ReturnType<typeof shell>> | undefined;
    await act(async () => {
      router = await shell();
    });
    fireEvent.click(screen.getByLabelText('Preview refund-policy'));
    expect(router?.state.location.pathname).toBe('/agent-studio/knowledge/d1/preview');
    expect(await screen.findByText('preview section')).toBeTruthy();
  });

  it('routes the version-upload action to the version upload section', async () => {
    let router: Awaited<ReturnType<typeof shell>> | undefined;
    await act(async () => {
      router = await shell();
    });
    fireEvent.click(screen.getByLabelText('Upload new version of refund-policy'));
    expect(router?.state.location.pathname).toBe('/agent-studio/knowledge/d1/versions/upload');
    expect(await screen.findByText('version upload section')).toBeTruthy();
  });
});

describe('KnowledgeView inline rename (K-2 — no modal, no route)', () => {
  async function openRename() {
    await act(async () => {
      await shell();
    });
    fireEvent.click(screen.getByLabelText('Rename pin address of refund-policy'));
    return screen.getByLabelText('New pin address for refund-policy') as HTMLInputElement;
  }

  it('opens inline in the row — no modal dialog', async () => {
    const input = await openRename();
    expect(input.value).toBe('refund-policy');
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(screen.getByText(/Existing pins referencing the old slug/)).toBeTruthy();
  });

  it('disables Save for an unchanged slug', async () => {
    await openRename();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('rejects invalid slugs with the shared kebab-case error and keeps Save disabled', async () => {
    const input = await openRename();
    fireEvent.change(input, { target: { value: 'Bad_Slug!' } });
    expect(screen.getByText(/Slugs are 3–64 characters/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(renameMutate).not.toHaveBeenCalled();
  });

  it('saves a valid slug lowercased via the rename mutation, Enter submits', async () => {
    const input = await openRename();
    fireEvent.change(input, { target: { value: 'Refund-Policy-V2' } });
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(renameMutate).toHaveBeenCalledWith(
      { documentId: 'd1', sourceSlug: 'refund-policy-v2' },
      expect.anything(),
    );
    // Success closes the inline editor.
    await act(async () => {
      renameOpts?.onSuccess?.();
    });
    expect(screen.queryByLabelText('New pin address for refund-policy')).toBeNull();
  });

  it('Escape cancels without mutating', async () => {
    const input = await openRename();
    fireEvent.change(input, { target: { value: 'refund-policy-v2' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(renameMutate).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('New pin address for refund-policy')).toBeNull();
  });

  it('arms the dirty guard while a rename is unsaved and releases it on cancel', async () => {
    await act(async () => {
      await shell();
    });
    expect(lastDirtyGuard().dirty).toBe(false);
    fireEvent.click(screen.getByLabelText('Rename pin address of refund-policy'));
    // Opened but unchanged — nothing to lose yet.
    expect(lastDirtyGuard().dirty).toBe(false);
    const input = screen.getByLabelText('New pin address for refund-policy');
    fireEvent.change(input, { target: { value: 'refund-policy-v2' } });
    const armed = lastDirtyGuard();
    expect(armed.dirty).toBe(true);
    expect(armed.message).toBe('You have an unsaved pin address rename. Leaving now discards it.');
    // Escape cancels the editor — guard releases.
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(lastDirtyGuard().dirty).toBe(false);
  });
});

describe('KnowledgeView retire modal (destructive confirm — the one allowed modal)', () => {
  async function openRetire() {
    await act(async () => {
      await shell();
    });
    fireEvent.click(screen.getByLabelText('Retire refund-policy'));
    return screen.getByRole('dialog');
  }

  it('opens with tombstone copy and a danger confirm', async () => {
    const dialog = await openRetire();
    expect(dialog.textContent).toMatch(/leaves retrieval immediately/);
    expect(dialog.textContent).toMatch(/tombstone/);
    expect(screen.getByRole('button', { name: 'Retire' })).toBeEnabled();
  });

  it('confirm retires the document, toasts the tombstone truth, and closes', async () => {
    await openRetire();
    fireEvent.click(screen.getByRole('button', { name: 'Retire' }));
    expect(deleteMutate).toHaveBeenCalledWith('d1', expect.anything());
    await act(async () => {
      deleteOpts?.onSuccess?.();
    });
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
      'Document retired — it leaves retrieval immediately; the mapping stays as a tombstone.',
    );
    // The modal exits via AnimatePresence — wait for it to unmount.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('cancel closes without mutating', async () => {
    await openRetire();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(deleteMutate).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('KnowledgeView write gates (non-author roles)', () => {
  it('disables upload, rename, version-upload, and retire affordances', async () => {
    mockCanWrite = false;
    await act(async () => {
      await shell();
    });
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
    expect(screen.getByLabelText('Rename pin address of refund-policy')).toBeDisabled();
    expect(screen.getByLabelText('Upload new version of refund-policy')).toBeDisabled();
    expect(screen.getByLabelText('Retire refund-policy')).toBeDisabled();
    // Read-only affordances stay live: preview and copy.
    expect(screen.getByLabelText('Preview refund-policy')).toBeEnabled();
  });
});
