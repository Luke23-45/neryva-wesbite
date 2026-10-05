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
  useAssistantRefs,
  useCredentialMutations,
  useCredentials,
  useOptimisticEnabledToggle,
  usePatchCredentialField,
  useReorderPriorities,
} from './useProviderCredentials';

const hoisted = vi.hoisted(() => ({
  fetchAssistants: vi.fn(),
  fetchCredentials: vi.fn(),
  createCredential: vi.fn(),
  patchCredential: vi.fn(),
  reorderCredentials: vi.fn(),
  verifyCredential: vi.fn(),
  rotateCredential: vi.fn(),
  revokeCredential: vi.fn(),
}));

vi.mock('@/sections/pages/products/agent-studio/providers/api', () => ({
  fetchAssistants: hoisted.fetchAssistants,
  fetchCredentials: hoisted.fetchCredentials,
  createCredential: hoisted.createCredential,
  patchCredential: hoisted.patchCredential,
  reorderCredentials: hoisted.reorderCredentials,
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
  hoisted.fetchAssistants.mockResolvedValue({ assistants: [{ id: 'asst-1', name: 'Support' }] });
  hoisted.fetchCredentials.mockResolvedValue({ credentials: [] });
  hoisted.createCredential.mockResolvedValue({ credential: { id: 'new' } });
  hoisted.patchCredential.mockResolvedValue({ credential: { id: 'c1' } });
  hoisted.reorderCredentials.mockResolvedValue({ credentials: [] });
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
      await result.current.create.mutateAsync({ input: { provider: 'openai', label: 'K', secret: 's' } });
    });
    // P1-3: idempotency opts ride along; P2: step-up recovery wraps the call.
    expect(hoisted.createCredential).toHaveBeenCalledWith(
      'org-1',
      { provider: 'openai', label: 'K', secret: 's' },
      { idempotencyKey: undefined, mfaProof: undefined },
    );
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
    expect(hoisted.verifyCredential).toHaveBeenCalledWith('org-1', 'c1', { mfaProof: undefined });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: listKey });
  });

  it('rotate invalidates', async () => {
    const { Wrapper, invalidateSpy } = wrapper();
    const { result } = renderHook(() => useCredentialMutations('org-1'), { wrapper: Wrapper });
    await act(async () => {
      await result.current.rotate.mutateAsync({ id: 'c1', secret: 'new-secret' });
    });
    expect(hoisted.rotateCredential).toHaveBeenCalledWith('org-1', 'c1', 'new-secret', { mfaProof: undefined });
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

describe('useOptimisticEnabledToggle (P1-6)', () => {
  function seedList(client: QueryClient) {
    client.setQueryData(providerCredentialsKeys.list('org-1'), {
      credentials: [{ id: 'c1', enabled: true }],
    });
  }

  it('flips the cached enabled flag immediately and persists on success', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    seedList(client);
    // Server truth after the successful write.
    hoisted.fetchCredentials.mockResolvedValue({ credentials: [{ id: 'c1', enabled: false }] });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useOptimisticEnabledToggle('org-1'), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync({ id: 'c1', enabled: false });
    });
    expect(hoisted.patchCredential).toHaveBeenCalledWith('org-1', 'c1', { enabled: false });
    await waitFor(() =>
      expect(
        client.getQueryData<{ credentials: Array<{ id: string; enabled: boolean }> }>(
          providerCredentialsKeys.list('org-1'),
        )?.credentials[0]?.enabled,
      ).toBe(false),
    );
  });

  it('rolls the cache back to the snapshot when the patch fails', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    seedList(client);
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    hoisted.patchCredential.mockRejectedValueOnce(new Error('nope'));
    const { result } = renderHook(() => useOptimisticEnabledToggle('org-1'), { wrapper: Wrapper });
    await act(async () => {
      try {
        await result.current.mutateAsync({ id: 'c1', enabled: false });
      } catch {
        // Expected — the rollback is the assertion.
      }
    });
    const cached = client.getQueryData<{ credentials: Array<{ id: string; enabled: boolean }> }>(
      providerCredentialsKeys.list('org-1'),
    );
    expect(cached?.credentials[0]?.enabled).toBe(true);
  });
});

describe('usePatchCredentialField (P1-6)', () => {
  it('returns independent mutation instances per call', () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(
      () => ({ a: usePatchCredentialField('org-1'), b: usePatchCredentialField('org-1') }),
      { wrapper: Wrapper },
    );
    // Distinct instances: one concern's isPending never freezes another's.
    expect(result.current.a).not.toBe(result.current.b);
    expect(result.current.a.isPending).toBe(false);
    expect(result.current.b.isPending).toBe(false);
  });
});

describe('useAssistantRefs (P2)', () => {
  it('fetches the org assistants for scope validation', async () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useAssistantRefs('org-1'), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(hoisted.fetchAssistants).toHaveBeenCalledWith('org-1');
    expect(result.current.data?.assistants).toEqual([{ id: 'asst-1', name: 'Support' }]);
  });

  it('stays disabled without an org id', () => {
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => useAssistantRefs(null), { wrapper: Wrapper });
    expect(result.current.fetchStatus).toBe('idle');
    expect(hoisted.fetchAssistants).not.toHaveBeenCalled();
  });
});

describe('useReorderPriorities (P1-3)', () => {
  function seedList(client: QueryClient) {
    client.setQueryData(providerCredentialsKeys.list('org-1'), {
      credentials: [
        { id: 'c1', priority: 0 },
        { id: 'c2', priority: 1 },
      ],
    });
  }

  function renderReorder(client: QueryClient) {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return renderHook(() => useReorderPriorities('org-1'), { wrapper: Wrapper });
  }

  it('sends the full order map in ONE request (atomic, no two-PATCH swap)', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    seedList(client);
    const { result } = renderReorder(client);
    const items = [
      { id: 'c2', priority: 0 },
      { id: 'c1', priority: 1 },
    ];
    await act(async () => {
      await result.current.mutateAsync(items);
    });
    expect(hoisted.reorderCredentials).toHaveBeenCalledTimes(1);
    expect(hoisted.reorderCredentials).toHaveBeenCalledWith('org-1', items);
  });

  it('rolls the list cache back to the pre-drop order when the reorder fails', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    seedList(client);
    hoisted.reorderCredentials.mockRejectedValueOnce(new Error('boom'));
    const { result } = renderReorder(client);
    await act(async () => {
      try {
        await result.current.mutateAsync([
          { id: 'c2', priority: 0 },
          { id: 'c1', priority: 1 },
        ]);
      } catch {
        // Expected — the rollback is the assertion.
      }
    });
    const cached = client.getQueryData<{ credentials: Array<{ id: string; priority: number }> }>(
      providerCredentialsKeys.list('org-1'),
    );
    expect(cached?.credentials).toEqual([
      { id: 'c1', priority: 0 },
      { id: 'c2', priority: 1 },
    ]);
  });

  it('leaves cards outside the reorder map untouched', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    client.setQueryData(providerCredentialsKeys.list('org-1'), {
      credentials: [
        { id: 'c1', priority: 0 },
        { id: 'c2', priority: 1 },
        { id: 'c3', priority: 0 },
      ],
    });
    const { result } = renderReorder(client);
    await act(async () => {
      await result.current.mutateAsync([
        { id: 'c2', priority: 0 },
        { id: 'c1', priority: 1 },
      ]);
    });
    const cached = client.getQueryData<{ credentials: Array<{ id: string; priority: number }> }>(
      providerCredentialsKeys.list('org-1'),
    );
    expect(cached?.credentials).toEqual([
      { id: 'c1', priority: 1 },
      { id: 'c2', priority: 0 },
      { id: 'c3', priority: 0 },
    ]);
  });
});
