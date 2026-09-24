import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Plus, FlaskConical } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { Drawer } from '@components/common/ui/Drawer';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
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
  useCreateEvalDataset,
  useAddEvalCases,
  useEvalRuns,
  useStartEvalRun,
  useDatasetRecall,
  useEvalCases,
  useUpdateEvalCase,
  useDeleteEvalCase,
  useDeleteEvalDataset,
  useExportEvalDataset,
  useImportEvalCases,
  downloadExportedFile,
  type EvalRun,
  type EvalCase,
} from '@hooks/studio/useSetupEval';
import { useAssistants } from '@hooks/studio/useAssistants';
import { useAssistantVersions } from '@hooks/studio/useAgentAuthoring';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { buildCase, draftFromCase, EMPTY_CASE, type CaseDraft } from '@lib/engine/eval-cases';
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
 * is eval-worker-only — candidate promote/reject need case ids from those
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
  const canWrite = canSetup(role, 'setup:author');
  const writeDenied = setupDeniedCopy(role, 'setup:author');
  const datasets = useEvalDatasets();
  const runs = useEvalRuns();
  const startRun = useStartEvalRun();
  const [datasetOpen, setDatasetOpen] = useState(false);
  const [casesTarget, setCasesTarget] = useState<{ id: string; name: string } | null>(null);
  const [manageTarget, setManageTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [runOpen, setRunOpen] = useState(false);
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
          <ActionButton variant="secondary" size="sm" disabled={!canWrite} title={canWrite ? 'Start an eval run' : writeDenied} onClick={() => setRunOpen(true)}>
            <FlaskConical size={13} strokeWidth={1.8} />
            Start run
          </ActionButton>
          <ActionButton size="sm" disabled={!canWrite} title={canWrite ? 'Create a dataset' : writeDenied} onClick={() => setDatasetOpen(true)}>
            <Plus size={14} strokeWidth={2} />
            New dataset
          </ActionButton>
        </div>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Datasets" subtitle="Template installs seed template:<slug>@<version> datasets automatically. Open a dataset's cases to list, edit, delete, import, or export them.">
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
                        <ActionButton variant="ghost" size="sm" title="List, edit, delete, import, export cases" onClick={() => setManageTarget({ id: dataset.id, name: dataset.name })}>
                          Cases
                        </ActionButton>
                        <ActionButton variant="ghost" size="sm" disabled={!canWrite} title={canWrite ? 'Append cases (non-empty array)' : writeDenied} onClick={() => setCasesTarget({ id: dataset.id, name: dataset.name })}>
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
          <Panel title="Runs" subtitle="Newest first (cap 100, filtered locally). Latest completed decision per content hash is what every gate reads. Engine-side scoring is lexical (contains/not_contains); judge rubrics execute in the Studio eval-worker.">
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

      <DatasetModal open={datasetOpen} onClose={() => setDatasetOpen(false)} />
      {casesTarget && <CasesModal datasetId={casesTarget.id} name={casesTarget.name} onClose={() => setCasesTarget(null)} />}
      {manageTarget && (
        <CasesManagerModal
          datasetId={manageTarget.id}
          name={manageTarget.name}
          canWrite={canWrite}
          writeDenied={writeDenied}
          onClose={() => setManageTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteDatasetModal
          datasetId={deleteTarget.id}
          name={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      <StartRunModal open={runOpen} onClose={() => setRunOpen(false)} />
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
                      setCasesTarget({ id: dataset.id, name: dataset.name });
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

/**
 * A4-41/A4-43/A4-44 — full case management for one dataset: list (with
 * exact total), per-case edit + delete, JSON/CSV export, JSON/CSV import.
 */
function CasesManagerModal({
  datasetId,
  name,
  canWrite,
  writeDenied,
  onClose,
}: {
  datasetId: string;
  name: string;
  canWrite: boolean;
  writeDenied: string;
  onClose: () => void;
}) {
  const cases = useEvalCases(datasetId, { limit: 100 });
  const updateCase = useUpdateEvalCase();
  const deleteCase = useDeleteEvalCase();
  const exportDataset = useExportEvalDataset();
  const importCases = useImportEvalCases();
  const [editing, setEditing] = useState<EvalCase | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const doExport = (format: 'json' | 'csv') => {
    exportDataset.mutate(
      { datasetId, format },
      { onSuccess: (exp) => downloadExportedFile(exp) },
    );
  };

  const onImportFile = (file: File | undefined) => {
    if (!file) return;
    const format = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'json';
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      if (format === 'json') {
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          // A4-44 — a file that is not JSON must fail visibly; silently
          // doing nothing reads as a broken Import button.
          toast.error('Could not import: the file is not valid JSON.');
          return;
        }
        importCases.mutate({ datasetId, format: 'json', payload: parsed });
      } else {
        importCases.mutate({ datasetId, format: 'csv', payload: text });
      }
    };
    reader.readAsText(file);
  };

  const total = cases.data?.total ?? 0;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Modal
      open
      onClose={onClose}
      title={`Cases — ${name}`}
      width={760}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Close
          </ActionButton>
          <ActionButton variant="ghost" size="sm" disabled={exportDataset.isPending} onClick={() => doExport('json')}>
            Export JSON
          </ActionButton>
          <ActionButton variant="ghost" size="sm" disabled={exportDataset.isPending} onClick={() => doExport('csv')}>
            Export CSV
          </ActionButton>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              style={{ display: 'none' }}
              disabled={!canWrite || importCases.isPending}
              onChange={(e) => {
                onImportFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <ActionButton
              variant="ghost"
              size="sm"
              disabled={!canWrite || importCases.isPending}
              title={canWrite ? 'Import cases from JSON (export shape) or CSV' : writeDenied}
              onClick={() => fileInputRef.current?.click()}
            >
              Import…
            </ActionButton>
          </span>
        </>
      }
    >
      {editing ? (
        <CaseEditForm
          caseRow={editing}
          saving={updateCase.isPending}
          onCancel={() => setEditing(null)}
          onSave={(body) =>
            updateCase.mutate(
              { datasetId, caseId: editing.id, body },
              { onSuccess: () => setEditing(null) },
            )
          }
        />
      ) : (
        <QueryView
          query={cases}
          isEmpty={(d) => d.total === 0}
          empty={{ title: 'No cases yet', description: 'Add cases from the datasets table, or import a JSON/CSV file below.' }}
        >
          {(list) => (
            <>
              <p style={{ fontSize: 12, opacity: 0.7 }}>
                {total} case{total === 1 ? '' : 's'} total
                {total > list.cases.length ? ` — showing first ${list.cases.length}` : ''}.
              </p>
              <DataTable>
                <DataHead>
                  <DataCell $w="8%">#</DataCell>
                  <DataCell $w="52%">Input</DataCell>
                  <DataCell $w="40%" $align="right">Actions</DataCell>
                </DataHead>
                {list.cases.map((c) => (
                  <DataRow key={c.id} $interactive={false}>
                    <DataCell $w="8%">
                      <Mono>{c.sequence}</Mono>
                    </DataCell>
                    <DataCell $w="52%">
                      <span style={{ fontSize: 13 }}>
                        {typeof c.input.text === 'string' && c.input.text.length > 120
                          ? `${c.input.text.slice(0, 120)}…`
                          : String(c.input.text ?? '—')}
                      </span>
                    </DataCell>
                    <DataCell $w="40%" $align="right">
                      {confirmDeleteId === c.id ? (
                        <span style={{ display: 'inline-flex', gap: 4 }}>
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            disabled={deleteCase.isPending}
                            onClick={() =>
                              deleteCase.mutate(
                                { datasetId, caseId: c.id },
                                { onSuccess: () => setConfirmDeleteId(null) },
                              )
                            }
                          >
                            Confirm delete
                          </ActionButton>
                          <ActionButton variant="secondary" size="sm" onClick={() => setConfirmDeleteId(null)}>
                            Cancel
                          </ActionButton>
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', gap: 4 }}>
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            disabled={!canWrite}
                            title={canWrite ? 'Edit this case' : writeDenied}
                            onClick={() => setEditing(c)}
                          >
                            Edit
                          </ActionButton>
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            disabled={!canWrite}
                            title={canWrite ? 'Delete this case' : writeDenied}
                            onClick={() => setConfirmDeleteId(c.id)}
                          >
                            Delete
                          </ActionButton>
                        </span>
                      )}
                    </DataCell>
                  </DataRow>
                ))}
              </DataTable>
            </>
          )}
        </QueryView>
      )}
    </Modal>
  );
}

/** A4-41 — edit one case through the same strict case vocabulary as add. */
function CaseEditForm({
  caseRow,
  saving,
  onCancel,
  onSave,
}: {
  caseRow: EvalCase;
  saving: boolean;
  onCancel: () => void;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [draft, setDraft] = useState<CaseDraft>(() => draftFromCase(caseRow));
  const built = buildCase(draft);
  const set = (patch: Partial<CaseDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.7 }}>
        Editing case <Mono>#{caseRow.sequence}</Mono> — the full body is re-validated; identity and sequence are preserved.
      </p>
      <TextArea label="Input text (required)" value={draft.text} onChange={(e) => set({ text: e.target.value })} rows={2} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
        <TextArea label="Must contain (one per line)" value={draft.contains} onChange={(e) => set({ contains: e.target.value })} rows={2} />
        <TextArea label="Must not contain (one per line)" value={draft.notContains} onChange={(e) => set({ notContains: e.target.value })} rows={2} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
        <TextInput label="State assertions (one per line, optional)" value={draft.stateAssertions} onChange={(e) => set({ stateAssertions: e.target.value })} />
        <TextInput label="Expected document ids, uuid (one per line, drives recall)" value={draft.documentIds} onChange={(e) => set({ documentIds: e.target.value })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginTop: 8 }}>
        <TextInput label="Rubric instructions (optional)" value={draft.rubricInstructions} onChange={(e) => set({ rubricInstructions: e.target.value })} />
        <TextInput label="Min score" value={draft.minScore} onChange={(e) => set({ minScore: e.target.value })} />
      </div>
      {built.problem && <p style={{ fontSize: 12, color: '#f87171' }}>{built.problem}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <ActionButton variant="secondary" size="sm" onClick={onCancel}>
          Back to list
        </ActionButton>
        <ActionButton
          size="sm"
          disabled={!built.body || saving}
          title={built.problem ?? 'Save the corrected case'}
          onClick={() => built.body && onSave(built.body)}
        >
          Save changes
        </ActionButton>
      </div>
    </div>
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

function DatasetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateEvalDataset();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New dataset"
      width={520}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            disabled={!name.trim() || create.isPending}
            onClick={() => create.mutate({ name: name.trim(), ...(description.trim() ? { description: description.trim() } : {}) }, { onSuccess: () => { setName(''); setDescription(''); onClose(); } })}
          >
            Create
          </ActionButton>
        </>
      }
    >
      <TextInput label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. refund-regressions" autoFocus />
      <div style={{ marginTop: 12 }}>
        <TextInput label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this suite guards" />
      </div>
    </Modal>
  );
}

function CasesModal({ datasetId, name, onClose }: { datasetId: string; name: string; onClose: () => void }) {
  const addCases = useAddEvalCases();
  // Form-first builder over the HTTP case vocabulary (evalCaseSchema —
  // strict). The richer template vocabulary (expected_behavior/must_not/
  // tools_expected) is translated at seed time by provisioning — it does
  // NOT post here. Listing/editing/deleting cases lives in the cases
  // manager (A4-41/A4-43); this modal is append-only by design.
  const [drafts, setDrafts] = useState<CaseDraft[]>([{ ...EMPTY_CASE }]);
  const [showJson, setShowJson] = useState(false);

  const built = drafts.map(buildCase);
  const firstProblem = built.find((b) => b.problem)?.problem ?? null;
  const bodies = built.map((b) => b.body).filter((b): b is Record<string, unknown> => b !== undefined);

  const set = (index: number, patch: Partial<CaseDraft>) => {
    setDrafts((prev) => prev.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)));
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Add cases — ${name}`}
      width={680}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton variant="ghost" size="sm" onClick={() => setShowJson((v) => !v)}>
            {showJson ? 'Hide JSON' : 'Preview JSON'}
          </ActionButton>
          <ActionButton
            disabled={bodies.length !== drafts.length || addCases.isPending}
            title={firstProblem ?? `Append ${drafts.length} case${drafts.length === 1 ? '' : 's'}`}
            onClick={() => addCases.mutate({ datasetId, cases: bodies }, { onSuccess: () => onClose() })}
          >
            Add {drafts.length} case{drafts.length === 1 ? '' : 's'}
          </ActionButton>
        </>
      }
    >
      <p style={{ fontSize: 13, opacity: 0.75 }}>
        Scored lexically by the interim engine harness (<Mono>contains</Mono>/<Mono>not_contains</Mono> hit fractions; empty
        assertions pass vacuously and say so). LLM-judge rubrics run via the Studio eval-worker. Unknown keys refuse — violations
        return per-index 422s, never silent drops.
      </p>
      {drafts.map((draft, index) => (
        <div key={index} style={{ borderTop: index === 0 ? 0 : '1px solid var(--neryva-border, #222)', paddingTop: index === 0 ? 0 : 12, marginTop: index === 0 ? 0 : 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <strong style={{ fontSize: 13 }}>Case {index + 1}</strong>
            {drafts.length > 1 && (
              <ActionButton variant="ghost" size="sm" onClick={() => setDrafts((prev) => prev.filter((_, i) => i !== index))}>
                Remove
              </ActionButton>
            )}
          </div>
          <TextArea label="Input text (required)" value={draft.text} onChange={(e) => set(index, { text: e.target.value })} rows={2} placeholder="What the user asks…" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <TextArea label="Must contain (one per line)" value={draft.contains} onChange={(e) => set(index, { contains: e.target.value })} rows={2} placeholder="30 days" />
            <TextArea label="Must not contain (one per line)" value={draft.notContains} onChange={(e) => set(index, { notContains: e.target.value })} rows={2} placeholder="lifetime" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <TextInput label="State assertions (one per line, optional)" value={draft.stateAssertions} onChange={(e) => set(index, { stateAssertions: e.target.value })} placeholder="ticket_lookup_ran" />
            <TextInput label="Expected document ids, uuid (one per line, drives recall)" value={draft.documentIds} onChange={(e) => set(index, { documentIds: e.target.value })} placeholder="…" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginTop: 8 }}>
            <TextInput label="Rubric instructions (optional)" value={draft.rubricInstructions} onChange={(e) => set(index, { rubricInstructions: e.target.value })} placeholder="Judge tone…" />
            <TextInput label="Min score" value={draft.minScore} onChange={(e) => set(index, { minScore: e.target.value })} placeholder="0.7" />
          </div>
          {built[index]?.problem && <p style={{ fontSize: 12, color: '#f87171' }}>{built[index]?.problem}</p>}
        </div>
      ))}
      <div style={{ marginTop: 12 }}>
        <ActionButton variant="secondary" size="sm" onClick={() => setDrafts((prev) => [...prev, { ...EMPTY_CASE }])}>
          Another case
        </ActionButton>
      </div>
      {showJson && (
        <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 12 }}>
          {JSON.stringify({ cases: bodies }, null, 2)}
        </pre>
      )}
    </Modal>
  );
}

function StartRunModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const start = useStartEvalRun();
  const datasets = useEvalDatasets();
  const assistants = useAssistants();
  const [datasetId, setDatasetId] = useState('');
  const [assistantId, setAssistantId] = useState('');
  const [versionId, setVersionId] = useState('');
  const [attempts, setAttempts] = useState('1');
  const versions = useAssistantVersions(assistantId || null);
  const publishedVersions = (versions.data ?? []).filter((v) => v.status === 'PUBLISHED');

  // Published versions only for ad-hoc runs from here (drafts evaluate from
  // their agent page, where the snapshot synthesis context lives).
  const valid = datasetId !== '' && versionId !== '';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Start eval run"
      width={560}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            disabled={!valid || start.isPending}
            onClick={() =>
              start.mutate(
                { datasetId, assistantVersionId: versionId.trim(), attemptsPerCase: Math.min(Math.max(1, Math.round(Number(attempts) || 1)), 5) },
                { onSuccess: () => onClose() },
              )
            }
          >
            Start run
          </ActionButton>
        </>
      }
    >
      <label style={{ fontSize: 13, display: 'block' }}>
        Dataset
        <select value={datasetId} onChange={(e) => setDatasetId(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4 }}>
          <option value="">Pick a dataset…</option>
          {(datasets.data ?? []).map((dataset) => (
            <option key={dataset.id} value={dataset.id}>{dataset.name}</option>
          ))}
        </select>
      </label>
      <label style={{ fontSize: 13, display: 'block', marginTop: 12 }}>
        Assistant (to locate published versions)
        <select value={assistantId} onChange={(e) => { setAssistantId(e.target.value); setVersionId(''); }} style={{ display: 'block', width: '100%', marginTop: 4 }}>
          <option value="">Pick an assistant…</option>
          {(assistants.data ?? []).map((assistant) => (
            <option key={assistant.id} value={assistant.id}>{assistant.name}</option>
          ))}
        </select>
      </label>
      <label style={{ fontSize: 13, display: 'block', marginTop: 12 }}>
        Published version
        <select value={versionId} onChange={(e) => setVersionId(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4 }}>
          <option value="">{assistantId ? 'Pick a PUBLISHED version…' : 'Pick an assistant first…'}</option>
          {publishedVersions.map((v) => (
            <option key={v.id} value={v.id}>
              v{v.version}{v.hash ? ` · ${v.hash.slice(0, 12)}` : ''}
            </option>
          ))}
        </select>
      </label>
      <div style={{ marginTop: 12, maxWidth: 200 }}>
        <TextInput label="Attempts per case (1–5)" type="number" value={attempts} min={1} max={5} onChange={(e) => setAttempts(e.target.value)} />
      </div>
      <p style={{ fontSize: 12, opacity: 0.65 }}>
        Generic runs execute PUBLISHED versions. Draft evaluation (with snapshot synthesis) runs from the version&apos;s agent page.
      </p>
    </Modal>
  );
}
