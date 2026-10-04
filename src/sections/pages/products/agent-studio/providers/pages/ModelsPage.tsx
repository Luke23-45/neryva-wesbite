/**
 * Providers — "Models" page (routed; the tab system is retired).
 *
 * Dense list per models-list-reference.svg: MODEL | CAPABILITIES |
 * INPUT/1M | OUTPUT/1M | TIER | USED BY | DEFAULT | ACCESS, grouped under
 * PLATFORM MANAGED and per-credential BYOK sections, with a provider
 * sub-header (`{provider_display_name} · {n}`) inside each table body.
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
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useOrg } from '@/Context/OrgContext';
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
  background: ${({ theme }) => theme.app.surface.tint};
  white-space: nowrap;
`;

/** Full-width provider sub-header row inside the table body. */
const ProviderSubHeadCell = styled.td`
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.app.text.faint};
  background: ${({ theme }) => theme.app.surface.tint};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  white-space: nowrap;
`;

/**
 * The DEFAULT column radio: a real <input type="radio"> (keyboard + screen
 * reader semantics), custom-styled to the reference (outer ring, accent dot
 * when checked) via appearance:none — never a native unstyled radio and
 * never a div pretending to be one.
 */
const DefaultRadio = styled.input.attrs({ type: 'radio' })`
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
`;

const BodyRow = styled.tr<{ $dimmed: boolean; $pending: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  opacity: ${({ $dimmed, $pending }) => ($dimmed || $pending ? 0.55 : 1)};
  &:last-child {
    border-bottom: none;
  }
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

const MiniBadge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme }) => theme.app.text.secondary};
  background: ${({ theme }) => theme.app.surface.tint};
  white-space: nowrap;
`;

const NoToolsTag = styled(MiniBadge)`
  color: ${({ theme }) => theme.app.status.warning.fg};
  border-color: ${({ theme }) => theme.app.status.warning.border};
`;

const OperatorTag = styled(MiniBadge)`
  color: ${({ theme }) => theme.app.status.info.fg};
  border-color: ${({ theme }) => theme.app.status.info.border};
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
  padding: 0;
  margin-top: 4px;
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

const RetryButton = styled.button`
  flex: none;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 8px;
  background: transparent;
  color: ${({ theme }) => theme.app.text.primary};
  font-size: 13px;
  font-weight: 600;
  padding: 7px 14px;
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

const SkeletonBlock = styled.div<{ $h: string }>`
  height: ${({ $h }) => $h};
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
`;

function formatUsd(v: string): string | null {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : null;
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
  const { orgId } = useOrg();
  const tier = useOrgTier();
  const { data, isPending, isError, refetch } = useGroupedModels(orgId);
  const toggles = useModelToggles(orgId);
  const defaultMut = useModelDefault(orgId);

  const [blastTarget, setBlastTarget] = useState<BlastTarget | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [reasoningOpen, setReasoningOpen] = useState<Record<string, boolean>>({});
  const [searchInput, setSearchInput] = useState('');

  const groups: GroupedModels = useMemo(
    () => data ?? { platform: [], byok: [], default_model: null },
    [data],
  );

  /**
   * The N-5 `default_model` — absent/null until the engine ships it, in
   * which case every DEFAULT radio renders unchecked (never invented).
   */
  const defaultSel = groups.default_model ?? null;

  const handleDefaultChange = (group: ModelGroupView, model: ModelRowView) => {
    defaultMut.mutate(
      { provider: group.provider, model_id: model.model_id },
      {
        onError: (err) => {
          const status = (err as { status?: number } | null)?.status;
          toast.error(
            status === 422
              ? "That model isn't available for your organization — the default was not changed."
              : 'Could not save the default model — your previous default was restored.',
          );
        },
      },
    );
  };

  const q = searchInput.trim().toLowerCase();
  const matches = (m: ModelRowView) =>
    q.length === 0 ||
    m.display_name.toLowerCase().includes(q) ||
    m.model_id.toLowerCase().includes(q);

  const platformGroups = useMemo(
    () =>
      groups.platform
        .map((g) => ({ ...g, models: g.models.filter(matches) }))
        .filter((g) => g.models.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups.platform, q],
  );
  const byokGroups = useMemo(
    () =>
      groups.byok
        .map((g) => ({ ...g, models: g.models.filter(matches) }))
        .filter((g) => g.models.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups.byok, q],
  );

  const total = groups.platform.reduce((n, g) => n + g.models.length, 0) +
    groups.byok.reduce((n, g) => n + g.models.length, 0);
  const shown = platformGroups.reduce((n, g) => n + g.models.length, 0) +
    byokGroups.reduce((n, g) => n + g.models.length, 0);
  const enabledCount = [...platformGroups, ...byokGroups].reduce(
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
    collect('platform', platformGroups);
    collect('byok', byokGroups);
    if (matches.length === 0) return null;
    return (matches.find((r) => r.usable) ?? matches[0]).key;
  }, [platformGroups, byokGroups, defaultSel, tier]);

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
        onError: () => {
          toast.error('Could not save the model toggle — your previous settings were restored.');
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

  const renderRow = (supergroup: Supergroup, group: ModelGroupView, model: ModelRowView) => {
    const key = rowKey(supergroup, group, model);
    const covers = tierCovers(tier, model.required_product);
    // 'unknown' tier: indeterminate — the server gates the write, so the
    // switch stays interactive and no upgrade CTA renders.
    const gated = covers === false;
    const disabled = gated || !model.usable;
    // Invariant: the switch can never render ON alongside a cannot-enable
    // warning. The visual state derives from the same availability object
    // that decides whether the warning row renders (`model.usable`).
    const on = model.enabled && model.usable;
    // DEFAULT radio: only a defaultable model can become the org default.
    // Unknown tier stays interactive — the server 422s when the model truly
    // can't serve, and the page rolls back with a toast.
    const defaultable = isDefaultableModel(tier, model);
    const isDefault = defaultRowKey !== null && key === defaultRowKey;

    const defaultCell = defaultable ? (
      <DefaultRadio
        name="org-default-model"
        checked={isDefault}
        disabled={defaultMut.isPending}
        onChange={() => handleDefaultChange(group, model)}
        aria-label={`Set ${model.display_name} as the default model for new assistants`}
      />
    ) : (
      <Tooltip
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

    const inputPrice = model.pricing ? formatUsd(model.pricing.input_per_1m) : null;
    const outputPrice = model.pricing ? formatUsd(model.pricing.output_per_1m) : null;
    const isOperatorPriced = model.pricing_source === 'operator_declared';

    const switchNode = (
      <Switch
        checked={on}
        disabled={disabled}
        onChange={(next) => handleToggle(supergroup, group, model, next)}
        label={`${on ? 'Disable' : 'Enable'} ${model.display_name} (${
          supergroup === 'byok'
            ? `BYOK${group.credential_label ? ` ${group.credential_label}` : ''}`
            : 'platform'
        })`}
      />
    );

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
      return supergroup === 'byok' ? (
        <Tooltip label="Billed directly by your provider — no platform price published">
          <DimText>Direct</DimText>
        </Tooltip>
      ) : (
        <Tooltip label="Pricing not published for this model">
          <PriceText $known={false}>—</PriceText>
        </Tooltip>
      );
    };

    return (
      <BodyRow key={key} $dimmed={!on} $pending={pendingKey === key}>
        <BodyCell>
          <ModelName title={model.display_name}>{model.display_name}</ModelName>
          <ModelId title={`${group.provider} · ${model.model_id}`}>
            {group.provider} · {model.model_id} ·{' '}
            {formatContextTokens(model.context_window_tokens)}
          </ModelId>
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
                    <PresetChip aria-disabled="true">Fast</PresetChip>
                    <PresetChip aria-disabled="true">Standard</PresetChip>
                    <PresetChip aria-disabled="true">Deep reasoning</PresetChip>
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
        </BodyCell>
        <BodyCell>
          <CapBadges>
            {(Object.keys(CAPABILITY_LABELS) as Array<keyof typeof CAPABILITY_LABELS>).map((cap) =>
              model.capabilities[cap] ? <MiniBadge key={cap}>{CAPABILITY_LABELS[cap]}</MiniBadge> : null,
            )}
            {!model.capabilities.tools && (
              <Tooltip label="Models without native tool calling cannot run assistants that use tools">
                <NoToolsTag>No tools</NoToolsTag>
              </Tooltip>
            )}
          </CapBadges>
        </BodyCell>
        <BodyCell>{priceCell(inputPrice)}</BodyCell>
        <BodyCell>{priceCell(outputPrice)}</BodyCell>
        <BodyCell>
          <StatusPill tone={gated ? 'warning' : 'neutral'} dot={false}>
            {model.required_product_label}
          </StatusPill>
        </BodyCell>
        <BodyCell>
          {model.pinned_by.length > 0 ? (
            <Tooltip
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
            <Tooltip label={`Requires ${model.required_product_label} plan to enable`}>
              <span style={{ display: 'inline-block' }}>{switchNode}</span>
            </Tooltip>
          ) : (
            switchNode
          )}
          {gated && (
            <UpgradeLink to="/agent-studio/settings/pricing">Upgrade →</UpgradeLink>
          )}
        </BodyCell>
      </BodyRow>
    );
  };

  const renderTable = (supergroup: Supergroup, groupList: ModelGroupView[]) => (
    <>
      {groupList.map((group) => (
        <div key={`${supergroup}:${group.provider}:${group.credential_id ?? 'platform'}`}>
          {supergroup === 'byok' && (
            <CredHead>
              BYOK · {group.credential_label || group.provider_display_name}
              {group.credential_fingerprint && (
                <Fingerprint>{group.credential_fingerprint}</Fingerprint>
              )}
            </CredHead>
          )}
          <TableWrap>
            <StyledTable>
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
              <tbody>
                {/*
                 * Provider sub-header: groups are already one provider each
                 * (platform groups are per-provider; a BYOK credential serves
                 * one provider), so this is one full-width row per table.
                 * Model rows carry no provider field, so no deeper
                 * client-side split is possible — or needed.
                 */}
                <tr>
                  <ProviderSubHeadCell colSpan={8}>
                    {group.provider_display_name} · {group.models.length}
                  </ProviderSubHeadCell>
                </tr>
                {group.models.map((m) => renderRow(supergroup, group, m))}
              </tbody>
            </StyledTable>
          </TableWrap>
        </div>
      ))}
    </>
  );

  if (isPending) {
    return (
      <ViewShell>
        <ViewHeader>
          <ViewTitle>Models</ViewTitle>
          <ViewSubtitle>Turn models on or off for your organization.</ViewSubtitle>
        </ViewHeader>
        <SkeletonWrap aria-busy="true">
          <SkeletonBlock $h="36px" />
          <SkeletonBlock $h="280px" />
          <SkeletonBlock $h="200px" />
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
          separately. Learn more
        </ViewSubtitle>
      </ViewHeader>

      <Toolbar>
        <SearchWrap>
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

      {shown === 0 ? (
        <EmptyState
          title={q ? 'No models match this search' : 'No models available'}
          description={
            q
              ? 'Try a different search term.'
              : 'The catalog returned no models for this workspace.'
          }
        />
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
            ) : (
              <EmptyState
                title="No connected credentials"
                description="Connect a key to see its discovered models here."
              />
            )}
            <NoCredRow to="/agent-studio/providers/my-providers">
              No other connected credentials — connect a key in My Providers →
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
