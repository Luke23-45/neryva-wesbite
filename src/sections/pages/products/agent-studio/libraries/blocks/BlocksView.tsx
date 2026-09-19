import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ShieldAlert } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import {
  ViewShell,
  ViewHeader,
  ViewTitle,
  ViewSubtitle,
} from '@components/common/ui/ViewLayout';
import { DataTable, DataHead, DataRow, DataCell } from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  BLOCK_TARGETS,
  describeBlockExpiry,
  filterBlocks,
  isBlockActive,
  useClearControlBlock,
  useControlBlocks,
  useMemberNameMap,
  useSetControlBlock,
  type BlockStatusFilter,
  type BlockTargetFilter,
  type ControlBlock,
} from '@hooks/studio/useSetupOperate';

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  margin: 12px 0;

  & > label {
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: ${({ theme }) => theme.app.text.secondary};
  }

  & select {
    display: block;
    min-width: 140px;
  }
`;

const FieldProblem = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.app.status.error.fg};
  margin: 4px 0 0;
`;

const FieldNote = styled.p`
  font-size: 12px;
  opacity: 0.75;
  margin: 4px 0 0;
`;

const EmptyNote = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.6;
  padding: 16px 4px;
`;

/** Pill truth: expired → neutral; permanent-active → error; dated-active → warning. */
function statusPill(block: ControlBlock): { tone: 'error' | 'warning' | 'neutral'; label: string } {
  if (!isBlockActive(block)) return { tone: 'neutral', label: 'Expired' };
  if (block.expiresAt === null || block.expiresAt === undefined) return { tone: 'error', label: 'Active' };
  const text = describeBlockExpiry(block.expiresAt);
  return { tone: 'warning', label: text.charAt(0).toUpperCase() + text.slice(1) };
}

function shortDate(iso: string | null): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  // Full timestamp (C15) — expiry precision and Set-at ordering are
  // load-bearing for a kill-switch ledger; month/day dropped them.
  return parsed.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Blocks (SIDEBAR_LEDGER.md P3) — operator control blocks, manageable here by
 * owners/admins. Status is COMPUTED client-side (Active / Expires-in-N /
 * Expired) because expiry is evaluated at check time server-side with no
 * sweeper. Platform-level template blocks are staff-written in a separate
 * system — every row here is an org row the governors viewing it can clear.
 * There is no edit: clear + re-set is the real path (no update endpoint).
 */
export function BlocksView() {
  const { role } = useOrg();
  const canGovern = canSetup(role, 'setup:govern');
  const governDenied = setupDeniedCopy(role, 'setup:govern');
  const blocks = useControlBlocks({ enabled: canGovern });
  const clearBlock = useClearControlBlock();
  const members = useMemberNameMap({ enabled: canGovern });
  const [createOpen, setCreateOpen] = useState(false);
  const [clearTarget, setClearTarget] = useState<{ id: string; name: string } | null>(null);
  const [clearingId, setClearingId] = useState<string | null>(null);
  const [targetFilter, setTargetFilter] = useState<BlockTargetFilter>('all');
  const [statusFilter, setStatusFilter] = useState<BlockStatusFilter>('active');
  const [query, setQuery] = useState('');

  const filters = useMemo(
    () => ({ target: targetFilter, status: statusFilter, query }),
    [targetFilter, statusFilter, query],
  );

  if (!canGovern) {
    return (
      <ViewShell>
        <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
          <ViewTitle>Blocks</ViewTitle>
          <ViewSubtitle>{governDenied}</ViewSubtitle>
        </ViewHeader>
        <p style={{ fontSize: 13, opacity: 0.8 }}>
          Control blocks are governance kill switches — they refuse installs, publishes, releases,
          tool calls, and run acceptance. Ask an owner or admin to review them.
        </p>
      </ViewShell>
    );
  }

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Blocks</ViewTitle>
        <ViewSubtitle>
          Kill switches with expiry — refused at check time across installs, publishes, releases,
          and runs. Expiry needs no worker.
        </ViewSubtitle>
      </ViewHeader>

      <div style={{ margin: '12px 0' }}>
        <ActionButton onClick={() => setCreateOpen(true)}>
          <ShieldAlert size={13} strokeWidth={1.8} />
          Set block
        </ActionButton>
      </div>

      <FilterBar>
        <label>
          Target
          <select value={targetFilter} onChange={(e) => setTargetFilter(e.target.value as BlockTargetFilter)} aria-label="Filter by target">
            <option value="all">All targets</option>
            {BLOCK_TARGETS.map((target) => (
              <option key={target} value={target}>{target}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BlockStatusFilter)} aria-label="Filter by status">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expiring">Expiring soon</option>
            <option value="expired">Expired</option>
            <option value="permanent">Permanent</option>
          </select>
        </label>
        <TextInput label="Search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name or reason…" />
      </FilterBar>

      <QueryView
        query={blocks}
        isEmpty={(d) => d.length === 0}
        empty={{
          title: 'No blocks affect your organization',
          description: 'That is good news — nothing is refused anywhere. Blocks appear here with reason and expiry.',
        }}
      >
        {(list) => {
          const visible = filterBlocks(list, filters);
          if (visible.length === 0) {
            return (
              <EmptyNote>
                No blocks match these filters — loosen one. Expired rows refuse nothing and are kept for the audit trail.
              </EmptyNote>
            );
          }
          return (
          <DataTable>
            <DataHead>
              <DataCell $w="10%">Target</DataCell>
              <DataCell $w="16%">Name</DataCell>
              <DataCell $w="22%">Reason</DataCell>
              <DataCell $w="14%">Status</DataCell>
              <DataCell $w="12%">Expires</DataCell>
              <DataCell $w="12%">Set by</DataCell>
              <DataCell $w="9%">Set at</DataCell>
              <DataCell $w="44px" />
            </DataHead>
            {visible.map((b) => {
              const pill = statusPill(b);
              const clearing = clearingId === b.id;
              return (
                <DataRow key={b.id}>
                  <DataCell>{b.targetType}</DataCell>
                  <DataCell>{b.targetName}</DataCell>
                  <DataCell>{b.reason || '—'}</DataCell>
                  <DataCell>
                    <StatusPill tone={pill.tone} dot={false}>
                      {pill.label}
                    </StatusPill>
                  </DataCell>
                  <DataCell>{describeBlockExpiry(b.expiresAt)}</DataCell>
                  <DataCell>{b.createdBy ? (members.nameOf(b.createdBy) ?? b.createdBy.slice(0, 8)) : '—'}</DataCell>
                  <DataCell>{shortDate(b.createdAt)}</DataCell>
                  <DataCell>
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      disabled={clearing}
                      onClick={() => {
                        setClearingId(b.id);
                        setClearTarget({ id: b.id, name: b.targetName });
                      }}
                    >
                      {clearing ? 'Clearing…' : 'Clear'}
                    </ActionButton>
                  </DataCell>
                </DataRow>
              );
            })}
          </DataTable>
          );
        }}
      </QueryView>

      <BlockCreateModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <ConfirmDialog
        open={clearTarget !== null}
        title="Clear this block?"
        message={`${
          clearTarget?.name ?? ''
        } becomes assignable and servable again immediately. Clearing is audited.`}
        confirmLabel="Clear block"
        onConfirm={() => {
          if (clearTarget) {
            const id = clearTarget.id;
            clearBlock.mutate(id, {
              onSuccess: () => {
                setClearTarget(null);
                if (clearingId === id) setClearingId(null);
              },
              onSettled: () => {
                if (clearingId === id) setClearingId(null);
              },
            });
          }
        }}
        onCancel={() => {
          setClearTarget(null);
          setClearingId(null);
        }}
      />
    </ViewShell>
  );
}

function BlockCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const setBlock = useSetControlBlock();
  const [targetType, setTargetType] = useState<string>('assistant');
  const [targetName, setTargetName] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [permanentArmed, setPermanentArmed] = useState(false);
  // Modal-open clock for the futurity check (stable per mount; the check
  // re-runs on every keystroke against this fixed "now").
  const [nowMs] = useState(() => Date.now());

  const nameProblem =
    targetName.trim().length >= 1 && targetName.trim().length <= 128
      ? null
      : 'Target names are 1–128 chars.';
  const reasonProblem =
    reason.trim().length >= 1 && reason.trim().length <= 512
      ? null
      : 'Operator justification is mandatory (1–512 chars).';
  const expiryText = expiresAt.trim();
  const expiryMs = expiryText === '' ? null : new Date(expiryText).getTime();
  const expiryProblem =
    expiryText === ''
      ? null
      : expiryMs === null || Number.isNaN(expiryMs)
        ? 'Expiry must be a real date and time.'
        : expiryMs <= nowMs
          ? 'Expiry must be in the future.'
          : null;
  const valid = !nameProblem && !reasonProblem && !expiryProblem;
  const permanent = expiryText === '';

  const submit = () => {
    setBlock.mutate(
      {
        targetType,
        targetName: targetName.trim(),
        reason: reason.trim(),
        ...(permanent ? {} : { expiresAt: new Date(expiryText).toISOString() }),
      },
      {
        onSuccess: () => {
          setPermanentArmed(false);
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setPermanentArmed(false);
        onClose();
      }}
      title="Set control block"
      width={560}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          {permanentArmed ? (
            <ActionButton
              variant="danger"
              disabled={!valid || setBlock.isPending}
              onClick={submit}
            >
              <ShieldAlert size={13} strokeWidth={1.8} />
              Yes — block with no expiry
            </ActionButton>
          ) : (
            <ActionButton
              variant="danger"
              disabled={!valid || setBlock.isPending}
              onClick={() => {
                if (permanent) {
                  setPermanentArmed(true);
                  return;
                }
                submit();
              }}
            >
              <ShieldAlert size={13} strokeWidth={1.8} />
              Set block
            </ActionButton>
          )}
        </>
      }
    >
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        Governance kill switch — refuses acceptance, assignment, tool calls, context, credentials,
        and installs. Expiry needs no worker; terminal runs never strand. There is no edit:
        to change a block, clear it and set it again.
      </p>
      <label style={{ fontSize: 13, display: 'block', marginTop: 12 }}>
        Target type
        <select value={targetType} onChange={(e) => setTargetType(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4 }}>
          {BLOCK_TARGETS.map((target) => (
            <option key={target} value={target}>{target}</option>
          ))}
        </select>
      </label>
      <div style={{ marginTop: 12 }}>
        <TextInput id="block-target-name" label="Target name (id or slug)" value={targetName} onChange={(e) => setTargetName(e.target.value)} error={nameProblem ?? undefined} />
      </div>
      <div style={{ marginTop: 12 }}>
        <TextInput id="block-reason" label="Reason (mandatory, audited)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why this block exists" error={reason.trim() ? (reasonProblem ?? undefined) : undefined} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: 13, display: 'block' }}>
          Expires at (optional)
          <input
            type="datetime-local"
            aria-label="Block expiry"
            value={expiresAt}
            min={new Date().toISOString().slice(0, 16)}
            onChange={(e) => {
              setExpiresAt(e.target.value);
              setPermanentArmed(false);
            }}
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>
        {expiryProblem ? (
          <FieldProblem>{expiryProblem}</FieldProblem>
        ) : (
          <FieldNote>
            {permanent
              ? 'No expiry = permanent. Setting it asks for a second confirmation.'
              : `Lifts automatically ${describeBlockExpiry(new Date(expiryText).toISOString())} — no worker needed.`}
          </FieldNote>
        )}
      </div>
    </Modal>
  );
}
