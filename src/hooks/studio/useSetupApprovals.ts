/**
 * Human approvals queue (customer-setup-review.md G2) over the EXACT
 * contract:
 *
 * - GET console/org/:orgId/approvals?state= (owner/admin/developer) →
 *   {approvals: [{id, runId, approvalRef, summary, actionType,
 *   policyVersion, state PENDING|APPROVED|DENIED|EXPIRED, expiresAt,
 *   decidedAt, decisionActorId, createdAt, expired (computed at read)}]}
 *   (conversations.service.ts listApprovals; cap 200, newest first);
 * - POST console/org/:orgId/approvals/:approvalId/extend {expires_at!}
 *   (owner/admin) — re-targets the pending window, audited;
 * - POST console/org/:orgId/runs/:runId/approvals/:approvalId/decision
 *   {decision! APPROVED|DENIED, reason?} (owner/admin) — APPROVED re-drives
 *   the run via resume_requested; DENIED cancels it. NOTE: the decision
 *   route lives on RunsController, NOT the conversations controller
 *   (conversations.controller.ts:301-399) — verified live (the
 *   /conversations/… path 404s).
 *
 * Approvers learn via in-app approval.requested notifications (owner/admin
 * fan-out); the popover deep-links here by notification kind.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { useOrg } from '@/Context/OrgContext';

const APPROVALS_KEY = ['studio', 'setup', 'approvals'] as const;

export type ApprovalState = 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export interface ApprovalItem {
  id: string;
  runId: string | null;
  approvalRef: string | null;
  summary: string | null;
  actionType: string | null;
  policyVersion: string | null;
  state: string;
  expiresAt: string | null;
  decidedAt: string | null;
  decisionActorId: string | null;
  createdAt: string | null;
  expired: boolean;
}

export function parseApprovals(raw: unknown): ApprovalItem[] {
  const record = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const list = Array.isArray(raw) ? raw : Array.isArray(record.approvals) ? record.approvals : [];
  return list
    .map((entry): ApprovalItem | null => {
      if (typeof entry !== 'object' || entry === null) {
        return null;
      }
      const item = entry as Record<string, unknown>;
      const id = str(item.id);
      if (!id) {
        return null;
      }
      return {
        id,
        runId: str(item.runId) ?? str(item.run_id),
        approvalRef: str(item.approvalRef) ?? str(item.approval_ref),
        summary: str(item.summary),
        actionType: str(item.actionType) ?? str(item.action_type),
        policyVersion: str(item.policyVersion) ?? str(item.policy_version),
        state: str(item.state) ?? 'PENDING',
        expiresAt: str(item.expiresAt) ?? str(item.expires_at),
        decidedAt: str(item.decidedAt) ?? str(item.decided_at),
        decisionActorId: str(item.decisionActorId) ?? str(item.decision_actor_id),
        createdAt: str(item.createdAt) ?? str(item.created_at),
        expired: item.expired === true,
      };
    })
    .filter((a): a is ApprovalItem => a !== null);
}

export function useApprovals(state?: ApprovalState, options?: { enabled?: boolean; refetchInterval?: number | false }) {
  const { orgId } = useOrg();
  return useQuery({
    queryKey: [...APPROVALS_KEY, orgId, state ?? null],
    queryFn: () =>
      engine<unknown>(`/console/org/${orgId}/approvals`, {
        query: state ? { state } : {},
      }),
    enabled: (options?.enabled ?? true) && !!orgId,
    staleTime: 10_000,
    // C15: the queue is a pending workload — poll while it shows PENDING,
    // quiet otherwise (libraries stay unpolled).
    refetchInterval: options?.refetchInterval ?? false,
    select: parseApprovals,
  });
}

function useInvalidateApprovals() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: [...APPROVALS_KEY, orgId] });
}

export function useDecideApproval() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateApprovals();
  return useMutation({
    mutationFn: async (input: { runId: string; approvalId: string; decision: 'APPROVED' | 'DENIED'; reason?: string }) =>
      engine(`/console/org/${orgId}/runs/${input.runId}/approvals/${input.approvalId}/decision`, {
        method: 'POST',
        body: {
          decision: input.decision,
          ...(input.reason ? { reason: input.reason } : {}),
        },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not record the decision'),
  });
}

export function useExtendApproval() {
  const { orgId } = useOrg();
  const invalidate = useInvalidateApprovals();
  return useMutation({
    mutationFn: async (input: { approvalId: string; expiresAt: string }) =>
      engine(`/console/org/${orgId}/approvals/${input.approvalId}/extend`, {
        method: 'POST',
        body: { expires_at: input.expiresAt },
        idempotent: true,
      }),
    onSuccess: () => invalidate(),
    onError: (error) => toastEngineError(error, 'Could not extend the approval window'),
  });
}
