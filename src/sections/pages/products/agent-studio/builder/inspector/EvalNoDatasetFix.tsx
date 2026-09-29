import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ActionButton } from '@components/common/ui/ActionButton';
import { TextInput } from '@components/common/ui/TextInput';
import { useCreateEvalDataset } from '@hooks/studio/useSetupEval';
import { EVAL_COPY } from '../lib/eval-model';
import { Note } from './TraceDrawer.styles';
import { Muted } from './TrySection.styles';
import { Whisper } from './InstructionsSection.styles';
import { FixBlock, FixField, FixForm, FixLinks, FixTitle } from './EvaluationSection.styles';

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * Shared no-dataset fix path (C10 owns it; builder section + detail panel
 * reuse it). The engine refuses with 400 + a `dataset_id` key — this panel
 * names the three fixes, never the code: create inline, install a
 * template, or open Datasets.
 */
export function EvalNoDatasetFix({
  onDatasetCreated,
  canCreate,
}: {
  onDatasetCreated: (datasetId: string) => void;
  canCreate: boolean;
}) {
  const createDataset = useCreateEvalDataset();
  const [name, setName] = useState('');
  const [createFailed, setCreateFailed] = useState(false);

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed === '' || createDataset.isPending) return;
    setCreateFailed(false);
    createDataset.mutate(
      { name: trimmed },
      {
        onSuccess: (created) => {
          const record = typeof created === 'object' && created !== null ? (created as Record<string, unknown>) : {};
          const nested = typeof record.dataset === 'object' && record.dataset !== null ? (record.dataset as Record<string, unknown>) : null;
          const id = str(record.id) ?? (nested ? str(nested.id) : null);
          if (id) {
            onDatasetCreated(id);
            setName('');
          }
        },
        // The hook toasts, but a toast is transient — the inline whisper is
        // the durable branch so the failure stays visible next to the form.
        onError: () => setCreateFailed(true),
      },
    );
  };

  return (
    <FixBlock>
      <FixTitle>{EVAL_COPY.noDatasetHeadline}</FixTitle>
      <Muted>{EVAL_COPY.noDatasetDetail}</Muted>
      {canCreate && (
        <FixForm>
          <FixField>
            <TextInput label="New dataset name" name="new-dataset-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. refund-regressions" />
          </FixField>
          <ActionButton
            size="sm"
            disabled={name.trim() === '' || createDataset.isPending}
            onClick={submit}
          >
            Create dataset
          </ActionButton>
        </FixForm>
      )}
      {createFailed && (
        <Whisper $tone="red">
          The dataset wasn’t created — nothing was saved. Fix the name and
          press Create dataset again.
        </Whisper>
      )}
      <FixLinks>
        <Link to="/agent-studio/templates">Install a template →</Link>
        <Link to="/agent-studio/datasets">Open Datasets →</Link>
      </FixLinks>
      <Note>Datasets are org-shared — one suite can guard many versions.</Note>
    </FixBlock>
  );
}
