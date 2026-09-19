import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { QueryView } from '@components/common/ui/AsyncStates';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { useAnalyticsRollups, ROLLUP_KINDS, type AnalyticsRollup } from '@hooks/studio/useSetupOperate';

/**
 * Observe panel (team_setup_ledger.md F-E6) — per-assistant rollups over the
 * verified kind vocabulary and metric keys
 * (analytics-rollup.consumer.ts:58-211):
 *
 * - assistant_usage_daily {runs, tokens, cost, currency};
 * - assistant_outcomes_daily {completed, failed, cancelled?, containment
 *   (null on empty → "insufficient data", never 0%)};
 * - assistant_csat_daily {up, down, ratio}.
 *
 * Metrics render generically (key: value) with dedicated formatting for the
 * verified keys — unrecognized keys display raw, never crash. Days 1–365
 * (server default 30).
 */

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.6;
`;

const BackLink = styled.button`
  background: none;
  border: 0;
  padding: 0;
  margin-top: 10px;
  font-size: 12px;
  cursor: pointer;
  color: ${({ theme }) => theme.app.text.primary};
  text-decoration: underline;
  text-underline-offset: 2px;
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 12px;
`;

function formatMetric(key: string, value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    if (value === null || value === undefined) {
      return key === 'containment' || key === 'ratio' ? 'insufficient data' : '—';
    }
    return String(value);
  }
  if (key === 'containment' || key === 'ratio') {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (key === 'cost') {
    return value.toFixed(2);
  }
  if (Number.isInteger(value) || Math.abs(value) >= 1000) {
    return Math.round(value).toLocaleString();
  }
  return String(value);
}

const METRIC_ORDER = ['runs', 'tokens', 'cost', 'currency', 'completed', 'failed', 'cancelled', 'containment', 'up', 'down', 'ratio'];

function metricKeys(metrics: Record<string, unknown>): string[] {
  const keys = Object.keys(metrics);
  return keys.sort((a, b) => {
    const ia = METRIC_ORDER.indexOf(a);
    const ib = METRIC_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) {
      return a.localeCompare(b);
    }
    if (ia === -1) {
      return 1;
    }
    if (ib === -1) {
      return -1;
    }
    return ia - ib;
  });
}

export function ObservePanel({ assistantId }: { assistantId: string }) {
  const [kind, setKind] = useState<string>('assistant_usage_daily');
  const [days, setDays] = useState('30');
  const daysNumber = Math.min(Math.max(1, Math.round(Number(days) || 30)), 365);
  const rollups = useAnalyticsRollups({ kind, days: daysNumber, assistantId });

  const totals = useMemo(() => {
    const rows = rollups.data ?? [];
    const sums = new Map<string, number>();
    let points = 0;
    for (const row of rows) {
      points += 1;
      for (const [key, value] of Object.entries(row.metrics)) {
        if (typeof value === 'number' && Number.isFinite(value) && key !== 'ratio' && key !== 'containment') {
          sums.set(key, (sums.get(key) ?? 0) + value);
        }
      }
    }
    return { sums, points };
  }, [rollups.data]);

  return (
    <Panel
      title="Observe"
      subtitle="Per-assistant daily rollups. Containment = completed ÷ (completed + escalated), null on empty — shown as insufficient data, never zero."
    >
      <Controls>
        <label style={{ fontSize: 13 }}>
          Kind
          <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ display: 'block', marginTop: 4 }}>
            {ROLLUP_KINDS.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 13 }}>
          Days (1–365)
          <input type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} style={{ display: 'block', marginTop: 4, width: 100 }} />
        </label>
      </Controls>
      <QueryView
        query={rollups}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'No rollups yet', description: 'Rollups materialize off run/feedback events — traffic first, charts after.' }}
      >
        {(rows) => (
          <>
            <p style={{ fontSize: 13 }}>
              {totals.points} day{totals.points === 1 ? '' : 's'}
              {[...totals.sums.entries()].map(([key, value]) => (
                <span key={key}> · {key}: <Mono>{formatMetric(key, value)}</Mono></span>
              ))}
            </p>
            <DataTable>
              <DataHead>
                <DataCell $w="22%">Day</DataCell>
                <DataCell $w="78%">Metrics</DataCell>
              </DataHead>
              {rows.map((row: AnalyticsRollup, i: number) => (
                <DataRow key={`${row.kind}-${row.periodStart ?? i}`} $interactive={false}>
                  <DataCell $w="22%">
                    <Mono>{row.periodStart ? row.periodStart.slice(0, 10) : <Muted>—</Muted>}</Mono>
                  </DataCell>
                  <DataCell $w="78%">
                    {metricKeys(row.metrics).map((key) => (
                      <span key={key} style={{ marginRight: 14, fontSize: 13 }}>
                        {key}: <Mono>{formatMetric(key, row.metrics[key])}</Mono>
                      </span>
                    ))}
                    {Object.keys(row.metrics).length === 0 && <Muted>—</Muted>}
                  </DataCell>
                </DataRow>
              ))}
            </DataTable>
            <BackLink
              type="button"
              onClick={() => document.getElementById('operate-panel')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })}
            >
              Back to Operate ↑
            </BackLink>
          </>
        )}
      </QueryView>
    </Panel>
  );
}
