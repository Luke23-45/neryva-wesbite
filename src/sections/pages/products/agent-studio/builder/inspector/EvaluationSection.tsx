import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { FlaskConical } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import {
  useEvalDatasets,
  useEvalRuns,
  useEvalRunPolling,
  type EvalRun,
} from '@hooks/studio/useSetupEval';
import {
  useAssistantVersions,
  useEvaluateVersion,
  useVersionProvenance,
} from '@hooks/studio/useAgentAuthoring';
import { useAssistantTemplate } from '@hooks/studio/useSetupTemplates';
import { useNotificationsList } from '@hooks/studio/useNotifications';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import type { OrgRole } from '@/Context/OrgContext';
import { useOrg } from '@/Context/OrgContext';
import {
  EVAL_COPY,
  clampEvalAttempts,
  describeDatasetOrigin,
  isNoDatasetError,
  orderRunsNewestFirst,
} from '../lib/eval-model';
import { buildAgentDetailPath } from '../lib/slot-model';
import { EmptyState } from '@components/common/ui/EmptyState';
import { EvalNoDatasetFix } from './EvalNoDatasetFix';
import { EvalResults } from './EvalResults';
import { SectionLabel, Wrap } from './InstructionsSection.styles';
import { Note } from './TraceDrawer.styles';
import { Muted } from './TrySection.styles';

export interface EvaluationSectionProps {
  assistantId: string;
  versionId: string | null;
  versionHash: string | null;
  versionStatus: string | null;
  isDraft: boolean;
  canAuthor: boolean;
  role: OrgRole | null;
}

/**
 * C10 mount — the builder Evaluator satellite (quick path). Seeded-vs-attach
 * state, latest decision with the stale banner FIRST (inside EvalResults),
 * draft-pinned run + same-dataset re-run, shadow/drift states, link-outs.
 * Runs never write the draft, so there is no save machine and no dirty
 * flag — Escape may deselect freely, nothing strands.
 */
export function EvaluationSection({
  assistantId,
  versionId,
  versionHash,
  versionStatus,
  isDraft,
  canAuthor,
  role,
}: EvaluationSectionProps) {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [datasetId, setDatasetId] = useState('');
  const [attempts, setAttempts] = useState('1');
  const [trackedRunId, setTrackedRunId] = useState<string | null>(null);

  const versions = useAssistantVersions(assistantId);
  const runs = useEvalRuns();
  const datasets = useEvalDatasets();
  const provenance = useVersionProvenance(assistantId, versionId);
  const templateSlug = provenance.data?.template?.slug ?? null;
  const templateVersion = provenance.data?.template?.version ?? null;
  const template = useAssistantTemplate(templateSlug, templateVersion ?? undefined);
  const evaluate = useEvaluateVersion(assistantId);
  const notifications = useNotificationsList();

  const runnable = versionId !== null && (isDraft || versionStatus === 'DRAFT' || versionStatus === 'PUBLISHED');
  const row = (versions.data ?? []).find((v) => v.id === versionId) ?? null;

  // Newest-first by timestamps (shared ordering — never the raw wire order).
  const versionRuns = orderRunsNewestFirst((runs.data ?? []).filter((run) => run.assistantVersionId === versionId));
  const latest: EvalRun | null = trackedRunId
    ? (versionRuns.find((r) => r.id === trackedRunId) ?? versionRuns[0] ?? null)
    : (versionRuns[0] ?? null);
  const running = latest !== null && (latest.state === 'pending' || latest.state === 'running');
  useEvalRunPolling(running, runs.refetch);

  const seededName = templateSlug && templateVersion ? `template:${templateSlug}@${templateVersion}` : null;
  const seededDataset = seededName ? ((datasets.data ?? []).find((d) => d.name === seededName) ?? null) : null;
  const pickedDataset = datasetId ? ((datasets.data ?? []).find((d) => d.id === datasetId) ?? null) : null;
  const required: unknown[] = Array.isArray((template.data?.releasePolicy as { required?: unknown } | undefined)?.required)
    ? ((template.data?.releasePolicy as { required?: unknown }).required as unknown[])
    : [];

  const driftItems = (notifications.data?.items ?? []).filter(
    (item) =>
      (item.category === 'assistant.model_drift' || item.category === 'assistant_model_drift') &&
      typeof item.data?.assistant_id === 'string' &&
      item.data.assistant_id === assistantId,
  );
  const latestDrift = driftItems[0] ?? null;
  const shadowRuns = versionRuns.filter((run) => run.isShadow);

  const denied = setupDeniedCopy(role, 'setup:author');
  const mayRun = canAuthor && canSetup(role, 'setup:author');
  const versionLabel = `${isDraft ? 'Draft' : (versionStatus ?? 'Version')}${versionHash ? ` · ${versionHash.slice(0, 8)}` : ''}`;
  const attemptsNumber = clampEvalAttempts(Number(attempts) || 1);
  const showFixPath = isNoDatasetError(evaluate.error);

  const start = (input: { datasetId?: string; attempts: number }) => {
    if (!versionId) return;
    evaluate.mutate(
      { versionId, ...(input.datasetId ? { datasetId: input.datasetId } : {}), attemptsPerCase: input.attempts },
      {
        onSuccess: (result) => {
          const record = typeof result === 'object' && result !== null ? (result as Record<string, unknown>) : {};
          if (typeof record.eval_run_id === 'string') {
            setTrackedRunId(record.eval_run_id);
          }
          void queryClient.invalidateQueries({ queryKey: ['studio', 'setup', 'eval', orgId, 'runs'] });
          void runs.refetch();
        },
      },
    );
  };

  const reRun = () => {
    if (!latest?.datasetId) return;
    setDatasetId(latest.datasetId);
    start({ datasetId: latest.datasetId, attempts: latest.attemptsPerCase ?? attemptsNumber });
  };

  const datasetNameFor = (run: EvalRun): string | null =>
    (datasets.data ?? []).find((d) => d.id === run.datasetId)?.name ?? null;

  return (
    <Wrap>
      <SectionLabel>Runs against</SectionLabel>
      <Muted>{runnable ? `${versionLabel} — draft-pinned, snapshot synthesized.` : 'No DRAFT or PUBLISHED version to evaluate — retired versions never execute.'}</Muted>

      <SectionLabel>Dataset · {seededDataset ? 'seeded' : 'attach'}</SectionLabel>
      {seededDataset ? (
        <Muted>
          {describeDatasetOrigin(seededDataset.name)} · resolves automatically when the picker stays on template default.
        </Muted>
      ) : (
        <Muted>No template-seeded dataset — pick one explicitly or create it below. The template default fails loudly until then.</Muted>
      )}
      <label style={{ fontSize: 13, display: 'block', marginTop: 8 }}>
        Dataset (omit for the template-seeded default)
        <select value={datasetId} onChange={(e) => setDatasetId(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4 }}>
          <option value="">Template default (fails loudly when none exists)</option>
          {(datasets.data ?? []).map((dataset) => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.name}
            </option>
          ))}
        </select>
      </label>
      {pickedDataset && <Muted>{describeDatasetOrigin(pickedDataset.name)} dataset.</Muted>}

      {showFixPath && <EvalNoDatasetFix onDatasetCreated={(id) => setDatasetId(id)} canCreate={mayRun} />}

      {mayRun ? (
        <>
          <div style={{ maxWidth: 220, marginTop: 8 }}>
            <TextInput label={EVAL_COPY.attemptsLabel} type="number" value={attempts} min={1} max={5} onChange={(e) => setAttempts(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <ActionButton
              size="sm"
              disabled={!runnable || evaluate.isPending || running}
              title={!runnable ? 'No DRAFT or PUBLISHED version to evaluate' : 'Start an eval run for this version'}
              onClick={() => start({ ...(datasetId ? { datasetId } : {}), attempts: attemptsNumber })}
            >
              <FlaskConical size={13} strokeWidth={1.8} />
              {evaluate.isPending ? 'Starting…' : 'Evaluate version'}
            </ActionButton>
            {latest?.datasetId && !running && (
              <ActionButton size="sm" variant="secondary" onClick={reRun} title={`${EVAL_COPY.reRunSame} — same dataset, same attempts`}>
                {EVAL_COPY.reRunSame} ↻
              </ActionButton>
            )}
          </div>
        </>
      ) : (
        <Muted>Viewing only — {denied} Verdicts stay visible read-only.</Muted>
      )}

      {latest ? (
        <EvalResults
          run={latest}
          versionStatus={row?.status ?? versionStatus}
          versionUpdatedAt={row?.updatedAt ?? null}
          versionHash={row?.hash ?? versionHash}
          datasetName={datasetNameFor(latest)}
          required={required}
          onReRun={mayRun && !running && latest.datasetId ? reRun : null}
          addCasesAction={<Link to="/agent-studio/evaluations">Add a covering case →</Link>}
        />
      ) : (
        <EmptyState icon={<FlaskConical size={18} opacity={0.5} />} title="No eval runs yet" description="Evaluate this version — the decision lands here with its provenance." />
      )}

      <SectionLabel>Watching</SectionLabel>
      {latestDrift ? (
        <div style={{ marginTop: 8 }}>
          <Muted>
            {latestDrift.title ?? 'Model drift'} — {latestDrift.message ?? 'the catalog moved under the active version.'}
          </Muted>
          {shadowRuns.length > 0 && (
            <Muted>
              {shadowRuns.length} shadow run{shadowRuns.length === 1 ? '' : 's'} observing — never gates releases.
            </Muted>
          )}
        </div>
      ) : shadowRuns.length > 0 ? (
        <Muted>
          {shadowRuns.length} shadow run{shadowRuns.length === 1 ? '' : 's'} observing this version — never gates releases.
        </Muted>
      ) : (
        <Muted>{EVAL_COPY.driftSteady}</Muted>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        <Link to="/agent-studio/evaluations">{EVAL_COPY.evaluationsLink}</Link>
        <Link to={buildAgentDetailPath(assistantId)}>Open publish gates ›</Link>
      </div>
      <Note>{EVAL_COPY.latestWins} Test runs are recorded in audit. <Link to="/platform/audit">Open Audit →</Link></Note>
      {versionRuns.length > 1 && (
        <Muted>
          +{versionRuns.length - 1} older run{versionRuns.length - 1 === 1 ? '' : 's'} on this version — full history lives in Evaluations.
        </Muted>
      )}
    </Wrap>
  );
}
