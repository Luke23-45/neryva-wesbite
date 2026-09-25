import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import {
  usePublishReadiness,
  type AgentVersion,
} from '@hooks/studio/useAgentAuthoring';
import { useMemberNameMap, useRollout } from '@hooks/studio/useSetupOperate';
import { useEvalRuns } from '@hooks/studio/useSetupEval';
import { useChannels, isChannelsModuleDisabled } from '@hooks/studio/useSetupChannels';
import { useProviderCredentials } from '@hooks/studio/useSetupProviders';
import { useOrg } from '@/Context/OrgContext';
import { selectVersionEvalState } from '../../builder/lib/eval-model';
import { isPublishableStatus } from '../../builder/lib/publish-model';
import {
  buildLineage,
  degradedBannerState,
  describePausedRollout,
  pickOperateBanner,
} from '../../builder/lib/operate-model';
import { buildAgentBuildPath } from '../../builder/lib/slot-model';

/**
 * Operate header (C15) — live state first, history second. Active-version
 * card, draft card with builder re-entry, lineage strip, the single
 * most-severe banner, per-assistant channels, spend link-outs, compromise
 * line. Read-only: every lever lives in Operate below (Day-1 lock).
 */

const Banner = styled.div<{ $tone: 'warning' | 'error' | 'info' }>`
  border: 1px solid
    ${({ $tone, theme }) =>
      $tone === 'error' ? theme.app.status.error.border : $tone === 'warning' ? theme.app.status.warning.border : theme.app.status.info.border};
  background: ${({ $tone, theme }) =>
    $tone === 'error' ? theme.app.status.error.bg : $tone === 'warning' ? theme.app.status.warning.bg : theme.app.status.info.bg};
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 12px;
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.6;
`;

const CardLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.9px;
  color: ${({ theme }) => theme.app.text.muted};
  margin-bottom: 4px;
`;

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.6;
`;

const Lineage = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  margin-bottom: 12px;
  line-height: 1.7;
`;

const RowLink = styled.button`
  background: none;
  border: 0;
  padding: 0;
  font-size: 12px;
  cursor: pointer;
  color: ${({ theme }) => theme.app.text.primary};
  text-decoration: underline;
  text-underline-offset: 2px;
`;

function scrollToId(id: string) {
  // jsdom has no scrollIntoView — guard so tests exercise the copy.
  const el = document.getElementById(id);
  el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
}

const FIRST_BLOCKER_SLOT: Record<string, string> = {
  shape: 'purpose',
  models: 'brain',
  tools: 'tools',
  block: 'evaluation',
  required: 'evaluation',
  knowledge: 'knowledge',
};

const CHANNEL_TONE: Record<string, 'success' | 'info' | 'warning' | 'neutral'> = {
  active: 'success',
  pending: 'info',
  suspended: 'warning',
};

export function OperateHeader({
  agentId,
  versions,
  activeVersionId,
  degradedUntil,
  degradedReason,
  disabledAt,
  disabledReason,
}: {
  agentId: string;
  versions: AgentVersion[];
  activeVersionId: string | null;
  degradedUntil: string | null;
  degradedReason: string | null;
  disabledAt: string | null;
  disabledReason: string | null;
}) {
  const { role } = useOrg();
  const rollout = useRollout(agentId);
  const members = useMemberNameMap();
  const evalRuns = useEvalRuns(undefined, { enabled: !!agentId });
  const channels = useChannels();
  const canReadCredentials = role === 'owner' || role === 'admin' || role === 'developer';
  const credentials = useProviderCredentials({ enabled: canReadCredentials });

  const active = versions.find((v) => v.id === activeVersionId) ?? null;
  const draft =
    [...versions]
      .filter((v) => isPublishableStatus(v.status))
      .sort((a, b) => b.version - a.version)[0] ?? null;
  const readiness = usePublishReadiness(agentId, draft?.id ?? null, { enabled: draft !== null });

  const activeEval = active
    ? selectVersionEvalState(evalRuns.data ?? [], { id: active.id, status: active.status, updatedAt: active.updatedAt })
    : undefined;

  const degraded = degradedBannerState({ degradedUntil, disabledAt });
  const paused =
    rollout.data?.state === 'paused'
      ? describePausedRollout({
          pausedReason: rollout.data.pausedReason,
          pausedBy: rollout.data.pausedBy,
          pausedAt: rollout.data.pausedAt,
          actorName: (id) => (id ? members.nameOf(id) : null),
        })
      : null;
  const banner = pickOperateBanner({
    disabled: disabledAt ? { at: disabledAt, reason: disabledReason } : null,
    degraded,
    degradedReason,
    degradedUntil,
    paused,
    driftAlert: null,
    shadowOnly: activeEval?.latest?.shadow === true,
  });

  const lineage = buildLineage(
    versions.map((v) => ({
      id: v.id,
      version: v.version,
      status: v.status,
      parentVersionId: v.parentVersionId,
      rollbackOf: v.rollbackOf,
    })),
    activeVersionId,
  );

  const boundChannels = (channels.data ?? []).filter(
    (c) => typeof c.config.default_assistant_id === 'string' && c.config.default_assistant_id === agentId,
  );
  // P5-C3: a 404 on the channels read means the channels module is disabled
  // in this deployment — the truth is "unknown", not "none". Render an
  // honest disabled-plane note instead of "No channel serves this agent yet."
  // (J1-03 pattern, same as the dashboard setup checklist).
  const channelsDisabled = channels.isError && isChannelsModuleDisabled(channels.error);

  const activeDefinition = active?.definition ?? null;
  const pinnedProviders = activeDefinition ? [...new Set(activeDefinition.model_policy.allowed_models.map((ref) => ref.split('/')[0] ?? ref))] : [];
  const compromised = (credentials.data ?? []).filter((c) => pinnedProviders.includes(c.provider) && c.compromised);

  const blockers = readiness.rows.filter((row) => row.ok === false);
  const firstBlocker = blockers[0] ?? null;
  const resumeSlot = firstBlocker ? (FIRST_BLOCKER_SLOT[firstBlocker.id] ?? null) : null;
  const draftVerdict =
    readiness.verdict === 'go'
      ? 'ready to publish'
      : readiness.verdict === 'conditional-go'
        ? 'ships degraded once acknowledged'
        : readiness.verdict === 'no-go'
          ? `${blockers.length} blocker${blockers.length === 1 ? '' : 's'}`
          : 'checking gates…';

  return (
    <Panel title="Status" subtitle="What is live, what is draft, and where it came from. Levers live in Operate below.">
      {banner && (
        <Banner $tone={banner.tone} role={banner.tone === 'error' ? 'alert' : 'status'}>
          <strong>{banner.title}</strong>
          <div style={{ marginTop: 2 }}>{banner.detail}</div>
          <div style={{ marginTop: 6, fontSize: 12 }}>
            {banner.id === 'degraded' ? (
              <Link to="/agent-studio/knowledge">Map the pins →</Link>
            ) : banner.id === 'paused' || banner.id === 'disabled' ? (
              <RowLink type="button" onClick={() => scrollToId('operate-panel')}>
                Open Operate below →
              </RowLink>
            ) : banner.id === 'shadow' ? (
              <Link to="/agent-studio/evaluations">Open Evaluations →</Link>
            ) : null}{' '}
            <Link to="/platform/audit">Recorded in Audit ›</Link>
          </div>
        </Banner>
      )}

      <Cards>
        <Card>
          <CardLabel>LIVE</CardLabel>
          {active ? (
            <>
              <div style={{ fontWeight: 600 }}>
                v{active.version}
                {active.hash ? (
                  <>
                    {' '}· <Mono>{active.hash.slice(0, 12)}</Mono>
                  </>
                ) : null}
              </div>
              <div>
                <Muted>
                  {active.publishedAt ? active.publishedAt.slice(0, 16).replace('T', ' ') : 'published'}
                  {active.publishedBy ? ` · by ${members.nameOf(active.publishedBy) ?? active.publishedBy.slice(0, 8)}` : ''}
                </Muted>
              </div>
              <div>
                {activeEval?.latest && !activeEval.latest.shadow ? (
                  activeEval.latest.stale ? (
                    <span>Eval {activeEval.latest.decision} — stale, re-run before trusting it.</span>
                  ) : (
                    <span>Eval {activeEval.latest.decision} on this content.</span>
                  )
                ) : activeEval?.latest?.shadow ? (
                  <span>Shadow observations only — never gates.</span>
                ) : (
                  <Muted>No formal eval on this content yet.</Muted>
                )}
              </div>
            </>
          ) : (
            <Muted>Nothing published yet — publish a draft to go live.</Muted>
          )}
        </Card>
        <Card>
          <CardLabel>DRAFT</CardLabel>
          {draft ? (
            <>
              <div style={{ fontWeight: 600 }}>v{draft.version} · {draftVerdict}</div>
              <div style={{ marginTop: 4 }}>
                {resumeSlot ? (
                  <Link to={buildAgentBuildPath(agentId)} search={{ slot: resumeSlot }}>
                    Resume in builder at {resumeSlot} →
                  </Link>
                ) : (
                  <Link to={buildAgentBuildPath(agentId)}>Open in builder →</Link>
                )}
              </div>
            </>
          ) : (
            <>
              <Muted>No open draft.</Muted>
              <div style={{ marginTop: 4 }}>
                <Link to={buildAgentBuildPath(agentId)}>Open in builder →</Link>
              </div>
            </>
          )}
        </Card>
      </Cards>

      {lineage.length > 0 && (
        <Lineage aria-label="Version lineage">
          {lineage.map((node, i) => (
            <span key={node.id}>
              {i > 0 && <span aria-hidden="true"> ── </span>}
              <span>
                {node.isActive ? '●' : '○'} v{node.version}
                {node.isActive ? ' live' : node.isDraft ? ' draft' : ''}
                {node.parentLabel ? ` (${node.parentLabel})` : ''}
              </span>
            </span>
          ))}
        </Lineage>
      )}

      <Card style={{ marginBottom: 12 }}>
        <CardLabel>SERVING CHANNELS{channelsDisabled ? '' : ` · ${boundChannels.length} BOUND`}</CardLabel>
        {channelsDisabled ? (
          <Muted>Channel plane is not enabled in this deployment — serving state is unknown.</Muted>
        ) : boundChannels.length === 0 ? (
          <Muted>No channel serves this agent yet.</Muted>
        ) : (
          boundChannels.map((c) => (
            <div key={c.id}>
              <StatusPill tone={CHANNEL_TONE[c.status ?? ''] ?? 'neutral'} dot={false}>
                {c.status ?? 'unknown'}
              </StatusPill>{' '}
              {c.displayName} · {c.platform}
              {c.health && Object.keys(c.health).length > 0 ? ' — checked ✓' : ' — not verified yet'}
            </div>
          ))
        )}
        <div style={{ marginTop: 4 }}>
          <Link to="/agent-studio/channels" search={{ returnTo: undefined, assistantId: undefined }}>Open channels →</Link>
        </div>
      </Card>

      {compromised.length > 0 && (
        <Banner $tone="error" role="alert">
          <strong>Compromised credential on a pinned provider: {compromised.map((c) => c.provider).join(', ')}.</strong>
          <div style={{ marginTop: 2 }}>
            Rotate or revoke before trusting serves. <Link to="/agent-studio/models">Manage in Models →</Link>
          </div>
        </Banner>
      )}

      <div style={{ fontSize: 12 }}>
        <Muted>Spend is measured, never duplicated here — </Muted>
        <Link to="/agent-studio/usage">Usage →</Link>
        <Muted> · </Muted>
        <RowLink type="button" onClick={() => scrollToId('observe-panel')}>
          Rollups in Observe ↓
        </RowLink>
      </div>
    </Panel>
  );
}
