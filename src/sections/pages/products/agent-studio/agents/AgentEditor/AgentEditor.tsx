import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Plus, Trash2, Braces } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { Switch } from '@components/common/ui/Switch';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { Modal } from '@components/common/ui/Modal';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView, ErrorState } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import {
  useAssistant,
  useAssistantDefinition,
  useSaveDraftVersion,
  useUpdateDraftVersion,
  useDiscardDraft,
  defaultDefinition,
  diffDefinitions,
  MEMORY_SCOPES,
  type AgentDefinition,
  type ToolPolicy,
} from '@hooks/studio/useAgentAuthoring';
import { useModelAvailability, useModelCosts, costLabel } from '@hooks/studio/useSetupModels';
import { useDocuments } from '@hooks/studio/useSetupKnowledge';
import { useToolCatalog, BUILT_IN_TOOLS } from '@hooks/studio/useSetupTools';
import { toEnginePayload, effectiveApproval, type GuardrailExecutionMode } from '@lib/engine/agent-payload';
import { buildAgentBuildPath } from '@/sections/pages/products/agent-studio/builder/lib/slot-model';
import { checkDefinitionCaps, sectionOf } from '@lib/engine/setup-caps';
import { ApiError } from '@lib/engine/client';
import { BackLink } from '../AgentDetailView.styles';
import {
  EditorGrid,
  EditorColumn,
  SectionGap,
  FieldRow,
  FieldStack,
  FieldLabel,
  EditorSelect,
  JsonBox,
  ToolRow,
  ChipRowBox,
  ChipToggle,
  SwitchRow,
  SwitchText,
  SwitchTitle,
  SwitchSub,
  EmptyNote,
  IconRemove,
} from './AgentEditor.styles';

/**
 * The agent definition editor (team_setup_ledger.md F-D3/D4) — the strict
 * core, rebuilt:
 *
 * - single mapping module owns the wire (`toEnginePayload`); the JSON
 *   preview shows EXACTLY what saves send;
 * - caps pre-check inline (per-section issue counts + blocking banner);
 * - knowledge mapping against live inventory (READY/MISSING/NOT READY);
 * - catalog-backed tool picker (built-ins + enabled rows, effect/approval
 *   shown, effective approval computed, stale-hash re-pin one click away);
 * - draft concurrency: create vs If-Match update, 412 merge-or-reload with
 *   both hashes + field diff, DRAFT-only discard;
 * - debounced autosave (same-hash idempotent) with an honest status line —
 *   it STOPS on conflict and never retry-storms.
 */

const AUTOSAVE_MS = 8000;

type SaveState = 'clean' | 'dirty' | 'saving' | 'conflict' | 'blocked';

interface Conflict {
  /** The definition we attempted to save. */
  attempted: AgentDefinition;
  /** Hash we sent (stale). */
  expectedHash: string;
  /** Current server hash (from the 412 details). */
  currentHash: string | null;
}

export function AgentEditor() {
  const params = useParams({ from: '/agent-studio/agents/$agentId/edit' });
  const assistant = useAssistant(params.agentId);
  // Definitions live on versions (draft preferred, else active).
  const form = useAssistantDefinition(params.agentId);
  const models = useModelAvailability();
  const costs = useModelCosts();
  const navigate = useNavigate();
  const createDraft = useSaveDraftVersion(params.agentId);
  const updateDraft = useUpdateDraftVersion(params.agentId, form.data?.versionId ?? null);
  const discardDraft = useDiscardDraft(params.agentId);
  const [draft, setDraft] = useState<AgentDefinition | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [conflict, setConflict] = useState<Conflict | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const autosaveTimer = useRef<number | null>(null);
  const sendHashRef = useRef<string | null>(null);

  // The form is authoritative once loaded; the key remount seeds it.
  const loaded = form.data?.definition ?? null;
  const effective = draft ?? loaded;

  const patch = (next: Partial<AgentDefinition>) => {
    setDraft({ ...(effective ?? defaultDefinition()), ...next });
  };

  const dirty = useMemo(() => {
    if (!effective || !loaded) {
      return draft !== null;
    }
    return draft !== null && JSON.stringify(effective) !== JSON.stringify(loaded);
  }, [draft, effective, loaded]);

  // Sidebar restructure (SIDEBAR_LEDGER.md §4.8): unsaved edits block every
  // router-level navigation with the product-toned dialog. Suppressed while
  // the 412 conflict modal owns the flow (stacking two modals is worse).
  const { dialog: dirtyGuardDialog } = useDirtyGuard(dirty && conflict === null);

  const issues = useMemo(() => (effective ? checkDefinitionCaps(effective) : []), [effective]);
  const issuesBySection = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const issue of issues) {
      const section = sectionOf(issue.path);
      map.set(section, [...(map.get(section) ?? []), issue.message]);
    }
    return map;
  }, [issues]);

  const pending = createDraft.isPending || updateDraft.isPending || discardDraft.isPending;

  const saveState: SaveState = conflict
    ? 'conflict'
    : pending
      ? 'saving'
      : issues.length > 0 && dirty
        ? 'blocked'
        : dirty
          ? 'dirty'
          : 'clean';

  const doSave = (definition: AgentDefinition, onDone?: () => void) => {
    const problem = checkDefinitionCaps(definition);
    if (problem.length > 0) {
      toast.error(problem[0].message);
      return;
    }
    if (form.data?.isDraft && form.data.versionId && form.data.hash) {
      sendHashRef.current = form.data.hash;
      updateDraft.mutate(
        { definition, expectedHash: form.data.hash },
        {
          onSuccess: () => {
            setLastSavedAt(new Date().toLocaleTimeString());
            onDone?.();
          },
          onError: (error) => openConflictOnStale(error, definition),
        },
      );
    } else {
      createDraft.mutate(definition, {
        onSuccess: () => {
          setLastSavedAt(new Date().toLocaleTimeString());
          onDone?.();
        },
        onError: (error) => {
          // A draft appeared between load and save (co-author or double
          // submit): refetch and say so — never blind-retry into 409s.
          if (error instanceof ApiError && error.status === 409) {
            void form.refetch();
          }
          openConflictOnStale(error, definition);
        },
      });
    }
  };

  const openConflictOnStale = (error: unknown, attempted: AgentDefinition) => {
    if (error instanceof ApiError && error.status === 412) {
      const details = typeof error.details === 'object' && error.details !== null ? (error.details as Record<string, unknown>) : {};
      setConflict({
        attempted,
        expectedHash: sendHashRef.current ?? (typeof details.expected === 'string' ? details.expected : ''),
        currentHash: typeof details.current === 'string' ? details.current : null,
      });
    }
  };

  const manualSave = () => {
    if (!effective || conflict) {
      return;
    }
    doSave(effective, () => {
      toast.success('Draft saved — publish it from the agent page');
      navigate({ to: '/agent-studio/agents/$agentId', params: { agentId: params.agentId } });
    });
  };

  // Debounced autosave: dirty + shippable + no draft-write in flight + no
  // open conflict. Same-hash saves are server idempotent; a 412 STOPS the
  // loop and opens merge-or-reload (never a retry storm).
  useEffect(() => {
    if (autosaveTimer.current !== null) {
      window.clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
    if (!effective || !dirty || issues.length > 0 || pending || conflict || !form.data) {
      return;
    }
    autosaveTimer.current = window.setTimeout(() => {
      doSave(effective, undefined);
    }, AUTOSAVE_MS);
    return () => {
      if (autosaveTimer.current !== null) {
        window.clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, issues.length, pending, conflict, effective, form.data?.versionId, form.data?.hash]);

  return (
    <ViewShell>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <BackLink as={Link} to={`/agent-studio/agents/${params.agentId}`}>
          <ArrowLeft size={13} strokeWidth={1.7} />
          Back to agent
        </BackLink>
      </motion.div>

      <QueryView
        query={assistant}
        skeleton={<Skeleton $h="480px" $r="12px" />}
        isEmpty={(d) => d === null}
        empty={{ title: 'Agent not found', description: 'This agent doesn\'t exist or was removed.' }}
      >
        {(info) => info && (
          <>
            <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={1}>
              <ViewHeader>
                <ViewTitle>{info.name}</ViewTitle>
                <ViewSubtitle>
                  {form.data?.isDraft ? 'Editing the open draft — autosaves while shippable.' : 'No open draft — saving creates one.'}
                  {' '}<SaveStatus state={saveState} lastSavedAt={lastSavedAt} issueCount={issues.length} />
                </ViewSubtitle>
              </ViewHeader>
              <EditorActions>
                <ActionButton variant="ghost" size="sm" onClick={() => navigate({ to: buildAgentBuildPath(params.agentId) })}>
                  Open in builder
                </ActionButton>
                <ActionButton variant="secondary" size="sm" onClick={() => setShowJson((v) => !v)}>
                  <Braces size={13} strokeWidth={1.8} />
                  {showJson ? 'Hide wire JSON' : 'View wire JSON'}
                </ActionButton>
                {form.data?.isDraft && form.data.versionId && (
                  <ActionButton variant="ghost" size="sm" disabled={pending} onClick={() => setDiscardOpen(true)}>
                    Discard draft
                  </ActionButton>
                )}
                <ActionButton size="sm" disabled={pending || !!conflict} onClick={manualSave}>
                  {form.data?.isDraft ? 'Save draft' : 'Save as draft'}
                </ActionButton>
              </EditorActions>
            </ViewHeaderRow>

            {issues.length > 0 && effective && (
              <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
                <IssueBanner>
                  <strong>{issues.length} issue{issues.length === 1 ? '' : 's'} block saving</strong> — {issues[0].message}
                  {issues.length > 1 && ` (+${issues.length - 1} more below)`}
                </IssueBanner>
              </motion.div>
            )}

            {effective && (
              <EditorGrid>
                <EditorColumn>
                  <SectionGap>
                    <Panel title={`Instructions${sectionCount(issuesBySection, 'instructions')}`} subtitle="What this agent is and how it behaves. Required — publish refuses without it.">
                      <TextArea
                        label={`System instructions (${effective.instructions.length.toLocaleString()} / 20,000 chars · ~${Math.ceil(effective.instructions.length / 4).toLocaleString()} tokens, estimated)`}
                        value={effective.instructions}
                        onChange={(e) => patch({ instructions: e.target.value })}
                        rows={8}
                        placeholder="You are…"
                      />
                      <FieldIssues messages={issuesBySection.get('instructions')} />
                      <SecretNote messages={issuesBySection.get('secrets')} />
                    </Panel>
                  </SectionGap>

                  <SectionGap>
                    <Panel title={`Model policy${sectionCount(issuesBySection, 'model')}`} subtitle="Which models may serve this agent — live catalog availability. Unusable rows name their reason.">
                      <FieldStack>
                        <SwitchRow>
                          <SwitchText>
                            <SwitchTitle>Allow fallback models</SwitchTitle>
                            <SwitchSub>When the preferred model is unavailable, serve with the next allowed model.</SwitchSub>
                          </SwitchText>
                          <Switch
                            checked={effective.model_policy.fallback_enabled}
                            onChange={(next) => patch({ model_policy: { ...effective.model_policy, fallback_enabled: next } })}
                          />
                        </SwitchRow>
                        <FieldStack>
                          <FieldLabel>Allowed models</FieldLabel>
                          {models.isPending ? (
                            <EmptyNote>Loading catalog…</EmptyNote>
                          ) : models.isError || !models.data ? (
                            <EmptyNote>Catalog unreachable — retry the page. Saving without a picked model is refused.</EmptyNote>
                          ) : models.data.length === 0 ? (
                            <EmptyNote>No models in the platform catalog yet — nothing can ship until staff publishes entries. Contact support if this persists.</EmptyNote>
                          ) : (
                            <ChipRowBox>
                              {models.data.map((model) => {
                                const on = effective.model_policy.allowed_models.includes(model.ref);
                                const disabled = !model.usable && !on;
                                const price = (costs.data ?? []).find((cost) => cost.ref === model.ref);
                                const priceNote = price ? ` — list ${costLabel(price, 'in')} in / ${costLabel(price, 'out')} out` : ' — unpriced';
                                return (
                                  <ChipToggle
                                    key={model.ref}
                                    type="button"
                                    $on={on}
                                    aria-pressed={on}
                                    disabled={disabled}
                                    title={model.usable ? `${model.displayName}${priceNote}` : `${model.displayName} — unusable: ${model.reasons.join(', ') || 'unknown reason'}`}
                                    onClick={() => {
                                      const allowed = on
                                        ? effective.model_policy.allowed_models.filter((m) => m !== model.ref)
                                        : [...effective.model_policy.allowed_models, model.ref];
                                      patch({ model_policy: { ...effective.model_policy, allowed_models: allowed } });
                                    }}
                                  >
                                    {model.displayName}
                                  </ChipToggle>
                                );
                              })}
                            </ChipRowBox>
                          )}
                        </FieldStack>
                        <FieldRow>
                          <OptionalNumberField
                            label="Max output tokens (unset = engine default)"
                            value={effective.model_params.max_output_tokens}
                            min={1}
                            max={200000}
                            onChange={(v) => patch({ model_params: { ...effective.model_params, max_output_tokens: v } })}
                          />
                          <OptionalNumberField
                            label="Temperature 0–2 (lower = steadier)"
                            value={effective.model_params.temperature}
                            min={0}
                            max={2}
                            integer={false}
                            onChange={(v) => patch({ model_params: { ...effective.model_params, temperature: v } })}
                          />
                        </FieldRow>
                        <FieldRow>
                          <OptionalNumberField
                            label="Top-p 0–1 (nucleus sampling)"
                            value={effective.model_params.top_p}
                            min={0.01}
                            max={1}
                            integer={false}
                            onChange={(v) => patch({ model_params: { ...effective.model_params, top_p: v } })}
                          />
                          <div />
                        </FieldRow>
                        <FieldRow>
                          <SelectField label="Reasoning effort (unset = model default)">
                            <EditorSelect
                              value={effective.model_params.reasoning_effort ?? ''}
                              onChange={(e) => {
                                const value = e.target.value as '' | 'minimal' | 'low' | 'medium' | 'high';
                                const { reasoning_effort: _dropped, ...rest } = effective.model_params;
                                void _dropped;
                                patch({ model_params: value === '' ? rest : { ...rest, reasoning_effort: value } });
                              }}
                              aria-label="Reasoning effort"
                            >
                              <option value="">unset</option>
                              <option value="minimal">minimal — fastest, shallowest</option>
                              <option value="low">low</option>
                              <option value="medium">medium — balanced</option>
                              <option value="high">high — slowest, deepest</option>
                            </EditorSelect>
                          </SelectField>
                          <div />
                        </FieldRow>
                        <FieldIssues messages={issuesBySection.get('model')} />
                      </FieldStack>
                    </Panel>
                  </SectionGap>

                  <SectionGap>
                    <Panel title={`Context policy${sectionCount(issuesBySection, 'context')}`} subtitle="How much conversation and knowledge the agent may see.">
                      <FieldStack>
                        <FieldRow>
                          <NumberField
                            label="History limit (messages)"
                            value={effective.context_policy.history_limit}
                            min={1}
                            max={100}
                            onChange={(v) => patch({ context_policy: { ...effective.context_policy, history_limit: v } })}
                          />
                          <NumberField
                            label="Max context tokens (editor-side only — never sent)"
                            value={effective.max_context_tokens}
                            min={1000}
                            max={1000000}
                            onChange={(v) => patch({ max_context_tokens: v })}
                          />
                        </FieldRow>
                        <FieldRow>
                          <SelectField label="Memory scope">
                            <EditorSelect
                              value={effective.context_policy.memory_scope}
                              onChange={(e) =>
                                patch({
                                  context_policy: {
                                    ...effective.context_policy,
                                    memory_scope: e.target.value as AgentDefinition['context_policy']['memory_scope'],
                                  },
                                })
                              }
                              aria-label="Memory scope"
                            >
                              {MEMORY_SCOPES.map((scope) => (
                                <option key={scope} value={scope}>{scope}</option>
                              ))}
                            </EditorSelect>
                          </SelectField>
                          <div />
                        </FieldRow>
                        <SwitchRow>
                          <SwitchText>
                            <SwitchTitle>Summarize long histories</SwitchTitle>
                            <SwitchSub>Older turns are compacted into a running summary instead of dropped.</SwitchSub>
                          </SwitchText>
                          <Switch
                            checked={effective.context_policy.summary_enabled}
                            onChange={(next) => patch({ context_policy: { ...effective.context_policy, summary_enabled: next } })}
                          />
                        </SwitchRow>
                        <KnowledgeMapping
                          sources={effective.context_policy.knowledge_sources}
                          onChange={(knowledge_sources) => patch({ context_policy: { ...effective.context_policy, knowledge_sources } })}
                        />
                        <FieldIssues messages={issuesBySection.get('context')} />
                      </FieldStack>
                    </Panel>
                  </SectionGap>

                  <SectionGap>
                    <Panel
                      title={`Tools${sectionCount(issuesBySection, 'tools')}`}
                      subtitle="Catalog-backed bindings — publish pins entries against enabled rows by schema hash."
                      action={
                        <ActionButton
                          variant="secondary"
                          size="sm"
                          onClick={() => patch({ tools: [...effective.tools, { name: '', access: 'read', approval: 'never', execution_mode: 'live' } satisfies ToolPolicy] })}
                        >
                          <Plus size={13} strokeWidth={1.8} />
                          Add tool
                        </ActionButton>
                      }
                    >
                      {effective.tools.length === 0 ? (
                        <EmptyNote>No tools attached. The agent runs on instructions and knowledge alone.</EmptyNote>
                      ) : (
                        <FieldStack>
                          {effective.tools.map((tool, i) => (
                            <ToolBindingRow
                              key={i}
                              index={i}
                              tool={tool}
                              onChange={(next) => {
                                const tools = [...effective.tools];
                                tools[i] = next;
                                patch({ tools });
                              }}
                              onRemove={() => patch({ tools: effective.tools.filter((_, j) => j !== i) })}
                            />
                          ))}
                        </FieldStack>
                      )}
                      <FieldIssues messages={issuesBySection.get('tools')} />
                    </Panel>
                  </SectionGap>
                </EditorColumn>

                <EditorColumn>
                  <SectionGap>
                    <Panel title={`Guardrails${sectionCount(issuesBySection, 'guardrails')}`} subtitle="What may never pass through, in or out. Blank inherits engine defaults.">
                      <FieldStack>
                        <SwitchRow>
                          <SwitchText>
                            <SwitchTitle>PII redaction</SwitchTitle>
                            <SwitchSub>Personally identifiable information is redacted before storage and logging.</SwitchSub>
                          </SwitchText>
                          <Switch
                            checked={effective.guardrails.pii_redaction}
                            onChange={(next) => patch({ guardrails: { ...effective.guardrails, pii_redaction: next } })}
                          />
                        </SwitchRow>
                        <FieldLabel>Execution mode</FieldLabel>
                        <EditorSelect
                          value={effective.guardrails.execution_mode}
                          onChange={(e) => patch({ guardrails: { ...effective.guardrails, execution_mode: e.target.value as GuardrailExecutionMode } })}
                          aria-label="Guardrail execution mode"
                        >
                          <option value="blocking">Blocking — violating content is refused</option>
                          <option value="logging">Logging — verdicts recorded, nothing refused</option>
                        </EditorSelect>
                        <SwitchSub>
                          {effective.guardrails.execution_mode === 'logging'
                            ? 'Logging records verdicts without severing — measure first, then flip.'
                            : 'Blocking refuses violating content at run time.'}{' '}
                          The flip ships as a new draft — auditable, never a silent toggle.
                        </SwitchSub>
                        <TextArea
                          label="Input policy"
                          value={effective.guardrails.input_policy}
                          onChange={(e) => patch({ guardrails: { ...effective.guardrails, input_policy: e.target.value } })}
                          rows={3}
                          placeholder="Refuse requests that…"
                        />
                        <TextArea
                          label="Output policy"
                          value={effective.guardrails.output_policy}
                          onChange={(e) => patch({ guardrails: { ...effective.guardrails, output_policy: e.target.value } })}
                          rows={3}
                          placeholder="Never state…"
                        />
                        <FieldIssues messages={issuesBySection.get('guardrails')} />
                      </FieldStack>
                    </Panel>
                  </SectionGap>

                  <SectionGap>
                    <Panel title={`Budget policy${sectionCount(issuesBySection, 'budget')}`} subtitle="Hard stops that keep a runaway run from costing real money. Unset = platform defaults.">
                      <FieldStack>
                        <FieldRow>
                          <OptionalNumberField label="Max model calls" value={effective.budget.max_model_calls} min={1} max={200} onChange={(v) => patch({ budget: { ...effective.budget, max_model_calls: v } })} />
                          <OptionalNumberField label="Max tool calls" value={effective.budget.max_tool_calls} min={0} max={1000} onChange={(v) => patch({ budget: { ...effective.budget, max_tool_calls: v } })} />
                        </FieldRow>
                        <FieldRow>
                          <OptionalNumberField label="Max wall clock (seconds)" value={effective.budget.wall_clock_seconds} min={0} max={86400} onChange={(v) => patch({ budget: { ...effective.budget, wall_clock_seconds: v } })} />
                          <OptionalNumberField label="Max total tokens" value={effective.budget.max_total_tokens} min={1000} max={2000000} onChange={(v) => patch({ budget: { ...effective.budget, max_total_tokens: v } })} />
                        </FieldRow>
                        <FieldRow>
                          <OptionalNumberField label="Max cost (cents)" value={effective.budget.max_cost_cents} min={0} max={100000000} onChange={(v) => patch({ budget: { ...effective.budget, max_cost_cents: v } })} />
                          <div />
                        </FieldRow>
                        <FieldIssues messages={issuesBySection.get('budget')} />
                      </FieldStack>
                    </Panel>
                  </SectionGap>

                  <SectionGap>
                    <Panel title={`Retrieval & brand${sectionCount(issuesBySection, 'retrieval')}`} subtitle="Knowledge retrieval is engine-enforced; memory mixing stays editor-side. Brand voice ships and is composed into the served prompt.">
                      <FieldStack>
                        <SwitchRow>
                          <SwitchText>
                            <SwitchTitle>Knowledge retrieval</SwitchTitle>
                            <SwitchSub>Deliberate toggle — off means the agent never retrieves documents, with no silent fallback.</SwitchSub>
                          </SwitchText>
                          <Switch
                            checked={effective.knowledge_policy.retrieval_enabled}
                            onChange={(next) => patch({ knowledge_policy: { ...effective.knowledge_policy, retrieval_enabled: next } })}
                          />
                        </SwitchRow>
                        <FieldRow>
                          <NumberField label="Knowledge max results" value={effective.knowledge_policy.max_results} min={1} max={20} onChange={(v) => patch({ knowledge_policy: { ...effective.knowledge_policy, max_results: v } })} />
                          <NumberField label="Memory max results (editor-side)" value={effective.retrieval.memory_max_results} min={0} max={50} onChange={(v) => patch({ retrieval: { ...effective.retrieval, memory_max_results: v } })} />
                        </FieldRow>
                        <SwitchRow>
                          <SwitchText>
                            <SwitchTitle>Hybrid retrieval</SwitchTitle>
                            <SwitchSub>Mix semantic and keyword search for knowledge lookups.</SwitchSub>
                          </SwitchText>
                          <Switch
                            checked={effective.retrieval.hybrid_retrieval}
                            onChange={(next) => patch({ retrieval: { ...effective.retrieval, hybrid_retrieval: next } })}
                          />
                        </SwitchRow>
                        <TextArea
                          label="Brand voice"
                          value={effective.brand}
                          onChange={(e) => patch({ brand: e.target.value })}
                          rows={3}
                          placeholder="Warm, precise, never theatrical…"
                        />
                        <FieldIssues messages={issuesBySection.get('retrieval')} />
                      </FieldStack>
                    </Panel>
                  </SectionGap>

                  {showJson && (
                    <SectionGap>
                      <Panel title="Wire JSON" subtitle="Exactly what saves send — the engine payload, consumer-only fields stripped.">
                        <JsonBox>
                          <code>{JSON.stringify(toEnginePayload(effective), null, 2)}</code>
                        </JsonBox>
                      </Panel>
                    </SectionGap>
                  )}
                </EditorColumn>
              </EditorGrid>
            )}
          </>
        )}
      </QueryView>

      {dirtyGuardDialog}

      <ConfirmDialog
        open={discardOpen}
        title="Discard this draft?"
        message="The unshipped draft row is removed; published history is untouched. This cannot be undone."
        destructive
        confirmLabel="Discard draft"
        onConfirm={() => {
          if (form.data?.versionId) {
            discardDraft.mutate(form.data.versionId, {
              onSuccess: () => {
                toast.success('Draft discarded');
                setDraft(null);
                navigate({ to: '/agent-studio/agents/$agentId', params: { agentId: params.agentId } });
              },
            });
          }
          setDiscardOpen(false);
        }}
        onCancel={() => setDiscardOpen(false)}
      />

      {conflict && (
        <MergeModal
          conflict={conflict}
          onReloadTheirs={() => {
            setDraft(null);
            void form.refetch();
            toast('Reloaded their version — review the updated diff, then save over or close.');
          }}
          onSaveMine={(freshHash) => {
            updateDraft.mutate(
              { definition: conflict.attempted, expectedHash: freshHash },
              {
                onSuccess: () => {
                  toast.success('Saved over the latest version');
                  setConflict(null);
                  setLastSavedAt(new Date().toLocaleTimeString());
                },
                onError: (error) => openConflictOnStale(error, conflict.attempted),
              },
            );
          }}
          onClose={() => setConflict(null)}
          pending={updateDraft.isPending}
        />
      )}
    </ViewShell>
  );
}

function sectionCount(bySection: Map<string, string[]>, section: string): string {
  const count = bySection.get(section)?.length ?? 0;
  return count > 0 ? ` (${count})` : '';
}

function SaveStatus({ state, lastSavedAt, issueCount }: { state: SaveState; lastSavedAt: string | null; issueCount: number }) {
  switch (state) {
    case 'clean':
      return <span>{lastSavedAt ? `Saved ${lastSavedAt} · ` : ''}no unsaved changes</span>;
    case 'dirty':
      return <span>Unsaved changes — autosaves while shippable</span>;
    case 'saving':
      return <span>Saving…</span>;
    case 'blocked':
      return <span>{issueCount} issue{issueCount === 1 ? '' : 's'} block saving (autosave paused)</span>;
    case 'conflict':
      return <span>Conflict — resolve to resume saving</span>;
  }
}

function FieldIssues({ messages }: { messages: string[] | undefined }) {
  if (!messages || messages.length === 0) {
    return null;
  }
  return (
    <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: '#f87171' }}>
      {messages.map((message, i) => (
        <li key={i}>{message}</li>
      ))}
    </ul>
  );
}

function SecretNote({ messages }: { messages: string[] | undefined }) {
  if (!messages || messages.length === 0) {
    return null;
  }
  return (
    <p style={{ fontSize: 12, color: '#f87171' }}>
      {messages[0]} Pasted credentials never reach the engine — remove them before saving.
    </p>
  );
}

const IssueBanner = styled.div`
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  background: ${({ theme }) => theme.app.status.warning.bg};
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 4px;
`;

/** Knowledge slug mapping against live inventory (F-A4 inside the editor). */
function KnowledgeMapping({ sources, onChange }: { sources: string[]; onChange: (next: string[]) => void }) {
  const documents = useDocuments();
  const [pickerOpen, setPickerOpen] = useState(false);

  const stateBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const doc of documents.data ?? []) {
      if (doc.sourceSlug) {
        map.set(doc.sourceSlug, doc.state);
      }
    }
    return map;
  }, [documents.data]);

  const unmapped = useMemo(
    () => (documents.data ?? []).filter((doc) => doc.sourceSlug && !sources.includes(doc.sourceSlug) && doc.state === 'ready'),
    [documents.data, sources],
  );

  return (
    <FieldStack>
      <FieldLabel>Knowledge sources (pin addresses)</FieldLabel>
      {sources.length === 0 ? (
        <EmptyNote>No pins declared — retrieval has nothing to bind. Publish with unresolved pins refuses unless explicitly acknowledged.</EmptyNote>
      ) : (
        <ChipRowBox>
          {sources.map((slug) => {
            const state = stateBySlug.get(slug);
            return (
              <span key={slug} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <StatusPill tone={state === undefined ? 'warning' : state === 'ready' ? 'success' : state === 'retired' ? 'warning' : 'info'} dot={false}>
                  {slug} · {state === undefined ? 'MISSING' : state.toUpperCase()}
                </StatusPill>
                <IconRemove
                  type="button"
                  aria-label={`Unmap ${slug}`}
                  title={state === undefined ? 'No document carries this slug — upload, rename, or connect one.' : `Document state: ${state}`}
                  onClick={() => onChange(sources.filter((s) => s !== slug))}
                >
                  <Trash2 size={13} strokeWidth={1.7} />
                </IconRemove>
              </span>
            );
          })}
        </ChipRowBox>
      )}
      <div>
        <ActionButton variant="secondary" size="sm" onClick={() => setPickerOpen((v) => !v)}>
          <Plus size={13} strokeWidth={1.8} />
          {pickerOpen ? 'Close picker' : 'Map a READY document'}
        </ActionButton>{' '}
        <Link to="/agent-studio/knowledge">Open knowledge →</Link>
      </div>
      {pickerOpen && (
        <ChipRowBox>
          {documents.isPending ? (
            <EmptyNote>Loading inventory…</EmptyNote>
          ) : unmapped.length === 0 ? (
            <EmptyNote>Every READY document is already mapped (or none are READY yet).</EmptyNote>
          ) : (
            unmapped.map((doc) => (
              <ChipToggle key={doc.id} type="button" $on={false} title={doc.title ?? doc.sourceSlug} onClick={() => onChange([...sources, doc.sourceSlug])}>
                + {doc.sourceSlug}
              </ChipToggle>
            ))
          )}
        </ChipRowBox>
      )}
    </FieldStack>
  );
}

/** Catalog-backed tool row: picker over built-ins + enabled rows, effective approval, drift re-pin. */
function ToolBindingRow({
  index,
  tool,
  onChange,
  onRemove,
}: {
  index: number;
  tool: ToolPolicy;
  onChange: (next: ToolPolicy) => void;
  onRemove: () => void;
}) {
  const catalog = useToolCatalog();
  const [custom, setCustom] = useState(tool.name !== '' && ![...(BUILT_IN_TOOLS as readonly string[]), ...(catalog.data ?? []).map((t) => t.name)].includes(tool.name));

  const options = useMemo(() => {
    const rows = (catalog.data ?? []).filter((t) => t.enabled === true);
    return [...BUILT_IN_TOOLS.map((name) => ({ name, effect: 'built-in', approval: '' })), ...rows.map((t) => ({ name: t.name, effect: t.effectClass ?? '', approval: t.approvalRequirement ?? '' }))];
  }, [catalog.data]);

  const catalogRow = useMemo(() => (catalog.data ?? []).find((t) => t.name === tool.name) ?? null, [catalog.data, tool.name]);
  const isBuiltin = (BUILT_IN_TOOLS as readonly string[]).includes(tool.name);
  const inCatalog = isBuiltin || catalogRow !== null;
  const drifted = catalogRow !== null && catalogRow.hash !== null && tool.schema_hash !== undefined && tool.schema_hash !== catalogRow.hash;
  const effective = effectiveApproval(tool, catalogRow?.approvalRequirement ?? null);

  return (
    <ToolRow>
      <div style={{ flex: 1 }}>
        {custom ? (
          <TextInput
            label={`Tool ${index + 1} name (custom)`}
            value={tool.name}
            onChange={(e) => onChange({ ...tool, name: e.target.value })}
            placeholder="e.g. lookup_ticket"
            hint="Not in the catalog — publish refuses until it resolves to an enabled row or built-in."
          />
        ) : (
          <SelectField label={`Tool ${index + 1}`}>
            <EditorSelect value={tool.name} onChange={(e) => {
              const value = e.target.value;
              if (value === '__custom__') {
                setCustom(true);
                return;
              }
              onChange({ ...tool, name: value });
            }} aria-label={`Tool ${index + 1} binding`}>
              <option value="">Pick a tool…</option>
              {options.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name}{option.effect && option.effect !== 'built-in' ? ` · ${option.effect}` : ''}{option.effect === 'built-in' ? ' · built-in' : ''}
                </option>
              ))}
              <option value="__custom__">Custom name…</option>
            </EditorSelect>
          </SelectField>
        )}
      </div>
      <SelectField label="Access">
        <EditorSelect value={tool.access} onChange={(e) => onChange({ ...tool, access: e.target.value as ToolPolicy['access'] })} aria-label={`Access for tool ${index + 1}`}>
          <option value="read">Read</option>
          <option value="write">Write</option>
        </EditorSelect>
      </SelectField>
      <SelectField label="Approval">
        <EditorSelect
          value={tool.approval}
          onChange={(e) => onChange({ ...tool, approval: e.target.value as ToolPolicy['approval'] })}
          aria-label={`Approval for tool ${index + 1}`}
        >
          <option value="never">Never</option>
          <option value="on_effect">On effect</option>
          <option value="always">Always</option>
        </EditorSelect>
      </SelectField>
      <IconRemove type="button" aria-label={`Remove tool ${tool.name || index + 1}`} onClick={onRemove}>
        <Trash2 size={13} strokeWidth={1.7} />
      </IconRemove>
      <div style={{ flexBasis: '100%', fontSize: 12, opacity: 0.75 }}>
        {!tool.name ? (
          <span>Pick a binding to attach it.</span>
        ) : !inCatalog ? (
          <span style={{ color: '#f87171' }}>Not in the catalog — publish will refuse this pin. Register it in Tools or pick a built-in.</span>
        ) : (
          <span>
            Effective approval: <strong>{effective}</strong>
            {catalogRow?.effectClass ? ` · ${catalogRow.effectClass}` : ''} (catalog {catalogRow?.approvalRequirement ?? '—'} escalates on_effect).
            {drifted && (
              <>
                {' '}· <span style={{ color: '#f87171' }}>schema pin stale</span>{' '}
                <ActionButton
                  variant="ghost"
                  size="sm"
                  onClick={() => catalogRow?.hash && onChange({ ...tool, schema_hash: catalogRow.hash })}
                >
                  Re-pin to {catalogRow?.hash?.slice(0, 12)}
                </ActionButton>
              </>
            )}
          </span>
        )}
      </div>
    </ToolRow>
  );
}

/** 412 merge-or-reload: both hashes, field diff, explicit choices. Autosave stays stopped until resolved. */
function MergeModal({
  conflict,
  onReloadTheirs,
  onSaveMine,
  onClose,
  pending,
}: {
  conflict: Conflict;
  onReloadTheirs: () => void;
  onSaveMine: (freshHash: string) => void;
  onClose: () => void;
  pending: boolean;
}) {
  const params = useParams({ from: '/agent-studio/agents/$agentId/edit' });
  const form = useAssistantDefinition(params.agentId);
  const theirs = form.data?.definition ?? null;
  const freshHash = form.data?.hash ?? null;
  const rows = theirs ? diffDefinitions(theirs, conflict.attempted) : [];

  return (
    <Modal
      open
      onClose={onClose}
      title="Someone saved first — merge or reload"
      width={640}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Keep editing (autosave stays off)
          </ActionButton>
          <ActionButton variant="secondary" disabled={pending} onClick={onReloadTheirs}>
            Reload theirs
          </ActionButton>
          <ActionButton disabled={pending || !freshHash} title={freshHash ? 'Retry your save against the fresh hash' : 'Waiting for the fresh version…' } onClick={() => freshHash && onSaveMine(freshHash)}>
            Save mine over theirs
          </ActionButton>
        </>
      }
    >
      <p style={{ fontSize: 13, opacity: 0.8 }}>
        Your save carried hash <Mono>{conflict.expectedHash.slice(0, 12) || '—'}</Mono>; the server is at{' '}
        <Mono>{conflict.currentHash?.slice(0, 12) ?? 'unknown'}</Mono>. Nothing was overwritten. Differences between their
        version and your attempt:
      </p>
      {rows.length === 0 ? (
        <EmptyNote>{theirs ? 'No field differences — same content, new hash. Saving again is safe.' : 'Loading their version…'}</EmptyNote>
      ) : (
        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map((row) => (
            <div key={row.path} style={{ fontSize: 12 }}>
              <Mono>{row.path}</Mono> [{row.kind}]{' '}
              {row.kind !== 'added' && <span style={{ textDecoration: 'line-through', opacity: 0.7 }}>{row.from.slice(0, 120)}</span>}{' '}
              {row.kind !== 'removed' && <span>{row.to.slice(0, 120)}</span>}
            </div>
          ))}
        </div>
      )}
      {conflict.currentHash === null && (
        <ErrorState title="Current hash unknown" message="The refusal carried no current hash — reload theirs before retrying." />
      )}
    </Modal>
  );
}

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

/** Number field with bounds — non-numeric input is simply not applied. */
function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
}) {
  return (
    <TextInput
      label={label}
      type="number"
      value={String(value)}
      min={min}
      max={max}
      onChange={(e) => {
        const parsed = Number(e.target.value);
        if (Number.isFinite(parsed)) {
          onChange(Math.min(max, Math.max(min, Math.round(parsed))));
        }
      }}
    />
  );
}

/** Optional number field with bounds — clearing the input unsets the value (engine defaults apply). */
function OptionalNumberField({
  label,
  value,
  onChange,
  min,
  max,
  integer = true,
}: {
  label: string;
  value: number | undefined;
  onChange: (next: number | undefined) => void;
  min: number;
  max: number;
  integer?: boolean;
}) {
  return (
    <TextInput
      label={label}
      type="number"
      value={value === undefined ? '' : String(value)}
      min={min}
      max={max}
      step={integer ? 1 : 'any'}
      placeholder="unset"
      onChange={(e) => {
        if (e.target.value.trim() === '') {
          onChange(undefined);
          return;
        }
        const parsed = Number(e.target.value);
        if (Number.isFinite(parsed)) {
          const clamped = Math.min(max, Math.max(min, parsed));
          onChange(integer ? Math.round(clamped) : Math.round(clamped * 1000) / 1000);
        }
      }}
    />
  );
}

function SelectField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <SelectFieldBox>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </SelectFieldBox>
  );
}

const SelectFieldBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const EditorActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;
