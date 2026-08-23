import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Panel } from '@components/common/ui/Panel';
import { LinkAction } from '@components/common/ui/LinkAction';
import { CellMono, CellMeta } from '@components/common/ui/DataTable';
import { MetricCard } from '@components/common/ui/MetricCard';
import { Sparkline } from '@components/common/ui/Sparkline';
import { StudioAreaChart } from '@components/common/ui/StudioAreaChart';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { spring, pageItem } from '@styles/motion';
import dashboard from '@neryva_data/products/deployment/dashboard.json';

import {
  KpiGrid,
  TwoColumn,
  ChartWrap,
  PipelinesTable,
  TableHeader,
  TableRow,
  Cell,
  PipelineName,
  Bar,
  ActivityList,
  ActivityRow,
  ActivityDot,
  ActivityTime,
  HealthStrip,
  HealthItem,
  HealthLabel,
  HealthValue,
  Section,
  SectionTitle,
  ActivityTitle,
  ActivityAgent,
} from './DashboardView.styles';
import styled from 'styled-components';

const statusTone: Record<string, 'success' | 'warning' | 'neutral' | 'azure'> = {
  running: 'azure',
  healthy: 'success',
  queued: 'warning',
  review: 'azure',
};

const activityToneMap: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
  deploy: 'success',
  alert: 'warning',
  rollback: 'error',
  audit: 'info',
  config: 'info',
};

export function DashboardView() {
  const data = dashboard;
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const points = range === '90d'
    ? data.throughput.points
    : range === '7d'
      ? data.throughput.points.slice(-7)
      : data.throughput.points;

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Dashboard</ViewTitle>
        <ViewSubtitle>
          Monitor deployments, pipelines, and infrastructure health across all regions.
        </ViewSubtitle>
      </ViewHeader>

      <Section as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={1}>
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
      </Section>

      <TwoColumn>
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={6} style={{ flex: 1 }}>
          <Panel
            title={data.throughput.title}
            subtitle={data.throughput.subtitle}
            action={
              <RangeToggle role="tablist" aria-label="Time range">
                <RangePill $active={range === '7d'} layout transition={spring.snap} />
                {(['7d', '30d', '90d'] as const).map((r) => (
                  <RangeBtn
                    key={r}
                    type="button"
                    role="tab"
                    aria-selected={range === r}
                    $active={range === r}
                    onClick={() => setRange(r)}
                    whileTap={{ scale: 0.96 }}
                    transition={spring.snap}
                  >
                    {r}
                  </RangeBtn>
                ))}
              </RangeToggle>
            }
          >
            <ChartWrap>
              <StudioAreaChart
                data={points}
                series={data.throughput.series.map((s) => ({
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

        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={7} style={{ flex: 1 }}>
          <Panel
            title="Activity"
            subtitle="Live events from your deployments"
            action={
              <LinkAction to="/deployment/logs">View all</LinkAction>
            }
          >
            <ActivityList>
              {data.activity.map((a) => (
                <ActivityRow key={a.id}>
                  <ActivityTime>{a.time}</ActivityTime>
                  <ActivityDot $tone={activityToneMap[a.kind] ?? 'info'} aria-hidden="true" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ActivityTitle>{a.title}</ActivityTitle>
                    <ActivityAgent>
                      {a.agent} · {a.pipeline}
                    </ActivityAgent>
                  </div>
                </ActivityRow>
              ))}
            </ActivityList>
          </Panel>
        </motion.div>
      </TwoColumn>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={8}>
        <Panel
          title="Active pipelines"
          subtitle="Pipeline status and stage progress"
          action={
            <LinkAction to="/deployment/pipelines">All pipelines</LinkAction>
          }
        >
          <PipelinesTable>
            <TableHeader>
              <Cell $w="32%">Pipeline</Cell>
              <Cell $w="14%">Env</Cell>
              <Cell $w="14%">Stage</Cell>
              <Cell $w="14%">Status</Cell>
              <Cell $w="26%">Progress</Cell>
            </TableHeader>
            {data.pipelines.map((p) => (
              <TableRow key={p.id}>
                <Cell $w="32%">
                  <PipelineName>{p.name}</PipelineName>
                </Cell>
                <Cell $w="14%">
                  <CellMono>{p.env}</CellMono>
                </Cell>
                <Cell $w="14%">
                  <CellMeta>{p.stage}</CellMeta>
                </Cell>
                <Cell $w="14%">
                  <StatusPill tone={statusTone[p.status]}>{p.status}</StatusPill>
                </Cell>
                <Cell $w="26%">
                  <Bar>
                    <ProgressBar
                      value={p.progress}
                      tone={p.tone === 'warning' ? 'amber' : p.tone === 'emerald' ? 'emerald' : 'azure'}
                    />
                  </Bar>
                </Cell>
              </TableRow>
            ))}
          </PipelinesTable>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={9}>
        <SectionTitle>
          <Activity size={14} strokeWidth={1.7} />
          System health
          <LinkAction to="/deployment/infrastructure">View infrastructure</LinkAction>
        </SectionTitle>
        <HealthStrip>
          {data.health.map((h) => (
            <HealthItem key={h.label}>
              <HealthLabel>{h.label}</HealthLabel>
              <HealthValue>{h.value}</HealthValue>
              <StatusPill tone={h.tone as 'emerald' | 'azure' | 'amber'}>ok</StatusPill>
            </HealthItem>
          ))}
        </HealthStrip>
      </motion.div>
    </ViewShell>
  );
}

const RangeToggle = styled.div`
  position: relative;
  display: inline-flex;
  gap: 0;
  padding: 3px;
  border-radius: 9px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

const RangePill = styled(motion.span)<{ $active: boolean }>`
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: ${({ $active }) => ($active ? 'auto' : '3px')};
  right: ${({ $active }) => ($active ? '3px' : 'auto')};
  width: ${({ $active }) => ($active ? 'auto' : 'calc(33.33% - 2px)')};
  border-radius: 7px;
  background: rgba(245, 247, 251, 0.95);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.30);
  z-index: 0;
`;

const RangeBtn = styled(motion.button)<{ $active: boolean }>`
  position: relative;
  z-index: 1;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 7px;
  color: ${({ $active }) => ($active ? '#0b0d12' : 'rgba(229, 231, 235, 0.65)')};
  cursor: pointer;
  min-width: 44px;
  font-variant-numeric: tabular-nums;
  transition: color ${({ theme }) => theme.transitions.fast};
`;
