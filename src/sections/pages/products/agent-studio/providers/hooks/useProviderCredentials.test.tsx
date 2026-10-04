// @vitest-environment jsdom
/**
 * Providers Phase 5 — Wave B: useProviderCredentials targeted tests.
 * - list query calls fetchCredentials with the org id
 * - every mutation invalidates the credential list query on success
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  providerCredentialsKeys,
  useCredentialMutations,
  useCredentials,
} from './useProviderCredentials';

const hoisted = vi.hoisted(() => ({
  fetchCredentials: vi.fn(),
  createCredential: vi.fn(),
  patchCredential: vi.fn(),
  verifyCredential: vi.fn(),
  rotateCredential: vi.fn(),
  revokeCredential: vi.fn(),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/api', () => ({
  fetchCredentials: hoisted.fetchCredentials,
  createCredential: hoisted.createCredential,
  patchCredential: hoisted.patchCredential,
  verifyCredential: hoisted.verifyCredential,
  rotateCredential: hoisted.rotateCredential,
  revokeCredential: hoisted.revokeCredential,
}));

function wrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { Wrapper, invalidateSpy };
}

beforeEach(() => {
  vi.clearAllMocks();
  hoisted.fetchCredentials.mockResolvedValue({ credentials: [] });
  hoisted.createCredential.mockResolvedValue({ credential: { id: 'new' } });
  hoisted.patchCredential.mockResolvedValue({ credential: { id: 'c1' } });
  hoisted.verifyCredential.mockResolvedValue({ credential: { id: 'c1' } });
  hoisted.rotateCredential.mockResolvedValue({ credential: { id: 'c1' } });
  hoisted.revokeCredential.mockResolvedValue({ credential: { id: 'c1' } });
});

describe('useCredentials', () => {
  it('fetches with the org id and stays disabled without one', async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCredentials('org-1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(hoisted.fetchCredentials).toHaveBeenCalledWith('org-1');
    expect(result.current.data).toEqual({ credentials: [] });
  });

  it('is disabled when orgId is null', () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useCredentials(null), { wrapper: Wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(hoisted.fetchCredentials).not.toHaveBeenCalled();
  });
});

describe('mutations invalidate the list query', () => {
  const listKey = providerCredentialsKeys.list('org-1');

  it('create invalidates', async () => {
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useCredentialMutations('org-1'), { wrapper: Wrapper });
    await act(async () => {
      await result.current.create.mutateAsync({ provider: 'openai', label: 'K', secret: 's' });
    });
    expect(hoisted.createCredential).toHaveBeenCalledWith('org-1', {
      provider: 'openai',
      label: 'K',
      secret: 's',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: listKey });
  });

  it('patch invalidates', async () => {
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useCredentialMutations('org-1'), { wrapper: Wrapper });
    await act(async () => {
      await result.current.patch.mutateAsync({ id: 'c1', patch: { enabled: false } });
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: listKey });
  });

  it('verify invalidates', async () => {
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useCredentialMutations('org-1'), { wrapper: Wrapper });
    await act(async () => {
      await result.current.verify.mutateAsync('c1');
    });
    expect(hoisted.verifyCredential).toHaveBeenCalledWith('org-1', 'c1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: listKey });
  });

  it('rotate invalidates', async () => {
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useCredentialMutations('org-1'), { wrapper: Wrapper });
    await act(async () => {
      await result.current.rotate.mutateAsync({ id: 'c1', secret: 'new-secret' });
    });
    expect(hoisted.rotateCredential).toHaveBeenCalledWith('org-1', 'c1', 'new-secret');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: listKey });
  });

  it('revoke invalidates', async () => {
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useCredentialMutations('org-1'), { wrapper: Wrapper });
    await act(async () => {
      await result.current.revoke.mutateAsync({ id: 'c1', reason: 'leaked' });
    });
    expect(hoisted.revokeCredential).toHaveBeenCalledWith('org-1', 'c1', 'leaked');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: listKey });
  });
});
