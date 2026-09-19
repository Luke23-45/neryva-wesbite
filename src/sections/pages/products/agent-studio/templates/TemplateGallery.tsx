import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import {
  Headphones,
  Compass,
  ChartBar,
  Binoculars,
  Wrench,
  Terminal,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { EmptyState } from '@components/common/ui/EmptyState';
import { SearchField } from '@components/common/ui/SearchField';
import { ActionButton } from '@components/common/ui/ActionButton';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Modal } from '@components/common/ui/Modal';
import { QueryView } from '@components/common/ui/AsyncStates';
import {
  useAssistantTemplates,
  reasonFix,
  type TemplateListEntry,
  type RegistryTemplate,
} from '@hooks/studio/useSetupTemplates';
import { useChannels } from '@hooks/studio/useSetupChannels';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { describeBlockExpiry, matchTemplateBlock, useControlBlocks, type ControlBlock } from '@hooks/studio/useSetupOperate';
import { describeTemplateCounts, formatTemplateCounts } from '../builder/lib/template-model';
import {
  FilterBar,
  FilterPill,
  Count,
  TemplateGrid,
  TemplateCard,
  CardTop,
  IconBox,
  FeaturedBadge,
  Name,
  Description,
  Meta,
  MetaItem,
  ReasonList,
  ReasonRow,
  ReasonCode,
  BlockedBanner,
  TabRow,
  Tab,
  DetailSection,
  Rubric,
} from './TemplatesView.styles';
import { pageItem } from '@styles/motion';

const FAMILY_ICON = {
  support: Headphones,
  sales: ChartBar,
  research: Binoculars,
  ops: Wrench,
  brand: Sparkles,
  personal: Compass,
  channel: Terminal,
} as const;

const statusTone: Record<string, StatusTone> = {
  stable: 'success',
  beta: 'info',
  deprecated: 'warning',
  COMPATIBLE: 'success',
  INCOMPATIBLE: 'warning',
};

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.55;
`;

type FamilyFilter = 'all' | 'stable' | 'beta' | 'compatible' | 'installed';

const FILTERS: { value: FamilyFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'compatible', label: 'Compatible' },
  { value: 'installed', label: 'Installed' },
  { value: 'stable', label: 'Stable' },
  { value: 'beta', label: 'Beta' },
];

/** Console schema generation (all live rows are min_engine_schema 2). */
export const TEMPLATE_MAX_ENGINE_SCHEMA = 2;

export interface TemplateGalleryProps {
  onInstall: (entry: TemplateListEntry) => void;
}

function searchableText(entry: TemplateListEntry): string {
  const template = entry.template;
  const tools = template.bindings.tools.required.map((t) => t.name).join(' ');
  const knowledge = template.bindings.knowledge.required.join(' ');
  const evaluators = (template.evalRef?.evaluators?.evaluators ?? []).map((e) => `${e.name} ${e.checks.join(' ')}`).join(' ');
  return `${template.slug} ${template.family} ${tools} ${knowledge} ${evaluators}`.toLowerCase();
}

/**
 * Shared template gallery (C11 owns it; the library page and the builder
 * origin screen reuse it, never fork it). Cards are atomic — function,
 * BOM counts, compat, reasons, blocks, updates — with search over
 * in-entry fields only (never invented metadata).
 */
export function TemplateGallery({ onInstall }: TemplateGalleryProps) {
  const { role } = useOrg();
  const canInstall = canSetup(role, 'setup:author');
  const installDenied = setupDeniedCopy(role, 'setup:author');
  const templates = useAssistantTemplates();
  // Block states need the govern read (server 403s otherwise — the query
  // stays off instead of erroring, and install-time 409/403 is the backstop).
  const canReadBlocks = canSetup(role, 'setup:govern');
  const blocks = useControlBlocks({ enabled: canReadBlocks });
  const [family, setFamily] = useState<string>('all');
  const [filter, setFilter] = useState<FamilyFilter>('all');
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<TemplateListEntry | null>(null);

  const families = useMemo(() => {
    const set = new Map<string, number>();
    for (const entry of templates.data ?? []) {
      set.set(entry.template.family, (set.get(entry.template.family) ?? 0) + 1);
    }
    return [...set.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [templates.data]);

  const texts = useMemo(() => new Map((templates.data ?? []).map((entry) => [entry, searchableText(entry)])), [templates.data]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (templates.data ?? []).filter((entry) => {
      if (family !== 'all' && entry.template.family !== family) {
        return false;
      }
      if (filter === 'compatible' && !entry.compatible) {
        return false;
      }
      if (filter === 'installed' && !entry.installed) {
        return false;
      }
      if (filter === 'stable' && entry.template.status !== 'stable') {
        return false;
      }
      if (filter === 'beta' && entry.template.status !== 'beta') {
        return false;
      }
      if (q && !(texts.get(entry) ?? '').includes(q)) {
        return false;
      }
      return true;
    });
  }, [templates.data, family, filter, query, texts]);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <SearchField value={query} onChange={setQuery} placeholder="Search name, tools, knowledge, evaluators…" ariaLabel="Search templates" width={280} />
      </div>
      <FilterBar as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={1}>
        {FILTERS.map((f) => (
          <FilterPill key={f.value} type="button" $active={filter === f.value} aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
            {f.label}
          </FilterPill>
        ))}
        <FilterPill type="button" $active={family === 'all'} aria-pressed={family === 'all'} onClick={() => setFamily('all')}>
          Every family
        </FilterPill>
        {families.map(([name, count]) => (
          <FilterPill key={name} type="button" $active={family === name} aria-pressed={family === name} onClick={() => setFamily(name)}>
            {name}
            <Count $active={family === name}>{count}</Count>
          </FilterPill>
        ))}
      </FilterBar>

      <div style={{ marginTop: 12 }}>
        <QueryView
          query={templates}
          isEmpty={(d) => d.length === 0}
          empty={{ title: 'No templates in the registry', description: 'The template mirror is empty — the release job seeds it.' }}
        >
          {(entries) =>
            list.length === 0 ? (
              <EmptyState
                icon={<Sparkles size={26} strokeWidth={1.5} />}
                title="No templates match"
                description={entries.length === 0 ? undefined : 'Try a different family, filter, or search term.'}
              />
            ) : (
              <TemplateGrid>
                {list.map((entry, i) => {
                  const block = canReadBlocks && blocks.data
                    ? matchTemplateBlock(blocks.data, entry.template.slug, entry.template.version)
                    : null;
                  return (
                  <TemplateGalleryCard
                    key={`${entry.template.slug}@${entry.template.version}`}
                    entry={entry}
                    index={i}
                    canInstall={canInstall}
                    installDenied={installDenied}
                    block={block}
                    onDetail={() => setDetail(entry)}
                    onInstall={() => onInstall(entry)}
                  />
                  );
                })}
              </TemplateGrid>
            )
          }
        </QueryView>
      </div>

      {detail && (
        <TemplateDetailModal
          entry={detail}
          canInstall={canInstall}
          installDenied={installDenied}
          onClose={() => setDetail(null)}
          onInstall={() => {
            const target = detail;
            setDetail(null);
            onInstall(target);
          }}
        />
      )}
    </div>
  );
}

function TemplateGalleryCard({
  entry,
  index,
  canInstall,
  installDenied,
  block,
  onDetail,
  onInstall,
}: {
  entry: TemplateListEntry;
  index: number;
  canInstall: boolean;
  installDenied: string;
  block: ControlBlock | null;
  onDetail: () => void;
  onInstall: () => void;
}) {
  const Icon = FAMILY_ICON[entry.template.family as keyof typeof FAMILY_ICON] ?? Sparkles;
  const counts = describeTemplateCounts({
    bindings: entry.template.bindings,
    definition: entry.template.definition,
    evalRef: entry.template.evalRef,
  });
  // I6: schema-too-new disables BEFORE click (never a post-click failure).
  const schemaTooNew = (entry.template.minEngineSchema ?? 0) > TEMPLATE_MAX_ENGINE_SCHEMA;
  const installDisabled = !canInstall || block !== null || schemaTooNew;
  const installTitle = !canInstall
    ? installDenied
    : block !== null
      ? 'Install blocked — pick another template'
      : schemaTooNew
        ? `Needs console schema ${entry.template.minEngineSchema} — yours serves ${TEMPLATE_MAX_ENGINE_SCHEMA}`
        : 'Install as a draft (never live)';

  return (
    <TemplateCard as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={index + 2}>
      <CardTop>
        <IconBox $tone="lilac">
          <Icon size={18} strokeWidth={1.7} />
        </IconBox>
        <StatusPill tone={statusTone[entry.template.status] ?? 'neutral'} dot={false}>
          {entry.template.status} · {entry.template.version}
        </StatusPill>
        {entry.installed && <FeaturedBadge>installed</FeaturedBadge>}
      </CardTop>
      <Name>
        <Mono>{entry.template.slug}</Mono>
      </Name>
      <Description>
        {formatTemplateCounts(counts)}
      </Description>
      {entry.updateAvailable !== 'none' && (
        <Description>
          ▲ {entry.updateAvailable} update — Install v{entry.template.version} as new →
        </Description>
      )}
      <Meta>
        <MetaItem>
          <StatusPill tone={entry.compatible ? 'success' : 'warning'} dot={false}>
            {entry.compatible ? 'compatible' : 'incompatible'}
          </StatusPill>
        </MetaItem>
      </Meta>
      {!entry.compatible && entry.reasons.length > 0 && (
        <ReasonList>
          {entry.reasons.map((reason) => {
            const fix = reasonFix(reason.code);
            return (
              <ReasonRow key={reason.code}>
                <ReasonCode>{reason.code}</ReasonCode>
                {fix ? (
                  <Link to={fix.to}>{fix.label} →</Link>
                ) : (
                  <Muted>resolve in the install checklist ↓</Muted>
                )}
              </ReasonRow>
            );
          })}
        </ReasonList>
      )}
      {block !== null && (
        <BlockedBanner>
          Install blocked{block.reason ? ` — ${block.reason}` : ''} · {describeBlockExpiry(block.expiresAt)} ·{' '}
          <Link to="/agent-studio/blocks">View blocks</Link>
        </BlockedBanner>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <ActionButton variant="secondary" size="sm" onClick={onDetail}>
          Details
        </ActionButton>
        <ActionButton
          size="sm"
          disabled={installDisabled}
          title={installTitle}
          onClick={onInstall}
        >
          Install
          <ArrowRight size={11} strokeWidth={1.8} />
        </ActionButton>
      </div>
    </TemplateCard>
  );
}

type DetailTab = 'definition' | 'tools' | 'knowledge' | 'channels' | 'evaluation' | 'release';

export function TemplateDetailModal({
  entry,
  onClose,
  onInstall,
  canInstall,
  installDenied,
}: {
  entry: TemplateListEntry;
  onClose: () => void;
  onInstall: () => void;
  canInstall: boolean;
  installDenied: string;
}) {
  const [tab, setTab] = useState<DetailTab>('definition');
  const [showAllCases, setShowAllCases] = useState(false);
  const template = entry.template;

  const tabs: { value: DetailTab; label: string }[] = [
    { value: 'definition', label: 'Definition' },
    { value: 'tools', label: `Tools (${template.bindings.tools.required.length})` },
    { value: 'knowledge', label: `Knowledge (${template.bindings.knowledge.required.length})` },
    { value: 'channels', label: 'Channels' },
    { value: 'evaluation', label: 'Evaluation' },
    { value: 'release', label: 'Release' },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title={<Mono>{template.slug}@{template.version}</Mono>}
      width={680}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Close
          </ActionButton>
          <ActionButton disabled={!canInstall} title={canInstall ? 'Install as a draft (never live)' : installDenied} onClick={onInstall}>
            Install
            <ArrowRight size={11} strokeWidth={1.8} />
          </ActionButton>
        </>
      }
    >
      <p style={{ fontSize: 13, opacity: 0.75 }}>
        {template.family} · {template.status} · sha <Mono>{template.hash?.slice(0, 12) ?? '—'}</Mono>
      </p>
      {!entry.compatible && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 650 }}>Compatibility</h4>
          <ReasonList>
            {entry.reasons.map((reason) => {
              const fix = reasonFix(reason.code);
              return (
                <ReasonRow key={reason.code}>
                  <ReasonCode>{reason.code}</ReasonCode>
                  <span>{reason.detail}</span>
                  {fix ? <Link to={fix.to}>{fix.label} →</Link> : <Muted>resolve in the install checklist</Muted>}
                </ReasonRow>
              );
            })}
          </ReasonList>
        </div>
      )}
      <TabRow>
        {tabs.map((t) => (
          <Tab key={t.value} type="button" $on={tab === t.value} onClick={() => setTab(t.value)}>
            {t.label}
          </Tab>
        ))}
      </TabRow>

      {tab === 'definition' && <DefinitionTab template={template} />}
      {tab === 'tools' && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 650 }}>Required tool bindings</h4>
          <ul>
            {template.bindings.tools.required.map((tool) => (
              <li key={tool.name} style={{ fontSize: 13, lineHeight: 1.6 }}>
                <Mono>{tool.name}</Mono>
                {tool.built_in ? ' (built-in)' : ''}
                {tool.effect_class ? ` · ${tool.effect_class}` : ''}
                {tool.approval_requirement ? ` · approval ${tool.approval_requirement}` : ''}
                {tool.when_to_use ? ` — ${tool.when_to_use}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      {tab === 'knowledge' && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 650 }}>Required knowledge slugs</h4>
          {template.bindings.knowledge.required.length === 0 ? (
            <p><Muted>No required sources.</Muted></p>
          ) : (
            <ul>
              {template.bindings.knowledge.required.map((slug) => (
                <li key={slug} style={{ fontSize: 13, lineHeight: 1.6 }}><Mono>{slug}</Mono></li>
              ))}
            </ul>
          )}
          {template.bindings.knowledge.notes && <p>{template.bindings.knowledge.notes}</p>}
        </div>
      )}
      {tab === 'channels' && <ChannelsTab template={template} />}
      {tab === 'evaluation' && <EvaluationTab template={template} showAllCases={showAllCases} onToggleCases={() => setShowAllCases((v) => !v)} />}
      {tab === 'release' && <ReleaseTab template={template} />}
    </Modal>
  );
}

function DefinitionTab({ template }: { template: RegistryTemplate }) {
  const definition = template.definition as Record<string, unknown>;
  const modelPolicy = (definition.model_policy ?? {}) as Record<string, unknown>;
  const contextPolicy = (definition.context_policy ?? {}) as Record<string, unknown>;
  const knowledgePolicy = (definition.knowledge_policy ?? {}) as Record<string, unknown>;
  const budgetPolicy = (definition.budget_policy ?? {}) as Record<string, unknown>;
  return (
    <DetailSection>
      <h4>Definition (engine payload)</h4>
      <ul>
        <li>Instructions: {typeof definition.instructions === 'string' && definition.instructions.length > 0 ? `${definition.instructions.slice(0, 160)}…` : <Muted>—</Muted>}</li>
        <li>Models: <Mono>{Array.isArray(modelPolicy.allowed_models) ? (modelPolicy.allowed_models as string[]).join(', ') : '—'}</Mono></li>
        <li>History: {typeof contextPolicy.history_limit === 'number' ? contextPolicy.history_limit : '—'} · memory: {typeof contextPolicy.memory_scope === 'string' ? contextPolicy.memory_scope : '—'}</li>
        <li>Knowledge: {knowledgePolicy.retrieval_enabled === true ? 'on' : 'off'} · max {typeof knowledgePolicy.max_results === 'number' ? knowledgePolicy.max_results : '—'}</li>
        <li>Budgets: <Mono>{Object.entries(budgetPolicy).map(([k, v]) => `${k}=${String(v)}`).join(' · ') || '—'}</Mono></li>
      </ul>
    </DetailSection>
  );
}

function ChannelsTab({ template }: { template: RegistryTemplate }) {
  const declared = template.bindings.channels.channels;
  const live = useChannels();
  return (
    <DetailSection>
      <h4>Channels + caps</h4>
      {declared.length === 0 ? (
        <p><Muted>No channel bindings.</Muted></p>
      ) : (
        <ul>
          {declared.map((channel) => {
            // Declared names match live accounts by platform, id, or display
            // name — whichever the channel plane keyed them under.
            const account = (live.data ?? []).find((a) => a.platform === channel || a.id === channel || a.displayName === channel);
            return (
              <li key={channel}>
                <Mono>{channel}</Mono>
                {live.isPending ? (
                  <> — <Muted>checking live state…</Muted></>
                ) : live.isError ? (
                  <> — <Muted>live state unreachable</Muted> <button type="button" onClick={() => void live.refetch()}>Retry</button></>
                ) : account ? (
                  <> — connected{account.status ? ` (${account.status})` : ''}</>
                ) : (
                  <> — <Muted>not connected</Muted></>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p><Link to="/agent-studio/channels" search={{ returnTo: undefined, assistantId: undefined }}>Connect a channel to serve this template →</Link></p>
    </DetailSection>
  );
}

function EvaluationTab({ template, showAllCases, onToggleCases }: { template: RegistryTemplate; showAllCases: boolean; onToggleCases: () => void }) {
  const ref = template.evalRef;
  if (!ref) {
    return (
      <DetailSection>
        <h4>Evaluation</h4>
        <p><Muted>No eval reference ships with this template.</Muted></p>
      </DetailSection>
    );
  }
  const cases = ref.cases ?? [];
  const visible = showAllCases ? cases : cases.slice(0, 5);
  return (
    <DetailSection>
      <h4>Evaluators</h4>
      <ul>
        {(ref.evaluators?.evaluators ?? []).map((evaluator) => (
          <li key={`${evaluator.name}@${evaluator.version}`}>
            <Mono>{evaluator.name}@{evaluator.version}</Mono> ({evaluator.kind}): {(evaluator.checks ?? []).join(', ')}
          </li>
        ))}
      </ul>
      {ref.rubric_markdown && (
        <>
          <h4>Rubric</h4>
          <Rubric>{ref.rubric_markdown}</Rubric>
        </>
      )}
      <h4>Seed cases ({cases.length})</h4>
      <ul>
        {visible.map((c, i) => (
          <li key={i}>{c.input}</li>
        ))}
      </ul>
      {cases.length > 5 && (
        <p>
          <Muted>+{cases.length - 5} more — the full set seeds the install dataset.</Muted>{' '}
          <button type="button" onClick={onToggleCases}>{showAllCases ? 'Show fewer' : 'Show all'}</button>
        </p>
      )}
    </DetailSection>
  );
}

function ReleaseTab({ template }: { template: RegistryTemplate }) {
  const policy = template.releasePolicy;
  if (!policy) {
    return (
      <DetailSection>
        <h4>Release policy</h4>
        <p><Muted>No release policy — legacy posture (BLOCK gate only).</Muted></p>
      </DetailSection>
    );
  }
  return (
    <DetailSection>
      <h4>Release policy (v{policy.release_policy_version ?? '?'})</h4>
      <p>Required checks (a fresh PASS on the content hash must exist before publish):</p>
      <ul>
        {(policy.required ?? []).map((check, i) => (
          <li key={i}><Mono>{typeof check === 'string' ? check : JSON.stringify(check)}</Mono></li>
        ))}
      </ul>
      {policy.thresholds && (
        <p>Thresholds: <Mono>{Object.entries(policy.thresholds).map(([k, v]) => `${k}≥${v}`).join(' · ')}</Mono></p>
      )}
      {(policy.critical_failures ?? []).length > 0 && (
        <p>Critical failures (any occurrence BLOCKs release): <Mono>{(policy.critical_failures ?? []).join(', ')}</Mono></p>
      )}
    </DetailSection>
  );
}
