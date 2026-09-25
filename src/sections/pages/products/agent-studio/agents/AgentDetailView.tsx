import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, Link } from '@tanstack/react-router';
import { ArrowLeft, Copy as CopyIcon, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Tooltip } from '@components/common/ui/Tooltip';
import { Avatar } from '@components/common/ui/Avatar';
import { CopyButton } from '@components/common/ui/CopyButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { ActionButton } from '@components/common/ui/ActionButton';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, SectionTitle, KpiGrid } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import {
  useAssistant,
  useAssistantDefinition,
  useAssistantVersions,
  useDeleteAssistant,
  defaultDefinition,
} from '@hooks/studio/useAgentAuthoring';
import { TestRunPanel } from './detail/TestRunPanel';
import { TemplateDetailOrigin } from '../templates/TemplateDetailOrigin';
import { ClonePicker } from './ClonePicker';
import { buildAgentBuildPath } from '../builder/lib/slot-model';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { EvaluatePanel } from './detail/EvaluatePanel';
import { BrainPanel } from './detail/BrainPanel';
import { KnowledgePanel } from './detail/KnowledgePanel';
import { ToolsPanel } from './detail/ToolsPanel';
import { GuardrailsPanel } from './detail/GuardrailsPanel';
import { MemoryPanel } from './detail/MemoryPanel';
import { BudgetPanel } from './detail/BudgetPanel';
import { PublishPanel } from './detail/PublishPanel';
import { OperateHeader } from './detail/OperateHeader';
import { OperatePanel } from './detail/OperatePanel';
import { ObservePanel } from './detail/ObservePanel';
import { AgentTrail } from './detail/AgentTrail';
import { VersionsPanel, VersionsPanelActions } from './detail/VersionsPanel';
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
  EmptyNote,
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

// Engine version statuses are SCREAMING (DRAFT/PUBLISHED/RETIRED/…); the
// assistant lifecycle pill is derived (live/draft/new/disabled).
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

export function AgentDetailView() {
  const params = useParams({ from: '/agent-studio/agents/$agentId' });
  const navigate = useNavigate();
  const assistant = useAssistant(params.agentId);
  // Definitions live on versions (draft preferred, else active) — the
  // assistant GET carries identity only (see useAgentAuthoring header).
  const form = useAssistantDefinition(params.agentId, { prefer: 'active' });
  const versions = useAssistantVersions(params.agentId);
  const deleteAssistant = useDeleteAssistant();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [cloneOpen, setCloneOpen] = useState(false);
  // Post-import landing (C12): the new draft row pulses + scrolls into
  // view with a banner — imports are never left silent. Session state,
  // never cached.
  const [highlightVersionId, setHighlightVersionId] = useState<string | null>(null);
  // Publish-gate landing (C14): version-row "Review & publish" selects the
  // draft in the gate panel below and scrolls to it — one publish path.
  const [publishFocus, setPublishFocus] = useState<{ versionId: string; nonce: number } | null>(null);
  const { role } = useOrg();
  const canAuthorClone = canSetup(role, 'setup:author');
  const cloneDenied = setupDeniedCopy(role, 'setup:author');

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
            {(() => {
              const definition = form.data?.definition ?? defaultDefinition();
              const lifecycle = agent.disabledAt ? 'disabled' : agent.activeVersionId ? 'live' : 'new';
              const lifecycleHint =
                lifecycle === 'live'
                  ? 'Serving traffic on its active version'
                  : lifecycle === 'disabled'
                    ? `Disabled${agent.disabledReason ? ` — ${agent.disabledReason}` : ''}`
                    : 'No published version yet';
              return (
                <>
            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
              <HeaderRow>
                <HeaderMain>
                  <Avatar
                    initials={agent.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                    hue="azure"
                    size={44}
                    status={lifecycle === 'live' ? 'online' : 'offline'}
                  />
                  <div style={{ minWidth: 0 }}>
                    <HeaderTitle>{agent.name}</HeaderTitle>
                    <HeaderSub>{agent.description ?? 'No description yet.'}</HeaderSub>
                  </div>
                  <span title={lifecycleHint}>
                    <StatusPill tone={statusTone[lifecycle] ?? 'neutral'}>
                      {lifecycle}
                    </StatusPill>
                  </span>
                </HeaderMain>
                <ActionCluster>
                  <Tooltip
                    label={
                      agent.activeVersionId
                        ? 'Test the active version in the chat workspace (drafts test from the editor — F-E1)'
                        : 'Publish a version first — chat serves the active version only'
                    }
                  >
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      disabled={!agent.activeVersionId}
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
                      disabled={!canAuthorClone}
                      title={canAuthorClone ? 'Pick a source, name the copy' : cloneDenied}
                      onClick={() => setCloneOpen(true)}
                    >
                      <CopyIcon size={13} strokeWidth={1.7} />
                      Clone
                    </ActionButton>
                  </Tooltip>
                  <Tooltip label='Delete this agent (rejected while active conversations exist)'>
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
              <TemplateDetailOrigin assistantId={agent.id} activeVersionId={agent.activeVersionId} />
              {cloneOpen && (
                <ClonePicker
                  open
                  onClose={() => setCloneOpen(false)}
                  initialSourceId={agent.id}
                  onCloned={(id) => {
                    setCloneOpen(false);
                    navigate({ to: buildAgentBuildPath(id) });
                  }}
                />
              )}
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
              <KpiGrid>
                <Panel title="Definition at a glance" subtitle="What the agent runs with today.">
                  <MetaGrid>
                    <MetaItem>
                      <MetaLabel>Model</MetaLabel>
                      <MetaValue>{definition.model_policy.allowed_models.join(', ')}</MetaValue>
                    </MetaItem>
                    <MetaItem>
                      <MetaLabel>Fallback</MetaLabel>
                      <MetaValue>{definition.model_policy.fallback_enabled ? 'enabled' : 'off'}</MetaValue>
                    </MetaItem>
                    <MetaItem>
                      <MetaLabel>Tools</MetaLabel>
                      <MetaValue>
                        {definition.tools.length > 0
                          ? definition.tools.map((t) => t.name).join(', ')
                          : 'none'}
                      </MetaValue>
                    </MetaItem>
                    <MetaItem>
                      <MetaLabel>Knowledge</MetaLabel>
                      <MetaValue>
                        {definition.context_policy.knowledge_sources.length > 0
                          ? definition.context_policy.knowledge_sources.join(', ')
                          : 'none'}
                      </MetaValue>
                    </MetaItem>
                    <MetaItem>
                      <MetaLabel>Memory scope</MetaLabel>
                      <MetaValue>{definition.context_policy.memory_scope}</MetaValue>
                    </MetaItem>
                    <MetaItem>
                      <MetaLabel>Cost cap</MetaLabel>
                      <MetaValue>
                        {definition.budget.max_cost_cents !== undefined
                          ? `${(definition.budget.max_cost_cents / 100).toFixed(2)} USD / run`
                          : 'unset (platform defaults)'}
                      </MetaValue>
                    </MetaItem>
                  </MetaGrid>
                </Panel>
              </KpiGrid>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
              <Panel
                title="System instructions"
                subtitle="The prompt this agent runs on."
                action={<CopyButton value={definition.instructions} label="Copy prompt" />}
              >
                <CodeBlock>
                  <PromptTitle>System</PromptTitle>
                  <PromptBody>{definition.instructions || 'No instructions yet — open the editor to write them.'}</PromptBody>
                </CodeBlock>
              </Panel>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>
              <BrainPanel agentId={agent.id} />
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={5}>
              <KnowledgePanel agentId={agent.id} />
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={6}>
              <ToolsPanel agentId={agent.id} />
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={7}>
              <Panel
                title="Versions"
                subtitle="Immutable drafts and published versions — publish to serve, rollback to recover."
                flush
                action={<VersionsPanelActions agentId={agent.id} activeVersionId={agent.activeVersionId} onImported={(versionId) => setHighlightVersionId(versionId)} />}
              >
                <VersionsPanel
                  agentId={agent.id}
                  activeVersionId={agent.activeVersionId}
                  highlightVersionId={highlightVersionId}
                  onDismissHighlight={() => setHighlightVersionId(null)}
                  onReviewPublish={(versionId) => setPublishFocus({ versionId, nonce: Date.now() })}
                />
              </Panel>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={8}>
              <GuardrailsPanel agentId={agent.id} />
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={9}>
              <MemoryPanel agentId={agent.id} />
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={10}>
              <BudgetPanel agentId={agent.id} />
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={11}>
              <SectionTitle>Brand voice</SectionTitle>
              {definition.brand ? (
                <ChipRow>
                  <Chip $hue="lilac">{definition.brand}</Chip>
                </ChipRow>
              ) : (
                <EmptyNote>No brand voice set.</EmptyNote>
              )}
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={12}>
              <TestRunPanel agentId={agent.id} versions={versions.data ?? []} />
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={11}>
              <EvaluatePanel agentId={agent.id} versions={versions.data ?? []} />
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={12}>
              <PublishPanel agentId={agent.id} versions={versions.data ?? []} focusRequest={publishFocus} />
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={pageItem} custom={13}>
              <OperateHeader
                agentId={agent.id}
                versions={versions.data ?? []}
                activeVersionId={agent.activeVersionId}
                degradedUntil={agent.degradedUntil}
                degradedReason={agent.degradedReason}
                disabledAt={agent.disabledAt}
                disabledReason={agent.disabledReason}
              />
            </motion.div>

            <motion.div id="operate-panel" initial="hidden" animate="visible" variants={pageItem} custom={13}>
              <OperatePanel agentId={agent.id} versions={versions.data ?? []} disabledAt={agent.disabledAt} disabledReason={agent.disabledReason} />
            </motion.div>

            <motion.div id="observe-panel" initial="hidden" animate="visible" variants={pageItem} custom={14}>
              <ObservePanel assistantId={agent.id} />
            </motion.div>

            <motion.div id="agent-trail" initial="hidden" animate="visible" variants={pageItem} custom={15}>
              <AgentTrail assistantId={agent.id} />
            </motion.div>
                </>
              );
            })()}
          </>
        )}
      </QueryView>
      <ConfirmDialog
        open={deleteConfirm}
        title='Delete this agent?'
        message='This removes the agent, all its versions, and its archived conversations. Active conversations must be archived first.'
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

