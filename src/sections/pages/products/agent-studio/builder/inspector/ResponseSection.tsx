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
import {
  DEFAULT_RESPONSE_POLICY,
  parseResponsePolicy,
  type ResponseOutputFormat,
  type ResponseStreaming,
} from '@lib/engine/agent-payload';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import type { ReasoningEffort } from '../lib/brain-model';
import { ConflictDialog } from './ConflictDialog';
import { TextInput } from '@components/common/ui/TextInput';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { EmptyState, Whisper, Wrap } from './InstructionsSection.styles';
import {
  AdvancedToggle,
  FieldBlock,
  FieldHead,
  FieldHelper,
  FieldTitle,
  ParamHead,
  ParamName,
  ParamRow,
  ParamValue,
  PresetPill,
  PresetRow,
  SwitchRow,
  SwitchSub,
  SwitchText,
  SwitchTitle,
} from './ResponseSection.styles';

export interface ResponseSectionProps {
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

interface PolicyState {
  output_format: ResponseOutputFormat;
  citations_enabled: boolean;
  streaming: ResponseStreaming;
  /**
   * Lives in model_params (the engine's responsePolicySchema is strict with
   * only the three render fields). A custom string from another client is
   * preserved read-only — caps holds the save until the maker picks a preset.
   */
  reasoning_effort?: ReasoningEffort | string;
  top_p?: number;
}

function readPolicy(definition: AgentDefinition): PolicyState {
  const stored = definition.response_policy;
  const params = definition.model_params;
  return {
    output_format: stored?.output_format ?? DEFAULT_RESPONSE_POLICY.output_format,
    citations_enabled: stored?.citations_enabled ?? DEFAULT_RESPONSE_POLICY.citations_enabled,
    streaming: stored?.streaming ?? DEFAULT_RESPONSE_POLICY.streaming,
    ...(params.reasoning_effort !== undefined ? { reasoning_effort: params.reasoning_effort } : {}),
    ...(params.top_p !== undefined ? { top_p: params.top_p } : {}),
  };
}

/** Engine contract: minimal | low | medium | high (validation.ts modelParamsSchema). */
const EFFORT_ORDER: readonly string[] = ['minimal', 'low', 'medium', 'high'];

function effortLabel(effort: string): string {
  return effort.charAt(0).toUpperCase() + effort.slice(1);
}

/** A stored effort outside the console's presets (written by another client). */
function isCustomEffort(effort: string | undefined): boolean {
  return effort !== undefined && !(EFFORT_ORDER as readonly string[]).includes(effort);
}

function describePolicy(policy: PolicyState): string {
  const format = policy.output_format === 'plain' ? 'Plain text' : 'Markdown';
  const streaming = policy.streaming.charAt(0).toUpperCase() + policy.streaming.slice(1);
  return `${format} · citations ${policy.citations_enabled ? 'on' : 'off'} · streaming ${streaming}`;
}

/**
 * Response node — the single editor of `response_policy` (output format,
 * citations, streaming) plus `model_params.reasoning_effort` /
 * `model_params.top_p`. Absent policy = engine defaults (markdown, citations
 * on, streaming auto); the first edit writes the full render object, never
 * partial keys. The Advanced pair lives in model_params because the engine's
 * responsePolicySchema is strict with only the three render fields — every
 * control maps to a real contract field, no preview, no latency SLO, no
 * schedule invented.
 */
export function ResponseSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
  saveSignal = 0,
}: ResponseSectionProps) {
  const queryClient = useQueryClient();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [policy, setPolicy] = useState<PolicyState>(() =>
    definition ? readPolicy(definition) : { ...DEFAULT_RESPONSE_POLICY },
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
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
    // The engine's responsePolicySchema is strict with only the three render
    // fields — reasoning effort and top-p ride model_params (the same contract
    // the Brain section writes). Keys owned by other sections merge through
    // untouched; clearing a control deletes the key, never leaves a stale one.
    const params = { ...definition.model_params };
    if (policy.reasoning_effort !== undefined) {
      // A custom stored string is preserved in state but caps holds the save
      // until the maker picks a preset — the engine rejects unknown enum
      // values, so this cast never reaches the wire for a custom value.
      params.reasoning_effort = policy.reasoning_effort as ReasoningEffort;
    } else {
      delete params.reasoning_effort;
    }
    if (policy.top_p !== undefined) {
      params.top_p = policy.top_p;
    } else {
      delete params.top_p;
    }
    return buildDraftPayload(definition, {
      response_policy: {
        output_format: policy.output_format,
        citations_enabled: policy.citations_enabled,
        streaming: policy.streaming,
      },
      model_params: params,
    });
  }, [definition, policy]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    const next = buildNext();
    if (next) {
      messages.push(
        ...checkDefinitionCaps(next)
          .filter(
            (issue) =>
              issue.path === 'response_policy' ||
              issue.path.startsWith('response_policy.') ||
              // The Advanced pair is validated under model_params; the rest of
              // model_params belongs to Brain — never hold this section on its issues.
              issue.path === 'model_params.reasoning_effort' ||
              issue.path === 'model_params.top_p',
          )
          .map((i) => i.message),
      );
    }
    return messages;
  }, [buildNext]);
  const blocked = heldMessages.length > 0;
  const pending = saveDraft.isPending || updateDraft.isPending;

  const sourcePolicyJson = useMemo(
    () =>
      definition
        ? JSON.stringify({
            response_policy: definition.response_policy ?? null,
            model_params: definition.model_params,
          })
        : null,
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
                attempted: JSON.stringify({
                  response_policy: next.response_policy,
                  model_params: next.model_params,
                }),
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
          toast.success('A draft opened elsewhere — resumed it. Your response policy stays; the next save writes to it.');
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

  const patch = useCallback((part: Partial<PolicyState>) => {
    setPolicy((prev) => ({ ...prev, ...part }));
  }, []);

  const clampTopP = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (trimmed === '') {
        setPolicy((prev) => {
          const next = { ...prev };
          delete next.top_p;
          return next;
        });
        return;
      }
      const value = Number(trimmed);
      if (!Number.isFinite(value)) return;
      // Snap to the 0.05 step grid and kill float artifacts (0.95 must
      // persist as 0.95, never 0.9500000000000001). Floor at 0.05 — the
      // engine rejects top_p <= 0 (z.number().gt(0)), so 0 can never save.
      const clamped = Math.min(1, Math.max(0.05, value));
      patch({ top_p: Number((Math.round(clamped / 0.05) * 0.05).toFixed(2)) });
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

  if (!canAuthor) {
    return (
      <Wrap>
        <FieldBlock>
          <FieldHead>
            <FieldTitle>Response</FieldTitle>
          </FieldHead>
          <SwitchRow>
            <SwitchText>
              <SwitchTitle>Format</SwitchTitle>
              <SwitchSub>{policy.output_format === 'plain' ? 'Plain text' : 'Markdown'}</SwitchSub>
            </SwitchText>
          </SwitchRow>
          <SwitchRow>
            <SwitchText>
              <SwitchTitle>Citations</SwitchTitle>
              <SwitchSub>{policy.citations_enabled ? 'On' : 'Off'}</SwitchSub>
            </SwitchText>
          </SwitchRow>
          <SwitchRow>
            <SwitchText>
              <SwitchTitle>Streaming</SwitchTitle>
              <SwitchSub>{policy.streaming.charAt(0).toUpperCase() + policy.streaming.slice(1)}</SwitchSub>
            </SwitchText>
          </SwitchRow>
          <SwitchRow>
            <SwitchText>
              <SwitchTitle>Reasoning</SwitchTitle>
              <SwitchSub>{policy.reasoning_effort ? effortLabel(policy.reasoning_effort) : 'Default'}</SwitchSub>
            </SwitchText>
          </SwitchRow>
          <SwitchRow>
            <SwitchText>
              <SwitchTitle>Top-p</SwitchTitle>
              <SwitchSub>{policy.top_p ?? 'Default'}</SwitchSub>
            </SwitchText>
          </SwitchRow>
          <FieldHelper>Response needs an owner, admin, or developer — {denied}</FieldHelper>
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
      {/* Output format */}
      <FieldBlock>
        <FieldHead>
          <FieldTitle>Output format</FieldTitle>
        </FieldHead>
        <PresetRow role="group" aria-label="Output format">
          <PresetPill
            type="button"
            $active={policy.output_format === 'markdown'}
            aria-pressed={policy.output_format === 'markdown'}
            onClick={() => patch({ output_format: 'markdown' })}
          >
            Markdown
          </PresetPill>
          <PresetPill
            type="button"
            $active={policy.output_format === 'plain'}
            aria-pressed={policy.output_format === 'plain'}
            onClick={() => patch({ output_format: 'plain' })}
          >
            Plain text
          </PresetPill>
        </PresetRow>
        <FieldHelper>Plain text strips formatting — use it for SMS/voice-style channels.</FieldHelper>
      </FieldBlock>

      {/* Citations */}
      <FieldBlock>
        <FieldHead>
          <FieldTitle>Citations</FieldTitle>
        </FieldHead>
        <PresetRow role="group" aria-label="Citations">
          <PresetPill
            type="button"
            $active={policy.citations_enabled}
            aria-pressed={policy.citations_enabled}
            onClick={() => patch({ citations_enabled: true })}
          >
            On
          </PresetPill>
          <PresetPill
            type="button"
            $active={!policy.citations_enabled}
            aria-pressed={!policy.citations_enabled}
            onClick={() => patch({ citations_enabled: false })}
          >
            Off
          </PresetPill>
        </PresetRow>
        <FieldHelper>Off hides source links even when the agent used retrieved knowledge.</FieldHelper>
      </FieldBlock>

      {/* Streaming */}
      <FieldBlock>
        <FieldHead>
          <FieldTitle>Streaming</FieldTitle>
        </FieldHead>
        <PresetRow role="group" aria-label="Streaming">
          {(['auto', 'on', 'off'] as const).map((mode) => (
            <PresetPill
              key={mode}
              type="button"
              $active={policy.streaming === mode}
              aria-pressed={policy.streaming === mode}
              onClick={() => patch({ streaming: mode })}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </PresetPill>
          ))}
        </PresetRow>
        <FieldHelper>Auto lets each channel decide; some channels always buffer.</FieldHelper>
      </FieldBlock>

      {/* Advanced */}
      <FieldBlock>
        <AdvancedToggle type="button" onClick={() => setAdvancedOpen((o) => !o)} aria-expanded={advancedOpen}>
          <span>Advanced · reasoning effort, top-p</span>
          {advancedOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </AdvancedToggle>
        {advancedOpen && (
          <>
            <ParamRow>
              <ParamHead>
                <ParamName>Reasoning effort</ParamName>
                <ParamValue>{policy.reasoning_effort ? effortLabel(policy.reasoning_effort) : 'default'}</ParamValue>
              </ParamHead>
              <PresetRow role="group" aria-label="Reasoning effort">
                <PresetPill
                  type="button"
                  $active={policy.reasoning_effort === undefined}
                  aria-pressed={policy.reasoning_effort === undefined}
                  onClick={() => patch({ reasoning_effort: undefined })}
                >
                  Default
                </PresetPill>
                {EFFORT_ORDER.map((effort) => (
                  <PresetPill
                    key={effort}
                    type="button"
                    $active={policy.reasoning_effort === effort}
                    aria-pressed={policy.reasoning_effort === effort}
                    onClick={() => patch({ reasoning_effort: effort })}
                  >
                    {effortLabel(effort)}
                  </PresetPill>
                ))}
              </PresetRow>
              <FieldHelper>Only meaningful when the model supports reasoning.</FieldHelper>
              {isCustomEffort(policy.reasoning_effort) && (
                <Whisper $tone="amber">
                  Custom effort “{policy.reasoning_effort}” — pick a preset to replace it.
                </Whisper>
              )}
            </ParamRow>
            <ParamRow>
              <ParamHead>
                <ParamName>Top-p</ParamName>
                <ParamValue>{policy.top_p ?? 'default'}</ParamValue>
              </ParamHead>
              <TextInput
                aria-label="Top-p (0 to 1)"
                type="number"
                min={0.05}
                max={1}
                step={0.05}
                value={policy.top_p ?? ''}
                onChange={(event) => clampTopP(event.target.value)}
                placeholder="e.g. 0.9"
              />
              <FieldHelper>Lower = more focused, higher = more varied. Rarely needs changing.</FieldHelper>
            </ParamRow>
          </>
        )}
      </FieldBlock>

      <FieldHelper>{describePolicy(policy)}</FieldHelper>

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
          selectTheirs={(live) =>
            JSON.stringify({ response_policy: live.response_policy, model_params: live.model_params })
          }
          onReloadTheirs={(theirs) => {
            try {
              const parsed = JSON.parse(theirs) as { response_policy?: unknown; model_params?: Record<string, unknown> };
              const theirsParsed = parseResponsePolicy(parsed.response_policy);
              const mps = parsed.model_params;
              // readPolicy fills the engine defaults for missing members —
              // a partial theirs must never leave undefined in state.
              setPolicy(
                readPolicy({
                  ...definition,
                  response_policy: theirsParsed,
                  model_params: {
                    ...definition.model_params,
                    ...(typeof mps?.reasoning_effort === 'string'
                      ? { reasoning_effort: mps.reasoning_effort as ReasoningEffort }
                      : {}),
                    ...(typeof mps?.top_p === 'number' ? { top_p: mps.top_p } : {}),
                  },
                }),
              );
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
