/**
 * Org team furniture — the write surfaces not yet in @hooks/engine
 * (ledger T-6). Members/invites/groups/service-account reads and most
 * mutations live there; this module only completes the gap.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

export function useDeleteServiceAccount() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serviceAccountId: string) =>
      engine(`/console/org/${orgId}/service-accounts/${serviceAccountId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['engine', 'service-accounts'] });
      void queryClient.invalidateQueries({ queryKey: ['engine', 'org-summary'] });
    },
    onError: (error) => toastEngineError(error, 'Could not delete the service account'),
  });
}
