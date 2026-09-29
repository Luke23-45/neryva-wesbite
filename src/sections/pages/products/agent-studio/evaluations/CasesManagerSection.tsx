import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { ActionButton } from '@components/common/ui/ActionButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import {
  useEvalDatasets,
  useEvalCases,
  useUpdateEvalCase,
  useDeleteEvalCase,
  useExportEvalDataset,
  useImportEvalCases,
  downloadExportedFile,
  type EvalCase,
} from '@hooks/studio/useSetupEval';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { buildCase, draftFromCase, type CaseDraft } from '@lib/engine/eval-cases';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const ToolbarRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

/**
 * Cases manager — dedicated section replacing CasesManagerModal (A4-41 /
 * A4-43 / A4-44). The management surface is byte-faithful to the modal:
 * list with exact total (limit 100), per-case edit through the same strict
 * case vocabulary, two-step delete, JSON/CSV export, JSON/CSV import with
 * the visible invalid-JSON failure (A4-44).
 *
 * Read access is open to every role (as in the modal — it opened from the
 * shared datasets table); write actions stay gated on setup:author with
 * the same denied copy. An unknown dataset id bounces to the evaluations
 * list (stale links only). The modal's Close footer becomes the ‹
 * Evaluations back row; the per-dataset "Add cases" entry threads
 * ?returnTo back to this section under the E-2 return contract.
 */
export function CasesManagerSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const params = useParams({ from: '/agent-studio/evaluations/datasets/$datasetId/cases' });
  const datasets = useEvalDatasets();

  const dataset = (datasets.data ?? []).find((d) => d.id === params.datasetId) ?? null;
  const datasetMissing = !datasets.isPending && !datasets.isError && dataset === null;

  // Unknown-dataset bounce before render (never denial panels). The server
  // gates writes too; an unknown id can only arrive from a stale link.
  useEffect(() => {
    if (datasetMissing) {
      navigate({ to: '/agent-studio/evaluations', search: { returnTo: undefined } });
    }
  }, [datasetMissing, navigate]);

  if (datasetMissing) {
    return null;
  }

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/evaluations">
        <span aria-hidden="true">‹</span> Evaluations
      </SectionBackRow>
      <QueryView
        query={datasets}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'No datasets', description: 'This dataset does not exist in your organization.' }}
      >
        {(rows) => {
          const current = rows.find((d) => d.id === params.datasetId);
          return current ? (
            <CasesManager
              key={current.id}
              datasetId={current.id}
              datasetName={current.name}
              role={role}
            />
          ) : null;
        }}
      </QueryView>
    </ViewShell>
  );
}

function CasesManager({
  datasetId,
  datasetName,
  role,
}: {
  datasetId: string;
  datasetName: string;
  role: Parameters<typeof canSetup>[0];
}) {
  const navigate = useNavigate();
  const canWrite = canSetup(role, 'setup:author');
  const writeDenied = setupDeniedCopy(role, 'setup:author');
  const cases = useEvalCases(datasetId, { limit: 100 });
  const updateCase = useUpdateEvalCase();
  const deleteCase = useDeleteEvalCase();
  const exportDataset = useExportEvalDataset();
  const importCases = useImportEvalCases();
  const [editing, setEditing] = useState<EvalCase | null>(null);
  const [editDirty, setEditDirty] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Dirty guard: block navigation while a case edit holds unsent changes.
  const { dialog: dirtyDialog } = useDirtyGuard(
    editDirty,
    'You have an unsaved case edit. Leaving now discards it.',
  );

  const closeEdit = () => {
    setEditing(null);
    setEditDirty(false);
  };

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
    <>
      {dirtyDialog}
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Cases — {datasetName}</ViewTitle>
          <ViewSubtitle>
            List, edit, delete, import, or export this dataset&apos;s cases.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <ToolbarRow>
          <ActionButton
            variant="ghost"
            size="sm"
            disabled={!canWrite}
            title={canWrite ? 'Append cases (non-empty array)' : writeDenied}
            onClick={() =>
              navigate({
                to: '/agent-studio/evaluations/datasets/$datasetId/cases/new',
                params: { datasetId },
                // E-2 entry: return here so Done/Cancel land back on the manager.
                search: { returnTo: `/agent-studio/evaluations/datasets/${datasetId}/cases` },
              })
            }
          >
            Add cases
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
        </ToolbarRow>

        {editing ? (
          <CaseEditForm
            caseRow={editing}
            saving={updateCase.isPending}
            onCancel={closeEdit}
            onDirtyChange={setEditDirty}
            onSave={(body) =>
              updateCase.mutate(
                { datasetId, caseId: editing.id, body },
                { onSuccess: () => closeEdit() },
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
                  {`${total} case${total === 1 ? '' : 's'} total${total > list.cases.length ? ` — showing first ${list.cases.length}` : ''}.`}
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
      </motion.div>
    </>
  );
}

/** A4-41 — edit one case through the same strict case vocabulary as add. */
function CaseEditForm({
  caseRow,
  saving,
  onCancel,
  onSave,
  onDirtyChange,
}: {
  caseRow: EvalCase;
  saving: boolean;
  onCancel: () => void;
  onSave: (body: Record<string, unknown>) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [initial] = useState<CaseDraft>(() => draftFromCase(caseRow));
  const [draft, setDraft] = useState<CaseDraft>(initial);
  const built = buildCase(draft);
  const set = (patch: Partial<CaseDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  // The section's dirty guard needs the edit's unsent-change state; report
  // the diff against the prefilled draft.
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.7 }}>
        Editing case <Mono>#{caseRow.sequence}</Mono> — the full body is re-validated; identity and sequence are preserved.
      </p>
      {/*
        Deviation from the modal (documented): every field carries a
        per-case id so its <label> is programmatically associated. The
        modal's labels were unassociated (TextArea/TextInput only wire
        htmlFor when id/name is passed) — a WCAG label-association gap.
        Copy, validation, and behavior are unchanged.
      */}
      <TextArea id="eval-case-edit-text" label="Input text (required)" value={draft.text} onChange={(e) => set({ text: e.target.value })} rows={2} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
        <TextArea id="eval-case-edit-contains" label="Must contain (one per line)" value={draft.contains} onChange={(e) => set({ contains: e.target.value })} rows={2} />
        <TextArea id="eval-case-edit-not-contains" label="Must not contain (one per line)" value={draft.notContains} onChange={(e) => set({ notContains: e.target.value })} rows={2} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
        <TextInput id="eval-case-edit-state" label="State assertions (one per line, optional)" value={draft.stateAssertions} onChange={(e) => set({ stateAssertions: e.target.value })} placeholder="tool.ticket_lookup=called" />
        <TextInput id="eval-case-edit-docids" label="Expected document ids, uuid (one per line, drives recall)" value={draft.documentIds} onChange={(e) => set({ documentIds: e.target.value })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12, marginTop: 8 }}>
        <TextInput id="eval-case-edit-rubric" label="Rubric instructions (optional)" value={draft.rubricInstructions} onChange={(e) => set({ rubricInstructions: e.target.value })} />
        <TextInput id="eval-case-edit-min-score" label="Min score" value={draft.minScore} onChange={(e) => set({ minScore: e.target.value })} />
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
