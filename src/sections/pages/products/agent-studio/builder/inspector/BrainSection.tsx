import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { ApiError } from '@lib/engine/client';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import { useSectionConfirmationContext } from '../lib/section-confirmation-context';
import {
  matchPreset,
  MODEL_PRESETS,
  type ReasoningEffort,
} from '../lib/brain-model';
import { ConflictDialog } from './ConflictDialog';
import { Wrap } from './InstructionsSection.styles';
import { SkeletonRows } from './SkeletonRows';
import {
  FieldBlock,
  FieldHead,
  FieldHelper,
  FieldTitle,
  DeniedNote,
  ProfileCard,
  ProfileGrid,
  ProfileMap,
  ProfileMatch,
  ProfileBlurb,
  ProfileName,
} from './BrainSection.styles';

export interface BrainSectionProps {
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
  /** Display JSON (dialog) — the frozen payload rides alongside for save-over. */
  attempted: string;
  attemptedDef: AgentDefinition;
}

interface ParamDraft {
  temperature?: number;
  max_output_tokens?: number;
  top_p?: number;
  reasoning_effort?: ReasoningEffort;
  output_schema?: string;
}

function readParams(definition: AgentDefinition): ParamDraft {
  const params = definition.model_params;
  return {
    ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
    ...(params.max_output_tokens !== undefined ? { max_output_tokens: params.max_output_tokens } : {}),
    ...(params.top_p !== undefined ? { top_p: params.top_p } : {}),
    ...(params.reasoning_effort !== undefined ? { reasoning_effort: params.reasoning_effort } : {}),
    ...(params.output_schema !== undefined ? { output_schema: params.output_schema } : {}),
  };
}

/**
 * Brain node — reasoning profiles only (v10.1). The model picker, fallback
 * chain, and raw params moved to the Model node; the Brain keeps the named
 * reasoning presets (Clerk/Scholar/Creator) that shape how the selected
 * model thinks. Presets write the same `model_params` the Model node's
 * sliders edit — a single inspector section mounts at a time and the
 * unmount flush persists pending edits, so the two never clobber each
 * other. output_schema is preserved verbatim on every preset apply (the
 * payload builder replaces model_params wholesale).
 *
 * The proven save state machine (debounce, PUT/POST, 409 adopt, 412 dialog,
 * dirty flag) is shared with the other policy sections.
 */
export function BrainSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
  saveSignal = 0,
}: BrainSectionProps) {
  const queryClient = useQueryClient();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [params, setParams] = useState<ParamDraft>(() => (definition ? readParams(definition) : {}));
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const sendHashRef = useRef('');

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);

  const source = useMemo(
    () => (definition ? readParams(definition) : {}),
    [definition],
  );
  const current = useMemo(() => JSON.stringify({ params }), [params]);
  const dirty = current !== JSON.stringify({ params: source });

  // Adopt server slices whenever clean (save echo, 409-adopt, reload-theirs).
  if (docKey !== sourceKey && !dirty) {
    setDocKey(sourceKey);
    setParams(source);
  } else if (docKey !== sourceKey) {
    setDocKey(sourceKey);
  }

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const matchedPreset = matchPreset({
    temperature: params.temperature,
    top_p: params.top_p,
    max_output_tokens: params.max_output_tokens,
    reasoning_effort: params.reasoning_effort,
  });

  const buildNext = useCallback((): AgentDefinition | null => {
    if (!definition) return null;
    return buildDraftPayload(definition, {
      model_params: {
        ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
        ...(params.max_output_tokens !== undefined ? { max_output_tokens: params.max_output_tokens } : {}),
        ...(params.top_p !== undefined ? { top_p: params.top_p } : {}),
        ...(params.reasoning_effort !== undefined ? { reasoning_effort: params.reasoning_effort } : {}),
        ...(params.output_schema !== undefined ? { output_schema: params.output_schema } : {}),
      },
    });
  }, [definition, params]);

  // Presets land inside engine ranges (asserted by brain-model.test.ts), so
  // nothing here can hold the autosave — presets apply and save cleanly.
  const blocked = false;
  const pending = saveDraft.isPending || updateDraft.isPending;
  // Convergence is measured in POLICY shape (what the dialog hands back), not
  // local shape — comparing across shapes would park autosave forever.
  const sourcePolicyJson = useMemo(
    () => (definition ? JSON.stringify({ model_params: definition.model_params }) : null),
    [definition],
  );
  const adoptingActive = adopting !== null && sourcePolicyJson !== adopting;

  // C-BUG4/M-BUG3 Option A: confirm the section when Save succeeds, so the
  // nav badge grades `ready` even at engine defaults.
  const confirmSection = useSectionConfirmationContext();

  const doSave = useCallback(() => {
    const next = buildNext();
    if (!canAuthor || !next || blocked || conflict) return;
    if (isDraft && versionId && versionHash) {
      sendHashRef.current = versionHash;
      updateDraft.mutate(
        { definition: next, expectedHash: versionHash },
        {
          onSuccess: () => confirmSection('brain'),
          onError: (error) => {
            if (error instanceof ApiError && error.status === 412) {
              const details =
                typeof error.details === 'object' && error.details !== null
                  ? (error.details as Record<string, unknown>)
                  : {};
              setConflict({
                expectedHash: versionHash,
                currentHash: typeof details.current === 'string' ? details.current : null,
                attempted: JSON.stringify({ model_params: next.model_params }),
                attemptedDef: next,
              });
            }
          },
        },
      );
      return;
    }
    saveDraft.mutate(next, {
      onSuccess: () => confirmSection('brain'),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
          toast.success('A draft opened elsewhere — resumed it. Your text stays; the next save writes to it.');
        }
      },
    });
  }, [canAuthor, buildNext, blocked, conflict, isDraft, versionId, versionHash, updateDraft, saveDraft, queryClient, confirmSection]);

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
    pending,
    holdReason: () => null,
  });

  const applyPreset = useCallback(
    (presetId: 'clerk' | 'scholar' | 'creator') => {
      const preset = MODEL_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;
      // Preset overwrites the four reasoning params; output_schema (edited in
      // the Model node) rides along untouched from local state.
      setParams((prev) => ({
        ...prev,
        temperature: preset.params.temperature,
        top_p: preset.params.top_p,
        max_output_tokens: preset.params.max_output_tokens,
        reasoning_effort: preset.params.reasoning_effort,
      }));
    },
    [],
  );

  if (!definition) {
    return (
      <Wrap>
        <SkeletonRows rows={4} />
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
      <FieldBlock>
        <FieldHead>
          <FieldTitle>Reasoning profile</FieldTitle>
          <FieldHelper>
            How the model thinks — one tap sets temperature, top-p, max output, and reasoning effort.
            Fine-tune the raw values in Model.
          </FieldHelper>
        </FieldHead>
        {!canAuthor && (
          <DeniedNote>
            Brain editing needs an owner, admin, or developer — {denied} The
            current reasoning profile is highlighted below so you can still
            see how this agent thinks.
          </DeniedNote>
        )}
        <ProfileGrid>
          {MODEL_PRESETS.map((preset) => {
            const matched = matchedPreset?.id === preset.id;
            return (
              <ProfileCard
                key={preset.id}
                type="button"
                $active={matched}
                disabled={!canAuthor}
                title={`${preset.blurb} temp ${preset.params.temperature} · top_p ${preset.params.top_p} · ${preset.params.max_output_tokens} tokens · reasoning ${preset.params.reasoning_effort}`}
                onClick={canAuthor ? () => applyPreset(preset.id) : undefined}
              >
                <ProfileName>
                  {preset.label}
                  {matched && (
                    <ProfileMatch>
                      <Check size={13} strokeWidth={2.5} aria-hidden="true" />
                      Current
                    </ProfileMatch>
                  )}
                </ProfileName>
                <ProfileBlurb>{preset.blurb}</ProfileBlurb>
                <ProfileMap>
                  temp {preset.params.temperature} · top-p {preset.params.top_p} ·{' '}
                  {preset.params.max_output_tokens.toLocaleString()} tokens · {preset.params.reasoning_effort} reasoning
                </ProfileMap>
              </ProfileCard>
            );
          })}
        </ProfileGrid>
      </FieldBlock>

      {conflict && (
        <ConflictDialog
          assistantId={assistantId}
          attempted={conflict.attempted}
          expectedHash={conflict.expectedHash}
          currentHash={conflict.currentHash}
          pending={pending}
          selectTheirs={(live) => JSON.stringify({ model_params: live.model_params })}
          onReloadTheirs={(theirs) => {
            // Adopt theirs into local state + park autosave until props converge
            // (adopting gate) — never save-over blindly after asking for theirs.
            try {
              const parsed = JSON.parse(theirs) as {
                model_params?: Record<string, unknown>;
              };
              const mps = parsed.model_params;
              if (mps && typeof mps === 'object') {
                setParams({
                  ...(typeof mps.temperature === 'number' ? { temperature: mps.temperature } : {}),
                  ...(typeof mps.max_output_tokens === 'number' ? { max_output_tokens: mps.max_output_tokens } : {}),
                  ...(typeof mps.top_p === 'number' ? { top_p: mps.top_p } : {}),
                  ...(typeof mps.reasoning_effort === 'string' ? { reasoning_effort: mps.reasoning_effort as ReasoningEffort } : {}),
                  ...(typeof mps.output_schema === 'string' ? { output_schema: mps.output_schema } : {}),
                });
              }
            } catch {
              // Unparseable theirs: leave local text, still refetch below —
              // props converge and the clean-adopt path takes over.
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
                onError: (error) => {
                  if (error instanceof ApiError && error.status === 412) {
                    const details =
                      typeof error.details === 'object' && error.details !== null
                        ? (error.details as Record<string, unknown>)
                        : {};
                    setConflict({
                      expectedHash: freshHash,
                      currentHash: typeof details.current === 'string' ? details.current : conflict.currentHash,
                      attempted: conflict.attempted,
                      attemptedDef: conflict.attemptedDef,
                    });
                  }
                },
              },
            );
          }}
          onClose={() => setConflict(null)}
        />
      )}
    </Wrap>
  );
}
