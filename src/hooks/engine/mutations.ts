/**
 * Engine mutation hooks — every write surface the /platform area performs.
 * Toasts fire on success/error here so pages stay declarative; the query
 * cache is invalidated per domain after a successful write.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { engine, ApiError } from '@lib/engine/client';
import { useOrgRequired } from './queries';

function useEngineMutation<TInput, TOutput>(
  buildCall: (orgId: string, input: TInput) => { path: string; init?: Parameters<typeof engine>[1] },
  invalidates: string[],
  successMessage?: string,
) {
  const orgId = useOrgRequired();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TInput) => {
      const { path, init } = buildCall(orgId, input);
      return engine<TOutput>(path, init);
    },
    onSuccess: () => {
      if (successMessage) {
        toast.success(successMessage);
      }
      for (const key of invalidates) {
        void queryClient.invalidateQueries({ queryKey: ['engine', key] });
      }
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Something went wrong — try again.';
      toast.error(message);
    },
  });
}

// ── Invites ─────────────────────────────────────────────────────────────────

export function useInviteMember() {
  return useEngineMutation<{ email: string; role: string; mfaProof?: string }, { inviteId: string }>(
    (orgId, input) => ({
      path: `/console/org/${orgId}/invites`,
      init: { method: 'POST', body: { email: input.email, role: input.role }, idempotent: true, ...(input.mfaProof ? { mfaProof: input.mfaProof } : {}) },
    }),
    ['invites', 'org-summary'],
    'Invitation sent',
  );
}

export function useResendInvite() {
  return useEngineMutation<{ inviteId: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/invites/${input.inviteId}/resend`, init: { method: 'POST' } }),
    ['invites'],
    'Invitation re-sent with a fresh link',
  );
}

export function useExtendInvite() {
  return useEngineMutation<{ inviteId: string; days: number }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/invites/${input.inviteId}/extend`, init: { method: 'POST', body: { days: input.days } } }),
    ['invites'],
    'Invitation extended',
  );
}

export function useRevokeInvite() {
  return useEngineMutation<{ inviteId: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/invites/${input.inviteId}/revoke`, init: { method: 'POST' } }),
    ['invites', 'org-summary'],
    'Invitation revoked',
  );
}

// ── Members ─────────────────────────────────────────────────────────────────

export function useChangeRole() {
  return useEngineMutation<{ accountId: string; role: string; mfaProof?: string }, unknown>(
    (orgId, input) => ({
      path: `/console/org/${orgId}/members/${input.accountId}/role`,
      init: { method: 'PATCH', body: { role: input.role }, ...(input.mfaProof ? { mfaProof: input.mfaProof } : {}) },
    }),
    ['members', 'home'],
    'Role updated',
  );
}

export function useSuspendMember() {
  return useEngineMutation<{ accountId: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/members/${input.accountId}/suspend`, init: { method: 'POST' } }),
    ['members', 'org-summary'],
    'Member suspended',
  );
}

export function useReactivateMember() {
  return useEngineMutation<{ accountId: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/members/${input.accountId}/reactivate`, init: { method: 'POST' } }),
    ['members', 'org-summary'],
    'Member reactivated',
  );
}

export function useRemoveMember() {
  return useEngineMutation<{ accountId: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/members/${input.accountId}/remove`, init: { method: 'POST' } }),
    ['members', 'org-summary', 'groups'],
    'Member removed',
  );
}

export function useLeaveOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const orgId = useOrgRequired();
      return engine(`/console/org/${orgId}/members/leave`, { method: 'POST' });
    },
    onSuccess: () => {
      toast.success('You left the organization');
      window.localStorage.removeItem('neryva.active_org');
      void queryClient.invalidateQueries({ queryKey: ['engine'] });
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Could not leave the organization'),
  });
}

// ── Projects ────────────────────────────────────────────────────────────────

export function useCreateProject() {
  return useEngineMutation<{ name: string; description?: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/projects`, init: { method: 'POST', body: input, idempotent: true } }),
    ['projects', 'home'],
    'Project created',
  );
}

export function useUpdateProject() {
  return useEngineMutation<{ projectId: string; name?: string; description?: string }, unknown>(
    (orgId, input) => {
      const { projectId, ...body } = input;
      return { path: `/console/org/${orgId}/projects/${projectId}`, init: { method: 'PATCH', body } };
    },
    ['projects'],
    'Project updated',
  );
}

export function useArchiveProject() {
  return useEngineMutation<{ projectId: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/projects/${input.projectId}/archive`, init: { method: 'POST' } }),
    ['projects'],
    'Project archived',
  );
}

export function useUnarchiveProject() {
  return useEngineMutation<{ projectId: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/projects/${input.projectId}/unarchive`, init: { method: 'POST' } }),
    ['projects'],
    'Project restored',
  );
}

// ── API keys ────────────────────────────────────────────────────────────────

export function useIssueKey() {
  return useEngineMutation<{ name: string; role: string; scopes: string[]; expires_at?: string; mfaProof?: string }, { id: string; key: string }>(
    (orgId, input) => {
      const { mfaProof, ...body } = input;
      return { path: `/console/org/${orgId}/keys`, init: { method: 'POST', body, idempotent: true, ...(mfaProof ? { mfaProof } : {}) } };
    },
    ['keys'],
  );
}

export function useRevokeKey() {
  return useEngineMutation<{ keyId: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/keys/${input.keyId}/revoke`, init: { method: 'POST' } }),
    ['keys'],
    'Key revoked',
  );
}

// ── Groups ──────────────────────────────────────────────────────────────────

export function useCreateGroup() {
  return useEngineMutation<{ name: string; description?: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/groups`, init: { method: 'POST', body: input, idempotent: true } }),
    ['groups', 'org-summary'],
    'Group created',
  );
}

export function useDeleteGroup() {
  return useEngineMutation<{ groupId: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/groups/${input.groupId}`, init: { method: 'DELETE' } }),
    ['groups', 'org-summary', 'members'],
    'Group deleted',
  );
}

export function useAddGroupMember() {
  return useEngineMutation<{ groupId: string; accountId: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/groups/${input.groupId}/members`, init: { method: 'POST', body: { account_id: input.accountId }, idempotent: true } }),
    ['groups', 'members'],
    'Member added to group',
  );
}

export function useRemoveGroupMember() {
  return useEngineMutation<{ groupId: string; accountId: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/groups/${input.groupId}/members/${input.accountId}`, init: { method: 'DELETE' } }),
    ['groups', 'members'],
    'Member removed from group',
  );
}

// ── Service accounts ────────────────────────────────────────────────────────

export function useCreateServiceAccount() {
  return useEngineMutation<{ name: string; description?: string; scopes: string[]; mfaProof?: string }, { serviceAccount: unknown; token: string }>(
    (orgId, input) => {
      const { mfaProof, ...body } = input;
      return { path: `/console/org/${orgId}/service-accounts`, init: { method: 'POST', body, idempotent: true, ...(mfaProof ? { mfaProof } : {}) } };
    },
    ['service-accounts', 'org-summary'],
  );
}

export function useRotateServiceAccountToken() {
  return useEngineMutation<{ id: string; mfaProof?: string }, { token: string }>(
    (orgId, input) => ({ path: `/console/org/${orgId}/service-accounts/${input.id}/rotate`, init: { method: 'POST', ...(input.mfaProof ? { mfaProof: input.mfaProof } : {}) } }),
    ['service-accounts'],
  );
}

export function useDisableServiceAccount() {
  return useEngineMutation<{ id: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/service-accounts/${input.id}/disable`, init: { method: 'POST' } }),
    ['service-accounts', 'org-summary'],
    'Service account disabled',
  );
}

export function useEnableServiceAccount() {
  return useEngineMutation<{ id: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/service-accounts/${input.id}/enable`, init: { method: 'POST' } }),
    ['service-accounts', 'org-summary'],
    'Service account enabled',
  );
}

// ── Settings / lifecycle ────────────────────────────────────────────────────

export function useUpdateOrgSettings() {
  return useEngineMutation<Record<string, unknown>, unknown>(
    (orgId, body) => ({ path: `/console/org/${orgId}/settings`, init: { method: 'PATCH', body, idempotent: true } }),
    ['org-profile', 'home'],
    'Settings saved',
  );
}

export function useStartTrial() {
  return useEngineMutation<{ product: string; days?: number }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/entitlements/${input.product}/trial`, init: { method: 'POST', body: { ...(input.days ? { days: input.days } : {}) }, idempotent: true } }),
    ['entitlements', 'home'],
    'Trial started',
  );
}

export function useTransferOwnership() {
  return useEngineMutation<{ targetAccountId: string; mfaProof: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/transfer-ownership`, init: { method: 'POST', body: { target_account_id: input.targetAccountId }, idempotent: true, mfaProof: input.mfaProof } }),
    ['members', 'home'],
    'Ownership transferred',
  );
}

export function useRequestOrgDeletion() {
  return useEngineMutation<{ mfaProof: string }, { scheduled_purge_at: string }>(
    (orgId, input) => ({ path: `/console/org/${orgId}/delete`, init: { method: 'POST', body: { confirmation: 'delete' }, idempotent: true, mfaProof: input.mfaProof } }),
    ['deletion-status', 'entitlements', 'home'],
  );
}

export function useCancelOrgDeletion() {
  return useEngineMutation<{ mfaProof: string }, unknown>(
    (orgId, input) => ({ path: `/console/org/${orgId}/delete/cancel`, init: { method: 'POST', mfaProof: input.mfaProof } }),
    ['deletion-status', 'entitlements', 'home'],
    'Deletion cancelled',
  );
}
