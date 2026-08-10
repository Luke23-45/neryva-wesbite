import { motion } from 'framer-motion';
import { FlaskConical, ShieldCheck } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import experiments from '@neryva_data/products/deployment/experiments.json';
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
  ExpGrid,
  ExpCard,
  ExpTop,
  ExpLeft,
  ExpName,
  ExpMeta,
  VariantRow,
  Variant,
  VariantHeader,
  VariantName,
  VariantValue,
  VariantSamples,
  ResultRow,
  ResultItem,
  ResultLabel,
  ResultValue,
  Mono,
  GuardrailGrid,
  Guardrail,
  GuardrailTop,
  GuardrailName,
  GuardrailLimit,
} from './ExperimentsView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 },
  }),
};

const kindLabel: Record<string, string> = {
  'champion-challenger': 'champion / challenger',
  canary: 'canary',
  ab: 'A/B',
};

const statusTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  running: 'success',
  concluded: 'neutral',
};

const liftTone = (lift: number) => {
  if (lift >= 5) return 'emerald';
  if (lift >= 0) return 'azure';
  if (lift >= -5) return 'warning';
  return 'warning';
};

export function ExperimentsView() {
  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>Experiments</PageTitle>
          <PageSubtitle>
            A/B tests, canaries, and champion/challenger rollouts with statistical significance
            tracking.
          </PageSubtitle>
        </TitleBlock>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <KpiGrid>
          <TotalCard>
            <TotalLabel>Running</TotalLabel>
            <TotalValue>{experiments.summary.running}</TotalValue>
            <TotalMeta>active experiments</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Concluded (30d)</TotalLabel>
            <TotalValue>{experiments.summary.completedLast30d}</TotalValue>
            <TotalMeta>archived reports</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Avg lift</TotalLabel>
            <TotalValue style={{ color: '#34d399' }}>+{experiments.summary.avgLift}%</TotalValue>
            <TotalMeta>primary metric</TotalMeta>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Stat. significance</TotalLabel>
            <TotalValue>{experiments.summary.statSigRate}%</TotalValue>
            <TotalMeta>p < 0.05 reached</TotalMeta>
          </TotalCard>
        </KpiGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
        <SectionTitle>
          <FlaskConical size={14} strokeWidth={1.7} />
          Active and recent experiments
        </SectionTitle>
        <ExpGrid>
          {experiments.experiments.map((x, i) => (
            <ExpCard
              key={x.id}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i + 3}
            >
              <ExpTop>
                <ExpLeft>
                  <ExpName>
                    {x.name}
                    <StatusPill tone={statusTone[x.status]}>{x.status}</StatusPill>
                  </ExpName>
                  <ExpMeta>
                    {x.deployment} · {kindLabel[x.kind]} · {x.startedAt} · split {x.trafficSplit}
                  </ExpMeta>
                </ExpLeft>
              </ExpTop>
              <VariantRow>
                <Variant>
                  <VariantHeader>
                    <VariantName>{x.control.name}</VariantName>
                  </VariantHeader>
                  <VariantValue>{x.control.value}</VariantValue>
                  <VariantSamples>
                    {x.control.samples.toLocaleString()} samples · metric: {x.primaryMetric}
                  </VariantSamples>
                </Variant>
                <Variant>
                  <VariantHeader>
                    <VariantName>{x.treatment.name}</VariantName>
                  </VariantHeader>
                  <VariantValue>{x.treatment.value}</VariantValue>
                  <VariantSamples>
                    {x.treatment.samples.toLocaleString()} samples
                  </VariantSamples>
                </Variant>
              </VariantRow>
              <ResultRow>
                <ResultItem>
                  <ResultLabel>Lift</ResultLabel>
                  <ResultValue $tone={liftTone(x.lift)}>
                    {x.lift > 0 ? '+' : ''}
                    {x.lift}%
                  </ResultValue>
                </ResultItem>
                <ResultItem>
                  <ResultLabel>p-value</ResultLabel>
                  <ResultValue $tone="azure">
                    <Mono>{x.pValue}</Mono>
                  </ResultValue>
                </ResultItem>
                <ResultItem>
                  <ResultLabel>Confidence</ResultLabel>
                  <ResultValue $tone="emerald">{x.confidence}%</ResultValue>
                </ResultItem>
                <ResultItem>
                  <ResultLabel>Status</ResultLabel>
                  <ResultValue $tone={x.status === 'running' ? 'azure' : 'neutral'}>
                    {x.status === 'running' ? 'collecting' : 'archived'}
                  </ResultValue>
                </ResultItem>
              </ResultRow>
            </ExpCard>
          ))}
        </ExpGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={12}>
        <SectionTitle>
          <ShieldCheck size={14} strokeWidth={1.7} />
          Global guardrails
        </SectionTitle>
        <GuardrailGrid>
          {experiments.guardrails.map((g, i) => {
            const tone: 'success' | 'error' = g.tone === 'emerald' ? 'success' : 'error';
            return (
              <Guardrail
                key={g.id}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 13}
              >
                <GuardrailTop>
                  <GuardrailName>{g.metric}</GuardrailName>
                  <StatusPill tone={tone}>{g.status}</StatusPill>
                </GuardrailTop>
                <GuardrailLimit>limit: {g.limit}</GuardrailLimit>
              </Guardrail>
            );
          })}
        </GuardrailGrid>
      </motion.div>
    </PageRoot>
  );
}
