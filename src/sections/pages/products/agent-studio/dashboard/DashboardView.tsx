import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { MetricCard } from '@components/common/ui/MetricCard';
import { Sparkline } from '@components/common/ui/Sparkline';
import { StudioAreaChart } from '@components/common/ui/StudioAreaChart';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { Segmented } from '@components/common/ui/Segmented';
import { LinkAction } from '@components/common/ui/LinkAction';
import {
  ViewShell,
  ViewHeader,
  ViewTitle,
  ViewSubtitle,
  SectionTitle,
  KpiGrid,
} from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
  CellPrimary,
  CellMono,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import dashboard from '@neryva_data/products/agent_studio/dashboard.json';

import {
  TwoColumn,
  ChartWrap,
  ActivityList,
  ActivityRow,
  ActivityDot,
  ActivityTime,
  ActivityTitle,
  ActivityAgent,
  HealthStrip,
  HealthItem,
  HealthLabel,
  HealthValue,
  Bar,
} from './DashboardView.styles';

const statusTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  paused: 'warning',
  draft: 'neutral',
};

const activityToneMap: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
  resolved: 'success',
  escalation: 'warning',
  new: 'info',
  error: 'error',
};

type Range = '7d' | '30d' | '90d';
const rangeOptions: { value: Range; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

export function DashboardView() {
  const data = dashboard;
  const [range, setRange] = useState<Range>('30d');
  const points =
    range === '90d'
      ? data.usage.points
      : range === '7d'
        ? data.usage.points.slice(-7)
        : data.usage.points;

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Dashboard</ViewTitle>
        <ViewSubtitle>
          Monitor usage, performance, and live activity across your agents.
        </ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <KpiGrid>
          {data.kpis.map((kpi, i) => (
            <motion.div key={kpi.label} variants={pageItem} custom={i + 2}>
              <MetricCard
                label={kpi.label}
                value={kpi.value}
                delta={kpi.delta}
                footnote={kpi.footnote}
                spark={<Sparkline data={kpi.spark} color={kpi.color} />}
              />
            </motion.div>
          ))}
        </KpiGrid>
      </motion.div>

      <TwoColumn>
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={6}>
          <Panel
            title={data.usage.title}
            subtitle={data.usage.subtitle}
            action={
              <Segmented
                options={rangeOptions}
                value={range}
                onChange={setRange}
                ariaLabel="Time range"
              />
            }
          >
            <ChartWrap>
              <StudioAreaChart
                data={points}
                series={data.usage.series.map((s) => ({
                  dataKey: s.key,
                  name: s.name,
                  color: s.color,
                  gradientId: `grad-${s.key}`,
                }))}
                height={280}
              />
            </ChartWrap>
          </Panel>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={7}>
          <Panel
            title="Activity"
            subtitle="Live events from your agents"
            flush
            action={<LinkAction to="/agent-studio/activity">View all</LinkAction>}
          >
            <ActivityList>
              {data.activity.map((a) => (
                <ActivityRow key={a.id}>
                  <ActivityTime>{a.time}</ActivityTime>
                  <ActivityDot $tone={activityToneMap[a.kind] ?? 'info'} aria-hidden="true" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ActivityTitle>{a.title}</ActivityTitle>
                    <ActivityAgent>{a.agent}</ActivityAgent>
                  </div>
                </ActivityRow>
              ))}
            </ActivityList>
          </Panel>
        </motion.div>
      </TwoColumn>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={8}>
        <Panel
          title="Agent performance"
          subtitle="Volume, latency, and resolution by agent"
          flush
          action={<LinkAction to="/agent-studio/agents">All agents</LinkAction>}
        >
          <DataTable>
            <DataHead>
              <DataCell $w="28%">Agent</DataCell>
              <DataCell $w="14%">Status</DataCell>
              <DataCell $w="16%">Model</DataCell>
              <DataCell $w="14%" $align="right">Volume</DataCell>
              <DataCell $w="14%">Latency</DataCell>
              <DataCell $w="14%">Resolution</DataCell>
            </DataHead>
            {data.agents.map((a) => (
              <DataRow key={a.id}>
                <DataCell $w="28%">
                  <CellPrimary>{a.name}</CellPrimary>
                </DataCell>
                <DataCell $w="14%">
                  <StatusPill tone={statusTone[a.status]}>{a.status}</StatusPill>
                </DataCell>
                <DataCell $w="16%">
                  <CellMono>{a.model}</CellMono>
                </DataCell>
                <DataCell $w="14%" $align="right">
                  <CellMono>{a.volume.toLocaleString()}</CellMono>
                </DataCell>
                <DataCell $w="14%">
                  <CellMono>
                    {a.status === 'draft' ? '—' : `${(a.responseMs / 1000).toFixed(2)}s`}
                  </CellMono>
                </DataCell>
                <DataCell $w="14%">
                  <Bar>
                    <ProgressBar
                      value={a.resolution}
                      tone={a.tone === 'warning' ? 'amber' : a.tone === 'emerald' ? 'emerald' : 'azure'}
                    />
                  </Bar>
                </DataCell>
              </DataRow>
            ))}
          </DataTable>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={9}>
        <SectionTitle>
          <Activity size={14} strokeWidth={1.7} />
          System health
          <LinkAction to="/agent-studio/activity">View all activity</LinkAction>
        </SectionTitle>
        <HealthStrip>
          {data.health.map((h) => (
            <HealthItem key={h.label}>
              <HealthLabel>{h.label}</HealthLabel>
              <HealthValue>{h.value}</HealthValue>
              <StatusPill tone={h.tone as 'emerald' | 'azure' | 'lilac'}>ok</StatusPill>
            </HealthItem>
          ))}
        </HealthStrip>
      </motion.div>
    </ViewShell>
  );
}
