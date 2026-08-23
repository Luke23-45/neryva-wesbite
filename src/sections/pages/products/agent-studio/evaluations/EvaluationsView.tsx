import { motion } from 'framer-motion';
import { Plus, FlaskConical, Database, CheckCircle2 } from 'lucide-react';
import evaluations from '@neryva_data/products/agent_studio/evaluations.json';
import {
  PageRoot,
  PageHeader,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  NewBtn,
  SectionTitle,
  KpiGrid,
  KpiCard,
  KpiLabel,
  KpiValue,
  KpiMeta,
  TwoCol,
  Card,
  RunTable,
  TableHeader,
  TableRow,
  Th,
  Td,
  RunName,
  RunAgent,
  PassBar,
  PassFill,
  DatasetGrid,
  DatasetCard,
  DatasetTop,
  DatasetLeft,
  DatasetName,
  DatasetMeta,
  DatasetBottom,
  DatasetExamples,
  ScorerRow,
  ScorerLeft,
  ScorerName,
  ScorerMeta,
  ScorerRuns,
  KindPill,
} from './EvaluationsView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 },
  }),
};

export function EvaluationsView() {
  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>Evaluations</PageTitle>
          <PageSubtitle>
            Regression suites, benchmarks, and safety checks for all production agents.
          </PageSubtitle>
        </TitleBlock>
        <NewBtn type="button">
          <Plus size={14} strokeWidth={2} />
          New eval run
        </NewBtn>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <KpiGrid>
          <KpiCard>
            <KpiLabel>Datasets</KpiLabel>
            <KpiValue>{evaluations.summary.datasetsCount}</KpiValue>
            <KpiMeta>active suites</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Runs (30d)</KpiLabel>
            <KpiValue>{evaluations.summary.runsThisMonth}</KpiValue>
            <KpiMeta>{Math.round(evaluations.summary.runsThisMonth / 30 * 10) / 10}/day avg</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Pass rate</KpiLabel>
            <KpiValue style={{ color: '#34d399' }}>{evaluations.summary.passingRate}%</KpiValue>
            <KpiMeta>across all suites</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Avg p95 latency</KpiLabel>
            <KpiValue>{evaluations.summary.avgLatencyMs}ms</KpiValue>
            <KpiMeta>last 30 days</KpiMeta>
          </KpiCard>
        </KpiGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
        <SectionTitle>
          <FlaskConical size={14} strokeWidth={1.7} />
          Recent runs
        </SectionTitle>
        <RunTable>
          <TableHeader>
            <Th>Run</Th>
            <Th>Dataset</Th>
            <Th>Status</Th>
            <Th>Pass rate</Th>
            <Th>p95</Th>
            <Th>Duration</Th>
            <Th>Started</Th>
          </TableHeader>
          {evaluations.runs.map((r, i) => (
            <TableRow
              key={r.id}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i + 3}
            >
              <Td>
                <RunName>{r.name}</RunName>
                <RunAgent>{r.agent}</RunAgent>
              </Td>
              <Td>{r.dataset}</Td>
              <Td>
                <KindPill $tone={r.tone}>{r.status}</KindPill>
              </Td>
              <Td>
                <div style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                  {r.passed} / {r.total}
                </div>
                <PassBar>
                  <PassFill $pct={r.passRate} $tone={r.tone} />
                </PassBar>
                <div style={{ fontSize: 11, color: 'rgba(229, 231, 235, 0.55)', marginTop: 2 }}>
                  {r.passRate}%
                </div>
              </Td>
              <Td>{r.p95Latency}ms</Td>
              <Td>{r.duration}</Td>
              <Td>{r.startedAt}</Td>
            </TableRow>
          ))}
        </RunTable>
      </motion.div>

      <TwoCol>
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={12}>
          <SectionTitle>
            <Database size={14} strokeWidth={1.7} />
            Datasets
          </SectionTitle>
          <DatasetGrid>
            {evaluations.datasets.map((d, i) => (
              <DatasetCard
                key={d.id}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 13}
              >
                <DatasetTop>
                  <DatasetLeft>
                    <DatasetName>{d.name}</DatasetName>
                    <DatasetMeta>{d.agent}</DatasetMeta>
                  </DatasetLeft>
                  <KindPill $tone={d.tone}>{d.kind}</KindPill>
                </DatasetTop>
                <DatasetBottom>
                  <DatasetExamples>{d.examples.toLocaleString()} examples</DatasetExamples>
                  <DatasetExamples>updated {d.updatedAt}</DatasetExamples>
                </DatasetBottom>
              </DatasetCard>
            ))}
          </DatasetGrid>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={14}>
          <SectionTitle>
            <CheckCircle2 size={14} strokeWidth={1.7} />
            Scorers
          </SectionTitle>
          <Card>
            {evaluations.scorers.map((s) => (
              <ScorerRow key={s.id}>
                <ScorerLeft>
                  <ScorerName>{s.name}</ScorerName>
                  <ScorerMeta>{s.type}</ScorerMeta>
                </ScorerLeft>
                <ScorerRuns>{s.runs.toLocaleString()}</ScorerRuns>
              </ScorerRow>
            ))}
          </Card>
        </motion.div>
      </TwoCol>
    </PageRoot>
  );
}
