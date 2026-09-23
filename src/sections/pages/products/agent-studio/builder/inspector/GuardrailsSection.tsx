import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { TextInput } from '@components/common/ui/TextInput';
import { Switch } from '@components/common/ui/Switch';
import { Segmented } from '@components/common/ui/Segmented';
import { ApiError } from '@lib/engine/client';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import type { GuardrailExecutionMode } from '@lib/engine/agent-payload';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave } from '../lib/use-draft-autosave';
import {
  CUSTOM_NAME_COPY,
  FLIP_COPY,
  INPUT_PRESETS,
  MODE_COPY,
  OUTPUT_PRESETS,
  PII_NON_RETRO_COPY,
  displayPolicyName,
  gradeGuardrails,
  parseGuardrailMode,
  resolvePolicyBehavior,
  type PolicyDirection,
} from '../lib/guardrails-model';
import { ConflictDialog } from './ConflictDialog';
import { StatusDot } from '../canvas/nodes/SlotNode.styles';
import { EmptyState, SectionLabel, Whisper, Wrap } from './InstructionsSection.styles';
import { StaticLabel, StaticRow } from './BrainSection.styles';
import { ControlLabel, ControlRow, TextButton, ToolFix, ToolMeta } from './ToolsSection.styles';
import { ModeLine, PresetPill, PresetRow } from './GuardrailsSection.styles';

export interface GuardrailsSectionProps {
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

interface PolicyState {
  input_policy: string;
  output_policy: string;
  pii_redaction: boolean;
  execution_mode: GuardrailExecutionMode;
}

function readPolicy(definition: AgentDefinition): PolicyState {
  return {
    input_policy: definition.guardrails.input_policy,
    output_policy: definition.guardrails.output_policy,
    pii_redaction: definition.guardrails.pii_redaction,
    execution_mode: parseGuardrailMode(definition.guardrails.execution_mode),
  };
}

/** Which Simple preset the raw string matches, if any (custom names match none). */
function matchPreset(raw: string, direction: PolicyDirection): string | null {
  const value = raw.trim();
  if (value === '') return direction === 'input' ? 'default' : 'brand-safe';
  const presets: readonly string[] = direction === 'input' ? INPUT_PRESETS : OUTPUT_PRESETS;
  if ((presets as readonly string[]).includes(value)) return value;
  // The engine honors the disabled synonym — surface it as Off, honestly.
  if (value === 'disabled') return 'off';
  return null;
}

function presetLabel(preset: string): string {
  if (preset === 'brand-safe') return 'Brand-safe';
  return preset.charAt(0).toUpperCase() + preset.slice(1);
}

/**
 * C07 mount — protection presets, PII, verdict execution mode, advanced custom
 * names with resolved readout; the proven save machine (debounce, PUT/POST,
 * 409 adopt, 412 dialog, dirty flag). Policies are NAMES resolved engine-side
 * (moderation.ts) — this section never invents pattern/threshold authoring.
 */
export function GuardrailsSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
}: GuardrailsSectionProps) {
  const queryClient = useQueryClient();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [policy, setPolicy] = useState<PolicyState>(() => (definition ? readPolicy(definition) : {
    input_policy: '',
    output_policy: '',
    pii_redaction: true,
    execution_mode: 'blocking',
  }));
  const [advanced, setAdvanced] = useState(false);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const sendHashRef = useRef('');

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
      guardrails: {
        input_policy: policy.input_policy,
        output_policy: policy.output_policy,
        pii_redaction: policy.pii_redaction,
        execution_mode: policy.execution_mode,
      },
    });
  }, [definition, policy]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    const next = buildNext();
    if (next) {
      messages.push(
        ...checkDefinitionCaps(next)
          .filter((issue) => issue.path === 'guardrail_policy' || issue.path.startsWith('guardrail_policy.') || issue.path === 'secrets')
          .map((i) => i.message),
      );
    }
    return messages;
  }, [buildNext]);
  const blocked = heldMessages.length > 0;
  const pending = saveDraft.isPending || updateDraft.isPending;

  const sourcePolicyJson = useMemo(
    () => (definition ? JSON.stringify({ guardrails: definition.guardrails }) : null),
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
                attempted: JSON.stringify({ guardrails: next.guardrails }),
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
          toast.success('A draft opened elsewhere — resumed it. Your guardrails stay; the next save writes to it.');
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

  const patch = useCallback((part: Partial<PolicyState>) => {
    setPolicy((prev) => ({ ...prev, ...part }));
  }, []);

  if (!definition) {
    return (
      <Wrap>
        <EmptyState>Loading the draft…</EmptyState>
      </Wrap>
    );
  }

  if (!canAuthor) {
    const grade = gradeGuardrails(policy);
    const inputResolved = resolvePolicyBehavior(policy.input_policy, policy.execution_mode);
    const outputResolved = resolvePolicyBehavior(policy.output_policy, policy.execution_mode);
    return (
      <Wrap>
        <StaticRow>
          <StaticLabel>Mode</StaticLabel>
          <span>{policy.execution_mode === 'logging' ? MODE_COPY.logging : MODE_COPY.blocking}</span>
        </StaticRow>
        <StaticRow>
          <StaticLabel>Input</StaticLabel>
          <span>{displayPolicyName(policy.input_policy, 'input')} — {inputResolved.consequence}</span>
        </StaticRow>
        <StaticRow>
          <StaticLabel>Output</StaticLabel>
          <span>{displayPolicyName(policy.output_policy, 'output')} — {outputResolved.consequence}</span>
        </StaticRow>
        <StaticRow>
          <StaticLabel>PII</StaticLabel>
          <span>{policy.pii_redaction ? 'redaction on' : 'redaction off — identifiers reach storage, logs, and the provider'}</span>
        </StaticRow>
        <ToolMeta>{grade.subtitle}. Guardrails need an owner, admin, or developer — {denied}</ToolMeta>
      </Wrap>
    );
  }

  const grade = gradeGuardrails(policy);
  const directions: PolicyDirection[] = ['input', 'output'];

  return (
    <Wrap
      onKeyDown={(event) => {
        if (event.key === 'Escape' && event.target instanceof HTMLElement) {
          event.target.blur();
        }
      }}
    >
      {/* Block A · protection */}
      <div>
        <SectionLabel>PROTECTION</SectionLabel>
        {directions.map((direction) => {
          const raw = direction === 'input' ? policy.input_policy : policy.output_policy;
          const matched = matchPreset(raw, direction);
          const resolved = resolvePolicyBehavior(raw, policy.execution_mode);
          const presets: readonly string[] = direction === 'input' ? INPUT_PRESETS : OUTPUT_PRESETS;
          return (
            <div key={direction}>
              <ControlRow>
                <ControlLabel>{direction === 'input' ? 'Input screening' : 'Output screening'}</ControlLabel>
              </ControlRow>
              <PresetRow role="group" aria-label={`${direction} screening preset`}>
                {presets.map((preset) => (
                  <PresetPill
                    key={preset}
                    type="button"
                    $active={matched === preset}
                    aria-pressed={matched === preset}
                    onClick={() => patch(direction === 'input' ? { input_policy: preset } : { output_policy: preset })}
                  >
                    {presetLabel(preset)}
                  </PresetPill>
                ))}
              </PresetRow>
              {matched === null ? (
                advanced ? null : (
                  <ToolFix>
                    {`Custom name “${raw.trim()}” — ${resolved.consequence} ${CUSTOM_NAME_COPY}`}
                  </ToolFix>
                )
              ) : resolved.behavior === 'disabled' ? (
                <Whisper $tone="amber">
                  {direction === 'input' ? 'Input' : 'Output'} screening is off — {resolved.consequence}
                </Whisper>
              ) : (
                <ToolMeta>{resolved.consequence}</ToolMeta>
              )}
            </div>
          );
        })}
        <ControlRow>
          <ControlLabel>PII redaction</ControlLabel>
          <Switch
            checked={policy.pii_redaction}
            onChange={(next) => patch({ pii_redaction: next })}
            label="PII redaction"
            id="guardrails-pii"
          />
        </ControlRow>
        <ToolMeta>
          Identifiers are redacted before storage and logging. {PII_NON_RETRO_COPY}
        </ToolMeta>
        {!policy.pii_redaction && (
          <Whisper $tone="amber">PII off — identifiers reach storage, logs, and the provider.</Whisper>
        )}
      </div>

      {/* Block B · execution mode */}
      <div>
        <SectionLabel>EXECUTION MODE</SectionLabel>
        <Segmented
          options={[
            { value: 'blocking', label: 'Blocking' },
            { value: 'logging', label: 'Logging' },
          ]}
          value={policy.execution_mode}
          onChange={(value) => patch({ execution_mode: value as GuardrailExecutionMode })}
          size="sm"
          ariaLabel="Guardrail execution mode"
        />
        <ModeLine>
          <StatusDot $status={policy.execution_mode === 'logging' ? 'attention' : 'ready'} aria-hidden="true" />
          <span>{policy.execution_mode === 'logging' ? MODE_COPY.logging : MODE_COPY.blocking}</span>
        </ModeLine>
        {policy.execution_mode === 'logging' ? (
          <ToolFix>Measure first: watch what WOULD have been refused, then flip. {FLIP_COPY}</ToolFix>
        ) : (
          <ToolMeta>{FLIP_COPY}</ToolMeta>
        )}
        {grade.status === 'attention' && grade.hint !== '' && policy.execution_mode !== 'logging' && (
          <Whisper $tone="amber">{grade.hint}</Whisper>
        )}
      </div>

      {/* Block C · advanced */}
      <div>
        <SectionLabel>ADVANCED</SectionLabel>
        {!advanced ? (
          <TextButton type="button" onClick={() => setAdvanced(true)}>
            Custom policy names · resolved behavior shown →
          </TextButton>
        ) : (
          <>
            <TextButton type="button" onClick={() => setAdvanced(false)}>
              ← Back to presets
            </TextButton>
            {directions.map((direction) => {
              const raw = direction === 'input' ? policy.input_policy : policy.output_policy;
              const resolved = resolvePolicyBehavior(raw, policy.execution_mode);
              return (
                <div key={direction} style={{ marginTop: 8 }}>
                  <TextInput
                    label={`Custom ${direction} policy name`}
                    id={`guardrails-custom-${direction}`}
                    value={raw}
                    onChange={(event) =>
                      patch(direction === 'input' ? { input_policy: event.target.value } : { output_policy: event.target.value })
                    }
                    placeholder={direction === 'input' ? 'default' : 'brand-safe'}
                  />
                  <ToolMeta>
                    {displayPolicyName(raw, direction)} — {resolved.consequence}
                  </ToolMeta>
                </div>
              );
            })}
            <ToolMeta>{CUSTOM_NAME_COPY}</ToolMeta>
          </>
        )}
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
          selectTheirs={(live) => JSON.stringify({ guardrails: live.guardrails })}
          onReloadTheirs={(theirs) => {
            try {
              const parsed = JSON.parse(theirs) as { guardrails?: unknown };
              const guardrails = (parsed.guardrails ?? {}) as Record<string, unknown>;
              setPolicy({
                input_policy: typeof guardrails.input_policy === 'string' ? guardrails.input_policy : '',
                output_policy: typeof guardrails.output_policy === 'string' ? guardrails.output_policy : '',
                pii_redaction: guardrails.pii_redaction !== false,
                execution_mode: guardrails.execution_mode === 'logging' ? 'logging' : 'blocking',
              });
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
