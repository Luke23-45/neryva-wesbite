import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
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
import { QueryView } from '@components/common/ui/AsyncStates';
import {
  useAssistantTemplates,
  reasonFix,
  reasonLabel,
  type TemplateListEntry,
} from '@hooks/studio/useSetupTemplates';
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
  SkeletonCard,
  SkeletonBar,
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
  /**
   * Detail-section context. The gallery is shared between the templates
   * library and the builder origin screen; "Details" routes to
   * /agent-studio/templates/$templateId and threads these through so the
   * detail section's Install preserves the origin contract (the builder
   * origin auto-lands in the builder on success — R-1 shim semantics).
   * Defaults to the gallery with no auto-land.
   */
  detailReturnTo?: string;
  detailAutoLandBuilder?: boolean;
}

function searchableText(entry: TemplateListEntry): string {
  const template = entry.template;
  const tools = template.bindings.tools.required.map((t) => t.name).join(' ');
  const knowledge = template.bindings.knowledge.required.join(' ');
  const evaluators = (template.evalRef?.evaluators?.evaluators ?? []).map((e) => `${e.name} ${e.checks.join(' ')}`).join(' ');
  return `${template.slug} ${template.family} ${tools} ${knowledge} ${evaluators}`.toLowerCase();
}

/**
 * Which searchable fields matched the query (P3-7) — so a result like
 * "quote-builder" for the query "quote" explains itself instead of looking
 * arbitrary. Returns display labels in field order.
 */
function matchedFields(entry: TemplateListEntry, q: string): string[] {
  if (!q) return [];
  const template = entry.template;
  const fields: Array<[string, string]> = [
    ['name', template.slug],
    ['family', template.family],
    ['tools', template.bindings.tools.required.map((t) => t.name).join(' ')],
    ['knowledge', template.bindings.knowledge.required.join(' ')],
    ['evaluators', (template.evalRef?.evaluators?.evaluators ?? []).map((e) => `${e.name} ${e.checks.join(' ')}`).join(' ')],
  ];
  return fields.filter(([, text]) => text.toLowerCase().includes(q)).map(([label]) => label);
}

const ResultCount = styled.div`
  margin-top: 10px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  font-variant-numeric: tabular-nums;
`;

/** Card-shaped loading skeleton (P3-10) — mirrors the TemplateCard layout. */
function GallerySkeleton() {
  return (
    <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <SkeletonBar $w="40px" $h="40px" />
            <SkeletonBar $w="110px" $h="20px" />
          </div>
          <SkeletonBar $w="55%" $h="18px" />
          <SkeletonBar $w="100%" />
          <SkeletonBar $w="85%" />
          <SkeletonBar $w="35%" $h="22px" />
          <div style={{ display: 'flex', gap: 8 }}>
            <SkeletonBar $w="84px" $h="32px" />
            <SkeletonBar $w="84px" $h="32px" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

/**
 * Shared template gallery (C11 owns it; the library page and the builder
 * origin screen reuse it, never fork it). Cards are atomic — function,
 * BOM counts, compat, reasons, blocks, updates — with search over
 * in-entry fields only (never invented metadata).
 */
export function TemplateGallery({ onInstall, detailReturnTo, detailAutoLandBuilder }: TemplateGalleryProps) {
  const { role } = useOrg();
  const navigate = useNavigate();
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
  const openDetail = (entry: TemplateListEntry) =>
    navigate({
      to: '/agent-studio/templates/$templateId',
      params: { templateId: entry.template.slug },
      search: {
        returnTo: detailReturnTo,
        autoLand: detailAutoLandBuilder ? ('builder' as const) : undefined,
      },
    });

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
          All families
        </FilterPill>
        {families.map(([name, count]) => (
          <FilterPill key={name} type="button" $active={family === name} aria-pressed={family === name} onClick={() => setFamily(name)}>
            {name.charAt(0).toUpperCase() + name.slice(1)}
            <Count $active={family === name}>{count}</Count>
          </FilterPill>
        ))}
      </FilterBar>
      <ResultCount aria-live="polite">
        {templates.isPending
          ? 'Loading templates…'
          : `${list.length} of ${(templates.data ?? []).length} templates`}
      </ResultCount>

      <div style={{ marginTop: 12 }}>
        <QueryView
          query={templates}
          isEmpty={(d) => d.length === 0}
          empty={{ title: 'No templates in the registry', description: 'The template mirror is empty — the release job seeds it.' }}
          skeleton={<GallerySkeleton />}
        >
          {(entries) =>
            list.length === 0 ? (
              <EmptyState
                icon={<Sparkles size={26} strokeWidth={1.5} />}
                title="No templates match"
                titleAs="h2"
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
                    query={query.trim().toLowerCase()}
                    onDetail={() => openDetail(entry)}
                    onInstall={() => onInstall(entry)}
                  />
                  );
                })}
              </TemplateGrid>
            )
          }
        </QueryView>
      </div>
    </div>
  );
}

function TemplateGalleryCard({
  entry,
  index,
  canInstall,
  installDenied,
  block,
  query,
  onDetail,
  onInstall,
}: {
  entry: TemplateListEntry;
  index: number;
  canInstall: boolean;
  installDenied: string;
  block: ControlBlock | null;
  query: string;
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
  const matches = matchedFields(entry, query);

  return (
    <TemplateCard as={motion.li} initial="hidden" animate="visible" variants={pageItem} custom={index + 2}>
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
      {matches.length > 0 && (
        <Muted>Matches: {matches.join(', ')}</Muted>
      )}
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
                <ReasonCode title={reason.code}>{reasonLabel(reason.code)}</ReasonCode>
                {fix ? (
                  <Link to={fix.to} aria-label={`${fix.label} for ${entry.template.slug}`}>{fix.label} →</Link>
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
        <ActionButton variant="secondary" size="sm" onClick={onDetail} aria-label={`Details for ${entry.template.slug}`}>
          Details
        </ActionButton>
        <ActionButton
          size="sm"
          disabled={installDisabled}
          title={installTitle}
          aria-label={`Install ${entry.template.slug} as draft`}
          onClick={onInstall}
        >
          Install
          <ArrowRight size={11} strokeWidth={1.8} />
        </ActionButton>
      </div>
    </TemplateCard>
  );
}
