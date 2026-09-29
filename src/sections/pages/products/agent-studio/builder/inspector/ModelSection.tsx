import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { Switch } from '@components/common/ui/Switch';
import { Segmented } from '@components/common/ui/Segmented';
import { ApiError } from '@lib/engine/client';
import { useCanSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  costLabel,
  useModelAvailability,
  useModelCosts,
} from '@hooks/studio/useSetupModels';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import {
  useProviderCredentials,
} from '@hooks/studio/useSetupProviders';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import {
  ENGINE_RANGES,
  firstBlocker,
  humanizeReason,
  reasonFix,
  usableRefs,
  validateOutputSchema,
  type ReasoningEffort,
} from '../lib/brain-model';
import { ConflictDialog } from './ConflictDialog';
import { ModelPicker } from './ModelPicker';
import { CredentialsPanel } from './CredentialsPanel';
import { StatusDot } from '../canvas/nodes/SlotNode.styles';
import { EmptyState, Whisper, Wrap } from './InstructionsSection.styles';
import {
  AdvancedToggle,
  FieldBlock,
  FieldHead,
  FieldHelper,
  FieldTitle,
  ModelHero,
  ModelHeroEmpty,
  ModelHeroFix,
  ModelHeroMain,
  ModelHeroMeta,
  ModelHeroName,
  ParamStack,
  RangeEnds,
  RangeInput,
  SliderHead,
  SliderName,
  SliderRow,
  SliderValue,
  StaticFallback,
  SwitchRow,
  SwitchSub,
  SwitchText,
  SwitchTitle,
  ToggleChevron,
} from './ModelSection.styles';

export interface ModelSectionProps {
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
 * Model node — the subscription-gated model picker, fallback chain, and
 * generation params. Moved out of the Brain node (v10.1): the catalog rows
 * carry `usable` + machine `reasons[]` (now including `subscription_required`
 * with `required_product`/`required_product_label`), and locked rows render
 * the why inline with a path to Subscriptions — never a dead end.
 *
 * The proven save state machine (debounce, PUT/POST, 409 adopt, 412 dialog,
 * dirty flag) is shared with the other policy sections.
 */
export function ModelSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
  saveSignal = 0,
}: ModelSectionProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { role } = useOrg();
  const canSetup = useCanSetup();
  const canGovern = canSetup('setup:govern');
  const canReadCredentials = role === 'owner' || role === 'admin' || role === 'developer';

  const models = useModelAvailability();
  const costs = useModelCosts();

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [allowed, setAllowed] = useState<string[]>(() => definition?.model_policy.allowed_models ?? []);
  const [fallback, setFallback] = useState(() => definition?.model_policy.fallback_enabled ?? false);
  const [params, setParams] = useState<ParamDraft>(() => (definition ? readParams(definition) : {}));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const [connectProvider, setConnectProvider] = useState<string | null>(null);
  const [revokeCredentialId, setRevokeCredentialId] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const sendHashRef = useRef('');

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);
  const credentials = useProviderCredentials();

  const source = useMemo(
    () => ({
      allowed: definition?.model_policy.allowed_models ?? [],
      fallback: definition?.model_policy.fallback_enabled ?? false,
      params: definition ? readParams(definition) : {},
    }),
    [definition],
  );
  const current = useMemo(
    () => JSON.stringify({ allowed, fallback, params }),
    [allowed, fallback, params],
  );
  const dirty = current !== JSON.stringify(source);

  // Adopt server slices whenever clean (save echo, 409-adopt, reload-theirs).
  if (docKey !== sourceKey && !dirty) {
    setDocKey(sourceKey);
    setAllowed(source.allowed);
    setFallback(source.fallback);
    setParams(source.params);
  } else if (docKey !== sourceKey) {
    setDocKey(sourceKey);
  }

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const catalog = models.data;
  const usable = useMemo(() => usableRefs(allowed, catalog), [allowed, catalog]);
  const blocker = useMemo(
    () => (allowed.length > 0 && usable.length === 0 && catalog !== undefined ? firstBlocker(allowed, catalog) : null),
    [allowed, usable, catalog],
  );
  const primary = allowed[0] ?? null;

  // Local param gates (caps doesn't cover temperature/top_p/schema — PLAN §12.3).
  // NaN counts as invalid everywhere (typed garbage must hold, never ship).
  const paramIssues = useMemo(() => {
    const messages: string[] = [];
    if (params.temperature !== undefined && (!Number.isFinite(params.temperature) || params.temperature < 0 || params.temperature > 2)) {
      messages.push('Temperature must be 0–2.');
    }
    if (params.top_p !== undefined && (!Number.isFinite(params.top_p) || params.top_p <= 0 || params.top_p > 1)) {
      messages.push('Top-p must be above 0 and at most 1.');
    }
    if (params.output_schema !== undefined) {
      const check = validateOutputSchema(params.output_schema);
      if (!check.ok) messages.push(check.message);
    }
    return messages;
  }, [params]);

  const buildNext = useCallback((): AgentDefinition | null => {
    if (!definition) return null;
    return buildDraftPayload(definition, {
      model_policy: { allowed_models: allowed, fallback_enabled: fallback },
      model_params: {
        ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
        ...(params.max_output_tokens !== undefined ? { max_output_tokens: params.max_output_tokens } : {}),
        ...(params.top_p !== undefined ? { top_p: params.top_p } : {}),
        ...(params.reasoning_effort !== undefined ? { reasoning_effort: params.reasoning_effort } : {}),
        ...(params.output_schema !== undefined ? { output_schema: params.output_schema } : {}),
      },
    });
  }, [definition, allowed, fallback, params]);

  const capsIssues = useMemo(() => {
    const next = buildNext();
    if (!next) return [];
    return checkDefinitionCaps(next).filter(
      (issue) => issue.path.startsWith('model_policy') || issue.path.startsWith('model_params') || issue.path === 'secrets',
    );
  }, [buildNext]);

  const heldMessages = useMemo(() => [...paramIssues, ...capsIssues.map((i) => i.message)], [paramIssues, capsIssues]);
  const blocked = heldMessages.length > 0;
  const pending = saveDraft.isPending || updateDraft.isPending;
  // Convergence is measured in POLICY shape (what the dialog hands back), not
  // local shape — comparing across shapes would park autosave forever.
  const sourcePolicyJson = useMemo(
    () =>
      definition
        ? JSON.stringify({ model_policy: definition.model_policy, model_params: definition.model_params })
        : null,
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
                attempted: JSON.stringify({ model_policy: next.model_policy, model_params: next.model_params }),
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
          toast.success('A draft opened elsewhere — resumed it. Your text stays; the next save writes to it.');
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

  const onFixRequest = useCallback(
    (action: 'connect' | 'enable' | 'profile' | 'incident', ref: string) => {
      if (action === 'connect') {
        setConnectProvider(ref.split('/')[0] ?? ref);
        setRevokeCredentialId(null);
        setConnectOpen(true);
        document.querySelector('[data-credentials-panel]')?.scrollIntoView({ block: 'nearest' });
        return;
      }
      if (action === 'incident') {
        // Revoke form opens against the provider's live credential (matched by
        // provider below); absent credential → connect first, stated plainly.
        const provider = ref.split('/')[0] ?? ref;
        const match = (credentials.data ?? []).find((c) => c.provider === provider && c.revokedAt === null);
        if (match) {
          setRevokeCredentialId(match.id);
          setConnectOpen(false);
        } else {
          setConnectProvider(provider);
          setRevokeCredentialId(null);
          setConnectOpen(true);
          toast('No live credential for that provider — connect one first.');
        }
        document.querySelector('[data-credentials-panel]')?.scrollIntoView({ block: 'nearest' });
        return;
      }
      // Enablement + residency pins live in the Models library (govern plane) —
      // the builder links out instead of duplicating (dirty-guarded globally).
      navigate({ to: '/agent-studio/models' });
    },
    [credentials.data, navigate],
  );

  if (!definition) {
    return (
      <Wrap>
        <EmptyState>Loading the draft…</EmptyState>
      </Wrap>
    );
  }

  const pinnedProviders = [...new Set(allowed.map((ref) => ref.split('/')[0] ?? ref))];
  const primaryCost = primary ? costs.data?.find((c) => c.ref === primary) : undefined;

  return (
    <Wrap
      onKeyDown={(event) => {
        if (event.key === 'Escape' && event.target instanceof HTMLElement) {
          event.target.blur();
        }
      }}
    >
      <ModelHero $tone={blocker ? 'attention' : 'ok'}>
        {primary ? (
          <ModelHeroMain>
            <ModelHeroName>
              {/* M-10: while the catalog is unresolved (loading or failed)
                  the model's status is unknown — a gray 'info' dot, never
                  the amber attention badge (unknown ≠ known-bad). */}
              <StatusDot
                $status={catalog === undefined ? 'info' : usable.includes(primary) ? 'ready' : 'attention'}
                aria-hidden="true"
              />
              {catalog?.find((m) => m.ref === primary)?.displayName ?? primary}
            </ModelHeroName>
            <ModelHeroMeta>
              {primary} · {primaryCost ? `${costLabel(primaryCost, 'in')} in / ${costLabel(primaryCost, 'out')} out` : 'unpriced'}
              {fallback && allowed.length > 1 ? ` · fallback next → ${allowed[1]}` : ''}
            </ModelHeroMeta>
            {blocker && (
              <ModelHeroFix>
                {blocker.reason === null
                  ? 'Unknown model — publish refuses.'
                  : `Unusable: ${humanizeReason(blocker.reason)} — ${reasonFix(blocker.reason).label}.`}
              </ModelHeroFix>
            )}
          </ModelHeroMain>
        ) : (
          <ModelHeroMain>
            <ModelHeroEmpty>No model picked yet — choose below. Saving without one is refused.</ModelHeroEmpty>
          </ModelHeroMain>
        )}
      </ModelHero>

      {canAuthor ? (
        <FieldBlock>
          <SwitchRow>
            <SwitchText>
              <SwitchTitle>Fallback</SwitchTitle>
              <SwitchSub>When the preferred model is unavailable, serve with the next allowed model — in listed order.</SwitchSub>
            </SwitchText>
            <Switch checked={fallback} onChange={setFallback} label="Fallback" id="model-fallback-switch" />
          </SwitchRow>
          <FieldHelper>Fallback serves availability, not difficulty — a weaker model never silently substitutes quality.</FieldHelper>
        </FieldBlock>
      ) : (
        <StaticFallback>
          <SwitchTitle>Fallback</SwitchTitle>
          <span>{fallback ? 'On — next allowed model, in order' : 'Off'}</span>
        </StaticFallback>
      )}

      <FieldBlock>
        <FieldHead>
          <FieldTitle>Models</FieldTitle>
          <FieldHelper>
            {allowed.length} of {ENGINE_RANGES.allowedModelsMax} picked — first serves, the rest are fallback in order.
          </FieldHelper>
        </FieldHead>
        <ModelPicker
          allowed={allowed}
          catalog={catalog}
          catalogError={models.isError}
          costs={costs.data}
          canAuthor={canAuthor}
          onChange={setAllowed}
          onFixRequest={onFixRequest}
        />
      </FieldBlock>

      <FieldBlock>
        <FieldHead>
          <FieldTitle>Parameters</FieldTitle>
          <FieldHelper>Generation defaults for every run. Unset means the model default.</FieldHelper>
        </FieldHead>
        <ParamStack>
          <SliderRow>
            <SliderHead>
              <SliderName>Temperature</SliderName>
              <SliderValue>{params.temperature ?? 'default'}</SliderValue>
            </SliderHead>
            {canAuthor ? (
              <>
                <RangeInput
                  type="range"
                  min={ENGINE_RANGES.temperature.min}
                  max={ENGINE_RANGES.temperature.max}
                  step={ENGINE_RANGES.temperature.step}
                  value={params.temperature ?? 1}
                  aria-label="Temperature"
                  onChange={(event) => setParams((prev) => ({ ...prev, temperature: Number(event.target.value) }))}
                />
                <RangeEnds>
                  <span>{ENGINE_RANGES.temperature.min}</span>
                  <span>{ENGINE_RANGES.temperature.max}</span>
                </RangeEnds>
              </>
            ) : null}
          </SliderRow>
          <AdvancedToggle type="button" onClick={() => setAdvancedOpen((o) => !o)} aria-expanded={advancedOpen}>
            Advanced
            <ToggleChevron $open={advancedOpen} aria-hidden="true">
              <ChevronDown size={15} strokeWidth={2} />
            </ToggleChevron>
            <span>· top-p, max output, reasoning, schema</span>
          </AdvancedToggle>
          {advancedOpen && (
            <>
              <SliderRow>
                <SliderHead>
                  <SliderName>Top-p</SliderName>
                  <SliderValue>{params.top_p ?? 'default'}</SliderValue>
                </SliderHead>
                {canAuthor && (
                  <TextInput
                    aria-label="Top-p (above 0, at most 1)"
                    inputMode="decimal"
                    value={params.top_p ?? ''}
                    onChange={(event) => {
                      const raw = event.target.value.trim();
                      setParams((prev) => (raw === '' ? { ...prev, top_p: undefined } : { ...prev, top_p: Number(raw) }));
                    }}
                    placeholder="e.g. 0.95"
                  />
                )}
              </SliderRow>
              <SliderRow>
                <SliderHead>
                  <SliderName>Max output tokens</SliderName>
                  <SliderValue>{params.max_output_tokens?.toLocaleString() ?? 'default'}</SliderValue>
                </SliderHead>
                {canAuthor && (
                  <TextInput
                    aria-label="Max output tokens (1–200000)"
                    inputMode="numeric"
                    value={params.max_output_tokens ?? ''}
                    onChange={(event) => {
                      const raw = event.target.value.trim();
                      setParams((prev) =>
                        raw === '' ? { ...prev, max_output_tokens: undefined } : { ...prev, max_output_tokens: Number(raw) },
                      );
                    }}
                    placeholder="e.g. 4096"
                  />
                )}
              </SliderRow>
              <SliderRow>
                <SliderHead>
                  <SliderName>Reasoning effort</SliderName>
                </SliderHead>
                {canAuthor ? (
                  <Segmented
                    options={[
                      // BR-01: an explicit Default segment — an unset effort
                      // renders unset (no visual pre-select of 'medium', no
                      // phantom write; choosing Default clears the value).
                      { value: 'default', label: 'Default' },
                      { value: 'minimal', label: 'Minimal' },
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                    ]}
                    value={params.reasoning_effort ?? 'default'}
                    onChange={(value) =>
                      setParams((prev) =>
                        value === 'default'
                          ? { ...prev, reasoning_effort: undefined }
                          : { ...prev, reasoning_effort: value },
                      )
                    }
                    size="sm"
                    ariaLabel="Reasoning effort"
                  />
                ) : (
                  <SliderValue>{params.reasoning_effort ?? 'default'}</SliderValue>
                )}
              </SliderRow>
              <SliderRow>
                <SliderHead>
                  <SliderName>Output schema (JSON object)</SliderName>
                </SliderHead>
                {canAuthor && (
                  <TextArea
                    aria-label="Output schema as a JSON object"
                    value={params.output_schema ?? ''}
                    onChange={(event) =>
                      setParams((prev) =>
                        event.target.value === '' ? { ...prev, output_schema: undefined } : { ...prev, output_schema: event.target.value },
                      )
                    }
                    rows={4}
                    placeholder='{"type": "object", …}'
                  />
                )}
              </SliderRow>
            </>
          )}
        </ParamStack>
      </FieldBlock>

      {heldMessages.map((message) => (
        <Whisper key={message} $tone="red" role="alert">
          {message} Autosave held — fix it and saving resumes on its own.
        </Whisper>
      ))}

      <FieldBlock>
        <div data-credentials-panel>
          <FieldHead>
            <FieldTitle>Credentials</FieldTitle>
            <FieldHelper>Fingerprints only — secrets never leave the vault.</FieldHelper>
          </FieldHead>
          <div style={{ marginTop: 10 }}>
            <CredentialsPanel
              pinnedProviders={pinnedProviders}
              canGovern={canGovern}
              canRead={canReadCredentials}
              highlightProvider={connectProvider}
              revokeOpenId={revokeCredentialId}
              connectOpen={connectOpen}
              onConnectOpenChange={setConnectOpen}
              onRevokeOpenChange={setRevokeCredentialId}
            />
          </div>
        </div>
      </FieldBlock>

      {conflict && (
        <ConflictDialog
          assistantId={assistantId}
          attempted={conflict.attempted}
          expectedHash={conflict.expectedHash}
          currentHash={conflict.currentHash}
          pending={pending}
          selectTheirs={(live) => JSON.stringify({ model_policy: live.model_policy, model_params: live.model_params })}
          onReloadTheirs={(theirs) => {
            // Adopt theirs into local state + park autosave until props converge
            // (adopting gate) — never save-over blindly after asking for theirs.
            try {
              const parsed = JSON.parse(theirs) as {
                model_policy?: { allowed_models?: unknown; fallback_enabled?: unknown };
                model_params?: Record<string, unknown>;
              };
              const mp = parsed.model_policy;
              if (mp && Array.isArray(mp.allowed_models)) {
                setAllowed(mp.allowed_models.filter((r): r is string => typeof r === 'string'));
              }
              if (mp && typeof mp.fallback_enabled === 'boolean') setFallback(mp.fallback_enabled);
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
