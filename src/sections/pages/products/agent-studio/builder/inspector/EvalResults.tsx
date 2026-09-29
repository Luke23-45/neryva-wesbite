import type { ReactNode } from 'react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { CopyButton } from '@components/common/ui/CopyButton';
import { parseEvalResults, type EvalRun } from '@hooks/studio/useSetupEval';
import {
  EVAL_COPY,
  describeDecision,
  describeRequiredCheck,
  describeStaleBanner,
  evalFreshness,
  type EvalDecision,
} from '../lib/eval-model';
import { TextButton } from './ToolsSection.styles';
import { Note } from './TraceDrawer.styles';
import {
  CaseCard,
  CaseExcerpt,
  CheckMark,
  CheckRow,
  CopyRow,
  EvalActions,
  EvalItem,
  EvalList,
  EvalMeta,
  EvalSection,
  FinishedAt,
  Mono,
  ScoreLine,
  ShadowBadge,
  StaleBanner,
  StaleDetail,
  StaleHeadline,
  StatusRow,
  Undecided,
} from './EvalResults.styles';

export interface EvalResultsProps {
  run: EvalRun;
  /** Current version row (status/updatedAt/hash) — staleness source. */
  versionStatus: string | null;
  versionUpdatedAt: string | null;
  versionHash: string | null;
  datasetName: string | null;
  /**
   * Template required checks (strings + objects). Empty = legacy posture
   * (BLOCK gate only). Null = template unknown on this surface (the
   * cross-agent library) — required resolves on the version surface.
   */
  required: unknown[] | null;
  /** Null while a run is busy or the viewer may not run. */
  onReRun: (() => void) | null;
  /** Case authoring entry — button callback or a prebuilt link node. */
  addCasesAction?: ReactNode;
  onAddCases?: (() => void) | null;
}

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

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * Shared eval-results view (C10 owns it; detail + library + builder reuse
 * it, never fork it). Stale banner FIRST; decision with gate copy;
 * required-vs-optional from checks × template required; failing-case
 * anatomy from the worker report (ids + reasons + excerpts — inputs are
 * not listable, stated once); curated provenance with copy-full.
 */
export function EvalResults({
  run,
  versionStatus,
  versionUpdatedAt,
  versionHash,
  datasetName,
  required,
  onReRun,
  onAddCases,
  addCasesAction,
}: EvalResultsProps) {
  const results = parseEvalResults(run.results);
  const executing = run.state === 'pending' || run.state === 'running';
  // A FAIL verdict is as terminal as PASS/WARN/BLOCK: the run decided,
  // so it is neither pending nor "not-yet-evaluated".
  const decided = (run.decision === 'PASS' || run.decision === 'WARN' || run.decision === 'BLOCK' || run.decision === 'FAIL') && run.state === 'completed';
  const freshness =
    decided && !run.isShadow
      ? evalFreshness({ versionStatus, versionUpdatedAt, runFinishedAt: run.finishedAt })
      : ('fresh' as const);
  const staleBanner =
    freshness === 'stale' && (run.decision === 'PASS' || run.decision === 'WARN' || run.decision === 'BLOCK' || run.decision === 'FAIL')
      ? describeStaleBanner({ decision: run.decision as EvalDecision, finishedAt: run.finishedAt, updatedAt: versionUpdatedAt })
      : null;

  const checkByName = new Map(results.checks.map((c) => [c.name, c.passed]));
  const requiredNames = new Set<string>();
  for (const check of required ?? []) {
    if (typeof check === 'string') requiredNames.add(check);
  }
  const optionalChecks = results.checks.filter((c) => !requiredNames.has(c.name));
  const failingCases = results.cases.filter((c) => !c.passed);
  const provenance = run.provenance ?? {};
  const datasetHash =
    str(provenance.dataset_content_hash) ??
    (typeof provenance.dataset === 'object' && provenance.dataset !== null
      ? str((provenance.dataset as Record<string, unknown>).content_hash)
      : null);
  const blockReasons = Array.isArray(provenance.block_reasons)
    ? (provenance.block_reasons as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];
  const warnings = Array.isArray(provenance.warnings)
    ? (provenance.warnings as unknown[]).filter((v): v is string => typeof v === 'string')
    : [];

  return (
    <div>
      {staleBanner && (
        <StaleBanner role="alert">
          <StaleHeadline>{staleBanner.headline}</StaleHeadline>
          <StaleDetail>{staleBanner.detail}</StaleDetail>
          {onReRun && <TextButton onClick={onReRun}>{EVAL_COPY.reRunSame} ↻</TextButton>}
        </StaleBanner>
      )}
      {freshness === 'unknown' && decided && !run.isShadow && (
        <StaleBanner>
          <StaleHeadline>Freshness unknown</StaleHeadline>
          <StaleDetail>{EVAL_COPY.unknownFreshness}</StaleDetail>
        </StaleBanner>
      )}

      <StatusRow>
        <StatusPill tone={stateTone[run.state] ?? 'neutral'} dot={false}>
          {run.state}
        </StatusPill>
        {run.decision ? (
          <StatusPill tone={decisionTone[run.decision] ?? 'neutral'} dot={false}>
            {run.decision}
          </StatusPill>
        ) : (
          <Undecided>undecided</Undecided>
        )}
        {run.isShadow && <ShadowBadge>{EVAL_COPY.shadowBadge}</ShadowBadge>}
        {run.score !== null && (
          <ScoreLine>
            score <Mono>{run.score}</Mono>
          </ScoreLine>
        )}
        {run.finishedAt && <FinishedAt>{run.finishedAt.slice(0, 16).replace('T', ' ')}</FinishedAt>}
      </StatusRow>

      {decided && !run.isShadow && <Note>{describeDecision(run.decision as EvalDecision).detail}</Note>}
      {run.isShadow && <Note>Shadow rows observe drift — they never gate releases and never satisfy required checks.</Note>}
      {executing && <Note>Executing cases… this view refreshes while the run is open.</Note>}
      {run.state === 'failed' && <Note>The run failed before deciding — re-evaluate.</Note>}

      {(blockReasons.length > 0 || warnings.length > 0) && (
        <>
          <EvalSection>Decision inputs</EvalSection>
          <EvalList>
            {blockReasons.map((reason) => (
              <EvalItem key={reason}>
                <CheckMark $pass={false}>✗</CheckMark> {reason}
              </EvalItem>
            ))}
            {warnings.map((warning) => (
              <EvalItem key={warning}>
                <CheckMark $pass>!</CheckMark> {warning}
              </EvalItem>
            ))}
          </EvalList>
        </>
      )}

      <EvalSection>Required · template</EvalSection>
      {required === null ? (
        <Note>Required checks resolve on the version surface — this cross-agent row carries no template.</Note>
      ) : required.length === 0 ? (
        <Note>No release policy — legacy posture (BLOCK gate only).</Note>
      ) : (
        <>
          {required.map((check, index) => {
            const view = describeRequiredCheck(check);
            const checkName = typeof check === 'string' ? check : null;
            const verdict = checkName !== null && checkByName.has(checkName) ? (checkByName.get(checkName) as boolean) : null;
            return (
              <CheckRow key={`${view.label}-${index}`}>
                {verdict === null ? <CheckMark $pass={false}>?</CheckMark> : <CheckMark $pass={verdict}>{verdict ? '✓' : '✗'}</CheckMark>}
                <span>
                  <Mono>{view.label}</Mono>
                  {view.detail && <> — {view.detail}</>}
                  {verdict === null && checkName !== null && <> — unevaluated, BLOCKs (fail-closed)</>}
                </span>
              </CheckRow>
            );
          })}
          <Note>Only a fresh PASS on this content hash publishes.</Note>
        </>
      )}
      {optionalChecks.length > 0 && (
        <>
          <EvalSection>Optional · worker-reported</EvalSection>
          {optionalChecks.map((check) => (
            <CheckRow key={check.name}>
              <CheckMark $pass={check.passed}>{check.passed ? '✓' : '✗'}</CheckMark>
              <Mono>{check.name}</Mono>
            </CheckRow>
          ))}
        </>
      )}

      <EvalSection>Failing cases · {failingCases.length}</EvalSection>
      {failingCases.length === 0 ? (
        <Note>{decided ? 'No failing cases reported for this run.' : 'Cases land here when the run decides.'}</Note>
      ) : (
        <>
          {failingCases.map((c) => (
            <CaseCard key={`${c.caseId}-${c.attempt ?? 0}`}>
              <div>
                <Mono>{c.caseId}</Mono>
                {c.score !== null && <> · {c.score.toFixed(2)}</>}
                {c.attempt !== null && <> · attempt {c.attempt}</>}
              </div>
              {c.failureReason && <div>{c.failureReason}</div>}
              {c.responseExcerpt && (
                <CaseExcerpt>“{c.responseExcerpt}” (excerpt, 512 max)</CaseExcerpt>
              )}
            </CaseCard>
          ))}
          <Note>{EVAL_COPY.noCaseList}</Note>
          <EvalActions>
            {onAddCases && <TextButton onClick={onAddCases}>{EVAL_COPY.addCoveringCase} →</TextButton>}
            {!onAddCases && addCasesAction}
          </EvalActions>
        </>
      )}

      <EvalSection>Provenance</EvalSection>
      {Object.keys(provenance).length === 0 ? (
        <Note>No provenance recorded (legacy run).</Note>
      ) : (
        <EvalList>
          {datasetName && (
            <EvalItem>
              dataset <Mono>{datasetName}</Mono>
            </EvalItem>
          )}
          {datasetHash && (
            <EvalItem>
              dataset hash <Mono>{datasetHash.slice(0, 16)}</Mono>
              <EvalMeta>Scores compare only on the same dataset state.</EvalMeta>
            </EvalItem>
          )}
          {versionHash && (
            <EvalItem>
              draft now <Mono>{versionHash.slice(0, 12)}</Mono>
              <EvalMeta>Gate reads the content hash — a moved hash orphans the verdict.</EvalMeta>
            </EvalItem>
          )}
          {typeof provenance.seed === 'number' && (
            <EvalItem>
              seed <Mono>{provenance.seed}</Mono>
              {run.attemptsPerCase !== null && <> · {run.attemptsPerCase} attempt{run.attemptsPerCase === 1 ? '' : 's'}/case</>}
            </EvalItem>
          )}
          {typeof provenance.release_policy_version === 'number' && (
            <EvalItem>
              release policy <Mono>v{provenance.release_policy_version}</Mono>
            </EvalItem>
          )}
        </EvalList>
      )}
      {Object.keys(provenance).length > 0 && (
        <CopyRow>
          <CopyButton value={JSON.stringify({ run: run.id, decision: run.decision, score: run.score, provenance }, null, 2)} label="Copy full" />
        </CopyRow>
      )}

      <EvalActions>
        {onReRun && (
          <TextButton onClick={onReRun}>
            {EVAL_COPY.reRunSame} ↻
          </TextButton>
        )}
      </EvalActions>
      <Note>{EVAL_COPY.latestWins}</Note>
    </div>
  );
}
