import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { FlaskConical } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
import { useEvaluateVersion, useVersionProvenance, type AgentVersion } from '@hooks/studio/useAgentAuthoring';
import { useEvalDatasets, useEvalRuns, useEvalRunPolling, type EvalRun } from '@hooks/studio/useSetupEval';
import { useAssistantTemplate } from '@hooks/studio/useSetupTemplates';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { clampEvalAttempts, isNoDatasetError, orderRunsNewestFirst } from '../../builder/lib/eval-model';
import { EvalNoDatasetFix } from '../../builder/inspector/EvalNoDatasetFix';
import { EvalResults } from '../../builder/inspector/EvalResults';
import { Note } from '../../builder/inspector/TraceDrawer.styles';
import { buildAgentBuildPath } from '../../builder/lib/slot-model';

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.6;
`;

/**
 * Evaluate panel (team_setup_ledger.md F-E2, version scope) — formal
 * evaluation of DRAFT or PUBLISHED content (R-2: drafts evaluate pre-publish
 * with a synthesized snapshot; RETIRED refuses). Thin over the shared
 * C10 truth: same stale-first results, same no-dataset fix path, same
 * same-dataset re-run as the builder and the library.
 */
export function EvaluatePanel({ agentId, versions }: { agentId: string; versions: AgentVersion[] }) {
  const { role, orgId } = useOrg();
  const queryClient = useQueryClient();
  const canEvaluate = canSetup(role, 'setup:author');
  const evaluateDenied = setupDeniedCopy(role, 'setup:author');
  const evaluate = useEvaluateVersion(agentId);
  const datasets = useEvalDatasets();
  const runs = useEvalRuns(undefined, { enabled: true });

  const [versionId, setVersionId] = useState('');
  const [datasetId, setDatasetId] = useState('');
  const [attempts, setAttempts] = useState('1');
  const [trackedRunId, setTrackedRunId] = useState<string | null>(null);

  const evaluable = versions.filter((v) => v.status === 'DRAFT' || v.status === 'PUBLISHED');
  const effectiveVersionId = versionId || evaluable[0]?.id || '';
  const effectiveVersion = evaluable.find((v) => v.id === effectiveVersionId) ?? null;

  // Provenance carries the template ref (template-seeded dataset hint).
  const provenance = useVersionProvenance(agentId, effectiveVersionId || null);
  const template = useAssistantTemplate(
    provenance.data?.template?.slug ?? null,
    provenance.data?.template?.version ?? undefined,
  );
  const required: unknown[] = Array.isArray((template.data?.releasePolicy as { required?: unknown } | undefined)?.required)
    ? ((template.data?.releasePolicy as { required?: unknown }).required as unknown[])
    : [];

  // Newest-first by timestamps (shared ordering — never the raw wire order).
  const versionRuns = orderRunsNewestFirst((runs.data ?? []).filter((run) => run.assistantVersionId === effectiveVersionId));
  const latest: EvalRun | null = trackedRunId
    ? (versionRuns.find((r) => r.id === trackedRunId) ?? versionRuns[0] ?? null)
    : (versionRuns[0] ?? null);
  const running = latest !== null && (latest.state === 'pending' || latest.state === 'running');
  useEvalRunPolling(running, runs.refetch);

  const attemptsNumber = clampEvalAttempts(Number(attempts) || 1);
  const showFixPath = isNoDatasetError(evaluate.error);

  const start = (input: { datasetId?: string; attempts: number }) => {
    if (!effectiveVersionId) {
      return;
    }
    evaluate.mutate(
      {
        versionId: effectiveVersionId,
        ...(input.datasetId ? { datasetId: input.datasetId } : {}),
        attemptsPerCase: input.attempts,
      },
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
    <Panel
      title="Evaluate"
      subtitle="Formal rubric evaluation — decisions gate publishing and promotion by content hash. Drafts evaluate pre-publish. The interim engine harness scores lexical assertions; LLM judges run via the Studio eval-worker."
    >
      {evaluable.length === 0 ? (
        <Muted>No DRAFT or PUBLISHED version to evaluate — retired versions never execute.</Muted>
      ) : (
        <>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
            Version
            <select value={effectiveVersionId} onChange={(e) => { setVersionId(e.target.value); setTrackedRunId(null); }} style={{ display: 'block', width: '100%', marginTop: 4 }}>
              {evaluable.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version} · {v.status}{v.hash ? ` · ${v.hash.slice(0, 12)}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
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
          <div style={{ maxWidth: 220 }}>
            <TextInput label="Attempts per case (1–5)" type="number" value={attempts} min={1} max={5} onChange={(e) => setAttempts(e.target.value)} />
          </div>
          {provenance.data?.template && (
            <p style={{ fontSize: 12, opacity: 0.7 }}>
              Installed from <Mono>{provenance.data.template.slug}@{provenance.data.template.version}</Mono> — the seeded dataset{' '}
              <Mono>template:{provenance.data.template.slug}@{provenance.data.template.version}</Mono> resolves automatically when present.
            </p>
          )}
          {showFixPath && <EvalNoDatasetFix onDatasetCreated={(id) => setDatasetId(id)} canCreate={canEvaluate} />}
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <ActionButton size="sm" disabled={!canEvaluate || evaluate.isPending || running} title={canEvaluate ? 'Start an eval run for this version' : evaluateDenied} onClick={() => start({ ...(datasetId ? { datasetId } : {}), attempts: attemptsNumber })}>
              <FlaskConical size={13} strokeWidth={1.8} />
              {evaluate.isPending ? 'Starting…' : 'Evaluate this version'}
            </ActionButton>
            {latest?.datasetId && !running && (
              <ActionButton size="sm" variant="secondary" onClick={reRun} title="Re-run — same dataset, same attempts">
                Re-run with same dataset ↻
              </ActionButton>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <QueryView
              query={runs}
              isEmpty={() => false}
              empty={{ title: '', description: '' }}
            >
              {() =>
                versionRuns.length === 0 ? (
                  <EmptyState icon={<FlaskConical size={18} opacity={0.5} />} title="No eval runs yet" description="Start one above — the decision lands here with its provenance." />
                ) : (
                  <>
                    {latest && (
                      <EvalResults
                        run={latest}
                        versionStatus={effectiveVersion?.status ?? null}
                        versionUpdatedAt={effectiveVersion?.updatedAt ?? null}
                        versionHash={effectiveVersion?.hash ?? null}
                        datasetName={datasetNameFor(latest)}
                        required={required}
                        onReRun={canEvaluate && !running && latest.datasetId ? reRun : null}
                        onAddCases={null}
                        addCasesAction={<Link to="/agent-studio/evaluations">Add a covering case →</Link>}
                      />
                    )}
                    {versionRuns.length > 1 && (
                      <p style={{ fontSize: 12, opacity: 0.65 }}>
                        +{versionRuns.length - 1} older run{versionRuns.length - 1 === 1 ? '' : 's'} — latest wins for every gate. Full history lives in <Link to="/agent-studio/evaluations">Evaluations</Link>.
                      </p>
                    )}
                    <Note>
                      Verdicts edit in the builder too — <Link to={buildAgentBuildPath(agentId)}>open the Evaluator slot →</Link>
                    </Note>
                  </>
                )
              }
            </QueryView>
          </div>
        </>
      )}
    </Panel>
  );
}
