import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { ModelAvailability, ModelCost } from '@hooks/studio/useSetupModels';
import { ENGINE_RANGES, humanizeReason, reasonFix, subscriptionGateCopy } from '../lib/brain-model';
import {
  CapChips,
  CapNote,
  CatalogList,
  CatalogRow,
  CountBadge,
  EmptyNote,
  FixButton,
  GroupLabel,
  InPipelineBadge,
  PickerHead,
  ReasonText,
  RowMain,
  RowMeta,
  RowName,
  SearchInput,
  Wrap,
} from './ModelPicker.styles';
import { SkeletonRows } from './SkeletonRows';

export interface ModelPickerProps {
  rows: ModelAvailability[] | undefined;
  /** Catalog fetch failed — the list is unknown, not empty. */
  loadError?: boolean;
  costsByRef: Map<string, ModelCost>;
  pipelineRefs: string[];
  credBlockedRefs: Set<string>;
  canAuthor: boolean;
  /** B2: whether BYOK connect is available (enterprise-gated upstream). */
  isEnterprise: boolean;
  /** Add to / remove from the pipeline (reorder lives on the pipeline rows). */
  onToggle: (ref: string) => void;
  /** Row-level fix requested (connect/enable/profile/incident) — owned upstream. */
  onFixRequest: (action: 'connect' | 'enable' | 'profile' | 'incident', ref: string) => void;
}

function fmtCtx(tokens: number | null | undefined): string | null {
  if (tokens === null || tokens === undefined) return null;
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K ctx`;
  return `${tokens} ctx`;
}

function pricePerM(micros: number | null | undefined): string {
  if (micros === null || micros === undefined) return 'Pricing not listed';
  return `$${(micros / 1000).toFixed(2)}/1M`;
}

function capabilityChips(capabilities: Record<string, unknown>): string[] {
  const chips: string[] = [];
  if (capabilities.vision) chips.push('Vision');
  if (capabilities.tools) chips.push('Tools');
  if (capabilities.reasoning) chips.push('Reasoning');
  return chips;
}

function providerLabel(provider: string): string {
  // D3: proper casing for known providers ("openai" → "OpenAI", not "Openai").
  const known: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    mistral: 'Mistral',
    cohere: 'Cohere',
  };
  return known[provider.toLowerCase()] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
}

/**
 * Catalog multi-pick — provider-grouped rows with search, capability chips,
 * per-1M pricing, and inline usability reasons. Unusable rows are DISABLED
 * (never hidden); pipeline rows stay removable. Viewer gets the same list
 * read-only. Reorder moved to the pipeline rows (no OrderStrip here).
 */
export function ModelPicker({
  rows,
  loadError,
  costsByRef,
  pipelineRefs,
  credBlockedRefs,
  canAuthor,
  isEnterprise,
  onToggle,
  onFixRequest,
}: ModelPickerProps) {
  const [query, setQuery] = useState('');
  const capped = pipelineRefs.length >= ENGINE_RANGES.allowedModelsMax;

  const visible = useMemo(() => {
    const list = rows ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.ref.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q),
    );
  }, [rows, query]);

  // Provider groups in catalog order (never alphabetical — the catalog's
  // own ordering is the source of truth).
  const groups = useMemo(() => {
    const order: string[] = [];
    const byProvider = new Map<string, ModelAvailability[]>();
    for (const model of visible) {
      if (!byProvider.has(model.provider)) {
        byProvider.set(model.provider, []);
        order.push(model.provider);
      }
      byProvider.get(model.provider)?.push(model);
    }
    return order.map((provider) => ({ provider, models: byProvider.get(provider) ?? [] }));
  }, [visible]);

  const renderRow = (model: ModelAvailability) => {
    const inPipeline = pipelineRefs.includes(model.ref);
    const disabled = !canAuthor || (!model.usable && !inPipeline) || (!inPipeline && capped);
    const cost = costsByRef.get(model.ref);
    const ctx = fmtCtx(model.contextWindowTokens);
    const chips = capabilityChips(model.capabilities);
    const reason = model.usable ? null : (model.reasons[0] ?? 'unknown');
    const fix = reason ? reasonFix(reason) : null;
    const gated = reason === 'subscription_required';
    return (
      <CatalogRow key={model.ref} $disabled={disabled} title={model.ref}>
        <input
          type="checkbox"
          checked={inPipeline}
          disabled={disabled}
          onChange={() => onToggle(model.ref)}
          aria-label={`${model.displayName}${model.usable ? '' : ` — unusable: ${model.reasons.join(', ') || 'unknown reason'}`}`}
        />
        <RowMain>
          <RowName>
            {model.displayName}
            {inPipeline && <InPipelineBadge>In pipeline</InPipelineBadge>}
          </RowName>
          <RowMeta>
            {providerLabel(model.provider)} · {model.modelId}
            {ctx ? ` · ${ctx}` : ''}
          </RowMeta>
          <RowMeta>
            {pricePerM(cost?.costMicrosPer1kInput)} in · {pricePerM(cost?.costMicrosPer1kOutput)} out
          </RowMeta>
          {chips.length > 0 && (
            <CapChips>
              {chips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </CapChips>
          )}
          {!model.usable && (
            <ReasonText $tone={reason === 'credential_compromised' ? 'red' : 'amber'}>
              {gated ? (
                <>
                  {subscriptionGateCopy(model)}{' '}
                  <Link to="/agent-studio/settings/billing">View subscription options →</Link>
                </>
              ) : (
                <>
                  unusable: {humanizeReason(reason ?? 'unknown')}
                  {credBlockedRefs.has(model.ref) && ' — credential required to serve'}
                  {fix && fix.action && fix.action !== 'billing' && canAuthor && (
                    <>
                      {' · '}
                      {fix.action === 'connect' && !isEnterprise ? (
                        // B2: BYOK is enterprise-gated — render truthful copy
                        // instead of a button that opens nothing.
                        <span>Neryva-managed credentials apply — no action needed</span>
                      ) : (
                        <FixButton
                          type="button"
                          onClick={() =>
                            onFixRequest(fix.action as 'connect' | 'enable' | 'profile' | 'incident', model.ref)
                          }
                        >
                          {fix.label}
                        </FixButton>
                      )}
                    </>
                  )}
                </>
              )}
            </ReasonText>
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
        {/* B9: the badge states a count of a capped list — label it as such. */}
        <CountBadge aria-label={`${pipelineRefs.length} of ${ENGINE_RANGES.allowedModelsMax} models picked`}>
          {pipelineRefs.length} / {ENGINE_RANGES.allowedModelsMax} picked
        </CountBadge>
      </PickerHead>

      {rows === undefined && !loadError && <SkeletonRows rows={5} barHeight="52px" />}
      {loadError && <EmptyNote>Catalog unreachable — retry the page. Saving without a picked model is refused.</EmptyNote>}
      {rows !== undefined && rows.length === 0 && !loadError && (
        <EmptyNote>No models in the platform catalog yet — nothing can ship until staff publishes entries.</EmptyNote>
      )}
      {/* D1: zero-match search gets an explicit empty state, not a blank list. */}
      {rows !== undefined && rows.length > 0 && visible.length === 0 && !loadError && (
        <EmptyNote>No models match “{query.trim()}” — try a different search.</EmptyNote>
      )}

      <CatalogList>
        {groups.map((group) => (
          <div key={group.provider}>
            <GroupLabel>
              {providerLabel(group.provider)} · {group.models.length}
            </GroupLabel>
            {group.models.map((model) => renderRow(model))}
          </div>
        ))}
      </CatalogList>

      {capped && canAuthor && <CapNote>{ENGINE_RANGES.allowedModelsMax}-model cap — remove one to add another.</CapNote>}
    </Wrap>
  );
}
