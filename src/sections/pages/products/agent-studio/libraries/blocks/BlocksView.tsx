import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { StatusPill } from '@components/common/ui/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
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
  type BlockStatusFilter,
  type BlockTargetFilter,
  type ControlBlock,
} from '@hooks/studio/useSetupOperate';
import { LIBRARIES_BLOCKS_NEW_ROUTE_ID } from './BlockNewSection';

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
  // Full timestamp — the year and the zone are load-bearing here: expiry
  // precision and set-at ordering in a kill-switch ledger must survive a
  // glance, and the earlier month/day/hour/minute rendering dropped both.
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
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
  const navigate = useNavigate();
  const canGovern = canSetup(role, 'setup:govern');
  const governDenied = setupDeniedCopy(role, 'setup:govern');
  const blocks = useControlBlocks({ enabled: canGovern });
  const clearBlock = useClearControlBlock();
  const members = useMemberNameMap({ enabled: canGovern });
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
          Control blocks are governance kill switches — they refuse installs, releases,
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
          Kill switches with expiry — refused at check time across installs, releases,
          and runs. Expiry needs no worker.
        </ViewSubtitle>
      </ViewHeader>

      <div style={{ margin: '12px 0' }}>
        <ActionButton onClick={() => navigate({ to: LIBRARIES_BLOCKS_NEW_ROUTE_ID })}>
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
          title: 'No org blocks affect your organization',
          description: 'Nothing listed here is refusing a target. Platform template blocks set by Neryva staff are not shown on this page.',
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
          <>
            {list.length >= 200 && (
              <p style={{ fontSize: 12, opacity: 0.65, margin: '0 0 8px' }}>
                The server returns at most 200 rows — this list may be truncated. Narrow the search to find a specific block.
              </p>
            )}
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
                  <DataCell $w="10%">{b.targetType}</DataCell>
                  <DataCell $w="16%">{b.targetName}</DataCell>
                  <DataCell $w="22%">{b.reason || '—'}</DataCell>
                  <DataCell $w="14%">
                    <StatusPill tone={pill.tone} dot={false}>
                      {pill.label}
                    </StatusPill>
                  </DataCell>
                  <DataCell $w="12%">{describeBlockExpiry(b.expiresAt)}</DataCell>
                  <DataCell $w="12%">{b.createdBy ? (members.nameOf(b.createdBy) ?? b.createdBy.slice(0, 8)) : '—'}</DataCell>
                  <DataCell $w="9%">{shortDate(b.createdAt)}</DataCell>
                  <DataCell $w="44px">
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
          </>
          );
        }}
      </QueryView>

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

