import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
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
  parseResponsePolicy,
  type ResponseCitationsStyle,
  type ResponseLength,
  type ResponseOutputFormat,
  type ResponseStreaming,
} from '@lib/engine/agent-payload';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import { useSectionConfirmationContext } from '../lib/section-confirmation-context';
import { useStringDraft } from '../lib/use-string-draft';
import type { ReasoningEffort } from '../lib/brain-model';
import {
  BUFFERED_CHANNELS,
  CHANNEL_HELPERS,
  CHANNEL_IDS,
  CHANNEL_LABELS,
  CITATIONS_STYLE_OPTIONS,
  LENGTH_OPTIONS,
  channelFormat,
  channelHasOverride,
  channelStreaming,
  countChannelOverrides,
  findLegacyMaxContextTokens,
  isDefaultPolicyState,
  isLegacyFieldRejection,
  resolvePolicyState,
  withChannelFormat,
  withChannelStreaming,
  type LegacyFieldHit,
  type ResponsePolicyState,
} from '../lib/response-model';
import { ConflictDialog } from './ConflictDialog';
import { TextInput } from '@components/common/ui/TextInput';
import { Switch } from '@components/common/ui/Switch';
import { Segmented } from '@components/common/ui/Segmented';
import { Whisper } from './InstructionsSection.styles';
import { SkeletonRows } from './SkeletonRows';
import { SectionGroup, SectionPage, MicroTip } from '../section-ui/SectionPage';
import { RailCard, RailTitle } from '../section-ui/SectionPage.styles';
import {
  CardHead,
  CardIcon,
  CardSub,
  CardTitle,
  CardTitleWrap,
  GroupCard,
  RailDot,
  RailLabel,
  RailRow,
  RailValue,
} from './ToolsSection.styles';
import {
  BlockerButton,
  BlockerCard,
  BlockerMessage,
  BlockerPath,
  BlockerRailCard,
  BlockerTitle,
  ChannelFootnote,
  ChannelRow,
  ChannelText,
  Chip,
  ChipRow,
  ControlRow,
  ControlText,
  ControlHelper,
  ControlLabel,
  DisabledVeil,
  FieldHelper,
  HitTextButton,
  InheritRow,
  Pill,
  PillDot,
  ReadLabel,
  ReadRow,
  ReadValue,
  RowDivider,
  SaveToast,
  SaveToastActions,
  SaveToastBody,
  SaveToastTitle,
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

interface PolicyState extends ResponsePolicyState {
  /**
   * Lives in model_params (the engine's responsePolicySchema is strict).
   * A custom string from another client is preserved read-only — caps
   * holds the save until the maker picks a preset.
   */
  reasoning_effort?: ReasoningEffort | string;
  top_p?: number;
}

function readPolicy(definition: AgentDefinition): PolicyState {
  const params = definition.model_params;
  return {
    ...resolvePolicyState(definition.response_policy ?? undefined),
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
  const citations = policy.citations_enabled
    ? `on · ${policy.citations_style === 'footnotes' ? 'footnotes' : 'inline'}`
    : 'off';
  const streaming = policy.streaming.charAt(0).toUpperCase() + policy.streaming.slice(1);
  const length = policy.length.charAt(0).toUpperCase() + policy.length.slice(1);
  return `${format} · citations ${citations} · streaming ${streaming} · ${length}`;
}

/**
 * Response node — the single editor of `response_policy` (output format,
 * citations, streaming, citation style, length, per-channel overrides)
 * plus `model_params.reasoning_effort` / `model_params.top_p` (generation
 * overrides). Absent policy = engine defaults; the first edit writes the
 * full render object, never partial keys. Every control maps to a real
 * contract field — no preview, no latency SLO, no schedule invented.
 *
 * Legacy: max_context_tokens predates v1.15 in model_params and
 * response_policy (its current home is context_policy, which the engine
 * accepts with a 32000 default). When the draft carries it in a legacy
 * position, the section surfaces a save blocker with an inline Remove
 * field action instead of letting the save fail opaquely.
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
  const navigate = useNavigate();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');
  const blockerRef = useRef<HTMLDivElement>(null);

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [policy, setPolicy] = useState<PolicyState>(() =>
    definition ? readPolicy(definition) : { ...resolvePolicyState(undefined) },
  );
  const [overridesOpen, setOverridesOpen] = useState(false);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  /** Legacy field the maker removed via the blocker — stripped in buildNext until the source refetches clean. */
  const [removedLegacy, setRemovedLegacy] = useState<LegacyFieldHit | null>(null);

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null, { handledLegacy400: true });
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId, { handledLegacy400: true });

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
    // The engine's responsePolicySchema is strict — reasoning effort and
    // top-p ride model_params (the same contract the Model section writes).
    // Keys owned by other sections merge through untouched; clearing a
    // control deletes the key, never leaves a stale one.
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
    const next = buildDraftPayload(definition, {
      response_policy: {
        output_format: policy.output_format,
        citations_enabled: policy.citations_enabled,
        streaming: policy.streaming,
        citations_style: policy.citations_style,
        length: policy.length,
        ...(Object.keys(policy.channels).length > 0 ? { channels: policy.channels } : {}),
      },
      model_params: params,
    });
    // Legacy removal: the maker hit Remove field — strip the key from the
    // payload so the save lands. Idempotent once the source refetches clean.
    // context_policy is never a legacy position (its max_context_tokens is
    // the current, engine-accepted field), so only model_params and
    // response_policy are stripped.
    if (removedLegacy) {
      if (removedLegacy.location === 'model_params') delete next.model_params.max_context_tokens;
      if (removedLegacy.location === 'response_policy' && next.response_policy) {
        delete (next.response_policy as Record<string, unknown>).max_context_tokens;
      }
    }
    return next;
  }, [definition, policy, removedLegacy]);

  /** The legacy blocker, computed from the draft being built (so Remove field hides it immediately). */
  const legacyHit = useMemo(() => {
    const next = buildNext();
    if (!next) return null;
    return findLegacyMaxContextTokens({
      model_params: next.model_params as Record<string, unknown>,
      response_policy: (next.response_policy ?? null) as Record<string, unknown> | null,
    });
  }, [buildNext]);

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
              // The override pair is validated under model_params; the rest
              // of model_params belongs to Model — never hold this section
              // on its issues. Secrets issues belong to Credentials.
              issue.path === 'model_params.reasoning_effort' ||
              issue.path === 'model_params.top_p' ||
              issue.path === 'secrets',
          )
          .map((i) => i.message),
      );
    }
    // The legacy field is a hard blocker: the engine 400s naming it, so
    // holding the save here is honest, not speculative.
    if (legacyHit) {
      messages.push('Legacy field blocks saving — remove max_context_tokens to resume.');
    }
    return messages;
  }, [buildNext, legacyHit]);
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

  const showLegacyToast = useCallback(() => {
    toast(
      (t) => (
        <SaveToast>
          <SaveToastBody>
            <SaveToastTitle>Save failed</SaveToastTitle>
            <span>Legacy field blocks saving — remove to resume.</span>
          </SaveToastBody>
          <SaveToastActions>
            <HitTextButton
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                blockerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Focus the Remove button after the scroll lands.
                window.setTimeout(() => {
                  blockerRef.current?.querySelector('button')?.focus();
                }, 450);
              }}
            >
              Fix
            </HitTextButton>
            <HitTextButton type="button" onClick={() => toast.dismiss(t.id)} aria-label="Dismiss">
              ✕
            </HitTextButton>
          </SaveToastActions>
        </SaveToast>
      ),
      { duration: 8000 },
    );
  }, []);

  const handleSaveError = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 412) {
        const details =
          typeof error.details === 'object' && error.details !== null
            ? (error.details as Record<string, unknown>)
            : {};
        const next = buildNext();
        if (!next) return;
        setConflict({
          expectedHash: versionHash ?? '',
          currentHash: typeof details.current === 'string' ? details.current : null,
          attempted: JSON.stringify({
            response_policy: next.response_policy,
            model_params: next.model_params,
          }),
          attemptedDef: next,
        });
        return;
      }
      // The engine 400s max_context_tokens naming the field — surface the
      // humanized toast with a Fix action instead of a raw error.
      if (error instanceof ApiError && error.status === 400 && isLegacyFieldRejection(error)) {
        showLegacyToast();
      }
    },
    [buildNext, showLegacyToast, versionHash],
  );

  // C-BUG4/M-BUG3 Option A: confirm the section when Save succeeds, so the
  // nav badge grades `ready` even at engine defaults.
  const confirmSection = useSectionConfirmationContext();

  const doSave = useCallback(() => {
    const next = buildNext();
    if (!canAuthor || !next || blocked || conflict) return;
    if (isDraft && versionId && versionHash) {
      updateDraft.mutate(
        { definition: next, expectedHash: versionHash },
        { onSuccess: () => confirmSection('response'), onError: handleSaveError },
      );
      return;
    }
    saveDraft.mutate(next, {
      onSuccess: () => confirmSection('response'),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
          toast.success('A draft opened elsewhere — resumed it. Your response policy stays; the next save writes to it.');
          return;
        }
        handleSaveError(error);
      },
    });
  }, [canAuthor, buildNext, blocked, conflict, isDraft, versionId, versionHash, updateDraft, saveDraft, queryClient, handleSaveError, confirmSection]);

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

  // Top-p uses the string-draft pattern (same as Model): the field holds raw
  // text while typing so intermediate states ("0.", "abc") never corrupt the
  // committed value and NaN can never enter state. Commit snaps to the 0.05
  // step grid and kills float artifacts (0.95 persists as 0.95, never
  // 0.9500000000000001); floors at 0.05 — the engine rejects top_p <= 0, so
  // 0 can never save. Empty commits to undefined (clears the key).
  const topPDraft = useStringDraft(policy.top_p, (value) => {
    if (value === undefined) {
      setPolicy((prev) => {
        const next = { ...prev };
        delete next.top_p;
        return next;
      });
      return;
    }
    const clamped = Math.min(1, Math.max(0.05, value));
    patch({ top_p: Number((Math.round(clamped / 0.05) * 0.05).toFixed(2)) });
  });

  const removeLegacyField = useCallback(() => {
    if (!legacyHit) return;
    setRemovedLegacy(legacyHit);
    toast.success('Legacy field removed — saving.');
  }, [legacyHit]);

  const goToModel = useCallback(() => {
    navigate({
      to: '/agent-studio/agents/$agentId/build',
      params: { agentId: assistantId },
      search: { slot: 'model' },
    });
  }, [navigate, assistantId]);

  const hasOverrides =
    overridesOpen || policy.reasoning_effort !== undefined || policy.top_p !== undefined;
  const channelCount = countChannelOverrides(policy);
  const formatLabel = policy.output_format === 'plain' ? 'Plain text' : 'Markdown';

  const pill = legacyHit ? (
    <Pill $tone="danger">
      <PillDot aria-hidden="true" />1 blocker
    </Pill>
  ) : (
    <Pill $tone="neutral">
      <PillDot aria-hidden="true" />
      {formatLabel} · {channelCount === 0 ? 'no channel overrides' : `${channelCount} channel override${channelCount === 1 ? '' : 's'}`}
    </Pill>
  );

  const policyTouched = !isDefaultPolicyState(policy);

  const rail = (
    <>
      <RailCard>
        <RailTitle>On this page</RailTitle>
        <RailRow>
          <RailLabel>
            <RailDot $tone={policyTouched ? 'ok' : 'muted'} aria-hidden="true" />
            Presentation
          </RailLabel>
          <RailValue $tone={policyTouched ? undefined : 'muted'}>
            {policyTouched ? 'set' : 'defaults'}
          </RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>
            <RailDot $tone={channelCount > 0 ? 'ok' : 'muted'} aria-hidden="true" />
            Channels
          </RailLabel>
          <RailValue>{channelCount}</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>
            <RailDot $tone={legacyHit ? 'warning' : hasOverrides ? 'warning' : 'ok'} aria-hidden="true" />
            Overrides
          </RailLabel>
          <RailValue $tone={legacyHit || hasOverrides ? 'warning' : undefined}>
            {legacyHit ? 'legacy' : hasOverrides ? 'active' : 'inheriting'}
          </RailValue>
        </RailRow>
      </RailCard>
      <RailCard>
        <RailTitle>Posture</RailTitle>
        <RailRow>
          <RailLabel>Format</RailLabel>
          <RailValue>{formatLabel}</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>Citations</RailLabel>
          <RailValue>
            {policy.citations_enabled ? `On · ${policy.citations_style === 'footnotes' ? 'footnotes' : 'inline'}` : 'Off'}
          </RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>Streaming</RailLabel>
          <RailValue>{policy.streaming.charAt(0).toUpperCase() + policy.streaming.slice(1)}</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>Length</RailLabel>
          <RailValue>{policy.length.charAt(0).toUpperCase() + policy.length.slice(1)}</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>Channels</RailLabel>
          <RailValue>
            {channelCount} · {BUFFERED_CHANNELS.length} buffered
          </RailValue>
        </RailRow>
      </RailCard>
      {legacyHit && (
        <BlockerRailCard>
          <RailTitle>Save blocker</RailTitle>
          <BlockerPath>{legacyHit.path}</BlockerPath>
          <HitTextButton type="button" onClick={removeLegacyField}>
            Remove field
          </HitTextButton>
        </BlockerRailCard>
      )}
      <RailCard>
        <MicroTip>Voice and SMS always buffer — streaming and markdown choices never reach those channels.</MicroTip>
      </RailCard>
    </>
  );

  if (!definition) {
    return (
      <SectionPage
        title="Response"
        subtitle="How answers look, flow, and cite — per channel, at runtime."
      >
        <SkeletonRows rows={4} />
      </SectionPage>
    );
  }

  if (!canAuthor) {
    return (
      <SectionPage
        title="Response"
        subtitle="How answers look, flow, and cite — per channel, at runtime."
        pill={pill}
        rail={rail}
      >
        <SectionGroup label="Presentation">
          <GroupCard>
            <ReadRow>
              <ReadLabel>Output format</ReadLabel>
              <ReadValue>{formatLabel}</ReadValue>
            </ReadRow>
            <RowDivider />
            <ReadRow>
              <ReadLabel>Citations</ReadLabel>
              <ReadValue>
                {policy.citations_enabled ? `On · ${policy.citations_style}` : 'Off'}
              </ReadValue>
            </ReadRow>
            <RowDivider />
            <ReadRow>
              <ReadLabel>Streaming</ReadLabel>
              <ReadValue>{policy.streaming.charAt(0).toUpperCase() + policy.streaming.slice(1)}</ReadValue>
            </ReadRow>
            <RowDivider />
            <ReadRow>
              <ReadLabel>Length</ReadLabel>
              <ReadValue>{policy.length.charAt(0).toUpperCase() + policy.length.slice(1)}</ReadValue>
            </ReadRow>
          </GroupCard>
        </SectionGroup>
        <SectionGroup label="Channels">
          <GroupCard>
            {CHANNEL_IDS.map((id, i) => (
              <div key={id}>
                {i > 0 && <RowDivider />}
                <ReadRow>
                  <ReadLabel>{CHANNEL_LABELS[id]}</ReadLabel>
                  <ReadValue>
                    {channelFormat(policy, id) === 'plain' ? 'Plain' : 'Markdown'} ·{' '}
                    {BUFFERED_CHANNELS.includes(id)
                      ? 'buffered'
                      : channelStreaming(policy, id) === 'auto'
                        ? 'Auto'
                        : channelStreaming(policy, id) === 'on'
                          ? 'streams'
                          : 'buffered'}
                    {!channelHasOverride(policy, id) && ' · inherits'}
                  </ReadValue>
                </ReadRow>
              </div>
            ))}
          </GroupCard>
        </SectionGroup>
        <FieldHelper>Response needs an owner, admin, or developer — {denied}</FieldHelper>
      </SectionPage>
    );
  }

  return (
    <SectionPage
      title="Response"
      subtitle="How answers look, flow, and cite — per channel, at runtime."
      pill={pill}
      rail={rail}
    >
      {/* PRESENTATION */}
      <SectionGroup label="Presentation">
        <GroupCard>
          <CardHead>
            <CardIcon $tone="ok" aria-hidden="true">✓</CardIcon>
            <CardTitleWrap>
              <CardTitle>Presentation</CardTitle>
              <CardSub>The shape of every answer before it reaches a channel.</CardSub>
            </CardTitleWrap>
          </CardHead>
          <ControlRow>
            <ControlText>
              <ControlLabel>Output format</ControlLabel>
              <ControlHelper>Markdown renders rich answers; plain text suits SMS and voice.</ControlHelper>
            </ControlText>
            <Segmented
              ariaLabel="Output format"
              value={policy.output_format}
              onChange={(v: ResponseOutputFormat) => patch({ output_format: v })}
              options={[
                { value: 'markdown', label: 'Markdown' },
                { value: 'plain', label: 'Plain text' },
              ]}
            />
          </ControlRow>
          <RowDivider />
          <ControlRow>
            <ControlText>
              <ControlLabel>Citations</ControlLabel>
              <ControlHelper>Source links under answers that used retrieved knowledge.</ControlHelper>
            </ControlText>
            <ControlRow $compact>
              <Segmented
                ariaLabel="Citation style"
                value={policy.citations_style}
                onChange={(v: ResponseCitationsStyle) => patch({ citations_style: v })}
                options={CITATIONS_STYLE_OPTIONS}
              />
              <Segmented
                ariaLabel="Citations on or off"
                value={policy.citations_enabled ? 'on' : 'off'}
                onChange={(v: 'on' | 'off') => patch({ citations_enabled: v === 'on' })}
                options={[
                  { value: 'on', label: 'On' },
                  { value: 'off', label: 'Off' },
                ]}
              />
            </ControlRow>
          </ControlRow>
          <RowDivider />
          <ControlRow>
            <ControlText>
              <ControlLabel>Streaming</ControlLabel>
              <ControlHelper>Token-by-token delivery where the channel supports it.</ControlHelper>
            </ControlText>
            <Segmented
              ariaLabel="Streaming"
              value={policy.streaming}
              onChange={(v: ResponseStreaming) => patch({ streaming: v })}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'on', label: 'On' },
                { value: 'off', label: 'Off' },
              ]}
            />
          </ControlRow>
          <RowDivider />
          <ControlRow>
            <ControlText>
              <ControlLabel>Length</ControlLabel>
              <ControlHelper>Concise fits one screen; detailed adds structure on ask.</ControlHelper>
            </ControlText>
            <Segmented
              ariaLabel="Length"
              value={policy.length}
              onChange={(v: ResponseLength) => patch({ length: v })}
              options={LENGTH_OPTIONS}
            />
          </ControlRow>
        </GroupCard>
      </SectionGroup>

      {/* CHANNELS */}
      <SectionGroup label="Channels">
        <GroupCard>
          <CardHead>
            <CardIcon $tone="ok" aria-hidden="true">✓</CardIcon>
            <CardTitleWrap>
              <CardTitle>Channels</CardTitle>
              <CardSub>Per-channel overrides. Auto defers to these; buffered channels ignore streaming.</CardSub>
            </CardTitleWrap>
          </CardHead>
          {CHANNEL_IDS.map((id, i) => {
            const buffered = BUFFERED_CHANNELS.includes(id);
            const fmt = channelFormat(policy, id);
            return (
              <div key={id}>
                {i > 0 && <RowDivider />}
                <ChannelRow>
                  <ChannelText>
                    <ControlLabel>{CHANNEL_LABELS[id]}</ControlLabel>
                    <ControlHelper>{CHANNEL_HELPERS[id]}</ControlHelper>
                  </ChannelText>
                  <ControlRow $compact>
                    <Segmented
                      ariaLabel={`${CHANNEL_LABELS[id]} format`}
                      value={fmt}
                      onChange={(v: ResponseOutputFormat) => setPolicy((prev) => withChannelFormat(prev, id, v))}
                      options={[
                        { value: 'markdown', label: 'MD' },
                        { value: 'plain', label: 'Plain' },
                      ]}
                    />
                    <DisabledVeil $disabled={buffered} aria-disabled={buffered}>
                      <Segmented
                        ariaLabel={`${CHANNEL_LABELS[id]} streaming`}
                        value={buffered ? 'off' : channelStreaming(policy, id)}
                        onChange={(v: 'on' | 'off' | 'auto') => {
                          if (buffered) return;
                          setPolicy((prev) => withChannelStreaming(prev, id, v));
                        }}
                        options={[
                          { value: 'auto', label: 'Auto' },
                          { value: 'on', label: 'On' },
                          { value: 'off', label: 'Off' },
                        ]}
                      />
                    </DisabledVeil>
                  </ControlRow>
                </ChannelRow>
              </div>
            );
          })}
          <ChannelFootnote>
            Buffered channels compose the full answer first — streaming settings never apply.
          </ChannelFootnote>
        </GroupCard>
      </SectionGroup>

      {/* GENERATION OVERRIDES */}
      <SectionGroup label="Generation overrides">
        <GroupCard>
          <CardHead>
            <CardIcon $tone={hasOverrides || legacyHit ? 'warning' : 'ok'} aria-hidden="true">
              {hasOverrides || legacyHit ? '!' : '✓'}
            </CardIcon>
            <CardTitleWrap>
              <CardTitle>Generation overrides</CardTitle>
              <CardSub>Reasoning effort and top-p inherit from Model defaults unless overridden here.</CardSub>
            </CardTitleWrap>
            <Switch
              checked={overridesOpen}
              onChange={setOverridesOpen}
              label={overridesOpen ? 'Hide overrides' : 'Show overrides'}
            />
          </CardHead>
          {!overridesOpen ? (
            <InheritRow>
              <ControlText>
                <ControlLabel>{hasOverrides ? 'Overridden' : 'Inheriting'}</ControlLabel>
                <ChipRow>
                  <Chip>reasoning · {policy.reasoning_effort ? effortLabel(policy.reasoning_effort) : 'Medium'}</Chip>
                  <Chip>top-p · {policy.top_p ?? '0.95'}</Chip>
                </ChipRow>
              </ControlText>
              <HitTextButton type="button" onClick={goToModel}>
                Edit in Model
              </HitTextButton>
            </InheritRow>
          ) : (
            <>
              <ControlRow>
                <ControlText>
                  <ControlLabel>Reasoning effort</ControlLabel>
                  <ControlHelper>Only meaningful when the model supports reasoning.</ControlHelper>
                </ControlText>
                <Segmented
                  ariaLabel="Reasoning effort"
                  value={policy.reasoning_effort ?? 'default'}
                  onChange={(v: string) =>
                    patch({ reasoning_effort: v === 'default' ? undefined : v })
                  }
                  options={[
                    { value: 'default', label: 'Default' },
                    ...EFFORT_ORDER.map((e) => ({ value: e, label: effortLabel(e) })),
                  ]}
                />
              </ControlRow>
              {isCustomEffort(policy.reasoning_effort) && (
                <Whisper $tone="amber">
                  Custom effort “{policy.reasoning_effort}” — pick a preset to replace it.
                </Whisper>
              )}
              <RowDivider />
              <ControlRow>
                <ControlText>
                  <ControlLabel>Top-p</ControlLabel>
                  <ControlHelper>Lower = more focused, higher = more varied. Rarely needs changing.</ControlHelper>
                </ControlText>
                <TextInput
                  aria-label="Top-p (0.05 to 1)"
                  inputMode="decimal"
                  value={topPDraft.value}
                  onChange={(event) => topPDraft.onChange(event.target.value)}
                  onBlur={topPDraft.onBlur}
                  onKeyDown={topPDraft.onKeyDown}
                  placeholder="e.g. 0.9"
                />
              </ControlRow>
            </>
          )}
        </GroupCard>
      </SectionGroup>

      {/* LEGACY BLOCKER */}
      {legacyHit && (
        <BlockerCard ref={blockerRef} role="alert">
          <BlockerTitle>Legacy field blocks saving</BlockerTitle>
          <BlockerMessage>max_context_tokens is no longer supported by the current plan.</BlockerMessage>
          <BlockerButton type="button" onClick={removeLegacyField}>
            Remove field
          </BlockerButton>
        </BlockerCard>
      )}

      <FieldHelper>{describePolicy(policy)}</FieldHelper>

      {heldMessages
        .filter((m) => !m.startsWith('Legacy field blocks saving'))
        .map((message) => (
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
    </SectionPage>
  );
}
