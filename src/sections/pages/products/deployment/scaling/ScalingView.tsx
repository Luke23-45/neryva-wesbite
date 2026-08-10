import { motion } from 'framer-motion';
import { Gauge, Globe2, Clock, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import scaling from '@neryva_data/products/deployment/scaling.json';
import {
  PageRoot,
  PageHeader,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  SectionTitle,
  KpiGrid,
  TotalCard,
  TotalLabel,
  TotalValue,
  TotalMeta,
  RuleGrid,
  RuleCard,
  RuleTop,
  RuleLeft,
  RuleName,
  RuleTarget,
  MetaGrid,
  MetaItem,
  MetaLabel,
  MetaValue,
  ReplicaBar,
  ReplicaFill,
  RegionGrid,
  RegionCard,
  RegionTop,
  RegionLeft,
  RegionCode,
  RegionName,
  UtilRow,
  UtilLabel,
  UtilValue,
  ReplicaMeta,
  Mono,
  EventTable,
  EventHead,
  EventRow,
  Th,
  Td,
  Delta,
} from './ScalingView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 },
  }),
};

const ruleTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  throttled: 'warning',
  paused: 'neutral',
};

const regionTone: Record<string, 'emerald' | 'warning' | 'azure'> = {
  healthy: 'emerald',
  hot: 'warning',
  idle: 'azure',
};

function DeltaArrow({ tone, delta }: { tone: string; delta: number }) {
  if (delta === 0) {
    return (
      <Delta $tone={tone}>
        <Minus size={12} strokeWidth={1.7} />
        {delta}
      </Delta>
    );
  }
  if (delta > 0) {
    return (
      <Delta $tone={tone}>
        <ArrowUp size={12} strokeWidth={1.7} />
        {delta}
      </Delta>
    );
  }
  return (
    <Delta $tone={tone}>
      <ArrowDown size={12} strokeWidth={1.7} />
      {Math.abs(delta)}
    </Delta>
  );
}

export function ScalingView() {
  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>Scaling</PageTitle>
          <PageSubtitle>
            Auto-scaling rules, regional capacity, and replica lifecycle across all deployments.
          </PageSubtitle>
        </TitleBlock>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <KpiGrid>
          <TotalCard>
            <TotalLabel>Active rules</TotalLabel>
            <TotalValue>{scaling.summary.activeRules}</TotalValue>
            <TotalMeta>{scaling.rules.filter((r) => r.status === 'throttled').length} throttled</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Avg utilization</TotalLabel>
            <TotalValue style={{ color: '#fbbf24' }}>{scaling.summary.avgUtilization}%</TotalValue>
            <TotalMeta>across regions</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Peak replicas</TotalLabel>
            <TotalValue>{scaling.summary.peakReplicas}</TotalValue>
            <TotalMeta>last 24 hours</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Scale events</TotalLabel>
            <TotalValue>{scaling.summary.scaleEventsLast24h}</TotalValue>
            <TotalMeta>last 24 hours</TotalMeta>
          </TotalCard>
        </KpiGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
        <SectionTitle>
          <Gauge size={14} strokeWidth={1.7} />
          Auto-scaling rules
        </SectionTitle>
        <RuleGrid>
          {scaling.rules.map((r, i) => {
            const pct = Math.round(((r.current - r.min) / Math.max(r.max - r.min, 1)) * 100);
            return (
              <RuleCard
                key={r.id}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 3}
              >
                <RuleTop>
                  <RuleLeft>
                    <RuleName>
                      {r.name}
                      <StatusPill tone={ruleTone[r.status]}>{r.status}</StatusPill>
                    </RuleName>
                    <RuleTarget>target: {r.target} · metric: {r.metric}</RuleTarget>
                  </RuleLeft>
                </RuleTop>
                <MetaGrid>
                  <MetaItem>
                    <MetaLabel>Desired</MetaLabel>
                    <MetaValue>{r.desired}</MetaValue>
                  </MetaItem>
                  <MetaItem>
                    <MetaLabel>Min</MetaLabel>
                    <MetaValue>{r.min}</MetaValue>
                  </MetaItem>
                  <MetaItem>
                    <MetaLabel>Max</MetaLabel>
                    <MetaValue>{r.max}</MetaValue>
                  </MetaItem>
                  <MetaItem>
                    <MetaLabel>Cooldown</MetaLabel>
                    <MetaValue>{r.cooldown}</MetaValue>
                  </MetaItem>
                </MetaGrid>
                <ReplicaBar>
                  <ReplicaFill $pct={pct} $tone={r.tone} />
                </ReplicaBar>
                <ReplicaMeta>
                  <span>
                    Replicas:{' '}
                    <Mono style={{ color: '#f5f7fb' }}>
                      {r.current} / {r.max}
                    </Mono>
                  </span>
                  <span>{pct}% of range</span>
                </ReplicaMeta>
              </RuleCard>
            );
          })}
        </RuleGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={12}>
        <SectionTitle>
          <Globe2 size={14} strokeWidth={1.7} />
          Regional capacity
        </SectionTitle>
        <RegionGrid>
          {scaling.regions.map((reg, i) => {
            const fillPct = reg.util;
            return (
              <RegionCard
                key={reg.code}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 13}
              >
                <RegionTop>
                  <RegionLeft>
                    <RegionCode>{reg.code}</RegionCode>
                    <RegionName>{reg.name}</RegionName>
                  </RegionLeft>
                  <StatusPill tone={regionTone[reg.status]}>{reg.status}</StatusPill>
                </RegionTop>
                <ReplicaBar>
                  <ReplicaFill $pct={fillPct} $tone={reg.tone} />
                </ReplicaBar>
                <UtilRow>
                  <UtilLabel>Utilization</UtilLabel>
                  <UtilValue $tone={reg.tone}>{reg.util}%</UtilValue>
                </UtilRow>
                <ReplicaMeta>
                  <span>
                    Replicas{' '}
                    <Mono style={{ color: '#f5f7fb' }}>
                      {reg.replicas} / {reg.max}
                    </Mono>
                  </span>
                  <span>{reg.max - reg.replicas} available</span>
                </ReplicaMeta>
              </RegionCard>
            );
          })}
        </RegionGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={21}>
        <SectionTitle>
          <Clock size={14} strokeWidth={1.7} />
          Recent scale events
        </SectionTitle>
        <EventTable>
          <EventHead>
            <Th>Time</Th>
            <Th>Rule</Th>
            <Th>Action</Th>
            <Th>From</Th>
            <Th>To</Th>
          </EventHead>
          {scaling.events.map((e) => {
            const delta = e.to - e.from;
            return (
              <EventRow key={e.id}>
                <Td>
                  <Mono style={{ color: 'rgba(229, 231, 235, 0.55)' }}>{e.time}</Mono>
                </Td>
                <Td>{e.rule}</Td>
                <Td>
                  <DeltaArrow tone={e.tone} delta={delta > 0 ? 1 : delta < 0 ? -1 : 0} />
                  <span style={{ marginLeft: 6 }}>{e.action}</span>
                </Td>
                <Td>
                  <Mono>{e.from}</Mono>
                </Td>
                <Td>
                  <Mono>{e.to}</Mono>
                </Td>
              </EventRow>
            );
          })}
        </EventTable>
      </motion.div>
    </PageRoot>
  );
}
