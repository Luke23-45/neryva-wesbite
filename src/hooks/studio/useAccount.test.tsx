// @vitest-environment jsdom
/**
 * Email-change body-shape coverage (console field audit P0 rows 6–7):
 * the engine requires `current_password` (when a password is set) and a
 * live `code` (when TOTP is enrolled) on the request step, and BOTH
 * `new_email` + `code` on the confirm step. These tests pin the exact
 * request bodies the hooks send.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRequestEmailChange, useConfirmEmailChange } from './useAccount';

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
