import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Panel } from '@components/common/ui/Panel';
import { MetricCard } from '@components/common/ui/MetricCard';
import { Sparkline } from '@components/common/ui/Sparkline';
import { StudioAreaChart } from '@components/common/ui/StudioAreaChart';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { spring } from '@styles/motion';
import dashboard from '@neryva_data/products/agent_studio/dashboard.json';

import {
  PageRoot,
  PageHeader,
  PageTitle,
  PageSubtitle,
  KpiGrid,
  TwoColumn,
  ChartWrap,
  AgentsTable,
  TableHeader,
  TableRow,
  Cell,
  AgentName,
  Metric,
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
} from './DashboardView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: premiumEase, delay: i * 0.06 },
  }),
};

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

export function DashboardView() {
  const data = dashboard;
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const points = range === '90d'
    ? data.usage.points
    : range === '7d'
      ? data.usage.points.slice(-7)
      : data.usage.points;
  return (
    <PageRoot>
      <PageHeader
        as={motion.div}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <PageTitle>Dashboard</PageTitle>
        <PageSubtitle>
          Monitor usage, performance, and live activity across your agents.
        </PageSubtitle>
      </PageHeader>

      <Section
        as={motion.div}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={1}
      >
        <KpiGrid>
          {data.kpis.map((kpi, i) => (
            <motion.div key={kpi.label} variants={fadeUp} custom={i + 2}>
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
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6} style={{ flex: 1 }}>
          <Panel
            title={data.usage.title}
            subtitle={data.usage.subtitle}
            action={
              <RangeToggle role="tablist" aria-label="Time range">
                <RangePill
                  $active={range === '7d'}
                  layout
                  transition={spring.snap}
                />
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

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7} style={{ flex: 1 }}>
          <Panel
            title="Activity"
            subtitle="Live events from your agents"
            action={
              <Link to="/agent-studio/activity" style={{ color: '#93c5fd', fontSize: 12.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                View all <ArrowRight size={11} strokeWidth={1.8} />
              </Link>
            }
          >
            <ActivityList>
              {data.activity.map((a) => (
                <ActivityRow key={a.id}>
                  <ActivityTime>{a.time}</ActivityTime>
                  <ActivityDot $tone={activityToneMap[a.kind] ?? 'info'} aria-hidden="true" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: '#f5f7fb' }}>{a.title}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(229,231,235,0.55)', marginTop: 2 }}>
                      {a.agent}
                    </div>
                  </div>
                </ActivityRow>
              ))}
            </ActivityList>
          </Panel>
        </motion.div>
      </TwoColumn>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={8}>
        <Panel
          title="Agent performance"
          subtitle="Volume, latency, and resolution by agent"
          action={
            <Link to="/agent-studio/agents" style={{ color: '#93c5fd', fontSize: 12.5, textDecoration: 'none' }}>
              All agents →
            </Link>
          }
        >
          <AgentsTable>
            <TableHeader>
              <Cell $w="28%">Agent</Cell>
              <Cell $w="14%">Status</Cell>
              <Cell $w="16%">Model</Cell>
              <Cell $w="14%" $align="right">Volume</Cell>
              <Cell $w="14%">Latency</Cell>
              <Cell $w="14%">Resolution</Cell>
            </TableHeader>
            {data.agents.map((a) => (
              <TableRow key={a.id}>
                <Cell $w="28%">
                  <AgentName>{a.name}</AgentName>
                </Cell>
                <Cell $w="14%">
                  <StatusPill tone={statusTone[a.status]}>{a.status}</StatusPill>
                </Cell>
                <Cell $w="16%">
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'rgba(229,231,235,0.7)' }}>
                    {a.model}
                  </span>
                </Cell>
                <Cell $w="14%" $align="right">
                  <Metric>{a.volume.toLocaleString()}</Metric>
                </Cell>
                <Cell $w="14%">
                  <Metric>{a.status === 'draft' ? '—' : `${(a.responseMs / 1000).toFixed(2)}s`}</Metric>
                </Cell>
                <Cell $w="14%">
                  <Bar>
                    <ProgressBar
                      value={a.resolution}
                      tone={a.tone === 'warning' ? 'amber' : a.tone === 'emerald' ? 'emerald' : 'azure'}
                    />
                  </Bar>
                </Cell>
              </TableRow>
            ))}
          </AgentsTable>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={9}>
        <SectionTitle>
          <Activity size={14} strokeWidth={1.7} />
          System health
          <Link to="/agent-studio/activity" style={{ marginLeft: 'auto', color: '#93c5fd', fontSize: 12.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            View all activity <ArrowRight size={11} strokeWidth={1.8} />
          </Link>
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
    </PageRoot>
  );
}

/**
 * iOS-style segmented control. The selection pill is a `motion.span`
 * with `layout` so it slides between buttons with a snappy spring —
 * matches the iOS Settings app top-level nav.
 */
import styled from 'styled-components';

const RangeToggle = styled.div`
  position: relative;
  display: inline-flex;
  gap: 0;
  padding: 3px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
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
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  border-radius: 7px;
  color: ${({ $active }) => ($active ? '#0b0d12' : 'rgba(229, 231, 235, 0.65)')};
  cursor: pointer;
  min-width: 44px;
  font-variant-numeric: tabular-nums;
  transition: color ${({ theme }) => theme.transitions.fast};
`;
