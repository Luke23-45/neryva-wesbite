import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
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

/**
 * Ship section (C14 builder quick path) — readiness, rail, degraded ack,
 * confirm-gated publish, inline success. Reads the shared
 * `usePublishReadiness` derivation (never its own); refusals render typed
 * branches with verbatim messages, never paraphrase.
 */

const Verdict = styled.div<{ $tone: 'success' | 'warning' | 'error' | 'neutral' }>`
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  color: ${({ $tone, theme }) =>
    $tone === 'success'
      ? theme.app.status.success.fg
      : $tone === 'warning'
        ? theme.app.status.warning.fg
        : $tone === 'error'
          ? theme.app.status.error.fg
          : theme.app.text.primary};
`;

const Dot = styled.span<{ $tone: 'success' | 'warning' | 'error' | 'neutral' }>`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
  align-self: center;
  background: ${({ $tone, theme }) =>
    $tone === 'success'
      ? theme.app.status.success.fg
      : $tone === 'warning'
        ? theme.app.status.warning.fg
        : $tone === 'error'
          ? theme.app.status.error.fg
          : theme.app.text.muted};
`;

const Sub = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  margin-bottom: 8px;
`;

const FixLink = styled.button`
  background: none;
  border: 0;
  padding: 0;
  font-size: 12px;
  cursor: pointer;
  color: ${({ theme }) => theme.app.text.primary};
  text-decoration: underline;
  text-underline-offset: 2px;
`;

const Muted = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.muted};
  margin-top: 8px;
`;

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Refusal = styled.div`
  margin-top: 12px;
  border: 1px solid ${({ theme }) => theme.app.status.error.border};
  background: ${({ theme }) => theme.app.status.error.bg};
  border-radius: 10px;
  padding: 12px;
  font-size: 13px;
  line-height: 1.55;
`;

const Notice = styled.div`
  font-size: 12px;
  margin-top: 8px;
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

export function ShipSection({
  assistantId,
  versionId,
  role,
  onEditJump,
}: {
  assistantId: string;
  versionId: string | null;
  role: OrgRole | null;
  onEditJump: (target: PublishEditTarget) => void;
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

  const blockers = readiness.rows.filter((row) => row.ok === false && !(row.ackable && acknowledge));
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

  function scrollToRow(id: string) {
    // jsdom has no scrollIntoView — guard so tests exercise the copy.
    const el = document.getElementById(`ship-row-${id}`);
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    (el as HTMLElement | null)?.focus?.();
  }

  function handlePublishClick() {
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

  function handleConfirm() {
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
        <label id="ship-degraded-ack" tabIndex={-1} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, marginTop: 10 }}>
          <input type="checkbox" checked={acknowledge} onChange={(e) => setAcknowledge(e.target.checked)} style={{ marginTop: 3 }} />
          <span>
            {PUBLISH_COPY.degradedAck} <Mono>assistant.publish_degraded_acknowledged</Mono>. {PUBLISH_COPY.degradedLifecycle}
          </span>
        </label>
      )}

      {!canPublish ? (
        <Muted>{publishDenied} {PUBLISH_COPY.requestPublish}</Muted>
      ) : (
        <div style={{ marginTop: 12 }}>
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
        </div>
      )}

      {refusal && (
        <Refusal role="alert">
          <strong>{refusal.kind === 'no-op' ? 'No changes to publish' : 'Publish refused'}</strong>
          <div style={{ marginTop: 4 }}>{refusal.message}</div>
          <div style={{ marginTop: 8 }}>
            {refusal.kind === 'no-op' ? (
              <Link to={buildAgentDetailPath(assistantId)} style={{ fontSize: 12 }}>
                View the live version →
              </Link>
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
          </div>
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
        <Link to={fix.fixRoute} style={{ fontSize: 12 }}>
          {fix.fixLabel} →
        </Link>
      ) : (
        <Link to={buildAgentDetailPath(agentId)} style={{ fontSize: 12 }}>
          {fix.fixLabel} →
        </Link>
      )}
    </>
  );
}
