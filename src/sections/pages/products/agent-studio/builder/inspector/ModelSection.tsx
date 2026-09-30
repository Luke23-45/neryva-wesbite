/**
 * Model section — redesigned from the supplied SVG ("Model — selection,
 * per-model configuration, defaults, credentials").
 *
 * Four groups on the SectionPage shell:
 *   PIPELINE    — serving order with expandable per-model rows (credential,
 *                 version pin, param overrides), fallback policy, and the
 *                 availability helper.
 *   CATALOG     — provider-grouped model picker (search, capability chips,
 *                 per-1M pricing, subscription-locked rows).
 *   DEFAULTS    — generation defaults (temperature, advanced params) plus the
 *                 response format (Text / JSON / Schema) with the JSON schema
 *                 edited in the shared focused BlockEditor (never a raw
 *                 textarea — 19-12).
 *   CREDENTIALS — the vault panel plus per-model credential requirements.
 *
 * Save machine (preserved from the pre-redesign section): 8s debounced
 * autosave + unmount flush + manual save signal + 409 adopt + 412 dialog,
 * full-payload writes, dirty via JSON compare. Blocker validation is
 * local-state-driven so fixing a blocker (e.g. picking a credential)
 * unblocks the save it was holding.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { ChevronDown } from 'lucide-react';
import { TextInput } from '@components/common/ui/TextInput';
import { Switch } from '@components/common/ui/Switch';
import { Segmented } from '@components/common/ui/Segmented';
import { ApiError } from '@lib/engine/client';
import { useCanSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useModelAvailability, useModelCosts } from '@hooks/studio/useSetupModels';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import { useProviderCredentials } from '@hooks/studio/useSetupProviders';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import type { ModelPipelineEntry } from '@lib/engine/agent-payload';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import { ENGINE_RANGES, validateOutputSchema, type ReasoningEffort } from '../lib/brain-model';
import { BlockEditor } from '../section-ui/BlockEditor';
import type { EditableBlock } from '../section-ui/types';
import { MicroTip, PageOutline, SectionGroup, SectionPage } from '../section-ui/SectionPage';
import { SkeletonRows } from './SkeletonRows';
import { ConflictDialog } from './ConflictDialog';
import { CredentialsPanel } from './CredentialsPanel';
import { ModelPicker } from './ModelPicker';
import {
  AddModelButton,
  BlockerPill,
  CredBadge,
  DefaultsGrid,
  EmptyPipeline,
  FormatHelp,
  HeldBox,
  HeldItem,
  HelperText,
  ModelIcon,
  OverrideGrid,
  OverrideToggle,
  ParamLabel,
  PipelineCard,
  PipelineHeader,
  PipelineRowActions,
  PipelineRowHead,
  PipelineRowMeta,
  PipelineRowShell,
  PipelineRowTitle,
  RangeEnds,
  RangeInput,
  ReadinessCard,
  ReadinessItem,
  ReadinessLabel,
  ReadinessMeta,
  RowButton,
  SchemaActions,
  SchemaBadge,
  SchemaCard,
  SchemaNameRow,
  SchemaPreview,
  SelectWrap,
  ServingOrderLabel,
  SliderHead,
  SliderName,
  SliderRow,
  SliderValue,
  VersionInput,
} from './ModelSection.styles';

type ResponseFormat = 'text' | 'json' | 'schema';

/** Generation defaults (the global layer — pipeline entries override per model). */
interface DefaultsDraft {
  temperature?: number;
  max_output_tokens?: number;
  top_p?: number;
  reasoning_effort?: ReasoningEffort;
  output_schema?: string;
  response_format?: ResponseFormat;
  output_schema_name?: string;
}

const EFFORT_OPTIONS: { value: ReasoningEffort; label: string }[] = [
  { value: 'minimal', label: 'Minimal' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const RESPONSE_FORMAT_OPTIONS: { value: ResponseFormat; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'json', label: 'JSON' },
  { value: 'schema', label: 'Schema' },
];

const RESPONSE_FORMAT_HELP: Record<ResponseFormat, string> = {
  text: 'Freeform text — no format constraints.',
  json: 'Provider JSON mode — valid JSON, no schema enforced.',
  schema: 'A JSON schema every response must validate against.',
};

/**
 * Reconcile the wire pipeline against the derived allowed_models. Garbage
 * resolves to absent (never a guess); unknown refs reconcile out; order
 * follows the pipeline, then any allowed_models entries it missed.
 */
function readPipeline(definition: AgentDefinition | null): ModelPipelineEntry[] {
  if (!definition) return [];
  const allowed = definition.model_policy.allowed_models;
  const wire = definition.model_policy.pipeline ?? [];
  const seen = new Set<string>();
  const entries: ModelPipelineEntry[] = [];
  for (const entry of wire) {
    if (!allowed.includes(entry.ref) || seen.has(entry.ref)) continue;
    seen.add(entry.ref);
    entries.push({ ...entry });
  }
  for (const ref of allowed) {
    if (seen.has(ref)) continue;
    seen.add(ref);
    entries.push({ ref });
  }
  return entries;
}

function readDefaults(definition: AgentDefinition | null): DefaultsDraft {
  if (!definition) return {};
  const params = definition.model_params;
  return {
    ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
    ...(params.max_output_tokens !== undefined ? { max_output_tokens: params.max_output_tokens } : {}),
    ...(params.top_p !== undefined ? { top_p: params.top_p } : {}),
    ...(params.reasoning_effort !== undefined ? { reasoning_effort: params.reasoning_effort } : {}),
    ...(params.output_schema !== undefined ? { output_schema: params.output_schema } : {}),
    ...(params.response_format !== undefined ? { response_format: params.response_format } : {}),
    ...(params.output_schema_name !== undefined ? { output_schema_name: params.output_schema_name } : {}),
  };
}

/**
 * Canonical entry shape for state — blank version pins and credential ids
 * are omitted (absent = latest / unselected) and an all-empty params object
 * collapses to undefined, so dirty-compare converges with the wire.
 */
function normalizeEntry(entry: ModelPipelineEntry): ModelPipelineEntry {
  const params = entry.params;
  const hasParams =
    params !== undefined &&
    (params.temperature !== undefined ||
      params.max_output_tokens !== undefined ||
      params.top_p !== undefined ||
      params.reasoning_effort !== undefined ||
      (params.output_schema ?? '').trim() !== '');
  return {
    ref: entry.ref,
    ...(entry.credential_id ? { credential_id: entry.credential_id } : {}),
    ...(entry.version_pin && entry.version_pin.trim() !== '' ? { version_pin: entry.version_pin.trim() } : {}),
    ...(hasParams && params ? { params } : {}),
  };
}

function hasOverride(params: ModelPipelineEntry['params']): boolean {
  if (!params) return false;
  return (
    params.temperature !== undefined ||
    params.max_output_tokens !== undefined ||
    params.top_p !== undefined ||
    params.reasoning_effort !== undefined
  );
}

function fmtCtx(tokens: number | null | undefined): string | null {
  if (tokens === null || tokens === undefined) return null;
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K ctx`;
  return `${tokens} ctx`;
}

function pricePerM(micros: number | null | undefined): string {
  if (micros === null || micros === undefined) return 'unpriced';
  return `$${(micros / 1000).toFixed(2)}/1M`;
}

function providerLabel(provider: string): string {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

interface ModelSectionProps {
  assistantId: string;
  definition: AgentDefinition | null;
  versionId: string | null;
  versionHash: string | null;
  isDraft: boolean;
  canAuthor: boolean;
  onDirtyChange: (dirty: boolean) => void;
  saveSignal: number;
}

export function ModelSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
  saveSignal,
}: ModelSectionProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canSetup = useCanSetup();
  const canGovern = canSetup('setup:govern');
  const { role } = useOrg();
  const canReadCredentials = role === 'owner' || role === 'admin' || role === 'developer';

  const availability = useModelAvailability();
  const costs = useModelCosts();

  // ---- Data state (the save machine owns this) ----
  const [pipeline, setPipeline] = useState<ModelPipelineEntry[]>(() => readPipeline(definition));
  const [fallback, setFallback] = useState(() => definition?.model_policy.fallback_enabled ?? false);
  const [defaults, setDefaults] = useState<DefaultsDraft>(() => readDefaults(definition));

  // ---- UI-only state ----
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [overrideOpen, setOverrideOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const entry of readPipeline(definition)) if (hasOverride(entry.params)) init[entry.ref] = true;
    return init;
  });
  const [pinCustom, setPinCustom] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const entry of readPipeline(definition)) {
      if (entry.version_pin && entry.version_pin.trim() !== '') init[entry.ref] = true;
    }
    return init;
  });
  const [connectProvider, setConnectProvider] = useState<string | null>(null);
  const [revokeCredentialId, setRevokeCredentialId] = useState<string | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [conflict, setConflict] = useState<{
    expectedHash: string;
    currentHash: string | null;
    attempted: string;
    attemptedDef: AgentDefinition;
  } | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const [docKey, setDocKey] = useState<string | null>(null);

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);
  const credentials = useProviderCredentials();
  const sendHashRef = useRef('');

  const source = useMemo(
    () => ({
      pipeline: definition ? readPipeline(definition) : [],
      fallback: definition?.model_policy.fallback_enabled ?? false,
      defaults: definition ? readDefaults(definition) : {},
    }),
    [definition],
  );
  const sourceKey = useMemo(() => JSON.stringify(source), [source]);
  const current = useMemo(() => JSON.stringify({ pipeline, fallback, defaults }), [pipeline, fallback, defaults]);
  const dirty = current !== JSON.stringify(source);

  // Adopt server slices whenever clean (save echo, 409-adopt, reload-theirs).
  if (docKey !== sourceKey && !dirty) {
    setDocKey(sourceKey);
    setPipeline(source.pipeline);
    setFallback(source.fallback);
    setDefaults(source.defaults);
  } else if (docKey !== sourceKey) {
    setDocKey(sourceKey);
  }

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  // ---- Derived: catalog + credentials ----
  const catalogRows = availability.data;
  const catalogCosts = costs.data;
  const catalogByRef = useMemo(() => {
    const map = new Map<string, NonNullable<typeof catalogRows>[number]>();
    for (const row of catalogRows ?? []) map.set(row.ref, row);
    return map;
  }, [catalogRows]);
  const costsByRef = useMemo(() => {
    const map = new Map<string, NonNullable<typeof catalogCosts>[number]>();
    for (const cost of catalogCosts ?? []) map.set(cost.ref, cost);
    return map;
  }, [catalogCosts]);

  const credRows = useMemo(() => credentials.data ?? [], [credentials.data]);
  const liveCreds = useMemo(
    () => credRows.filter((c) => !c.revokedAt && c.status !== 'revoked'),
    [credRows],
  );
  const liveCredsByProvider = useMemo(() => {
    const map = new Map<string, typeof liveCreds>();
    for (const cred of liveCreds) {
      const list = map.get(cred.provider) ?? [];
      list.push(cred);
      map.set(cred.provider, list);
    }
    return map;
  }, [liveCreds]);

  // ---- Blocker validation (local-state-driven) ----
  // Credential gate: a pipeline entry the catalog confirms unusable for a
  // missing credential, with no live credential selected for its provider,
  // holds the save. Unknown catalog (still loading / fetch failed) is unknown,
  // never known-bad — no blocker.
  const credBlockers = useMemo(() => {
    if (catalogRows === undefined) return [];
    const out: { ref: string; provider: string; displayName: string }[] = [];
    for (const entry of pipeline) {
      if (entry.credential_id) continue;
      const row = catalogByRef.get(entry.ref);
      if (!row || row.usable) continue;
      if (!row.reasons.includes('provider_credential_missing')) continue;
      const providerCreds = liveCredsByProvider.get(row.provider) ?? [];
      if (providerCreds.length === 0) {
        out.push({ ref: entry.ref, provider: row.provider, displayName: row.displayName });
      }
    }
    return out;
  }, [pipeline, catalogRows, catalogByRef, liveCredsByProvider]);

  // Local param gates (caps doesn't cover temperature/top_p/schema).
  // NaN counts as invalid everywhere (typed garbage must hold, never ship).
  const paramIssues = useMemo(() => {
    const messages: string[] = [];
    const checkRange = (
      value: number | undefined,
      label: string,
      valid: (v: number) => boolean,
      message: string,
    ) => {
      if (value !== undefined && (!Number.isFinite(value) || !valid(value))) messages.push(`${label}${message}`);
    };
    checkRange(defaults.temperature, '', (v) => v >= 0 && v <= 2, 'Temperature must be 0–2.');
    checkRange(defaults.top_p, '', (v) => v > 0 && v <= 1, 'Top-p must be above 0 and at most 1.');
    for (const entry of pipeline) {
      const ep = entry.params;
      if (!ep) continue;
      const name = catalogByRef.get(entry.ref)?.displayName ?? entry.ref;
      checkRange(ep.temperature, `${name}: `, (v) => v >= 0 && v <= 2, 'temperature must be 0–2.');
      checkRange(ep.top_p, `${name}: `, (v) => v > 0 && v <= 1, 'top-p must be above 0 and at most 1.');
    }
    if (defaults.output_schema !== undefined) {
      const check = validateOutputSchema(defaults.output_schema);
      if (!check.ok) messages.push(check.message);
    }
    if (defaults.response_format === 'schema' && (defaults.output_schema ?? '').trim() === '') {
      messages.push('Response format is Schema — add a valid JSON schema.');
    }
    return messages;
  }, [defaults, pipeline, catalogByRef]);

  const buildNext = useCallback((): AgentDefinition | null => {
    if (!definition) return null;
    return buildDraftPayload(definition, {
      model_policy: {
        allowed_models: pipeline.map((entry) => entry.ref),
        fallback_enabled: fallback,
        pipeline: pipeline.map(normalizeEntry),
      },
      model_params: {
        ...(defaults.temperature !== undefined ? { temperature: defaults.temperature } : {}),
        ...(defaults.max_output_tokens !== undefined ? { max_output_tokens: defaults.max_output_tokens } : {}),
        ...(defaults.top_p !== undefined ? { top_p: defaults.top_p } : {}),
        ...(defaults.reasoning_effort !== undefined ? { reasoning_effort: defaults.reasoning_effort } : {}),
        ...(defaults.output_schema !== undefined ? { output_schema: defaults.output_schema } : {}),
        ...(defaults.response_format !== undefined ? { response_format: defaults.response_format } : {}),
        ...(defaults.output_schema_name !== undefined ? { output_schema_name: defaults.output_schema_name } : {}),
      },
    });
  }, [definition, pipeline, fallback, defaults]);

  const capsIssues = useMemo(() => {
    const next = buildNext();
    if (!next) return [];
    return checkDefinitionCaps(next).filter(
      (issue) =>
        issue.path.startsWith('model_policy') || issue.path.startsWith('model_params') || issue.path === 'secrets',
    );
  }, [buildNext]);

  const heldMessages = useMemo(
    () => [
      ...credBlockers.map(
        (b) => `No ${providerLabel(b.provider)} credential in vault — required by ${b.displayName}.`,
      ),
      ...paramIssues,
      ...capsIssues.map((issue) => issue.message),
    ],
    [credBlockers, paramIssues, capsIssues],
  );
  const blocked = heldMessages.length > 0;
  const pending = saveDraft.isPending || updateDraft.isPending;

  // Convergence is measured in POLICY shape (what the dialog hands back), not
  // local shape — comparing across shapes would park autosave forever.
  const sourcePolicyJson = useMemo(
    () => (definition ? JSON.stringify({ model_policy: definition.model_policy, model_params: definition.model_params }) : null),
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

  // ---- Pipeline mutations ----
  const patchEntry = useCallback((ref: string, patch: Partial<ModelPipelineEntry>) => {
    setPipeline((prev) => prev.map((entry) => (entry.ref === ref ? normalizeEntry({ ...entry, ...patch }) : entry)));
  }, []);

  const patchEntryParams = useCallback(
    (ref: string, patch: Partial<NonNullable<ModelPipelineEntry['params']>> | null) => {
      setPipeline((prev) =>
        prev.map((entry) => {
          if (entry.ref !== ref) return entry;
          if (patch === null) return normalizeEntry({ ...entry, params: undefined });
          const merged = { ...(entry.params ?? {}), ...patch };
          // Clearing a value back to undefined removes the key (no phantom writes).
          for (const key of Object.keys(merged) as (keyof typeof merged)[]) {
            if (merged[key] === undefined) delete merged[key];
          }
          return normalizeEntry({ ...entry, params: merged });
        }),
      );
    },
    [],
  );

  const addModel = useCallback(
    (ref: string) => {
      setPipeline((prev) => (prev.some((entry) => entry.ref === ref) ? prev : [...prev, normalizeEntry({ ref })]));
      setExpanded((prev) => ({ ...prev, [ref]: true }));
    },
    [],
  );

  const removeModel = useCallback((ref: string) => {
    setPipeline((prev) => prev.filter((entry) => entry.ref !== ref));
  }, []);

  const moveModel = useCallback((ref: string, direction: -1 | 1) => {
    setPipeline((prev) => {
      const index = prev.findIndex((entry) => entry.ref === ref);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [entry] = next.splice(index, 1);
      next.splice(target, 0, entry);
      return next;
    });
  }, []);

  const resetDefaults = useCallback(() => {
    setDefaults({});
  }, []);

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

  const scrollToGroup = useCallback((key: string) => {
    document.getElementById(`model-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Escape blurs number inputs so a half-typed value commits instead of
  // lingering in the field while autosave fires.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.activeElement instanceof HTMLInputElement) {
        document.activeElement.blur();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // ---- Output schema focused-editor session (19-12: never a raw textarea) ----
  const [schemaEdit, setSchemaEdit] = useState<{
    target: EditableBlock;
    apply: (saved: { block: { mode: string; content: string } }) => void;
  } | null>(null);

  const openSchemaEditor = useCallback(() => {
    setSchemaEdit({
      target: {
        key: 'model:output-schema',
        sectionLabel: 'Model',
        title: 'Output schema',
        jsonKind: 'any',
        block: { mode: 'json', content: defaults.output_schema ?? '' },
        placeholder: '{"type": "object", "properties": { … }}',
        cap: ENGINE_RANGES.outputSchemaMax,
      },
      apply: (saved) => {
        const text = saved.block.content;
        setDefaults((prev) =>
          text.trim() === '' ? { ...prev, output_schema: undefined } : { ...prev, output_schema: text },
        );
      },
    });
  }, [defaults.output_schema]);

  const [advancedOpen, setAdvancedOpen] = useState(false);

  if (!definition) {
    return (
      <SectionPage title="Model" subtitle="Choose which models serve this agent, in order — and give each one what it needs.">
        <SkeletonRows rows={4} />
      </SectionPage>
    );
  }

  // The focused editor replaces the page in place — no modal, no route change.
  if (schemaEdit) {
    return (
      <BlockEditor
        key={schemaEdit.target.key}
        target={schemaEdit.target}
        onDraft={schemaEdit.apply}
        onSave={schemaEdit.apply}
        onClose={() => setSchemaEdit(null)}
      />
    );
  }

  // ---- Rail: outline + readiness ----
  const responseFormat: ResponseFormat = defaults.response_format ?? 'text';
  const schemaCheck = defaults.output_schema !== undefined ? validateOutputSchema(defaults.output_schema) : null;

  const outlineItems = [
    {
      key: 'pipeline',
      label: 'Pipeline',
      meta: pipeline.length === 0 ? 'Empty' : `${pipeline.length} model${pipeline.length === 1 ? '' : 's'}`,
      done: pipeline.length > 0,
    },
    {
      key: 'catalog',
      label: 'Catalog',
      meta: catalogRows === undefined ? 'Loading…' : `${catalogRows.length} models`,
      done: catalogRows !== undefined,
    },
    {
      key: 'defaults',
      label: 'Defaults',
      meta: RESPONSE_FORMAT_OPTIONS.find((o) => o.value === responseFormat)?.label ?? 'Text',
      done: paramIssues.length === 0,
    },
    {
      key: 'credentials',
      label: 'Credentials',
      meta: `${liveCreds.length} connected`,
      done: credBlockers.length === 0,
    },
  ];

  const primaryName = pipeline.length > 0 ? (catalogByRef.get(pipeline[0].ref)?.displayName ?? pipeline[0].ref) : null;
  const readinessItems = [
    {
      label: 'Primary model picked',
      done: pipeline.length > 0,
      meta: primaryName ?? 'No model yet — add one from the catalog.',
    },
    {
      label: 'Credential for every model',
      done: credBlockers.length === 0,
      meta:
        credBlockers.length > 0
          ? `${credBlockers.length} model${credBlockers.length === 1 ? '' : 's'} missing a credential`
          : pipeline.length === 0
            ? 'No models yet'
            : 'All connected',
      fix: credBlockers.length > 0 ? () => scrollToGroup('pipeline') : undefined,
    },
    {
      label: 'Parameters within limits',
      done: paramIssues.length === 0,
      meta: paramIssues.length > 0 ? `${paramIssues.length} issue${paramIssues.length === 1 ? '' : 's'} to fix` : 'Within limits',
    },
    {
      label: 'Fallback policy set',
      done: true,
      meta:
        pipeline.length < 2
          ? 'Single model — fallback not needed'
          : fallback
            ? 'On — the next model serves on failure'
            : 'Off — the first model serves alone',
    },
  ];

  const pinnedProviders = [...new Set(pipeline.map((entry) => entry.ref.split('/')[0] ?? entry.ref))];
  const credBlockedRefs = new Set(credBlockers.map((b) => b.ref));

  const toggleModel = (ref: string) => {
    if (pipeline.some((entry) => entry.ref === ref)) removeModel(ref);
    else addModel(ref);
  };

  return (
    <SectionPage
      title="Model"
      subtitle="Which models serve this agent, in what order — and the credentials that unlock them."
      pill={blocked ? <BlockerPill>{heldMessages.length} blocker{heldMessages.length === 1 ? '' : 's'}</BlockerPill> : undefined}
      rail={
        <>
          <PageOutline items={outlineItems} onSelect={scrollToGroup} />
          <ReadinessCard>
            <ReadinessLabel>Readiness</ReadinessLabel>
            {readinessItems.map((item) => (
              <ReadinessItem key={item.label} $done={item.done}>
                <span aria-hidden="true">{item.done ? '✓' : '○'}</span>
                <div>
                  <div>{item.label}</div>
                  <ReadinessMeta>{item.meta}</ReadinessMeta>
                </div>
                {item.fix && canAuthor && (
                  <button type="button" onClick={item.fix}>
                    Fix
                  </button>
                )}
              </ReadinessItem>
            ))}
            {blocked && (
              <HeldBox role="alert">
                <strong>
                  Saving is held while {heldMessages.length} blocker{heldMessages.length === 1 ? '' : 's'} remain…
                </strong>
                {heldMessages.map((message) => (
                  <HeldItem key={message}>{message}</HeldItem>
                ))}
              </HeldBox>
            )}
          </ReadinessCard>
          <MicroTip title="Serving order">
            The first model serves every request. Fallback only covers availability — a weaker model never silently
            substitutes quality.
          </MicroTip>
        </>
      }
    >
      {/* ---- PIPELINE ---- */}
      <div id="model-pipeline">
        <SectionGroup
          title="Pipeline"
          description="The models that serve this agent, in order. Configure each one below."
        >
          <PipelineCard>
            <PipelineHeader>
              <ServingOrderLabel>Serving order</ServingOrderLabel>
              {canAuthor && (
                <Switch label="Fallback" checked={fallback} onChange={setFallback} id="model-fallback-switch" />
              )}
            </PipelineHeader>
            {pipeline.length === 0 ? (
              <EmptyPipeline>
                No models yet — add one from the catalog below. The first model you add becomes the primary.
              </EmptyPipeline>
            ) : (
              pipeline.map((entry, index) => (
                <PipelineRow
                  key={entry.ref}
                  entry={entry}
                  index={index}
                  total={pipeline.length}
                  row={catalogByRef.get(entry.ref)}
                  cost={costsByRef.get(entry.ref)}
                  providerCreds={liveCredsByProvider.get(entry.ref.split('/')[0] ?? '') ?? []}
                  credBlocked={credBlockedRefs.has(entry.ref)}
                  expanded={expanded[entry.ref] ?? false}
                  onToggleExpand={() => setExpanded((prev) => ({ ...prev, [entry.ref]: !(prev[entry.ref] ?? false) }))}
                  overrideOpen={overrideOpen[entry.ref] ?? false}
                  onToggleOverride={() => setOverrideOpen((prev) => ({ ...prev, [entry.ref]: !(prev[entry.ref] ?? false) }))}
                  pinCustom={pinCustom[entry.ref] ?? false}
                  onPinCustomChange={(custom) => setPinCustom((prev) => ({ ...prev, [entry.ref]: custom }))}
                  canAuthor={canAuthor}
                  onMoveUp={() => moveModel(entry.ref, -1)}
                  onMoveDown={() => moveModel(entry.ref, 1)}
                  onRemove={() => removeModel(entry.ref)}
                  onPatchEntry={(patch) => patchEntry(entry.ref, patch)}
                  onPatchParams={(patch) => patchEntryParams(entry.ref, patch)}
                  onConnect={() => onFixRequest('connect', entry.ref)}
                />
              ))
            )}
            {canAuthor && (
              <AddModelButton type="button" onClick={() => scrollToGroup('catalog')}>
                + Add model from catalog
              </AddModelButton>
            )}
            <HelperText>
              Fallback serves availability, not difficulty — a weaker model never silently substitutes quality.
            </HelperText>
          </PipelineCard>
        </SectionGroup>
      </div>

      {/* ---- CATALOG ---- */}
      <div id="model-catalog">
        <SectionGroup
          title="Catalog"
          description="Every model your organization can use. Locked rows name the subscription they need."
        >
          <ModelPicker
            rows={catalogRows}
            loadError={availability.isError}
            costsByRef={costsByRef}
            pipelineRefs={pipeline.map((entry) => entry.ref)}
            credBlockedRefs={credBlockedRefs}
            canAuthor={canAuthor}
            onToggle={toggleModel}
            onFixRequest={onFixRequest}
          />
        </SectionGroup>
      </div>

      {/* ---- DEFAULTS ---- */}
      <div id="model-defaults">
        <SectionGroup
          title="Defaults"
          description="Generation defaults for every run. Unset means the model default. Per-model overrides live in the pipeline above."
        >
          <DefaultsGrid>
            <SliderRow>
              <SliderHead>
                <SliderName>Temperature</SliderName>
                <SliderValue>{defaults.temperature ?? 'default'}</SliderValue>
              </SliderHead>
              {canAuthor && (
                <>
                  <RangeInput
                    type="range"
                    min={ENGINE_RANGES.temperature.min}
                    max={ENGINE_RANGES.temperature.max}
                    step={ENGINE_RANGES.temperature.step}
                    value={defaults.temperature ?? 1}
                    aria-label="Temperature"
                    onChange={(event) =>
                      setDefaults((prev) => ({ ...prev, temperature: Number(event.target.value) }))
                    }
                  />
                  <RangeEnds>
                    <span>{ENGINE_RANGES.temperature.min}</span>
                    <span>{ENGINE_RANGES.temperature.max}</span>
                  </RangeEnds>
                </>
              )}
            </SliderRow>

            <button
              type="button"
              onClick={() => setAdvancedOpen((o) => !o)}
              aria-expanded={advancedOpen}
              aria-controls="model-advanced-params"
            >
              Advanced
              <ChevronDown size={15} strokeWidth={2} aria-hidden="true" />
              <span>· top-p, max output, reasoning</span>
            </button>
            {advancedOpen && (
              <div id="model-advanced-params">
                <SliderRow>
                  <SliderHead>
                    <SliderName>Top-p</SliderName>
                    <SliderValue>{defaults.top_p ?? 'default'}</SliderValue>
                  </SliderHead>
                  {canAuthor && (
                    <TextInput
                      aria-label="Top-p (above 0, at most 1)"
                      inputMode="decimal"
                      value={defaults.top_p ?? ''}
                      onChange={(event) => {
                        const raw = event.target.value.trim();
                        setDefaults((prev) =>
                          raw === '' ? { ...prev, top_p: undefined } : { ...prev, top_p: Number(raw) },
                        );
                      }}
                      placeholder="e.g. 0.95"
                    />
                  )}
                </SliderRow>
                <SliderRow>
                  <SliderHead>
                    <SliderName>Max output tokens</SliderName>
                    <SliderValue>{defaults.max_output_tokens?.toLocaleString() ?? 'default'}</SliderValue>
                  </SliderHead>
                  {canAuthor && (
                    <TextInput
                      aria-label="Max output tokens (1–200000)"
                      inputMode="numeric"
                      value={defaults.max_output_tokens ?? ''}
                      onChange={(event) => {
                        const raw = event.target.value.trim();
                        setDefaults((prev) =>
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
                        { value: 'default', label: 'Default' },
                        ...EFFORT_OPTIONS,
                      ]}
                      value={defaults.reasoning_effort ?? 'default'}
                      onChange={(value) =>
                        setDefaults((prev) =>
                          value === 'default'
                            ? { ...prev, reasoning_effort: undefined }
                            : { ...prev, reasoning_effort: value as ReasoningEffort },
                        )
                      }
                      size="sm"
                      ariaLabel="Reasoning effort"
                    />
                  ) : (
                    <SliderValue>{defaults.reasoning_effort ?? 'default'}</SliderValue>
                  )}
                </SliderRow>
              </div>
            )}

            <SliderRow>
              <SliderHead>
                <SliderName>Response format</SliderName>
              </SliderHead>
              {canAuthor ? (
                <Segmented
                  options={RESPONSE_FORMAT_OPTIONS}
                  value={responseFormat}
                  onChange={(value) =>
                    setDefaults((prev) => ({ ...prev, response_format: value as ResponseFormat }))
                  }
                  size="sm"
                  ariaLabel="Response format"
                />
              ) : (
                <SliderValue>{RESPONSE_FORMAT_OPTIONS.find((o) => o.value === responseFormat)?.label}</SliderValue>
              )}
              <FormatHelp>{RESPONSE_FORMAT_HELP[responseFormat]}</FormatHelp>
            </SliderRow>

            {responseFormat === 'schema' && (
              <SchemaCard>
                <SchemaNameRow>
                  <ParamLabel htmlFor="model-schema-name">Schema name</ParamLabel>
                  {canAuthor ? (
                    <TextInput
                      id="model-schema-name"
                      value={defaults.output_schema_name ?? ''}
                      onChange={(event) => {
                        const raw = event.target.value;
                        setDefaults((prev) =>
                          raw.trim() === '' ? { ...prev, output_schema_name: undefined } : { ...prev, output_schema_name: raw },
                        );
                      }}
                      placeholder="e.g. ExtractionResult"
                    />
                  ) : (
                    <SliderValue>{defaults.output_schema_name ?? '—'}</SliderValue>
                  )}
                </SchemaNameRow>
                <ParamLabel>Output schema</ParamLabel>
                {defaults.output_schema ? (
                  <SchemaPreview>{defaults.output_schema.slice(0, 480)}{defaults.output_schema.length > 480 ? '…' : ''}</SchemaPreview>
                ) : (
                  <HelperText>No schema yet — responses won't be validated.</HelperText>
                )}
                <SchemaActions>
                  {schemaCheck?.ok && <SchemaBadge $tone="green">Validated</SchemaBadge>}
                  {schemaCheck && !schemaCheck.ok && <SchemaBadge $tone="red">Invalid</SchemaBadge>}
                  {canAuthor && (
                    <button type="button" onClick={openSchemaEditor}>
                      {defaults.output_schema ? 'Replace' : 'Add schema'}
                    </button>
                  )}
                </SchemaActions>
              </SchemaCard>
            )}

            {canAuthor && (
              <button type="button" onClick={resetDefaults}>
                Reset all
              </button>
            )}
          </DefaultsGrid>
        </SectionGroup>
      </div>

      {/* ---- CREDENTIALS ---- */}
      <div id="model-credentials" data-credentials-panel>
        <SectionGroup
          title="Credentials"
          description="Provider credentials in the vault. Fingerprints only — secrets never leave the vault."
        >
          {credBlockers.length > 0 && (
            <HelperText>
              Required by {credBlockers.map((b) => b.displayName).join(', ')} — connect {credBlockers.length === 1 ? 'a credential' : 'credentials'} below to unblock saving.
            </HelperText>
          )}
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
        </SectionGroup>
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
                model_policy?: { allowed_models?: unknown; fallback_enabled?: unknown; pipeline?: unknown };
                model_params?: Record<string, unknown>;
              };
              const mp = parsed.model_policy;
              const fakeDef = {
                model_policy: {
                  allowed_models: Array.isArray(mp?.allowed_models)
                    ? mp.allowed_models.filter((r): r is string => typeof r === 'string')
                    : [],
                  fallback_enabled: mp?.fallback_enabled === true,
                  ...(Array.isArray(mp?.pipeline) ? { pipeline: mp.pipeline as ModelPipelineEntry[] } : {}),
                },
                model_params: (parsed.model_params ?? {}) as AgentDefinition['model_params'],
              } as AgentDefinition;
              setPipeline(readPipeline(fakeDef));
              if (mp && typeof mp.fallback_enabled === 'boolean') setFallback(mp.fallback_enabled);
              setDefaults(readDefaults(fakeDef));
            } catch {
              // Unparseable theirs: leave local state, still refetch below —
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
    </SectionPage>
  );
}

interface PipelineRowProps {
  entry: ModelPipelineEntry;
  index: number;
  total: number;
  row: { provider: string; modelId: string; displayName: string; contextWindowTokens: number | null; capabilities: Record<string, unknown>; usable: boolean } | undefined;
  cost: { costMicrosPer1kInput: number | null; costMicrosPer1kOutput: number | null } | undefined;
  providerCreds: { id: string; label: string; secretFingerprint: string }[];
  credBlocked: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  overrideOpen: boolean;
  onToggleOverride: () => void;
  pinCustom: boolean;
  onPinCustomChange: (custom: boolean) => void;
  canAuthor: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onPatchEntry: (patch: Partial<ModelPipelineEntry>) => void;
  onPatchParams: (patch: Partial<NonNullable<ModelPipelineEntry['params']>> | null) => void;
  onConnect: () => void;
}

function PipelineRow({
  entry,
  index,
  total,
  row,
  cost,
  providerCreds,
  credBlocked,
  expanded,
  onToggleExpand,
  overrideOpen,
  onToggleOverride,
  pinCustom,
  onPinCustomChange,
  canAuthor,
  onMoveUp,
  onMoveDown,
  onRemove,
  onPatchEntry,
  onPatchParams,
  onConnect,
}: PipelineRowProps) {
  const provider = entry.ref.split('/')[0] ?? entry.ref;
  const displayName = row?.displayName ?? entry.ref;
  const ctx = fmtCtx(row?.contextWindowTokens);
  const caps = row ? Object.entries(row.capabilities).filter(([, v]) => !!v).map(([k]) => k) : [];
  const capLabels = caps
    .map((c) => (c === 'vision' ? 'Vision' : c === 'tools' ? 'Tools' : c === 'reasoning' ? 'Reasoning' : null))
    .filter((c): c is string => c !== null);

  const selectedCred = providerCreds.find((c) => c.id === entry.credential_id) ?? null;

  return (
    <PipelineRowShell>
      <PipelineRowHead>
        <button
          type="button"
          onClick={onToggleExpand}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${displayName} configuration`}
        >
          <ServingOrderLabel aria-hidden="true">{index + 1}</ServingOrderLabel>
          <ModelIcon aria-hidden="true">{displayName.charAt(0).toUpperCase()}</ModelIcon>
          <div>
            <PipelineRowTitle>{displayName}</PipelineRowTitle>
            <PipelineRowMeta>
              {providerLabel(provider)} · {row?.modelId ?? entry.ref}
              {ctx ? ` · ${ctx}` : ''}
              {capLabels.length > 0 ? ` · ${capLabels.join(' ')}` : ''}
            </PipelineRowMeta>
            <PipelineRowMeta>
              {pricePerM(cost?.costMicrosPer1kInput)} in · {pricePerM(cost?.costMicrosPer1kOutput)} out
            </PipelineRowMeta>
          </div>
          {credBlocked && <CredBadge $tone="red">Required</CredBadge>}
          {!credBlocked && entry.credential_id && selectedCred && <CredBadge $tone="green">Connected</CredBadge>}
          <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
        </button>
        {canAuthor && (
          <PipelineRowActions>
            <RowButton type="button" onClick={onMoveUp} disabled={index === 0} aria-label={`Move ${displayName} up`}>
              ↑
            </RowButton>
            <RowButton
              type="button"
              onClick={onMoveDown}
              disabled={index === total - 1}
              aria-label={`Move ${displayName} down`}
            >
              ↓
            </RowButton>
            <RowButton type="button" onClick={onRemove} aria-label={`Remove ${displayName}`}>
              ×
            </RowButton>
          </PipelineRowActions>
        )}
      </PipelineRowHead>

      {expanded && (
        <div>
          <div>
            <ParamLabel>
              Credential{credBlocked && <CredBadge $tone="red">Required</CredBadge>}
            </ParamLabel>
            {providerCreds.length > 0 ? (
              <SelectWrap>
                <select
                  value={entry.credential_id ?? ''}
                  onChange={(event) =>
                    onPatchEntry({ credential_id: event.target.value === '' ? undefined : event.target.value })
                  }
                  aria-label={`Credential for ${displayName}`}
                  disabled={!canAuthor}
                >
                  <option value="">Select credential…</option>
                  {providerCreds.map((cred) => (
                    <option key={cred.id} value={cred.id}>
                      {cred.label} ····{cred.secretFingerprint.slice(-4)}
                    </option>
                  ))}
                </select>
              </SelectWrap>
            ) : (
              <HelperText>
                {credBlocked ? (
                  <>
                    <CredBadge $tone="red">Required</CredBadge> Connect a {providerLabel(provider)} credential to
                    serve this model.{' '}
                  </>
                ) : (
                  <>No {providerLabel(provider)} credential in the vault.{' '}</>
                )}
                {canAuthor && (
                  <button type="button" onClick={onConnect}>
                    Connect {providerLabel(provider)}
                  </button>
                )}
              </HelperText>
            )}
          </div>

          <div>
            <ParamLabel>Version pin</ParamLabel>
            {canAuthor ? (
              <>
                <Segmented
                  options={[
                    { value: 'latest', label: 'Latest (recommended)' },
                    { value: 'custom', label: 'Custom' },
                  ]}
                  value={pinCustom ? 'custom' : 'latest'}
                  onChange={(value) => {
                    const custom = value === 'custom';
                    onPinCustomChange(custom);
                    if (!custom) onPatchEntry({ version_pin: undefined });
                  }}
                  size="sm"
                  ariaLabel={`Version pin for ${displayName}`}
                />
                {pinCustom && (
                  <VersionInput
                    value={entry.version_pin ?? ''}
                    onChange={(event) => onPatchEntry({ version_pin: event.target.value })}
                    placeholder="e.g. 2026-01-04"
                    aria-label={`Custom version for ${displayName}`}
                  />
                )}
              </>
            ) : (
              <PipelineRowMeta>{entry.version_pin ?? 'Latest (recommended)'}</PipelineRowMeta>
            )}
          </div>

          <OverrideToggle>
            {canAuthor ? (
              <Switch
                label="Override defaults for this model"
                checked={overrideOpen}
                onChange={(checked) => {
                  onToggleOverride();
                  if (!checked) onPatchParams(null);
                }}
                id={`model-override-${index}`}
              />
            ) : (
              <ParamLabel>Per-model overrides</ParamLabel>
            )}
          </OverrideToggle>
          {overrideOpen && (
            <OverrideGrid>
              <SliderRow>
                <SliderHead>
                  <SliderName>Temperature</SliderName>
                  <SliderValue>{entry.params?.temperature ?? 'default'}</SliderValue>
                </SliderHead>
                {canAuthor && (
                  <RangeInput
                    type="range"
                    min={ENGINE_RANGES.temperature.min}
                    max={ENGINE_RANGES.temperature.max}
                    step={ENGINE_RANGES.temperature.step}
                    value={entry.params?.temperature ?? 1}
                    aria-label={`${displayName} temperature override`}
                    onChange={(event) => onPatchParams({ temperature: Number(event.target.value) })}
                  />
                )}
              </SliderRow>
              <SliderRow>
                <SliderHead>
                  <SliderName>Top-p</SliderName>
                  <SliderValue>{entry.params?.top_p ?? 'default'}</SliderValue>
                </SliderHead>
                {canAuthor && (
                  <TextInput
                    aria-label={`${displayName} top-p override (above 0, at most 1)`}
                    inputMode="decimal"
                    value={entry.params?.top_p ?? ''}
                    onChange={(event) => {
                      const raw = event.target.value.trim();
                      onPatchParams({ top_p: raw === '' ? undefined : Number(raw) });
                    }}
                    placeholder="e.g. 0.95"
                  />
                )}
              </SliderRow>
              <SliderRow>
                <SliderHead>
                  <SliderName>Max output tokens</SliderName>
                  <SliderValue>{entry.params?.max_output_tokens?.toLocaleString() ?? 'default'}</SliderValue>
                </SliderHead>
                {canAuthor && (
                  <TextInput
                    aria-label={`${displayName} max output tokens override`}
                    inputMode="numeric"
                    value={entry.params?.max_output_tokens ?? ''}
                    onChange={(event) => {
                      const raw = event.target.value.trim();
                      onPatchParams({ max_output_tokens: raw === '' ? undefined : Number(raw) });
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
                    options={[{ value: 'default', label: 'Default' }, ...EFFORT_OPTIONS]}
                    value={entry.params?.reasoning_effort ?? 'default'}
                    onChange={(value) =>
                      onPatchParams({
                        reasoning_effort: value === 'default' ? undefined : (value as ReasoningEffort),
                      })
                    }
                    size="sm"
                    ariaLabel={`${displayName} reasoning effort override`}
                  />
                ) : (
                  <SliderValue>{entry.params?.reasoning_effort ?? 'default'}</SliderValue>
                )}
              </SliderRow>
            </OverrideGrid>
          )}
        </div>
      )}
    </PipelineRowShell>
  );
}
