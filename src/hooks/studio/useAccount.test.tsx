// @vitest-environment jsdom
/**
 * Account hook coverage (console field audit):
 * - P0 rows 6–7: email-change request sends `new_email` + optional
 *   `current_password` / TOTP-recovery `code`; confirm sends BOTH
 *   `new_email` + `code`.
 * - P1-7: `parseAccount` never yields `pendingEmail` (the engine has no such
 *   field — the banner was dead code).
 * - P1-9: deletion sends the engine's `{ password?, code? }` re-auth body —
 *   never the old junk `confirmation` field.
 * - P1-10: `parseDeletionStatus` reads the real `{ deletion:
 *   { scheduled_purge_at } | null }` shape — pending iff the object exists.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  parseAccount,
  parseDeletionStatus,
  useRequestEmailChange,
  useConfirmEmailChange,
  useRequestAccountDeletion,
} from './useAccount';

const engineMock = vi.fn();

vi.mock('@lib/engine/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@lib/engine/client')>();
  return { ...actual, engine: (...args: unknown[]) => engineMock(...args) };
});

vi.mock('react-hot-toast', () => {
  const fn = vi.fn() as never;
  const success = vi.fn() as never;
  const error = vi.fn() as never;
  return { default: Object.assign(fn, { success, error }) };
});

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  engineMock.mockReset();
  engineMock.mockResolvedValue({ ok: true });
});

describe('useRequestEmailChange', () => {
  it('sends only new_email when no re-auth factors are given', async () => {
    const { result } = renderHook(() => useRequestEmailChange(), { wrapper: wrapper() });
    await act(async () => {
      await result.current.mutateAsync({ newEmail: 'new@example.com' });
    });
    expect(engineMock).toHaveBeenCalledTimes(1);
    expect(engineMock).toHaveBeenCalledWith('/auth/me/email-change/request', {
      method: 'POST',
      body: { new_email: 'new@example.com' },
    });
  });

  it('sends current_password and code when the caller collects them', async () => {
    const { result } = renderHook(() => useRequestEmailChange(), { wrapper: wrapper() });
    await act(async () => {
      await result.current.mutateAsync({
        newEmail: ' new@example.com ',
        currentPassword: 's3cret',
        code: '123456',
      });
    });
    expect(engineMock).toHaveBeenCalledWith('/auth/me/email-change/request', {
      method: 'POST',
      body: { new_email: 'new@example.com', current_password: 's3cret', code: '123456' },
    });
  });

  it('omits blank re-auth factors — an empty string must not be sent', async () => {
    const { result } = renderHook(() => useRequestEmailChange(), { wrapper: wrapper() });
    await act(async () => {
      await result.current.mutateAsync({ newEmail: 'n@e.co', currentPassword: '   ', code: '' });
    });
    expect(engineMock).toHaveBeenCalledWith('/auth/me/email-change/request', {
      method: 'POST',
      body: { new_email: 'n@e.co' },
    });
  });
});

describe('useConfirmEmailChange', () => {
  it('sends BOTH new_email and code — the engine 400s otherwise', async () => {
    const { result } = renderHook(() => useConfirmEmailChange(), { wrapper: wrapper() });
    await act(async () => {
      await result.current.mutateAsync({ newEmail: 'new@example.com', code: '12345678' });
    });
    expect(engineMock).toHaveBeenCalledTimes(1);
    expect(engineMock).toHaveBeenCalledWith('/auth/me/email-change/confirm', {
      method: 'POST',
      body: { new_email: 'new@example.com', code: '12345678' },
    });
  });
});

describe('parseAccount (P1-7)', () => {
  it('never yields a pendingEmail — the engine has no such field', () => {
    const account = parseAccount({
      account: {
        id: 'acc-1',
        email: 'you@example.com',
        email_verified: true,
        display_name: 'You',
        mfa_level: 'totp',
        status: 'active',
        // Even if a phantom field arrived, it must not leak into the shape.
        pending_email: 'new@example.com',
        pendingEmail: 'new@example.com',
      },
    });
    expect(account).not.toBeNull();
    expect(account).not.toHaveProperty('pendingEmail');
    expect(account?.email).toBe('you@example.com');
  });
});

describe('parseDeletionStatus (P1-10)', () => {
  it('reads the real engine shape: deletion object → scheduled with the purge date', () => {
    expect(
      parseDeletionStatus({ deletion: { scheduled_purge_at: '2026-11-28T00:00:00.000Z' } }),
    ).toEqual({ status: 'scheduled', scheduledPurgeAt: '2026-11-28T00:00:00.000Z' });
  });

  it('tolerates the camelCase variant of the timestamp', () => {
    expect(parseDeletionStatus({ deletion: { scheduledPurgeAt: '2026-11-28T00:00:00.000Z' } })).toEqual({
      status: 'scheduled',
      scheduledPurgeAt: '2026-11-28T00:00:00.000Z',
    });
  });

  it('yields none when the engine returns a null deletion', () => {
    expect(parseDeletionStatus({ deletion: null })).toEqual({ status: 'none', scheduledPurgeAt: null });
  });

  it('yields none on missing, null, or garbage input', () => {
    expect(parseDeletionStatus({})).toEqual({ status: 'none', scheduledPurgeAt: null });
    expect(parseDeletionStatus(null)).toEqual({ status: 'none', scheduledPurgeAt: null });
    expect(parseDeletionStatus('x')).toEqual({ status: 'none', scheduledPurgeAt: null });
  });

  it('treats any deletion object as pending — there is no status field to read', () => {
    // The old parser read `deletion.status` and always fell back to 'none'.
    expect(parseDeletionStatus({ deletion: { status: 'pending' } })).toEqual({
      status: 'scheduled',
      scheduledPurgeAt: null,
    });
  });
});

describe('useRequestAccountDeletion (P1-9)', () => {
  it('sends password and code — the engine 403s without re-auth', async () => {
    const { result } = renderHook(() => useRequestAccountDeletion(), { wrapper: wrapper() });
    await act(async () => {
      await result.current.mutateAsync({ currentPassword: ' s3cret ', code: '123456' });
    });
    expect(engineMock).toHaveBeenCalledTimes(1);
    expect(engineMock).toHaveBeenCalledWith('/auth/me/delete', {
      method: 'POST',
      body: { password: 's3cret', code: '123456' },
    });
  });

  it('sends only the password when no MFA code is given', async () => {
    const { result } = renderHook(() => useRequestAccountDeletion(), { wrapper: wrapper() });
    await act(async () => {
      await result.current.mutateAsync({ currentPassword: 's3cret' });
    });
    expect(engineMock).toHaveBeenCalledWith('/auth/me/delete', {
      method: 'POST',
      body: { password: 's3cret' },
    });
  });

  it('omits blank factors — an empty string must not be sent', async () => {
    const { result } = renderHook(() => useRequestAccountDeletion(), { wrapper: wrapper() });
    await act(async () => {
      await result.current.mutateAsync({ currentPassword: '   ', code: '' });
    });
    expect(engineMock).toHaveBeenCalledWith('/auth/me/delete', {
      method: 'POST',
      body: {},
    });
  });

  it('never sends the old junk confirmation field', async () => {
    const { result } = renderHook(() => useRequestAccountDeletion(), { wrapper: wrapper() });
    await act(async () => {
      await result.current.mutateAsync({ currentPassword: 's3cret' });
    });
    const body = engineMock.mock.calls[0][1].body as Record<string, unknown>;
    expect(body).not.toHaveProperty('confirmation');
  });
});
