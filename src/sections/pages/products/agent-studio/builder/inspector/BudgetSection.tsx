import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { TextInput } from '@components/common/ui/TextInput';
import { Segmented } from '@components/common/ui/Segmented';
import { ApiError } from '@lib/engine/client';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import { useModelAvailability, useModelCosts } from '@hooks/studio/useSetupModels';
import type { ConsumerDefinition } from '@lib/engine/agent-payload';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import {
  BUDGET_BOUNDS,
  CAP_LABELS,
  PLATFORM_DEFAULTS,
  describeCap,
  estimateRun,
  formatEstimateDollars,
  type BudgetCapKey,
  type BudgetCaps,
} from '../lib/budget-model';
import { ConflictDialog } from './ConflictDialog';
import { SkeletonRows } from './SkeletonRows';
import { Whisper } from './InstructionsSection.styles';
import { SectionGroup, SectionPage, MicroTip } from '../section-ui/SectionPage';
import {
  Badge,
  CapControl,
  CapHelper,
  CapInput,
  CapLabel,
  CapRowWrap,
  CapText,
  CardFootnote,
  CardHead,
  CardIcon,
  CardSub,
  CardTitle,
  CardTitleWrap,
  Chip,
  ChipRow,
  EstimateLabel,
  EstimateRow,
  EstimateValue,
  GroupCard,
  InfoLabel,
  InfoRow,
  InfoValue,
  ModelChip,
  Pill,
  PillDot,
  RailCard,
  RailDot,
  RailLabel,
  RailLoading,
  RailRow,
  RailTitle,
  RailValue,
  RowDivider,
  UsageLink,
} from './BudgetSection.styles';

export interface BudgetSectionProps {
  assistantId: string;
  definition: AgentDefinition | null;
  versionId: string | null;
  versionHash: string | null;
  isDraft: boolean;
  canAuthor: boolean;
  onDirtyChange: (dirty: boolean) => void;
  /** Manual save counter (topbar Save button / Ctrl+S) — fires doSave when it increments.
   *  Optional: sections rendered without a save source (tests, standalone) default to 0. */
  saveSignal?: number;
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

/** A cap counts as "set" only with a positive value — 0/unset is rendered
 *  by describeCap (platform default or no watchdog), so the badge never
 *  claims a configured cap the read views render as unset. */
function isCapSet(value: number | undefined): boolean {
  return value !== undefined && value > 0;
}

function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Budget — SVG redesign (2026-10-01).
 *
 * Three group cards: Caps (5 per-run limits, unset = platform default),
 * Estimate (worst-case math from the primary model's real list rate), and
 * When a cap breaks (the fail-closed law). The proven save machine is
 * untouched: 8s autosave, PUT/POST, 409 adopt, 412 dialog, dirty flag.
 */
export function BudgetSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
  saveSignal = 0,
}: BudgetSectionProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');
  const costs = useModelCosts();
  const availability = useModelAvailability();

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [budget, setBudget] = useState<BudgetState>(() => (definition ? readBudget(definition) : {}));
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);

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
      updateDraft.mutate(
        { definition: next, expectedHash: versionHash },
        {
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
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
          toast.success('A draft opened elsewhere — resumed it. Your budget stays; the next save writes to it.');
        }
      },
    });
  }, [canAuthor, buildNext, blocked, conflict, isDraft, versionId, versionHash, updateDraft, saveDraft, queryClient]);

  useDraftAutosave(
    { canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition },
    doSave,
    [current],
  );

  useManualSaveSignal(saveSignal, doSave, {
    canAuthor,
    blocked,
    conflict,
    pending,
    holdReason: () => heldMessages[0] ?? null,
  });

  const patch = useCallback((part: Partial<BudgetState>) => {
    setBudget((prev) => ({ ...prev, ...part }));
  }, []);

  // ── Derived state for the SVG layout ──────────────────────────────────

  const setCount = CAP_KEYS.filter((key) => isCapSet(budget[key])).length;
  const spendUnset = budget.max_cost_cents === undefined || budget.max_cost_cents <= 0;

  const allowed = definition?.model_policy.allowed_models ?? [];
  const primaryRef = allowed[0];
  const costsByRef = useMemo(() => new Map((costs.data ?? []).map((c) => [c.ref, c])), [costs.data]);
  const availabilityByRef = useMemo(
    () => new Map((availability.data ?? []).map((m) => [m.ref, m])),
    [availability.data],
  );
  const primaryCost = primaryRef ? costsByRef.get(primaryRef) : undefined;
  const primaryName = primaryRef
    ? (availabilityByRef.get(primaryRef)?.displayName ?? primaryRef)
    : null;

  const tokenCap = budget.max_total_tokens ?? PLATFORM_DEFAULTS.max_total_tokens;
  const worstCase = primaryCost
    ? estimateRun(tokenCap, {
        ref: primaryCost.ref,
        costMicrosPer1kInput: primaryCost.costMicrosPer1kInput,
        costMicrosPer1kOutput: primaryCost.costMicrosPer1kOutput,
        costMicrosPer1kCachedInput: primaryCost.costMicrosPer1kCachedInput,
      })
    : null;
  const worstDollars = worstCase ? worstCase.micros / 1_000_000 : null;
  const thousandRuns = worstDollars !== null ? worstDollars * 1000 : null;

  const ratePerMillion =
    primaryCost &&
    primaryCost.costMicrosPer1kInput !== null &&
    primaryCost.costMicrosPer1kOutput !== null
      ? ((primaryCost.costMicrosPer1kInput + primaryCost.costMicrosPer1kOutput) / 1_000_000) * 1000
      : null;

  const goToUsage = useCallback(() => {
    navigate({ to: '/agent-studio/usage' });
  }, [navigate]);

  const pill = spendUnset ? (
    <Pill $tone="warning">
      <PillDot aria-hidden="true" />
      spend unchecked
    </Pill>
  ) : undefined;

  const rail = (
    <>
      <RailCard>
        <RailTitle>On this page</RailTitle>
        <RailRow>
          <RailLabel>
            <RailDot $tone={spendUnset ? 'warning' : 'ok'} aria-hidden="true" />
            Caps
          </RailLabel>
          <RailValue>{setCount}/5</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>
            <RailDot $tone={worstDollars !== null ? 'ok' : 'muted'} aria-hidden="true" />
            Estimate
          </RailLabel>
          <RailValue aria-busy={costs.isPending || undefined}>
            {costs.isPending ? (
              <RailLoading>loading…</RailLoading>
            ) : worstDollars !== null ? (
              formatEstimateDollars(worstDollars)
            ) : (
              '—'
            )}
          </RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>
            <RailDot $tone="ok" aria-hidden="true" />
            Cap breaks
          </RailLabel>
          <RailValue>closed</RailValue>
        </RailRow>
      </RailCard>
      <RailCard>
        <RailTitle>Set vs default</RailTitle>
        <RailRow>
          <RailLabel>Spend cap</RailLabel>
          <RailValue $tone={spendUnset ? 'warning' : undefined}>
            {describeCap('max_cost_cents', budget.max_cost_cents).state}
          </RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>Total tokens</RailLabel>
          <RailValue>{describeCap('max_total_tokens', budget.max_total_tokens).state}</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>Tool calls</RailLabel>
          <RailValue>{describeCap('max_tool_calls', budget.max_tool_calls).state}</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>Model calls</RailLabel>
          <RailValue>{describeCap('max_model_calls', budget.max_model_calls).state}</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>Wall clock</RailLabel>
          <RailValue>{describeCap('wall_clock_seconds', budget.wall_clock_seconds).state}</RailValue>
        </RailRow>
      </RailCard>
      <RailCard>
        <MicroTip>
          Fail-closed means a broken cap stops the run — never a quiet overage on someone's invoice.
        </MicroTip>
      </RailCard>
    </>
  );

  if (!definition) {
    return (
      <SectionPage
        title="Budget"
        subtitle="What a single run may spend, consume, and take — before it fails closed."
      >
        <SkeletonRows rows={4} />
      </SectionPage>
    );
  }

  if (!canAuthor) {
    return (
      <SectionPage
        title="Budget"
        subtitle="What a single run may spend, consume, and take — before it fails closed."
        pill={pill}
        rail={rail}
      >
        <SectionGroup label="Caps">
          <GroupCard>
            {CAP_KEYS.map((key, i) => (
              <div key={key}>
                {i > 0 && <RowDivider />}
                <InfoRow>
                  <InfoLabel>{CAP_LABELS[key]}</InfoLabel>
                  <InfoValue>{describeCap(key, budget[key]).state}</InfoValue>
                </InfoRow>
              </div>
            ))}
          </GroupCard>
        </SectionGroup>
        <SectionGroup label="When a cap breaks">
          <GroupCard>
            <CardHead>
              <CardIcon $tone="ok">✓</CardIcon>
              <CardTitleWrap>
                <CardTitle>When a cap breaks</CardTitle>
                <CardSub>Every dimension fails closed — never a quiet overage.</CardSub>
              </CardTitleWrap>
            </CardHead>
            <InfoRow>
              <InfoLabel>Run outcome</InfoLabel>
              <Badge $tone="danger">FAILED · terminal event</Badge>
            </InfoRow>
          </GroupCard>
        </SectionGroup>
        <Whisper $tone="amber">Budget needs an owner, admin, or developer — {denied}</Whisper>
      </SectionPage>
    );
  }

  return (
    <SectionPage
      title="Budget"
      subtitle="What a single run may spend, consume, and take — before it fails closed."
      pill={pill}
      rail={rail}
    >
      {/* Caps */}
      <SectionGroup label="Caps">
        <GroupCard>
          <CardHead>
            <CardIcon $tone="warning">!</CardIcon>
            <CardTitleWrap>
              <CardTitle>Caps</CardTitle>
              <CardSub>Per-run limits. Unset means the platform default serves.</CardSub>
            </CardTitleWrap>
            <Badge>{setCount} of 5 set</Badge>
          </CardHead>
          {CAP_KEYS.map((key, i) => (
            <div key={key}>
              {i > 0 && <RowDivider />}
              <CapField capKey={key} budget={budget} patch={patch} />
            </div>
          ))}
          <CardFootnote>Clear a field to unset it — platform defaults resume.</CardFootnote>
        </GroupCard>
      </SectionGroup>

      {/* Estimate */}
      <SectionGroup label="Estimate">
        <GroupCard>
          <CardHead>
            <CardIcon $tone="ok">✓</CardIcon>
            <CardTitleWrap>
              <CardTitle>Estimate</CardTitle>
              <CardSub>Rough, not the bill — derived from the primary model's list rate.</CardSub>
            </CardTitleWrap>
            <UsageLink type="button" onClick={goToUsage}>
              Open Usage (measured) →
            </UsageLink>
          </CardHead>
          {costs.isPending || availability.isPending ? (
            <SkeletonRows rows={3} />
          ) : costs.isError ? (
            <Whisper $tone="amber">Prices are unreachable — caps above still save; estimates resume on reload.</Whisper>
          ) : !primaryRef ? (
            <Whisper $tone="amber">Pick a model in the Model section — estimates need a priced model, never a fake $0.</Whisper>
          ) : !primaryCost || ratePerMillion === null ? (
            <Whisper $tone="amber">{primaryName ?? primaryRef} is unpriced — no estimate to show.</Whisper>
          ) : (
            <>
              <EstimateRow>
                <EstimateLabel>Primary model</EstimateLabel>
                <ModelChip>
                  {primaryName} · {formatEstimateDollars(ratePerMillion)} / M
                </ModelChip>
              </EstimateRow>
              <RowDivider />
              <EstimateRow>
                <EstimateLabel>Worst case per run · {formatCount(tokenCap)}-token cap</EstimateLabel>
                <EstimateValue>{formatEstimateDollars(worstDollars ?? 0)}</EstimateValue>
              </EstimateRow>
              <RowDivider />
              <EstimateRow>
                <EstimateLabel>At 1,000 runs</EstimateLabel>
                <EstimateValue>{formatEstimateDollars(thousandRuns ?? 0)}</EstimateValue>
              </EstimateRow>
            </>
          )}
          <CardFootnote>Uncached rates — measured spend lives in Usage, not here.</CardFootnote>
        </GroupCard>
      </SectionGroup>

      {/* When a cap breaks */}
      <SectionGroup label="When a cap breaks">
        <GroupCard>
          <CardHead>
            <CardIcon $tone="ok">✓</CardIcon>
            <CardTitleWrap>
              <CardTitle>When a cap breaks</CardTitle>
              <CardSub>Every dimension fails closed — never a quiet overage.</CardSub>
            </CardTitleWrap>
          </CardHead>
          <InfoRow>
            <InfoLabel>Run outcome</InfoLabel>
            <Badge $tone="danger">FAILED · terminal event</Badge>
          </InfoRow>
          <RowDivider />
          <InfoRow>
            <InfoLabel>Event names</InfoLabel>
            <ChipRow>
              {['spend', 'tokens', 'tools', 'models', 'clock'].map((name) => (
                <Chip key={name}>{name}</Chip>
              ))}
            </ChipRow>
          </InfoRow>
          <RowDivider />
          <InfoRow>
            <InfoLabel>Quota</InfoLabel>
            <InfoValue>released immediately on failure</InfoValue>
          </InfoRow>
          <RowDivider />
          <InfoRow>
            <InfoLabel>Edits ship</InfoLabel>
            <InfoValue>with the version — publish to serve them</InfoValue>
          </InfoRow>
        </GroupCard>
      </SectionGroup>

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
    </SectionPage>
  );
}

const CAP_HELPERS: Record<BudgetCapKey, string> = {
  max_cost_cents: 'Unset or $0 — runs are cost-unchecked.',
  max_total_tokens: 'Tokens per run — prompt plus completion.',
  max_tool_calls: 'Calls per run across every bound tool.',
  max_model_calls: 'Calls per run including retries and fallbacks.',
  wall_clock_seconds: 'Seconds or minutes before the run is cut — unset means no time limit.',
};

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
  const isSpend = capKey === 'max_cost_cents';
  const isWallClock = capKey === 'wall_clock_seconds';

  // Wall clock: the SVG pairs the number with an s/min segmented toggle.
  const [unit, setUnit] = useState<'s' | 'min'>('s');
  const displayValue = (() => {
    if (value === undefined) return '';
    if (isSpend) return String(value / 100);
    if (isWallClock && unit === 'min') return String(value / 60);
    return String(value);
  })();

  const bounds = isSpend
    ? { min: 0, step: '0.01' as const }
    : capKey === 'max_total_tokens'
      ? { min: BUDGET_BOUNDS.max_total_tokens.min, max: BUDGET_BOUNDS.max_total_tokens.max, step: 100 }
      : isWallClock
        ? { min: BUDGET_BOUNDS.wall_clock_seconds.min, max: BUDGET_BOUNDS.wall_clock_seconds.max, step: 1 }
        : capKey === 'max_tool_calls'
          ? { min: BUDGET_BOUNDS.max_tool_calls.min, max: BUDGET_BOUNDS.max_tool_calls.max, step: 1 }
          : { min: BUDGET_BOUNDS.max_model_calls.min, max: BUDGET_BOUNDS.max_model_calls.max, step: 1 };

  const handleChange = (raw: string) => {
    if (raw.trim() === '') {
      // UNSET, not 0: explicit undefined survives the merge and stringifies away.
      patch({ [capKey]: undefined } as Partial<BudgetState>);
      return;
    }
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) return;
    if (isSpend) {
      patch({ [capKey]: Math.round(numeric * 100) } as Partial<BudgetState>);
      return;
    }
    const seconds = isWallClock && unit === 'min' ? numeric * 60 : numeric;
    patch({ [capKey]: Math.trunc(seconds) } as Partial<BudgetState>);
  };

  const badge = (() => {
    if (isSpend) {
      return value === undefined || value <= 0 ? (
        <Badge $tone="warning">unchecked</Badge>
      ) : null;
    }
    if (value === undefined) {
      switch (capKey) {
        case 'max_total_tokens':
          return <Badge>{formatCount(PLATFORM_DEFAULTS.max_total_tokens)}</Badge>;
        case 'max_tool_calls':
          return <Badge>{PLATFORM_DEFAULTS.max_tool_calls}</Badge>;
        case 'max_model_calls':
          return <Badge>{PLATFORM_DEFAULTS.max_model_calls}</Badge>;
        case 'wall_clock_seconds':
          return <Badge $tone="warning">not set</Badge>;
      }
    }
    return null;
  })();

  return (
    <CapRowWrap>
      <CapText>
        <CapLabel>{CAP_LABELS[capKey]}</CapLabel>
        <CapHelper>{CAP_HELPERS[capKey]}</CapHelper>
      </CapText>
      <CapControl>
        <CapInput>
          <TextInput
            type="number"
            id={`budget-${capKey}`}
            aria-label={`${CAP_LABELS[capKey]}${isSpend ? ' in dollars' : ''}`}
            value={displayValue}
            min={bounds.min}
            {...('max' in bounds ? { max: bounds.max } : {})}
            step={bounds.step}
            placeholder={isSpend ? 'No cap' : isWallClock ? 'No limit' : 'Default'}
            onChange={(event) => handleChange(event.target.value)}
          />
        </CapInput>
        {isWallClock && (
          <Segmented
            options={[
              { value: 's', label: 's' },
              { value: 'min', label: 'min' },
            ]}
            value={unit}
            onChange={setUnit}
            ariaLabel="Wall clock unit"
          />
        )}
        {badge}
      </CapControl>
    </CapRowWrap>
  );
}
