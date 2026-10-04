import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Search, SlidersHorizontal, Zap, Eye, DollarSign, ShieldCheck, Plus } from 'lucide-react';
import { useOrg } from '@/Context/OrgContext';
import { useOrgTier, tierCovers } from '../hooks/useOrgTier';
import { useProviderDirectory } from '../hooks/useProviderDirectory';
import type { ProviderDirectoryEntry } from '../api';
import { StatusPill } from '@components/common/ui/StatusPill';
import { EmptyState } from '@components/common/ui/EmptyState';
import { ActionButton } from '@components/common/ui/ActionButton';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { Tooltip } from '@components/common/ui/Tooltip';

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests)
// ---------------------------------------------------------------------------

export type CatalogSectionKey =
  | 'neryva'
  | 'frontier'
  | 'open-weight'
  | 'aggregators'
  | 'enterprise-cloud'
  | 'local'
  | 'other';

const SECTION_LABELS: Record<CatalogSectionKey, string> = {
  neryva: 'Neryva',
  frontier: 'Frontier Labs',
  'open-weight': 'Open-Weight Clouds',
  aggregators: 'Aggregators & Gateways',
  'enterprise-cloud': 'Enterprise Cloud',
  local: 'Local Runtimes',
  other: 'Other Providers',
};

const SECTION_ORDER: CatalogSectionKey[] = [
  'neryva',
  'frontier',
  'open-weight',
  'aggregators',
  'enterprise-cloud',
  'local',
  'other',
];

function normalizeSlug(provider: string): string {
  return provider.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const SECTION_BY_SLUG: Record<string, CatalogSectionKey> = {
  // Neryva's own first-party free demo (engine provider slug `mock`,
  // display name "Neryva Demo") gets its own section — never "Other Providers".
  mock: 'neryva',
  // Frontier Labs
  openai: 'frontier',
  anthropic: 'frontier',
  google: 'frontier',
  gemini: 'frontier',
  xai: 'frontier',
  // Open-Weight Clouds
  deepseek: 'open-weight',
  moonshot: 'open-weight',
  minimax: 'open-weight',
  zai: 'open-weight',
  glm: 'open-weight',
  groq: 'open-weight',
  together: 'open-weight',
  fireworks: 'open-weight',
  nebius: 'open-weight',
  cerebras: 'open-weight',
  deepinfra: 'open-weight',
  mistral: 'open-weight',
  cohere: 'open-weight',
  // Aggregators & Gateways
  openrouter: 'aggregators',
  helicone: 'aggregators',
  cloudflare: 'aggregators',
  edenai: 'aggregators',
  // Enterprise Cloud
  bedrock: 'enterprise-cloud',
  amazonbedrock: 'enterprise-cloud',
  vertex: 'enterprise-cloud',
  googlevertexai: 'enterprise-cloud',
  azureopenai: 'enterprise-cloud',
  azure: 'enterprise-cloud',
  // Local Runtimes
  ollama: 'local',
  lmstudio: 'local',
  llamacpp: 'local',
  vllm: 'local',
};

/**
 * Display categorization only — provider slugs map to spec §6 sections.
 * Unknown slugs fall into 'other' so the catalog never hides a provider
 * the server returned. This is NOT a model list; models always come from
 * the server payload.
 */
function categorizeProvider(provider: string): CatalogSectionKey {
  return SECTION_BY_SLUG[normalizeSlug(provider)] ?? 'other';
}

export type ChipKey = 'tools' | 'vision' | 'price';

const CHIPS: Array<{ key: ChipKey; label: string; icon: typeof Zap }> = [
  { key: 'tools', label: 'Needs Tools', icon: Zap },
  { key: 'vision', label: 'Needs Vision', icon: Eye },
  { key: 'price', label: 'Price < $1.00/1M', icon: DollarSign },
];

function fromPrice(entry: ProviderDirectoryEntry): number | null {
  if (!entry.from_price_per_1m) return null;
  const n = Number.parseFloat(entry.from_price_per_1m);
  return Number.isFinite(n) ? n : null;
}

/** Client-side chip filters. ZDR has no server data yet — its chip renders disabled. */
function applyChipFilters(
  providers: ProviderDirectoryEntry[],
  chips: Set<ChipKey>,
): ProviderDirectoryEntry[] {
  if (chips.size === 0) return providers;
  return providers.filter((p) => {
    if (chips.has('tools') && !p.capabilities.includes('tools')) return false;
    if (chips.has('vision') && !p.capabilities.includes('vision')) return false;
    if (chips.has('price')) {
      const price = fromPrice(p);
      if (price === null || price >= 1.0) return false;
    }
    return true;
  });
}

function transportLabel(transport?: string): string | null {
  if (!transport) return null;
  const map: Record<string, string> = {
    'openai-compatible': 'OpenAI-Compatible',
    anthropic: 'Anthropic',
    'aws-sigv4': 'AWS SigV4',
    'vertex-rest': 'Vertex REST',
    ollama: 'Ollama',
  };
  return map[transport.toLowerCase()] ?? transport;
}

const CAPABILITY_LABELS: Record<string, string> = {
  tools: 'Tools',
  vision: 'Vision',
  reasoning: 'Reasoning',
  structured_output: 'Structured Output',
};

// Optional server-extended fields the drawer renders only when present.
interface CatalogExtras {
  docs_url?: string;
  latency_profile?: string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
`;

const SearchWrap = styled.div`
  position: relative;
  flex: 1 1 240px;
  max-width: 420px;
`;

const SearchIcon = styled.span`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.app.text.secondary};
  display: inline-flex;
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 14px 0 38px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: 14px;
  outline: none;
  &:focus {
    border-color: ${({ theme }) => theme.app.border.focus};
  }
  &::placeholder {
    color: ${({ theme }) => theme.app.text.ghost};
  }
`;

const ChipBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const Chip = styled.button<{ $active: boolean; $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.app.text.link : theme.app.border.strong)};
  background: ${({ theme, $active }) =>
    $active ? theme.app.status.info.bg : theme.app.surface.subtle};
  color: ${({ theme, $active }) =>
    $active ? theme.app.text.link : theme.app.text.secondary};
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
`;

const FilterHint = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.muted};
`;

const Layout = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
`;

const CatalogCol = styled.div`
  flex: 1;
  min-width: 0;
`;

const SectionBlock = styled.section`
  margin-bottom: 28px;
`;

const SectionHead = styled.h3`
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.secondary};
  margin: 0 0 12px;
`;

const SectionNote = styled.p`
  font-size: 13px;
  line-height: 1.55;
  color: ${({ theme }) => theme.app.text.secondary};
  margin: -6px 0 12px;
  max-width: 640px;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
`;

const Card = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 16px;
  cursor: pointer;
  transition: border-color 120ms ease, transform 120ms ease;
  &:hover {
    border-color: ${({ theme }) => theme.app.border.strong};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.text.link};
    outline-offset: 2px;
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const Avatar = styled.span`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.app.text.primary};
  background: ${({ theme }) => theme.app.surface.tint};
  flex: none;
`;

const CardName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  line-height: 1.3;
`;

const CardSub = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  margin-top: 2px;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
`;

const MiniBadge = styled.span`
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  color: ${({ theme }) => theme.app.text.secondary};
  background: transparent;
`;

const CardFoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
`;

const Price = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const ConnectLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.link};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const UpgradeCta = styled(Link)`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.link};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const TierRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
`;

const CustomCard = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1.5px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 14px;
  padding: 18px;
  text-decoration: none;
  color: ${({ theme }) => theme.app.text.primary};
  background: transparent;
  max-width: 560px;
  transition: border-color 120ms ease;
  &:hover {
    border-color: ${({ theme }) => theme.app.border.strong};
  }
`;

const CustomIcon = styled.span`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.app.status.info.bg};
  color: ${({ theme }) => theme.app.text.link};
  flex: none;
`;

const ErrorPanel = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 28px;
  text-align: center;
  max-width: 520px;
  margin: 24px auto;
`;

const ErrorTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
  color: ${({ theme }) => theme.app.text.primary};
`;

const ErrorCopy = styled.p`
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.secondary};
  margin: 0 0 16px;
`;

const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
`;

// Inline detail panel (slide-over, NOT a modal — no overlay, no focus trap,
// the catalog stays visible and interactive beside it).
const DetailPanel = styled(motion.aside)`
  width: 360px;
  flex: none;
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 16px;
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 20px;
`;

const DetailHead = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 16px;
`;

const DetailTitle = styled.h3`
  font-size: 17px;
  font-weight: 650;
  margin: 0;
  color: ${({ theme }) => theme.app.text.primary};
`;

const CloseBtn = styled.button`
  margin-left: auto;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: none;
  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    border-color: ${({ theme }) => theme.app.border.strong};
  }
`;

const DetailRow = styled.div`
  margin-bottom: 16px;
`;

const DetailLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
  margin-bottom: 8px;
`;

const ModelList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 260px;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const ModelItem = styled.li`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 10px;
  padding: 8px 10px;
`;

const ModelId = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.primary};
  word-break: break-all;
`;

const ModelName = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  margin-top: 2px;
`;

const DetailMeta = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 12px;
  font-size: 13px;
  dt {
    color: ${({ theme }) => theme.app.text.secondary};
  }
  dd {
    margin: 0;
    color: ${({ theme }) => theme.app.text.primary};
    text-align: right;
  }
`;

const DocsLink = styled.a`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.link};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function TierGate({ entry }: { entry: ProviderDirectoryEntry }) {
  const tier = useOrgTier();
  const coverage = tierCovers(tier, entry.min_required_product);
  if (entry.min_required_product === 'free') {
    return (
      <TierRow>
        <StatusPill tone="neutral" dot={false}>
          Included in your plan
        </StatusPill>
      </TierRow>
    );
  }
  // One pill language: the same StatusPill geometry (1px border, 999px
  // radius) as every other pill on the card — differentiated by tone
  // fill and label only, never by border thickness or radius.
  return (
    <TierRow>
      <StatusPill tone={coverage === false ? 'warning' : 'info'} dot={false}>
        {entry.min_required_product_label}
      </StatusPill>
      {coverage === false && (
        <UpgradeCta to="/agent-studio/settings/pricing">Upgrade</UpgradeCta>
      )}
    </TierRow>
  );
}

function ProviderCard({
  entry,
  onOpen,
  onConnectKey,
}: {
  entry: ProviderDirectoryEntry;
  onOpen: () => void;
  onConnectKey: () => void;
}) {
  const initial = entry.display_name.charAt(0).toUpperCase() || '?';
  const transport = transportLabel(entry.transport);
  const price = fromPrice(entry);
  const connected = entry.connection.has_active_credential;

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`View ${entry.display_name} details`}
      onClick={onOpen}
      onKeyDown={handleKey}
    >
      <CardTop>
        <Avatar aria-hidden="true">{initial}</Avatar>
        <div>
          <CardName>{entry.display_name}</CardName>
          <CardSub>
            {entry.model_count} {entry.model_count === 1 ? 'model' : 'models'}
          </CardSub>
        </div>
      </CardTop>
      <BadgeRow>
        {transport && <MiniBadge>{transport}</MiniBadge>}
        {entry.capabilities.map((c) => (
          <MiniBadge key={c}>{CAPABILITY_LABELS[c] ?? c}</MiniBadge>
        ))}
      </BadgeRow>
      <CardFoot>
        <Price>
          {price !== null ? `From $${entry.from_price_per_1m} / 1M` : 'Pricing not published'}
        </Price>
        {connected ? (
          <StatusPill tone="success">Connected</StatusPill>
        ) : (
          <ConnectLink
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onConnectKey();
            }}
            aria-label={`Connect a key for ${entry.display_name}`}
          >
            Connect key
          </ConnectLink>
        )}
      </CardFoot>
      <TierGate entry={entry} />
    </Card>
  );
}

export interface TabCatalogProps {
  /** Navigate the shell to the "My Providers" tab (connect-key flow). */
  onConnectKey?: () => void;
}

export default function TabCatalog({ onConnectKey }: TabCatalogProps) {
  const { orgId } = useOrg();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [chips, setChips] = useState<Set<ChipKey>>(new Set());
  const [selected, setSelected] = useState<ProviderDirectoryEntry | null>(null);

  // Real-time search: debounce keystrokes, the server does the matching.
  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const query = useProviderDirectory(orgId, search ? { search } : {});
  const providers = useMemo(() => query.data?.providers ?? [], [query.data]);

  const filtered = useMemo(() => applyChipFilters(providers, chips), [providers, chips]);

  const sections = useMemo(() => {
    const bySection = new Map<CatalogSectionKey, ProviderDirectoryEntry[]>();
    for (const p of filtered) {
      const key = categorizeProvider(p.provider);
      const list = bySection.get(key) ?? [];
      list.push(p);
      bySection.set(key, list);
    }
    return SECTION_ORDER.filter((k) => (bySection.get(k)?.length ?? 0) > 0).map((k) => ({
      key: k,
      providers: bySection.get(k) ?? [],
    }));
  }, [filtered]);

  // If the selected provider disappears from the list (filter change), the
  // drawer closes — derived during render, not in an effect.
  const effectiveSelected =
    selected && filtered.some((p) => p.provider === selected.provider) ? selected : null;

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleChip = (key: ChipKey) => {
    setChips((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setChips(new Set());
  };

  const selectedExtras = effectiveSelected ? (effectiveSelected as ProviderDirectoryEntry & CatalogExtras) : null;

  // A genuinely empty catalog reads differently from "your filters match
  // nothing" — the EmptyState copy says which one it is.
  const filterActive = searchInput.trim().length > 0 || chips.size > 0;

  return (
    <div>
      <Toolbar>
        <SearchWrap>
          <SearchIcon aria-hidden="true">
            <Search size={16} />
          </SearchIcon>
          <SearchInput
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search providers, models, tags…"
            aria-label="Search providers"
          />
        </SearchWrap>
        <ChipBar role="group" aria-label="Catalog filters">
          <FilterHint>
            <SlidersHorizontal size={14} aria-hidden="true" />
            Filters
          </FilterHint>
          {CHIPS.map(({ key, label, icon: Icon }) => (
            <Chip
              key={key}
              type="button"
              $active={chips.has(key)}
              aria-pressed={chips.has(key)}
              onClick={() => toggleChip(key)}
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </Chip>
          ))}
          {/* ZDR has no catalog data yet — disabled with an honest tooltip, never faked. */}
          <Tooltip label="ZDR eligibility data isn't published by the catalog yet">
            <Chip type="button" $active={false} $disabled disabled aria-disabled="true">
              <ShieldCheck size={14} aria-hidden="true" />
              ZDR Capable
            </Chip>
          </Tooltip>
        </ChipBar>
      </Toolbar>

      {query.isPending && (
        <SkeletonGrid aria-label="Loading providers">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} $h="168px" $r="14px" />
          ))}
        </SkeletonGrid>
      )}

      {query.isError && (
        <ErrorPanel role="alert">
          <ErrorTitle>We couldn't load the provider catalog</ErrorTitle>
          <ErrorCopy>
            Something went wrong on our side. Check your connection and try again —
            nothing on your end needs to change.
          </ErrorCopy>
          <ActionButton onClick={() => void query.refetch()}>Try again</ActionButton>
        </ErrorPanel>
      )}

      {query.isSuccess && filtered.length === 0 && (
        <EmptyState
          icon={<Search size={18} opacity={0.5} />}
          title={filterActive ? 'No providers match your filter criteria.' : 'The provider catalog is empty.'}
          description={
            filterActive
              ? 'Try a different search term or clear the filters to see the full catalog.'
              : 'The catalog returned no providers. Check back later or contact support if this persists.'
          }
          action={filterActive ? <ActionButton onClick={clearFilters}>Clear filters</ActionButton> : undefined}
        />
      )}

      {query.isSuccess && filtered.length > 0 && (
        <Layout>
          <CatalogCol>
            {sections.map((section) => (
              <SectionBlock key={section.key}>
                <SectionHead>{SECTION_LABELS[section.key]}</SectionHead>
                {section.key === 'local' && (
                  <SectionNote>
                    Local runtimes run on your own machine or network. They're available in
                    development workspaces only — the server blocks production use.
                  </SectionNote>
                )}
                <CardGrid>
                  {section.providers.map((p) => (
                    <ProviderCard
                      key={p.provider}
                      entry={p}
                      onOpen={() => setSelected(p)}
                      onConnectKey={() => onConnectKey?.()}
                    />
                  ))}
                </CardGrid>
              </SectionBlock>
            ))}

            <SectionBlock>
              <SectionHead>Custom Endpoints</SectionHead>
              <SectionNote>
                Point a private vLLM, TGI, or Ollama cluster at your workspace with
                enterprise egress controls.
              </SectionNote>
              <CustomCard to="/agent-studio/providers/custom/new">
                <CustomIcon aria-hidden="true">
                  <Plus size={20} />
                </CustomIcon>
                <div>
                  <CardName>Connect custom endpoint</CardName>
                  <CardSub>Enterprise — guided setup on a dedicated page</CardSub>
                </div>
              </CustomCard>
            </SectionBlock>
          </CatalogCol>

          <AnimatePresence>
            {effectiveSelected && (
              <DetailPanel
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                aria-label={`${effectiveSelected.display_name} details`}
              >
                <DetailHead>
                  <Avatar aria-hidden="true">
                    {effectiveSelected.display_name.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <DetailTitle>{effectiveSelected.display_name}</DetailTitle>
                    <CardSub>
                      {effectiveSelected.model_count} {effectiveSelected.model_count === 1 ? 'model' : 'models'}
                    </CardSub>
                  </div>
                  <CloseBtn
                    type="button"
                    onClick={() => setSelected(null)}
                    aria-label="Close provider details"
                  >
                    <X size={16} />
                  </CloseBtn>
                </DetailHead>

                <DetailRow>
                  <DetailLabel>Connection</DetailLabel>
                  {effectiveSelected.connection.has_active_credential ? (
                    <StatusPill tone="success">Connected</StatusPill>
                  ) : (
                    <ConnectLink type="button" onClick={() => onConnectKey?.()}>
                      Connect key →
                    </ConnectLink>
                  )}
                </DetailRow>

                <DetailRow>
                  <DetailLabel>Profile</DetailLabel>
                  <DetailMeta>
                    <dt>Transport</dt>
                    <dd>{transportLabel(effectiveSelected.transport) ?? 'Not published'}</dd>
                    <dt>Starting price</dt>
                    <dd>
                      {effectiveSelected.from_price_per_1m
                        ? `$${effectiveSelected.from_price_per_1m} / 1M`
                        : 'Not published'}
                    </dd>
                    <dt>Plan</dt>
                    <dd>{effectiveSelected.min_required_product_label}</dd>
                    {selectedExtras?.latency_profile && (
                      <>
                        <dt>Latency</dt>
                        <dd>{selectedExtras.latency_profile}</dd>
                      </>
                    )}
                  </DetailMeta>
                </DetailRow>

                <DetailRow>
                  <DetailLabel>Capabilities</DetailLabel>
                  <BadgeRow>
                    {effectiveSelected.capabilities.length > 0 ? (
                      effectiveSelected.capabilities.map((c) => (
                        <MiniBadge key={c}>{CAPABILITY_LABELS[c] ?? c}</MiniBadge>
                      ))
                    ) : (
                      <CardSub>No capability data published.</CardSub>
                    )}
                  </BadgeRow>
                </DetailRow>

                <DetailRow>
                  <DetailLabel>Models</DetailLabel>
                  {effectiveSelected.models.length > 0 ? (
                    <ModelList>
                      {effectiveSelected.models.map((m) => (
                        <ModelItem key={m.model_id}>
                          <ModelId>{m.model_id}</ModelId>
                          {m.display_name && m.display_name !== m.model_id && (
                            <ModelName>{m.display_name}</ModelName>
                          )}
                        </ModelItem>
                      ))}
                    </ModelList>
                  ) : (
                    <CardSub>Model list not published for this provider.</CardSub>
                  )}
                </DetailRow>

                {selectedExtras?.docs_url && (
                  <DetailRow>
                    <DocsLink
                      href={selectedExtras.docs_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Provider documentation →
                    </DocsLink>
                  </DetailRow>
                )}

                <TierGate entry={effectiveSelected} />
              </DetailPanel>
            )}
          </AnimatePresence>
        </Layout>
      )}
    </div>
  );
}
