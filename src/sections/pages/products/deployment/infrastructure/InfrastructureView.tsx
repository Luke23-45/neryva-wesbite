import styled from 'styled-components';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { motion } from 'framer-motion';
import { Server, Globe } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import infrastructure from '@neryva_data/products/deployment/infrastructure.json';
import { pageItem } from '@styles/motion';
import {
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
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Infrastructure</ViewTitle>
        <ViewSubtitle>
          Region health, cluster utilization, and runtime distribution across your fleet.
        </ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
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

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
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
              variants={pageItem}
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
                  <StrongNum>{r.nodes}</StrongNum> nodes
                </span>
                <span>
                  <StrongNum>{r.deployments}</StrongNum> deployments
                </span>
                <span>{r.network}</span>
              </div>
            </RegionCard>
          ))}
        </RegionGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={12}>
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
                variants={pageItem}
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
                    <StrongNum>{rt.utilization}</StrongNum>
                  </div>
                  <ProgressBar value={parsePct(rt.utilization)} tone={runtimeTone[rt.tone] ?? 'azure'} />
                </div>
              </RuntimeCard>
            ))}
          </RuntimeGrid>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}

const StrongNum = styled.span`
  color: ${({ theme }) => theme.app.text.primary};
  font-weight: 500;
  font-variant-numeric: tabular-nums;
`;
