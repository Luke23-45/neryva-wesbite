import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Ban, EyeOff, ShieldCheck, Zap } from 'lucide-react';
import { TextInput } from '@components/common/ui/TextInput';
import { Switch } from '@components/common/ui/Switch';
import { Segmented } from '@components/common/ui/Segmented';
import { ApiError } from '@lib/engine/client';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useGuardrailTelemetry,
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import type { GuardrailExecutionMode, PiiAction, PiiEntityType, PiiSink } from '@lib/engine/agent-payload';
import { PII_ENTITY_TYPES, PII_SINKS } from '@lib/engine/agent-payload';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import {
  CUSTOM_NAME_COPY,
  DENY_TOPICS_MAX,
  FLIP_COPY,
  INPUT_SEGMENTS,
  OUTPUT_SEGMENTS,
  MODE_COPY,
  PII_ACTION_OPTIONS,
  PII_ENTITY_LABELS,
  PII_NON_RETRO_COPY,
  PII_OFF_COPY,
  PII_SINK_LABELS,
  displayPolicyName,
  gradeGuardrails,
  matchSegment,
  normalizeDenyTopics,
  parseGuardrailMode,
  parsePiiAction,
  parsePiiEntities,
  parsePiiSinks,
  resolvePolicyBehavior,
  stableStringify,
  validateDenyTopic,
  type PolicyDirection,
} from '../lib/guardrails-model';
import { ConflictDialog } from './ConflictDialog';
import { StatusDot } from '../canvas/nodes/SlotNode.styles';
import { Whisper } from './InstructionsSection.styles';
import { SkeletonRows } from './SkeletonRows';
import { SectionGroup, SectionPage, MicroTip } from '../section-ui/SectionPage';
import { RailCard, RailTitle } from '../section-ui/SectionPage.styles';
import {
  ChipRow,
  FieldHelper,
  ModeLine,
  ModePill,
  ModePillDot,
  ReadLabel,
  ReadRow,
  ReadValue,
  RowDivider,
  ScreenControl,
  ScreenHelper,
  ScreenLabel,
  ScreenRow,
  ScreenText,
  SelectChip,
  SubControlBlock,
  SubLabel,
  TopicAddButton,
  TopicAddRow,
  TopicCount,
  TopicInput,
  TopicList,
  TopicName,
  TopicRemove,
  TopicRow,
} from './GuardrailsSection.styles';
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
  TextButton,
  ToolFix,
} from './ToolsSection.styles';

export interface GuardrailsSectionProps {
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
  input_policy: string;
  output_policy: string;
  pii_redaction: boolean;
  execution_mode: GuardrailExecutionMode;
  pii_entities: PiiEntityType[];
  pii_action: PiiAction;
  pii_applies_to: PiiSink[];
  notify_owner: boolean;
  attach_to_trace: boolean;
  deny_topics: string[];
}

/**
 * G-BUG3: normalize a policy-shaped value through the same parse functions
 * the read path uses, so the dirty check compares canonical values — never
 * raw representations that can drift (key order, unnormalized patch values).
 */
function canonicalPolicy(g: PolicyState): PolicyState {
  return {
    input_policy: g.input_policy,
    output_policy: g.output_policy,
    pii_redaction: g.pii_redaction === true,
    execution_mode: parseGuardrailMode(g.execution_mode),
    pii_entities: parsePiiEntities(g.pii_entities),
    pii_action: parsePiiAction(g.pii_action),
    pii_applies_to: parsePiiSinks(g.pii_applies_to),
    notify_owner: g.notify_owner === true,
    attach_to_trace: g.attach_to_trace !== false,
    deny_topics: normalizeDenyTopics(g.deny_topics),
  };
}

function readPolicy(definition: AgentDefinition): PolicyState {
  return canonicalPolicy(definition.guardrails);
}

const EMPTY_POLICY: PolicyState = {
  input_policy: '',
  output_policy: '',
  pii_redaction: true,
  execution_mode: 'blocking',
  pii_entities: [...PII_ENTITY_TYPES],
  pii_action: 'token',
  pii_applies_to: ['storage', 'logs'],
  notify_owner: false,
  attach_to_trace: true,
  deny_topics: [],
};

/**
 * SVG redesign — Screening, PII redaction, Execution mode, Deny topics as
 * SectionPage groups. The proven save machine (debounce, PUT/POST, 409
 * adopt, 412 dialog, dirty flag) is unchanged. Policies are NAMES resolved
 * engine-side (moderation.ts) — this section never invents pattern/threshold
 * authoring. Deny-topic refusal counts are read-only engine telemetry.
 */
export function GuardrailsSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
  saveSignal = 0,
}: GuardrailsSectionProps) {
  const queryClient = useQueryClient();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [policy, setPolicy] = useState<PolicyState>(() => (definition ? readPolicy(definition) : EMPTY_POLICY));
  const [advanced, setAdvanced] = useState(false);
  const [topicDraft, setTopicDraft] = useState('');
  const [topicError, setTopicError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const sendHashRef = useRef('');

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);

  // Read-only refusal telemetry — never blocks the section render.
  const telemetry = useGuardrailTelemetry(assistantId || null);
  const refusalByTopic = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of telemetry.data?.refusals ?? []) {
      map.set(row.topic.toLowerCase(), row.refusals);
    }
    return map;
  }, [telemetry.data]);

  const source = useMemo(() => (definition ? readPolicy(definition) : null), [definition]);
  // G-BUG3: canonical comparison — both sides normalized, keys sorted.
  // A value round-trip (e.g. PII off→on) is clean; only real edits are dirty.
  const current = useMemo(() => stableStringify(canonicalPolicy(policy)), [policy]);
  const dirty = source !== null && current !== stableStringify(source);

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
        pii_entities: policy.pii_entities,
        pii_action: policy.pii_action,
        pii_applies_to: policy.pii_applies_to,
        notify_owner: policy.notify_owner,
        attach_to_trace: policy.attach_to_trace,
        deny_topics: policy.deny_topics,
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

  const toggleListItem = useCallback(
    <T extends string>(key: 'pii_entities' | 'pii_applies_to', item: T) => {
      setPolicy((prev) => {
        const list = prev[key] as readonly T[];
        const next = list.includes(item) ? list.filter((v) => v !== item) : [...list, item];
        return { ...prev, [key]: next };
      });
    },
    [],
  );

  const addTopic = useCallback(() => {
    const problem = validateDenyTopic(topicDraft, policy.deny_topics);
    if (problem) {
      setTopicError(problem);
      return;
    }
    setTopicError(null);
    setPolicy((prev) => ({ ...prev, deny_topics: [...prev.deny_topics, topicDraft.trim()] }));
    setTopicDraft('');
  }, [topicDraft, policy.deny_topics]);

  const removeTopic = useCallback((topic: string) => {
    setPolicy((prev) => ({ ...prev, deny_topics: prev.deny_topics.filter((t) => t !== topic) }));
  }, []);

  const modeLabel = policy.execution_mode === 'logging' ? 'Logging' : 'Blocking';
  const pill = (
    <ModePill>
      <ModePillDot aria-hidden="true" />
      {modeLabel} · 4 layers
    </ModePill>
  );

  const rail = (
    <>
      <RailCard>
        <RailTitle>On this page</RailTitle>
        <RailRow>
          <RailLabel>
            <RailDot
              $tone={
                policy.input_policy.trim() === 'none' || policy.output_policy.trim() === 'none'
                  ? 'warning'
                  : 'ok'
              }
              aria-hidden="true"
            />
            Screening
          </RailLabel>
          <RailValue>
            {`in ${displayPolicyName(policy.input_policy, 'input')} / out ${displayPolicyName(policy.output_policy, 'output')}`}
          </RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>
            <RailDot $tone={policy.pii_redaction ? 'ok' : 'muted'} aria-hidden="true" />
            PII redaction
          </RailLabel>
          <RailValue>{policy.pii_redaction ? 'on' : 'off'}</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>
            <RailDot $tone={policy.execution_mode === 'logging' ? 'warning' : 'ok'} aria-hidden="true" />
            Execution mode
          </RailLabel>
          <RailValue $tone={policy.execution_mode === 'logging' ? 'warning' : undefined}>
            {policy.execution_mode}
          </RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>
            <RailDot $tone={policy.deny_topics.length > 0 ? 'ok' : 'muted'} aria-hidden="true" />
            Deny topics
          </RailLabel>
          <RailValue>{policy.deny_topics.length === 0 ? 'none' : `${policy.deny_topics.length}`}</RailValue>
        </RailRow>
      </RailCard>
      <MicroTip>
        Policy names resolve engine-side — this section never invents pattern or threshold authoring.
      </MicroTip>
    </>
  );

  if (!definition) {
    return (
      <SectionPage
        title="Guardrails"
        subtitle="What the agent must never let through — and what happens when it tries."
      >
        <SkeletonRows rows={4} />
      </SectionPage>
    );
  }

  if (!canAuthor) {
    const inputResolved = resolvePolicyBehavior(policy.input_policy, policy.execution_mode);
    const outputResolved = resolvePolicyBehavior(policy.output_policy, policy.execution_mode);
    return (
      <SectionPage
        title="Guardrails"
        subtitle="What the agent must never let through — and what happens when it tries."
        pill={pill}
        rail={rail}
      >
        <SectionGroup label="Safeguards">
          <GroupCard>
            <ReadRow>
              <ReadLabel>Execution mode</ReadLabel>
              <ReadValue>{modeLabel} — {policy.execution_mode === 'logging' ? 'verdicts recorded, nothing refused' : 'violating content is refused'}</ReadValue>
            </ReadRow>
            <RowDivider />
            <ReadRow>
              <ReadLabel>Input screening</ReadLabel>
              <ReadValue>{displayPolicyName(policy.input_policy, 'input')} — {inputResolved.consequence}</ReadValue>
            </ReadRow>
            <RowDivider />
            <ReadRow>
              <ReadLabel>Output screening</ReadLabel>
              <ReadValue>{displayPolicyName(policy.output_policy, 'output')} — {outputResolved.consequence}</ReadValue>
            </ReadRow>
            <RowDivider />
            <ReadRow>
              <ReadLabel>PII redaction</ReadLabel>
              <ReadValue>{policy.pii_redaction ? `on — ${policy.pii_entities.map((e) => PII_ENTITY_LABELS[e]).join(', ')}` : 'off — identifiers reach storage, logs, and the provider'}</ReadValue>
            </ReadRow>
            <RowDivider />
            <ReadRow>
              <ReadLabel>Deny topics</ReadLabel>
              <ReadValue>{policy.deny_topics.length === 0 ? 'none' : policy.deny_topics.join(', ')}</ReadValue>
            </ReadRow>
          </GroupCard>
        </SectionGroup>
        <FieldHelper>Guardrails need an owner, admin, or developer — {denied}</FieldHelper>
      </SectionPage>
    );
  }

  const grade = gradeGuardrails(policy);
  const directions: PolicyDirection[] = ['input', 'output'];

  return (
      <SectionPage
        title="Guardrails"
        subtitle="What the agent must never let through — and what happens when it tries."
        pill={pill}
        rail={rail}
      >
        {/* SCREENING */}
        <SectionGroup label="Screening">
          <GroupCard>
            <CardHead>
              <CardIcon>
                <ShieldCheck size={15} />
              </CardIcon>
              <CardTitleWrap>
                <CardTitle>Screening</CardTitle>
                <CardSub>Model-side filters on what enters and what leaves. Levels stack with execution mode.</CardSub>
              </CardTitleWrap>
            </CardHead>
            {directions.map((direction, index) => {
              const raw = direction === 'input' ? policy.input_policy : policy.output_policy;
              const matched = matchSegment(raw, direction);
              const resolved = resolvePolicyBehavior(raw, policy.execution_mode);
              const segments = direction === 'input' ? INPUT_SEGMENTS : OUTPUT_SEGMENTS;
              return (
                <div key={direction}>
                  {index > 0 && <RowDivider />}
                  <ScreenRow>
                    <ScreenText>
                      <ScreenLabel>{direction === 'input' ? 'Input screening' : 'Output screening'}</ScreenLabel>
                      <ScreenHelper>
                        {direction === 'input'
                          ? 'Refuses jailbreaks, prompt injection, and unsafe requests.'
                          : 'Catches off-brand tone, unsubstantiated claims, and denied topics.'}
                      </ScreenHelper>
                    </ScreenText>
                    <ScreenControl>
                      <Segmented<string>
                        options={segments}
                        value={matched ?? ''}
                        onChange={(value) =>
                          patch(direction === 'input' ? { input_policy: value } : { output_policy: value })
                        }
                        size="sm"
                        ariaLabel={`${direction} screening level`}
                      />
                    </ScreenControl>
                  </ScreenRow>
                  {matched === null ? (
                    <ToolFix>
                      {`Custom name “${raw.trim()}” — ${resolved.consequence} ${CUSTOM_NAME_COPY}`}
                    </ToolFix>
                  ) : resolved.behavior === 'disabled' ? (
                    <Whisper $tone="amber">
                      {direction === 'input' ? 'Input' : 'Output'} screening is off — {resolved.consequence}
                    </Whisper>
                  ) : (
                    <ScreenHelper>{resolved.consequence}</ScreenHelper>
                  )}
                </div>
              );
            })}
            {!advanced ? (
              <TextButton type="button" onClick={() => setAdvanced(true)}>
                Custom policy names · resolved behavior shown →
              </TextButton>
            ) : (
              <>
                <TextButton type="button" onClick={() => setAdvanced(false)}>
                  ← Back to segments
                </TextButton>
                {directions.map((direction) => {
                  const raw = direction === 'input' ? policy.input_policy : policy.output_policy;
                  const resolved = resolvePolicyBehavior(raw, policy.execution_mode);
                  return (
                    <div key={direction}>
                      <TextInput
                        label={`Custom ${direction} policy name`}
                        id={`guardrails-custom-${direction}`}
                        value={raw}
                        onChange={(event) =>
                          patch(direction === 'input' ? { input_policy: event.target.value } : { output_policy: event.target.value })
                        }
                        placeholder={direction === 'input' ? 'default' : 'brand-safe'}
                      />
                      <FieldHelper>
                        {displayPolicyName(raw, direction)} — {resolved.consequence}
                      </FieldHelper>
                    </div>
                  );
                })}
                <FieldHelper>{CUSTOM_NAME_COPY}</FieldHelper>
              </>
            )}
          </GroupCard>
        </SectionGroup>

        {/* PII REDACTION */}
        <SectionGroup label="PII redaction">
          <GroupCard>
            <CardHead>
              <CardIcon>
                <EyeOff size={15} />
              </CardIcon>
              <CardTitleWrap>
                <CardTitle>PII redaction</CardTitle>
                <CardSub>Identifiers are redacted before storage and logging.</CardSub>
              </CardTitleWrap>
              <Switch
                checked={policy.pii_redaction}
                onChange={(next) => patch({ pii_redaction: next })}
                label="PII redaction"
                id="guardrails-pii"
              />
            </CardHead>
            <SubControlBlock $disabled={!policy.pii_redaction} aria-disabled={!policy.pii_redaction}>
              <SubLabel id="guardrails-entity-types">Entity types</SubLabel>
              <ChipRow role="group" aria-labelledby="guardrails-entity-types">
                {PII_ENTITY_TYPES.map((entity) => (
                  <SelectChip
                    key={entity}
                    type="button"
                    $selected={policy.pii_entities.includes(entity)}
                    aria-pressed={policy.pii_entities.includes(entity)}
                    disabled={!policy.pii_redaction}
                    onClick={() => toggleListItem('pii_entities', entity)}
                  >
                    {PII_ENTITY_LABELS[entity]}
                  </SelectChip>
                ))}
              </ChipRow>
              <SubLabel id="guardrails-redaction-action">Redaction action</SubLabel>
              <Segmented<PiiAction>
                options={PII_ACTION_OPTIONS}
                value={policy.pii_action}
                onChange={(value) => patch({ pii_action: value })}
                size="sm"
                ariaLabel="Redaction action"
              />
              <SubLabel id="guardrails-applies-to">Applies to</SubLabel>
              <ChipRow role="group" aria-labelledby="guardrails-applies-to">
                {PII_SINKS.map((sink) => (
                  <SelectChip
                    key={sink}
                    type="button"
                    $selected={policy.pii_applies_to.includes(sink)}
                    aria-pressed={policy.pii_applies_to.includes(sink)}
                    disabled={!policy.pii_redaction}
                    onClick={() => toggleListItem('pii_applies_to', sink)}
                  >
                    {PII_SINK_LABELS[sink]}
                  </SelectChip>
                ))}
              </ChipRow>
            </SubControlBlock>
            <FieldHelper>{PII_NON_RETRO_COPY}</FieldHelper>
            {!policy.pii_redaction && (
              <Whisper $tone="amber">{PII_OFF_COPY}</Whisper>
            )}
          </GroupCard>
        </SectionGroup>

        {/* EXECUTION MODE */}
        <SectionGroup label="Execution mode">
          <GroupCard>
            <CardHead>
              <CardIcon>
                <Zap size={15} />
              </CardIcon>
              <CardTitleWrap>
                <CardTitle>Execution mode</CardTitle>
                <CardSub>What a screening hit actually does at runtime.</CardSub>
              </CardTitleWrap>
            </CardHead>
            <Segmented<GuardrailExecutionMode>
              options={[
                { value: 'blocking', label: 'Blocking' },
                { value: 'logging', label: 'Logging' },
              ]}
              value={policy.execution_mode}
              onChange={(value) => patch({ execution_mode: value })}
              size="sm"
              ariaLabel="Guardrail execution mode"
            />
            <ModeLine>
              <StatusDot $status={policy.execution_mode === 'logging' ? 'attention' : 'ready'} aria-hidden="true" />
              <span>{policy.execution_mode === 'logging' ? MODE_COPY.logging : MODE_COPY.blocking}</span>
            </ModeLine>
            <SubLabel id="guardrails-violation-actions">On violation, also</SubLabel>
            <ChipRow role="group" aria-labelledby="guardrails-violation-actions">
              <SelectChip
                type="button"
                $selected={policy.notify_owner}
                aria-pressed={policy.notify_owner}
                onClick={() => patch({ notify_owner: !policy.notify_owner })}
              >
                Notify owner
              </SelectChip>
              <SelectChip
                type="button"
                $selected={policy.attach_to_trace}
                aria-pressed={policy.attach_to_trace}
                onClick={() => patch({ attach_to_trace: !policy.attach_to_trace })}
              >
                Attach to trace
              </SelectChip>
            </ChipRow>
            <FieldHelper>{FLIP_COPY}</FieldHelper>
            {grade.status === 'attention' && grade.hint !== '' && policy.execution_mode !== 'logging' && (
              <Whisper $tone="amber">{grade.hint}</Whisper>
            )}
          </GroupCard>
        </SectionGroup>

        {/* DENY TOPICS */}
        <SectionGroup label="Deny topics">
          <GroupCard>
            <CardHead>
              <CardIcon>
                <Ban size={15} />
              </CardIcon>
              <CardTitleWrap>
                <CardTitle>Deny topics</CardTitle>
                <CardSub>Refused on contact — before screening, in any execution mode. Plain language, one intent each.</CardSub>
              </CardTitleWrap>
            </CardHead>
            {policy.deny_topics.length === 0 ? (
              <FieldHelper>No deny topics — the agent refuses nothing by topic.</FieldHelper>
            ) : (
              <TopicList>
                {policy.deny_topics.map((topic) => {
                  const refusals = refusalByTopic.get(topic.toLowerCase());
                  return (
                    <TopicRow key={topic}>
                      <TopicName title={topic}>{topic}</TopicName>
                      {refusals !== undefined && (
                        <TopicCount>{refusals} {refusals === 1 ? 'refusal' : 'refusals'} · {telemetry.data?.windowDays ?? 30}d</TopicCount>
                      )}
                      <TopicRemove
                        type="button"
                        aria-label={`Remove deny topic ${topic}`}
                        onClick={() => removeTopic(topic)}
                      >
                        ×
                      </TopicRemove>
                    </TopicRow>
                  );
                })}
              </TopicList>
            )}
            <TopicAddRow>
              <TopicInput
                type="text"
                value={topicDraft}
                onChange={(event) => {
                  setTopicDraft(event.target.value);
                  setTopicError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTopic();
                  }
                }}
                placeholder="Add a topic — plain language, one intent"
                aria-label="New deny topic"
                maxLength={200}
              />
              <TopicAddButton
                type="button"
                onClick={addTopic}
                disabled={policy.deny_topics.length >= 50 || topicDraft.trim() === ''}
              >
                Add
              </TopicAddButton>
            </TopicAddRow>
            {topicError && (
              <Whisper $tone="red" role="alert">{topicError}</Whisper>
            )}
            {/* G-BUG4: the 50-topic and 200-char caps are engine law — state
                them visibly instead of letting Add silently disable at 50. */}
            {/* G-BUG5: a failed telemetry fetch must read as unavailable —
                never as "no refusals". Counts stay absent, never invented. */}
            {telemetry.isError && (
              <Whisper $tone="amber">Refusal counts are unavailable right now.</Whisper>
            )}
            <FieldHelper>
              {policy.deny_topics.length} of {DENY_TOPICS_MAX} topics · 200 characters max per topic
            </FieldHelper>
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
                  pii_entities: parsePiiEntities(guardrails.pii_entities),
                  pii_action: parsePiiAction(guardrails.pii_action),
                  pii_applies_to: parsePiiSinks(guardrails.pii_applies_to),
                  notify_owner: guardrails.notify_owner === true,
                  attach_to_trace: guardrails.attach_to_trace !== false,
                  deny_topics: normalizeDenyTopics(guardrails.deny_topics),
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
      </SectionPage>
  );
}
