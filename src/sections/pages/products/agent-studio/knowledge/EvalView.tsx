import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Plus } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { TextInput } from '@components/common/ui/TextInput';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { DataTable, DataHead, DataRow, DataCell } from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { useEvalDatasets, useCreateEvalDataset } from '@hooks/studio/useKnowledgeLibrary';
import { relativeTime } from '@/sections/pages/products/agent-studio/builder/lib/memory-model';

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

const ScoreCell = styled.span`
  font-variant-numeric: tabular-nums;
  font-size: 13px;
`;

export function EvalView() {
  const datasetsQuery = useEvalDatasets();
  const createDataset = useCreateEvalDataset();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (name.trim().length === 0) {
      setFormError('Name is required.');
      return;
    }
    setFormError(null);
    try {
      await createDataset.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
      setName('');
      setDescription('');
      setShowForm(false);
    } catch {
      // toastEngineError already handled in the hook.
    }
  };

  return (
    <ViewShell>
      <ViewHeader>
        <div>
          <ViewTitle>Retrieval eval</ViewTitle>
          <ViewSubtitle>Golden-query datasets for measuring retrieval quality over time.</ViewSubtitle>
        </div>
        <ActionButton onClick={() => setShowForm((v) => !v)} >
            <Plus size={16} style={{ marginRight: 6 }} />
          New dataset
        </ActionButton>
      </ViewHeader>

      {showForm && (
        <motion.div variants={pageItem} initial="hidden" animate="visible">
          <FormCard>
            <FormRow>
              <FormField>
                <TextInput
                  label="Dataset name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Support FAQ golden set"
                />
              </FormField>
              <FormField>
                <TextInput
                  label="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this dataset covers"
                />
              </FormField>
              <ActionButton
                onClick={handleCreate}
                disabled={createDataset.isPending}
                variant="primary"
              >
                {createDataset.isPending ? 'Creating…' : 'Create dataset'}
              </ActionButton>
            </FormRow>
            {formError && <p style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 8 }}>{formError}</p>}
          </FormCard>
        </motion.div>
      )}

      <QueryView query={datasetsQuery}>
        {(datasets) =>
          !datasets || datasets.length === 0 ? (
          <EmptyState
            icon={<Plus size={24} />}
            title="No eval datasets yet"
            description="Create a dataset of golden queries to start measuring retrieval quality."
          />
        ) : (
          <motion.div variants={pageItem} initial="hidden" animate="visible">
            <DataTable>
              <DataHead>
                <DataCell>Name</DataCell>
                <DataCell>Cases</DataCell>
                <DataCell>Last run</DataCell>
                <DataCell>Created</DataCell>
              </DataHead>
              {datasets.map((ds) => (
                  <DataRow key={ds.id}>
                    <DataCell>
                      <Link
                        to="/agent-studio/knowledge/eval/$datasetId"
                        params={{ datasetId: ds.id }}
                        style={{ fontWeight: 600 }}
                      >
                        {ds.name}
                      </Link>
                      {ds.description && (
                        <div style={{ fontSize: 12, opacity: 0.65 }}>{ds.description}</div>
                      )}
                    </DataCell>
                    <DataCell>
                      <ScoreCell>{ds.caseCount}</ScoreCell>
                    </DataCell>
                    <DataCell>
                      {ds.lastRunAt ? (
                        relativeTime(ds.lastRunAt)
                      ) : (
                        <StatusPill tone="info">Never run</StatusPill>
                      )}
                    </DataCell>
                    <DataCell>{ds.createdAt ? relativeTime(ds.createdAt) : '—'}</DataCell>
                  </DataRow>
                ))}
            </DataTable>
          </motion.div>
          )
        }
      </QueryView>
    </ViewShell>
  );
}
