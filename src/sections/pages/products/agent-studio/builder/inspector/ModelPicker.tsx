import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ENGINE_RANGES, humanizeReason, reasonFix, subscriptionGateCopy } from '../lib/brain-model';
import type { BuilderModelRow } from '../lib/useGroupedModels';
import {
  CapChips,
  CapNote,
  CatalogList,
  CatalogRow,
  CountBadge,
  EmptyNote,
  GroupLabel,
  InPipelineBadge,
  PickerHead,
  ReasonText,
  RowMain,
  RowMeta,
  RowName,
  SearchInput,
  SupergroupHeader,
  ToolWarnBadge,
  Wrap,
} from './ModelPicker.styles';
import { SkeletonRows } from './SkeletonRows';

export interface ModelPickerProps {
  /** N-5 grouped-model rows (undefined while loading). */
  rows: BuilderModelRow[] | undefined;
  /** Catalog fetch failed — the list is unknown, not empty. */
  loadError?: boolean;
  /** Pipeline entry keys (`byok|<ref>|<credentialId>` / `platform|<ref>|`). */
  pipelineKeys: Set<string>;
  /** Entry keys with a credential blocker. */
  credBlockedKeys: Set<string>;
  /** Real pinned-tool count from the draft — 0 hides all tool warnings. */
  pinnedToolCount: number;
  canAuthor: boolean;
  /** Whether BYOK connect is available (enterprise-gated upstream). */
  isEnterprise: boolean;
  /**
   * W22 (doc 20 §3.4): this builder draft's path (buildAgentBuildPath) —
   * the Providers link carries it as ?returnTo so the user lands back here.
   */
  returnTo: string;
  /** Add to / remove from the pipeline (reorder lives on the pipeline rows). */
  onToggle: (ref: string, credentialId: string | null) => void;
}

function fmtCtx(tokens: number | null | undefined): string | null {
  if (tokens === null || tokens === undefined) return null;
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K ctx`;
  return `${tokens} ctx`;
}

/** USD/1M pair straight from the row — absent when the engine sent none.
 * Each side renders only if declared (Law VII: never invent a price for an
 * undeclared side). Operator-declared prices (PRV-035) are labeled. */
function priceLine(row: BuilderModelRow): string {
  const p = row.pricing;
  if (!p || (p.input_per_1m === undefined && p.output_per_1m === undefined)) {
    return 'Pricing not listed';
  }
  const parts: string[] = [];
  if (p.input_per_1m !== undefined) parts.push(`$${p.input_per_1m}/1M in`);
  if (p.output_per_1m !== undefined) parts.push(`$${p.output_per_1m}/1M out`);
  const base = parts.join(' · ');
  return row.pricingSource === 'operator_declared' ? `${base} (operator-declared)` : base;
}

function capabilityChips(capabilities: BuilderModelRow['capabilities']): string[] {
  const chips: string[] = [];
  if (capabilities.vision) chips.push('Vision');
  if (capabilities.tools) chips.push('Tools');
  if (capabilities.reasoning) chips.push('Reasoning');
  return chips;
}

interface ProviderSubgroup {
  provider: string;
  providerDisplayName: string;
  rows: BuilderModelRow[];
}

interface SupergroupSection {
  kind: 'platform' | 'byok';
  /** React key: 'platform' or `byok|<credentialId>`. */
  id: string;
  title: string;
  subgroups: ProviderSubgroup[];
}

/**
 * Catalog visibility: only org-enabled rows plus anything already in the
 * draft pipeline (a model toggled off after being picked stays removable
 * and keeps its "unavailable" note in the pipeline — it never vanishes
 * silently). The Providers → Models surface owns the toggles; this list
 * reflects them.
 */
export function filterCatalogRows(
  rows: BuilderModelRow[],
  pipelineKeys: Set<string>,
): BuilderModelRow[] {
  return rows.filter((row) => row.enabled || pipelineKeys.has(row.key));
}

/**
 * Catalog multi-pick on the N-5 grouped-model rows — supergroup sections
 * (Platform managed / BYOK — <credentialLabel>) wrapping provider sub-groups,
 * with search, capability chips, per-1M pricing, and inline usability
 * reasons. Only org-enabled rows are listed (plus anything already in the
 * pipeline); unusable-but-enabled rows are DISABLED (never hidden);
 * pipeline rows stay removable. Viewer gets the same list read-only.
 * Reorder moved to the pipeline rows (no OrderStrip here).
 */
export function ModelPicker({
  rows,
  loadError,
  pipelineKeys,
  credBlockedKeys,
  pinnedToolCount,
  canAuthor,
  isEnterprise,
  returnTo,
  onToggle,
}: ModelPickerProps) {
  const [query, setQuery] = useState('');
  const pickedCount = pipelineKeys.size;
  const capped = pickedCount >= ENGINE_RANGES.allowedModelsMax;

  const visible = useMemo(() => {
    const list = filterCatalogRows(rows ?? [], pipelineKeys);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (row) =>
        row.displayName.toLowerCase().includes(q) ||
        row.ref.toLowerCase().includes(q) ||
        row.provider.toLowerCase().includes(q) ||
        (row.credentialLabel ?? '').toLowerCase().includes(q),
    );
  }, [rows, query, pipelineKeys]);

  // Rows exist but the org-toggle filter hid every one (no search active).
  const allToggledOff =
    (rows?.length ?? 0) > 0 && query.trim() === '' && visible.length === 0 && !loadError;

  // Supergroup sections in catalog order (never alphabetical — the catalog's
  // own ordering is the source of truth): platform first, then BYOK groups
  // in row order. Within each supergroup, provider sub-groups in row order.
  const sections = useMemo<SupergroupSection[]>(() => {
    const result: SupergroupSection[] = [];
    const platform = visible.filter((row) => row.supergroup === 'platform');
    if (platform.length > 0) {
      result.push({ kind: 'platform', id: 'platform', title: 'Platform managed', subgroups: groupByProvider(platform) });
    }
    const byok = visible.filter((row) => row.supergroup === 'byok');
    const credOrder: string[] = [];
    const byCred = new Map<string, BuilderModelRow[]>();
    for (const row of byok) {
      const key = row.credentialId ?? '';
      if (!byCred.has(key)) {
        byCred.set(key, []);
        credOrder.push(key);
      }
      byCred.get(key)?.push(row);
    }
    for (const key of credOrder) {
      const credRows = byCred.get(key) ?? [];
      const label = credRows[0]?.credentialLabel ?? key;
      result.push({
        kind: 'byok',
        id: `byok|${key}`,
        title: `BYOK — ${label}`,
        subgroups: groupByProvider(credRows),
      });
    }
    // W20: the BYOK supergroup always renders — when the loaded catalog holds
    // no BYOK rows (no verified credentials), an empty state replaces the
    // per-credential sections instead of the supergroup vanishing (Providers
    // Tab C renders the same empty state). Gated on the loaded catalog so the
    // skeleton phase never claims "no credentials"; a search that filters
    // BYOK rows out simply shows no BYOK content, never the empty state.
    const catalogLoaded = rows !== undefined;
    const hasByokRows = catalogLoaded && rows.some((row) => row.supergroup === 'byok');
    if (catalogLoaded && credOrder.length === 0 && !hasByokRows) {
      result.push({ kind: 'byok', id: 'byok|empty', title: 'BYOK', subgroups: [] });
    }
    return result;
  }, [visible, rows]);

  const renderRow = (row: BuilderModelRow) => {
    const inPipeline = pipelineKeys.has(row.key);
    const disabled = !canAuthor || (!row.usable && !inPipeline) || (!inPipeline && capped);
    const ctx = fmtCtx(row.contextWindowTokens);
    const chips = capabilityChips(row.capabilities);
    const name = row.displayName;
    // PRV-076: badge only — the confirm step mounts in ModelSection.
    const showToolWarn = pinnedToolCount > 0 && row.capabilities.tools === false;
    const byokSuffix = row.supergroup === 'byok' ? ` · BYOK · ${row.credentialLabel ?? 'unlabeled credential'}` : '';
    return (
      <CatalogRow key={row.key} $disabled={disabled} title={row.ref}>
        <input
          type="checkbox"
          key={row.key}
          checked={inPipeline}
          disabled={disabled}
          onChange={() => onToggle(row.ref, row.credentialId)}
          aria-label={`${name}${row.usable ? '' : ` — unusable: ${row.reasons.join(', ') || 'unknown reason'}`}`}
        />
        <RowMain>
          <RowName>
            {name}
            {inPipeline && <InPipelineBadge>In pipeline</InPipelineBadge>}
          </RowName>
          <RowMeta>
            {row.providerDisplayName} · {row.modelId}
            {ctx ? ` · ${ctx}` : ''}
            {byokSuffix}
          </RowMeta>
          <RowMeta>{priceLine(row)}</RowMeta>
          {chips.length > 0 && (
            <CapChips>
              {chips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </CapChips>
          )}
          {showToolWarn && <ToolWarnBadge>Incompatible: no tool support</ToolWarnBadge>}
          {!row.usable && (
            <ReasonBlock
              row={row}
              credBlocked={credBlockedKeys.has(row.key)}
              canAuthor={canAuthor}
              isEnterprise={isEnterprise}
            />
          )}
        </RowMain>
      </CatalogRow>
    );
  };

  return (
    <Wrap>
      <PickerHead>
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search catalog…"
          aria-label="Search model catalog"
        />
        {/* W17: the badge counts a capped pipeline — label it as such, never
            as "N of M" where M reads like the catalog size. */}
        <CountBadge aria-label={`${pickedCount} picked · max ${ENGINE_RANGES.allowedModelsMax}`}>
          {pickedCount} picked · max {ENGINE_RANGES.allowedModelsMax}
        </CountBadge>
      </PickerHead>

      {rows === undefined && !loadError && <SkeletonRows rows={5} barHeight="52px" />}
      {loadError && <EmptyNote>Catalog unreachable — retry the page. Saving without a picked model is refused.</EmptyNote>}
      {rows !== undefined && rows.length === 0 && !loadError && (
        <EmptyNote>No models in the platform catalog yet — nothing can ship until staff publishes entries.</EmptyNote>
      )}
      {/* D1: zero-match search gets an explicit empty state, not a blank list. */}
      {rows !== undefined && rows.length > 0 && visible.length === 0 && !loadError && !allToggledOff && (
        <EmptyNote>No models match “{query.trim()}” — try a different search.</EmptyNote>
      )}
      {allToggledOff && (
        <EmptyNote>
          No enabled models — everything is toggled off. Enable models in{' '}
          <Link to="/agent-studio/providers/models">Providers → Models</Link>, then pick them here.
        </EmptyNote>
      )}

      <CatalogList>
        {sections.map((section) => (
          <div key={section.id}>
            <SupergroupHeader>{section.title}</SupergroupHeader>
            {section.kind === 'byok' && section.subgroups.length === 0 ? (
              <EmptyNote>No connected credentials — connect a key to see its discovered models here.</EmptyNote>
            ) : (
              section.subgroups.map((group) => {
                return (
                  <div key={group.provider}>
                    <GroupLabel>
                      {group.providerDisplayName} · {group.rows.length}
                    </GroupLabel>
                    {group.rows.map((row) => renderRow(row))}
                  </div>
                );
              })
            )}
          </div>
        ))}
      </CatalogList>

      {/* W22 (doc 20 §3.4): draft-safe return — ?returnTo carries this
          builder draft so the Providers surface can send the user back. */}
      <CapNote>
        Need another model or endpoint?{' '}
        <Link to="/agent-studio/providers/catalog" search={{ returnTo }}>
          Open Providers →
        </Link>
      </CapNote>

      {capped && canAuthor && <CapNote>{ENGINE_RANGES.allowedModelsMax}-model cap — remove one to add another.</CapNote>}
    </Wrap>
  );
}

/** Provider sub-groups in row order (never alphabetical). */
function groupByProvider(list: BuilderModelRow[]): ProviderSubgroup[] {
  const order: string[] = [];
  const byProvider = new Map<string, BuilderModelRow[]>();
  for (const row of list) {
    if (!byProvider.has(row.provider)) {
      byProvider.set(row.provider, []);
      order.push(row.provider);
    }
    byProvider.get(row.provider)?.push(row);
  }
  return order.map((provider) => {
    const rows = byProvider.get(provider) ?? [];
    return {
      provider,
      providerDisplayName: rows[0]?.providerDisplayName ?? provider,
      rows,
    };
  });
}

/**
 * Inline usability reasons for an unusable row (PRV-080): every reasons[]
 * code renders human-readable text plus the right next step. Subscription
 * locks keep the billing link; every other fix action is a direct Link to
 * the Providers surface (no fix-request callback — modals are banned).
 */
function ReasonBlock({
  row,
  credBlocked,
  canAuthor,
  isEnterprise,
}: {
  row: BuilderModelRow;
  credBlocked: boolean;
  canAuthor: boolean;
  isEnterprise: boolean;
}) {
  const reasons = row.reasons.length > 0 ? row.reasons : ['unknown'];
  const red = reasons.includes('credential_compromised');
  return (
    <ReasonText $tone={red ? 'red' : 'amber'}>
      {reasons.map((reason, index) => (
        <span key={reason}>
          {index > 0 && ' · '}
          {reason === 'subscription_required' ? (
            <>
              {subscriptionGateCopy(row)}{' '}
              <Link to="/agent-studio/settings/billing">View subscription options →</Link>
            </>
          ) : (
            <>
              unusable: {humanizeReason(reason)}
              {credBlocked && ' — credential required to serve'}
              {canAuthor && <FixLink reason={reason} isEnterprise={isEnterprise} />}
            </>
          )}
        </span>
      ))}
    </ReasonText>
  );
}

/**
 * Direct next-step link per fix action (PRV-080). `connect` on a
 * non-enterprise workspace stays honest: Neryva-managed credentials apply,
 * so there is no action to take — plain copy, not a dead link.
 */
function FixLink({ reason, isEnterprise }: { reason: string; isEnterprise: boolean }) {
  const fix = reasonFix(reason);
  if (!fix.action) {
    // action: null — label text only, no link.
    return null;
  }
  if (fix.action === 'connect' && !isEnterprise) {
    return <span> · Neryva-managed credentials apply — no action needed</span>;
  }
  // Routed providers surface: each fix action deep-links its own page.
  const to =
    fix.action === 'connect' || fix.action === 'incident'
      ? '/agent-studio/providers/my-providers'
      : fix.action === 'billing'
        ? '/agent-studio/settings/pricing'
        : '/agent-studio/providers/models';
  return (
    <>
      {' · '}
      <Link to={to}>
        {fix.label} →
      </Link>
    </>
  );
}
