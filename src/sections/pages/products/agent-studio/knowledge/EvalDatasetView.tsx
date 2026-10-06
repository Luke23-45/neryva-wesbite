import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Play, Plus } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { TextInput } from '@components/common/ui/TextInput';
import { QueryView } from '@components/common/ui/AsyncStates';
import { MetricCard } from '@components/common/ui/MetricCard';
import { StudioAreaChart } from '@components/common/ui/StudioAreaChart/StudioAreaChart';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { DataTable, DataHead, DataRow, DataCell } from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { SectionBackRow } from '@/sections/pages/products/agent-studio/knowledge/SectionBackRow';
import {
  useAddEvalCase,
  useEvalRun,
  useEvalTrends,
  useRunEval,
} from '@hooks/studio/useKnowledgeLibrary';

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 24px 0 12px;
`;

const FormCard = styled(Panel)`
  padding: 16px;
  margin-bottom: 16px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
`;

const FormField = styled.div`
  flex: 1;
  min-width: 200px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin: 16px 0;
`;

const ScoreBar = styled.div<{ $value: number }>`
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.app.surface.subtle};
  overflow: hidden;
  margin-top: 4px;
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $value }) => Math.max(0, Math.min(100, $value * 100))}%;
    background: ${({ theme, $value }) =>
      $value >= 0.8
        ? theme.app.status.success.fg
        : $value >= 0.5
          ? theme.app.status.warning.fg
          : theme.app.status.error.fg};
    border-radius: 3px;
  }
`;

function formatScore(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return value.toFixed(3);
}

export function EvalDatasetView() {
  const { datasetId } = useParams({ from: '/agent-studio/knowledge/eval/$datasetId' });
  const [runId, setRunId] = useState<string | null>(null);
  const [showAddCase, setShowAddCase] = useState(false);
  const [query, setQuery] = useState('');
  const [expectedIds, setExpectedIds] = useState('');
  const [k, setK] = useState('10');

  const runEval = useRunEval();
  const addCase = useAddEvalCase();
  const { data: run, isLoading: runLoading } = useEvalRun(runId);
  const { data: trends } = useEvalTrends(datasetId, 20);

  const handleRun = async () => {
    const kNum = parseInt(k, 10);
    if (isNaN(kNum) || kNum < 1 || kNum > 50) return;
    try {
      const result = await runEval.mutateAsync({ datasetId, k: kNum });
      setRunId(result.runId);
    } catch {
      // toast handled in hook.
    }
  };

  const handleAddCase = async () => {
    const ids = expectedIds
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (query.trim().length === 0 || ids.length === 0) return;
    try {
      await addCase.mutateAsync({ datasetId, query: query.trim(), expectedDocumentIds: ids });
      setQuery('');
      setExpectedIds('');
      setShowAddCase(false);
    } catch {
      // toast handled in hook.
    }
  };

  const trendData =
    trends?.runs
      .slice()
      .reverse()
      .map((r) => ({
        date: r.startedAt ? new Date(r.startedAt).toLocaleDateString() : '—',
        recall: r.avgRecall ?? 0,
        precision: r.avgPrecision ?? 0,
        ndcg: r.avgNdcg ?? 0,
        mrr: r.avgMrr ?? 0,
      })) ?? [];

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/knowledge/eval" label="Eval datasets" />
      <ViewHeader>
        <div>
          <ViewTitle>Eval dataset</ViewTitle>
          <ViewSubtitle>Golden queries, run results, and quality trends.</ViewSubtitle>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <TextInput
            label="k"
            value={k}
            onChange={(e) => setK(e.target.value)}
            type="number"
            min={1}
            max={50}
            style={{ width: 80 }}
          />
          <ActionButton
            onClick={handleRun}
            disabled={runEval.isPending}
            variant="primary"
          >
            <Play size={16} style={{ marginRight: 6 }} />
            {runEval.isPending ? 'Running…' : 'Run eval'}
          </ActionButton>
          <ActionButton onClick={() => setShowAddCase((v) => !v)}>
            <Plus size={16} style={{ marginRight: 6 }} />
            Add case
          </ActionButton>
        </div>
      </ViewHeader>

      {showAddCase && (
        <motion.div {...pageItem}>
          <FormCard>
            <FormRow>
              <FormField>
                <TextInput
                  label="Query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. How do I request a refund?"
                />
              </FormField>
              <FormField>
                <TextInput
                  label="Expected document IDs (comma-separated)"
                  value={expectedIds}
                  onChange={(e) => setExpectedIds(e.target.value)}
                  placeholder="uuid1, uuid2"
                />
              </FormField>
              <ActionButton onClick={handleAddCase} disabled={addCase.isPending} variant="primary">
                {addCase.isPending ? 'Adding…' : 'Add case'}
              </ActionButton>
            </FormRow>
          </FormCard>
        </motion.div>
      )}

      {run && (
        <motion.div {...pageItem}>
          <SectionTitle>Latest run results</SectionTitle>
          <MetricsGrid>
            <MetricCard label="Avg recall" value={formatScore(run.avgRecall)} />
            <MetricCard label="Avg precision" value={formatScore(run.avgPrecision)} />
            <MetricCard label="Avg nDCG" value={formatScore(run.avgNdcg)} />
            <MetricCard label="Avg MRR" value={formatScore(run.avgMrr)} />
          </MetricsGrid>
          <DataTable>
            <DataHead>
              <tr>
                <th>Case</th>
                <th>Recall</th>
                <th>Precision</th>
                <th>nDCG</th>
                <th>MRR</th>
              </tr>
            </DataHead>
            <tbody>
              {run.results.map((r) => (
                <DataRow key={r.caseId}>
                  <DataCell>
                    <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{r.caseId.slice(0, 8)}…</span>
                  </DataCell>
                  <DataCell>
                    {formatScore(r.recallAtK)}
                    <ScoreBar $value={r.recallAtK} />
                  </DataCell>
                  <DataCell>
                    {formatScore(r.precisionAtK)}
                    <ScoreBar $value={r.precisionAtK} />
                  </DataCell>
                  <DataCell>
                    {formatScore(r.ndcg)}
                    <ScoreBar $value={r.ndcg} />
                  </DataCell>
                  <DataCell>
                    {formatScore(r.mrr)}
                    <ScoreBar $value={r.mrr} />
                  </DataCell>
                </DataRow>
              ))}
            </tbody>
          </DataTable>
        </motion.div>
      )}

      {trendData.length > 1 && (
        <motion.div {...pageItem}>
          <SectionTitle>Trends (last {trendData.length} runs)</SectionTitle>
          <Panel style={{ padding: 16 }}>
            <StudioAreaChart
              data={trendData}
              xKey="date"
              series={[
                { dataKey: 'recall', name: 'Recall', color: '#3b82f6' },
                { dataKey: 'precision', name: 'Precision', color: '#10b981' },
                { dataKey: 'ndcg', name: 'nDCG', color: '#f59e0b' },
                { dataKey: 'mrr', name: 'MRR', color: '#8b5cf6' },
              ]}
              yFormatter={(v) => v.toFixed(2)}
            />
          </Panel>
        </motion.div>
      )}

      {runLoading && <QueryView isLoading={true} isError={false} onRetry={() => {}} />}
    </ViewShell>
  );
}
