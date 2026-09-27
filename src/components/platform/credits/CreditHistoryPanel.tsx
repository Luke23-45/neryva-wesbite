/**
 * CreditHistoryPanel — usage history + per-run receipts (Phase 5).
 *
 * The ledger movement list, newest first, with cursor pagination. Rows
 * tied to a run expand into a per-run receipt (hold → settlement →
 * release, with the final settled cost).
 */
import { useState } from 'react';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
  CellPrimary,
  CellMono,
  CellMeta,
} from '@components/common/ui/DataTable';
import {
  useCreditMovements,
  useRunReceipt,
  formatCredits,
  creditsToUsd,
  type CreditMovement,
} from '@hooks/engine/credits';

const KIND_LABELS: Record<string, string> = {
  grant: 'Free grant',
  purchase: 'Purchase',
  bonus: 'Bonus',
  hold: 'Run hold',
  settlement: 'Run charge',
  release: 'Hold released',
  expiration: 'Expired',
  refund: 'Refund',
  reversal: 'Bonus reversal',
  adjustment: 'Adjustment',
};

const ReceiptBox = styled.div`
  margin: 8px 0 16px;
  padding: 12px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
`;

const ReceiptLine = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-variant-numeric: tabular-nums;
  color: rgba(236, 238, 244, 0.75);
`;

const ReceiptTotal = styled(ReceiptLine)`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 6px;
  padding-top: 8px;
  font-weight: 600;
  color: #eceef4;
`;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function RunReceipt({ runId }: { runId: string }) {
  const receipt = useRunReceipt(runId);
  return (
    <QueryView query={receipt} skeleton={<Skeleton $h="60px" $r="8px" />}>
      {(rows: CreditMovement[]) => {
        const settlement = rows.find((r) => r.kind === 'settlement');
        const hold = rows.find((r) => r.kind === 'hold');
        return (
          <ReceiptBox>
            <ReceiptLine>
              <span>Estimated hold</span>
              <span>{hold ? `${formatCredits(-hold.credits)} credits` : '—'}</span>
            </ReceiptLine>
            <ReceiptLine>
              <span>Max reserved</span>
              <span>{hold ? `${formatCredits(-hold.credits)} credits` : '—'}</span>
            </ReceiptLine>
            <ReceiptTotal>
              <span>Actual charge</span>
              <span>
                {settlement
                  ? `${formatCredits(-settlement.credits)} credits (≈ $${creditsToUsd(-settlement.credits).toFixed(2)})`
                  : 'pending'}
              </span>
            </ReceiptTotal>
          </ReceiptBox>
        );
      }}
    </QueryView>
  );
}

export function CreditHistoryPanel() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursors, setCursors] = useState<string[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const history = useCreditMovements(cursor);

  const goNext = (next: string) => {
    setCursors((c) => [...c, cursor ?? 'head']);
    setCursor(next);
  };
  const goBack = () => {
    setCursors((c) => {
      const prev = c[c.length - 1];
      setCursor(prev === 'head' ? null : prev);
      return c.slice(0, -1);
    });
  };

  return (
    <Panel title="Usage history" subtitle="Every credit movement, newest first">
      <QueryView query={history} skeleton={<Skeleton $h="200px" $r="12px" />}>
        {({ movements, nextCursor }) => (
          <>
            <DataTable>
              <DataHead>
                <DataRow>
                  <DataCell>Movement</DataCell>
                  <DataCell>Credits</DataCell>
                  <DataCell>USD</DataCell>
                  <DataCell>Date</DataCell>
                </DataRow>
              </DataHead>
              <tbody>
                {movements.map((m) => (
                  <>
                    <DataRow key={m.id}>
                      <DataCell>
                        <CellPrimary>{m.label ?? KIND_LABELS[m.kind] ?? m.kind}</CellPrimary>
                        <CellMeta>{m.kind}</CellMeta>
                      </DataCell>
                      <DataCell>
                        <CellMono>
                          {m.credits > 0 ? '+' : ''}
                          {formatCredits(m.credits)}
                        </CellMono>
                      </DataCell>
                      <DataCell>
                        <CellMono>{m.usdCents != null ? `$${(m.usdCents / 100).toFixed(2)}` : '—'}</CellMono>
                      </DataCell>
                      <DataCell>
                        <CellMeta>{formatDate(m.createdAt)}</CellMeta>
                      </DataCell>
                    </DataRow>
                    {m.runId && (
                      <DataRow key={`${m.id}-receipt`}>
                        <DataCell>
                          <ActionButton
                            onClick={() => setExpandedRun(expandedRun === m.runId ? null : m.runId)}
                          >
                            {expandedRun === m.runId ? 'Hide receipt' : 'View run receipt'}
                          </ActionButton>
                          {expandedRun === m.runId && m.runId && <RunReceipt runId={m.runId} />}
                        </DataCell>
                      </DataRow>
                    )}
                  </>
                ))}
              </tbody>
            </DataTable>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <ActionButton disabled={cursors.length === 0} onClick={goBack}>
                ← Newer
              </ActionButton>
              <ActionButton disabled={!nextCursor} onClick={() => nextCursor && goNext(nextCursor)}>
                Older →
              </ActionButton>
            </div>
          </>
        )}
      </QueryView>
    </Panel>
  );
}
