import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  setProviderEnabled,
  type ProviderDirectoryEntry,
} from '../api';
import { providerDirectoryKeyPrefix } from './useProviderDirectory';

type DirectoryData = { providers: ProviderDirectoryEntry[] };

/**
 * useSetProviderEnabled — workspace access toggle for one catalog row
 * (POST /provider-credentials/providers/:provider, owner/admin only).
 *
 * Optimistic + rollback, mirroring the N-6 model-toggle hook: the directory
 * cache's `connection.enabled` flips immediately and rolls back on failure.
 * The caller owns the error copy (sanitized at render time — never the raw
 * engine message).
 */
export function useSetProviderEnabled(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { provider: string; enabled: boolean }) => {
      if (orgId === null || orgId === '') throw new Error('orgId is required');
      return setProviderEnabled(orgId, input.provider, input.enabled);
    },
    onMutate: async ({ provider, enabled }) => {
      if (orgId === null || orgId === '') return { prev: new Map<string, DirectoryData | undefined>() };
      const prefix = providerDirectoryKeyPrefix(orgId);
      await queryClient.cancelQueries({ queryKey: prefix });
      const prev = new Map<string, DirectoryData | undefined>();
      const snapshots = queryClient.getQueriesData<DirectoryData>({ queryKey: prefix });
      for (const [key, data] of snapshots) {
        prev.set(JSON.stringify(key), data);
        if (data) {
          queryClient.setQueryData<DirectoryData>(key, {
            ...data,
            providers: data.providers.map((entry) =>
              entry.provider === provider
                ? { ...entry, connection: { ...entry.connection, enabled } }
                : entry,
            ),
          });
        }
      }
      return { prev };
    },
    onError: (_error, _variables, context) => {
      if (orgId === null || orgId === '' || !context?.prev) return;
      for (const [keyJson, data] of context.prev) {
        queryClient.setQueryData(JSON.parse(keyJson) as readonly unknown[], data);
      }
    },
    onSettled: () => {
      if (orgId === null || orgId === '') return;
      void queryClient.invalidateQueries({ queryKey: providerDirectoryKeyPrefix(orgId) });
    },
  });
}
