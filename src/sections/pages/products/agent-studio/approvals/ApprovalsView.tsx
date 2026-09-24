import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Check, X, Clock } from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { Drawer } from '@components/common/ui/Drawer';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import {
  useApprovals,
  useDecideApproval,
  useExtendApproval,
  type ApprovalItem,
  type ApprovalState,
} from '@hooks/studio/useSetupApprovals';
import { useMemberNameMap } from '@hooks/studio/useSetupOperate';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  describeApprovalAge,
  describeApprovalExpiry,
  OPERATE_COPY,
} from '@/sections/pages/products/agent-studio/builder/lib/operate-model';

/**
 * Approvals center (customer-setup-review.md G2) — the queue approval-gated
 * tools park in. APPROVED re-drives the run; DENIED cancels it; extend
 * re-targets the pending window (audited). Expiry is evaluated at read time
 * (flagged, never silently dropped). Decide acts are owner/admin; the list
 * reads for owner/admin/developer.
 */

const stateTone: Record<string, StatusTone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  DENIED: 'error',
  EXPIRED: 'neutral',
};

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.55;
`;

const SectionGap = styled.div`
  margin-top: 18px;
`;

const RowActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
`;

const RowSummary = styled.button`
  background: none;
  border: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: ${({ theme }) => theme.app.border.strong};
`;

const STATE_FILTERS: Array<{ value: ApprovalState | 'ALL'; label: string }> = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ALL', label: 'All' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'EXPIRED', label: 'Expired' },
];

export function ApprovalsView() {
  const { role } = useOrg();
  const canDecide = canSetup(role, 'setup:govern');
  const decideDenied = setupDeniedCopy(role, 'setup:govern');
  const canRead = canSetup(role, 'setup:author');
  const readDenied = setupDeniedCopy(role, 'setup:author');
  const [filter, setFilter] = useState<ApprovalState | 'ALL'>('PENDING');
  const [search, setSearch] = useState('');
  // Poll while the queue shows pending work (15s); quiet history otherwise.
  const approvals = useApprovals(filter === 'ALL' ? undefined : filter, {
    enabled: canRead,
    refetchInterval: filter === 'PENDING' || filter === 'ALL' ? 15_000 : false,
  });
  const members = useMemberNameMap({ enabled: canRead });
  const [deciding, setDeciding] = useState<{ item: ApprovalItem; decision: 'APPROVED' | 'DENIED' } | null>(null);
  const [extending, setExtending] = useState<ApprovalItem | null>(null);
  const [inspecting, setInspecting] = useState<ApprovalItem | null>(null);

  // Client-side search over the capped-200 server rows (the server filter
  // vocabulary is `?state=` only — this narrows what renders, never the API).
  const matchesSearch = (item: ApprovalItem): boolean => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [item.summary, item.actionType, item.approvalRef, item.runId, item.policyVersion]
      .some((field) => field?.toLowerCase().includes(q));
  };

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Approvals</ViewTitle>
          <ViewSubtitle>
            Tool calls parked for human review — approve to re-drive the run, deny to cancel it. Approval notifications land here.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {STATE_FILTERS.map((option) => (
            <ActionButton
              key={option.value}
              variant={filter === option.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
            >
              {option.label}
            </ActionButton>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search loaded rows…"
            aria-label="Search loaded approval rows"
            style={{ marginLeft: 'auto', fontSize: 13, padding: '6px 10px', borderRadius: 8, maxWidth: 240 }}
          />
        </div>
        {!canRead ? (
          <Panel title="Pending approvals" subtitle="Approval queue.">
            <p style={{ fontSize: 13 }}>{readDenied}</p>
          </Panel>
        ) : (
          <Panel
            title={filter === 'ALL' ? 'All decisions' : `${filter.charAt(0)}${filter.slice(1).toLowerCase()} approvals`}
            subtitle="Newest first (cap 200). Expired items are flagged at read time. Polls while pending."
            flush
          >
            <QueryView
              query={approvals}
              isEmpty={(d) => d.length === 0}
              empty={{
                title: filter === 'PENDING' ? 'Queue clear' : `No ${filter.toLowerCase()} approvals`,
                description: filter === 'PENDING' ? 'Nothing is parked for review. Approval-gated tool calls appear here.' : 'Try a different filter.',
              }}
            >
              {(rows) => {
                const visible = rows.filter(matchesSearch);
                if (visible.length === 0 && search.trim()) {
                  return <p style={{ fontSize: 13, opacity: 0.8 }}>No loaded rows match “{search.trim()}” — loosen the search.</p>;
                }
                return (
                <DataTable>
                  <DataHead>
                    <DataCell $w="24%">Summary</DataCell>
                    <DataCell $w="12%">State</DataCell>
                    <DataCell $w="14%">Action</DataCell>
                    <DataCell $w="14%">Expires</DataCell>
                    <DataCell $w="10%">Run</DataCell>
                    <DataCell $w="12%">History</DataCell>
                    <DataCell $w="14%" $align="right">Decide</DataCell>
                  </DataHead>
                  {visible.map((item, i) => (
                    <DataRow key={item.id} as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={i + 2} $interactive={false}>
                      <DataCell $w="24%">
                        <RowSummary type="button" onClick={() => setInspecting(item)} title="Open the full decision context">
                          {item.summary ?? <Muted>—</Muted>}
                        </RowSummary>
                        {item.approvalRef && <Muted><Mono>{item.approvalRef}</Mono></Muted>}
                      </DataCell>
                      <DataCell $w="12%">
                        <StatusPill tone={stateTone[item.state] ?? 'neutral'} dot={false}>
                          {item.expired ? 'EXPIRED' : item.state}
                        </StatusPill>
                      </DataCell>
                      <DataCell $w="14%">
                        {item.actionType ? <Mono>{item.actionType}</Mono> : <Muted>—</Muted>}
                      </DataCell>
                      <DataCell $w="14%">
                        {item.expiresAt ? formatUtc(item.expiresAt) : <Muted>no window</Muted>}
                      </DataCell>
                      <DataCell $w="10%">
                        {item.runId ? <Mono>{item.runId.slice(0, 8)}</Mono> : <Muted>—</Muted>}
                      </DataCell>
                      <DataCell $w="12%">
                        {item.decidedAt ? (
                          <span>
                            {formatUtc(item.decidedAt)}
                            {item.decisionActorId && (
                              <> by {members.nameOf(item.decisionActorId) ?? item.decisionActorId.slice(0, 8)}</>
                            )}
                          </span>
                        ) : (
                          <Muted>—</Muted>
                        )}
                      </DataCell>
                      <DataCell $w="14%" $align="right">
                        {item.state === 'PENDING' && !item.expired ? (
                          <RowActions>
                            <ActionButton
                              variant="ghost"
                              size="sm"
                              disabled={!canDecide}
                              title={canDecide ? 'Extend the pending window (audited)' : decideDenied}
                              onClick={() => setExtending(item)}
                              aria-label={`Extend approval ${item.id.slice(0, 8)}`}
                            >
                              <Clock size={13} strokeWidth={1.8} />
                            </ActionButton>
                            <ActionButton
                              variant="ghost"
                              size="sm"
                              disabled={!canDecide}
                              title={canDecide ? 'Deny — cancels the run (reason required)' : decideDenied}
                              onClick={() => setDeciding({ item, decision: 'DENIED' })}
                              aria-label={`Deny approval ${item.id.slice(0, 8)}`}
                            >
                              <X size={13} strokeWidth={1.8} />
                            </ActionButton>
                            <ActionButton
                              size="sm"
                              disabled={!canDecide}
                              title={canDecide ? 'Approve — re-drives the run' : decideDenied}
                              onClick={() => setDeciding({ item, decision: 'APPROVED' })}
                              aria-label={`Approve approval ${item.id.slice(0, 8)}`}
                            >
                              <Check size={13} strokeWidth={1.8} />
                            </ActionButton>
                          </RowActions>
                        ) : (
                          <Muted>closed</Muted>
                        )}
                      </DataCell>
                    </DataRow>
                  ))}
                </DataTable>
                );
              }}
            </QueryView>
          </Panel>
        )}
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={10}>
        <SectionGap>
          <Panel title="How approvals work" subtitle="The control loop.">
            <ol style={{ fontSize: 13, lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
              <li>Version tools marked approval required (or catalog REQUIRED rows) park the run and open an approval.</li>
              <li>Owners/admins are notified in-app; the queue above is the decision surface.</li>
              <li>APPROVED re-drives the run where it parked; DENIED cancels it — deny requires a reason, both audited with actor.</li>
              <li>Windows expire at read time (flagged EXPIRED) — extend re-targets a pending window before it lapses.</li>
              <li>{OPERATE_COPY.queuesSeparateNote}</li>
            </ol>
          </Panel>
        </SectionGap>
      </motion.div>

      {deciding && (
        <DecideModal
          key={deciding.item.id}
          item={deciding.item}
          decision={deciding.decision}
          onClose={() => setDeciding(null)}
        />
      )}
      {extending && (
        <ExtendModal
          key={extending.id}
          item={extending}
          onClose={() => setExtending(null)}
        />
      )}
      {inspecting && (
        <ApprovalDrawer
          key={inspecting.id}
          item={inspecting}
          actorName={inspecting.decisionActorId ? (members.nameOf(inspecting.decisionActorId) ?? null) : null}
          onClose={() => setInspecting(null)}
        />
      )}
    </ViewShell>
  );
}

/**
 * P5-A5: engine timestamps are UTC ISO strings. The bare wall-clock slice
 * reads as local time; the zone label is load-bearing for expiry windows.
 */
function formatUtc(iso: string | null): string {
  if (!iso) return '—';
  return `${iso.slice(0, 16).replace('T', ' ')} UTC`;
}

function ApprovalDrawer({
  item,
  actorName,
  onClose,
}: {
  item: ApprovalItem;
  actorName: string | null;
  onClose: () => void;
}) {
  // Full LISTABLE context only — the list endpoint carries no tool-arg
  // payload, so none is shown (never invented args).
  return (
    <Drawer open title={item.summary ?? item.approvalRef ?? item.id.slice(0, 8)} subtitle="Decision context — exactly what the reviewer sees" onClose={onClose}>
      <dl style={{ fontSize: 13, lineHeight: 1.8, margin: 0 }}>
        <div><dt style={{ opacity: 0.6 }}>Action</dt><dd style={{ margin: 0 }}><Mono>{item.actionType ?? '—'}</Mono></dd></div>
        <div><dt style={{ opacity: 0.6 }}>Reference</dt><dd style={{ margin: 0 }}><Mono>{item.approvalRef ?? item.id}</Mono></dd></div>
        <div><dt style={{ opacity: 0.6 }}>Policy</dt><dd style={{ margin: 0 }}><Mono>{item.policyVersion ?? '—'}</Mono></dd></div>
        <div>
          <dt style={{ opacity: 0.6 }}>Run</dt>
          <dd style={{ margin: 0 }}>
            {item.runId ? (
              <>
                <Mono>{item.runId}</Mono> · <Link to="/agent-studio/conversations">runs live with their conversations →</Link>
              </>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div><dt style={{ opacity: 0.6 }}>Window</dt><dd style={{ margin: 0 }}>{describeApprovalExpiry(item.expiresAt)}</dd></div>
        <div><dt style={{ opacity: 0.6 }}>Waiting</dt><dd style={{ margin: 0 }}>{describeApprovalAge(item.createdAt) ?? '—'}</dd></div>
        {item.decidedAt && (
          <div>
            <dt style={{ opacity: 0.6 }}>Decided</dt>
            <dd style={{ margin: 0 }}>
              {formatUtc(item.decidedAt)}
              {actorName ? ` by ${actorName}` : ''} · reasons live in <Link to="/platform/audit">Audit →</Link>
            </dd>
          </div>
        )}
      </dl>
      <p style={{ fontSize: 12, opacity: 0.7 }}>
        {OPERATE_COPY.approveRejectCopy}
      </p>
    </Drawer>
  );
}

function DecideModal({
  item,
  decision,
  onClose,
}: {
  item: ApprovalItem;
  decision: 'APPROVED' | 'DENIED';
  onClose: () => void;
}) {
  const decide = useDecideApproval();
  const [reason, setReason] = useState('');

  // Deny requires a reason — the endpoint stores it with the decision
  // (verified `conversations.controller.ts:384,396`). Approve keeps it optional.
  const reasonProblem = decision === 'DENIED' && reason.trim() === '' ? 'Deny requires a reason — it is stored with the decision.' : null;

  if (!item.runId) {
    // Loud, never a silent null: deciding blind is worse than not deciding.
    return (
      <Modal open onClose={onClose} title="Cannot decide this approval" width={520} footer={<ActionButton variant="secondary" onClick={onClose}>Close</ActionButton>}>
        <p style={{ fontSize: 13 }}>{OPERATE_COPY.missingRunCopy}</p>
        <p style={{ fontSize: 13 }}>
          <Link to="/platform/audit">Open the audit trail →</Link>
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`${decision === 'APPROVED' ? 'Approve' : 'Deny'} — ${item.summary ?? item.approvalRef ?? item.id.slice(0, 8)}`}
      width={520}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            variant={decision === 'DENIED' ? 'danger' : undefined}
            disabled={decide.isPending || reasonProblem !== null}
            title={reasonProblem ?? (decision === 'APPROVED' ? 'Approve and re-drive' : 'Deny and cancel')}
            onClick={() => {
              decide.mutate(
                { runId: item.runId as string, approvalId: item.id, decision, ...(reason.trim() ? { reason: reason.trim() } : {}) },
                { onSuccess: () => onClose() },
              );
            }}
          >
            {decision === 'APPROVED' ? <Check size={13} strokeWidth={1.8} /> : <X size={13} strokeWidth={1.8} />}
            {decision === 'APPROVED' ? 'Approve and re-drive' : 'Deny and cancel'}
          </ActionButton>
        </>
      }
    >
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        {decision === 'APPROVED'
          ? 'The run resumes where it parked (audited with you as actor).'
          : 'The run is cancelled (audited with you as actor).'}
        {item.actionType ? <> Action: <Mono>{item.actionType}</Mono>.</> : null}
      </p>
      <div style={{ marginTop: 12 }}>
        <TextInput
          label={decision === 'DENIED' ? 'Reason (required, audited)' : 'Reason (optional, audited)'}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why this decision"
          autoFocus
          error={reasonProblem ?? undefined}
        />
      </div>
    </Modal>
  );
}

function ExtendModal({ item, onClose }: { item: ApprovalItem; onClose: () => void }) {
  const extend = useExtendApproval();
  const [expiresAt, setExpiresAt] = useState('');

  // Parseability checks during render (pure); futurity is enforced in the
  // submit handler (event time, not render time — Date.now() is impure).
  const parseable = expiresAt.trim() !== '' && Number.isFinite(Date.parse(expiresAt));

  return (
    <Modal
      open
      onClose={onClose}
      title={`Extend window — ${item.summary ?? item.id.slice(0, 8)}`}
      width={520}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            disabled={!parseable || extend.isPending}
            onClick={() => {
              const at = new Date(expiresAt);
              if (!Number.isFinite(at.getTime()) || at.getTime() <= Date.now()) {
                toast.error('Expiry must be a future timestamp.');
                return;
              }
              extend.mutate({ approvalId: item.id, expiresAt: at.toISOString() }, { onSuccess: () => onClose() });
            }}
          >
            <Clock size={13} strokeWidth={1.8} />
            Extend (audited)
          </ActionButton>
        </>
      }
    >
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        Currently expires: {item.expiresAt ? formatUtc(item.expiresAt) : 'no window'}. Enter a future ISO timestamp.
      </p>
      <div style={{ marginTop: 12 }}>
        <TextInput label="New expiry (ISO)" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} placeholder="2026-12-31T00:00:00Z" error={expiresAt.trim() && !parseable ? 'Must be a parseable timestamp.' : undefined} />
      </div>
    </Modal>
  );
}
