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
import { UploadSection } from './UploadSection';
import { KnowledgeUploadsProvider } from './KnowledgeUploads';
import { checkSourceSlug } from '@lib/engine/setup-caps';

let mockRole: string = 'owner';

const attachMock = vi.fn();
const attachTextMock = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: mockRole }),
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

const SLUG_ERROR =
  'Slugs are 3–64 characters: lowercase letters, digits, hyphens; starts and ends with a letter or digit.';

function shell(children: React.ReactNode) {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

async function routerAt(initialPath: string, role = 'owner') {
  mockRole = role;
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
    path: '/upload',
    component: () => shell(<UploadSection />),
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

function chooseFiles(files: File[]) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  fireEvent.change(input);
}

function pasteTab() {
  fireEvent.click(screen.getByText('Paste text'));
}

beforeEach(() => {
  mockRole = 'owner';
  attachMock.mockReset();
  attachTextMock.mockReset();
  vi.mocked(toast.success).mockReset();
  vi.mocked(toast.error).mockReset();
  sessionStorage.clear();
  localStorage.clear();
});

describe('UploadSection role-gate bounce', () => {
  it('bounces a reader to the knowledge library and renders nothing', async () => {
    const router = await routerAt('/agent-studio/knowledge/upload', 'reader');
    expect(router.state.location.pathname).toBe('/agent-studio/knowledge');
    expect(screen.queryByText('Upload documents')).toBeNull();
    expect(screen.queryByText('Paste text')).toBeNull();
  });

  it.each([['owner'], ['admin'], ['developer']])('renders the upload section for %s', async (role) => {
    const router = await routerAt('/agent-studio/knowledge/upload', role);
    expect(router.state.location.pathname).toBe('/agent-studio/knowledge/upload');
    expect(screen.getByText('Upload documents')).toBeTruthy();
    expect(screen.getByText('Paste text')).toBeTruthy();
  });
});

describe('kebab-case slug validation parity (checkSourceSlug, byte-faithful)', () => {
  it.each([['refund-policy'], ['policy-v2'], ['a1b'], ['x'.repeat(64)]])('accepts %s', (slug) => {
    expect(checkSourceSlug(slug)).toBeNull();
  });

  it('normalizes case before testing — uppercase is accepted and stored lowercased', () => {
    // The modal rule trims + lowercases FIRST (setup-caps), so 'Refund-Policy'
    // validates; the section submits row.slug.trim().toLowerCase().
    expect(checkSourceSlug('Refund-Policy')).toBeNull();
  });

  it.each([
    ['refund policy'],
    ['refund_policy'],
    ['refund!'],
    ['-leading'],
    ['trailing-'],
    ['ab'],
    ['x'.repeat(65)],
    [''],
  ])('rejects %s with the exact engine copy', (slug) => {
    expect(checkSourceSlug(slug)).toBe(SLUG_ERROR);
  });
});

describe('upload tab: per-file rows', () => {
  it('starts empty with Upload disabled', async () => {
    await routerAt('/agent-studio/knowledge/upload');
    expect(screen.getByText(/No files yet/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });

  it('adds a file row with slugified pin intent and prefilled title', async () => {
    await routerAt('/agent-studio/knowledge/upload');
    chooseFiles([new File(['data'], 'Refund Policy.pdf', { type: 'application/pdf' })]);
    expect(screen.getByText('Refund Policy.pdf')).toBeTruthy();
    expect((screen.getByPlaceholderText('omit to derive') as HTMLInputElement).value).toBe('refund-policy');
    expect((screen.getByPlaceholderText('Defaults to the slug, else auto') as HTMLInputElement).value).toBe(
      'Refund Policy',
    );
    expect(screen.getByRole('button', { name: 'Upload 1 file' })).toBeEnabled();
  });

  it('removes a row', async () => {
    await routerAt('/agent-studio/knowledge/upload');
    chooseFiles([new File(['data'], 'Refund Policy.pdf', { type: 'application/pdf' })]);
    fireEvent.click(screen.getByText('Remove'));
    expect(screen.queryByText('Refund Policy.pdf')).toBeNull();
    expect(screen.getByText(/No files yet/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });

  it('shows the inline slug error and disables submit on an invalid pin intent', async () => {
    await routerAt('/agent-studio/knowledge/upload');
    chooseFiles([new File(['data'], 'Refund Policy.pdf', { type: 'application/pdf' })]);
    fireEvent.change(screen.getByPlaceholderText('omit to derive'), { target: { value: 'bad slug' } });
    expect(screen.getByText(SLUG_ERROR)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Upload 1 file' })).toBeDisabled();
    // Fixing the slug clears the error and re-enables the submit.
    fireEvent.change(screen.getByPlaceholderText('omit to derive'), { target: { value: 'good-slug' } });
    expect(screen.queryByText(SLUG_ERROR)).toBeNull();
    expect(screen.getByRole('button', { name: 'Upload 1 file' })).toBeEnabled();
  });

  it('authorizes a session per file, toasts, and returns to the library', async () => {
    attachMock.mockResolvedValueOnce('session-1');
    const router = await routerAt('/agent-studio/knowledge/upload');
    const file = new File(['data'], 'Refund Policy.pdf', { type: 'application/pdf' });
    chooseFiles([file]);
    fireEvent.click(screen.getByRole('button', { name: 'Upload 1 file' }));
    await act(async () => undefined);
    expect(attachMock).toHaveBeenCalledWith(
      expect.objectContaining({ file, sourceSlug: 'refund-policy', title: 'Refund Policy' }),
    );
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(expect.stringMatching(/tracking ingestion/i));
    expect(router.state.location.pathname).toBe('/agent-studio/knowledge');
  });

  it('lowercases an uppercase pin intent before authorize', async () => {
    attachMock.mockResolvedValueOnce('session-2');
    await routerAt('/agent-studio/knowledge/upload');
    chooseFiles([new File(['data'], 'policy.pdf', { type: 'application/pdf' })]);
    fireEvent.change(screen.getByPlaceholderText('omit to derive'), { target: { value: 'Refund-Policy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload 1 file' }));
    await act(async () => undefined);
    expect(attachMock).toHaveBeenCalledWith(expect.objectContaining({ sourceSlug: 'refund-policy' }));
  });

  it('keeps the selection when nothing is authorized (A4-09)', async () => {
    attachMock.mockResolvedValueOnce(null);
    const router = await routerAt('/agent-studio/knowledge/upload');
    chooseFiles([new File(['data'], 'notes.xyz', { type: 'application/xyz' })]);
    fireEvent.click(screen.getByRole('button', { name: 'Upload 1 file' }));
    await act(async () => undefined);
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(expect.stringMatching(/not a supported type/i));
    // The row survives — the user can fix the file without reselecting.
    expect(screen.getByText('notes.xyz')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/agent-studio/knowledge/upload');
  });
});

describe('paste tab', () => {
  it('switches tabs and disables Ingest paste until content and slug are present', async () => {
    await routerAt('/agent-studio/knowledge/upload');
    pasteTab();
    expect(screen.getByPlaceholderText('Paste the source text…')).toBeTruthy();
    const ingest = screen.getByRole('button', { name: 'Ingest paste' });
    expect(ingest).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('Paste the source text…'), {
      target: { value: 'Refunds within 30 days.' },
    });
    expect(ingest).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText('kebab-case, 3–64 chars'), {
      target: { value: 'pasted-policy' },
    });
    expect(ingest).toBeEnabled();
  });

  it('refuses an invalid pin address with the slug error and never starts a session', async () => {
    await routerAt('/agent-studio/knowledge/upload');
    pasteTab();
    fireEvent.change(screen.getByPlaceholderText('Paste the source text…'), {
      target: { value: 'Refunds within 30 days.' },
    });
    fireEvent.change(screen.getByPlaceholderText('kebab-case, 3–64 chars'), { target: { value: 'bad slug' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingest paste' }));
    await act(async () => undefined);
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(SLUG_ERROR);
    expect(attachTextMock).not.toHaveBeenCalled();
  });

  it('guards pasted JSON with a named error and never starts a session', async () => {
    await routerAt('/agent-studio/knowledge/upload');
    pasteTab();
    fireEvent.click(screen.getByText('JSON'));
    fireEvent.change(screen.getByPlaceholderText(/refunds within 30 days/), { target: { value: '{broken' } });
    fireEvent.change(screen.getByPlaceholderText('kebab-case, 3–64 chars'), { target: { value: 'pasted-policy' } });
    fireEvent.click(screen.getByText('Ingest paste'));
    await act(async () => undefined);
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith(expect.stringMatching(/valid JSON/i));
    expect(attachTextMock).not.toHaveBeenCalled();
  });

  it('ingests valid paste through the shared session flow and returns to the library', async () => {
    attachTextMock.mockResolvedValueOnce('session-9');
    const router = await routerAt('/agent-studio/knowledge/upload');
    pasteTab();
    fireEvent.change(screen.getByPlaceholderText('Paste the source text…'), {
      target: { value: 'Refunds within 30 days.' },
    });
    fireEvent.change(screen.getByPlaceholderText('kebab-case, 3–64 chars'), { target: { value: 'pasted-policy' } });
    fireEvent.click(screen.getByText('Ingest paste'));
    await act(async () => undefined);
    expect(attachTextMock).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Refunds within 30 days.', slug: 'pasted-policy', mediaType: 'text/markdown' }),
    );
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(expect.stringMatching(/tracking ingestion/i));
    expect(router.state.location.pathname).toBe('/agent-studio/knowledge');
  });
});

describe('shared uploads instance (KnowledgeUploadsProvider)', () => {
  it('shares one attach instance between the library surface and the section', async () => {
    attachMock.mockResolvedValueOnce('session-7');
    mockRole = 'owner';
    const rootRoute = createRootRoute();
    const layoutRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/agent-studio/knowledge',
      component: () => (
        <KnowledgeUploadsProvider>
          <Outlet />
        </KnowledgeUploadsProvider>
      ),
    });
    const uploadRoute = createRoute({
      getParentRoute: () => layoutRoute,
      path: '/upload',
      component: () => shell(<UploadSection />),
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([layoutRoute.addChildren([uploadRoute])]),
      history: createMemoryHistory({ initialEntries: ['/agent-studio/knowledge/upload'] }),
    });
    await act(async () => {
      render(<RouterProvider router={router} />);
    });
    expect(screen.getByText('Upload documents')).toBeTruthy();
    chooseFiles([new File(['data'], 'policy.pdf', { type: 'application/pdf' })]);
    fireEvent.click(screen.getByRole('button', { name: 'Upload 1 file' }));
    await act(async () => undefined);
    expect(attachMock).toHaveBeenCalledTimes(1);
    expect(vi.mocked(toast.success)).toHaveBeenCalledWith(expect.stringMatching(/tracking ingestion/i));
  });
});
