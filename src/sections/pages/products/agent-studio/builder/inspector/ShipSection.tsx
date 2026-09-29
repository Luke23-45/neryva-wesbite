import { useEffect, useRef, useState } from 'react';
import { Rocket } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { usePublishReadiness, usePublishVersion } from '@hooks/studio/useAgentAuthoring';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import type { OrgRole } from '@/Context/OrgContext';
import {
  PUBLISH_COPY,
  classifyPublishRefusal,
  refusalFix,
  type PublishEditTarget,
  type PublishRefusalKind,
} from '../lib/publish-model';
import { buildAgentDetailPath } from '../lib/slot-model';
import { PublishSuccess, type PublishReceipt } from './PublishSuccess';
import { ReadinessRows } from './ReadinessRows';
import {
  AckCheckbox,
  AckLabel,
  Dot,
  FixLink,
  Mono,
  Muted,
  Notice,
  PublishBlock,
  Refusal,
  RefusalFix,
  RefusalLink,
  RefusalMessage,
  RefusalTitle,
  Sub,
  Verdict,
} from './ShipSection.styles';

export function ShipSection({
  assistantId,
  versionId,
  role,
  onEditJump,
  publishSignal = 0,
}: {
  assistantId: string;
  versionId: string | null;
  role: OrgRole | null;
  onEditJump: (target: PublishEditTarget) => void;
  /**
   * Manual publish counter (v10 topbar Publish). Each increment fires the
   * existing publish flow exactly once — via handlePublishClick, so the
   * readiness/ack/confirm guards are never bypassed. 0 = idle.
   */
  publishSignal?: number;
}) {
  const canPublish = canSetup(role, 'setup:govern');
  const publishDenied = setupDeniedCopy(role, 'setup:govern');
  const [acknowledge, setAcknowledge] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [refusal, setRefusal] = useState<{ kind: PublishRefusalKind; message: string } | null>(null);
  const [success, setSuccess] = useState<PublishReceipt | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const readiness = usePublishReadiness(assistantId, versionId, { acknowledged: acknowledge });
  const publish = usePublishVersion(assistantId);

  // Manual publish (v10 topbar Publish): the builder increments
  // publishSignal for unblocked clicks; each increment fires the existing
  // handlePublishClick exactly once. The ref starts at 0 (idle), so a mount
  // with signal > 0 fires once; StrictMode's double-effect is absorbed by
  // the last-signal guard. Guards (readiness/ack/confirm) are untouched —
  // this never calls the mutation directly.
  const publishClickRef = useRef<() => void>(() => undefined);
  const lastPublishSignalRef = useRef(0);

  const blockers = readiness.rows.filter((row) => row.ok === false && !(row.ackable && acknowledge));

  function scrollToRow(id: string) {
    // jsdom has no scrollIntoView — guard so tests exercise the copy.
    const el = document.getElementById(`ship-row-${id}`);
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    (el as HTMLElement | null)?.focus?.();
  }

  function handlePublishClick() {
    // P1-1 (T-01): the topbar publishSignal lands here too — a non-governor
    // must never reach the confirm dialog, because the engine's publish
    // endpoint (owner/admin only) would 403. The section's own button is
    // already gated; this closes the signal path.
    if (!canPublish) return;
    if (!readiness.publishable) {
      const first = blockers[0] ?? null;
      if (first) {
        setNotice(`${first.title} — open the row to fix it.`);
        scrollToRow(first.id);
      }
      return;
    }
    setNotice(null);
    setConfirmOpen(true);
  }

  // Manual publish (v10 topbar Publish): latest-callback ref so the signal
  // effect below invokes the current handlePublishClick without re-firing
  // on unrelated renders. Each signal increment fires exactly once; guards
  // (readiness/ack/confirm) are untouched — this never calls the mutation
  // directly.
  useEffect(() => {
    publishClickRef.current = handlePublishClick;
  });
  useEffect(() => {
    const signal = publishSignal ?? 0;
    if (signal > lastPublishSignalRef.current) {
      lastPublishSignalRef.current = signal;
      publishClickRef.current();
    }
  }, [publishSignal]);

  // Per-version ceremony state resets with the version (render-time
  // adjustment — an effect here would cascade renders).
  const [prevVersionId, setPrevVersionId] = useState(versionId);
  if (prevVersionId !== versionId) {
    setPrevVersionId(versionId);
    setAcknowledge(false);
    setRefusal(null);
    setSuccess(null);
    setNotice(null);
  }

  if (!versionId) {
    return (
      <Panel title="Ship" subtitle="Gates, then publish">
        <Muted>No draft selected — save one in the editor first. Only DRAFT/VALID versions publish.</Muted>
      </Panel>
    );
  }
  // Top-level const: narrowing holds for every closure below (prop bindings
  // are mutable, so the raw prop would not narrow inside callbacks).
  const draftId: string = versionId;

  const verdictTone =
    readiness.verdict === 'go' ? 'success' : readiness.verdict === 'conditional-go' ? 'warning' : readiness.verdict === 'no-go' ? 'error' : 'neutral';
  const verdictCopy =
    readiness.verdict === 'go'
      ? PUBLISH_COPY.verdictGo
      : readiness.verdict === 'conditional-go'
        ? PUBLISH_COPY.verdictConditional
        : readiness.verdict === 'no-go'
          ? `${PUBLISH_COPY.verdictNoGo} (${blockers.length})`
          : PUBLISH_COPY.verdictUnknown;

  function handleConfirm() {
    // P1-1 (T-01): last line of defense — even if the confirm dialog were
    // opened by a non-governor (it can't be via the gated paths above), the
    // mutation must not fire; the server would 403.
    if (!canPublish) {
      setConfirmOpen(false);
      return;
    }
    setConfirmOpen(false);
    publish.mutate(
      { versionId: draftId, ...(acknowledge ? { acknowledgeDegradedKnowledge: true } : {}) },
      {
        onSuccess: (ref) => {
          setRefusal(null);
          setSuccess({
            versionNumber: ref.version,
            hash: ref.hash,
            templateSlug: readiness.templateSlug,
            templateVersion: readiness.templateVersion,
            decision: readiness.decision,
            decisionFinishedAt: readiness.decisionFinishedAt,
            degraded: acknowledge && readiness.needsAcknowledge,
            degradedSlugs: [...readiness.unresolvedSlugs, ...readiness.unreadySlugs],
          });
        },
        onError: (error) => {
          setSuccess(null);
          const kind = classifyPublishRefusal(error);
          setRefusal({ kind, message: error instanceof Error ? error.message : 'Publish refused.' });
          setNotice('Publish refused — the exact issue is below with its fix.');
        },
      },
    );
  }

  const version = readiness.version;
  const ackedDegraded = acknowledge && readiness.needsAcknowledge;

  return (
    <Panel
      title="Ship"
      subtitle={
        version
          ? `Draft v${version.version}${version.hash ? ` · ${version.hash.slice(0, 12)}` : ''} — required gates only`
          : 'Required gates only — the engine refuses nothing else'
      }
    >
      <div aria-live="polite">
        <Verdict $tone={verdictTone}>
          <Dot $tone={verdictTone} aria-hidden="true" />
          {verdictCopy}
        </Verdict>
        <Sub>Go / Conditional-Go-with-named-exception / No-Go — never a percentage.</Sub>
      </div>

      {readiness.isError && (
        <Notice>
          Readiness reads failed — <FixLink type="button" onClick={() => readiness.retry()}>retry</FixLink>. Publish stays
          clickable; the server decides.
        </Notice>
      )}

      <ReadinessRows
        rows={readiness.rows}
        acknowledged={acknowledge}
        onJump={onEditJump}
        buildHref={buildAgentDetailPath(assistantId)}
        idPrefix="ship"
      />

      {readiness.noChangeHint && (
        <Muted>No changes vs the live version — {PUBLISH_COPY.noChangeHint}</Muted>
      )}
      {readiness.evalRunning && <Muted>An evaluation is running — the gates re-read when it lands.</Muted>}

      {readiness.needsAcknowledge && (
        <AckLabel id="ship-degraded-ack" tabIndex={-1}>
          <AckCheckbox type="checkbox" checked={acknowledge} onChange={(e) => setAcknowledge(e.target.checked)} />
          <span>
            {PUBLISH_COPY.degradedAck} <Mono>assistant.publish_degraded_acknowledged</Mono>. {PUBLISH_COPY.degradedLifecycle}
          </span>
        </AckLabel>
      )}

      {!canPublish ? (
        <Muted>{publishDenied} {PUBLISH_COPY.requestPublish}</Muted>
      ) : (
        <PublishBlock>
          <ActionButton
            size="sm"
            disabled={!canPublish || publish.isPending}
            aria-disabled={!readiness.publishable}
            aria-describedby={notice ? 'ship-publish-note' : undefined}
            title={
              publish.isPending
                ? 'Publishing…'
                : !readiness.publishable
                  ? 'Open issues remain — click to jump to the first'
                  : readiness.needsAcknowledge && !acknowledge
                    ? 'Acknowledge degraded knowledge to proceed'
                    : 'Publish this draft'
            }
            onClick={handlePublishClick}
          >
            <Rocket size={13} strokeWidth={1.8} />
            {publish.isPending ? 'Publishing…' : 'Publish this draft'}
          </ActionButton>
          {notice && (
            <Notice id="ship-publish-note" role="status">
              {notice}
            </Notice>
          )}
        </PublishBlock>
      )}

      {refusal && (
        <Refusal role="alert">
          <RefusalTitle>{refusal.kind === 'no-op' ? 'No changes to publish' : 'Publish refused'}</RefusalTitle>
          <RefusalMessage>{refusal.message}</RefusalMessage>
          <RefusalFix>
            {refusal.kind === 'no-op' ? (
              <RefusalLink to={buildAgentDetailPath(assistantId)}>
                View the live version →
              </RefusalLink>
            ) : refusal.kind === 'degraded' ? (
              <FixLink
                type="button"
                onClick={() => {
                  setAcknowledge(true);
                  const el = document.getElementById('ship-degraded-ack');
                  el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
                  (el as HTMLElement | null)?.focus?.();
                }}
              >
                Review the acknowledge box →
              </FixLink>
            ) : (
              <RefusalFixLinks kind={refusal.kind} agentId={assistantId} onEditJump={onEditJump} />
            )}
          </RefusalFix>
        </Refusal>
      )}

      {success && <PublishSuccess receipt={success} agentId={assistantId} returnTo={buildAgentDetailPath(assistantId)} />}

      <ConfirmDialog
        open={confirmOpen}
        title={PUBLISH_COPY.confirmTitle}
        message={`${PUBLISH_COPY.confirmMessage}${ackedDegraded ? PUBLISH_COPY.confirmMessageDegraded : ''}`}
        confirmLabel="Publish"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </Panel>
  );
}

function RefusalFixLinks({
  kind,
  agentId,
  onEditJump,
}: {
  kind: PublishRefusalKind;
  agentId: string;
  onEditJump: (target: PublishEditTarget) => void;
}) {
  // Fix descriptors come from the pure model (verbatim engine copy + the
  // console fix route) — the branch never paraphrases the refusal.
  const fix = refusalFix(kind);
  return (
    <>
      {fix.editTarget ? (
        <FixLink type="button" onClick={() => onEditJump(fix.editTarget as PublishEditTarget)}>
          {fix.fixLabel} →
        </FixLink>
      ) : fix.fixRoute ? (
        <RefusalLink to={fix.fixRoute}>
          {fix.fixLabel} →
        </RefusalLink>
      ) : (
        <RefusalLink to={buildAgentDetailPath(agentId)}>
          {fix.fixLabel} →
        </RefusalLink>
      )}
    </>
  );
}
