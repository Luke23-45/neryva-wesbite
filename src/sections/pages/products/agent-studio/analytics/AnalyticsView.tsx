import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { StatusPill } from '@components/common/ui/StatusPill';
import { StudioAreaChart } from '@components/common/ui/StudioAreaChart';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Segmented } from '@components/common/ui/Segmented';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, KpiGrid, SectionTitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
  CellPrimary,
  CellMono,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { useState } from 'react';
import { useAssistants } from '@hooks/studio/useAssistants';
import { parseOverviewKpis, parseSeries, rangeDates, useUsageOverview, useUsageSeries } from '@hooks/engine/usage';

import { ChartWrap } from './AnalyticsView.styles';

/**
 * Analytics (ledger G-3) — real metering KPIs and series from the engine's
 * usage endpoints, with the agent roster from the assistants API. Quality
 * metrics (resolution, CSAT, channels, regions) are ⛔ E-7 — the fabricated
 * donut, regional cards, and invented deltas are gone; the page ships only
 * what the backend can prove.
 */

type Range = '7d' | '30d' | '90d';
const rangeOptions: { value: Range; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

const SERIES_COLORS = ['#8b8ff8', '#05e3a4', '#f5b942'];

export function AnalyticsView() {
  const [range, setRange] = useState<Range>('30d');
  const dates = rangeDates(range);

  const overview = useUsageOverview('agent_studio', dates);
  const series = useUsageSeries('agent_studio', dates);
  const assistants = useAssistants();

  const kpis = parseOverviewKpis(overview.data, 4);
  const chart = parseSeries(series.data);

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Analytics</ViewTitle>
        <ViewSubtitle>
          Metered usage for Agent Studio. Quality metrics (resolution, CSAT, channels) land with the engine's
          analytics rollups (A-9/E-7).
        </ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <QueryView query={overview} skeleton={<Skeleton $h="120px" $r="12px" />}>
          {() => (
            <KpiGrid>
              {kpis.length > 0 ? (
                kpis.map((kpi) => (
                  <Panel key={kpi.key} title={kpi.label}>
                    <div style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
                  </Panel>
                ))
              ) : (
                <Panel title="Usage">
                  <div style={{ fontSize: 14, opacity: 0.55 }}>No usage recorded in this period yet.</div>
                </Panel>
              )}
            </KpiGrid>
          )}
        </QueryView>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel
          title="Usage over time"
          subtitle="Metered events per day"
          action={
            <Segmented options={rangeOptions} value={range} onChange={setRange} ariaLabel="Analytics range" />
          }
        >
          <ChartWrap>
            {chart.valueKeys.length > 0 && chart.points.length > 0 ? (
              <StudioAreaChart
                data={chart.points}
                series={chart.valueKeys.map((key, i) => ({
                  dataKey: key,
                  name: key.replace(/_/g, ' '),
                  color: SERIES_COLORS[i % SERIES_COLORS.length],
                  gradientId: `analytics-grad-${key}`,
                }))}
                height={280}
              />
            ) : (
              <ChartEmpty>No series in this window yet — the chart fills as events flow through the engine.</ChartEmpty>
            )}
          </ChartWrap>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
        <SectionTitle>Your agents</SectionTitle>
        <Panel flush>
          <QueryView
            query={assistants}
            skeleton={<Skeleton $h="160px" $r="12px" />}
            isEmpty={(d) => d.length === 0}
            empty={{ title: 'No agents yet', description: 'Create agents to see per-agent analytics here.' }}
          >
            {(data) => (
              <DataTable>
                <DataHead>
                  <DataCell $w="44%">Agent</DataCell>
                  <DataCell $w="20%">Status</DataCell>
                  <DataCell $w="20%">Model</DataCell>
                  <DataCell $w="16%" />
                </DataHead>
                {data.map((a) => (
                  <DataRow key={a.id} $interactive={false}>
                    <DataCell $w="44%">
                      <CellPrimary>{a.name}</CellPrimary>
                    </DataCell>
                    <DataCell $w="20%">
                      {a.status ? <StatusPill tone={a.status === 'active' ? 'success' : 'neutral'}>{a.status}</StatusPill> : <span style={{ opacity: 0.4 }}>—</span>}
                    </DataCell>
                    <DataCell $w="20%">
                      {a.model ? <CellMono>{a.model}</CellMono> : <span style={{ opacity: 0.4 }}>—</span>}
                    </DataCell>
                    <DataCell $w="16%">
                      <a href={`/agent-studio/agents/${a.id}`} style={{ fontSize: 13, color: '#8b8ff8', textDecoration: 'none' }}>
                        Open →
                      </a>
                    </DataCell>
                  </DataRow>
                ))}
              </DataTable>
            )}
          </QueryView>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}

const ChartEmpty = styled.div`
  padding: 44px 16px;
  text-align: center;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.faint};
`;
