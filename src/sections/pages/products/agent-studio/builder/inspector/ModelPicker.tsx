import { useMemo, useState } from 'react';
import { costLabel, type ModelAvailability, type ModelCost } from '@hooks/studio/useSetupModels';
import { ENGINE_RANGES, humanizeReason, moveModel, reasonFix } from '../lib/brain-model';
import {
  CapNote,
  CatalogList,
  CatalogRow,
  EmptyNote,
  FixButton,
  MiniButton,
  OrderChip,
  OrderIndex,
  OrderLabel,
  OrderName,
  OrderStrip,
  ReasonText,
  RowMain,
  RowMeta,
  RowName,
  SearchInput,
  Wrap,
} from './ModelPicker.styles';

export interface ModelPickerProps {
  allowed: string[];
  /** Undefined = still loading (no verdict rendered either way). */
  catalog: ModelAvailability[] | undefined;
  catalogError: boolean;
  costs: ModelCost[] | undefined;
  canAuthor: boolean;
  onChange: (allowed: string[]) => void;
  /** Row-level fix requested (connect/enable/profile/incident) — owned upstream. */
  onFixRequest: (action: 'connect' | 'enable' | 'profile' | 'incident', ref: string) => void;
}

/**
 * Catalog multi-pick (C04 PLAN.md §5): search, per-row usability with reasons,
 * effective-cost labels, cap-16 hold, fallback-order strip. Unusable rows are
 * DISABLED (never hidden); allowed-but-decayed rows stay removable. Viewer gets
 * the same list read-only.
 */
export function ModelPicker({ allowed, catalog, catalogError, costs, canAuthor, onChange, onFixRequest }: ModelPickerProps) {
  const [query, setQuery] = useState('');
  const capped = allowed.length >= ENGINE_RANGES.allowedModelsMax;

  const visible = useMemo(() => {
    const list = catalog ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) => m.displayName.toLowerCase().includes(q) || m.ref.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q),
    );
  }, [catalog, query]);

  const toggle = (ref: string, on: boolean) => {
    if (on) {
      if (allowed.includes(ref) || allowed.length >= ENGINE_RANGES.allowedModelsMax) return;
      onChange([...allowed, ref]);
    } else {
      onChange(allowed.filter((r) => r !== ref));
    }
  };

  const costFor = (ref: string) => costs?.find((c) => c.ref === ref);

  return (
    <Wrap>
      {allowed.length > 0 && (
        <OrderStrip aria-label="Fallback order">
          <OrderLabel>FALLBACK ORDER · FIRST SERVES</OrderLabel>
          {allowed.map((ref, index) => (
            <OrderChip key={ref}>
              <OrderIndex>{index + 1}</OrderIndex>
              <OrderName title={ref}>{ref}</OrderName>
              {canAuthor && (
                <>
                  <MiniButton
                    type="button"
                    aria-label={`Move ${ref} up`}
                    disabled={index === 0}
                    onClick={() => onChange(moveModel(allowed, index, index - 1))}
                  >
                    ↑
                  </MiniButton>
                  <MiniButton
                    type="button"
                    aria-label={`Move ${ref} down`}
                    disabled={index === allowed.length - 1}
                    onClick={() => onChange(moveModel(allowed, index, index + 1))}
                  >
                    ↓
                  </MiniButton>
                  <MiniButton type="button" aria-label={`Remove ${ref}`} onClick={() => toggle(ref, false)}>
                    ×
                  </MiniButton>
                </>
              )}
            </OrderChip>
          ))}
        </OrderStrip>
      )}

      <SearchInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search catalog…"
        aria-label="Search model catalog"
      />

      {catalog === undefined && !catalogError && <EmptyNote>Loading the model catalog…</EmptyNote>}
      {catalogError && <EmptyNote>Catalog unreachable — retry the page. Saving without a picked model is refused.</EmptyNote>}
      {catalog !== undefined && catalog.length === 0 && !catalogError && (
        <EmptyNote>No models in the platform catalog yet — nothing can ship until staff publishes entries.</EmptyNote>
      )}

      <CatalogList>
        {visible.map((model) => {
          const on = allowed.includes(model.ref);
          const disabled = !canAuthor || (!model.usable && !on) || (!on && capped);
          const cost = costFor(model.ref);
          const costText = cost
            ? `${costLabel(cost, 'in')} in / ${costLabel(cost, 'out')} out`
            : 'unpriced';
          const reason = model.usable ? null : model.reasons[0] ?? 'unknown';
          const fix = reason ? reasonFix(reason) : null;
          return (
            <CatalogRow key={model.ref} $disabled={disabled} title={model.ref}>
              <input
                type="checkbox"
                checked={on}
                disabled={disabled}
                onChange={(event) => toggle(model.ref, event.target.checked)}
                aria-label={`${model.displayName}${model.usable ? '' : ` — unusable: ${model.reasons.join(', ') || 'unknown reason'}`}`}
              />
              <RowMain>
                <RowName>
                  {model.displayName}
                </RowName>
                <RowMeta>
                  {model.ref} · {costText}
                </RowMeta>
                {!model.usable && (
                  <ReasonText $tone={reason === 'credential_compromised' ? 'red' : 'amber'}>
                    unusable: {humanizeReason(reason ?? 'unknown')}
                    {fix && fix.action && canAuthor && (
                      <>
                        {' · '}
                        <FixButton type="button" onClick={() => onFixRequest(fix.action as 'connect' | 'enable' | 'profile' | 'incident', model.ref)}>
                          {fix.label}
                        </FixButton>
                      </>
                    )}
                  </ReasonText>
                )}
              </RowMain>
            </CatalogRow>
          );
        })}
      </CatalogList>

      {capped && canAuthor && (
        <CapNote>16-model cap — remove one to add another.</CapNote>
      )}
    </Wrap>
  );
}
