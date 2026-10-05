import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Eye, ListFilter, Plus, Shield, X, Zap } from 'lucide-react';
import { useOrg } from '@/Context/OrgContext';
import { formatUsdPer1M } from '@/sections/pages/products/agent-studio/providers/priceFormat';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { SearchField } from '@components/common/ui/SearchField';
import { Switch } from '@components/common/ui/Switch';
import { StatusPill } from '@components/common/ui/StatusPill';
import { EmptyState } from '@components/common/ui/EmptyState';
import { Tooltip } from '@components/common/ui/Tooltip';
import type {
  OrgModelTier,
  ProviderDirectoryCapability,
  ProviderDirectoryEntry,
} from '../api';
import {
  TIER_GATE_NUDGE,
  TIER_GATE_NUDGE_SHORT,
  isTierGateError,
} from '../api';
import { useOrgTier, tierCovers } from '../hooks/useOrgTier';
import { useProviderDirectory } from '../hooks/useProviderDirectory';
import { useSetProviderEnabled } from '../hooks/useProviderEnablement';

/* ------------------------------------------------------------------ */
/* Pure helpers (exported for tests)                                   */
/* ------------------------------------------------------------------ */

export type ChipKey = 'tools' | 'vision' | 'price' | 'zdr';

export const CHIPS: Array<{ key: ChipKey; label: string; icon: React.ReactNode }> = [
  { key: 'tools', label: 'Needs Tools', icon: <Zap size={13} strokeWidth={1.8} aria-hidden="true" /> },
  { key: 'vision', label: 'Needs Vision', icon: <Eye size={13} strokeWidth={1.8} aria-hidden="true" /> },
  {
    key: 'price',
    label: 'Price < $1/1M',
    icon: (
      <span aria-hidden="true" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>
        $
      </span>
    ),
  },
  { key: 'zdr', label: 'ZDR Capable', icon: <Shield size={13} strokeWidth={1.8} aria-hidden="true" /> },
];

/** Raw USD/1M input price as a number (the engine passes prices through unrounded). */
function fromPrice(entry: ProviderDirectoryEntry): number | null {
  return typeof entry.from_price_per_1m === 'number' && Number.isFinite(entry.from_price_per_1m)
    ? entry.from_price_per_1m
    : null;
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
    // ZDR chip: only staff-attested rows (zdr_capable === true) are shown.
    // Absent zdr_capable means "not attested", NOT "unknown but honest" —
    // a "ZDR Capable" filter must never present an unattested row. Rows with
    // absent zdr_capable appear normally when the chip is off.
    if (chips.has('zdr') && p.zdr_capable !== true) return false;
    return true;
  });
}

/**
 * Transport label. The registry's transport values are already display
 * labels ('OpenAI-compatible', 'Anthropic', …) — this only trims and
 * passes through, returning null for empty input. The old slug map
 * ('openai-compatible' → 'OpenAI-Compatible', …) is gone: no registry
 * value ever matched its keys.
 */
export function transportLabel(transport?: string): string | null {
  const t = transport?.trim();
  return t ? t : null;
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
    // SVG 2026-10-05: "Production key · sk-…9f2c" (no BYOK prefix)
    return fp ? `${label} · ${fp}` : label;
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

/**
 * Pricing cell vocabulary. Returns { text, known } — known=false means the
 * value is missing, never zero. Prices arrive as raw USD/1M numbers and go
 * through the section's one shared formatter: a known price under one cent
 * renders as "<$0.01" — never "$0.00", which would read as free.
 */
export function priceCell(
  price: number | undefined,
  pricingMode: ProviderDirectoryEntry['pricing_mode'],
): { text: string; known: boolean } {
  if (pricingMode === 'varies') return { text: 'Varies', known: true };
  if (pricingMode === 'custom') return { text: 'Custom', known: true };
  if (pricingMode === 'pass_through') return { text: 'Pass-through', known: true };
  if (price === undefined || price === null || !Number.isFinite(price)) return { text: '—', known: false };
  return { text: formatUsdPer1M(price), known: true };
}

/**
 * Humanize a `data_quality_reasons` code for the drawer completeness
 * block. Raw codes (metadata_snapshot_missing) and raw ISO timestamps
 * never reach the user verbatim; timestamps render as dates. Unknown
 * codes pass through unchanged — never invent copy for a code we don't
 * recognize.
 */
export function humanizeDataQualityReason(reason: string): string {
  switch (reason) {
    case 'metadata_snapshot_missing':
      return 'model data not yet published for this provider';
    case 'metadata_refresh_failing':
      return 'model data refresh is failing';
    case 'no_models_in_snapshot':
      return 'no models listed in the published data';
    case 'capabilities_unknown':
      return 'capabilities not published';
    case 'pricing_unknown':
      return 'pricing not published';
    case 'context_unknown':
      return 'context window not published';
    default: {
      const stale = reason.match(/^metadata_snapshot_stale_since_(.+)$/);
      if (stale) {
        const raw = stale[1];
        const d = new Date(raw);
        const when = Number.isNaN(d.getTime())
          ? raw
          : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        return `model data is stale (last updated ${when})`;
      }
      return reason;
    }
  }
}

/* ------------------------------------------------------------------ */
/* Styled                                                              */
/* ------------------------------------------------------------------ */

const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
`;

const ToolbarRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const SearchWrap = styled.div`
  width: 320px;
  max-width: 100%;
  @media (max-width: 900px) {
    width: 100%;
  }
`;

const FiltersButton = styled.button`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  /* 44px hit target, visual-neutral. */
  &::after {
    content: '';
    position: absolute;
    inset: -4px;
  }
  &:hover {
    border-color: ${({ theme }) => theme.app.border.strong};
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

const FilterBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: ${({ theme }) => theme.app.text.link};
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
`;

const ChipBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const Chip = styled.button<{ $active: boolean }>`
  position: relative;
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
  /* 44px hit target, visual-neutral — the visible chip stays 32px. */
  &::after {
    content: '';
    position: absolute;
    inset: -6px;
  }
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

const TableWrap = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  background: ${({ theme }) => theme.app.surface.subtle};
`;

const StyledTable = styled.table`
  width: 100%;
  min-width: 620px;
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
  position: relative;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  min-width: 0;
  /* 44px vertical hit target, visual-neutral. */
  &::after {
    content: '';
    position: absolute;
    inset: -10px 0;
  }
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

const DimText = styled.span`
  color: ${({ theme }) => theme.app.text.faint};
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

/**
 * Tier-gate nudge: inline link (never a modal) shown when the org's plan
 * doesn't cover a provider. Flat link styling, consistent with UpgradeLink.
 */
const TierNudge = styled(Link)`
  font-size: 12.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.link};
  text-decoration: none;
  white-space: nowrap;
  &:hover {
    text-decoration: underline;
  }
`;

const GatedAccess = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 10px;
`;

const CustomRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  text-decoration: none;
  &:hover {
    border-color: ${({ theme }) => theme.app.text.link};
  }
`;

const CustomIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.app.text.link};
  color: ${({ theme }) => theme.app.text.link};
  flex-shrink: 0;
`;

const CustomText = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`;

const CustomTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const CustomSub = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.faint};
`;

const GuidedSetup = styled.span`
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.app.text.link};
  background: ${({ theme }) => theme.app.status.info.bg};
  color: ${({ theme }) => theme.app.text.link};
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
`;

const Footnote = styled.p`
  margin: 24px 0 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.faint};
  max-width: 860px;
`;

const SectionNote = styled.p`
  font-size: 12.5px;
  color: ${({ theme }) => theme.app.text.muted};
  margin: 0 0 12px;
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
  position: relative;
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  /* 44px hit target, visual-neutral. */
  &::after {
    content: '';
    position: absolute;
    inset: -5px;
  }
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
  /* Programmatic focus target on open (tabIndex=-1) — never in the tab
     order, so no focus ring. */
  &:focus {
    outline: none;
  }
  @media (max-width: 900px) {
    width: 100%;
    position: static;
    max-height: none;
  }
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
  position: relative;
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
  /* 44px hit target, visual-neutral. */
  &::after {
    content: '';
    position: absolute;
    inset: -7px;
  }
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
  position: relative;
  background: none;
  border: none;
  padding: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.link};
  cursor: pointer;
  /* 44px vertical hit target, visual-neutral. */
  &::after {
    content: '';
    position: absolute;
    inset: -12px -6px;
  }
  &:hover {
    text-decoration: underline;
  }
`;

const Layout = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  @media (max-width: 900px) {
    flex-direction: column;
  }
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
  // Row-anchored mount: the drawer mounts at the top of the Layout while
  // the user's viewport may be far below (e.g. OpenRouter at the bottom).
  // `position: sticky` only keeps a *visible* element in view — it can't
  // teleport an off-screen element into view. So on mount we measure the
  // selected row's offset inside the Layout and start the panel there;
  // sticky handles every scroll after that. No scroll listener needed.
  const panelRef = useRef<HTMLElement>(null);
  const [anchorTop, setAnchorTop] = useState(0);
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const layout = panel?.parentElement;
    if (!panel || !layout) return;
    const measure = () => {
      // Narrow viewports stack the panel below the table (see the Layout /
      // DetailPanel media queries) — no row anchoring there.
      if (window.innerWidth <= 900) {
        setAnchorTop(0);
        return;
      }
      const row = layout.querySelector<HTMLElement>(
        `[data-provider-id="${CSS.escape(entry.provider)}"]`,
      );
      if (!row) return;
      const offset =
        row.getBoundingClientRect().top - layout.getBoundingClientRect().top;
      // Never overflow the Layout's bottom edge — sticky pulls it back anyway,
      // but clamping keeps the first paint honest.
      const maxTop = Math.max(0, layout.offsetHeight - panel.offsetHeight - 16);
      setAnchorTop(Math.min(Math.max(0, offset), maxTop));
    };
    measure();
    // The anchor goes stale when the viewport resizes (rows reflow) or the
    // row order changes — re-measure on both. `entry` in deps re-anchors
    // when the refetched row data lands.
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [entry.provider, entry]);

  // Drawer focus management. The panel is a persistent complementary region
  // (not a modal) — the table stays interactive behind it — so the trap is
  // scoped to the panel itself: on open, focus moves into the panel; while
  // focus is inside, Tab wraps at the panel's edges; Escape closes (handled
  // by the page-level listener); the page returns focus to the row's details
  // button on close. Motion on this panel is covered by the app-level
  // MotionConfig reducedMotion="user".
  useLayoutEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, [entry.provider]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const items = [
        ...panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((el) => el.getClientRects().length > 0);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [entry.provider]);

  return (
    <DetailPanel
      ref={panelRef}
      tabIndex={-1}
      style={{ marginTop: anchorTop }}
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
                <li key={r}>{humanizeDataQualityReason(r)}</li>
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

/** Client mirror of the engine's `effectiveEnableTier`: the enable requirement floors at 'payg'. */
export function effectiveEnableTier(minRequired: OrgModelTier): 'payg' | 'enterprise' {
  // 'free' floors to 'payg' — the PAYG floor. The ternary's true-branch is
  // only reachable for 'payg' | 'enterprise', which the cast records.
  return minRequired === 'free' ? 'payg' : (minRequired as 'payg' | 'enterprise');
}

const EFFECTIVE_TIER_LABELS: Record<'payg' | 'enterprise', string> = {
  payg: 'Pay-as-you-go',
  enterprise: 'Enterprise',
};

function PlanCell({ entry }: { entry: ProviderDirectoryEntry }) {
  const tier = useOrgTier();
  // The engine floors the enable requirement at 'payg' (effectiveEnableTier)
  // — a 'free' row minimum must never render as "Included" again; that copy
  // contradicts the PAYG floor and is a contract-drift trap. The label
  // follows the floored tier so the pill can never contradict the gate.
  const required = effectiveEnableTier(entry.min_required_product);
  const coverage = tierCovers(tier, required);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <StatusPill tone={coverage === false ? 'warning' : 'info'} dot={false}>
        {coverage === false
          ? required === 'enterprise'
            ? 'Requires Ent.'
            : 'Requires PAYG'
          : EFFECTIVE_TIER_LABELS[required]}
      </StatusPill>
    </span>
  );
}

export interface AccessToggleError {
  message: string;
  /** True when the failure was the plan gate (402) — render the nudge, not the warning icon. */
  tierGated: boolean;
}

function AccessCell({
  entry,
  pending,
  error,
  canWrite,
  onToggle,
}: {
  entry: ProviderDirectoryEntry;
  pending: boolean;
  error: AccessToggleError | null;
  canWrite: boolean;
  onToggle: (entry: ProviderDirectoryEntry, enabled: boolean) => void;
}) {
  const tier = useOrgTier();
  // The switch renders from the STORED toggle — never the tier-anded
  // `enabled` — so a lapsed-tier org with a grandfathered ON row still sees
  // a checked, interactive switch and can always turn it OFF. Turning OFF
  // always fires (the engine accepts it); turning ON when the plan doesn't
  // cover shows the tier nudge instead of firing (see handleToggle).
  const storedOn = entry.connection.stored_enabled ?? entry.connection.enabled;
  const label = `${storedOn ? 'Disable' : 'Enable'} ${entry.display_name} for this workspace`;
  // Server is authoritative when it speaks: can_enable === false means the
  // org's plan doesn't cover this provider. Absent (older engine) falls
  // back to the client tier derivation — existing behavior, untouched.
  const serverGated = entry.can_enable === false;

  if (serverGated) {
    return (
      <GatedAccess>
        <Tooltip
          label={
            storedOn
              ? 'this provider is still on from your previous plan — turn it off to remove access'
              : TIER_GATE_NUDGE
          }
          focusable
          wrap
        >
          <span style={{ display: 'inline-block' }}>
            <Switch
              checked={storedOn}
              onChange={(next) => onToggle(entry, next)}
              label={label}
              // Grandfathered ON stays interactive so the org can always
              // turn it OFF; OFF is disabled — enabling is plan-gated.
              // canWrite gates everything: non-privileged roles see a
              // disabled switch, never an interactive one the server 403s.
              disabled={pending || !storedOn || !canWrite}
            />
          </span>
        </Tooltip>
        <TierNudge to="/agent-studio/settings/pricing">{TIER_GATE_NUDGE_SHORT}</TierNudge>
      </GatedAccess>
    );
  }

  if (entry.can_enable === true) {
    // Server says the plan covers this provider: the switch is always
    // visible. The client tier is stale the moment it disagrees — it only
    // feeds nudge copy elsewhere, never switch visibility.
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <Switch
          checked={storedOn}
          onChange={(next) => onToggle(entry, next)}
          label={label}
          disabled={pending || !canWrite}
        />
        {error &&
          (error.tierGated ? (
            <TierNudge to="/agent-studio/settings/pricing">{TIER_GATE_NUDGE_SHORT}</TierNudge>
          ) : (
            // focusable: the failure explanation is otherwise invisible to
            // keyboard users — the icon is decorative to the tab order.
            <Tooltip label={error.message} focusable>
              <DimText role="img" aria-label={`Toggle failed: ${error.message}`}>
                <AlertTriangle size={14} aria-hidden="true" />
              </DimText>
            </Tooltip>
          ))}
      </span>
    );
  }

  const coverage = tierCovers(tier, effectiveEnableTier(entry.min_required_product));
  if (coverage === false) {
    return <UpgradeLink to="/agent-studio/settings/pricing">Upgrade →</UpgradeLink>;
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <Switch
        checked={storedOn}
        onChange={(next) => onToggle(entry, next)}
        label={label}
        disabled={pending || !canWrite}
      />
      {error &&
        (error.tierGated ? (
          <TierNudge to="/agent-studio/settings/pricing">{TIER_GATE_NUDGE_SHORT}</TierNudge>
        ) : (
          // focusable: the failure explanation is otherwise invisible to
          // keyboard users — the icon is decorative to the tab order.
          <Tooltip label={error.message} focusable>
            <DimText role="img" aria-label={`Toggle failed: ${error.message}`}>
              <AlertTriangle size={14} aria-hidden="true" />
            </DimText>
          </Tooltip>
        ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function CatalogPage() {
  const { orgId, role } = useOrg();
  const navigate = useNavigate();
  const { returnTo } = useSearch({ strict: false }) as { returnTo?: unknown };
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [chips, setChips] = useState<Set<ChipKey>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [selected, setSelected] = useState<ProviderDirectoryEntry | null>(null);
  const [toggleError, setToggleError] = useState<
    ({ provider: string } & AccessToggleError) | null
  >(null);

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
  // drawer closes — derived during render, not in an effect. The selection
  // is re-matched against the refetched row so the drawer never shows
  // stale facts after a background refetch (toggle, polling, refocus).
  const effectiveSelected = selected
    ? (filtered.find((p) => p.provider === selected.provider) ?? null)
    : null;

  // Escape in the search field clears the query (and blurs) — it must not
  // close the detail drawer while the user is filtering. Escape anywhere
  // else closes the drawer.
  const searchWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const target = e.target as Node | null;
      // `e.target` can be `window` itself (or another non-Node) when the
      // event is dispatched on window — guard before calling contains().
      if (target instanceof Node && searchWrapRef.current?.contains(target)) {
        setSearchInput('');
        setSearch('');
        setChips(new Set());
        (target as HTMLElement).blur?.();
        return;
      }
      setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Return focus to the row's details button when the drawer closes — a
  // keyboard user who opened it with Enter lands back where they started.
  // If the row is gone (filtered out), the lookup no-ops honestly.
  const lastDrawerProvider = useRef<string | null>(null);
  useEffect(() => {
    if (effectiveSelected) {
      lastDrawerProvider.current = effectiveSelected.provider;
      return;
    }
    const provider = lastDrawerProvider.current;
    lastDrawerProvider.current = null;
    if (!provider) return;
    document
      .querySelector<HTMLElement>(`[data-provider-id="${CSS.escape(provider)}"]`)
      ?.querySelector<HTMLElement>('button[aria-label$=" details"]')
      ?.focus({ preventScroll: true });
  }, [effectiveSelected]);

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

  /**
   * The engine's POST providers/:provider is owner/admin-only — reader,
   * billing, and developer get 403. Non-privileged roles see disabled
   * switches plus an honest hint, never interactive controls the server
   * rejects. NOTE: not `role === 'owner' || ... 'developer'` — the Models
   * endpoints accept developers but this one does not, so the threshold is
   * owner/admin only here.
   */
  const canWrite = role === 'owner' || role === 'admin';

  const handleToggle = (entry: ProviderDirectoryEntry, enabled: boolean) => {
    // Guard: enabling while the server says the plan doesn't cover this
    // provider never fires the API — surface the nudge instead.
    if (enabled && entry.can_enable === false) {
      setToggleError({
        provider: entry.provider,
        message: TIER_GATE_NUDGE,
        tierGated: true,
      });
      return;
    }
    setToggleError(null);
    setEnabled.mutate(
      { provider: entry.provider, enabled },
      {
        onError: (err: unknown) => {
          if (isTierGateError(err)) {
            // Sanitized nudge copy — never the raw engine message.
            setToggleError({
              provider: entry.provider,
              message: TIER_GATE_NUDGE,
              tierGated: true,
            });
          } else {
            setToggleError({
              provider: entry.provider,
              message: 'Could not change provider access. Please try again.',
              tierGated: false,
            });
          }
        },
      },
    );
  };

  const filterActive = searchInput.trim().length > 0 || chips.size > 0;
  const totalModels = filtered.reduce((n, p) => n + p.model_count, 0);
  // Propagate the "+" from approximate labels (e.g. "300+") so the header
  // reads "416+ models" instead of a false exact "416 models".
  const totalModelsApprox = filtered.some((p) => p.model_count_label?.includes('+'));

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
        <ToolbarRow>
          <SearchWrap ref={searchWrapRef}>
            <SearchField
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search providers, models…"
              ariaLabel="Search providers"
            />
          </SearchWrap>
          <FiltersButton
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-label={`Filters${chips.size > 0 ? `, ${chips.size} active` : ''}`}
          >
            <ListFilter size={14} strokeWidth={1.8} aria-hidden="true" />
            Filters
            {chips.size > 0 && <FilterBadge>{chips.size}</FilterBadge>}
          </FiltersButton>
        </ToolbarRow>
        {showFilters && (
          <ChipBar role="group" aria-label="Catalog filters">
          {CHIPS.map(({ key, label, icon }) => (
            <Chip
              key={key}
              type="button"
              $active={chips.has(key)}
              aria-pressed={chips.has(key)}
              onClick={() => toggleChip(key)}
            >
              {icon}
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
        )}
      </Toolbar>

      {!canWrite && (
        <SectionNote>Only owners and admins can change provider access.</SectionNote>
      )}

      {query.isLoading ? (
        <>
          <ResultMeta role="status">Loading the provider catalog…</ResultMeta>
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
              {filtered.length} {filtered.length === 1 ? 'provider' : 'providers'} · {totalModels}
              {totalModelsApprox ? '+' : ''} {totalModels === 1 && !totalModelsApprox ? 'model' : 'models'}
            </ResultMeta>
            {sections.map((section) => (
              <SectionBlock key={section.key}>
                <SectionHead>
                  <SectionTitle>
                    {section.key} · {section.providers.length}
                  </SectionTitle>
                </SectionHead>
                <TableWrap>
                  <StyledTable>
                    <thead>
                      <tr>
                        <HeadCell scope="col">Provider</HeadCell>
                        <HeadCell scope="col">Models</HeadCell>
                        <HeadCell scope="col">Plan</HeadCell>
                        <HeadCell scope="col">Access</HeadCell>
                      </tr>
                    </thead>
                    <tbody>
                      {section.providers.map((entry) => {
                        const isSelected = effectiveSelected?.provider === entry.provider;
                        const tErr =
                          toggleError?.provider === entry.provider ? toggleError : null;
                        return (
                          <BodyRow
                            key={entry.provider}
                            $selected={isSelected}
                            data-provider-id={entry.provider}
                          >
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
                                {entry.model_count_label ?? entry.model_count}{' '}
                                {entry.model_count === 1 ? 'model' : 'models'}
                              </DimText>
                            </BodyCell>
                            <BodyCell>
                              <PlanCell entry={entry} />
                            </BodyCell>
                            <BodyCell>
                              <AccessCell
                                entry={entry}
                                pending={pendingProvider === entry.provider}
                                error={tErr}
                                canWrite={canWrite}
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
              <CustomIcon>
                <Plus size={14} strokeWidth={2} aria-hidden="true" />
              </CustomIcon>
              <CustomText>
                <CustomTitle>Connect custom endpoint</CustomTitle>
                <CustomSub>Enterprise · vLLM, TGI, or Ollama with egress controls</CustomSub>
              </CustomText>
              <GuidedSetup>Guided setup</GuidedSetup>
            </CustomRow>

            <Footnote>
              ZDR = zero data retention · prices per 1M tokens (input / output) · catalog is
              shared; your plan governs what can be enabled
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
