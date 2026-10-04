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
  EVAL_ATTEMPTS_MIN,
  clampEvalAttempts,
  describeDatasetOrigin,
  isNoDatasetError,
  orderRunsNewestFirst,
} from '../lib/eval-model';
import { useStringDraft } from '../lib/use-string-draft';
import { buildAgentDetailPath } from '../lib/slot-model';
import { EmptyState } from '@components/common/ui/EmptyState';
import { EvalNoDatasetFix } from './EvalNoDatasetFix';
import { EvalResults } from './EvalResults';
import { SkeletonRows } from './SkeletonRows';
import {
  ActionsRow,
  AttemptsWrap,
  DatasetLabel,
  FieldBlock,
  FieldHead,
  FieldHelper,
  FieldTitle,
  HitNavLink,
  InlineRetry,
  LinkRow,
  Muted,
  RunsError,
  RunsErrorBody,
  RunsErrorTitle,
  Wrap,
} from './EvaluationSection.styles';
import { Dropdown } from '@components/common/ui/Dropdown';
import { Note } from './TraceDrawer.styles';

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
  const [trackedRunId, setTrackedRunId] = useState<string | null>(null);
  // EVL-1: set when the polling budget outlives the run — the section
  // re-enables with an honest "still running" notice instead of wedging.
  const [pollBudgetExpired, setPollBudgetExpired] = useState(false);

  // EVL-3: commit-on-blur semantics (Model/RSP-2 precedent) — the raw
  // text survives typing, clamping lands on the COMMITTED value with a
  // visible note, never a silent rewrite at submit.
  const [attemptsCommitted, setAttemptsCommitted] = useState(EVAL_ATTEMPTS_MIN);
  const [attemptsNote, setAttemptsNote] = useState<string | null>(null);
  const attemptsDraft = useStringDraft(attemptsCommitted, (value) => {
    const next = clampEvalAttempts(value ?? EVAL_ATTEMPTS_MIN);
    setAttemptsCommitted(next);
    setAttemptsNote(
      next !== Math.round(value ?? EVAL_ATTEMPTS_MIN)
        ? `Clamped to ${next} — attempts per case is 1–5.`
        : null,
    );
  }, {
    onInvalid: () => setAttemptsNote(`Not a number — kept ${attemptsCommitted}.`),
  });

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

  /**
   * First load still in flight. fetchStatus stays 'idle' for disabled
   * queries (e.g. provenance with no versionId), so this never mistakes
   * "not asked" for "still loading" — P1a false-empty guard.
   */
  const firstLoad = (query: { isPending: boolean; fetchStatus: string }): boolean =>
    query.isPending && query.fetchStatus !== 'idle';
  const runsLoading = firstLoad(runs);
  const datasetsLoading = firstLoad(datasets);
  const provenanceLoading = firstLoad(provenance);
  const notificationsLoading = firstLoad(notifications);

  // Newest-first by timestamps (shared ordering — never the raw wire order).
  const versionRuns = orderRunsNewestFirst((runs.data ?? []).filter((run) => run.assistantVersionId === versionId));
  const latest: EvalRun | null = trackedRunId
    ? (versionRuns.find((r) => r.id === trackedRunId) ?? versionRuns[0] ?? null)
    : (versionRuns[0] ?? null);
  const running = latest !== null && (latest.state === 'pending' || latest.state === 'running');
  // EVL-1: poll to terminal state — the hook's absolute budget fires
  // onBudgetExpired once instead of wedging `latest.state` at 'running'
  // (which would disable "Evaluate version" forever). Gating `active`
  // on the expiry restarts the budget cleanly for the next run.
  useEvalRunPolling(running && !pollBudgetExpired, runs.refetch, {
    onBudgetExpired: () => setPollBudgetExpired(true),
  });

  const seededName = templateSlug && templateVersion ? `template:${templateSlug}@${templateVersion}` : null;
  const seededDataset = seededName ? ((datasets.data ?? []).find((d) => d.name === seededName) ?? null) : null;
  const pickedDataset = datasetId ? ((datasets.data ?? []).find((d) => d.id === datasetId) ?? null) : null;
  // null while the template is unresolved — EvalResults renders the honest
  // "resolves on the version surface" note; [] would falsely claim "no release policy".
  const required: unknown[] | null =
    template.data == null
      ? null
      : Array.isArray((template.data.releasePolicy as { required?: unknown } | undefined)?.required)
        ? ((template.data.releasePolicy as { required?: unknown }).required as unknown[])
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
  const showFixPath = isNoDatasetError(evaluate.error);

  const start = (input: { datasetId?: string; attempts: number }) => {
    if (!versionId) return;
    // A fresh run gets a fresh polling budget (EVL-1).
    setPollBudgetExpired(false);
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
    start({ datasetId: latest.datasetId, attempts: latest.attemptsPerCase ?? attemptsCommitted });
  };

  const datasetNameFor = (run: EvalRun): string | null =>
    (datasets.data ?? []).find((d) => d.id === run.datasetId)?.name ?? null;

  return (
    <Wrap>
      <FieldBlock>
        <FieldHead>
          <FieldTitle>Runs against</FieldTitle>
        </FieldHead>
        <FieldHelper>
          {runnable ? `${versionLabel} — draft-pinned, snapshot synthesized.` : 'No DRAFT or PUBLISHED version to evaluate — retired versions never execute, and a VALIDATING version is mid-validation.'}
        </FieldHelper>
      </FieldBlock>

      <FieldBlock>
        <FieldHead>
          <FieldTitle>Dataset</FieldTitle>
          {!(datasetsLoading || provenanceLoading) && (
            <FieldHelper>{seededDataset ? 'seeded' : 'attach'}</FieldHelper>
          )}
        </FieldHead>
        {datasetsLoading || provenanceLoading ? (
          <SkeletonRows rows={3} />
        ) : (
          <>
            {seededDataset ? (
              <FieldHelper>
                {describeDatasetOrigin(seededDataset.name)} · resolves automatically when the picker stays on template default.
              </FieldHelper>
            ) : (
              <FieldHelper>No template-seeded dataset — pick one explicitly or create it below. The template default fails loudly until then.</FieldHelper>
            )}
            <DatasetLabel>
              Dataset (omit for the template-seeded default)
              <Dropdown
                variant="select"
                value={datasetId}
                onChange={(v) => setDatasetId(v)}
                aria-label="Dataset"
                items={[
                  { value: '', label: 'Template default (fails loudly when none exists)' },
                  ...(datasets.data ?? []).map((dataset) => ({ value: dataset.id, label: dataset.name })),
                ]}
              />
            </DatasetLabel>
            {pickedDataset && <FieldHelper>{describeDatasetOrigin(pickedDataset.name)} dataset.</FieldHelper>}
          </>
        )}
      </FieldBlock>

      {showFixPath && <EvalNoDatasetFix onDatasetCreated={(id) => setDatasetId(id)} canCreate={mayRun} />}

      <FieldBlock>
        <FieldHead>
          <FieldTitle>Run</FieldTitle>
        </FieldHead>
        {mayRun ? (
          <>
            <AttemptsWrap>
              <TextInput
                label={EVAL_COPY.attemptsLabel}
                type="number"
                value={attemptsDraft.value}
                min={1}
                max={5}
                onChange={(e) => {
                  attemptsDraft.onChange(e.target.value);
                  setAttemptsNote(null);
                }}
                onBlur={attemptsDraft.onBlur}
                onKeyDown={attemptsDraft.onKeyDown}
              />
              {attemptsNote && <FieldHelper>{attemptsNote}</FieldHelper>}
            </AttemptsWrap>
            <ActionsRow>
              <ActionButton
                size="lg"
                disabled={!runnable || evaluate.isPending || (running && !pollBudgetExpired)}
                title={!runnable ? 'No DRAFT or PUBLISHED version to evaluate' : 'Start an eval run for this version'}
                onClick={() => start({ ...(datasetId ? { datasetId } : {}), attempts: attemptsCommitted })}
              >
                <FlaskConical size={13} strokeWidth={1.8} />
                {evaluate.isPending ? 'Starting…' : 'Evaluate version'}
              </ActionButton>
              {latest?.datasetId && !running && (
                <ActionButton size="lg" variant="secondary" onClick={reRun} title={`${EVAL_COPY.reRunSame} — same dataset, same attempts`}>
                  {EVAL_COPY.reRunSame} ↻
                </ActionButton>
              )}
            </ActionsRow>
            {pollBudgetExpired && running && (
              <FieldHelper>
                Still running — polling stopped after 15 minutes, but the run
                continues on the server. Check back or refresh; starting a new
                evaluation is safe.
              </FieldHelper>
            )}
          </>
        ) : (
          <FieldHelper>Viewing only — {denied} Verdicts stay visible read-only.</FieldHelper>
        )}
      </FieldBlock>

      {runsLoading ? (
        <SkeletonRows rows={3} />
      ) : runs.isError ? (
        <RunsError>
          <RunsErrorTitle>Eval runs couldn’t be loaded.</RunsErrorTitle>
          <RunsErrorBody>
            Your versions and datasets are untouched —{' '}
            <InlineRetry type="button" onClick={() => { void runs.refetch(); }}>
              try again
            </InlineRetry>
            .
          </RunsErrorBody>
        </RunsError>
      ) : latest ? (
        <EvalResults
          run={latest}
          versionStatus={row?.status ?? versionStatus}
          versionUpdatedAt={row?.updatedAt ?? null}
          versionHash={row?.hash ?? versionHash}
          datasetName={datasetNameFor(latest)}
          required={required}
          onReRun={mayRun && !running && latest.datasetId ? reRun : null}
          addCasesAction={<Link to="/agent-studio/evaluations" search={{ returnTo: undefined }}>Add a covering case →</Link>}
        />
      ) : (
        <EmptyState icon={<FlaskConical size={18} opacity={0.5} />} title="No eval runs yet" description="Evaluate this version — the decision lands here with its provenance." />
      )}

      <FieldBlock>
        <FieldHead>
          <FieldTitle>Watching</FieldTitle>
        </FieldHead>
        {notificationsLoading ? (
          <div aria-busy="true">
            <SkeletonRows rows={3} />
          </div>
        ) : latestDrift ? (
          <>
            <FieldHelper>
              {latestDrift.title ?? 'Model drift'} — {latestDrift.message ?? 'the catalog moved under the active version.'}
            </FieldHelper>
            {shadowRuns.length > 0 && (
              <FieldHelper>
                {shadowRuns.length} shadow run{shadowRuns.length === 1 ? '' : 's'} observing — never gates releases.
              </FieldHelper>
            )}
          </>
        ) : shadowRuns.length > 0 ? (
          <FieldHelper>
            {shadowRuns.length} shadow run{shadowRuns.length === 1 ? '' : 's'} observing this version — never gates releases.
          </FieldHelper>
        ) : (
          <FieldHelper>{EVAL_COPY.driftSteady}</FieldHelper>
        )}
      </FieldBlock>

      <LinkRow>
        <HitNavLink to="/agent-studio/evaluations" search={{ returnTo: undefined }}>{EVAL_COPY.evaluationsLink}</HitNavLink>
        <HitNavLink to={buildAgentDetailPath(assistantId)}>Open publish gates ›</HitNavLink>
      </LinkRow>
      <Note>{EVAL_COPY.latestWins} Test runs are recorded in audit. <Link to="/platform/audit">Open Audit →</Link></Note>
      {versionRuns.length > 1 && (
        <Muted>
          +{versionRuns.length - 1} older run{versionRuns.length - 1 === 1 ? '' : 's'} on this version — full history lives in Evaluations.
        </Muted>
      )}
    </Wrap>
  );
}
