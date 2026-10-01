// @vitest-environment jsdom
/**
 * Paste encoding (C05 PLAN.md §5) — pasted text becomes a File through the same
 * session flow; the encoding itself is pure and asserted here.
 */
import { describe, expect, it } from 'vitest';
import { encodePasteFile, PASTE_UPLOAD_TYPES } from './useAttachmentUpload';

describe('encodePasteFile', () => {
  it('names the file <slug>.<ext> with the declared type', () => {
    const file = encodePasteFile('{"a":1}', 'pricing-tiers', 'application/json');
    expect(file.name).toBe('pricing-tiers.json');
    expect(file.type).toBe('application/json');
  });

  it('falls back to a shippable stem on blank slugs', () => {
    const file = encodePasteFile('hello', '  ', 'text/plain');
    expect(file.name).toBe('pasted-source.txt');
  });

  it('covers the four paste types only (binaries stay upload-only)', () => {
    expect([...PASTE_UPLOAD_TYPES]).toEqual(['text/plain', 'text/markdown', 'text/csv', 'application/json']);
  });
});

/**
 * K-BUG2 — a network throw during the presigned POST must terminal the
 * tracker row (failed + verbatim error), not strand it on 'uploading'.
 */
import { beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAttachmentUpload } from './useAttachmentUpload';

const engineMock = vi.fn();

vi.mock('@lib/engine/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@lib/engine/client')>();
  return { ...actual, engine: (...args: unknown[]) => engineMock(...args) };
});

vi.mock('@/Context/OrgContext', () => ({
  useOrg: () => ({ orgId: 'org-test', role: 'owner' }),
}));

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const PRESIGN = {
  session: { id: 'sess-1', state: 'CREATED', source_slug: 'doc-one' },
  upload: { url: 'https://storage.example/upload', fields: { key: 'k', policy: 'p' }, expiresIn: 60 },
};

beforeEach(() => {
  engineMock.mockReset();
  engineMock.mockResolvedValue(PRESIGN);
  vi.unstubAllGlobals();
});

describe('useAttachmentUpload presigned transfer (K-BUG2)', () => {
  it('fails the tracker row with the verbatim error when the byte transfer throws', async () => {
    const networkError = new Error('fetch failed: connection reset');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(networkError));
    const { result } = renderHook(() => useAttachmentUpload(), { wrapper: wrapper() });
    const file = new File(['hello'], 'doc-one.txt', { type: 'text/plain' });
    await act(async () => {
      await expect(result.current.attach({ file })).rejects.toThrow('fetch failed: connection reset');
    });
    const row = result.current.uploads.find((u) => u.sessionId === 'sess-1');
    expect(row).toBeDefined();
    expect(row?.status).toBe('failed');
    expect(row?.lastError).toBe('fetch failed: connection reset');
  });

  it('still fails the row on a non-OK transfer response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false } as Response));
    const { result } = renderHook(() => useAttachmentUpload(), { wrapper: wrapper() });
    const file = new File(['hello'], 'doc-one.txt', { type: 'text/plain' });
    let sessionId: string | null = null;
    await act(async () => {
      sessionId = await result.current.attach({ file });
    });
    expect(sessionId).toBe('sess-1');
    const row = result.current.uploads.find((u) => u.sessionId === 'sess-1');
    expect(row?.status).toBe('failed');
    expect(row?.lastError).toBe('The byte transfer was rejected — retry the upload.');
  });
});
