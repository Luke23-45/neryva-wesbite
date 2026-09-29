// @vitest-environment jsdom
/**
 * MFA body-shape coverage (console field audit P0 rows 34–35):
 * - disable requires a live TOTP/recovery `code` IN THE BODY — the step-up
 *   proof header is not read by the endpoint, so none is minted here;
 * - rotate requires a live `code` in the body and returns fresh codes;
 * - activate returns the recovery codes exactly once; the hook parses them
 *   so the UI can display them at their single moment of existence.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  parseRecoveryCodes,
  useActivateTotp,
  useDisableTotp,
  useRotateRecoveryCodes,
} from './useMfa';

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
});

describe('parseRecoveryCodes', () => {
  it('reads the engine recovery_codes shape', () => {
    expect(parseRecoveryCodes({ recovery_codes: ['a', 'b'] })).toEqual({ codes: ['a', 'b'] });
  });

  it('tolerates the codes alias and drops non-strings', () => {
    expect(parseRecoveryCodes({ codes: ['a', 1, null, 'b'] })).toEqual({ codes: ['a', 'b'] });
  });

  it('yields no codes on junk — never a guess', () => {
    expect(parseRecoveryCodes(null)).toEqual({ codes: [] });
    expect(parseRecoveryCodes({})).toEqual({ codes: [] });
  });
});

describe('useActivateTotp', () => {
  it('returns the parsed recovery codes — the only moment they exist', async () => {
    engineMock.mockResolvedValue({ recovery_codes: ['r1', 'r2', 'r3'] });
    const { result } = renderHook(() => useActivateTotp(), { wrapper: wrapper() });
    let out: { codes: string[] } | undefined;
    await act(async () => {
      out = await result.current.mutateAsync('123456');
    });
    expect(engineMock).toHaveBeenCalledWith('/auth/mfa/totp/activate', {
      method: 'POST',
      body: { code: '123456' },
    });
    expect(out).toEqual({ codes: ['r1', 'r2', 'r3'] });
  });
});

describe('useDisableTotp', () => {
  it('sends the live code in the request body — no step-up detour', async () => {
    engineMock.mockResolvedValue({ ok: true });
    const { result } = renderHook(() => useDisableTotp(), { wrapper: wrapper() });
    await act(async () => {
      await result.current.mutateAsync({ code: '654321' });
    });
    expect(engineMock).toHaveBeenCalledTimes(1);
    expect(engineMock).toHaveBeenCalledWith('/auth/mfa/totp/disable', {
      method: 'POST',
      body: { code: '654321' },
    });
    // No step-up proof minted for this endpoint — the header is unread there.
    expect(engineMock.mock.calls.some(([url]) => String(url).includes('/auth/mfa/proof'))).toBe(false);
  });
});

describe('useRotateRecoveryCodes', () => {
  it('sends the live code in the body and returns the fresh codes', async () => {
    engineMock.mockResolvedValue({ recovery_codes: ['n1', 'n2'] });
    const { result } = renderHook(() => useRotateRecoveryCodes(), { wrapper: wrapper() });
    let out: { codes: string[] } | undefined;
    await act(async () => {
      out = await result.current.mutateAsync({ code: '111222' });
    });
    expect(engineMock).toHaveBeenCalledWith('/auth/mfa/recovery/rotate', {
      method: 'POST',
      body: { code: '111222' },
    });
    expect(out).toEqual({ codes: ['n1', 'n2'] });
  });
});
