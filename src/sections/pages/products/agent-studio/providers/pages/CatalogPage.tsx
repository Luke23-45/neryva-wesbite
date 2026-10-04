import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, DollarSign, Eye, Plus, X, Zap } from 'lucide-react';
import { useOrg } from '@/Context/OrgContext';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { SearchField } from '@components/common/ui/SearchField';
import { Switch } from '@components/common/ui/Switch';
import { StatusPill } from '@components/common/ui/StatusPill';
import { EmptyState } from '@components/common/ui/EmptyState';
import { Tooltip } from '@components/common/ui/Tooltip';
import { isDemoProvider } from '@/sections/pages/products/agent-studio/builder/lib/demo-model';
import type {
  ProviderDirectoryCapability,
  ProviderDirectoryEntry,
} from '../api';
import { useOrgTier, tierCovers } from '../hooks/useOrgTier';
import { useProviderDirectory } from '../hooks/useProviderDirectory';
import { useSetProviderEnabled } from '../hooks/useProviderEnablement';

/* ------------------------------------------------------------------ */
/* Pure helpers (exported for tests)                                   */
/* ------------------------------------------------------------------ */

export type ChipKey = 'tools' | 'vision' | 'price' | 'zdr';

export const CHIPS: Array<{ key: ChipKey; label: string; icon: typeof Zap }> = [
  { key: 'tools', label: 'Needs Tools', icon: Zap },
  { key: 'vision', label: 'Needs Vision', icon: Eye },
  { key: 'price', label: 'Price < $1.00/1M', icon: DollarSign },
  { key: 'zdr', label: 'ZDR Capable', icon: Zap },
];

function fromPrice(entry: ProviderDirectoryEntry): number | null {
  if (!entry.from_price_per_1m) return null;
  const n = Number.parseFloat(entry.from_price_per_1m);
  return Number.isFinite(n) ? n : null;
}

/**
 * Client-side chip filters. The server also narrows on the same dimensions
 * (capability / max_input_price_per_1m / zdr params) — this pass is the
 * single source of displayed truth, so the UI never shows a row the chips
 * exclude even if the server's narrowing drifts.
 */
export function applyChipFilters(
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
    // zdr_capable absent = unknown — never presented as incapable, so an
    // unknown row is kept (honest) rather than dropped.
    if (chips.has('zdr') && p.zdr_capable !== true) return false;
    return true;
  });
}

export function transportLabel(transport?: string): string | null {
  if (!transport) return null;
  const map: Record<string, string> = {
    'openai-compatible': 'OpenAI-Compatible',
    anthropic: 'Anthropic',
    'aws-sigv4': 'AWS SigV4',
    'vertex-rest': 'Vertex REST',
    ollama: 'Ollama',
  };
  return map[transport] ?? transport;
}

/**
 * Mandatory source line under the provider name. The door is named on every
 * row — platform pool with transport, or the BYOK credential label +
 * fingerprint (never secret material).
 */
export function sourceLine(entry: ProviderDirectoryEntry): string {
  if (entry.door === 'byok') {
    const label = entry.credential_label?.trim() || 'key';
    const fp = entry.credential_fingerprint?.trim();
    return fp ? `BYOK · ${label} ${fp}` : `BYOK · ${label}`;
  }
  const transport = transportLabel(entry.transport);
  return transport ? `Platform pool · ${entry.provider} · ${transport}` : `Platform pool · ${entry.provider}`;
}

/** 1000000 → "1M", 500000 → "500K", 128000 → "128K". Null when unknown. */
export function formatContext(tokens?: number): string | null {
  if (tokens === undefined || tokens === null || !Number.isFinite(tokens) || tokens <= 0) return null;
  if (tokens >= 1_000_000) {
    const m = tokens / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    const k = tokens / 1_000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}K`;
  }
  return String(tokens);
}

const CAPABILITY_LABELS: Record<string, string> = {
  tools: 'tools',
  vision: 'vision',
  reasoning: 'reasoning',
  structured_output: 'structured',
};

/** Pricing cell vocabulary. Returns { text, honest } — honest=false means the value is missing, never zero. */
export function priceCell(
  price: string | undefined,
  pricingMode: ProviderDirectoryEntry['pricing_mode'],
): { text: string; known: boolean } {
  if (pricingMode === 'varies') return { text: 'Varies', known: true };
  if (pricingMode === 'custom') return { text: 'Custom', known: true };
  if (pricingMode === 'pass_through') return { text: 'Pass-through', known: true };
  if (!price) return { text: '—', known: false };
  const n = Number.parseFloat(price);
  if (!Number.isFinite(n)) return { text: '—', known: false };
  return { text: `$${n.toFixed(2)}`, known: true };
}

const CAPABILITY_ORDER = ['tools', 'vision', 'reasoning'] as const;

/* ------------------------------------------------------------------ */
/* Styled                                                              */
/* ------------------------------------------------------------------ */

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const SearchWrap = styled.div`
  width: 320px;
  max-width: 100%;
`;

const ChipBar = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const Chip = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.app.text.link : theme.app.border.default)};
  background: ${({ theme, $active }) =>
    $active ? theme.app.status.info.bg : theme.app.surface.subtle};
  color: ${({ theme, $active }) => ($active ? theme.app.text.link : theme.app.text.secondary)};
  transition: border-color 120ms ease, color 120ms ease, background 120ms ease;
  &:hover {
    border-color: ${({ theme }) => theme.app.border.strong};
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

const ResultMeta = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.faint};
  margin-bottom: 12px;
`;

const SectionBlock = styled.section`
  margin-bottom: 28px;
`;

const SectionHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
`;

const SectionTitle = styled.h2`
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
  margin: 0;
`;

const SectionCount = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.faint};
`;

const TableWrap = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  overflow: hidden;
  background: ${({ theme }) => theme.app.surface.subtle};
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const HeadCell = styled.th`
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
  padding: 10px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  white-space: nowrap;
`;

const BodyRow = styled.tr<{ $selected: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  background: ${({ theme, $selected }) =>
    $selected ? theme.app.status.info.bg : 'transparent'};
  box-shadow: ${({ theme, $selected }) =>
    $selected ? `inset 3px 0 0 ${theme.app.text.link}` : 'none'};
  &:last-child {
    border-bottom: none;
  }
`;

const BodyCell = styled.td`
  padding: 10px 12px;
  vertical-align: middle;
  color: ${({ theme }) => theme.app.text.primary};
`;

const ProviderCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.app.text.inverse};
  background: ${({ theme }) => theme.app.text.link};
`;

const ProviderNameBtn = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  min-width: 0;
  &:hover > span:first-child {
    text-decoration: underline;
  }
`;

const ProviderName = styled.span`
  display: block;
  font-size: 13.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SourceLine = styled.span`
  display: block;
  font-size: 11.5px;
  color: ${({ theme }) => theme.app.text.faint};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 260px;
`;

const CapDots = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const CapDot = styled.span<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${({ theme, $on }) => ($on ? theme.app.text.secondary : theme.app.text.faint)};
  opacity: ${({ $on }) => ($on ? 1 : 0.35)};
  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: ${({ theme, $on }) => ($on ? theme.app.text.link : theme.app.border.strong)};
  }
`;

const IncompleteTag = styled.span`
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  margin-left: 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  border: 1px dashed ${({ theme }) => theme.app.status.warning.fg};
  color: ${({ theme }) => theme.app.status.warning.fg};
  cursor: help;
  white-space: nowrap;
`;

const DimText = styled.span`
  color: ${({ theme }) => theme.app.text.faint};
`;

const PriceText = styled.span<{ $known: boolean }>`
  color: ${({ theme, $known }) => ($known ? theme.app.text.primary : theme.app.text.faint)};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const UpgradeLink = styled(Link)`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.link};
  text-decoration: none;
  white-space: nowrap;
  &:hover {
    text-decoration: underline;
  }
`;

const CustomRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  &:hover {
    border-color: ${({ theme }) => theme.app.text.link};
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

const Footnote = styled.p`
  margin: 24px 0 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.faint};
  max-width: 860px;
`;

const ReturnBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme.app.text.link};
  border-radius: 12px;
  background: ${({ theme }) => theme.app.status.info.bg};
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.primary};
  a {
    font-weight: 600;
    color: ${({ theme }) => theme.app.text.link};
  }
`;

const ErrorBox = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  padding: 20px;
  background: ${({ theme }) => theme.app.surface.subtle};
  max-width: 560px;
`;

const ErrorTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 8px;
  color: ${({ theme }) => theme.app.text.primary};
`;

const ErrorCopy = styled.p`
  font-size: 13.5px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.secondary};
  margin: 0 0 16px;
`;

const RetryButton = styled.button`
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    border-color: ${({ theme }) => theme.app.border.strong};
  }
`;

const SkeletonTable = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  overflow: hidden;
`;

const SkeletonRow = styled.div`
  height: 60px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  background: ${({ theme }) => theme.app.surface.subtle};
  animation: pulse 1.4s ease-in-out infinite;
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.45;
    }
  }
  &:last-child {
    border-bottom: none;
  }
`;

/* ------------------------------------------------------------------ */
/* Detail drawer (slide-over, NOT a modal)                             */
/* ------------------------------------------------------------------ */

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

const DetailSub = styled.div`
  font-size: 12.5px;
  color: ${({ theme }) => theme.app.text.secondary};
  margin-top: 2px;
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

const DetailMeta = styled.dl`
  margin: 0;
  dt {
    font-size: 11.5px;
    color: ${({ theme }) => theme.app.text.faint};
    margin-bottom: 2px;
  }
  dd {
    font-size: 13px;
    color: ${({ theme }) => theme.app.text.primary};
    margin: 0 0 10px;
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const MiniBadge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme }) => theme.app.text.secondary};
  background: ${({ theme }) => theme.app.surface.subtle};
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

const ConnectLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.link};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const NoKeyText = styled.span`
  font-size: 13.5px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const DocsLink = styled.a`
  font-size: 13.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.link};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
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

function ProviderDrawer({
  entry,
  onClose,
  onConnectKey,
}: {
  entry: ProviderDirectoryEntry;
  onClose: () => void;
  onConnectKey: () => void;
}) {
  const initial = entry.display_name.charAt(0).toUpperCase() || '?';
  const input = priceCell(entry.from_price_per_1m, entry.pricing_mode);
  const output = priceCell(entry.to_price_per_1m, entry.pricing_mode);
  const extras = entry as ProviderDirectoryEntry & {
    latency_profile?: string;
    docs_url?: string;
  };
  return (
    <DetailPanel
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      aria-label={`${entry.display_name} details`}
    >
      <DetailHead>
        <Avatar aria-hidden="true">{initial}</Avatar>
        <div>
          <DetailTitle>{entry.display_name}</DetailTitle>
          <DetailSub>
            {entry.model_count} {entry.model_count === 1 ? 'model' : 'models'} · {sourceLine(entry)}
          </DetailSub>
        </div>
        <CloseBtn type="button" onClick={onClose} aria-label="Close provider details">
          <X size={16} />
        </CloseBtn>
      </DetailHead>

      <DetailRow>
        <DetailLabel>Connection</DetailLabel>
        {entry.connection.has_active_credential ? (
          <StatusPill tone="success">Connected</StatusPill>
        ) : isDemoProvider(entry.provider) ? (
          // The demo adapter takes no key — the connect flow would be a dead end.
          <NoKeyText>No key needed</NoKeyText>
        ) : (
          <ConnectLink type="button" onClick={onConnectKey}>
            Connect key →
          </ConnectLink>
        )}
      </DetailRow>

      <DetailRow>
        <DetailLabel>Profile</DetailLabel>
        <DetailMeta>
          <dt>Transport</dt>
          <dd>{transportLabel(entry.transport) ?? 'Not published'}</dd>
          <dt>Starting price</dt>
          <dd>
            {input.known
              ? entry.pricing_mode === 'per_model'
                ? `${input.text} / 1M input tokens`
                : input.text
              : 'Not published'}
          </dd>
          <dt>Starting output price</dt>
          <dd>
            {output.known
              ? entry.pricing_mode === 'per_model'
                ? `${output.text} / 1M output tokens`
                : output.text
              : 'Not published'}
          </dd>
          <dt>Max context</dt>
          <dd>{formatContext(entry.max_context_tokens) ?? 'Not published'}</dd>
          <dt>Plan</dt>
          <dd>{entry.min_required_product_label}</dd>
          {extras.latency_profile && (
            <>
              <dt>Latency</dt>
              <dd>{extras.latency_profile}</dd>
            </>
          )}
        </DetailMeta>
      </DetailRow>

      {entry.data_quality === 'incomplete' && (
        <DetailRow>
          <DetailLabel>Catalog completeness</DetailLabel>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: 'inherit' }}>
            This row is marked incomplete — {entry.data_quality_reasons.length}{' '}
            {entry.data_quality_reasons.length === 1 ? 'gap' : 'gaps'} in the published catalog
            data:
            <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
              {entry.data_quality_reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </DetailRow>
      )}

      <DetailRow>
        <DetailLabel>Capabilities</DetailLabel>
        <BadgeRow>
          {entry.capabilities.length > 0 ? (
            entry.capabilities.map((c) => (
              <MiniBadge key={c}>{CAPABILITY_LABELS[c] ?? c}</MiniBadge>
            ))
          ) : (
            <DetailSub>No capability data published.</DetailSub>
          )}
        </BadgeRow>
      </DetailRow>

      <DetailRow>
        <DetailLabel>Models</DetailLabel>
        {entry.models.length > 0 ? (
          <ModelList>
            {entry.models.map((m) => (
              <ModelItem key={m.model_id}>
                <ModelId>{m.model_id}</ModelId>
                {m.display_name && m.display_name !== m.model_id && (
                  <ModelName>{m.display_name}</ModelName>
                )}
              </ModelItem>
            ))}
          </ModelList>
        ) : (
          <DetailSub>Model list not published for this provider.</DetailSub>
        )}
      </DetailRow>

      {extras.docs_url && (
        <DetailRow>
          <DocsLink href={extras.docs_url} target="_blank" rel="noopener noreferrer">
            Provider documentation →
          </DocsLink>
        </DetailRow>
      )}

      <DetailRow>
        <DetailLabel>Plan</DetailLabel>
        <PlanCell entry={entry} />
      </DetailRow>
    </DetailPanel>
  );
}

/* ------------------------------------------------------------------ */
/* PLAN + ACCESS cells                                                 */
/* ------------------------------------------------------------------ */

function PlanCell({ entry }: { entry: ProviderDirectoryEntry }) {
  const tier = useOrgTier();
  const coverage = tierCovers(tier, entry.min_required_product);
  if (entry.min_required_product === 'free') {
    return (
      <StatusPill tone="neutral" dot={false}>
        Included
      </StatusPill>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <StatusPill tone={coverage === false ? 'warning' : 'info'} dot={false}>
        {coverage === false ? 'Requires Ent.' : entry.min_required_product_label}
      </StatusPill>
    </span>
  );
}

function AccessCell({
  entry,
  pending,
  error,
  onToggle,
}: {
  entry: ProviderDirectoryEntry;
  pending: boolean;
  error: string | null;
  onToggle: (provider: string, enabled: boolean) => void;
}) {
  const tier = useOrgTier();
  const coverage = tierCovers(tier, entry.min_required_product);
  if (coverage === false) {
    return <UpgradeLink to="/agent-studio/settings/pricing">Upgrade →</UpgradeLink>;
  }
  const label = `${entry.connection.enabled ? 'Disable' : 'Enable'} ${entry.display_name} for this workspace`;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <Switch
        checked={entry.connection.enabled}
        onChange={(next) => onToggle(entry.provider, next)}
        label={label}
        disabled={pending}
      />
      {error && (
        <Tooltip label={error}>
          <DimText role="img" aria-label={`Toggle failed: ${error}`}>
            <AlertTriangle size={14} aria-hidden="true" />
          </DimText>
        </Tooltip>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function CatalogPage() {
  const { orgId } = useOrg();
  const navigate = useNavigate();
  const { returnTo } = useSearch({ strict: false }) as { returnTo?: unknown };
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [chips, setChips] = useState<Set<ChipKey>>(new Set());
  const [selected, setSelected] = useState<ProviderDirectoryEntry | null>(null);
  const [toggleError, setToggleError] = useState<{ provider: string; message: string } | null>(
    null,
  );

  // ?returnTo — the builder's ModelPicker deep-links here; the guard keeps
  // the return target inside the studio so the banner can never bounce out.
  const safeReturnTo =
    typeof returnTo === 'string' && returnTo.startsWith('/agent-studio/') ? returnTo : null;

  // Real-time search: debounce keystrokes, the server does the matching.
  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const capabilityParam: ProviderDirectoryCapability | undefined =
    chips.has('tools') && chips.has('vision')
      ? undefined
      : chips.has('tools')
        ? 'tools'
        : chips.has('vision')
          ? 'vision'
          : undefined;

  const query = useProviderDirectory(orgId, {
    ...(search ? { search } : {}),
    ...(capabilityParam ? { capability: capabilityParam } : {}),
    ...(chips.has('price') ? { maxInputPricePer1m: 1 } : {}),
    ...(chips.has('zdr') ? { zdr: true } : {}),
  });
  const providers = useMemo(() => query.data?.providers ?? [], [query.data]);
  const filtered = useMemo(() => applyChipFilters(providers, chips), [providers, chips]);

  // Server-driven sections: group by the registry `section`, preserving the
  // server's first-seen order. No client-side categorization.
  const sections = useMemo(() => {
    const order: string[] = [];
    const bySection = new Map<string, ProviderDirectoryEntry[]>();
    for (const p of filtered) {
      const key = p.section || 'Other';
      if (!bySection.has(key)) {
        bySection.set(key, []);
        order.push(key);
      }
      bySection.get(key)!.push(p);
    }
    return order.map((key) => ({ key, providers: bySection.get(key)! }));
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

  const setEnabled = useSetProviderEnabled(orgId);
  const pendingProvider = setEnabled.isPending ? setEnabled.variables?.provider ?? null : null;

  const handleToggle = (provider: string, enabled: boolean) => {
    setToggleError(null);
    setEnabled.mutate(
      { provider, enabled },
      {
        onError: () => {
          // Sanitized copy — never the raw engine message.
          setToggleError({
            provider,
            message: 'Could not change provider access. Please try again.',
          });
        },
      },
    );
  };

  const filterActive = searchInput.trim().length > 0 || chips.size > 0;
  const totalModels = filtered.reduce((n, p) => n + p.model_count, 0);

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>Providers</ViewTitle>
        <ViewSubtitle>
          Browse the model catalog, connect your own keys, and govern which models your agents can
          use.
        </ViewSubtitle>
      </ViewHeader>

      {safeReturnTo && (
        <ReturnBanner role="status">
          You arrived from the agent builder — you can return to your draft at any time.{' '}
          <Link to={safeReturnTo}>← Back to builder</Link>
        </ReturnBanner>
      )}

      <Toolbar>
        <SearchWrap>
          <SearchField
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search providers or models…"
            ariaLabel="Search providers"
          />
        </SearchWrap>
        <ChipBar role="group" aria-label="Catalog filters">
          {CHIPS.map(({ key, label, icon: Icon }) => (
            <Chip
              key={key}
              type="button"
              $active={chips.has(key)}
              aria-pressed={chips.has(key)}
              onClick={() => toggleChip(key)}
            >
              <Icon size={13} strokeWidth={1.8} aria-hidden="true" />
              {label}
            </Chip>
          ))}
          {filterActive && (
            <Chip type="button" $active={false} onClick={clearFilters} aria-label="Clear filters">
              <X size={13} strokeWidth={1.8} aria-hidden="true" />
              Clear
            </Chip>
          )}
        </ChipBar>
      </Toolbar>

      {query.isLoading ? (
        <>
          <ResultMeta>Loading the provider catalog…</ResultMeta>
          <SkeletonTable aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </SkeletonTable>
        </>
      ) : query.isError ? (
        <ErrorBox role="alert">
          <ErrorTitle>Couldn&apos;t load the provider catalog</ErrorTitle>
          <ErrorCopy>
            The catalog service didn&apos;t respond. Your provider connections are unaffected —
            this is a display problem, not a data problem.
          </ErrorCopy>
          <RetryButton type="button" onClick={() => query.refetch()}>
            Try again
          </RetryButton>
        </ErrorBox>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={filterActive ? 'No providers match these filters' : 'No providers available'}
          description={
            filterActive
              ? 'Try widening the search or clearing a filter chip.'
              : 'The catalog returned no providers for this workspace.'
          }
          action={
            filterActive ? (
              <RetryButton type="button" onClick={clearFilters}>
                Clear filters
              </RetryButton>
            ) : undefined
          }
        />
      ) : (
        <Layout>
          <CatalogCol>
            <ResultMeta>
              {filtered.length} {filtered.length === 1 ? 'provider' : 'providers'} · {totalModels}{' '}
              {totalModels === 1 ? 'model' : 'models'}
            </ResultMeta>
            {sections.map((section) => (
              <SectionBlock key={section.key}>
                <SectionHead>
                  <SectionTitle>{section.key}</SectionTitle>
                  <SectionCount>
                    {section.providers.length}{' '}
                    {section.providers.length === 1 ? 'provider' : 'providers'}
                  </SectionCount>
                </SectionHead>
                <TableWrap>
                  <StyledTable>
                    <thead>
                      <tr>
                        <HeadCell scope="col">Provider</HeadCell>
                        <HeadCell scope="col">Models</HeadCell>
                        <HeadCell scope="col">Context</HeadCell>
                        <HeadCell scope="col">Capabilities</HeadCell>
                        <HeadCell scope="col">Input / 1M</HeadCell>
                        <HeadCell scope="col">Output / 1M</HeadCell>
                        <HeadCell scope="col">Plan</HeadCell>
                        <HeadCell scope="col">Access</HeadCell>
                      </tr>
                    </thead>
                    <tbody>
                      {section.providers.map((entry) => {
                        const input = priceCell(entry.from_price_per_1m, entry.pricing_mode);
                        const output = priceCell(entry.to_price_per_1m, entry.pricing_mode);
                        const context = formatContext(entry.max_context_tokens);
                        const isSelected = effectiveSelected?.provider === entry.provider;
                        const tErr =
                          toggleError?.provider === entry.provider ? toggleError.message : null;
                        return (
                          <BodyRow key={entry.provider} $selected={isSelected}>
                            <BodyCell>
                              <ProviderCell>
                                <Avatar aria-hidden="true">
                                  {entry.display_name.charAt(0).toUpperCase() || '?'}
                                </Avatar>
                                <ProviderNameBtn
                                  type="button"
                                  onClick={() => setSelected(isSelected ? null : entry)}
                                  aria-expanded={isSelected}
                                  aria-label={`${entry.display_name} details`}
                                >
                                  <ProviderName>{entry.display_name}</ProviderName>
                                  <SourceLine title={sourceLine(entry)}>
                                    {sourceLine(entry)}
                                  </SourceLine>
                                </ProviderNameBtn>
                              </ProviderCell>
                            </BodyCell>
                            <BodyCell>
                              <DimText>
                                {entry.model_count} {entry.model_count === 1 ? 'model' : 'models'}
                              </DimText>
                            </BodyCell>
                            <BodyCell>
                              {context ? (
                                <PriceText $known>{context}</PriceText>
                              ) : (
                                <Tooltip label="Context window not published for this provider">
                                  <DimText>—</DimText>
                                </Tooltip>
                              )}
                            </BodyCell>
                            <BodyCell>
                              <CapDots>
                                {CAPABILITY_ORDER.map((cap) => (
                                  <CapDot
                                    key={cap}
                                    $on={entry.capabilities.includes(cap)}
                                    title={`${CAPABILITY_LABELS[cap]}: ${
                                      entry.capabilities.includes(cap)
                                        ? 'supported'
                                        : 'not reported'
                                    }`}
                                  >
                                    {CAPABILITY_LABELS[cap]}
                                  </CapDot>
                                ))}
                                {entry.data_quality === 'incomplete' && (
                                  <Tooltip
                                    label={`Catalog incomplete: ${entry.data_quality_reasons.join(
                                      '; ',
                                    )}`}
                                    focusable
                                  >
                                    <IncompleteTag>Incomplete</IncompleteTag>
                                  </Tooltip>
                                )}
                              </CapDots>
                            </BodyCell>
                            <BodyCell>
                              {input.known ? (
                                <PriceText $known>{input.text}</PriceText>
                              ) : (
                                <Tooltip label="Pricing not published for this provider">
                                  <PriceText $known={false}>—</PriceText>
                                </Tooltip>
                              )}
                            </BodyCell>
                            <BodyCell>
                              {output.known ? (
                                <PriceText $known>{output.text}</PriceText>
                              ) : (
                                <Tooltip label="Pricing not published for this provider">
                                  <PriceText $known={false}>—</PriceText>
                                </Tooltip>
                              )}
                            </BodyCell>
                            <BodyCell>
                              <PlanCell entry={entry} />
                            </BodyCell>
                            <BodyCell>
                              <AccessCell
                                entry={entry}
                                pending={pendingProvider === entry.provider}
                                error={tErr}
                                onToggle={handleToggle}
                              />
                            </BodyCell>
                          </BodyRow>
                        );
                      })}
                    </tbody>
                  </StyledTable>
                </TableWrap>
              </SectionBlock>
            ))}

            <CustomRow to="/agent-studio/providers/custom/new">
              <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
              Add a custom endpoint — point a private vLLM, TGI, or Ollama cluster at your
              workspace (Enterprise)
            </CustomRow>

            <Footnote>
              Catalog data is served live from the provider registry — pricing, context windows,
              and capabilities are what providers publish, and rows marked incomplete are missing
              part of that data rather than hiding it. Access toggles apply immediately: disabled
              providers fail closed at publish and run time. The same catalog serves every
              workspace; your plan decides which rows you can switch on.
            </Footnote>
          </CatalogCol>

          <AnimatePresence>
            {effectiveSelected && (
              <ProviderDrawer
                key={effectiveSelected.provider}
                entry={effectiveSelected}
                onClose={() => setSelected(null)}
                onConnectKey={() => {
                  setSelected(null);
                  navigate({ to: '/agent-studio/providers/my-providers' });
                }}
              />
            )}
          </AnimatePresence>
        </Layout>
      )}
    </ViewShell>
  );
}
