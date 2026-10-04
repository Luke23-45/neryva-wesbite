import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { pageItem } from '@styles/motion';
import {
  useAssistant,
  useAssistantVersions,
  usePublishReadiness,
  useRollbackAssistant,
} from '@hooks/studio/useAgentAuthoring';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  PUBLISH_COPY,
  classifyPublishRefusal,
  type PublishRefusalKind,
} from '../../builder/lib/publish-model';
import { EmptyNote } from '../AgentDetailView.styles';
import { SectionBackRow } from '../SectionBackRow';
import { Dropdown } from '@components/common/ui/Dropdown';

const FieldLabel = styled.label`
  font-size: 13px;
  display: block;
`;


const CopyLine = styled.div`
  font-size: 12px;
  opacity: 0.8;
  line-height: 1.6;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

/** Full route id once the coordinator wires it (child of agentStudioAgentsRoute, path '/$agentId/versions/rollback'). */
export const ROLLBACK_ROUTE_ID = '/agent-studio/agents/$agentId/versions/rollback' as const;

/**
 * sessionStorage marker key — the post-rollback success state must survive
 * navigation/refresh. Written on success, read on mount, cleared on Done.
 */
export const ROLLBACK_REVEALED_KEY = (agentId: string) => `agents:rollback:revealed:${agentId}`;

/**
 * Roll back to a prior version — dedicated section replacing the rollback
 * Modal (A-14) from the agent detail Versions panel.
 *
 * Copy, validation, and danger semantics are verbatim from the modal:
 * version select (vN + timestamp + hash), rollback-creates-new-version
 * copy, degraded-knowledge ack checkbox, refusal alert, and the
 * "Live is now vN" + audit link success state. Close / "Roll back to vN"
 * (danger, disabled until a target is selected).
 *
 * The governance gate is preserved exactly: non-govern roles bounce to
 * the agents list and render null. The success receipt is refresh-safe —
 * a refresh re-displays an explicit already-revealed notice (never a
 * stale "Live is now" receipt) until Done clears the marker.
 */
export function RollbackSection() {
  const params = useParams({ from: ROLLBACK_ROUTE_ID });
  const agentId = params.agentId;
  const { role } = useOrg();
  const navigate = useNavigate();
  const canGovern = canSetup(role, 'setup:govern');
  // Don't fire the agent/version reads for users who are about to bounce (server gates too).
  const assistant = useAssistant(canGovern ? agentId : null);
  // Governance gate + unknown-agent bounce. Nothing renders before the gates.
  // (agentUnknown is computed before useAssistantVersions so the versions
  // read is suppressed once the agent read settles — one server-gated,
  // unrendered versions request can still fire on the first render while
  // the agent read is pending.)
  const agentUnknown = canGovern && !assistant.isPending && (assistant.isError || assistant.data === null);
  const versions = useAssistantVersions(canGovern && !agentUnknown ? agentId : null);
  const rollback = useRollbackAssistant(agentId);

  const [targetId, setTargetId] = useState<string | null>(null);
  const [acknowledge, setAcknowledge] = useState(false);
  const [refusal, setRefusal] = useState<{ kind: PublishRefusalKind; message: string } | null>(null);
  const [rolledBackTo, setRolledBackTo] = useState<number | null>(null);
  // Already-revealed notice (from the sessionStorage marker) — a refresh
  // after success lands here instead of replaying the fresh receipt.
  // Read the reveal marker once per mount via a lazy initializer (never an
  // effect) — a refresh after rollback must not re-display a stale success
  // receipt. Private mode etc.: the reveal notice is a convenience, never
  // load-bearing.
  const [revealedVersion, setRevealedVersion] = useState<number | null>(() => {
    try {
      const raw = window.sessionStorage.getItem(ROLLBACK_REVEALED_KEY(agentId));
      const version = raw !== null ? Number(raw) : NaN;
      return Number.isInteger(version) ? version : null;
    } catch {
      return null;
    }
  });
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Governance gate + unknown-agent bounce. Nothing renders before the gates.
  // (agentUnknown already accounts for canGovern above)
  useEffect(() => {
    if (!canGovern || agentUnknown) {
      navigate({ to: '/agent-studio/agents' });
    }
  }, [canGovern, agentUnknown, navigate]);

  // Rollback targets: every PUBLISHED version but the live one, newest
  // first — the old newest-only silent target is gone (PLAN §9).
  const activeVersionId = assistant.data?.activeVersionId ?? null;
  const candidates =
    versions.data
      ?.filter((v) => v.status === 'PUBLISHED' && v.id !== activeVersionId)
      .sort((a, b) => b.version - a.version) ?? [];
  const target = candidates.find((c) => c.id === targetId) ?? candidates[0] ?? null;
  const readiness = usePublishReadiness(agentId, target?.id ?? null, {
    acknowledged: acknowledge,
    enabled: canGovern && !agentUnknown,
  });

  if (!canGovern || agentUnknown) {
    return null;
  }

  const detailTo = { to: '/agent-studio/agents/$agentId' as const, params: { agentId } };
  // The styled back row erases TanStack's per-route param/search inference,
  // so the account id is interpolated into the path (P1 channels pattern).
  const detailPath = `/agent-studio/agents/${agentId}`;

  const pickTarget = (id: string) => {
    setTargetId(id);
    setAcknowledge(false);
    setRefusal(null);
    setRolledBackTo(null);
    // A new target supersedes the earlier reveal — the marker is only
    // re-read on mount, and is overwritten on the next success.
    setRevealedVersion(null);
  };

  const submit = () => {
    if (!target || rollback.isPending) {
      return;
    }
    rollback.mutate(
      { toVersionId: target.id, ...(acknowledge ? { acknowledgeDegradedKnowledge: true } : {}) },
      {
        onSuccess: (ref) => {
          setRefusal(null);
          setRolledBackTo(ref.version);
          try {
            window.sessionStorage.setItem(ROLLBACK_REVEALED_KEY(agentId), String(ref.version));
          } catch {
            // Private mode etc. — the reveal notice is a convenience, never load-bearing.
          }
        },
        onError: (error) => {
          setRolledBackTo(null);
          setRefusal({ kind: classifyPublishRefusal(error), message: error instanceof Error ? error.message : 'Rollback refused.' });
        },
      },
    );
  };

  const done = () => {
    try {
      window.sessionStorage.removeItem(ROLLBACK_REVEALED_KEY(agentId));
    } catch {
      // Private mode etc. — nothing to clear.
    }
    navigate(detailTo);
  };

  const freshSuccess = rolledBackTo !== null;

  return (
    <ViewShell>
      <SectionBackRow to={detailPath}>
        <span aria-hidden="true">‹</span> Agent detail
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Roll back to a prior version</ViewTitle>
          <ViewSubtitle>
            Restore a prior published version as a new version — history is never rewritten.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Rollback" subtitle="Pick the version to restore — the live pointer moves only on success.">
          {freshSuccess ? (
            <div role="status" style={{ fontSize: 13 }}>
              Live is now v{rolledBackTo}. {PUBLISH_COPY.auditPromise} <Link to="/platform/audit">Open Audit →</Link>
            </div>
          ) : revealedVersion !== null ? (
            <div role="status" style={{ fontSize: 13, lineHeight: 1.55 }}>
              <strong>Already revealed:</strong> live is now v{revealedVersion} — recorded earlier in this browser
              session. This notice survives refresh; the one-time success receipt was shown when the rollback landed.{' '}
              {PUBLISH_COPY.auditPromise} <Link to="/platform/audit">Open Audit →</Link>
            </div>
          ) : candidates.length === 0 ? (
            <EmptyNote>Nothing to roll back to — publish at least two versions first.</EmptyNote>
          ) : (
            <>
              <FieldLabel>
                Restore
                <div style={{ marginTop: 4 }}>
                  <Dropdown
                    variant="select"
                    aria-label="Restore"
                    value={target?.id ?? ''}
                    onChange={(v) => pickTarget(v)}
                    placeholder="Select a version…"
                    items={candidates.map((c) => ({
                      value: c.id,
                      label: `v${c.version}${c.publishedAt ? ` · ${c.publishedAt.slice(0, 16).replace('T', ' ')}` : ''}${c.hash ? ` · ${c.hash.slice(0, 12)}` : ''}`,
                    }))}
                  />
                </div>
              </FieldLabel>
              <CopyLine style={{ marginTop: 8 }}>
                {PUBLISH_COPY.rollbackCreatesNew} {PUBLISH_COPY.rollbackNoTouch}
              </CopyLine>
              {readiness.needsAcknowledge && (
                <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, marginTop: 10 }}>
                  <input type="checkbox" checked={acknowledge} onChange={(e) => setAcknowledge(e.target.checked)} style={{ marginTop: 3 }} />
                  <span>
                    {PUBLISH_COPY.degradedAck} Restoring pins that no longer resolve ships them anyway, explicitly.
                  </span>
                </label>
              )}
              {refusal && (
                <div role="alert" style={{ marginTop: 10, fontSize: 13, lineHeight: 1.55 }}>
                  <strong>Rollback refused</strong>
                  <div style={{ marginTop: 4 }}>{refusal.message}</div>
                  {refusal.kind === 'degraded' && (
                    <div style={{ marginTop: 4, fontSize: 12 }}>Arm the acknowledge box above, then roll back again.</div>
                  )}
                </div>
              )}
            </>
          )}
          <ActionsRow>
            <ActionButton variant="secondary" onClick={done}>
              Close
            </ActionButton>
            {!freshSuccess && revealedVersion === null && candidates.length > 0 && (
              <ActionButton variant="danger" disabled={!target || rollback.isPending} onClick={submit}>
                {rollback.isPending ? 'Rolling back…' : target ? `Roll back to v${target.version}` : 'Roll back'}
              </ActionButton>
            )}
          </ActionsRow>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
