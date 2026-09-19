import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { TextInput } from '@components/common/ui/TextInput';
import { ApiError } from '@lib/engine/client';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import { useModelCosts } from '@hooks/studio/useSetupModels';
import type { ConsumerDefinition } from '@lib/engine/agent-payload';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import { AUTOSAVE_MS, buildDraftPayload } from '../lib/draft-save';
import {
  BUDGET_BOUNDS,
  CAP_LABELS,
  ESTIMATE_COPY,
  FAIL_CLOSED_COPY,
  PUBLISH_COPY,
  cachedPriceLine,
  describeCap,
  estimateRun,
  formatEstimate,
  formatRatePer1k,
  type BudgetCapKey,
  type BudgetCaps,
} from '../lib/budget-model';
import { ConflictDialog } from './ConflictDialog';
import { EmptyState, SectionLabel, Whisper, Wrap } from './InstructionsSection.styles';
import { StaticLabel, StaticRow } from './BrainSection.styles';
import { ControlLabel, ControlRow, TextButton, ToolMeta } from './ToolsSection.styles';
import { PreviewItem, PreviewList, PreviewMeta } from './MemorySection.styles';

export interface BudgetSectionProps {
  assistantId: string;
  definition: AgentDefinition | null;
  versionId: string | null;
  versionHash: string | null;
  isDraft: boolean;
  canAuthor: boolean;
  onDirtyChange: (dirty: boolean) => void;
}

interface ConflictState {
  expectedHash: string;
  currentHash: string | null;
  attempted: string;
  attemptedDef: AgentDefinition;
}

type BudgetState = ConsumerDefinition['budget'];

function readBudget(definition: AgentDefinition): BudgetState {
  return { ...definition.budget };
}

const CAP_KEYS: BudgetCapKey[] = ['max_cost_cents', 'max_total_tokens', 'max_tool_calls', 'max_model_calls', 'wall_clock_seconds'];

/**
 * C09 mount — plain-words caps with unset-vs-zero resolution, rough estimate
 * lines, fail-closed note; the proven save machine (debounce, PUT/POST,
 * 409 adopt, 412 dialog, dirty flag). Caps are ALL-OPTIONAL: clearing a field
 * unsets it (platform default / cost-unchecked) — never 0-for-unset.
 */
export function BudgetSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
}: BudgetSectionProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');
  const costs = useModelCosts();

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [budget, setBudget] = useState<BudgetState>(() => (definition ? readBudget(definition) : {}));
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const sendHashRef = useRef('');

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);

  const source = useMemo(() => (definition ? readBudget(definition) : null), [definition]);
  const current = useMemo(() => JSON.stringify(budget), [budget]);
  const dirty = source !== null && current !== JSON.stringify(source);

  if (docKey !== sourceKey && !dirty) {
    setDocKey(sourceKey);
    if (source) setBudget(source);
  } else if (docKey !== sourceKey) {
    setDocKey(sourceKey);
  }

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const buildNext = useCallback((): AgentDefinition | null => {
    if (!definition) return null;
    return buildDraftPayload(definition, { budget: { ...budget } });
  }, [definition, budget]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    const next = buildNext();
    if (next) {
      messages.push(
        ...checkDefinitionCaps(next)
          .filter((issue) => issue.path === 'budget' || issue.path.startsWith('budget.') || issue.path === 'secrets')
          .map((i) => i.message),
      );
    }
    return messages;
  }, [buildNext]);
  const blocked = heldMessages.length > 0;
  const pending = saveDraft.isPending || updateDraft.isPending;

  const sourcePolicyJson = useMemo(
    () => (definition ? JSON.stringify({ budget: definition.budget }) : null),
    [definition],
  );
  const adoptingActive = adopting !== null && sourcePolicyJson !== adopting;

  const doSave = useCallback(() => {
    const next = buildNext();
    if (!canAuthor || !next || blocked || conflict) return;
    if (isDraft && versionId && versionHash) {
      sendHashRef.current = versionHash;
      updateDraft.mutate(
        { definition: next, expectedHash: versionHash },
        {
          onSuccess: () => undefined,
          onError: (error) => {
            if (error instanceof ApiError && error.status === 412) {
              const details =
                typeof error.details === 'object' && error.details !== null
                  ? (error.details as Record<string, unknown>)
                  : {};
              setConflict({
                expectedHash: versionHash,
                currentHash: typeof details.current === 'string' ? details.current : null,
                attempted: JSON.stringify({ budget: next.budget }),
                attemptedDef: next,
              });
            }
          },
        },
      );
      return;
    }
    saveDraft.mutate(next, {
      onSuccess: () => undefined,
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
          toast.success('A draft opened elsewhere — resumed it. Your budget stays; the next save writes to it.');
        }
      },
    });
  }, [canAuthor, buildNext, blocked, conflict, isDraft, versionId, versionHash, updateDraft, saveDraft, queryClient]);

  useEffect(() => {
    if (!canAuthor || !dirty || blocked || conflict || adoptingActive || pending || !definition) return;
    const timer = window.setTimeout(() => {
      doSave();
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition, current, doSave]);

  const patch = useCallback((part: Partial<BudgetState>) => {
    setBudget((prev) => ({ ...prev, ...part }));
  }, []);

  if (!definition) {
    return (
      <Wrap>
        <EmptyState>Loading the draft…</EmptyState>
      </Wrap>
    );
  }

  if (!canAuthor) {
    return (
      <Wrap>
        {CAP_KEYS.map((key) => {
          const described = describeCap(key, budget[key]);
          return (
            <StaticRow key={key}>
              <StaticLabel>{CAP_LABELS[key]}</StaticLabel>
              <span>{described.state}{described.whisper !== '' ? ` — ${described.whisper}` : ''}</span>
            </StaticRow>
          );
        })}
        <ToolMeta>{FAIL_CLOSED_COPY}</ToolMeta>
        <ToolMeta>Budget needs an owner, admin, or developer — {denied}</ToolMeta>
      </Wrap>
    );
  }

  const allowed = definition.model_policy.allowed_models;
  const costsByRef = new Map((costs.data ?? []).map((c) => [c.ref, c]));
  const estimateTokens = budget.max_total_tokens ?? 20_000;

  return (
    <Wrap
      onKeyDown={(event) => {
        if (event.key === 'Escape' && event.target instanceof HTMLElement) {
          event.target.blur();
        }
      }}
    >
      {/* Block A · caps */}
      <div>
        <SectionLabel>CAPS · PER-RUN</SectionLabel>
        {CAP_KEYS.map((key) => (
          <CapField key={key} capKey={key} budget={budget} patch={patch} />
        ))}
        <ToolMeta>Clear a field to unset it — platform defaults resume.</ToolMeta>
      </div>

      {/* Block B · estimate */}
      <div>
        <SectionLabel>ESTIMATE · ROUGH, NOT THE BILL</SectionLabel>
        {costs.isPending ? (
          <ToolMeta>Loading list prices…</ToolMeta>
        ) : costs.isError ? (
          <Whisper $tone="amber">Prices are unreachable — caps above still save; estimates resume on reload.</Whisper>
        ) : allowed.length === 0 ? (
          <ToolMeta>Pick a model in Brain — estimates need a priced model, never a fake $0.</ToolMeta>
        ) : (
          <PreviewList>
            {allowed.map((ref) => {
              const cost = costsByRef.get(ref);
              if (!cost) {
                return (
                  <PreviewItem key={ref}>
                    {ref} — unpriced.
                  </PreviewItem>
                );
              }
              const cached = cachedPriceLine({
                ref,
                costMicrosPer1kInput: cost.costMicrosPer1kInput,
                costMicrosPer1kOutput: cost.costMicrosPer1kOutput,
                costMicrosPer1kCachedInput: cost.costMicrosPer1kCachedInput,
              });
              const estimate = estimateRun(estimateTokens, {
                ref,
                costMicrosPer1kInput: cost.costMicrosPer1kInput,
                costMicrosPer1kOutput: cost.costMicrosPer1kOutput,
                costMicrosPer1kCachedInput: cost.costMicrosPer1kCachedInput,
              });
              return (
                <PreviewItem key={ref}>
                  {ref} — in {cost.costMicrosPer1kInput !== null ? formatRatePer1k(cost.costMicrosPer1kInput) : 'unpriced'}
                  {cached ? ` · ${cached}` : ''} · out{' '}
                  {cost.costMicrosPer1kOutput !== null ? formatRatePer1k(cost.costMicrosPer1kOutput) : 'unpriced'}
                  {estimate ? (
                    <PreviewMeta>
                      {formatEstimate(estimate.micros)}{' '}
                      {budget.max_total_tokens !== undefined
                        ? `per ${estimateTokens.toLocaleString()}-token run (your cap)`
                        : 'per 20k-token run (reference scale)'}
                    </PreviewMeta>
                  ) : (
                    <PreviewMeta>Unpriced — no estimate.</PreviewMeta>
                  )}
                </PreviewItem>
              );
            })}
          </PreviewList>
        )}
        <ToolMeta>{ESTIMATE_COPY}</ToolMeta>
      </div>

      {/* Block C · fail-closed */}
      <div>
        <SectionLabel>IF A CAP BREAKS</SectionLabel>
        <ToolMeta>{FAIL_CLOSED_COPY}</ToolMeta>
        <ToolMeta>{PUBLISH_COPY}</ToolMeta>
        <ControlRow>
          <TextButton type="button" onClick={() => navigate({ to: '/agent-studio/usage' })}>
            Open Usage (measured) →
          </TextButton>
        </ControlRow>
      </div>

      {heldMessages.map((message) => (
        <Whisper key={message} $tone="red" role="alert">
          {message} Autosave held — fix it and saving resumes on its own.
        </Whisper>
      ))}

      {conflict && (
        <ConflictDialog
          assistantId={assistantId}
          attempted={conflict.attempted}
          expectedHash={conflict.expectedHash}
          currentHash={conflict.currentHash}
          pending={pending}
          onClose={() => setConflict(null)}
          selectTheirs={(live) => JSON.stringify({ budget: live.budget })}
          onReloadTheirs={(theirs) => {
            try {
              const parsed = JSON.parse(theirs) as { budget?: unknown };
              const raw = (parsed.budget ?? {}) as Record<string, unknown>;
              const next: BudgetCaps = {};
              for (const key of CAP_KEYS) {
                const value = raw[key];
                if (typeof value === 'number' && Number.isFinite(value)) {
                  (next as Record<string, number>)[key] = value;
                }
              }
              setBudget(next);
            } catch {
              // Unparseable theirs: leave local state, still refetch below.
            }
            setConflict(null);
            setAdopting(theirs);
            void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
            toast('Reloaded their version — review it, then keep editing or close.');
          }}
          onSaveMine={(freshHash) => {
            updateDraft.mutate(
              { definition: conflict.attemptedDef, expectedHash: freshHash },
              {
                onSuccess: () => {
                  toast.success('Saved over the latest version');
                  setConflict(null);
                },
              },
            );
          }}
        />
      )}
    </Wrap>
  );
}

function CapField({
  capKey,
  budget,
  patch,
}: {
  capKey: BudgetCapKey;
  budget: BudgetState;
  patch: (part: Partial<BudgetState>) => void;
}) {
  const value = budget[capKey];
  const described = describeCap(capKey, value);
  const isSpend = capKey === 'max_cost_cents';
  const bounds = isSpend
    ? { min: 0, step: '0.01' as const }
    : capKey === 'max_total_tokens'
      ? { min: BUDGET_BOUNDS.max_total_tokens.min, max: BUDGET_BOUNDS.max_total_tokens.max, step: 100 }
      : capKey === 'wall_clock_seconds'
        ? { min: BUDGET_BOUNDS.wall_clock_seconds.min, max: BUDGET_BOUNDS.wall_clock_seconds.max, step: 1 }
        : capKey === 'max_tool_calls'
          ? { min: BUDGET_BOUNDS.max_tool_calls.min, max: BUDGET_BOUNDS.max_tool_calls.max, step: 1 }
          : { min: BUDGET_BOUNDS.max_model_calls.min, max: BUDGET_BOUNDS.max_model_calls.max, step: 1 };
  const display = value === undefined ? '' : isSpend ? String(value / 100) : String(value);

  return (
    <div style={{ marginBottom: 4 }}>
      <ControlRow>
        <ControlLabel>{CAP_LABELS[capKey]}</ControlLabel>
      </ControlRow>
      <TextInput
        type="number"
        id={`budget-${capKey}`}
        aria-label={`${CAP_LABELS[capKey]}${isSpend ? ' in dollars' : ''}`}
        value={display}
        min={bounds.min}
        {...('max' in bounds ? { max: bounds.max } : {})}
        step={bounds.step}
        placeholder={isSpend ? 'No cap' : 'Platform default'}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw.trim() === '') {
            // UNSET, not 0: explicit undefined survives the merge (a deleted
            // key in a spread copy would not) and stringifies away.
            patch({ [capKey]: undefined } as Partial<BudgetState>);
            return;
          }
          const parsed = isSpend ? Math.round(Number(raw) * 100) : Math.trunc(Number(raw));
          if (!Number.isFinite(parsed)) return;
          patch({ [capKey]: parsed } as Partial<BudgetState>);
        }}
      />
      <ToolMeta>
        {described.state}{described.whisper !== '' ? ` — ${described.whisper}` : ''}
      </ToolMeta>
    </div>
  );
}
