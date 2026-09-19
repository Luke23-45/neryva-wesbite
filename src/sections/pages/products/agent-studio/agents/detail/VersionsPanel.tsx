import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { Archive, Download, GitCompare, History, Rocket, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Modal } from '@components/common/ui/Modal';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Tooltip } from '@components/common/ui/Tooltip';
import { QueryView } from '@components/common/ui/AsyncStates';
import {
  useAssistantVersions,
  useExportVersion,
  usePublishReadiness,
  useRetireVersion,
  useRollbackAssistant,
  useVersionSnapshot,
  diffDefinitions,
  type AgentVersion,
} from '@hooks/studio/useAgentAuthoring';
import { useMemberNameMap } from '@hooks/studio/useSetupOperate';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  PUBLISH_COPY,
  classifyPublishRefusal,
  isPublishableStatus,
  type PublishRefusalKind,
} from '../../builder/lib/publish-model';
import { ImportPane } from '../ImportPane';
import {
  ActionCluster,
  EmptyNote,
  VersionActions,
  VersionId,
  VersionList,
  VersionMain,
  VersionMeta,
  VersionRow,
  CurrentTag,
} from '../AgentDetailView.styles';

// Engine version statuses are SCREAMING (DRAFT/PUBLISHED/RETIRED/…) —
// moved with the panel (was local to AgentDetailView).
const statusTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  PUBLISHED: 'success',
  DRAFT: 'neutral',
  VALID: 'neutral',
  VALIDATING: 'neutral',
  RETIRED: 'neutral',
  ROLLED_BACK: 'neutral',
  live: 'success',
  draft: 'neutral',
  new: 'neutral',
  disabled: 'warning',
};

// ─── Versions panel (moved verbatim from AgentDetailView in C12) ───

export function VersionsPanelActions({ agentId, activeVersionId, onImported }: { agentId: string; activeVersionId: string | null; onImported: (versionId: string | null) => void }) {
  const { role } = useOrg();
  const canGovern = canSetup(role, 'setup:govern');
  const governDenied = setupDeniedCopy(role, 'setup:govern');
  const [importOpen, setImportOpen] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [acknowledge, setAcknowledge] = useState(false);
  const [refusal, setRefusal] = useState<{ kind: PublishRefusalKind; message: string } | null>(null);
  const [rolledBackTo, setRolledBackTo] = useState<number | null>(null);
  const versions = useAssistantVersions(agentId);
  const rollback = useRollbackAssistant(agentId);

  // Rollback targets: every PUBLISHED version but the live one, newest
  // first — the old newest-only silent target is gone (PLAN §9).
  const candidates =
    versions.data
      ?.filter((v) => v.status === 'PUBLISHED' && v.id !== activeVersionId)
      .sort((a, b) => b.version - a.version) ?? [];
  const target = candidates.find((c) => c.id === targetId) ?? candidates[0] ?? null;
  const readiness = usePublishReadiness(agentId, rollbackOpen ? (target?.id ?? null) : null, {
    acknowledged: acknowledge,
    enabled: rollbackOpen,
  });

  function openRollback() {
    setTargetId(null);
    setAcknowledge(false);
    setRefusal(null);
    setRolledBackTo(null);
    setRollbackOpen(true);
  }

  return (
    <>
      <ActionCluster>
        <Tooltip
          label={
            !canGovern
              ? governDenied
              : candidates.length > 0
                ? 'Pick a prior published version to restore as a new version'
                : 'Nothing to roll back to — publish at least two versions first'
          }
        >
          <ActionButton
            variant="secondary"
            size="sm"
            disabled={!canGovern || rollback.isPending || candidates.length === 0}
            title={!canGovern ? governDenied : undefined}
            onClick={openRollback}
          >
            <History size={13} strokeWidth={1.7} />
            Rollback
          </ActionButton>
        </Tooltip>
        <Tooltip label="Import a definition from an export file">
          <ActionButton variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            <Upload size={13} strokeWidth={1.7} />
            Import
          </ActionButton>
        </Tooltip>
      </ActionCluster>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import a definition"
        width={640}
        footer={
          <ActionButton variant="secondary" onClick={() => setImportOpen(false)}>Close</ActionButton>
        }
      >
        <ImportPane
          assistantId={agentId}
          onImported={({ versionId }) => {
            setImportOpen(false);
            onImported(versionId);
          }}
        />
      </Modal>

      <Modal
        open={rollbackOpen}
        onClose={() => setRollbackOpen(false)}
        title="Roll back to a prior version"
        width={560}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setRollbackOpen(false)}>Close</ActionButton>
            <ActionButton
              variant="danger"
              disabled={!target || rollback.isPending}
              onClick={() => {
                if (!target) return;
                rollback.mutate(
                  { toVersionId: target.id, ...(acknowledge ? { acknowledgeDegradedKnowledge: true } : {}) },
                  {
                    onSuccess: (ref) => {
                      setRefusal(null);
                      setRolledBackTo(ref.version);
                    },
                    onError: (error) => {
                      setRolledBackTo(null);
                      setRefusal({ kind: classifyPublishRefusal(error), message: error instanceof Error ? error.message : 'Rollback refused.' });
                    },
                  },
                );
              }}
            >
              {rollback.isPending ? 'Rolling back…' : target ? `Roll back to v${target.version}` : 'Roll back'}
            </ActionButton>
          </>
        }
      >
        {candidates.length === 0 ? (
          <EmptyNote>Nothing to roll back to — publish at least two versions first.</EmptyNote>
        ) : (
          <>
            <label style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              Restore
              <select
                value={target?.id ?? ''}
                onChange={(e) => { setTargetId(e.target.value); setAcknowledge(false); setRefusal(null); setRolledBackTo(null); }}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    v{c.version}{c.publishedAt ? ` · ${c.publishedAt.slice(0, 16).replace('T', ' ')}` : ''}{c.hash ? ` · ${c.hash.slice(0, 12)}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ fontSize: 12, color: 'inherit', opacity: 0.8, lineHeight: 1.6 }}>
              {PUBLISH_COPY.rollbackCreatesNew} {PUBLISH_COPY.rollbackNoTouch}
            </div>
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
            {rolledBackTo !== null && (
              <div role="status" style={{ marginTop: 10, fontSize: 13 }}>
                Live is now v{rolledBackTo}. {PUBLISH_COPY.auditPromise} <Link to="/platform/audit">Open Audit →</Link>
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}

export function VersionsPanel({ agentId, activeVersionId, highlightVersionId, onDismissHighlight, onReviewPublish }: { agentId: string; activeVersionId: string | null; highlightVersionId: string | null; onDismissHighlight: () => void; onReviewPublish: (versionId: string) => void }) {
  const versions = useAssistantVersions(agentId);
  const members = useMemberNameMap();
  const retire = useRetireVersion(agentId);
  const exportVersion = useExportVersion(agentId);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [retireTarget, setRetireTarget] = useState<AgentVersion | null>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightVersionId) {
      // jsdom has no scrollIntoView — guard so tests exercise the banner.
      highlightRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightVersionId]);

  const pick = (id: string) => {
    if (compareA === id) {
      setCompareA(null);
    } else if (compareB === id) {
      setCompareB(null);
    } else if (compareA === null) {
      setCompareA(id);
    } else {
      setCompareB(id);
    }
  };

  const diffOpen = compareA !== null && compareB !== null;

  return (
    <>
      <QueryView
        query={versions}
        skeleton={<Skeleton $h="180px" $r="12px" />}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'No versions yet', description: 'Save a draft in the editor — every save becomes an immutable version here.' }}
      >
        {(rows) => (
          <VersionList>
            {highlightVersionId && (
              <div style={{ padding: '12px 22px 0', fontSize: 12 }}>
                <span style={{ fontWeight: 600 }}>Imported as draft — review then publish.</span>{' '}
                <button type="button" onClick={onDismissHighlight} style={{ fontSize: 12 }}>
                  Dismiss
                </button>
              </div>
            )}
            {rows.map((version) => {
              const isActive = version.id === activeVersionId;
              const isPublished = version.status === 'PUBLISHED' || isActive;
              const isRetired = version.status === 'RETIRED';
              const publishable = isPublishableStatus(version.status);
              const highlighted = version.id === highlightVersionId;
              return (
                <VersionRow key={version.id} $highlight={highlighted} ref={highlighted ? highlightRef : undefined}>
                  <VersionMain>
                    <VersionId>
                      v{version.version} · {version.id.slice(0, 8)}
                      {isActive && <CurrentTag>active</CurrentTag>}
                    </VersionId>
                    <VersionMeta>
                      {version.createdAt ? version.createdAt.slice(0, 16).replace('T', ' ') : ''}
                      {version.publishedBy ? ` · ${members.nameOf(version.publishedBy)}` : ''}
                      {version.hash ? ` · ${version.hash.slice(0, 12)}` : ''}
                    </VersionMeta>
                  </VersionMain>
                  <VersionActions onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    {version.status && (
                      <StatusPill tone={statusTone[version.status] ?? 'neutral'} dot={false}>
                        {version.status}
                      </StatusPill>
                    )}
                    <CompareToggle
                      type="button"
                      $on={compareA === version.id || compareB === version.id}
                      aria-pressed={compareA === version.id || compareB === version.id}
                      aria-label={`Select version ${version.id} for comparison`}
                      onClick={() => pick(version.id)}
                    >
                      <GitCompare size={12} strokeWidth={1.8} />
                      Compare
                    </CompareToggle>
                    {isPublished && !isRetired && (
                      <IconActionBtn
                        type="button"
                        aria-label={`Export version ${version.id}`}
                        title="Export as JSON"
                        disabled={exportVersion.isPending}
                        onClick={() => exportVersion.mutate(version.id)}
                      >
                        <Download size={13} strokeWidth={1.7} />
                      </IconActionBtn>
                    )}
                    {publishable && (
                      <ActionButton
                        size="sm"
                        title="Select this draft in the publish gate below — versions never publish around the gates"
                        onClick={() => onReviewPublish(version.id)}
                      >
                        <Rocket size={12} strokeWidth={1.8} />
                        Review &amp; publish
                      </ActionButton>
                    )}
                    {isPublished && !isRetired && (
                      <IconActionBtn
                        type="button"
                        aria-label={`Retire version ${version.id}`}
                        title="Retire"
                        disabled={retire.isPending}
                        onClick={() => setRetireTarget(version)}
                      >
                        <Archive size={13} strokeWidth={1.7} />
                      </IconActionBtn>
                    )}
                  </VersionActions>
                </VersionRow>
              );
            })}
          </VersionList>
        )}
      </QueryView>

      {diffOpen && (
        <DiffModal
          agentId={agentId}
          fromId={compareA as string}
          toId={compareB as string}
          onClose={() => { setCompareA(null); setCompareB(null); }}
        />
      )}

      <ConfirmDialog
        open={!!retireTarget}
        title="Retire this version?"
        message={retireTarget ? `Version ${retireTarget.id} stops being publishable. History is kept for audit.` : ''}
        destructive
        confirmLabel="Retire"
        onConfirm={() => {
          if (retireTarget) {
            retire.mutate(retireTarget.id, { onSuccess: () => toast.success('Version retired') });
          }
          setRetireTarget(null);
        }}
        onCancel={() => setRetireTarget(null)}
      />
    </>
  );
}

function DiffModal({ agentId, fromId, toId, onClose }: { agentId: string; fromId: string; toId: string; onClose: () => void }) {
  const from = useVersionSnapshot(agentId, fromId);
  const to = useVersionSnapshot(agentId, toId);
  const ready = from.data !== undefined && to.data !== undefined;
  const rows = ready ? diffDefinitions(from.data.definition, to.data.definition) : [];

  return (
    <Modal
      open
      onClose={onClose}
      title={`Diff — ${fromId} → ${toId}`}
      width={640}
      footer={<ActionButton variant="secondary" onClick={onClose}>Close</ActionButton>}
    >
      {!ready ? (
        <Skeleton $h="220px" $r="12px" />
      ) : rows.length === 0 ? (
        <EmptyNote>These two versions are identical.</EmptyNote>
      ) : (
        <DiffList>
          {rows.map((row) => (
            <DiffRow key={row.path} $kind={row.kind}>
              <DiffPath>{row.path}</DiffPath>
              <DiffValues>
                {row.kind !== 'added' && <DiffFrom>{row.from || '—'}</DiffFrom>}
                {row.kind !== 'removed' && <DiffTo>{row.to || '—'}</DiffTo>}
              </DiffValues>
            </DiffRow>
          ))}
        </DiffList>
      )}
    </Modal>
  );
}

// ─── local styled additions (versions panel) ─────────────────────────
const CompareToggle = styled.button<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 7px;
  border: 1px solid ${({ $on, theme }) => ($on ? theme.app.status.lilac.border : theme.app.border.strong)};
  background: ${({ $on, theme }) => ($on ? theme.app.status.lilac.bg : 'transparent')};
  color: ${({ $on, theme }) => ($on ? theme.app.text.primary : theme.app.text.secondary)};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  cursor: pointer;
  white-space: nowrap;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const IconActionBtn = styled.button`
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 7px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const DiffList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 380px;
  overflow-y: auto;
  gap: 6px;
`;

const DiffRow = styled.div<{ $kind: 'added' | 'removed' | 'changed' }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 8px;
  border-left: 3px solid
    ${({ $kind }) => ($kind === 'added' ? '#05e3a4' : $kind === 'removed' ? '#f87171' : '#f5b942')};
  background: ${({ $kind }) =>
    $kind === 'added'
      ? 'rgba(5, 227, 164, 0.05)'
      : $kind === 'removed'
        ? 'rgba(248, 113, 113, 0.05)'
        : 'rgba(245, 185, 66, 0.05)'};
`;

const DiffPath = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.secondary};
`;

const DiffValues = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: ${({ theme }) => theme.app.type.micro};
  word-break: break-all;
`;

const DiffFrom = styled.span`
  color: ${({ theme }) => theme.app.status.error.fg};
  text-decoration: line-through;
`;

const DiffTo = styled.span`
  color: ${({ theme }) => theme.app.status.success.fg};
`;