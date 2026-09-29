// @vitest-environment jsdom
/**
 * useSaveWelcomeNames error classification (console patch wave 7, gap 5):
 * both welcome-write server paths emit validation failures as HTTP 400
 * `validation_failed` — never 422 — so the branch must match the engine
 * envelope code, not the status.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from '@lib/engine/client';
import { useSaveWelcomeNames } from './useFirstRun';

const engineMock = vi.fn();

vi.mock('@lib/engine/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@lib/engine/client')>();
  return { ...actual, engine: (...args: unknown[]) => engineMock(...args) };
});

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  engineMock.mockReset();
});

const INPUT = { displayName: 'Ada', workspaceName: 'Lab', orgId: 'org-1' };

describe('useSaveWelcomeNames — validation failure classification', () => {
  it('surfaces a 400 validation_failed on the name write as nameError (never 422)', async () => {
    engineMock.mockImplementation((url: string) => {
      if (url === '/auth/me') {
        return Promise.reject(
          new ApiError(400, 'validation_failed', 'Request validation failed', {
            display_name: '1..256 characters',
          }),
        );
      }
      return Promise.resolve({ ok: true });
    });
    const { result } = renderHook(() => useSaveWelcomeNames(), { wrapper: wrapper() });
    let outcome: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
    await act(async () => {
      outcome = await result.current.mutateAsync(INPUT);
    });
    expect(outcome?.nameError).toBe('Request validation failed');
    expect(outcome?.workspaceError).toBeNull();
    expect(outcome?.transportFailed).toBe(false);
    expect(outcome?.nameSaved).toBe(false);
    expect(outcome?.workspaceSaved).toBe(true);
  });

  it('surfaces a 400 validation_failed on the workspace write as workspaceError', async () => {
    engineMock.mockImplementation((url: string) => {
      if (url === '/console/org/org-1/settings') {
        return Promise.reject(
          new ApiError(400, 'validation_failed', 'Request validation failed', {
            name: 'organization name is required',
          }),
        );
      }
      return Promise.resolve({ ok: true });
    });
    const { result } = renderHook(() => useSaveWelcomeNames(), { wrapper: wrapper() });
    let outcome: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
    await act(async () => {
      outcome = await result.current.mutateAsync(INPUT);
    });
    expect(outcome?.workspaceError).toBe('Request validation failed');
    expect(outcome?.nameError).toBeNull();
    expect(outcome?.transportFailed).toBe(false);
    expect(outcome?.nameSaved).toBe(true);
    expect(outcome?.workspaceSaved).toBe(false);
  });

  it('treats a non-validation failure as transportFailed with no field error', async () => {
    engineMock.mockImplementation((url: string) => {
      if (url === '/auth/me') {
        return Promise.reject(new ApiError(500, 'internal_error', 'boom'));
      }
      return Promise.resolve({ ok: true });
    });
    const { result } = renderHook(() => useSaveWelcomeNames(), { wrapper: wrapper() });
    let outcome: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
    await act(async () => {
      outcome = await result.current.mutateAsync(INPUT);
    });
    expect(outcome?.nameError).toBeNull();
    expect(outcome?.workspaceError).toBeNull();
    expect(outcome?.transportFailed).toBe(true);
  });

  it('marks both writes saved when neither rejects', async () => {
    engineMock.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useSaveWelcomeNames(), { wrapper: wrapper() });
    let outcome: Awaited<ReturnType<typeof result.current.mutateAsync>> | undefined;
    await act(async () => {
      outcome = await result.current.mutateAsync(INPUT);
    });
    expect(outcome).toMatchObject({
      nameError: null,
      workspaceError: null,
      transportFailed: false,
      nameSaved: true,
      workspaceSaved: true,
      savedName: 'Ada',
    });
    expect(engineMock).toHaveBeenCalledWith('/auth/me', {
      method: 'PATCH',
      body: { display_name: 'Ada' },
      idempotent: true,
    });
    expect(engineMock).toHaveBeenCalledWith('/console/org/org-1/settings', {
      method: 'PATCH',
      body: { name: 'Lab' },
      idempotent: true,
      orgId: 'org-1',
    });
  });
});
