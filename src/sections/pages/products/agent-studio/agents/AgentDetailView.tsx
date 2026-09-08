import { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate, useParams, Link } from '@tanstack/react-router';
import { ArrowLeft, Copy as CopyIcon, MessageSquare, Pencil, GitCompare, Download, Upload, History, Rocket, Archive, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Tooltip } from '@components/common/ui/Tooltip';
import { Avatar } from '@components/common/ui/Avatar';
import { CopyButton } from '@components/common/ui/CopyButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { ActionButton } from '@components/common/ui/ActionButton';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { Modal } from '@components/common/ui/Modal';
import { TextArea } from '@components/common/ui/TextArea';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, SectionTitle, KpiGrid } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import {
  useAssistant,
  useAssistantVersions,
  useCloneAssistant,
  useDeleteAssistant,
  usePublishVersion,
  useRetireVersion,
  useRollbackAssistant,
  useExportVersion,
  useImportVersion,
  useVersionSnapshot,
  diffDefinitions,
  type AgentVersion,
} from '@hooks/studio/useAgentAuthoring';
import {
  BackLink,
  HeaderRow,
  HeaderMain,
  HeaderTitle,
  HeaderSub,
  ActionCluster,
  MetaGrid,
  MetaItem,
  MetaLabel,
  MetaValue,
  CodeBlock,
  PromptTitle,
  PromptBody,
  ChipRow,
  Chip,
  GuardList,
  GuardItem,
  GuardDot,
  EmptyNote,
  VersionList,
  VersionRow,
  VersionMain,
  VersionId,
  VersionMeta,
  VersionActions,
} from './AgentDetailView.styles';

/**
 * Agent detail (ledger A-4/A-5) — every action is real: clone copies the
 * definition into a new agent, Test deep-links the chat workspace with the
 * agent contract (`?agent=<id>`, honored when chat is wired), and the
 * versions panel runs the immutable lifecycle: publish (step-up), retire,
 * rollback, export/import, and a structured diff between any two versions.
 *
 * Pause/Resume and Delete were removed — the engine has no such endpoints
 * (decision D-10: version retirement is the removal path; true deletion
 * would be an engine addition). Telemetry cards were removed — per-agent
 * metrics are A-9 and were previously invented.
 */

const statusTone: Record<string, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  published: 'success',
  draft: 'neutral',
  paused: 'warning',
  retired: 'neutral',
};

const CurrentTag = styled.span`
  margin-left: 8px;
  padding: 2px 6px;
  border-radius: 5px;
  background: ${({ theme }) => theme.app.status.success.bg};
  border: 1px solid ${({ theme }) => theme.app.status.success.border};
  color: ${({ theme }) => theme.app.status.success.fg};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.micro};
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export function AgentDetailView() {
  const params = useParams({ from: '/agent-studio/agents/$agentId' });
  const navigate = useNavigate();
  const assistant = useAssistant(params.agentId);
  const clone = useCloneAssistant();
  const deleteAssistant = useDeleteAssistant();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <ViewShell>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <BackLink as={Link} to="/agent-studio/agents">
          <ArrowLeft size={13} strokeWidth={1.7} />
          Back to agents
        </BackLink>
      </motion.div>

      <QueryView
        query={assistant}
        skeleton={<Skeleton $h="300px" $r="12px" />}
        isEmpty={(d) => d === null}
        empty={{ title: 'Agent not found', description: "The agent you're looking for doesn't exist or was removed." }}
      >
        {(agent) => agent && (
          <>
            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
              <HeaderRow>
                <HeaderMain>
                  <Avatar
                    initials={agent.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                    hue="azure"
                    size={44}
                    status={agent.status === 'active' || agent.status === 'published' ? 'online' : 'offline'}
                  />
                  <div style={{ minWidth: 0 }}>
                    <HeaderTitle>{agent.name}</HeaderTitle>
                    <HeaderSub>{agent.description ?? 'No description yet.'}</HeaderSub>
                  </div>
                  {agent.status && (
                    <StatusPill tone={statusTone[agent.status] ?? 'neutral'}>
                      {agent.status}
                    </StatusPill>
                  )}
                </HeaderMain>
                <ActionCluster>
                  <Tooltip label="Test this agent in the chat workspace">
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate({ to: '/agent-studio/chat', search: { agent: agent.id } })}
                    >
                      <MessageSquare size={13} strokeWidth={1.7} />
                      Test
                    </ActionButton>
                  </Tooltip>
                  <Tooltip label="Edit the definition">
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate({ to: '/agent-studio/agents/$agentId/edit', params: { agentId: agent.id } })}
                    >
                      <Pencil size={13} strokeWidth={1.7} />
                      Edit
                    </ActionButton>
                  </Tooltip>
                  <Tooltip label="Duplicate this agent with its definition">
                    <ActionButton
                      variant="ghost"
                      size="sm"
                      disabled={clone.isPending}
                      onClick={() => clone.mutate(
                        { assistantId: agent.id },
                        {
                          onSuccess: (created) => {
                            const id = created.id ?? created.assistant_id;
                            toast.success(`Cloned "${agent.name}"`);
                            if (id) {
                              navigate({ to: '/agent-studio/agents/$agentId/edit', params: { agentId: id } });
                            }
                          },
                        },
                      )}
                    >
                      <CopyIcon size={13} strokeWidth={1.7} />
                      Clone
                    </ActionButton>
                  </Tooltip>
                  <Tooltip label='Delete this agent (rejected if conversations exist)'>
                    <ActionButton
                      variant='danger'
                      size='sm'
                      aria-label='Delete agent'
                      onClick={() => setDeleteConfirm(true)}
                    >
                      <Trash2 size={13} strokeWidth={1.7} />
                    </ActionButton>
                  </Tooltip>
                </ActionCluster>
              </HeaderRow>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
              <KpiGrid>
                <Panel title="Definition at a glance" subtitle="What the agent runs with today.">
                  <MetaGrid>
                    <MetaItem>
                      <MetaLabel>Model</MetaLabel>
                      <MetaValue>{agent.definition.model_policy.allowed_models.join(', ')}</MetaValue>
                    </MetaItem>
                    <MetaItem>
                      <MetaLabel>Fallback</MetaLabel>
                      <MetaValue>{agent.definition.model_policy.fallback_enabled ? 'enabled' : 'off'}</MetaValue>
                    </MetaItem>
                    <MetaItem>
                      <MetaLabel>Tools</MetaLabel>
                      <MetaValue>
                        {agent.definition.tools.length > 0
                          ? agent.definition.tools.map((t) => t.id).join(', ')
                          : 'none'}
                      </MetaValue>
                    </MetaItem>
                    <MetaItem>
                      <MetaLabel>Knowledge</MetaLabel>
                      <MetaValue>
                        {agent.definition.context_policy.knowledge_sources.length > 0
                          ? agent.definition.context_policy.knowledge_sources.join(', ')
                          : 'none'}
                      </MetaValue>
                    </MetaItem>
                    <MetaItem>
                      <MetaLabel>Memory scope</MetaLabel>
                      <MetaValue>{agent.definition.context_policy.memory_scope}</MetaValue>
                    </MetaItem>
                    <MetaItem>
                      <MetaLabel>Cost cap</MetaLabel>
                      <MetaValue>{(agent.definition.budget_policy.max_cost_cents / 100).toFixed(2)} USD / run</MetaValue>
                    </MetaItem>
                  </MetaGrid>
                </Panel>
              </KpiGrid>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
              <Panel
                title="System instructions"
                subtitle="The prompt this agent runs on."
                action={<CopyButton value={agent.definition.instructions} label="Copy prompt" />}
              >
                <CodeBlock>
                  <PromptTitle>System</PromptTitle>
                  <PromptBody>{agent.definition.instructions || 'No instructions yet — open the editor to write them.'}</PromptBody>
                </CodeBlock>
              </Panel>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>
              <Panel
                title="Versions"
                subtitle="Immutable drafts and published versions — publish to serve, rollback to recover."
                flush
                action={<VersionsPanelActions agentId={agent.id} />}
              >
                <VersionsPanel agentId={agent.id} currentVersionId={agent.currentVersionId} />
              </Panel>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={5}>
              <SectionTitle>Guardrails</SectionTitle>
              <GuardList>
                <GuardItem key="pii">
                  <GuardDot aria-hidden="true" />
                  PII redaction {agent.definition.guardrails.pii_redaction ? 'on' : 'off'}
                </GuardItem>
                {agent.definition.guardrails.input_policy && (
                  <GuardItem key="in">
                    <GuardDot aria-hidden="true" />
                    Input: {agent.definition.guardrails.input_policy}
                  </GuardItem>
                )}
                {agent.definition.guardrails.output_policy && (
                  <GuardItem key="out">
                    <GuardDot aria-hidden="true" />
                    Output: {agent.definition.guardrails.output_policy}
                  </GuardItem>
                )}
              </GuardList>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={6}>
              <SectionTitle>Brand voice</SectionTitle>
              {agent.definition.brand ? (
                <ChipRow>
                  <Chip $hue="lilac">{agent.definition.brand}</Chip>
                </ChipRow>
              ) : (
                <EmptyNote>No brand voice set.</EmptyNote>
              )}
            </motion.div>
          </>
        )}
      </QueryView>
      <ConfirmDialog
        open={deleteConfirm}
        title='Delete this agent?'
        message='This removes the agent and all its versions. Agents with conversations cannot be deleted — archive those first.'
        destructive
        confirmLabel='Delete'
        onConfirm={() => {
          deleteAssistant.mutate(params.agentId, {
            onSuccess: () => {
              toast.success('Agent deleted');
              navigate({ to: '/agent-studio/agents' });
            },
          });
          setDeleteConfirm(false);
        }}
        onCancel={() => setDeleteConfirm(false)}
      />
    </ViewShell>
  );
}

// ─── Versions panel (A-4) ────────────────────────────────────────────

function VersionsPanelActions({ agentId }: { agentId: string }) {
  const [importOpen, setImportOpen] = useState(false);
  const [rollbackConfirm, setRollbackConfirm] = useState(false);
  const [importPayload, setImportPayload] = useState('');
  const rollback = useRollbackAssistant(agentId);
  const importVersion = useImportVersion(agentId);

  return (
    <>
      <ActionCluster>
        <Tooltip label="Roll back to the previous published content">
          <ActionButton variant="secondary" size="sm" disabled={rollback.isPending} onClick={() => setRollbackConfirm(true)}>
            <History size={13} strokeWidth={1.7} />
            Rollback
          </ActionButton>
        </Tooltip>
        <Tooltip label="Import a definition from an export file">
          <ActionButton variant="secondary" size="sm" onClick={() => { setImportPayload(''); setImportOpen(true); }}>
            <Upload size={13} strokeWidth={1.7} />
            Import
          </ActionButton>
        </Tooltip>
      </ActionCluster>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import a definition"
        width={560}
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setImportOpen(false)}>Cancel</ActionButton>
            <ActionButton
              disabled={!importPayload.trim() || importVersion.isPending}
              onClick={() => {
                try {
                  const payload = JSON.parse(importPayload) as Record<string, unknown>;
                  importVersion.mutate(payload, {
                    onSuccess: () => {
                      toast.success('Definition imported as a draft version');
                      setImportOpen(false);
                    },
                  });
                } catch {
                  toast.error('That is not valid JSON');
                }
              }}
            >
              Import as draft
            </ActionButton>
          </>
        }
      >
        <TextArea
          label="Exported definition JSON"
          value={importPayload}
          onChange={(e) => setImportPayload(e.target.value)}
          rows={10}
          placeholder='{ "instructions": "…" }'
        />
      </Modal>

      <ConfirmDialog
        open={rollbackConfirm}
        title="Roll back this agent?"
        message="The engine re-publishes the prior version's content as a new version — history is never rewritten, so this is always recoverable."
        confirmLabel="Roll back"
        onConfirm={() => {
          rollback.mutate({}, { onSuccess: () => toast.success('Rolled back') });
          setRollbackConfirm(false);
        }}
        onCancel={() => setRollbackConfirm(false)}
      />
    </>
  );
}

function VersionsPanel({ agentId, currentVersionId }: { agentId: string; currentVersionId: string | null }) {
  const versions = useAssistantVersions(agentId);
  const publish = usePublishVersion(agentId);
  const retire = useRetireVersion(agentId);
  const exportVersion = useExportVersion(agentId);
  const [compareA, setCompareA] = useState<string | null>(null);
  const [compareB, setCompareB] = useState<string | null>(null);
  const [retireTarget, setRetireTarget] = useState<AgentVersion | null>(null);

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
            {rows.map((version) => {
              const isPublished = version.status === 'published' || version.id === currentVersionId;
              const isRetired = version.status === 'retired';
              return (
                <VersionRow key={version.id}>
                  <VersionMain>
                    <VersionId>
                      {version.id}
                      {version.id === currentVersionId && <CurrentTag>current</CurrentTag>}
                    </VersionId>
                    <VersionMeta>
                      {version.createdAt ? version.createdAt.slice(0, 16).replace('T', ' ') : ''}
                      {version.createdBy ? ` · ${version.createdBy}` : ''}
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
                    {version.status === 'draft' && (
                      <ActionButton
                        size="sm"
                        disabled={publish.isPending}
                        onClick={() => publish.mutate(version.id, { onSuccess: () => toast.success('Version published') })}
                      >
                        <Rocket size={12} strokeWidth={1.8} />
                        Publish
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
  const rows = ready ? diffDefinitions(from.data, to.data) : [];

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
