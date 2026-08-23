import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Plus, FlaskConical, Database, CheckCircle2 } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { Segmented } from '@components/common/ui/Segmented';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle, SectionTitle, KpiGrid } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import evaluations from '@neryva_data/products/agent_studio/evaluations.json';
import {
  TwoCol,
  Card,
  KpiCard,
  KpiLabel,
  KpiValue,
  KpiMeta,
  RunName,
  RunAgent,
  PassCell,
  PassValue,
  PassBar,
  PassFill,
  PassLabel,
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
  RunForm,
  RunLabel,
} from './EvaluationsView.styles';

const toneToStatus: Record<string, StatusTone> = {
  emerald: 'emerald',
  azure: 'azure',
  lilac: 'lilac',
  amethyst: 'amethyst',
  warning: 'warning',
  error: 'error',
};

export function EvaluationsView() {
  const [runOpen, setRunOpen] = useState(false);
  const [dataset, setDataset] = useState(evaluations.datasets[0]?.name ?? '');
  const [agent, setAgent] = useState(evaluations.runs[0]?.agent ?? '');

  const datasetOptions = evaluations.datasets.map((d) => ({ value: d.name, label: d.name }));
  const agentOptions = Array.from(
    new Set(evaluations.runs.map((r) => r.agent)),
  ).map((a) => ({ value: a, label: a }));

  const startRun = () => {
    toast.success(`Eval run queued · ${dataset} × ${agent}`);
    setRunOpen(false);
  };

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Evaluations</ViewTitle>
          <ViewSubtitle>
            Regression suites, benchmarks, and safety checks for all production agents.
          </ViewSubtitle>
        </ViewHeader>
        <ActionButton size="sm" onClick={() => setRunOpen(true)}>
          <Plus size={14} strokeWidth={2} />
          New eval run
        </ActionButton>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <KpiGrid>
          <KpiCard>
            <KpiLabel>Datasets</KpiLabel>
            <KpiValue>{evaluations.summary.datasetsCount}</KpiValue>
            <KpiMeta>active suites</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Runs (30d)</KpiLabel>
            <KpiValue>{evaluations.summary.runsThisMonth}</KpiValue>
            <KpiMeta>
              {Math.round((evaluations.summary.runsThisMonth / 30) * 10) / 10}/day avg
            </KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Pass rate</KpiLabel>
            <KpiValue $tone="success">{evaluations.summary.passingRate}%</KpiValue>
            <KpiMeta>across all suites</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Avg p95 latency</KpiLabel>
            <KpiValue>{evaluations.summary.avgLatencyMs}ms</KpiValue>
            <KpiMeta>last 30 days</KpiMeta>
          </KpiCard>
        </KpiGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <SectionTitle>
          <FlaskConical size={14} strokeWidth={1.7} />
          Recent runs
        </SectionTitle>
        <Panel flush>
          <DataTable>
            <DataHead>
              <DataCell $w="22%">Run</DataCell>
              <DataCell $w="16%">Dataset</DataCell>
              <DataCell $w="12%">Status</DataCell>
              <DataCell $w="18%">Pass rate</DataCell>
              <DataCell $w="10%" $align="right">p95</DataCell>
              <DataCell $w="10%">Duration</DataCell>
              <DataCell $w="12%">Started</DataCell>
            </DataHead>
            {evaluations.runs.map((r, i) => (
              <DataRow
                key={r.id}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={pageItem}
                custom={i + 3}
                $interactive={false}
              >
                <DataCell $w="22%">
                  <RunName>{r.name}</RunName>
                  <RunAgent>{r.agent}</RunAgent>
                </DataCell>
                <DataCell $w="16%">
                  <RunAgent as="div">{r.dataset}</RunAgent>
                </DataCell>
                <DataCell $w="12%">
                  <StatusPill tone={toneToStatus[r.tone] ?? 'neutral'} dot={false}>
                    {r.status}
                  </StatusPill>
                </DataCell>
                <DataCell $w="18%">
                  <PassCell>
                    <PassValue>
                      {r.passed} / {r.total}
                    </PassValue>
                    <PassBar>
                      <PassFill $pct={r.passRate} $tone={r.tone} />
                    </PassBar>
                    <PassLabel>{r.passRate}%</PassLabel>
                  </PassCell>
                </DataCell>
                <DataCell $w="10%" $align="right">
                  <RunAgent as="div">{r.p95Latency}ms</RunAgent>
                </DataCell>
                <DataCell $w="10%">
                  <RunAgent as="div">{r.duration}</RunAgent>
                </DataCell>
                <DataCell $w="12%">
                  <RunAgent as="div">{r.startedAt}</RunAgent>
                </DataCell>
              </DataRow>
            ))}
          </DataTable>
        </Panel>
      </motion.div>

      <TwoCol>
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={12}>
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
                variants={pageItem}
                custom={i + 13}
              >
                <DatasetTop>
                  <DatasetLeft>
                    <DatasetName>{d.name}</DatasetName>
                    <DatasetMeta>{d.agent}</DatasetMeta>
                  </DatasetLeft>
                  <StatusPill tone={toneToStatus[d.tone] ?? 'neutral'} dot={false}>
                    {d.kind}
                  </StatusPill>
                </DatasetTop>
                <DatasetBottom>
                  <DatasetExamples>{d.examples.toLocaleString()} examples</DatasetExamples>
                  <DatasetExamples>updated {d.updatedAt}</DatasetExamples>
                </DatasetBottom>
              </DatasetCard>
            ))}
          </DatasetGrid>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={14}>
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

      <Modal
        open={runOpen}
        onClose={() => setRunOpen(false)}
        title="Start an eval run"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setRunOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton onClick={startRun}>Start run</ActionButton>
          </>
        }
      >
        <RunForm>
          <RunLabel>
            Dataset
            <Segmented
              options={datasetOptions}
              value={dataset}
              onChange={setDataset}
              size="md"
              ariaLabel="Eval dataset"
            />
          </RunLabel>
          <RunLabel>
            Agent
            <Segmented
              options={agentOptions}
              value={agent}
              onChange={setAgent}
              size="md"
              ariaLabel="Agent to evaluate"
            />
          </RunLabel>
        </RunForm>
      </Modal>
    </ViewShell>
  );
}
