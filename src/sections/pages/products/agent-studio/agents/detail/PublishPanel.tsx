import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { Rocket } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import {
  usePublishReadiness,
  usePublishVersion,
  type AgentVersion,
} from '@hooks/studio/useAgentAuthoring';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  PUBLISH_COPY,
  classifyPublishRefusal,
  isPublishableStatus,
  refusalFix,
  type PublishRefusalKind,
} from '@/sections/pages/products/agent-studio/builder/lib/publish-model';
import { buildAgentBuildPath, buildAgentDetailPath } from '@/sections/pages/products/agent-studio/builder/lib/slot-model';
import { PublishSuccess, type PublishReceipt } from '@/sections/pages/products/agent-studio/builder/inspector/PublishSuccess';
import { ReadinessRows } from '@/sections/pages/products/agent-studio/builder/inspector/ReadinessRows';

/**
 * Publish gate panel (team_setup_ledger.md F-E3) — the money screen. C14
 * rewrite: every row comes from the shared `usePublishReadiness`
 * derivation (the same source the builder Ship section reads — never a
 * fork). Refusals render typed branches with verbatim messages; the button
 * is never dead for readiness reasons (aria-disabled + scroll-to-first).
 */

const Muted = styled.span`
  opacity: 0.6;
`;

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Notice = styled.div`
  font-size: 12px;
  margin-top: 8px;
  color: ${({ theme }) => theme.app.status.warning.fg};
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

export function PublishPanel({
  agentId,
  versions,
  focusRequest,
}: {
  agentId: string;
  versions: AgentVersion[];
  /** Version-row "Review & publish" jumps land here (select + scroll + focus). */
  focusRequest?: { versionId: string; nonce: number } | null;
}) {
  const { role } = useOrg();
  const canPublish = canSetup(role, 'setup:govern');
  const publishDenied = setupDeniedCopy(role, 'setup:govern');
  const publish = usePublishVersion(agentId);

  const [versionId, setVersionId] = useState('');
  const [acknowledge, setAcknowledge] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [refusal, setRefusal] = useState<{ kind: PublishRefusalKind; message: string } | null>(null);
  const [success, setSuccess] = useState<PublishReceipt | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const drafts = versions.filter((v) => isPublishableStatus(v.status));
  const effectiveId = versionId || drafts[0]?.id || '';
  const readiness = usePublishReadiness(agentId, effectiveId || null, { acknowledged: acknowledge });

  // Per-draft ceremony state resets with the draft or the row-jump nonce
  // (render-time adjustment — an effect here would cascade renders; the
  // scroll/focus landing stays in the effect below, which sets no state).
  const focusNonce = focusRequest?.nonce ?? 0;
  const [prevKey, setPrevKey] = useState<string | null>(null);
  if (prevKey !== `${effectiveId}:${focusNonce}`) {
    setPrevKey(`${effectiveId}:${focusNonce}`);
    if (focusRequest && effectiveId !== focusRequest.versionId) {
      setVersionId(focusRequest.versionId);
    }
    setAcknowledge(false);
    setRefusal(null);
    setSuccess(null);
    setNotice(null);
  }

  // Version-row jumps: land on the gate with focus (DOM sync only).
  useEffect(() => {
    if (!focusRequest) {
      return;
    }
    const el = document.getElementById('publish-gate-panel');
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    (el as HTMLElement | null)?.focus?.();
  }, [focusRequest]);

  if (drafts.length === 0) {
    return (
      <Panel
        title="Publish"
        subtitle="Atomic pointer swing with every gate evaluated first — BLOCK, required checks, tool pins, models, knowledge. Nothing auto-publishes."
      >
        <Muted>No publishable draft — save one in the editor first. Only DRAFT/VALID versions publish.</Muted>
      </Panel>
    );
  }

  const blockers = readiness.rows.filter((row) => row.ok === false && !(row.ackable && acknowledge));

  function handlePublishClick() {
    if (!readiness.publishable) {
      const first = blockers[0] ?? null;
      if (first) {
        setNotice(`${first.title} — open the row to fix it.`);
        const el = document.getElementById(`publish-row-${first.id}`);
        el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        (el as HTMLElement | null)?.focus?.();
      }
      return;
    }
    setNotice(null);
    setConfirmOpen(true);
  }

  function handleConfirm() {
    setConfirmOpen(false);
    publish.mutate(
      { versionId: effectiveId, ...(acknowledge ? { acknowledgeDegradedKnowledge: true } : {}) },
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
          setRefusal({ kind: classifyPublishRefusal(error), message: error instanceof Error ? error.message : 'Publish refused.' });
          setNotice('Publish refused — the exact issue is below with its fix.');
        },
      },
    );
  }

  const version = readiness.version;
  const ackedDegraded = acknowledge && readiness.needsAcknowledge;

  return (
    <div id="publish-gate-panel" tabIndex={-1}>
      <Panel
        title="Publish"
        subtitle={
          version
            ? `Draft v${version.version}${version.hash ? ` · ${version.hash.slice(0, 12)}` : ''} — required gates only`
            : 'Atomic pointer swing with every gate evaluated first — BLOCK, required checks, tool pins, models, knowledge. Nothing auto-publishes.'
        }
      >
        <label style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
          Draft
          <select value={effectiveId} onChange={(e) => { setVersionId(e.target.value); setAcknowledge(false); }} style={{ display: 'block', width: '100%', marginTop: 4 }}>
            {drafts.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.version} · {v.status}{v.hash ? ` · ${v.hash.slice(0, 12)}` : ''}
              </option>
            ))}
          </select>
        </label>

        {readiness.isError && (
          <Notice>
            Readiness reads failed — the server still decides on click. Refusals render verbatim below.
          </Notice>
        )}

        <ReadinessRows
          rows={readiness.rows}
          acknowledged={acknowledge}
          buildHref={buildAgentBuildPath(agentId)}
          idPrefix="publish"
        />

        {readiness.noChangeHint && (
          <Notice>No changes vs the live version — {PUBLISH_COPY.noChangeHint}</Notice>
        )}
        {readiness.evalRunning && <Notice>An evaluation is running — the gates re-read when it lands.</Notice>}

        {readiness.needsAcknowledge && (
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, marginTop: 10 }}>
            <input type="checkbox" checked={acknowledge} onChange={(e) => setAcknowledge(e.target.checked)} style={{ marginTop: 3 }} />
            <span>
              {PUBLISH_COPY.degradedAck} <Mono>assistant.publish_degraded_acknowledged</Mono>. {PUBLISH_COPY.degradedLifecycle}
            </span>
          </label>
        )}

        {!canPublish ? (
          <Notice>{publishDenied} {PUBLISH_COPY.requestPublish}</Notice>
        ) : (
          <div style={{ marginTop: 12 }}>
            <ActionButton
              size="sm"
              disabled={!canPublish || publish.isPending}
              aria-disabled={!readiness.publishable}
              aria-describedby={notice ? 'publish-panel-note' : undefined}
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
              <Notice id="publish-panel-note" role="status">
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
                <Link to={buildAgentDetailPath(agentId)} style={{ fontSize: 12 }}>
                  View the live version →
                </Link>
              ) : refusal.kind === 'degraded' ? (
                <span style={{ fontSize: 12 }}>Arm the acknowledge box above, then publish again.</span>
              ) : (
                <RefusalFixLink kind={refusal.kind} agentId={agentId} />
              )}
            </div>
          </Refusal>
        )}

        {success && <PublishSuccess receipt={success} agentId={agentId} returnTo={buildAgentDetailPath(agentId)} />}

        <ConfirmDialog
          open={confirmOpen}
          title={PUBLISH_COPY.confirmTitle}
          message={`${PUBLISH_COPY.confirmMessage}${ackedDegraded ? PUBLISH_COPY.confirmMessageDegraded : ''}`}
          confirmLabel="Publish"
          onConfirm={handleConfirm}
          onCancel={() => setConfirmOpen(false)}
        />
      </Panel>
    </div>
  );
}

function RefusalFixLink({ kind, agentId }: { kind: PublishRefusalKind; agentId: string }) {
  const fix = refusalFix(kind);
  if (fix.fixRoute) {
    return (
      <Link to={fix.fixRoute} style={{ fontSize: 12 }}>
        {fix.fixLabel} →
      </Link>
    );
  }
  return (
    <Link to={buildAgentBuildPath(agentId)} style={{ fontSize: 12 }}>
      {fix.fixLabel} →
    </Link>
  );
}
