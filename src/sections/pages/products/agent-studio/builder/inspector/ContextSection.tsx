import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@lib/engine/client';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import {
  COMPACTION_COPY,
  HISTORY_MIN,
  HISTORY_SERVED_MAX,
  MEMORY_SCOPE_ORDER,
  SCOPE_CONSEQUENCES,
  SERVED_20_COPY,
  fromConsumerScope,
  parseMemoryScope,
  toConsumerScope,
  type ConsumerScope,
  type MemoryScope,
} from '../lib/memory-model';
import { ConflictDialog } from './ConflictDialog';
import { EmptyState, Whisper, Wrap } from './InstructionsSection.styles';
import {
  ChoicePill,
  ChoiceRow,
  FieldBlock,
  FieldHead,
  FieldHelper,
  FieldTitle,
  PinMeta,
  SourceItem,
  SourceList,
  StepButton,
  StepperRow,
  StepValue,
  SwitchRow,
  SwitchSub,
  SwitchText,
  SwitchTitle,
} from './ContextSection.styles';
import { Minus, Plus } from 'lucide-react';

export interface ContextSectionProps {
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

interface ContextPolicyState {
  memory_scope: ConsumerScope;
  history_limit: number;
  summary_enabled: boolean;
}

function readPolicy(definition: AgentDefinition): ContextPolicyState {
  const history = definition.context_policy.history_limit;
  // The editor's contract is 1–20 (contract ceiling aligned to the runtime
  // served-20). Legacy drafts may carry higher stored values; the editor
  // clamps rather than renders an out-of-contract control.
  const parsed = Number.isInteger(history) ? (history as number) : HISTORY_SERVED_MAX;
  const clamped = Math.min(HISTORY_SERVED_MAX, Math.max(HISTORY_MIN, parsed));
  return {
    memory_scope: toConsumerScope(parseMemoryScope(definition.context_policy.memory_scope)),
    history_limit: clamped,
    summary_enabled: definition.context_policy.summary_enabled === true,
  };
}

function scopeLabel(scope: MemoryScope): string {
  return scope.charAt(0).toUpperCase() + scope.slice(1);
}

/**
 * Context node — the SINGLE owner/editor of `context_policy` (D-N1, option A).
 * History stepper 1–20, scope pills with consequences, the real
 * `summary_enabled` toggle (engine wires it runtime-side; the toggle states
 * exactly what it sends), and the read-only knowledge-source pins (the
 * Knowledge node owns them).
 */
export function ContextSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
  saveSignal = 0,
}: ContextSectionProps) {
  const queryClient = useQueryClient();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [policy, setPolicy] = useState<ContextPolicyState>(() =>
    definition
      ? readPolicy(definition)
      : { memory_scope: 'user', history_limit: HISTORY_SERVED_MAX, summary_enabled: true },
  );
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);

  const source = useMemo(() => (definition ? readPolicy(definition) : null), [definition]);
  const current = useMemo(() => JSON.stringify(policy), [policy]);
  const dirty = source !== null && current !== JSON.stringify(source);

  if (docKey !== sourceKey && !dirty) {
    setDocKey(sourceKey);
    if (source) setPolicy(source);
  } else if (docKey !== sourceKey) {
    setDocKey(sourceKey);
  }

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const buildNext = useCallback((): AgentDefinition | null => {
    if (!definition) return null;
    return buildDraftPayload(definition, {
      context_policy: {
        ...definition.context_policy,
        memory_scope: policy.memory_scope,
        history_limit: policy.history_limit,
        summary_enabled: policy.summary_enabled,
      },
    });
  }, [definition, policy]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    const next = buildNext();
    if (next) {
      messages.push(
        ...checkDefinitionCaps(next)
          .filter((issue) => issue.path === 'context_policy' || issue.path.startsWith('context_policy.'))
          .map((i) => i.message),
      );
    }
    return messages;
  }, [buildNext]);
  const blocked = heldMessages.length > 0;
  const pending = saveDraft.isPending || updateDraft.isPending;

  const sourcePolicyJson = useMemo(
    () => (definition ? JSON.stringify({ context_policy: definition.context_policy }) : null),
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
                attempted: JSON.stringify({ context_policy: next.context_policy }),
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
          toast.success('A draft opened elsewhere — resumed it. Your context policy stays; the next save writes to it.');
        }
      },
    });
  }, [canAuthor, buildNext, blocked, conflict, isDraft, versionId, versionHash, updateDraft, saveDraft, queryClient]);

  // A2-23: shared autosave — 8s debounce plus an unmount flush so switching
  // sections persists pending edits instead of silently dropping them.
  useDraftAutosave(
    { canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition },
    doSave,
    [current],
  );

  // Manual save (topbar Save button / Ctrl+S / ⌘S): never silent — a held
  // save toasts its reason instead of swallowing the click.
  useManualSaveSignal(saveSignal, doSave, {
    canAuthor,
    blocked,
    conflict,
    holdReason: () => heldMessages[0] ?? null,
  });

  const patch = useCallback((part: Partial<ContextPolicyState>) => {
    setPolicy((prev) => ({ ...prev, ...part }));
  }, []);

  const clampHistory = useCallback(
    (value: number) => {
      if (!Number.isFinite(value)) return;
      patch({ history_limit: Math.min(HISTORY_SERVED_MAX, Math.max(HISTORY_MIN, Math.trunc(value))) });
    },
    [patch],
  );

  if (!definition) {
    return (
      <Wrap>
        <EmptyState>Loading the draft…</EmptyState>
      </Wrap>
    );
  }

  const engineScope = fromConsumerScope(policy.memory_scope);
  const sources = definition.context_policy.knowledge_sources;

  if (!canAuthor) {
    return (
      <Wrap>
        <FieldBlock>
          <FieldHead>
            <FieldTitle>Context</FieldTitle>
          </FieldHead>
          <SwitchRow>
            <SwitchText>
              <SwitchTitle>Scope</SwitchTitle>
              <SwitchSub>
                {scopeLabel(engineScope)} — {SCOPE_CONSEQUENCES[engineScope]}
              </SwitchSub>
            </SwitchText>
          </SwitchRow>
          <SwitchRow>
            <SwitchText>
              <SwitchTitle>History</SwitchTitle>
              <SwitchSub>
                {policy.history_limit} messages. {COMPACTION_COPY}
              </SwitchSub>
            </SwitchText>
          </SwitchRow>
          <SwitchRow>
            <SwitchText>
              <SwitchTitle>Summary</SwitchTitle>
              <SwitchSub>{policy.summary_enabled ? 'On' : 'Off'}</SwitchSub>
            </SwitchText>
          </SwitchRow>
          <PinMeta>Context needs an owner, admin, or developer — {denied}</PinMeta>
        </FieldBlock>
      </Wrap>
    );
  }

  return (
    <Wrap
      onKeyDown={(event) => {
        if (event.key === 'Escape' && event.target instanceof HTMLElement) {
          event.target.blur();
        }
      }}
    >
      {/* History */}
      <FieldBlock>
        <FieldHead>
          <FieldTitle>History</FieldTitle>
          <FieldHelper>{SERVED_20_COPY}</FieldHelper>
        </FieldHead>
        <StepperRow>
          <StepButton
            type="button"
            aria-label="Fewer history messages"
            disabled={policy.history_limit <= HISTORY_MIN}
            onClick={() => clampHistory(policy.history_limit - 1)}
          >
            <Minus size={15} strokeWidth={2} />
          </StepButton>
          <StepValue
            type="number"
            aria-label="History limit in messages"
            min={HISTORY_MIN}
            max={HISTORY_SERVED_MAX}
            value={policy.history_limit}
            onChange={(event) => clampHistory(Number(event.target.value))}
          />
          <StepButton
            type="button"
            aria-label="More history messages"
            disabled={policy.history_limit >= HISTORY_SERVED_MAX}
            onClick={() => clampHistory(policy.history_limit + 1)}
          >
            <Plus size={15} strokeWidth={2} />
          </StepButton>
        </StepperRow>
        <FieldHelper>{COMPACTION_COPY}</FieldHelper>
      </FieldBlock>

      {/* Scope */}
      <FieldBlock>
        <FieldHead>
          <FieldTitle>Scope</FieldTitle>
        </FieldHead>
        <ChoiceRow role="group" aria-label="Context scope">
          {MEMORY_SCOPE_ORDER.map((scope) => (
            <ChoicePill
              key={scope}
              type="button"
              $active={engineScope === scope}
              aria-pressed={engineScope === scope}
              onClick={() => patch({ memory_scope: toConsumerScope(scope) })}
            >
              {scopeLabel(scope)}
            </ChoicePill>
          ))}
        </ChoiceRow>
        <FieldHelper>{SCOPE_CONSEQUENCES[engineScope]}</FieldHelper>
      </FieldBlock>

      {/* Summary */}
      <FieldBlock>
        <FieldHead>
          <FieldTitle>Summary</FieldTitle>
        </FieldHead>
        <ChoiceRow role="group" aria-label="Conversation summary">
          <ChoicePill
            type="button"
            $active={policy.summary_enabled}
            aria-pressed={policy.summary_enabled}
            onClick={() => patch({ summary_enabled: true })}
          >
            On
          </ChoicePill>
          <ChoicePill
            type="button"
            $active={!policy.summary_enabled}
            aria-pressed={!policy.summary_enabled}
            onClick={() => patch({ summary_enabled: false })}
          >
            Off
          </ChoicePill>
        </ChoiceRow>
        <FieldHelper>
          {policy.summary_enabled
            ? 'Summaries refresh when un-summarized history passes the limit above.'
            : 'No automatic summaries — runs always read the raw window.'}
        </FieldHelper>
      </FieldBlock>

      {/* Knowledge sources — read-only; the Knowledge node owns the pins */}
      <FieldBlock>
        <FieldHead>
          <FieldTitle>Knowledge sources</FieldTitle>
          <FieldHelper>Read-only — pin sources in the Knowledge section.</FieldHelper>
        </FieldHead>
        {sources.length === 0 ? (
          <PinMeta>No sources pinned — runs use the Knowledge library as configured.</PinMeta>
        ) : (
          <SourceList>
            {sources.map((slug) => (
              <SourceItem key={slug}>{slug}</SourceItem>
            ))}
          </SourceList>
        )}
      </FieldBlock>

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
          selectTheirs={(live) => JSON.stringify({ context_policy: live.context_policy })}
          onReloadTheirs={(theirs) => {
            try {
              const parsed = JSON.parse(theirs) as { context_policy?: Partial<AgentDefinition['context_policy']> };
              const merged = parsed.context_policy ?? {};
              setPolicy(readPolicy({ ...definition, context_policy: { ...definition.context_policy, ...merged } }));
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
