import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, Link } from '@tanstack/react-router';
import {
  ArrowLeft,
  ChevronRight,
  Copy as CopyIcon,
  MessageSquare,
  Pencil,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Tooltip } from '@components/common/ui/Tooltip';
import { Avatar } from '@components/common/ui/Avatar';
import { CopyButton } from '@components/common/ui/CopyButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { ActionButton, ActionButtonLink } from '@components/common/ui/ActionButton';
import { Segmented } from '@components/common/ui/Segmented';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, SectionTitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import {
  useAssistant,
  useAssistantDefinition,
  useAssistantVersions,
  useDeleteAssistant,
  defaultDefinition,
  type AgentVersion,
} from '@hooks/studio/useAgentAuthoring';
import { TemplateDetailOrigin } from '../templates/TemplateDetailOrigin';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { parseBrandVoice } from '@/sections/pages/products/agent-studio/builder/lib/brand-model';
import { buildAgentBuildPath } from '@/sections/pages/products/agent-studio/builder/lib/slot-model';
import {
  memoryScopeLabel,
  parseMemoryScope,
} from '@/sections/pages/products/agent-studio/builder/lib/memory-model';
import { DEFAULT_AGENT_DETAIL_TAB, type AgentDetailTab } from './detail/tabs';
import { EmptyNote, STATUS_TONE, TileKey } from './detail/primitives';
import { TestRunPanel } from './detail/TestRunPanel';
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
  ActionCluster,
  ActionDivider,
  BackLink,
  CodeBlock,
  IdentityDesc,
  IdentityMain,
  IdentityName,
  IdentityRow,
  PromptBody,
  SplitGrid,
  SummaryChevron,
  SummaryStrip,
  SummaryText,
  SummaryTile,
  SummaryValue,
  TabBar,
  TabIntro,
  TabPanel,
  Wide,
} from './AgentDetailView.styles';

/**
 * Agent detail (ledger 1.23).
 *
 * This page was signed off at 8dfff35 and then took six feature commits
 * that each appended one more equal-weight Panel, until it was a
 * seventeen-card wall where every fact appeared two or three times and the
 * eye had no order to read in. It is now five intent-grouped tabs:
 *
 *   Overview      what this agent is and whether it is healthy right now
 *   Configuration what it is built from — read-only, mirrors the builder
 *   Versions      the immutable history and the publish gate
 *   Test          prove it runs, prove it is good
 *   Operate       the levers, and what they have been doing
 *
 * Two rules hold the page together: each fact is owned by exactly one
 * surface, and the "At a glance" strip is the only place a value is
 * summarised — every tile deep-links to the tab that owns the detail.
 *
 * Action wiring is unchanged from the pre-1.23 page: clone copies the
 * definition, Test deep-links the chat workspace with the agent contract,
 * and the versions panel runs publish / retire / rollback / import with a
 * structured diff. Delete stays owner/admin-gated server-side (Z-011) and
 * the gate is mirrored here rather than walking non-governors into a 403.
 * Pause/Resume and per-agent telemetry remain absent by decision D-10 /
 * A-9 — no such engine endpoint exists.
 */

const TAB_OPTIONS: { value: AgentDetailTab; label: string; id: string }[] = [
  { value: 'overview', label: 'Overview', id: 'agent-tab-overview' },
  { value: 'configuration', label: 'Configuration', id: 'agent-tab-configuration' },
  { value: 'versions', label: 'Versions', id: 'agent-tab-versions' },
  { value: 'test', label: 'Test', id: 'agent-tab-test' },
  { value: 'operate', label: 'Operate', id: 'agent-tab-operate' },
];

/** Matches TabBar's sticky offset, so a tab switch never parks under the shell topbar. */
const STICKY_TOPBAR_OFFSET = 76;

/**
 * Consumes the one-shot post-import highlight marker written by the
 * import section (`agents:import:highlighted:<agentId>`) before it
 * navigates back here. Consumed exactly once — the marker is removed on
 * read so a refresh never replays the landing.
 */
function ConsumeImportHighlight({
  agentId,
  onHighlight,
}: {
  agentId: string;
  onHighlight: (versionId: string) => void;
}) {
  useEffect(() => {
    let pending: string | null = null;
    try {
      const key = `agents:import:highlighted:${agentId}`;
      pending = window.sessionStorage.getItem(key);
      if (pending) {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // Private mode etc. — the landing banner is a convenience, never load-bearing.
    }
    if (pending) {
      onHighlight(pending);
    }
  }, [agentId, onHighlight]);
  return null;
}

export function AgentDetailView() {
  const params = useParams({ from: '/agent-studio/agents/$agentId' });
  const navigate = useNavigate();
  const agentId = params.agentId;
  // Local state, not a search param: see the note on the route in
  // src/router/routes.tsx — validateSearch here would make TanStack demand
  // `search` on every sibling route in the branch.
  const [tab, setTab] = useState<AgentDetailTab>(DEFAULT_AGENT_DETAIL_TAB);

  const assistant = useAssistant(agentId);
  // Definitions live on versions (draft preferred, else active) — the
  // assistant GET carries identity only (see useAgentAuthoring header).
  const form = useAssistantDefinition(agentId, { prefer: 'active' });
  const versions = useAssistantVersions(agentId);
  const deleteAssistant = useDeleteAssistant();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
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
  // Z-011: delete is owner/admin-only server-side — mirror the gate instead
  // of walking non-governors into a 403 (same P1-1 pattern as Publish).
  const canDelete = canSetup(role, 'setup:govern');
  const deleteDenied = setupDeniedCopy(role, 'setup:govern');

  const tabBarRef = useRef<HTMLDivElement>(null);
  const firstTabRender = useRef(true);

  // Only re-anchor when the reader is actually scrolled past the bar — a tab
  // switch from the top of the page should not jump the viewport.
  useEffect(() => {
    if (firstTabRender.current) {
      firstTabRender.current = false;
      return;
    }
    if (window.scrollY <= STICKY_TOPBAR_OFFSET) return;
    const bar = tabBarRef.current;
    if (!bar) return;
    const top = bar.getBoundingClientRect().top + window.scrollY - STICKY_TOPBAR_OFFSET;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [tab]);

  const openTab = (next: AgentDetailTab) => setTab(next);

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
        empty={{
          title: 'Agent not found',
          description: "The agent you're looking for doesn't exist or was removed.",
        }}
      >
        {(agent) =>
          agent && (
            <>
              <ConsumeImportHighlight agentId={agent.id} onHighlight={setHighlightVersionId} />
              {(() => {
                const definition = form.data?.definition ?? defaultDefinition();
                const versionList = versions.data ?? [];
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
                      <IdentityRow>
                        <IdentityMain>
                          <Avatar
                            initials={agent.name
                              .split(' ')
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join('')}
                            hue="azure"
                            size={44}
                            status={lifecycle === 'live' ? 'online' : 'offline'}
                          />
                          <div style={{ minWidth: 0 }}>
                            <IdentityName>{agent.name}</IdentityName>
                            <IdentityDesc>{agent.description ?? 'No description yet.'}</IdentityDesc>
                          </div>
                          <span title={lifecycleHint}>
                            <StatusPill tone={STATUS_TONE[lifecycle] ?? 'neutral'}>{lifecycle}</StatusPill>
                          </span>
                        </IdentityMain>
                        <ActionCluster>
                          <Tooltip label="Edit the definition">
                            <ActionButton
                              size="sm"
                              onClick={() =>
                                navigate({
                                  to: '/agent-studio/agents/new',
                                  search: { edit: agent.id },
                                })
                              }
                            >
                              <Pencil size={13} strokeWidth={1.7} />
                              Edit
                            </ActionButton>
                          </Tooltip>
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
                              onClick={() =>
                                navigate({ to: '/agent-studio/chat', search: { agent: agent.id } })
                              }
                            >
                              <MessageSquare size={13} strokeWidth={1.7} />
                              Test
                            </ActionButton>
                          </Tooltip>
                          <ActionDivider aria-hidden="true" />
                          <Tooltip label="Duplicate this agent with its definition">
                            <ActionButton
                              variant="ghost"
                              size="sm"
                              disabled={!canAuthorClone}
                              title={canAuthorClone ? 'Pick a source, name the copy' : cloneDenied}
                              onClick={() =>
                                navigate({
                                  to: '/agent-studio/agents/clone',
                                  search: {
                                    sourceId: agent.id,
                                    returnTo: `/agent-studio/agents/${agent.id}`,
                                  },
                                })
                              }
                            >
                              <CopyIcon size={13} strokeWidth={1.7} />
                              Clone
                            </ActionButton>
                          </Tooltip>
                          <Tooltip
                            label={
                              canDelete
                                ? 'Delete this agent (rejected while active conversations exist)'
                                : deleteDenied
                            }
                          >
                            <ActionButton
                              variant="danger"
                              size="sm"
                              aria-label="Delete agent"
                              disabled={!canDelete}
                              title={canDelete ? undefined : deleteDenied}
                              onClick={() => setDeleteConfirm(true)}
                            >
                              <Trash2 size={13} strokeWidth={1.7} />
                            </ActionButton>
                          </Tooltip>
                        </ActionCluster>
                      </IdentityRow>
                      <TemplateDetailOrigin assistantId={agent.id} activeVersionId={agent.activeVersionId} />
                    </motion.div>

                    <div ref={tabBarRef}>
                      <TabBar>
                        <Segmented
                          options={TAB_OPTIONS}
                          value={tab}
                          onChange={openTab}
                          size="md"
                          ariaLabel="Agent sections"
                        />
                      </TabBar>
                    </div>

                    <TabPanel
                      as={motion.div}
                      key={tab}
                      role="tabpanel"
                      aria-labelledby={TAB_OPTIONS.find((o) => o.value === tab)?.id}
                      initial="hidden"
                      animate="visible"
                      variants={pageItem}
                      custom={0}
                    >
                      {tab === 'overview' && (
                        <OverviewTab
                          agent={agent}
                          definition={definition}
                          versions={versionList}
                          onOpenTab={openTab}
                        />
                      )}

                      {tab === 'configuration' && <ConfigurationTab agentId={agent.id} />}

                      {tab === 'versions' && (
                        <VersionsTab
                          agentId={agent.id}
                          activeVersionId={agent.activeVersionId}
                          versions={versionList}
                          highlightVersionId={highlightVersionId}
                          onDismissHighlight={() => setHighlightVersionId(null)}
                          publishFocus={publishFocus}
                          onReviewPublish={(versionId) =>
                            setPublishFocus({ versionId, nonce: Date.now() })
                          }
                        />
                      )}

                      {tab === 'test' && <TestTab agentId={agent.id} versions={versionList} />}

                      {tab === 'operate' && (
                        <OperateTab
                          agentId={agent.id}
                          versions={versionList}
                          disabledAt={agent.disabledAt}
                          disabledReason={agent.disabledReason}
                        />
                      )}
                    </TabPanel>
                  </>
                );
              })()}
            </>
          )
        }
      </QueryView>

      <ConfirmDialog
        open={deleteConfirm}
        title="Delete this agent?"
        message="This removes the agent, all its versions, and its archived conversations. Active conversations must be archived first."
        destructive
        confirmLabel="Delete"
        onConfirm={() => {
          deleteAssistant.mutate(agentId, {
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

/* ── At a glance ───────────────────────────────────────────────────── */

type SummarySpec = {
  label: string;
  value: string;
  /** The tab that owns the detail behind this number. */
  target: AgentDetailTab;
};

function buildSummary(
  definition: ReturnType<typeof defaultDefinition>,
  activeVersionId: string | null,
  versionList: AgentVersion[],
): SummarySpec[] {
  const models = definition.model_policy.allowed_models;
  const tools = definition.tools.length;
  const sources = definition.context_policy.knowledge_sources.length;
  const cap = definition.budget.max_cost_cents;
  const active = versionList.find((v) => v.id === activeVersionId);

  return [
    {
      label: 'Model',
      value:
        models.length === 0 ? 'None picked' : models.length === 1 ? models[0] : `${models.length} models`,
      target: 'configuration',
    },
    {
      label: 'Live version',
      value: active ? `v${active.version}` : 'Not published',
      target: 'versions',
    },
    { label: 'Tools', value: tools === 0 ? 'None' : `${tools} bound`, target: 'configuration' },
    {
      label: 'Knowledge',
      value: sources === 0 ? 'None pinned' : `${sources} pinned`,
      target: 'configuration',
    },
    {
      label: 'Memory',
      value: memoryScopeLabel(parseMemoryScope(definition.context_policy.memory_scope)),
      target: 'configuration',
    },
    {
      label: 'Cost cap',
      value: cap !== undefined ? `$${(cap / 100).toFixed(2)} / run` : 'No cap',
      target: 'configuration',
    },
  ];
}

function SummaryLink({
  label,
  value,
  target,
  onOpen,
}: SummarySpec & { onOpen: (tab: AgentDetailTab) => void }) {
  return (
    <SummaryTile
      type="button"
      onClick={() => onOpen(target)}
      aria-label={`${label}: ${value}. Open ${target}.`}
    >
      <TileKey>{label}</TileKey>
      <SummaryValue>
        <SummaryText>{value}</SummaryText>
        <SummaryChevron aria-hidden="true">
          <ChevronRight size={13} strokeWidth={2} />
        </SummaryChevron>
      </SummaryValue>
    </SummaryTile>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────────── */

function OverviewTab({
  agent,
  definition,
  versions,
  onOpenTab,
}: {
  agent: {
    id: string;
    activeVersionId: string | null;
    degradedUntil: string | null;
    degradedReason: string | null;
    disabledAt: string | null;
    disabledReason: string | null;
  };
  definition: ReturnType<typeof defaultDefinition>;
  versions: AgentVersion[];
  onOpenTab: (tab: AgentDetailTab) => void;
}) {
  const summary = buildSummary(definition, agent.activeVersionId, versions);
  const voice = parseBrandVoice(definition.brand);

  return (
    <>
      <div>
        <SectionTitle>At a glance</SectionTitle>
        <SummaryStrip>
          {summary.map((tile) => (
            <SummaryLink key={tile.label} {...tile} onOpen={onOpenTab} />
          ))}
        </SummaryStrip>
      </div>

      <OperateHeader
        agentId={agent.id}
        versions={versions}
        activeVersionId={agent.activeVersionId}
        degradedUntil={agent.degradedUntil}
        degradedReason={agent.degradedReason}
        disabledAt={agent.disabledAt}
        disabledReason={agent.disabledReason}
        onOpenOperate={() => onOpenTab('operate')}
        onOpenObserve={() => onOpenTab('operate')}
      />

      <SplitGrid>
        <Panel
          title="System instructions"
          subtitle="The prompt this agent runs on."
          action={<CopyButton value={definition.instructions} label="Copy prompt" />}
        >
          <CodeBlock>
            <PromptBody>
              {definition.instructions || 'No instructions yet — open the editor to write them.'}
            </PromptBody>
          </CodeBlock>
        </Panel>

        <Panel title="Brand voice" subtitle="The tone this agent answers in.">
          {voice !== undefined ? (
            <PromptBody>{voice}</PromptBody>
          ) : (
            <EmptyNote>No brand voice set.</EmptyNote>
          )}
        </Panel>
      </SplitGrid>
    </>
  );
}

function ConfigurationTab({ agentId }: { agentId: string }) {
  return (
    <>
      {/* One primary action for the whole tab — the six mirror panels used
          to each carry their own identical "Edit in builder →" link. */}
      <TabIntro>
        <p>
          A read-only mirror of the builder. Every value here is owned by the builder, so nothing on
          this tab is editable.
        </p>
        <ActionButtonLink to={buildAgentBuildPath(agentId)} $size="sm" $variant="primary">
          <Pencil size={13} strokeWidth={1.7} />
          Edit in builder
        </ActionButtonLink>
      </TabIntro>

      <SplitGrid>
        <Wide>
          <BrainPanel agentId={agentId} />
        </Wide>
        <KnowledgePanel agentId={agentId} />
        <ToolsPanel agentId={agentId} />
        <GuardrailsPanel agentId={agentId} />
        <MemoryPanel agentId={agentId} />
        <Wide>
          <BudgetPanel agentId={agentId} />
        </Wide>
      </SplitGrid>
    </>
  );
}

function VersionsTab({
  agentId,
  activeVersionId,
  versions,
  highlightVersionId,
  onDismissHighlight,
  publishFocus,
  onReviewPublish,
}: {
  agentId: string;
  activeVersionId: string | null;
  versions: AgentVersion[];
  highlightVersionId: string | null;
  onDismissHighlight: () => void;
  publishFocus: { versionId: string; nonce: number } | null;
  onReviewPublish: (versionId: string) => void;
}) {
  return (
    <>
      <Panel
        title="Versions"
        subtitle="Immutable drafts and published versions — publish to serve, rollback to recover."
        flush
        action={<VersionsPanelActions agentId={agentId} activeVersionId={activeVersionId} />}
      >
        <VersionsPanel
          agentId={agentId}
          activeVersionId={activeVersionId}
          highlightVersionId={highlightVersionId}
          onDismissHighlight={onDismissHighlight}
          onReviewPublish={onReviewPublish}
        />
      </Panel>

      <PublishPanel agentId={agentId} versions={versions} focusRequest={publishFocus} />
    </>
  );
}

function TestTab({ agentId, versions }: { agentId: string; versions: AgentVersion[] }) {
  return (
    <>
      <TestRunPanel agentId={agentId} versions={versions} />
      <EvaluatePanel agentId={agentId} versions={versions} />
    </>
  );
}

function OperateTab({
  agentId,
  versions,
  disabledAt,
  disabledReason,
}: {
  agentId: string;
  versions: AgentVersion[];
  disabledAt: string | null;
  disabledReason: string | null;
}) {
  return (
    <SplitGrid>
      {/* The ids stay: ObservePanel's "Back to Operate ↑" and the audit
          trail deep-links scroll to them within this tab. */}
      <Wide id="operate-panel">
        <OperatePanel
          agentId={agentId}
          versions={versions}
          disabledAt={disabledAt}
          disabledReason={disabledReason}
        />
      </Wide>
      <div id="observe-panel">
        <ObservePanel assistantId={agentId} />
      </div>
      <div id="agent-trail">
        <AgentTrail assistantId={agentId} />
      </div>
    </SplitGrid>
  );
}