import { motion } from 'framer-motion';
import { Server, Globe } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import infrastructure from '@neryva_data/products/deployment/infrastructure.json';
import {
  PageRoot,
  PageHeader,
  PageTitle,
  PageSubtitle,
  TotalsGrid,
  TotalCard,
  TotalLabel,
  TotalValue,
  SectionTitle,
  RegionGrid,
  RegionCard,
  RegionTop,
  RegionName,
  RegionId,
  RegionLocation,
  RegionMetrics,
  MetricRow,
  MetricLabel,
  MetricValue,
  RuntimeGrid,
  RuntimeCard,
  RuntimeTop,
  RuntimeName,
  RuntimeCount,
} from './InfrastructureView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.05 },
  }),
};

const statusTone: Record<string, 'success' | 'warning' | 'azure' | 'amber'> = {
  healthy: 'success',
  degraded: 'warning',
};

const runtimeTone: Record<string, 'amber' | 'azure' | 'emerald'> = {
  amber: 'amber',
  azure: 'azure',
  emerald: 'emerald',
  warning: 'amber',
};

function parsePct(s: string): number {
  if (!s || s === '—') return 0;
  return parseInt(s.replace('%', ''), 10) || 0;
}

export function InfrastructureView() {
  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <PageTitle>Infrastructure</PageTitle>
        <PageSubtitle>
          Region health, cluster utilization, and runtime distribution across your fleet.
        </PageSubtitle>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <TotalsGrid>
          <TotalCard>
            <TotalLabel>Regions</TotalLabel>
            <TotalValue>{infrastructure.totals.regions}</TotalValue>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Nodes</TotalLabel>
            <TotalValue>{infrastructure.totals.nodes}</TotalValue>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Deployments</TotalLabel>
            <TotalValue>{infrastructure.totals.deployments}</TotalValue>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Throughput</TotalLabel>
            <TotalValue>{(infrastructure.totals.rps / 1000).toFixed(1)}k rps</TotalValue>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Uptime</TotalLabel>
            <TotalValue>{infrastructure.totals.uptime}</TotalValue>
          </TotalCard>
        </TotalsGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
        <SectionTitle>
          <Globe size={14} strokeWidth={1.7} />
          Regions
        </SectionTitle>
        <RegionGrid>
          {infrastructure.regions.map((r, i) => (
            <RegionCard
              key={r.id}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i + 3}
            >
              <RegionTop>
                <RegionName>
                  <RegionId>{r.name}</RegionId>
                  <RegionLocation>{r.location}</RegionLocation>
                </RegionName>
                <StatusPill tone={statusTone[r.status]}>{r.status}</StatusPill>
              </RegionTop>
              <RegionMetrics>
                <MetricRow>
                  <MetricLabel>
                    CPU
                    <MetricValue>{r.cpu}</MetricValue>
                  </MetricLabel>
                  <ProgressBar value={parsePct(r.cpu)} tone="azure" height={4} />
                </MetricRow>
                <MetricRow>
                  <MetricLabel>
                    Memory
                    <MetricValue>{r.memory}</MetricValue>
                  </MetricLabel>
                  <ProgressBar value={parsePct(r.memory)} tone="emerald" height={4} />
                </MetricRow>
                <MetricRow>
                  <MetricLabel>
                    GPU
                    <MetricValue>{r.gpu}</MetricValue>
                  </MetricLabel>
                  <ProgressBar value={parsePct(r.gpu)} tone="amber" height={4} />
                </MetricRow>
              </RegionMetrics>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11.5,
                  color: 'rgba(229, 231, 235, 0.55)',
                  paddingTop: 8,
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <span>
                  <strong style={{ color: '#f5f7fb', fontWeight: 500 }}>{r.nodes}</strong> nodes
                </span>
                <span>
                  <strong style={{ color: '#f5f7fb', fontWeight: 500 }}>{r.deployments}</strong> deployments
                </span>
                <span>{r.network}</span>
              </div>
            </RegionCard>
          ))}
        </RegionGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={12}>
        <SectionTitle>
          <Server size={14} strokeWidth={1.7} />
          Runtimes
        </SectionTitle>
        <Panel title="Runtime distribution" subtitle="Active deployments per inference runtime.">
          <RuntimeGrid>
            {infrastructure.runtimes.map((rt, i) => (
              <RuntimeCard
                key={rt.name}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 13}
              >
                <RuntimeTop>
                  <RuntimeName>{rt.name}</RuntimeName>
                  <RuntimeCount>{rt.deployments} deployments</RuntimeCount>
                </RuntimeTop>
                <div style={{ marginTop: 4 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11.5,
                      color: 'rgba(229, 231, 235, 0.55)',
                      marginBottom: 5,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    <span>utilization</span>
                    <span style={{ color: '#f5f7fb', fontWeight: 500 }}>{rt.utilization}</span>
                  </div>
                  <ProgressBar value={parsePct(rt.utilization)} tone={runtimeTone[rt.tone] ?? 'azure'} />
                </div>
              </RuntimeCard>
            ))}
          </RuntimeGrid>
        </Panel>
      </motion.div>
    </PageRoot>
  );
}
