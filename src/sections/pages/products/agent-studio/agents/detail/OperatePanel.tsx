import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Pause, Play, ShieldAlert, Power, PowerOff } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import {
  useDisableAssistant,
  useEnableAssistant,
  useKnowledgeHealth,
  type AgentVersion,
} from '@hooks/studio/useAgentAuthoring';
import {
  useRollout,
  useSetRollout,
  usePauseRollout,
  useMoveRelease,
  useReleasePointer,
  useControlBlocks,
  useSetControlBlock,
  useClearControlBlock,
  useMemberNameMap,
  BLOCK_TARGETS,
} from '@hooks/studio/useSetupOperate';
import { describePausedRollout, OPERATE_COPY } from '@/sections/pages/products/agent-studio/builder/lib/operate-model';
import { checkRolloutVariants } from '@lib/engine/setup-caps';
import { useEvalRuns } from '@hooks/studio/useSetupEval';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';

/**
 * Operate panel (team_setup_ledger.md F-E5) — in the agent detail, where the
 * context is:
 *
 * - rollout weights editor (PUBLISHED-only picker; BLOCK-decided versions
 *   disabled WITH reasons; weights sum exactly 100; sticky-per-conversation
 *   explained) + pause (no body, instant, confirm);
 * - paused banner rendering paused_reason/by/at VERBATIM (manual actor vs
 *   burn-rate costs; NULL = operator-paused-legacy);
 * - release pointers (env×channel, defaults production/default) with move
 *   confirm + BLOCKed-promotion refusal verbatim;
 * - control blocks CRUD (5 target types, mandatory reason, expiry optional
 *   with no-worker honesty);
 * - kill switch (disable with reason / enable) + knowledge-health degraded
 *   banner.
 *
 * Day-1 emergency strip = exactly two toggles (pause rollout + disable).
 * Analytics sliders stay out (deferred per spec).
 */

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.6;
`;

const SectionGap = styled.div`
  margin-top: 18px;
`;

const Banner = styled.div<{ $tone: 'warning' | 'error' }>`
  border: 1px solid ${({ $tone, theme }) => ($tone === 'error' ? theme.app.status.error.border : theme.app.status.warning.border)};
  background: ${({ $tone, theme }) => ($tone === 'error' ? theme.app.status.error.bg : theme.app.status.warning.bg)};
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 12px;
`;

const VariantRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  margin-bottom: 8px;
`;

const EmergencyStrip = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
`;

export function OperatePanel({ agentId, versions, disabledAt, disabledReason }: { agentId: string; versions: AgentVersion[]; disabledAt: string | null; disabledReason: string | null }) {
  const { role } = useOrg();
  const canOperate = canSetup(role, 'setup:govern');
  const operateDenied = setupDeniedCopy(role, 'setup:govern');
  const rollout = useRollout(agentId);
  const setRollout = useSetRollout(agentId);
  const pauseRollout = usePauseRollout(agentId);
  const moveRelease = useMoveRelease(agentId);
  const pointer = useReleasePointer(agentId);
  const blocks = useControlBlocks({ enabled: canOperate });
  const clearBlock = useClearControlBlock();
  const disable = useDisableAssistant(agentId);
  const enable = useEnableAssistant(agentId);
  const health = useKnowledgeHealth(agentId);
  const runs = useEvalRuns(undefined, { enabled: canOperate });
  const members = useMemberNameMap({ enabled: canOperate });

  const [variants, setVariants] = useState<Array<{ version_id: string; weight: number }> | null>(null);
  const [pauseConfirm, setPauseConfirm] = useState(false);
  const [resumeConfirm, setResumeConfirm] = useState(false);
  const [releaseEnv, setReleaseEnv] = useState('production');
  const [releaseChannel, setReleaseChannel] = useState('default');
  const [releaseVersionId, setReleaseVersionId] = useState('');
  const [releaseConfirm, setReleaseConfirm] = useState(false);

  // Recently used release addresses (this browser, per assistant) — there
  // is no env/channel registry endpoint, so history chips beat free-text
  // amnesia without inventing vocabulary.
  const [recentAddrs, setRecentAddrs] = useState<Array<{ environment: string; channel: string }>>(() => {
    try {
      const raw: unknown = JSON.parse(window.localStorage.getItem(`neryva.release-addrs.${agentId}`) ?? '[]');
      return Array.isArray(raw)
        ? raw
            .filter((entry): entry is { environment: string; channel: string } => typeof entry === 'object' && entry !== null)
            .slice(0, 6)
        : [];
    } catch {
      return [];
    }
  });
  const rememberAddr = (environment: string, channel: string) => {
    setRecentAddrs((prev) => {
      const next = [{ environment, channel }, ...prev.filter((entry) => entry.environment !== environment || entry.channel !== channel)].slice(0, 6);
      try {
        window.localStorage.setItem(`neryva.release-addrs.${agentId}`, JSON.stringify(next));
      } catch {
        // Private mode etc. — history is a convenience, never load-bearing.
      }
      return next;
    });
  };
  const [blockOpen, setBlockOpen] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableReason, setDisableReason] = useState('');

  const published = versions.filter((v) => v.status === 'PUBLISHED');
  // Latest-wins per version: server order is newest-first (eval.service.ts
  // listRuns), so the first completed decision seen per version is the
  // latest — a re-evaluation that passes clears an earlier BLOCK.
  const blockedByEval = useMemo(() => {
    const latest = new Map<string, string | null>();
    for (const run of runs.data ?? []) {
      if (run.assistantVersionId && run.state === 'completed' && !latest.has(run.assistantVersionId)) {
        latest.set(run.assistantVersionId, run.decision);
      }
    }
    const result = new Set<string>();
    for (const [versionId, decision] of latest) {
      // A2-80: the engine also refuses FAIL promotions (rollouts.service.ts),
      // so the UI must treat a failed latest verdict as rollout-blocking.
      if (decision === 'BLOCK' || decision === 'FAIL') {
        result.add(versionId);
      }
    }
    return result;
  }, [runs.data]);

  const editing = variants ?? rollout.data?.variants.map((v) => ({ ...v })) ?? [];
  const variantIssues = checkRolloutVariants(editing);
  const weightsTotal = editing.reduce((sum, v) => sum + (Number.isInteger(v.weight) ? v.weight : 0), 0);

  // Single paused wording (operate-model — the header shares it, never two wordings).
  const pausedDescription =
    rollout.data?.state === 'paused'
      ? describePausedRollout({
          pausedReason: rollout.data.pausedReason,
          pausedBy: rollout.data.pausedBy,
          pausedAt: rollout.data.pausedAt,
          actorName: (id) => (id ? members.nameOf(id) : null),
        })
      : null;

  const pointerVersionNumber =
    pointer.data?.variants[0]?.version_id
      ? (published.find((v) => v.id === pointer.data?.variants[0]?.version_id)?.version ?? null)
      : null;

  return (
    <Panel
      title="Operate"
      subtitle="Traffic splits, release pointers, kill switches, and blocks — owner/admin only. Terminal commits deliberately unsupported: runs never strand."
    >
      {health.data?.degraded ? (
        <Banner $tone="warning">
          <strong>Knowledge degraded</strong> — {health.data.pins.filter((p) => !p.resolved || p.state !== 'ready').length} pin
          {health.data.pins.filter((p) => !p.resolved || p.state !== 'ready').length === 1 ? '' : 's'} unresolved or not READY:{' '}
          {health.data.pins
            .filter((p) => !p.resolved || p.state !== 'ready')
            .map((p) => <Mono key={p.sourceSlug}>{p.sourceSlug}{p.resolved ? ` (${p.state})` : ' (unresolved)'} </Mono>)}
          Map the documents in Knowledge before trusting answers.
        </Banner>
      ) : null}
      {disabledAt ? (
        <Banner $tone="error">
          <strong>Disabled{disabledReason ? ` — ${disabledReason}` : ''}.</strong> Run acceptance refuses; serving stopped. Re-enable below to resume.
        </Banner>
      ) : null}

      <EmergencyStrip>
        <ActionButton
          variant="secondary"
          size="sm"
          disabled={!canOperate || pauseRollout.isPending || rollout.data?.state === 'paused'}
          title={!canOperate ? operateDenied : rollout.data?.state === 'paused' ? 'Already paused' : 'Pause the rollout now'}
          onClick={() => setPauseConfirm(true)}
        >
          <Pause size={13} strokeWidth={1.8} />
          Pause rollout
        </ActionButton>
        {disabledAt ? (
          <ActionButton variant="secondary" size="sm" disabled={!canOperate || enable.isPending} title={canOperate ? 'Resume serving' : operateDenied} onClick={() => enable.mutate()}>
            <Power size={13} strokeWidth={1.8} />
            Re-enable agent
          </ActionButton>
        ) : (
          <ActionButton variant="danger" size="sm" disabled={!canOperate} title={canOperate ? 'Block run acceptance (audited)' : operateDenied} onClick={() => setDisableOpen(true)}>
            <PowerOff size={13} strokeWidth={1.8} />
            Disable agent
          </ActionButton>
        )}
      </EmergencyStrip>

      <QueryView
        query={rollout}
        isEmpty={() => false}
        empty={{ title: '', description: '' }}
      >
        {(current) => (
          <>
            {current?.state === 'paused' && pausedDescription && (
              <Banner $tone="warning">
                <strong>Rollout paused.</strong> {pausedDescription.headline}
                {pausedDescription.detail ? ` ${pausedDescription.detail}` : ''}
                {pausedDescription.kind === 'burn-rate'
                  ? ' Manual resume inside the burn-rate cooldown suppresses re-pause once — protection resumes after.'
                  : ''}
                {current.variants.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      disabled={!canOperate || setRollout.isPending}
                      title={canOperate ? 'Resume at the same weights — the pause clears server-side' : operateDenied}
                      onClick={() => setResumeConfirm(true)}
                    >
                      <Play size={13} strokeWidth={1.8} />
                      Resume at same weights
                    </ActionButton>
                  </div>
                )}
              </Banner>
            )}
            {published.length === 0 ? (
              <Muted>No PUBLISHED versions — rollouts split traffic across published versions only.</Muted>
            ) : (
              <>
                {editing.map((variant, i) => (
                  <VariantRow key={i}>
                    <label style={{ flex: 1, fontSize: 13 }}>
                      Version
                      <select
                        value={variant.version_id}
                        onChange={(e) => {
                          const next = [...editing];
                          next[i] = { ...next[i], version_id: e.target.value };
                          setVariants(next);
                        }}
                        style={{ display: 'block', width: '100%', marginTop: 4 }}
                      >
                        <option value="">Pick a published version…</option>
                        {published.map((v) => {
                          const blocked = blockedByEval.has(v.id);
                          return (
                            <option key={v.id} value={v.id} disabled={blocked}>
                              v{v.version}{blocked ? ' — BLOCKed by evaluation' : ''}{v.hash ? ` · ${v.hash.slice(0, 8)}` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                    <label style={{ width: 120, fontSize: 13 }}>
                      Weight
                      <input
                        type="number"
                        min={1}
                        value={Number.isInteger(variant.weight) ? variant.weight : ''}
                        onChange={(e) => {
                          const next = [...editing];
                          next[i] = { ...next[i], weight: Math.max(0, Math.round(Number(e.target.value) || 0)) };
                          setVariants(next);
                        }}
                        style={{ display: 'block', width: '100%', marginTop: 4 }}
                      />
                    </label>
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setVariants(editing.filter((_, j) => j !== i))}
                      aria-label={`Remove variant ${i + 1}`}
                    >
                      Remove
                    </ActionButton>
                  </VariantRow>
                ))}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <ActionButton
                    variant="secondary"
                    size="sm"
                    disabled={editing.length >= 10}
                    onClick={() => setVariants([...editing, { version_id: '', weight: weightsTotal >= 100 ? 0 : 100 - weightsTotal }])}
                  >
                    Add variant
                  </ActionButton>
                  <Muted>Total: {weightsTotal}/100 (must sum exactly 100 · sticky per conversation — the built-in A/B + canary).</Muted>
                </div>
                {variantIssues.length > 0 && (
                  <ul style={{ fontSize: 12, color: '#f87171', paddingLeft: 18 }}>
                    {variantIssues.map((issue, i) => (
                      <li key={i}>{issue.message}</li>
                    ))}
                  </ul>
                )}
                <div style={{ marginTop: 8 }}>
                  <ActionButton
                    size="sm"
                    disabled={!canOperate || variantIssues.length > 0 || setRollout.isPending}
                    title={canOperate ? 'Set the traffic split (1–10 variants, weights = 100)' : operateDenied}
                    onClick={() => setRollout.mutate(editing, { onSuccess: () => setVariants(null) })}
                  >
                    Set rollout
                  </ActionButton>
                </div>
              </>
            )}
          </>
        )}
      </QueryView>

      <SectionGap>
        <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Release pointer (env × channel)</h4>
        {recentAddrs.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {recentAddrs.map((addr) => (
              <ActionButton
                key={`${addr.environment}×${addr.channel}`}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setReleaseEnv(addr.environment);
                  setReleaseChannel(addr.channel);
                }}
              >
                {addr.environment} × {addr.channel}
              </ActionButton>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ fontSize: 13 }}>
            Environment
            <input value={releaseEnv} onChange={(e) => setReleaseEnv(e.target.value)} placeholder="production" style={{ display: 'block', marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 13 }}>
            Channel
            <input value={releaseChannel} onChange={(e) => setReleaseChannel(e.target.value)} placeholder="default" style={{ display: 'block', marginTop: 4 }} />
          </label>
          <label style={{ fontSize: 13, minWidth: 220 }}>
            Version
            <select value={releaseVersionId} onChange={(e) => setReleaseVersionId(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4 }}>
              <option value="">Pick a published version…</option>
              {published.map((v) => (
                <option key={v.id} value={v.id} disabled={blockedByEval.has(v.id)}>
                  v{v.version}{blockedByEval.has(v.id) ? ' — BLOCKed' : ''}
                </option>
              ))}
            </select>
          </label>
          <ActionButton
            size="sm"
            disabled={!canOperate || !releaseVersionId || moveRelease.isPending}
            title={canOperate ? 'Move the pointer (BLOCKed versions refuse)' : operateDenied}
            onClick={() => setReleaseConfirm(true)}
          >
            Move pointer
          </ActionButton>
        </div>
        <Muted>
          Now: {releaseEnv.trim() || 'production'} × {releaseChannel.trim() || 'default'} →{' '}
          {pointer.isPending
            ? 'reading…'
            : pointerVersionNumber !== null
              ? `v${pointerVersionNumber}`
              : 'no pointer recorded yet'}
          . {OPERATE_COPY.noAutoAdvance}
        </Muted>
      </SectionGap>

      <SectionGap>
        <h4 style={{ margin: '0 0 8px', fontSize: 13 }}>Control blocks (governance kill switches)</h4>
        {canOperate ? (
          <QueryView
            query={blocks}
            isEmpty={(d) => d.length === 0}
            empty={{ title: 'No blocks set', description: 'Blocks refuse acceptance, assignment, tool calls, context, credentials, and installs.' }}
          >
            {(rows) => (
              <>
                {rows.map((block) => (
                  <div key={block.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--neryva-border, #222)' }}>
                    <StatusPill tone={'error' as StatusTone} dot={false}>
                      {block.targetType}:{block.targetName}
                    </StatusPill>
                    <span style={{ flex: 1 }}>{block.reason}</span>
                    {block.createdBy && <Muted>by {members.nameOf(block.createdBy)}</Muted>}
                    {block.expiresAt && <Muted>expires {block.expiresAt.slice(0, 16).replace('T', ' ')}</Muted>}
                    <ActionButton variant="ghost" size="sm" disabled={clearBlock.isPending} onClick={() => clearBlock.mutate(block.id)}>
                      Clear
                    </ActionButton>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <ActionButton variant="secondary" size="sm" onClick={() => setBlockOpen(true)}>
                    <ShieldAlert size={13} strokeWidth={1.8} />
                    Set block
                  </ActionButton>
                </div>
              </>
            )}
          </QueryView>
        ) : (
          <Muted>{operateDenied}</Muted>
        )}
      </SectionGap>

      <ConfirmDialog
        open={pauseConfirm}
        title={OPERATE_COPY.pauseConfirmTitle}
        message={OPERATE_COPY.pauseConfirmMessage}
        confirmLabel="Pause now"
        onConfirm={() => {
          pauseRollout.mutate();
          setPauseConfirm(false);
        }}
        onCancel={() => setPauseConfirm(false)}
      />
      <ConfirmDialog
        open={resumeConfirm}
        title="Resume this rollout?"
        message={OPERATE_COPY.resumeLine}
        confirmLabel="Resume"
        onConfirm={() => {
          const current = rollout.data?.variants ?? [];
          if (current.length > 0) {
            setRollout.mutate(current.map((v) => ({ ...v })));
          }
          setResumeConfirm(false);
        }}
        onCancel={() => setResumeConfirm(false)}
      />
      <ConfirmDialog
        open={releaseConfirm}
        title="Move the release pointer?"
        message={`Point ${releaseEnv || 'production'} × ${releaseChannel || 'default'} at the selected version. BLOCKed versions refuse with a typed conflict.`}
        confirmLabel="Move pointer"
        onConfirm={() => {
          if (releaseVersionId) {
            const environment = releaseEnv.trim() || 'production';
            const channel = releaseChannel.trim() || 'default';
            moveRelease.mutate(
              {
                environment,
                channel,
                versions: [{ version_id: releaseVersionId, weight: 100 }],
              },
              { onSuccess: () => rememberAddr(environment, channel) },
            );
          }
          setReleaseConfirm(false);
        }}
        onCancel={() => setReleaseConfirm(false)}
      />
      <DisableModal
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        reason={disableReason}
        onReason={setDisableReason}
        pending={disable.isPending}
        onConfirm={() => {
          disable.mutate(disableReason.trim() || undefined, {
            onSuccess: () => {
              toast.success('Agent disabled — run acceptance refuses');
              setDisableOpen(false);
              setDisableReason('');
            },
          });
        }}
      />
      <BlockModal open={blockOpen} onClose={() => setBlockOpen(false)} agentId={agentId} />
      <Muted>
        {OPERATE_COPY.stickyConversation} Every operate write lands in <Link to="/platform/audit">Audit →</Link>
      </Muted>
    </Panel>
  );
}

function DisableModal({
  open,
  onClose,
  reason,
  onReason,
  pending,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  reason: string;
  onReason: (next: string) => void;
  pending: boolean;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Disable this agent?"
      width={520}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton variant="danger" disabled={pending} onClick={onConfirm}>
            Disable
          </ActionButton>
        </>
      }
    >
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        Run acceptance refuses while disabled — serving stops within one run cycle. Audited with your reason.
      </p>
      <div style={{ marginTop: 12 }}>
        <TextInput label="Reason (optional, audited)" value={reason} onChange={(e) => onReason(e.target.value)} placeholder="e.g. incident-4821 — bad grounding" autoFocus />
      </div>
    </Modal>
  );
}

function BlockModal({ open, onClose, agentId }: { open: boolean; onClose: () => void; agentId: string }) {
  const setBlock = useSetControlBlock();
  const [targetType, setTargetType] = useState<string>('assistant');
  const [targetName, setTargetName] = useState(agentId);
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  // Clock captured once per mount (render must stay pure — no Date.now() inline).
  const [nowMs] = useState(() => Date.now());
  const [minExpiry] = useState(() =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
  );

  const nameProblem = targetName.trim().length >= 1 && targetName.trim().length <= 128 ? null : 'Target names are 1–128 chars.';
  const reasonProblem = reason.trim().length >= 1 && reason.trim().length <= 512 ? null : 'Operator justification is mandatory (1–512 chars).';
  const expiryProblem =
    expiresAt.trim() === ''
      ? null
      : (() => {
          const parsed = Date.parse(expiresAt);
          if (!Number.isFinite(parsed)) return 'Expiry must be a real timestamp.';
          return parsed > nowMs ? null : 'Expiry must be in the future.';
        })();
  const valid = !nameProblem && !reasonProblem && !expiryProblem;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Set control block"
      width={560}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            disabled={!valid || setBlock.isPending}
            onClick={() => {
              setBlock.mutate(
                {
                  targetType,
                  targetName: targetName.trim(),
                  reason: reason.trim(),
                  ...(expiresAt.trim() ? { expiresAt: new Date(expiresAt).toISOString() } : {}),
                },
                { onSuccess: () => onClose() },
              );
            }}
          >
            <ShieldAlert size={13} strokeWidth={1.8} />
            Set block
          </ActionButton>
        </>
      }
    >
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        Governance kill switch — refuses acceptance, assignment, tool calls, context, credentials, and installs. Expiry needs no
        worker; terminal runs never strand.
      </p>
      <label style={{ fontSize: 13, display: 'block', marginTop: 12 }}>
        Target type
        <select value={targetType} onChange={(e) => setTargetType(e.target.value)} style={{ display: 'block', width: '100%', marginTop: 4 }}>
          {BLOCK_TARGETS.map((target) => (
            <option key={target} value={target}>{target}</option>
          ))}
        </select>
      </label>
      <div style={{ marginTop: 12 }}>
        <TextInput label="Target name (id or slug)" value={targetName} onChange={(e) => setTargetName(e.target.value)} error={nameProblem ?? undefined} />
      </div>
      <div style={{ marginTop: 12 }}>
        <TextInput label="Reason (mandatory, audited)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why this block exists" error={reason.trim() ? (reasonProblem ?? undefined) : undefined} />
      </div>
      <label style={{ fontSize: 13, display: 'block', marginTop: 12 }}>
        Expires at (optional — lifts automatically, no worker; empty = permanent)
        <input
          type="datetime-local"
          value={expiresAt}
          min={minExpiry}
          onChange={(e) => setExpiresAt(e.target.value)}
          style={{ display: 'block', width: '100%', marginTop: 4 }}
        />
      </label>
      {expiryProblem && <p style={{ fontSize: 12, color: '#f87171' }}>{expiryProblem}</p>}
    </Modal>
  );
}
