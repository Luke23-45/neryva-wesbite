import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
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
import { AUTOSAVE_MS, buildDraftPayload } from '../lib/draft-save';
import {
  ENGINE_RANGES,
  firstBlocker,
  humanizeReason,
  matchPreset,
  MODEL_PRESETS,
  reasonFix,
  usableRefs,
  validateOutputSchema,
  type ReasoningEffort,
} from '../lib/brain-model';
import { ConflictDialog } from './ConflictDialog';
import { ModelPicker } from './ModelPicker';
import { CredentialsPanel } from './CredentialsPanel';
import { StatusDot } from '../canvas/nodes/SlotNode.styles';
import {
  EmptyState,
  SectionLabel,
  Whisper,
  Wrap,
} from './InstructionsSection.styles';
import {
  AdvancedToggle,
  FixRow,
  ParamGrid,
  ProfileCard,
  ProfileGrid,
  ProfileMap,
  ProfileMatch,
  ProfileName,
  RangeEnds,
  RangeInput,
  ResolvedCard,
  ResolvedMeta,
  ResolvedTitle,
  SliderHead,
  SliderRow,
  SliderValue,
  StaticLabel,
  StaticRow,
  SwitchRow,
  SwitchSub,
  SwitchText,
  SwitchTitle,
} from './BrainSection.styles';

export interface BrainSectionProps {
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
 * C04 mount — model policy, params, profiles, credentials; the proven save
 * state machine (debounce, PUT/POST, 409 adopt, 412 dialog, dirty flag).
 * Read-mostly for viewers; governed mutates for credentials.
 */
export function BrainSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
}: BrainSectionProps) {
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
  const matchedPreset = matchPreset({
    temperature: params.temperature,
    top_p: params.top_p,
    max_output_tokens: params.max_output_tokens,
    reasoning_effort: params.reasoning_effort,
  });

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

  useEffect(() => {
    if (!canAuthor || !dirty || blocked || conflict || adoptingActive || pending || !definition) return;
    const timer = window.setTimeout(() => {
      doSave();
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition, current, doSave]);

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
      <div>
        <SectionLabel>RESOLVED · FIRST SERVES</SectionLabel>
        <ResolvedCard $tone={blocker ? 'attention' : 'ok'} style={{ marginTop: 6 }}>
          {primary ? (
            <>
              <ResolvedTitle>
                <StatusDot $status={usable.includes(primary) ? 'ready' : 'attention'} aria-hidden="true" />
                {catalog?.find((m) => m.ref === primary)?.displayName ?? primary}
              </ResolvedTitle>
              <ResolvedMeta>
                {primary} · {primaryCost ? `${costLabel(primaryCost, 'in')} in / ${costLabel(primaryCost, 'out')} out` : 'unpriced'}
                {fallback && allowed.length > 1 ? ` · fallback next → ${allowed[1]}` : ''}
              </ResolvedMeta>
              {blocker && (
                <FixRow>
                  <ResolvedMeta>
                    {blocker.reason === null ? 'Unknown model — publish refuses.' : `unusable: ${humanizeReason(blocker.reason)} — ${reasonFix(blocker.reason).label}.`}
                  </ResolvedMeta>
                </FixRow>
              )}
            </>
          ) : (
            <ResolvedMeta>No model picked yet — choose below. Saving without one is refused.</ResolvedMeta>
          )}
        </ResolvedCard>
      </div>

      {canAuthor ? (
        <SwitchRow>
          <SwitchText>
            <SwitchTitle>Fallback</SwitchTitle>
            <SwitchSub>When the preferred model is unavailable, serve with the next allowed model — in listed order.</SwitchSub>
          </SwitchText>
          <Switch checked={fallback} onChange={setFallback} label="Fallback" id="brain-fallback-switch" />
        </SwitchRow>
      ) : (
        <StaticRow>
          <StaticLabel>Fallback</StaticLabel>
          <span>{fallback ? 'On — next allowed model, in order' : 'Off'}</span>
        </StaticRow>
      )}
      <div style={{ fontSize: 11, opacity: 0.6 }}>
        Fallback serves availability, not difficulty — a weaker model never silently substitutes quality.
      </div>

      <div>
        <SectionLabel>
          MODEL POLICY · {allowed.length} / {ENGINE_RANGES.allowedModelsMax}
        </SectionLabel>
        <div style={{ marginTop: 6 }}>
          <ModelPicker
            allowed={allowed}
            catalog={catalog}
            catalogError={models.isError}
            costs={costs.data}
            canAuthor={canAuthor}
            onChange={setAllowed}
            onFixRequest={onFixRequest}
          />
        </div>
      </div>

      <div>
        <SectionLabel>PROFILES · INSPECT BEFORE APPLY</SectionLabel>
        <ProfileGrid style={{ marginTop: 6 }}>
          {MODEL_PRESETS.map((preset) => {
            const matched = matchedPreset?.id === preset.id;
            return (
              <ProfileCard
                key={preset.id}
                type="button"
                $active={matched}
                disabled={!canAuthor}
                title={`${preset.blurb} temp ${preset.params.temperature} · top_p ${preset.params.top_p} · ${preset.params.max_output_tokens} tokens · reasoning ${preset.params.reasoning_effort}`}
                onClick={
                  canAuthor
                    ? () =>
                        setParams((prev) => ({
                          ...prev,
                          temperature: preset.params.temperature,
                          top_p: preset.params.top_p,
                          max_output_tokens: preset.params.max_output_tokens,
                          reasoning_effort: preset.params.reasoning_effort,
                        }))
                    : undefined
                }
              >
                <ProfileName>{preset.label}</ProfileName>
                <ProfileMap>
                  t{preset.params.temperature} · p{preset.params.top_p} · {preset.params.max_output_tokens.toLocaleString()}
                </ProfileMap>
                {matched && <ProfileMatch>Matches current</ProfileMatch>}
              </ProfileCard>
            );
          })}
        </ProfileGrid>
      </div>

      <div>
        <SectionLabel>PARAMETERS</SectionLabel>
        <ParamGrid style={{ marginTop: 6 }}>
          <SliderRow>
            <SliderHead>
              <span>Temperature</span>
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
            Advanced {advancedOpen ? '▾' : '▸'} · top-p, max output, reasoning, schema
          </AdvancedToggle>
          {advancedOpen && (
            <>
              <SliderRow>
                <SliderHead>
                  <span>Top-p</span>
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
                  <span>Max output tokens</span>
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
                  <span>Reasoning effort</span>
                </SliderHead>
                {canAuthor ? (
                  <Segmented
                    options={[
                      { value: 'minimal', label: 'Minimal' },
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                    ]}
                    value={params.reasoning_effort ?? 'medium'}
                    onChange={(value) => setParams((prev) => ({ ...prev, reasoning_effort: value as ReasoningEffort }))}
                    size="sm"
                    ariaLabel="Reasoning effort"
                  />
                ) : (
                  <SliderValue>{params.reasoning_effort ?? 'default'}</SliderValue>
                )}
              </SliderRow>
              <SliderRow>
                <SliderHead>
                  <span>Output schema (JSON object)</span>
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
        </ParamGrid>
      </div>

      {heldMessages.map((message) => (
        <Whisper key={message} $tone="red" role="alert">
          {message} Autosave held — fix it and saving resumes on its own.
        </Whisper>
      ))}

      <div data-credentials-panel>
        <SectionLabel>CREDENTIALS · FINGERPRINTS ONLY</SectionLabel>
        <div style={{ marginTop: 6 }}>
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
