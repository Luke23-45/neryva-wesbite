/**
 * Providers — "Models" page (routed; the tab system is retired).
 *
 * Dense list per models-list-reference.svg: MODEL | CAPABILITIES |
 * INPUT/1M | OUTPUT/1M | TIER | USED BY | DEFAULT | ACCESS, grouped under
 * PLATFORM MANAGED and per-credential BYOK sections. The platform table is
 * organized by provider: each provider group opens with a full-width header
 * row ("{provider_display_name} · {n} models") carrying a Show all/Show
 * less expand control — groups render their first 5 models collapsed
 * (header-only organization, no cards; the single table keeps column
 * alignment across groups). Search bypasses collapsing: every match
 * renders in place.
 * The DEFAULT column is a real radio group bound to the N-5
 * `default_model` (optimistic PUT + rollback; 422 → honest toast).
 * All TabModels behavior is preserved: N-6 toggles (optimistic +
 * rollback), blast-radius confirm, tier gating (disabled switch + upgrade
 * CTA, never hidden), usable=false reasons, display-only reasoning presets.
 *
 * Law VII notes: `context_window_tokens` is served by N-5 — when the row
 * carries it the sub-line shows the compact form (128K/1M), otherwise "—";
 * nothing is invented.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { useOrg } from '@/Context/OrgContext';
import { formatUsdPer1M } from '@/sections/pages/products/agent-studio/providers/priceFormat';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { SearchField } from '@components/common/ui/SearchField';
import { Switch } from '@components/common/ui/Switch';
import { StatusPill } from '@components/common/ui/StatusPill';
import { EmptyState } from '@components/common/ui/EmptyState';
import { Tooltip } from '@components/common/ui/Tooltip';
import toast from 'react-hot-toast';
import { Link } from '@tanstack/react-router';
import { BlastRadiusConfirm } from '../components/BlastRadiusConfirm';
import {
  CAPABILITY_LABELS,
  formatContextTokens,
  humanizeReason,
  rowKey,
  useGroupedModels,
  useModelDefault,
  useModelToggles,
  type GroupedModels,
  type ModelGroupView,
  type ModelRowView,
  type Supergroup,
} from '../hooks/useGroupedModels';
import { useOrgTier, tierCovers, type OrgTier } from '../hooks/useOrgTier';
import { useProviderDirectory } from '../hooks/useProviderDirectory';
import { useSpendSummary } from '../hooks/useSpend';
import { isTierGateError } from '../api';
import { shortPlanLabel } from '../lib/plan-labels';

/**
 * `can_enable === false` is a PLAN gate (engine: tierGte(orgTier,
 * requiredTier)) — never a credit gate. "Top up credits" misadvises, so
 * every provider-gated state on this page uses plan-honest copy. The
 * pricing page is the single upgrade destination for both remedies
 * (activate pay-as-you-go, or contact sales for enterprise).
 */
const PLAN_GATE_COPY = 'Your plan doesn\u2019t cover this provider \u2014 upgrade to enable it.';

/** Platform provider groups render this many models before the Show-all control appears. */
const GROUP_COLLAPSED_SIZE = 5;

/* ------------------------------------------------------------------ */
/* Styled                                                              */
/* ------------------------------------------------------------------ */

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

const SearchWrap = styled.div`
  width: 320px;
  max-width: 100%;
`;

const CountLine = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.faint};
  margin-bottom: 16px;
`;

/**
 * Default-model bar: the one place that shows the org default (or its
 * honest absence), the "no longer offered" state for a dangling stored
 * ref, and the Clear affordance the engine's nullable PUT supports.
 */
const DefaultBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
`;

const DefaultBarLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
`;

const DefaultBarValue = styled.span<{ $warning?: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme, $warning }) =>
    $warning ? theme.app.status.warning.fg : theme.app.text.primary};
`;

const ClearDefaultButton = styled.button`
  margin-left: auto;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: 12.5px;
  font-weight: 600;
  padding: 0 12px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
    color: ${({ theme }) => theme.app.text.primary};
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

/** Honest per-section state when a grouped-models sub-read degraded. */
const DegradedNote = styled.p`
  margin: 0 0 12px;
  font-size: 12.5px;
  line-height: 1.5;
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

/**
 * One degraded lane: honest "unavailable" copy plus a retry that refetches
 * the grouped query — every failed sub-read gets a recovery action, never
 * a dead end.
 */
function DegradedLaneNote({
  children,
  onRetry,
}: {
  children: ReactNode;
  onRetry: () => void;
}) {
  return (
    <DegradedNote>
      {children}{' '}
      <RetryButton $compact type="button" onClick={onRetry}>
        Retry
      </RetryButton>
    </DegradedNote>
  );
}

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

const SectionNote = styled.p`
  font-size: 12.5px;
  color: ${({ theme }) => theme.app.text.muted};
  margin: -4px 0 10px;
`;

const CredHead = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.secondary};
  margin: 16px 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Fingerprint = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11.5px;
  color: ${({ theme }) => theme.app.text.faint};
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
  min-width: 680px;
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
  background: ${({ theme }) => theme.app.surface.tint};
  white-space: nowrap;
`;

/**
 * Provider group header (platform table): a full-width divider row that
 * labels the provider section — "{display_name} · {n} models" on the left,
 * the quiet Show all/Show less expand control on the right. Header-only
 * organization (no cards): the single table keeps column alignment across
 * groups. Groups with GROUP_COLLAPSED_SIZE or fewer models render no
 * control.
 */
const GroupHeadRow = styled.tr`
  background: ${({ theme }) => theme.app.surface.tint};
`;

const GroupHeadCell = styled.td`
  padding: 6px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
`;

const GroupHeadInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const GroupHeadLabel = styled.span`
  font-size: 12.5px;
  font-weight: 700;
  color: ${({ theme }) => theme.app.text.secondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const GroupHeadCount = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.faint};
`;

/**
 * The per-provider expand control: a quiet text button (same visual
 * language as ReasoningToggle), keyboard accessible, communicating state
 * via aria-expanded. The chevron rotates on expand.
 */
const ExpandButton = styled.button`
  flex: none;
  border: none;
  background: none;
  padding: 4px 8px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.link};
  cursor: pointer;
  white-space: nowrap;
  border-radius: 8px;
  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.accentControl};
    outline-offset: 2px;
  }
`;

const ExpandChevron = styled.span<{ $open: boolean }>`
  display: inline-flex;
  transition: transform 160ms ease-out;
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** Flat minimal chevron (same icon language as the Dropdown's): decorative, aria-hidden. */
function ExpandChevronIcon({ open }: { open: boolean }) {
  return (
    <ExpandChevron $open={open} aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M3.5 5.25L7 8.75L10.5 5.25"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </ExpandChevron>
  );
}

/**
 * Provider avatar badge (SVG reference): every model row carries its
 * provider mark — initial letter in a rounded square. Decorative only
 * (aria-hidden); the provider second line is the accessible identity.
 */
const ModelCellRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const ProviderAvatar = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.link};
  font-size: 14px;
  font-weight: 700;
`;

/**
 * The DEFAULT column radio: a real <input type="radio"> (keyboard + screen
 * reader semantics), custom-styled to the reference (outer ring, accent dot
 * when checked) via appearance:none — never a native unstyled radio and
 * never a div pretending to be one.
 *
 * 44px invisible hit target via ::before (mirrors the Switch ::after
 * pattern — ::before because ::after renders the checked dot).
 * `$saving` is the in-flight write state: a pulse ring + progress cursor,
 * visually distinct from the policy-disabled dim.
 */
const DefaultRadio = styled.input.attrs({ type: 'radio' })<{ $saving?: boolean }>`
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid ${({ theme }) => theme.app.border.strong};
  background: transparent;
  margin: 0;
  padding: 0;
  cursor: pointer;
  position: relative;
  flex: none;
  vertical-align: middle;
  &::before {
    content: '';
    position: absolute;
    inset: -14px;
  }
  &:checked {
    border-color: ${({ theme }) => theme.app.accentControl};
  }
  &:checked::after {
    content: '';
    position: absolute;
    inset: 0;
    margin: auto;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ theme }) => theme.app.accentControl};
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.accentControl};
    outline-offset: 2px;
  }
  ${({ $saving, theme }) =>
    $saving &&
    css`
      cursor: progress;
      opacity: 1;
      animation: default-saving 1.2s ease-in-out infinite;
      @keyframes default-saving {
        0%,
        100% {
          box-shadow: 0 0 0 0 transparent;
        }
        50% {
          box-shadow: 0 0 0 5px ${theme.app.accentControl}40;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        animation: none;
        box-shadow: 0 0 0 2px ${theme.app.accentControl};
      }
    `}
`;

const BodyCell = styled.td`
  padding: 10px 12px;
  vertical-align: middle;
  color: ${({ theme }) => theme.app.text.primary};
`;

const ModelName = styled.div`
  font-size: 13.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
`;

const ModelId = styled.div`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 11.5px;
  color: ${({ theme }) => theme.app.text.faint};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
`;

const Reasons = styled.ul`
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
`;

const ReasonItem = styled.li`
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.app.status.warning.fg};
  &::before {
    content: '• ';
  }
`;

const CapBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
`;

/* Capability badges: plain text labels, no dots. (The SVG reference showed
   a 7px dot before each label — filled green when present, hollow ring when
   absent — but the owner asked for the dots to be removed.) Labels are 12px:
   secondary for present, faint for absent. */
const MiniBadge = styled.span<{ $present?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme, $present }) =>
    $present === false ? theme.app.text.faint : theme.app.text.secondary};
  white-space: nowrap;
`;

const NoToolsTag = styled(MiniBadge)`
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

const OperatorTag = styled(MiniBadge)`
  color: ${({ theme }) => theme.app.status.info.fg};
`;

const PriceText = styled.span<{ $known: boolean }>`
  color: ${({ theme, $known }) => ($known ? theme.app.text.primary : theme.app.text.faint)};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const DimText = styled.span`
  color: ${({ theme }) => theme.app.text.faint};
  white-space: nowrap;
`;

/**
 * Table body row. Dimmed/pending rows dim their NON-semantic text to the
 * faint tone instead of dropping row opacity: a 0.55 opacity also washes
 * out the warning-colored ReasonItems below AA contrast. Semantic color
 * (reasons, badges, pills, links) always keeps full strength.
 */
const BodyRow = styled.tr<{ $dimmed: boolean; $pending: boolean; $reveal?: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  &:last-child {
    border-bottom: none;
  }
  ${({ $dimmed, $pending, theme }) =>
    ($dimmed || $pending) &&
    css`
      ${ModelName}, ${ModelId}, ${PriceText}, ${DimText} {
        color: ${theme.app.text.faint};
      }
    `}
  /* Rows revealed by a provider-group expand fade in — opacity only
     (transforms on <tr> are unreliable cross-browser). Halted under
     prefers-reduced-motion, matching the page's other motion. */
  ${({ $reveal }) =>
    $reveal &&
    css`
      animation: models-row-reveal 160ms ease-out;
      @keyframes models-row-reveal {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    `}
`;

const UpgradeLink = styled(Link)`
  display: inline-block;
  margin-top: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.link};
  text-decoration: none;
  white-space: nowrap;
  &:hover {
    text-decoration: underline;
  }
`;

const NoCredRow = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
  padding: 14px 16px;
  border: 1px dashed ${({ theme }) => theme.app.border.strong};
  border-radius: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  text-decoration: none;
  font-size: 13px;
  &:hover {
    border-color: ${({ theme }) => theme.app.text.link};
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

const ReasoningToggle = styled.button`
  border: none;
  background: none;
  padding: 0 4px;
  margin-top: 4px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.link};
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;

const ReasoningPanel = styled.div`
  margin-top: 8px;
  border: 1px dashed ${({ theme }) => theme.app.border.default};
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 420px;
`;

const PresetChips = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const PresetChip = styled.span`
  font-size: 11.5px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.faint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 999px;
  padding: 3px 10px;
`;

const HonestCopy = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const BudgetRange = styled.span`
  font-size: 11.5px;
  color: ${({ theme }) => theme.app.text.faint};
  font-variant-numeric: tabular-nums;
`;

const Footnote = styled.p`
  margin: 24px 0 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.faint};
  max-width: 860px;
`;

const ErrorBox = styled.div`
  border: 1px solid ${({ theme }) => theme.app.status.error.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.app.status.error.bg};
  padding: 16px;
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.primary};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const RetryButton = styled.button<{ $compact?: boolean }>`
  flex: none;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.primary};
  font-size: ${({ $compact }) => ($compact ? '12.5px' : '13px')};
  font-weight: 600;
  padding: ${({ $compact }) => ($compact ? '0 12px' : '7px 14px')};
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
  }
`;

const SkeletonWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/**
 * Loading skeleton. Geometry mirrors the loaded page (toolbar search +
 * count line, then table header + body rows) so content doesn't jump, and
 * the pulse halts under prefers-reduced-motion.
 */
const SkeletonBlock = styled.div<{ $h: string; $w?: string }>`
  height: ${({ $h }) => $h};
  width: ${({ $w }) => $w ?? '100%'};
  border-radius: 12px;
  background: ${({ theme }) => theme.app.skeleton.base};
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
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

function formatUsd(v: string): string | null {
  const n = Number.parseFloat(v);
  // One shared price formatter for the section — sub-cent renders as
  // "<$0.01", never "$0.00".
  return Number.isFinite(n) ? formatUsdPer1M(n) : null;
}

/**
 * Whether a row's DEFAULT radio is interactive (enabled + usable +
 * tier-covered; unknown tier stays interactive — the server 422s when the
 * model truly can't serve). Module-level so the checked-row resolution and
 * the per-row disabled state use the identical rule.
 */
function isDefaultableModel(tier: OrgTier, model: ModelRowView): boolean {
  return model.enabled && model.usable && tierCovers(tier, model.required_product) !== false;
}

interface BlastTarget {
  supergroup: Supergroup;
  group: ModelGroupView;
  model: ModelRowView;
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function ModelsPage() {
  const { orgId, role } = useOrg();
  const tier = useOrgTier();
  const { data, isPending, isError, refetch } = useGroupedModels(orgId);
  const toggles = useModelToggles(orgId);
  const defaultMut = useModelDefault(orgId);

  /**
   * Engine truth for the BYOK platform fee — a flat per-call credit charge
   * (fee_config.byok_fee_credits_per_call), never hardcoded in the UI. When
   * the summary hasn't loaded (or fails), the per-row fee suffix is omitted
   * rather than invented.
   */
  const { data: spendData } = useSpendSummary(orgId, '30d');
  const byokFeePerCall = spendData?.fee_config?.byok_fee_credits_per_call;

  /**
   * P1-1: engine model writes (toggles, default) are owner/admin/
   * developer-only — billing and reader get 403. Non-privileged roles see
   * disabled controls plus an honest hint, never interactive controls the
   * server rejects. NOTE: not `atLeast('developer')` — billing shares
   * developer's rank but is excluded from model writes server-side.
   */
  const canWrite = role === 'owner' || role === 'admin' || role === 'developer';

  const [blastTarget, setBlastTarget] = useState<BlastTarget | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [reasoningOpen, setReasoningOpen] = useState<Record<string, boolean>>({});
  const [searchInput, setSearchInput] = useState('');

  /**
   * Per-provider expand state for the platform table (keyed by provider
   * slug). Collapsed groups show the first GROUP_COLLAPSED_SIZE models;
   * expanding reveals the rest. Search bypasses collapsing entirely (all
   * matches render), so this state is only consulted when no query is
   * active — it survives search round-trips (clearing the search restores
   * the previous expand/collapse state).
   */
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});
  const toggleProviderExpanded = useCallback(
    (provider: string) =>
      setExpandedProviders((prev) => ({ ...prev, [provider]: !prev[provider] })),
    [],
  );

  /**
   * Escape in the search field clears the query (and blurs) — scoped to the
   * search field via the wrapper ref so it never closes anything else
   * (Models has no drawer or chips, unlike Catalog). Mirrors Catalog's
   * scoped Escape handling.
   */
  const searchWrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const target = e.target as Node | null;
      // `e.target` can be `window` itself (or another non-Node) when the
      // event is dispatched on window — guard before calling contains().
      if (target instanceof Node && searchWrapRef.current?.contains(target)) {
        setSearchInput('');
        (target as HTMLElement).blur?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const groups: GroupedModels = useMemo(
    () => data ?? { platform: [], byok: [], default_model: null, degraded: [] },
    [data],
  );

  /**
   * Per-read degradation codes from the grouped payload (engine
   * GROUPED_MODEL_DEGRADED_READS). Absent on older engines — default to
   * "nothing degraded" rather than inventing failure.
   */
  const degradedSet = useMemo(() => new Set(groups.degraded ?? []), [groups.degraded]);

  /** Refetch the grouped query — the recovery action for every degraded lane. */
  const retryGrouped = () => void refetch();

  /**
   * Provider-level plan gate from the N-4 directory (`can_enable` per row).
   * The engine computes this from the org's real entitlement state; the
   * grouped-models payload doesn't carry it, so it arrives via the shared
   * directory query cache (no extra request when CatalogPage already
   * fetched it). Absent entry/field = no server signal — the per-model
   * client tier derivation below stays the fallback.
   */
  const directory = useProviderDirectory(orgId);
  const canEnableByProvider = useMemo(() => {
    const map = new Map<string, boolean | undefined>();
    for (const p of directory.data?.providers ?? []) map.set(p.provider, p.can_enable);
    return map;
  }, [directory.data]);

  /**
   * The N-5 `default_model` — null = no default set (never invented).
   * `defaultDangling` is the stored ref matching no catalog row (e.g. the
   * removed mock provider): no radio is checked and the DefaultBar states
   * "Model unavailable — no longer offered" instead of rendering silence.
   */
  const defaultSel = groups.default_model ?? null;

  const defaultDangling = useMemo(() => {
    if (!defaultSel) return false;
    for (const g of [...groups.platform, ...groups.byok]) {
      if (g.provider !== defaultSel.provider) continue;
      if (g.models.some((m) => m.model_id === defaultSel.model_id)) return false;
    }
    return true;
  }, [groups.platform, groups.byok, defaultSel]);

  /** Display name for the DefaultBar — the catalog row's name, else the raw model id. */
  const defaultDisplayName = useMemo(() => {
    if (!defaultSel) return null;
    for (const g of [...groups.platform, ...groups.byok]) {
      if (g.provider !== defaultSel.provider) continue;
      const m = g.models.find((mm) => mm.model_id === defaultSel.model_id);
      if (m) return m.display_name;
    }
    return defaultSel.model_id;
  }, [groups.platform, groups.byok, defaultSel]);

  /**
   * The stored default resolves to catalog row(s) that exist but cannot
   * currently serve as the default (disabled, unusable, or above the org's
   * tier — e.g. a lapsed tier turning a row `subscription_required`).
   * `defaultDangling` covers "no row at all"; without this branch the
   * DefaultBar would present the name as the effective default with no
   * qualification. Uses the same defaultability rule as the row radios.
   */
  const defaultNonServing = useMemo(() => {
    if (!defaultSel || defaultDangling) return false;
    for (const g of [...groups.platform, ...groups.byok]) {
      if (g.provider !== defaultSel.provider) continue;
      for (const m of g.models) {
        if (m.model_id !== defaultSel.model_id) continue;
        if (isDefaultableModel(tier, m)) return false;
      }
    }
    return true;
  }, [groups.platform, groups.byok, defaultSel, defaultDangling, tier]);

  const defaultUnknown = degradedSet.has('default_model');

  const handleDefaultChange = (group: ModelGroupView, model: ModelRowView) => {
    defaultMut.mutate(
      { provider: group.provider, model_id: model.model_id },
      {
        onError: (err) => {
          const status = (err as { status?: number } | null)?.status;
          if (status !== 422) {
            // Machine details stay in the console — the user gets honest copy.
            console.error('[models] default-model PUT failed', err);
          }
          toast.error(
            status === 422
              ? "That model isn't available for your organization — the default was not changed."
              : status === 503
                ? 'Could not verify your saved model settings — the default was not changed. Try again.'
                : 'Could not save the default model — your previous default was restored.',
          );
        },
      },
    );
  };

  /**
   * P1-2: the engine accepts `null` — an org whose stored default is a
   * removed ref (or any stale value) can unset it here.
   */
  const handleClearDefault = () => {
    defaultMut.mutate(null, {
      onError: (err) => {
        console.error('[models] clear default-model failed', err);
        toast.error('Could not clear the default model — your previous default was restored.');
      },
    });
  };

  const q = searchInput.trim().toLowerCase();
  /** Search matches model names/ids AND provider names — never silently narrows past the default. */
  const matches = useCallback(
    (g: ModelGroupView, m: ModelRowView) =>
      q.length === 0 ||
      // A missing display name or model id must never 500 the page — client search degrades to "".
      (m.display_name ?? '').toLowerCase().includes(q) ||
      (m.model_id ?? '').toLowerCase().includes(q) ||
      g.provider.toLowerCase().includes(q) ||
      // A missing display name must never 500 the page — client search degrades to "".
      (g.provider_display_name ?? '').toLowerCase().includes(q),
    [q],
  );

  const platformGroups = useMemo(
    () =>
      groups.platform
        .map((g) => ({ ...g, models: g.models.filter((m) => matches(g, m)) }))
        .filter((g) => g.models.length > 0),
    [groups.platform, matches],
  );
  const byokGroups = useMemo(
    () =>
      groups.byok
        .map((g) => ({ ...g, models: g.models.filter((m) => matches(g, m)) }))
        .filter((g) => g.models.length > 0),
    [groups.byok, matches],
  );

  const total = groups.platform.reduce((n, g) => n + g.models.length, 0) +
    groups.byok.reduce((n, g) => n + g.models.length, 0);
  const shown = platformGroups.reduce((n, g) => n + g.models.length, 0) +
    byokGroups.reduce((n, g) => n + g.models.length, 0);
  /**
   * P1-4: the enabled count is org state, not search state — it derives
   * from the FULL groups so typing in the search box never rewrites it.
   */
  const enabledCount = [...groups.platform, ...groups.byok].reduce(
    (n, g) => n + g.models.filter((m) => m.enabled && m.usable).length,
    0,
  );

  /**
   * The one checked radio: the FIRST usable matching row in display order
   * (platform section renders before BYOK, so platform wins ties; when the
   * platform row can't serve but a BYOK row can, the BYOK row is checked).
   * `default_model` names only provider+model_id, so a model served by both
   * doors matches twice. When no matching row is usable, the first match is
   * still shown checked so the stored server state stays visible (disabled).
   *
   * P1-4: resolved against the FULL groups — search never unchecks the
   * default. When the default row is filtered out, the page keeps the
   * indication via the "hidden by search" note below.
   */
  const defaultRowKey = useMemo(() => {
    if (!defaultSel) return null;
    const matches: Array<{ key: string; usable: boolean }> = [];
    const collect = (supergroup: Supergroup, list: ModelGroupView[]) => {
      for (const g of list) {
        if (g.provider !== defaultSel.provider) continue;
        for (const m of g.models) {
          if (m.model_id !== defaultSel.model_id) continue;
          matches.push({ key: rowKey(supergroup, g, m), usable: isDefaultableModel(tier, m) });
        }
      }
    };
    collect('platform', groups.platform);
    collect('byok', groups.byok);
    if (matches.length === 0) return null;
    return (matches.find((r) => r.usable) ?? matches[0]).key;
  }, [groups.platform, groups.byok, defaultSel, tier]);

  /** True when the checked default row exists but the current search hides it. */
  const defaultHiddenBySearch = useMemo(() => {
    if (!defaultRowKey || q.length === 0) return false;
    const visible = new Set<string>();
    const collect = (supergroup: Supergroup, list: ModelGroupView[]) => {
      for (const g of list) for (const m of g.models) visible.add(rowKey(supergroup, g, m));
    };
    collect('platform', platformGroups);
    collect('byok', byokGroups);
    return !visible.has(defaultRowKey);
  }, [defaultRowKey, platformGroups, byokGroups, q]);

  const commitToggle = (
    supergroup: Supergroup,
    group: ModelGroupView,
    model: ModelRowView,
    enabled: boolean,
  ) => {
    const key = rowKey(supergroup, group, model);
    setPendingKey(key);
    toggles.mutate(
      [
        {
          supergroup,
          provider: group.provider,
          model_id: model.model_id,
          // Nil UUID for platform rows — the api/engine layer applies the
          // sentinel; callers pass undefined for platform per the contract.
          credential_id: supergroup === 'byok' ? group.credential_id : undefined,
          enabled,
        },
      ],
      {
        onError: (err: unknown) => {
          // Machine details stay in the console — the user gets honest copy.
          console.error('[models] toggle POST failed', err);
          if (isTierGateError(err)) {
            // Sanitized nudge copy — never the raw engine message. The gate
            // is plan-based (engine: tierGte), never credit-based.
            toast.error(PLAN_GATE_COPY);
          } else {
            toast.error('Could not save the model toggle — your previous settings were restored.');
          }
        },
        onSettled: () => setPendingKey(null),
      },
    );
  };

  const handleToggle = (
    supergroup: Supergroup,
    group: ModelGroupView,
    model: ModelRowView,
    next: boolean,
  ) => {
    // Guard: enabling while the server says the plan doesn't cover this
    // provider never fires the API — surface the nudge instead.
    if (next && canEnableByProvider.get(group.provider) === false) {
      toast.error(PLAN_GATE_COPY);
      return;
    }
    // Toggle-OFF of a model pinned by a live assistant needs the
    // blast-radius confirm — no silent downgrade (doc 20 §3.3).
    if (!next && model.pinned_by.length > 0) {
      setBlastTarget({ supergroup, group, model });
      return;
    }
    commitToggle(supergroup, group, model, next);
  };

  const toggleReasoning = (key: string) =>
    setReasoningOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderRow = (
    supergroup: Supergroup,
    group: ModelGroupView,
    model: ModelRowView,
    reveal = false,
  ) => {
    const key = rowKey(supergroup, group, model);
    // Provider-level server gate (N-4 `can_enable`) takes precedence; the
    // per-model client tier derivation is the fallback when the server is
    // silent. 'unknown' tier stays indeterminate — the server gates the write.
    const providerGated = canEnableByProvider.get(group.provider) === false;
    const covers = tierCovers(tier, model.required_product);
    const gated = providerGated || covers === false;
    // Invariant: the switch can never render ON alongside a cannot-enable
    // warning. The visual state derives from the same availability object
    // that decides whether the warning row renders (`model.usable`).
    const on = model.enabled && model.usable;
    // Grandfathered: a gated-but-currently-on row stays interactive so the
    // org can always turn it OFF (disabling is never plan-gated). Enabling
    // while gated never fires — see handleToggle's guard.
    const disabled = (gated && !on) || !model.usable;
    // DEFAULT radio: only a defaultable model can become the org default.
    // Unknown tier stays interactive — the server 422s when the model truly
    // can't serve, and the page rolls back with a toast. Non-privileged
    // roles never get an interactive radio (P1-1).
    const defaultable = isDefaultableModel(tier, model);
    const isDefault = defaultRowKey !== null && key === defaultRowKey;
    const isSavingDefault = isDefault && defaultMut.isPending;

    const defaultCell = defaultable ? (
      <DefaultRadio
        name="org-default-model"
        checked={isDefault}
        $saving={isSavingDefault}
        disabled={defaultMut.isPending || !canWrite}
        onChange={() => handleDefaultChange(group, model)}
        aria-label={`Set ${model.display_name} as the default model for new assistants`}
      />
    ) : (
      <Tooltip
        focusable
        label={
          gated
            ? `Requires ${model.required_product_label} for this model to be the default`
            : 'Only enabled, usable models can be the default'
        }
      >
        <span style={{ display: 'inline-block' }}>
          <DefaultRadio
            name="org-default-model"
            checked={isDefault}
            disabled
            onChange={() => undefined}
            aria-label={`${model.display_name} cannot be the default model`}
          />
        </span>
      </Tooltip>
    );

    const inputPrice = model.pricing?.input_per_1m ? formatUsd(model.pricing.input_per_1m) : null;
    const outputPrice = model.pricing?.output_per_1m ? formatUsd(model.pricing.output_per_1m) : null;
    const isOperatorPriced = model.pricing_source === 'operator_declared';

    // BYOK rows disclose the per-call platform fee on the second line, per
    // the SVG reference (`openai · gpt-4o · 128K · billed by OpenAI +5%`).
    // The engine's fee is a flat per-call credit charge — not a percentage —
    // so the row renders engine truth (`+ 2 credits/call`), never the SVG's
    // stale percentage. Unknown fee (summary not loaded) omits the suffix
    // rather than inventing one.
    const feeSuffix =
      supergroup === 'byok' && typeof byokFeePerCall === 'number'
        ? ` · billed by ${group.provider_display_name ?? group.provider} + ${byokFeePerCall} ${byokFeePerCall === 1 ? 'credit' : 'credits'}/call`
        : '';
    const modelSubLine = `${group.provider} · ${model.model_id} · ${formatContextTokens(model.context_window_tokens)}${feeSuffix}`;

    const switchNode = (
      <Switch
        checked={on}
        // In-flight guard (same as the Catalog ACCESS toggle): a switch with a
        // request in flight is not interactive — without this, rapid clicks
        // fire concurrent POSTs whose optimistic updates + rollbacks interleave
        // and the UI flaps between states. Combined with the write gate below.
        disabled={disabled || pendingKey === key || !canWrite}
        onChange={(next) => handleToggle(supergroup, group, model, next)}
        label={`${on ? 'Disable' : 'Enable'} ${model.display_name} (${
          supergroup === 'byok'
            ? `BYOK${group.credential_label ? ` ${group.credential_label}` : ''}`
            : 'platform'
        })`}
      />
    );

    const pricesDegraded = degradedSet.has('cost_points');
    const pinsDegraded = degradedSet.has('model_pins');

    const priceCell = (price: string | null) => {
      if (price) {
        return (
          <PriceText $known>
            {price}
            {isOperatorPriced && <OperatorTag style={{ marginLeft: 6 }}>operator</OperatorTag>}
          </PriceText>
        );
      }
      // BYOK inference is billed directly by the provider — "Direct" is the
      // honest cell when no price is published; platform rows show "—".
      // When the cost-points sub-read degraded, "—" means "could not load",
      // never "not published".
      return supergroup === 'byok' ? (
        <Tooltip focusable label="Billed directly by your provider — no platform price published">
          <DimText>Direct</DimText>
        </Tooltip>
      ) : (
        <Tooltip
          focusable
          label={
            pricesDegraded
              ? 'Pricing could not be loaded — showing no price rather than a stale one'
              : 'Pricing not published for this model'
          }
        >
          <PriceText $known={false}>—</PriceText>
        </Tooltip>
      );
    };

    return (
      <BodyRow key={key} $dimmed={!on} $pending={pendingKey === key} $reveal={reveal}>
        <BodyCell>
          <ModelCellRow>
            <ProviderAvatar aria-hidden="true">
              {((group.provider_display_name ?? '').trim().charAt(0) || '?').toUpperCase()}
            </ProviderAvatar>
            <div>
              <ModelName title={model.display_name}>{model.display_name}</ModelName>
              <ModelId title={modelSubLine}>{modelSubLine}</ModelId>
              {!model.usable && model.reasons.length > 0 && (
                <Reasons aria-label="Why this model cannot be used">
                  {model.reasons.map((r) => (
                    <ReasonItem key={r}>{humanizeReason(r)}</ReasonItem>
                  ))}
                </Reasons>
              )}
              {model.capabilities.reasoning && (
                <div>
                  <ReasoningToggle
                    type="button"
                    onClick={() => toggleReasoning(key)}
                    aria-expanded={reasoningOpen[key] === true}
                  >
                    {reasoningOpen[key] ? 'Hide reasoning presets' : 'Reasoning presets'}
                  </ReasoningToggle>
                  {reasoningOpen[key] && (
                    <ReasoningPanel>
                      <PresetChips aria-label="Reasoning effort presets (display only)">
                        <PresetChip>Fast</PresetChip>
                        <PresetChip>Standard</PresetChip>
                        <PresetChip>Deep reasoning</PresetChip>
                      </PresetChips>
                      <BudgetRange>Thinking budget range: 1,000 – 32,000 tokens</BudgetRange>
                      <HonestCopy>
                        Reasoning effort is set per assistant in the builder — it is stored in
                        model_params.reasoning_budget_tokens and versioned with the assistant
                        snapshot. There is no engine field for an org-wide reasoning default
                        (the toggle endpoint accepts enable/disable only), so this page cannot
                        set it.
                      </HonestCopy>
                    </ReasoningPanel>
                  )}
                </div>
              )}
            </div>
          </ModelCellRow>
        </BodyCell>
        <BodyCell>
          <CapBadges>
            {(Object.keys(CAPABILITY_LABELS) as Array<keyof typeof CAPABILITY_LABELS>).map((cap) => {
              const present = model.capabilities[cap] === true;
              return (
                <MiniBadge key={cap} $present={present}>
                  {CAPABILITY_LABELS[cap]}
                </MiniBadge>
              );
            })}
            {!model.capabilities.tools && (
              <Tooltip focusable label="Models without native tool calling cannot run assistants that use tools">
                <NoToolsTag>No tools</NoToolsTag>
              </Tooltip>
            )}
          </CapBadges>
        </BodyCell>
        <BodyCell>{priceCell(inputPrice)}</BodyCell>
        <BodyCell>{priceCell(outputPrice)}</BodyCell>
        <BodyCell>
          <StatusPill tone={gated ? 'warning' : 'neutral'} dot={false}>
            {shortPlanLabel(model.required_product_label)}
          </StatusPill>
        </BodyCell>
        <BodyCell>
          {pinsDegraded ? (
            <Tooltip focusable label="Could not load usage information">
              <DimText>—</DimText>
            </Tooltip>
          ) : model.pinned_by.length > 0 ? (
            <Tooltip
              focusable
              label={model.pinned_by.map((p) => `${p.assistant_id} (v${p.version})`).join(', ')}
            >
              <DimText>
                {model.pinned_by.length}{' '}
                {model.pinned_by.length === 1 ? 'assistant' : 'assistants'}
              </DimText>
            </Tooltip>
          ) : (
            <DimText>0 assistants</DimText>
          )}
        </BodyCell>
        <BodyCell>{defaultCell}</BodyCell>
        <BodyCell>
          {gated ? (
            <Tooltip
              focusable
              label={providerGated ? PLAN_GATE_COPY : `Requires ${model.required_product_label} plan to enable`}
            >
              <span style={{ display: 'inline-block' }}>{switchNode}</span>
            </Tooltip>
          ) : (
            switchNode
          )}
          {/* One upgrade destination: provider-gated and plan-gated rows
              alike link to the canonical pricing page. The SVG's gated
              example shows "Upgrade →" right-aligned in ACCESS. */}
          {gated && (
            <UpgradeLink to="/agent-studio/settings/pricing">Upgrade →</UpgradeLink>
          )}
        </BodyCell>
      </BodyRow>
    );
  };

  const renderTable = (supergroup: Supergroup, groupList: ModelGroupView[]) => {
    const head = (
      <thead>
        <tr>
          <HeadCell scope="col">Model</HeadCell>
          <HeadCell scope="col">Capabilities</HeadCell>
          <HeadCell scope="col">Input / 1M</HeadCell>
          <HeadCell scope="col">Output / 1M</HeadCell>
          <HeadCell scope="col">Tier</HeadCell>
          <HeadCell scope="col">Used by</HeadCell>
          <HeadCell scope="col">Default</HeadCell>
          <HeadCell scope="col">Access</HeadCell>
        </tr>
      </thead>
    );
    // ONE table for the section; one <tbody> per provider group. Each group
    // opens with its full-width header row (provider label + Show all/Show
    // less control), then the group's model rows — collapsed to the first
    // GROUP_COLLAPSED_SIZE unless expanded. A search bypasses collapsing:
    // every match renders in place with no expand control. Row-level
    // provider identity (avatar + provider second line) is retained.
    if (supergroup === 'platform') {
      const searching = q.length > 0;
      return (
        <TableWrap>
          <StyledTable>
            {head}
            {groupList.map((group) => {
              const expandable = !searching && group.models.length > GROUP_COLLAPSED_SIZE;
              const expanded = searching || expandedProviders[group.provider] === true;
              const visible =
                expandable && !expanded
                  ? group.models.slice(0, GROUP_COLLAPSED_SIZE)
                  : group.models;
              const modelWord = group.models.length === 1 ? 'model' : 'models';
              return (
                <tbody key={group.provider}>
                  <GroupHeadRow>
                    <GroupHeadCell colSpan={8}>
                      <GroupHeadInner>
                        <GroupHeadLabel>
                          {(group.provider_display_name?.trim() || group.provider)}{' '}
                          <GroupHeadCount>
                            · {group.models.length} {modelWord}
                          </GroupHeadCount>
                        </GroupHeadLabel>
                        {expandable && (
                          <ExpandButton
                            type="button"
                            aria-expanded={expanded}
                            onClick={() => toggleProviderExpanded(group.provider)}
                          >
                            {expanded ? 'Show less' : `Show all ${group.models.length}`}
                            <ExpandChevronIcon open={expanded} />
                          </ExpandButton>
                        )}
                      </GroupHeadInner>
                    </GroupHeadCell>
                  </GroupHeadRow>
                  {visible.map((m, i) =>
                    renderRow(
                      supergroup,
                      group,
                      m,
                      expanded && !searching && i >= GROUP_COLLAPSED_SIZE,
                    ),
                  )}
                </tbody>
              );
            })}
          </StyledTable>
        </TableWrap>
      );
    }
    // BYOK: one table per credential under its credential header (a credential
    // serves exactly one provider, so a provider sub-header inside would be
    // pure redundancy).
    return (
      <>
        {groupList.map((group) => (
          <div key={`byok:${group.provider}:${group.credential_id ?? 'platform'}`}>
            <CredHead>
              BYOK · {group.credential_label || group.provider_display_name}
              {group.credential_fingerprint && (
                <Fingerprint>{group.credential_fingerprint}</Fingerprint>
              )}
            </CredHead>
            <TableWrap>
              <StyledTable>
                {head}
                <tbody>{group.models.map((m) => renderRow(supergroup, group, m))}</tbody>
              </StyledTable>
            </TableWrap>
          </div>
        ))}
      </>
    );
  };

  if (isPending) {
    return (
      <ViewShell>
        <ViewHeader>
          <ViewTitle>Models</ViewTitle>
          <ViewSubtitle>Turn models on or off for your organization.</ViewSubtitle>
        </ViewHeader>
        <SkeletonWrap role="status" aria-label="Loading models">
          {/* Toolbar mirror: search field + count line. */}
          <SkeletonBlock $h="36px" $w="320px" aria-hidden="true" />
          <SkeletonBlock $h="14px" $w="240px" aria-hidden="true" />
          {/* Table mirror: header row + body rows. */}
          <SkeletonBlock $h="41px" aria-hidden="true" />
          <SkeletonBlock $h="64px" aria-hidden="true" />
          <SkeletonBlock $h="64px" aria-hidden="true" />
          <SkeletonBlock $h="64px" aria-hidden="true" />
        </SkeletonWrap>
      </ViewShell>
    );
  }

  if (isError) {
    return (
      <ViewShell>
        <ViewHeader>
          <ViewTitle>Models</ViewTitle>
          <ViewSubtitle>Turn models on or off for your organization.</ViewSubtitle>
        </ViewHeader>
        <ErrorBox role="alert">
          <span>Could not load the model catalog. Check your connection and try again.</span>
          <RetryButton type="button" onClick={() => void refetch()}>
            Retry
          </RetryButton>
        </ErrorBox>
      </ViewShell>
    );
  }

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>Models</ViewTitle>
        <ViewSubtitle>
          Turn models on or off for your organization — platform and BYOK sources are listed
          separately.
        </ViewSubtitle>
      </ViewHeader>

      <Toolbar>
        <SearchWrap ref={searchWrapRef}>
          <SearchField
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search models…"
            ariaLabel="Search models"
          />
        </SearchWrap>
      </Toolbar>
      <CountLine>
        {shown} of {total} {total === 1 ? 'model' : 'models'} · {enabledCount} enabled
      </CountLine>

      {!canWrite && (
        <SectionNote>Only owners, admins and developers can change models.</SectionNote>
      )}

      {defaultHiddenBySearch && (
        <SectionNote>The default model is hidden by the current search.</SectionNote>
      )}

      <DefaultBar role="region" aria-label="Default model for new assistants">
        <DefaultBarLabel>Default for new assistants</DefaultBarLabel>
        {defaultUnknown ? (
          <>
            <DefaultBarValue $warning>Could not load the default model.</DefaultBarValue>
            <RetryButton
              $compact
              type="button"
              onClick={retryGrouped}
              style={{ marginLeft: 'auto' }}
            >
              Retry
            </RetryButton>
          </>
        ) : defaultSel == null ? (
          <DefaultBarValue>No default set</DefaultBarValue>
        ) : defaultDangling ? (
          <DefaultBarValue $warning>
            Model unavailable — no longer offered ({defaultSel.provider} / {defaultSel.model_id})
          </DefaultBarValue>
        ) : defaultNonServing ? (
          <DefaultBarValue $warning>
            {defaultDisplayName} — can't currently serve (check availability or plan)
          </DefaultBarValue>
        ) : (
          <DefaultBarValue>{defaultDisplayName}</DefaultBarValue>
        )}
        {canWrite && !defaultUnknown && defaultSel != null && (
          <ClearDefaultButton
            type="button"
            onClick={handleClearDefault}
            disabled={defaultMut.isPending}
          >
            {defaultMut.isPending ? 'Clearing…' : 'Clear default'}
          </ClearDefaultButton>
        )}
      </DefaultBar>

      {degradedSet.has('model_toggles') && (
        <DegradedLaneNote onRetry={retryGrouped}>
          Could not load your saved toggles — switches show defaults until the load succeeds.
        </DegradedLaneNote>
      )}
      {degradedSet.has('provider_enablements') && (
        <DegradedLaneNote onRetry={retryGrouped}>
          Could not load provider enablement — rows may show as enabled until the load succeeds.
        </DegradedLaneNote>
      )}
      {degradedSet.has('credentials') && (
        <DegradedLaneNote onRetry={retryGrouped}>
          Could not load your connected credentials — the BYOK section may be incomplete.
        </DegradedLaneNote>
      )}
      {degradedSet.has('provider_facts') && (
        <DegradedLaneNote onRetry={retryGrouped}>
          Could not verify provider status — models are shown as unavailable until the check
          succeeds.
        </DegradedLaneNote>
      )}
      {degradedSet.has('cost_points') && (
        <DegradedLaneNote onRetry={retryGrouped}>
          Could not load pricing — prices are hidden rather than shown stale.
        </DegradedLaneNote>
      )}
      {degradedSet.has('model_pins') && (
        <DegradedLaneNote onRetry={retryGrouped}>
          Could not load usage information — the "Used by" column is hidden until the
          load succeeds.
        </DegradedLaneNote>
      )}

      {shown === 0 ? (
        <>
          <EmptyState
            title={q ? 'No models match this search' : 'No models available'}
            description={
              q
                ? 'Try a different search term.'
                : 'The catalog returned no models for this workspace.'
            }
          />
          {!q && (
            <NoCredRow to="/agent-studio/providers/my-providers">
              Connect a key in My Providers →
            </NoCredRow>
          )}
        </>
      ) : (
        <>
          {platformGroups.length > 0 && (
            <SectionBlock aria-label="Platform Managed">
              <SectionHead>
                <SectionTitle>Platform Managed</SectionTitle>
                <SectionCount>
                  {platformGroups.reduce((n, g) => n + g.models.length, 0)} models
                </SectionCount>
              </SectionHead>
              <SectionNote>
                Neryva-operated pool — inference is billed to your plan credits.
              </SectionNote>
              {renderTable('platform', platformGroups)}
            </SectionBlock>
          )}

          <SectionBlock aria-label="BYOK and custom endpoints">
            <SectionHead>
              <SectionTitle>BYOK · your keys</SectionTitle>
              <SectionCount>
                {byokGroups.reduce((n, g) => n + g.models.length, 0)} models
              </SectionCount>
            </SectionHead>
            <SectionNote>
              Your own keys — inference is billed directly by the provider, plus the platform fee.
            </SectionNote>
            {byokGroups.length > 0 ? (
              renderTable('byok', byokGroups)
            ) : degradedSet.has('credentials') ? (
              <DegradedLaneNote onRetry={retryGrouped}>
                Could not load your connected credentials — check your connection and try again.
              </DegradedLaneNote>
            ) : (
              <EmptyState
                title="No connected credentials"
                description="Connect a key to see its discovered models here."
              />
            )}
            <NoCredRow to="/agent-studio/providers/my-providers">
              {byokGroups.length > 0
                ? 'Connect another key in My Providers →'
                : 'No other connected credentials — connect a key in My Providers →'}
            </NoCredRow>
          </SectionBlock>

          <Footnote>
            Toggles apply immediately · disabled models fail closed at publish and run time ·
            the default applies to new assistants
          </Footnote>
        </>
      )}

      {blastTarget && (
        <BlastRadiusConfirm
          affected={blastTarget.model.pinned_by}
          actionLabel={`Disable ${blastTarget.model.display_name}`}
          onConfirm={() => {
            const t = blastTarget;
            setBlastTarget(null);
            commitToggle(t.supergroup, t.group, t.model, false);
          }}
          onCancel={() => setBlastTarget(null)}
        />
      )}
    </ViewShell>
  );
}
