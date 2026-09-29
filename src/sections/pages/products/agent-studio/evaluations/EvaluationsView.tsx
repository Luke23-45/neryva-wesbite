import { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Plus, FlaskConical } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { Drawer } from '@components/common/ui/Drawer';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import {
  useEvalDatasets,
  useEvalRuns,
  useStartEvalRun,
  useDatasetRecall,
  useDeleteEvalDataset,
  type EvalRun,
} from '@hooks/studio/useSetupEval';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { describeDatasetOrigin } from '../builder/lib/eval-model';
import { EvalResults } from '../builder/inspector/EvalResults';
import { useOrg } from '@/Context/OrgContext';

/**
 * Evaluations center (team_setup_ledger.md F-E2, org scope) — datasets,
 * cases, runs with decisions + provenance, and retrieval recall@k over a
 * dataset. Version-scoped evaluate lives in the agent detail; this view is
 * the cross-agent runs ledger.
 *
 * Honest gaps: case executions have no read path, and the results write-back
 * has no console surface — the engine eval-scoring worker completes runs
 * there; candidate promote/reject need case ids from those
 * paths, so they surface where cases appear (run provenance), not here.
 * Cases themselves are fully manageable: list, edit, delete, import/export
 * (A4-41..A4-44).
 */

const decisionTone: Record<string, StatusTone> = {
  PASS: 'success',
  WARN: 'warning',
  BLOCK: 'error',
  FAIL: 'error',
};

const stateTone: Record<string, StatusTone> = {
  pending: 'info',
  running: 'info',
  completed: 'success',
  failed: 'error',
};

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.6;
`;

const SectionGap = styled.div`
  margin-top: 18px;
`;

export function EvaluationsView() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canWrite = canSetup(role, 'setup:author');
  const writeDenied = setupDeniedCopy(role, 'setup:author');
  const datasets = useEvalDatasets();
  const runs = useEvalRuns();
  const startRun = useStartEvalRun();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [recallDatasetId, setRecallDatasetId] = useState('');
  const [recallK, setRecallK] = useState('5');
  const [resultsRunId, setResultsRunId] = useState<string | null>(null);
  const [decisionFilter, setDecisionFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  const datasetById = new Map((datasets.data ?? []).map((d) => [d.id, d]));
  // Client-side over the server's newest 100 — labeled as such below.
  const visibleRuns = (runs.data ?? []).filter(
    (run) =>
      (decisionFilter === '' || run.decision === decisionFilter) &&
      (stateFilter === '' || run.state === stateFilter),
  );
  const resultsRun = resultsRunId ? ((runs.data ?? []).find((r) => r.id === resultsRunId) ?? null) : null;

  const reRun = (run: EvalRun) => {
    if (!run.datasetId || !run.assistantVersionId) {
      return;
    }
    startRun.mutate({
      datasetId: run.datasetId,
      assistantVersionId: run.assistantVersionId,
      ...(run.attemptsPerCase !== null ? { attemptsPerCase: run.attemptsPerCase } : {}),
    });
  };

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Evaluations</ViewTitle>
          <ViewSubtitle>
            Datasets, cases, and runs with decisions + provenance — the evidence behind every publish gate.
          </ViewSubtitle>
        </ViewHeader>
        <div style={{ display: 'flex', gap: 8 }}>
          <ActionButton variant="secondary" size="sm" disabled={!canWrite} title={canWrite ? 'Start an eval run' : writeDenied} onClick={() => navigate({ to: '/agent-studio/evaluations/runs/new', search: { returnTo: undefined } })}>
            <FlaskConical size={13} strokeWidth={1.8} />
            Start run
          </ActionButton>
          <ActionButton size="sm" disabled={!canWrite} title={canWrite ? 'Create a dataset' : writeDenied} onClick={() => navigate({ to: '/agent-studio/evaluations/datasets/new', search: { returnTo: undefined } })}>
            <Plus size={14} strokeWidth={2} />
            New dataset
          </ActionButton>
        </div>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Datasets" subtitle="Template installs seed datasets automatically. Open a dataset's cases to list, edit, delete, import, or export them.">
          <QueryView
            query={datasets}
            isEmpty={(d) => d.length === 0}
            empty={{ title: 'No datasets yet', description: 'Create one, or install a template — provisioning seeds its eval dataset.' }}
          >
            {(rows) => (
              <DataTable>
                <DataHead>
                  <DataCell $w="28%">Name</DataCell>
                  <DataCell $w="18%">Origin</DataCell>
                  <DataCell $w="26%">Description</DataCell>
                  <DataCell $w="12%">Created</DataCell>
                  <DataCell $w="16%" $align="right">Actions</DataCell>
                </DataHead>
                {rows.map((dataset, i) => (
                  <DataRow key={dataset.id} as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={i + 2} $interactive={false}>
                    <DataCell $w="28%">
                      <Mono>{dataset.name}</Mono>
                    </DataCell>
                    <DataCell $w="18%">{describeDatasetOrigin(dataset.name)}</DataCell>
                    <DataCell $w="26%">{dataset.description ?? <Muted>—</Muted>}</DataCell>
                    <DataCell $w="12%">{dataset.createdAt ? dataset.createdAt.slice(0, 10) : <Muted>—</Muted>}</DataCell>
                    <DataCell $w="16%" $align="right">
                      <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          title="List, edit, delete, import, export cases"
                          onClick={() =>
                            navigate({
                              to: '/agent-studio/evaluations/datasets/$datasetId/cases',
                              params: { datasetId: dataset.id },
                              search: { returnTo: undefined },
                            })
                          }
                        >
                          Cases
                        </ActionButton>
                        <ActionButton
                          variant="ghost"
                          size="sm"
                          disabled={!canWrite}
                          title={canWrite ? 'Append cases (non-empty array)' : writeDenied}
                          onClick={() =>
                            navigate({
                              to: '/agent-studio/evaluations/datasets/$datasetId/cases/new',
                              params: { datasetId: dataset.id },
                              // E-2 entry: the originating context is this datasets panel —
                              // there is no per-dataset detail route, so returnTo is the
                              // evaluations list (guarded to /agent-studio/* in the section).
                              search: { returnTo: '/agent-studio/evaluations' },
                            })
                          }
                        >
                          Add cases
                        </ActionButton>
                        <ActionButton variant="ghost" size="sm" disabled={!canWrite} title={canWrite ? 'Delete dataset and its cases' : writeDenied} onClick={() => setDeleteTarget({ id: dataset.id, name: dataset.name })}>
                          Delete
                        </ActionButton>
                      </span>
                    </DataCell>
                  </DataRow>
                ))}
              </DataTable>
            )}
          </QueryView>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <SectionGap>
          <Panel title="Runs" subtitle="Newest first (cap 100, filtered locally). Latest completed decision per content hash is what every gate reads. Engine-side scoring covers lexical (contains/not_contains), state assertions (tool.<name>=called|not_called against the run's tool-call log), and rubrics (judged by the configured LLM-judge endpoint; rubric cases fail closed without one).">
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <label style={{ fontSize: 12 }}>
                Decision
                <select value={decisionFilter} onChange={(e) => setDecisionFilter(e.target.value)} style={{ display: 'block', marginTop: 4 }}>
                  <option value="">All decisions</option>
                  <option value="PASS">PASS</option>
                  <option value="WARN">WARN</option>
                  <option value="BLOCK">BLOCK</option>
                  <option value="FAIL">FAIL</option>
                </select>
              </label>
              <label style={{ fontSize: 12 }}>
                State
                <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} style={{ display: 'block', marginTop: 4 }}>
                  <option value="">All states</option>
                  <option value="pending">pending</option>
                  <option value="running">running</option>
                  <option value="completed">completed</option>
                  <option value="failed">failed</option>
                </select>
              </label>
            </div>
            <QueryView
              query={runs}
              isEmpty={(d) => d.length === 0}
              empty={{ title: 'No eval runs yet', description: 'Evaluate a version from its agent page, or start a run above.' }}
            >
              {() =>
                visibleRuns.length === 0 ? (
                  <EmptyState icon={<FlaskConical size={18} opacity={0.5} />} title="No runs match" description="Loosen the filters — the server returns the newest 100." />
                ) : (
                <DataTable>
                  <DataHead>
                    <DataCell $w="12%">State</DataCell>
                    <DataCell $w="12%">Decision</DataCell>
                    <DataCell $w="10%">Score</DataCell>
                    <DataCell $w="22%">Version</DataCell>
                    <DataCell $w="14%">Finished</DataCell>
                    <DataCell $w="30%" $align="right">Detail</DataCell>
                  </DataHead>
                  {visibleRuns.map((run) => {
                    const busy = run.state === 'pending' || run.state === 'running';
                    return (
                    <DataRow key={run.id} $interactive={false}>
                      <DataCell $w="12%">
                        <StatusPill tone={stateTone[run.state] ?? 'neutral'} dot={false}>{run.state}</StatusPill>
                      </DataCell>
                      <DataCell $w="12%">
                        {run.decision ? (
                          <StatusPill tone={decisionTone[run.decision] ?? 'neutral'} dot={false}>{run.decision}</StatusPill>
                        ) : (
                          <Muted>undecided</Muted>
                        )}
                        {run.isShadow && (
                          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>shadow — never gates</div>
                        )}
                      </DataCell>
                      <DataCell $w="10%">{run.score !== null ? <Mono>{run.score}</Mono> : <Muted>—</Muted>}</DataCell>
                      <DataCell $w="22%">
                        {run.assistantVersionId ? <Mono>{run.assistantVersionId.slice(0, 8)}</Mono> : <Muted>—</Muted>}
                      </DataCell>
                      <DataCell $w="14%">{run.finishedAt ? run.finishedAt.slice(0, 16).replace('T', ' ') : <Muted>—</Muted>}</DataCell>
                      <DataCell $w="30%" $align="right">
                        <span style={{ display: 'inline-flex', gap: 4 }}>
                          <ActionButton variant="ghost" size="sm" onClick={() => setResultsRunId(run.id)}>
                            Results
                          </ActionButton>
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            disabled={!canWrite || busy || !run.datasetId || !run.assistantVersionId || startRun.isPending}
                            title={canWrite ? 'Re-run — same dataset, same attempts' : writeDenied}
                            onClick={() => reRun(run)}
                          >
                            Re-run
                          </ActionButton>
                        </span>
                      </DataCell>
                    </DataRow>
                    );
                  })}
                </DataTable>
                )
              }
            </QueryView>
          </Panel>
        </SectionGap>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
        <SectionGap>
          <Panel title="Retrieval recall@k" subtitle="Live hybrid retrieval measured against a dataset (FL-3.8).">
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
              <label style={{ fontSize: 13, minWidth: 260 }}>
                Dataset
                <select value={recallDatasetId} onChange={(e) => setRecallDatasetId(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4 }}>
                  <option value="">Pick a dataset…</option>
                  {(datasets.data ?? []).map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
                  ))}
                </select>
              </label>
              <label style={{ fontSize: 13 }}>
                k
                <input type="number" min={1} max={20} value={recallK} onChange={(e) => setRecallK(e.target.value)} style={{ display: 'block', width: 90, marginTop: 4 }} />
              </label>
            </div>
            {recallDatasetId ? (
              <RecallView datasetId={recallDatasetId} k={Math.min(Math.max(1, Math.round(Number(recallK) || 5)), 20)} />
            ) : (
              <EmptyState icon={<FlaskConical size={18} opacity={0.5} />} title="Pick a dataset" description="Recall measures live retrieval against the dataset's cases." />
            )}
          </Panel>
        </SectionGap>
      </motion.div>

      {deleteTarget && (
        <DeleteDatasetModal
          datasetId={deleteTarget.id}
          name={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      <Drawer
        open={resultsRun !== null}
        onClose={() => setResultsRunId(null)}
        title="Results"
        subtitle={resultsRun ? `Run ${resultsRun.id.slice(0, 8)} · required checks resolve on the version surface` : undefined}
      >
        {resultsRun && (
          <EvalResults
            run={resultsRun}
            versionStatus={null}
            versionUpdatedAt={null}
            versionHash={null}
            datasetName={resultsRun.datasetId ? (datasetById.get(resultsRun.datasetId)?.name ?? null) : null}
            required={null}
            onReRun={
              canWrite && resultsRun.datasetId && resultsRun.assistantVersionId && resultsRun.state !== 'pending' && resultsRun.state !== 'running'
                ? () => reRun(resultsRun)
                : null
            }
            onAddCases={
              canWrite && resultsRun.datasetId
                ? () => {
                    const dataset = resultsRun.datasetId ? datasetById.get(resultsRun.datasetId) : undefined;
                    if (dataset) {
                      setResultsRunId(null);
                      // E-2 entry from the results drawer: the originating context is
                      // the results view over the runs table (the drawer is not
                      // URL-addressable) — returnTo is the evaluations list.
                      navigate({
                        to: '/agent-studio/evaluations/datasets/$datasetId/cases/new',
                        params: { datasetId: dataset.id },
                        search: { returnTo: '/agent-studio/evaluations' },
                      });
                    }
                  }
                : null
            }
          />
        )}
      </Drawer>
    </ViewShell>
  );
}

function RecallView({ datasetId, k }: { datasetId: string; k: number }) {
  const recall = useDatasetRecall(datasetId, k);
  return (
    <QueryView
      query={recall}
      isEmpty={() => false}
      empty={{ title: '', description: '' }}
    >
      {(result) => (
        <div style={{ fontSize: 13 }}>
          <p>
            recall@{result.k}: <Mono>{result.meanRecall !== null ? `${(result.meanRecall * 100).toFixed(1)}%` : 'insufficient data'}</Mono>
            {result.scoredCases !== null && <> over <Mono>{result.scoredCases}</Mono> scored cases</>}
          </p>
          {result.cases.map((c) => (
            <p key={c.caseId}>
              <Mono>{c.caseId.slice(0, 8)}</Mono>: {c.recall !== null ? `${(c.recall * 100).toFixed(1)}%` : 'no expected documents declared'}
              {c.retrievedDocumentIds.length > 0 && <> — retrieved <Mono>{c.retrievedDocumentIds.map((id) => id.slice(0, 8)).join(', ')}</Mono></>}
            </p>
          ))}
        </div>
      )}
    </QueryView>
  );
}

/** A4-42 — delete a dataset with an honest warning; the engine 409s while runs reference it. */
function DeleteDatasetModal({
  datasetId,
  name,
  onClose,
}: {
  datasetId: string;
  name: string;
  onClose: () => void;
}) {
  const del = useDeleteEvalDataset();
  return (
    <Modal
      open
      onClose={onClose}
      title={`Delete dataset — ${name}`}
      width={480}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            disabled={del.isPending}
            onClick={() => del.mutate({ datasetId }, { onSuccess: () => onClose() })}
          >
            Delete dataset
          </ActionButton>
        </>
      }
    >
      <p style={{ fontSize: 13 }}>
        This permanently deletes the dataset and all of its cases. Datasets with eval runs cannot be
        deleted — runs are append-only publish evidence, and the engine will refuse with the run count.
      </p>
    </Modal>
  );
}
