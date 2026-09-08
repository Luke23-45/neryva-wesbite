import { useState } from 'react';
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
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import {
  useAssistant,
  useSaveDraftVersion,
  validateDefinition,
  defaultDefinition,
  MODEL_CATALOG,
  MEMORY_SCOPES,
  type AgentDefinition,
  type ToolPolicy,
} from '@hooks/studio/useAgentAuthoring';
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
 * The agent definition editor (ledger A-3) — round-trips the
 * agent-definition surface through the engine: every field of the draft is
 * editable, validation runs client-side and server-side, and saving
 * produces a new immutable draft version (publish/rollback live on the
 * detail page).
 *
 * The model allowlist is ⛔ E-1 (static catalog until the registry lands);
 * tools are authored freely — the runtime's tool registry (A-8) validates
 * them at run time.
 */

export function AgentEditor() {
  const params = useParams({ from: '/agent-studio/agents/$agentId/edit' });
  const assistant = useAssistant(params.agentId);
  const navigate = useNavigate();
  const saveDraft = useSaveDraftVersion(params.agentId);
  const [draft, setDraft] = useState<AgentDefinition | null>(null);
  const [showJson, setShowJson] = useState(false);

  // The form is authoritative once loaded; the key remount seeds it.
  const loaded = assistant.data?.definition ?? null;
  const effective = draft ?? loaded;

  const patch = (next: Partial<AgentDefinition>) => {
    setDraft({ ...(effective ?? defaultDefinition()), ...next });
  };

  const save = () => {
    if (!effective) {
      return;
    }
    const problem = validateDefinition(effective);
    if (problem) {
      toast.error(problem);
      return;
    }
    saveDraft.mutate(effective, {
      onSuccess: () => {
        toast.success('Draft saved — publish it from the agent page');
        navigate({ to: '/agent-studio/agents/$agentId', params: { agentId: params.agentId } });
      },
    });
  };

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
                <ViewSubtitle>{info.description ?? 'Edit the definition, then save it as a draft version.'}</ViewSubtitle>
              </ViewHeader>
              <EditorActions>
                <ActionButton variant="secondary" size="sm" onClick={() => setShowJson((v) => !v)}>
                  <Braces size={13} strokeWidth={1.8} />
                  {showJson ? 'Hide JSON' : 'View JSON'}
                </ActionButton>
                <ActionButton size="sm" disabled={saveDraft.isPending} onClick={save}>
                  Save draft
                </ActionButton>
              </EditorActions>
            </ViewHeaderRow>

            {effective && (
              <EditorGrid>
                <EditorColumn>
                  <SectionGap>
                    <Panel title="Instructions" subtitle="What this agent is and how it behaves. Required.">
                      <TextArea
                        label="System instructions"
                        value={effective.instructions}
                        onChange={(e) => patch({ instructions: e.target.value })}
                        rows={8}
                        placeholder="You are…"
                      />
                    </Panel>
                  </SectionGap>

                  <SectionGap>
                    <Panel title="Model policy" subtitle="Which models may serve this agent. ⛔ E-1: catalog is static until the registry lands.">
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
                          <ChipRowBox>
                            {MODEL_CATALOG.map((model) => {
                              const on = effective.model_policy.allowed_models.includes(model);
                              return (
                                <ChipToggle
                                  key={model}
                                  type="button"
                                  $on={on}
                                  aria-pressed={on}
                                  onClick={() => {
                                    const allowed = on
                                      ? effective.model_policy.allowed_models.filter((m) => m !== model)
                                      : [...effective.model_policy.allowed_models, model];
                                    patch({ model_policy: { ...effective.model_policy, allowed_models: allowed } });
                                  }}
                                >
                                  {model}
                                </ChipToggle>
                              );
                            })}
                          </ChipRowBox>
                        </FieldStack>
                        <FieldRow>
                          <NumberField
                            label="Max output tokens"
                            value={effective.model_policy.max_output_tokens}
                            min={1}
                            max={200000}
                            onChange={(v) => patch({ model_policy: { ...effective.model_policy, max_output_tokens: v } })}
                          />
                        </FieldRow>
                      </FieldStack>
                    </Panel>
                  </SectionGap>

                  <SectionGap>
                    <Panel title="Context policy" subtitle="How much conversation and knowledge the agent may see.">
                      <FieldStack>
                        <FieldRow>
                          <NumberField
                            label="History limit (messages)"
                            value={effective.context_policy.history_limit}
                            min={0}
                            max={500}
                            onChange={(v) => patch({ context_policy: { ...effective.context_policy, history_limit: v } })}
                          />
                          <NumberField
                            label="Max context tokens"
                            value={effective.context_policy.max_context_tokens}
                            min={1000}
                            max={1000000}
                            onChange={(v) => patch({ context_policy: { ...effective.context_policy, max_context_tokens: v } })}
                          />
                        </FieldRow>
                        <FieldRow>
                          <SelectField label="Memory scope">
                            <EditorSelect
                              value={effective.context_policy.memory_scope}
                              onChange={(e) => patch({ context_policy: { ...effective.context_policy, memory_scope: e.target.value } })}
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
                        <TextInput
                          label="Knowledge sources (comma-separated)"
                          value={effective.context_policy.knowledge_sources.join(', ')}
                          onChange={(e) =>
                            patch({
                              context_policy: {
                                ...effective.context_policy,
                                knowledge_sources: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                              },
                            })
                          }
                          hint="Names of the knowledge scopes this agent may retrieve from."
                        />
                      </FieldStack>
                    </Panel>
                  </SectionGap>

                  <SectionGap>
                    <Panel
                      title="Tools"
                      subtitle="Tools this agent may call — validated against the registry at run time."
                      action={
                        <ActionButton
                          variant="secondary"
                          size="sm"
                          onClick={() => patch({ tools: [...effective.tools, { id: '', approval: 'never' } satisfies ToolPolicy] })}
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
                            <ToolRow key={i}>
                              <div style={{ flex: 1 }}>
                                <TextInput
                                  label={`Tool ${i + 1} id`}
                                  value={tool.id}
                                  onChange={(e) => {
                                    const next = [...effective.tools];
                                    next[i] = { ...tool, id: e.target.value };
                                    patch({ tools: next });
                                  }}
                                  placeholder="e.g. web_search"
                                />
                              </div>
                              <SelectField label="Approval">
                                <EditorSelect
                                  value={tool.approval}
                                  onChange={(e) => {
                                    const next = [...effective.tools];
                                    next[i] = { ...tool, approval: e.target.value as ToolPolicy['approval'] };
                                    patch({ tools: next });
                                  }}
                                  aria-label={`Approval for tool ${i + 1}`}
                                >
                                  <option value="never">Never — fully automatic</option>
                                  <option value="on_effect">On effect — ask before changes</option>
                                  <option value="always">Always — ask every call</option>
                                </EditorSelect>
                              </SelectField>
                              <IconRemove
                                type="button"
                                aria-label={`Remove tool ${tool.id || i + 1}`}
                                onClick={() => patch({ tools: effective.tools.filter((_, j) => j !== i) })}
                              >
                                <Trash2 size={13} strokeWidth={1.7} />
                              </IconRemove>
                            </ToolRow>
                          ))}
                        </FieldStack>
                      )}
                    </Panel>
                  </SectionGap>
                </EditorColumn>

                <EditorColumn>
                  <SectionGap>
                    <Panel title="Guardrails" subtitle="What may never pass through, in or out.">
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
                      </FieldStack>
                    </Panel>
                  </SectionGap>

                  <SectionGap>
                    <Panel title="Budget policy" subtitle="Hard stops that keep a runaway run from costing real money.">
                      <FieldStack>
                        <FieldRow>
                          <NumberField label="Max model calls" value={effective.budget_policy.max_model_calls} min={1} max={200} onChange={(v) => patch({ budget_policy: { ...effective.budget_policy, max_model_calls: v } })} />
                          <NumberField label="Max tool calls" value={effective.budget_policy.max_tool_calls} min={0} max={200} onChange={(v) => patch({ budget_policy: { ...effective.budget_policy, max_tool_calls: v } })} />
                        </FieldRow>
                        <FieldRow>
                          <NumberField label="Max wall clock (ms)" value={effective.budget_policy.max_wall_clock_ms} min={1000} max={900000} onChange={(v) => patch({ budget_policy: { ...effective.budget_policy, max_wall_clock_ms: v } })} />
                          <NumberField label="Max recursion depth" value={effective.budget_policy.max_recursion_depth} min={0} max={20} onChange={(v) => patch({ budget_policy: { ...effective.budget_policy, max_recursion_depth: v } })} />
                        </FieldRow>
                        <FieldRow>
                          <NumberField label="Max token budget" value={effective.budget_policy.max_token_budget} min={100} max={2000000} onChange={(v) => patch({ budget_policy: { ...effective.budget_policy, max_token_budget: v } })} />
                          <NumberField label="Max cost (cents)" value={effective.budget_policy.max_cost_cents} min={0} max={100000} onChange={(v) => patch({ budget_policy: { ...effective.budget_policy, max_cost_cents: v } })} />
                        </FieldRow>
                      </FieldStack>
                    </Panel>
                  </SectionGap>

                  <SectionGap>
                    <Panel title="Retrieval & brand" subtitle="How knowledge and memory are mixed, and the voice to use.">
                      <FieldStack>
                        <FieldRow>
                          <NumberField label="Knowledge max results" value={effective.retrieval_policy.knowledge_max_results} min={1} max={50} onChange={(v) => patch({ retrieval_policy: { ...effective.retrieval_policy, knowledge_max_results: v } })} />
                          <NumberField label="Memory max results" value={effective.retrieval_policy.memory_max_results} min={0} max={50} onChange={(v) => patch({ retrieval_policy: { ...effective.retrieval_policy, memory_max_results: v } })} />
                        </FieldRow>
                        <SwitchRow>
                          <SwitchText>
                            <SwitchTitle>Hybrid retrieval</SwitchTitle>
                            <SwitchSub>Mix semantic and keyword search for knowledge lookups.</SwitchSub>
                          </SwitchText>
                          <Switch
                            checked={effective.retrieval_policy.hybrid_retrieval}
                            onChange={(next) => patch({ retrieval_policy: { ...effective.retrieval_policy, hybrid_retrieval: next } })}
                          />
                        </SwitchRow>
                        <TextArea
                          label="Brand voice"
                          value={effective.brand}
                          onChange={(e) => patch({ brand: e.target.value })}
                          rows={3}
                          placeholder="Warm, precise, never theatrical…"
                        />
                      </FieldStack>
                    </Panel>
                  </SectionGap>

                  {showJson && (
                    <SectionGap>
                      <Panel title="Definition JSON" subtitle="Exactly what will be saved as the next draft version.">
                        <JsonBox>
                          <code>{JSON.stringify(effective, null, 2)}</code>
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
    </ViewShell>
  );
}

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
