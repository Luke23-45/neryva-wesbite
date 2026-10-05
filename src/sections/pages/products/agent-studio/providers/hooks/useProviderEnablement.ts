import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  setProviderEnabled,
  type ProviderDirectoryEntry,
} from '../api';
import { providerDirectoryKeyPrefix } from './useProviderDirectory';

type DirectoryData = { providers: ProviderDirectoryEntry[] };
type DirectoryConnection = ProviderDirectoryEntry['connection'];

/**
 * useSetProviderEnabled — workspace access toggle for one catalog row
 * (POST /provider-credentials/providers/:provider, owner/admin only).
 *
 * Optimistic + rollback, mirroring the N-6 model-toggle hook: the directory
 * cache's `connection.enabled` AND `connection.stored_enabled` flip
 * immediately and roll back on failure. Both flip because the switch
 * renders from the stored value — flipping only `enabled` would leave a
 * grandfathered row visually stuck until refetch.
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
      if (orgId === null || orgId === '') return { prevConnections: new Map<string, DirectoryConnection>() };
      const prefix = providerDirectoryKeyPrefix(orgId);
      await queryClient.cancelQueries({ queryKey: prefix });
      // Per-row snapshot: only the toggled provider's connection is stored.
      // A concurrent toggle's optimistic flip on another row (or another
      // query variant) must survive this mutation's rollback — restoring
      // whole-query snapshots (the old behavior) wiped it.
      const prevConnections = new Map<string, DirectoryConnection>();
      const snapshots = queryClient.getQueriesData<DirectoryData>({ queryKey: prefix });
      for (const [key, data] of snapshots) {
        if (!data) continue;
        const entry = data.providers.find((e) => e.provider === provider);
        if (entry) prevConnections.set(JSON.stringify(key), entry.connection);
        queryClient.setQueryData<DirectoryData>(key, {
          ...data,
          providers: data.providers.map((e) =>
            e.provider === provider
              ? {
                  ...e,
                  connection: { ...e.connection, enabled, stored_enabled: enabled },
                }
              : e,
          ),
        });
      }
      return { prevConnections };
    },
    onError: (_error, variables, context) => {
      if (orgId === null || orgId === '' || !context?.prevConnections || context.prevConnections.size === 0) return;
      // Per-row restore: only the row this mutation flipped reverts — a
      // concurrent mutation's optimistic state is untouched.
      for (const [keyJson, connection] of context.prevConnections) {
        queryClient.setQueryData<DirectoryData>(JSON.parse(keyJson) as readonly unknown[], (data) =>
          data
            ? {
                ...data,
                providers: data.providers.map((e) =>
                  e.provider === variables.provider ? { ...e, connection } : e,
                ),
              }
            : data,
        );
      }
    },
    onSettled: () => {
      if (orgId === null || orgId === '') return;
      void queryClient.invalidateQueries({ queryKey: providerDirectoryKeyPrefix(orgId) });
    },
  });
}
