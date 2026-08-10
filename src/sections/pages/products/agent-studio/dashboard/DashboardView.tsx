import { motion } from 'framer-motion';
import { Activity, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Panel } from '@components/common/ui/Panel';
import { MetricCard } from '@components/common/ui/MetricCard';
import { Sparkline } from '@components/common/ui/Sparkline';
import { StudioAreaChart } from '@components/common/ui/StudioAreaChart';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ProgressBar } from '@components/common/ui/ProgressBar';
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
          <Panel title={data.usage.title} subtitle={data.usage.subtitle}>
            <ChartWrap>
              <StudioAreaChart
                data={data.usage.points}
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
          <Panel title="Activity" subtitle="Live events from your agents">
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
          <Link to="/agent-studio/integrations" style={{ marginLeft: 'auto', color: '#93c5fd', fontSize: 12.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Status page <ArrowRight size={11} strokeWidth={1.8} />
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
