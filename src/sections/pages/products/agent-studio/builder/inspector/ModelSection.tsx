/**
 * Model section — redesigned from the supplied SVG ("Model — selection,
 * per-model configuration, defaults, credentials").
 *
 * Four groups on the SectionPage shell:
 *   PIPELINE    — serving order with expandable per-model rows (credential
 *                 pin, version pin, param overrides), fallback policy, and the
 *                 availability helper.
 *   CATALOG     — supergroup-grouped model picker (Platform managed / BYOK,
 *                 search, capability chips, per-1M pricing, subscription-locked
 *                 rows) plus the tool-compatibility guard and blast-radius
 *                 preview.
 *   DEFAULTS    — generation defaults (temperature, advanced params) plus the
 *                 response format (Text / JSON / Schema) with the JSON schema
 *                 edited in the shared focused BlockEditor (never a raw
 *                 textarea — 19-12).
 *
 * Credential management lives on the Providers page
 * (/agent-studio/providers) — this section reads credential presence for the
 * availability gate and the pin picker, and links out for everything else
 * (doc 20 §3.5).
 *
 * Save machine (preserved from the pre-redesign section): 8s debounced
 * autosave + unmount flush + manual save signal + 409 adopt + 412 dialog,
 * full-payload writes, dirty via JSON compare. Blocker validation is
 * local-state-driven so fixing a blocker (e.g. picking a credential)
 * unblocks the save it was holding.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { ChevronDown } from 'lucide-react';
import { TextInput } from '@components/common/ui/TextInput';
import { Dropdown } from '@components/common/ui/Dropdown';
import { Switch } from '@components/common/ui/Switch';
import { Segmented } from '@components/common/ui/Segmented';
import { ApiError } from '@lib/engine/client';
import { useModelCosts } from '@hooks/studio/useSetupModels';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import { useProviderCredentials } from '@hooks/studio/useSetupProviders';
import { useEnterpriseStatus } from '@hooks/engine/billing';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import type { ModelPipelineEntry } from '@lib/engine/agent-payload';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import { useStringDraft } from '../lib/use-string-draft';
import { useSectionConfirmationContext } from '../lib/section-confirmation-context';
import { ENGINE_RANGES, formatStepValue, humanizeReason, roundToStep, validateOutputSchema, type ReasoningEffort } from '../lib/brain-model';
import { pipelineEntryKey } from '../lib/entry-key';
import { isDemoProvider } from '../lib/demo-model';
import { buildAgentBuildPath } from '../lib/slot-model';
import { useGroupedModels, type BuilderModelRow } from '../lib/useGroupedModels';
import { ToolCompatGuard } from '../../providers/components/ToolCompatGuard';
import { BlastRadiusConfirm, type BlastRadiusAffected } from '../../providers/components/BlastRadiusConfirm';
import { BlockEditor } from '../section-ui/BlockEditor';
import type { EditableBlock, ModalBlock } from '../section-ui/types';
import { MicroTip, PageOutline, SectionGroup, SectionPage } from '../section-ui/SectionPage';
import { SkeletonRows } from './SkeletonRows';
import { ConflictDialog } from './ConflictDialog';
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
  ServingOrderLabel,
  SliderHead,
  SliderName,
  SliderRow,
  SliderValue,
  SwitchLabelPair,
  SwitchLabelText,
  VersionInput,
} from './ModelSection.styles';

type ResponseFormat = 'text' | 'json' | 'schema';

/** Generation defaults (the global layer — pipeline entries override per model). */
interface DefaultsDraft {
  temperature?: number;
  max_output_tokens?: number;
  top_p?: number;
  reasoning_effort?: ReasoningEffort;
  /** PRV-073: explicit thinking budget, int 1..100000 (engine-validated). */
  reasoning_budget_tokens?: number;
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
 *
 * Entries are keyed by (ref, credential_id) — the same model may appear once
 * per source (platform pool + BYOK pins), so wire dedupe is by entry key
 * while the allowed_models backfill is by ref (one unpinned entry per ref).
 */
function readPipeline(definition: AgentDefinition | null): ModelPipelineEntry[] {
  if (!definition) return [];
  const allowed = definition.model_policy.allowed_models;
  const wire = definition.model_policy.pipeline ?? [];
  const seenKeys = new Set<string>();
  const seenRefs = new Set<string>();
  const entries: ModelPipelineEntry[] = [];
  for (const entry of wire) {
    const key = pipelineEntryKey(entry.ref, entry.credential_id);
    if (!allowed.includes(entry.ref) || seenKeys.has(key)) continue;
    seenKeys.add(key);
    seenRefs.add(entry.ref);
    entries.push({ ...entry });
  }
  for (const ref of allowed) {
    if (seenRefs.has(ref)) continue;
    seenRefs.add(ref);
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
    ...(typeof params.reasoning_budget_tokens === 'number' ? { reasoning_budget_tokens: params.reasoning_budget_tokens } : {}),
    ...(params.output_schema !== undefined ? { output_schema: params.output_schema } : {}),
    // 'text' is the default and reads as omitted on the wire — an explicit
    // 'text' (written by older saves) normalizes to unset here, so the
    // dirty compare converges from any wire state instead of phantoming
    // after a JSON→Text round trip.
    ...(params.response_format !== undefined && params.response_format !== 'text'
      ? { response_format: params.response_format }
      : {}),
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
      params.reasoning_budget_tokens !== undefined ||
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
    params.reasoning_effort !== undefined ||
    params.reasoning_budget_tokens !== undefined
  );
}

function fmtCtx(tokens: number | null | undefined): string | null {
  if (tokens === null || tokens === undefined) return null;
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}K ctx`;
  return `${tokens} ctx`;
}

/**
 * W18: USD/1M for one side, or null when the catalog reports no price.
 * Callers attach the in/out suffix only to a real price — the "not listed"
 * placeholder never composes with a suffix.
 */
function pricePerM(micros: number | null | undefined): string | null {
  if (micros === null || micros === undefined) return null;
  return `$${(micros / 1000).toFixed(2)}/1M`;
}

function providerLabel(provider: string): string {
  // D3: proper casing for known providers ("openai" → "OpenAI", not "Openai").
  const known: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    google: 'Google',
    mistral: 'Mistral',
    cohere: 'Cohere',
  };
  return known[provider.toLowerCase()] ?? provider.charAt(0).toUpperCase() + provider.slice(1);
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
  const queryClient = useQueryClient();

  // N-5 grouped models (Phase 6, doc 20 §3.1): the single serving-truth read
  // for the picker, pipeline rows, and the availability gate — supergroup +
  // credential identity, toggle-aware usability, probed-wins capabilities,
  // and pinned_by for the blast-radius preview. /models survives only as
  // context-window enrichment inside the hook (display-only).
  const grouped = useGroupedModels();
  const groupedRows = grouped.data;
  const rowByKey = grouped.rowByKey;
  const costs = useModelCosts();

  // ---- Data state (the save machine owns this) ----
  const [pipeline, setPipeline] = useState<ModelPipelineEntry[]>(() => readPipeline(definition));
  const [fallback, setFallback] = useState(() => definition?.model_policy.fallback_enabled ?? false);
  const [defaults, setDefaults] = useState<DefaultsDraft>(() => readDefaults(definition));

  // String-draft inputs (B3/B4/B5): numeric fields hold raw text while typing
  // and commit on blur/Enter, so intermediate states ("0.", "abc") never
  // corrupt the committed value and NaN can never enter state.
  const topPDraft = useStringDraft(
    defaults.top_p,
    (value) => setDefaults((prev) => ({ ...prev, top_p: value })),
  );
  const maxOutputDraft = useStringDraft(
    defaults.max_output_tokens,
    (value) => setDefaults((prev) => ({ ...prev, max_output_tokens: value })),
    { format: (v) => v.toLocaleString() },
  );
  // PRV-073: thinking budget — raw text while typing, commits an int on
  // blur/Enter; the paramIssues gate below holds out-of-range values.
  const budgetDraft = useStringDraft(
    defaults.reasoning_budget_tokens,
    (value) => setDefaults((prev) => ({ ...prev, reasoning_budget_tokens: value })),
    { format: (v) => v.toLocaleString() },
  );

  // ---- UI-only state (keys are pipeline entry keys: byok|<ref>|<id> / platform|<ref>|) ----
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [overrideOpen, setOverrideOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const entry of readPipeline(definition))
      if (hasOverride(entry.params)) init[pipelineEntryKey(entry.ref, entry.credential_id)] = true;
    return init;
  });
  const [pinCustom, setPinCustom] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const entry of readPipeline(definition)) {
      if (entry.version_pin && entry.version_pin.trim() !== '')
        init[pipelineEntryKey(entry.ref, entry.credential_id)] = true;
    }
    return init;
  });
  // PRV-076: pending tool-compat confirmation (warn, don't forbid).
  const [toolGuardPending, setToolGuardPending] = useState<{ ref: string; credentialId: string | null } | null>(null);
  // PRV-077: pending blast-radius confirmation for a pinned-by-live removal.
  const [blastPending, setBlastPending] = useState<{ key: string; affected: BlastRadiusAffected[] } | null>(null);
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
  // Enterprise gating for the connect affordances: non-enterprise orgs get
  // truthful "Neryva-managed credentials apply" copy instead of a dead link.
  const enterprise = useEnterpriseStatus();
  const isEnterprise = enterprise.data === true;
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

  // ---- Derived: grouped rows + costs + credentials ----
  const catalogCosts = costs.data;
  const costsByRef = useMemo(() => {
    const map = new Map<string, NonNullable<typeof catalogCosts>[number]>();
    for (const cost of catalogCosts ?? []) map.set(cost.ref, cost);
    return map;
  }, [catalogCosts]);

  // Pinned (enabled) tools in the draft — the real count feeds the
  // tool-compat guard (PRV-076). Zero hides every tool warning.
  const pinnedToolCount = useMemo(
    () => (definition?.tools ?? []).filter((t) => t.enabled).length,
    [definition],
  );

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
  // Credential gate: a pipeline entry the grouped read confirms unusable for
  // a missing credential, with no live credential for its provider, holds the
  // save. Unknown catalog (still loading / fetch failed) is unknown, never
  // known-bad — no blocker. Pinned entries name their credential, so the
  // missing-credential reason can only fire on unpinned (platform) entries.
  const credBlockers = useMemo(() => {
    if (groupedRows === undefined) return [];
    const out: { key: string; ref: string; provider: string; displayName: string }[] = [];
    for (const entry of pipeline) {
      if (entry.credential_id) continue;
      const row = rowByKey.get(pipelineEntryKey(entry.ref, entry.credential_id));
      if (!row || row.usable) continue;
      if (!row.reasons.includes('provider_credential_missing')) continue;
      const providerCreds = liveCredsByProvider.get(row.provider) ?? [];
      if (providerCreds.length === 0) {
        out.push({
          key: pipelineEntryKey(entry.ref, entry.credential_id),
          ref: entry.ref,
          provider: row.provider,
          displayName: row.displayName,
        });
      }
    }
    return out;
  }, [pipeline, groupedRows, rowByKey, liveCredsByProvider]);

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
    // PRV-073: the engine validates reasoning_budget_tokens int 1..100000 —
    // hold the save here instead of shipping to a 400.
    checkRange(
      defaults.reasoning_budget_tokens,
      '',
      (v) => Number.isInteger(v) && v >= 1 && v <= 100_000,
      'Reasoning budget must be a whole number of tokens, 1–100000.',
    );
    for (const entry of pipeline) {
      const ep = entry.params;
      if (!ep) continue;
      const name = rowByKey.get(pipelineEntryKey(entry.ref, entry.credential_id))?.displayName ?? entry.ref;
      checkRange(ep.temperature, `${name}: `, (v) => v >= 0 && v <= 2, 'temperature must be 0–2.');
      checkRange(ep.top_p, `${name}: `, (v) => v > 0 && v <= 1, 'top-p must be above 0 and at most 1.');
      checkRange(
        ep.reasoning_budget_tokens,
        `${name}: `,
        (v) => Number.isInteger(v) && v >= 1 && v <= 100_000,
        'reasoning budget must be a whole number of tokens, 1–100000.',
      );
    }
    if (defaults.output_schema !== undefined) {
      const check = validateOutputSchema(defaults.output_schema);
      if (!check.ok) messages.push(check.message);
    }
    if (defaults.response_format === 'schema' && (defaults.output_schema ?? '').trim() === '') {
      messages.push('Response format is Schema — add a valid JSON schema.');
    }
    return messages;
  }, [defaults, pipeline, rowByKey]);

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
        ...(defaults.reasoning_budget_tokens !== undefined
          ? { reasoning_budget_tokens: defaults.reasoning_budget_tokens }
          : {}),
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

  const heldMessages = useMemo(() => {
    // B6: single-owner dedupe — paramIssues owns the param gates; if
    // checkDefinitionCaps emits the same message text for a model_params
    // path, it is the same fact and must not double-count. Dedupe by
    // message text so one fact = one blocker on every surface.
    const seen = new Set<string>();
    const out: string[] = [];
    const push = (message: string) => {
      if (!seen.has(message)) {
        seen.add(message);
        out.push(message);
      }
    };
    for (const b of credBlockers) {
      // PRV-080: the vault panel is gone — the blocker names the Providers
      // page (the deep-link itself renders in the catalog rows below).
      push(`No ${providerLabel(b.provider)} credential — required by ${b.displayName}. Connect one on the Providers page.`);
    }
    for (const message of paramIssues) push(message);
    for (const issue of capsIssues) {
      // paramIssues owns model_params gates — skip the caps duplicate.
      if (issue.path.startsWith('model_params.')) continue;
      push(issue.message);
    }
    return out;
  }, [credBlockers, paramIssues, capsIssues]);
  const blocked = heldMessages.length > 0;
  const pending = saveDraft.isPending || updateDraft.isPending;

  // Convergence is measured in POLICY shape (what the dialog hands back), not
  // local shape — comparing across shapes would park autosave forever.
  const sourcePolicyJson = useMemo(
    () => (definition ? JSON.stringify({ model_policy: definition.model_policy, model_params: definition.model_params }) : null),
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
          onSuccess: () => confirmSection('model'),
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
      onSuccess: () => confirmSection('model'),
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
    holdReason: () => heldMessages[0] ?? null,
  });

  // ---- Pipeline mutations (all keyed by entry key: byok|<ref>|<id> / platform|<ref>|) ----
  const patchEntry = useCallback((key: string, patch: Partial<ModelPipelineEntry>) => {
    setPipeline((prev) =>
      prev.map((entry) =>
        pipelineEntryKey(entry.ref, entry.credential_id) === key ? normalizeEntry({ ...entry, ...patch }) : entry,
      ),
    );
  }, []);

  const patchEntryParams = useCallback(
    (key: string, patch: Partial<NonNullable<ModelPipelineEntry['params']>> | null) => {
      setPipeline((prev) =>
        prev.map((entry) => {
          if (pipelineEntryKey(entry.ref, entry.credential_id) !== key) return entry;
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

  const addModel = useCallback((ref: string, credentialId: string | null) => {
    const key = pipelineEntryKey(ref, credentialId);
    setPipeline((prev) =>
      prev.some((entry) => pipelineEntryKey(entry.ref, entry.credential_id) === key)
        ? prev
        : [...prev, normalizeEntry(credentialId ? { ref, credential_id: credentialId } : { ref })],
    );
    setExpanded((prev) => ({ ...prev, [key]: true }));
  }, []);

  const removeModel = useCallback((key: string) => {
    setPipeline((prev) => prev.filter((entry) => pipelineEntryKey(entry.ref, entry.credential_id) !== key));
  }, []);

  /**
   * PRV-077: removing a model pinned by a live assistant's published pipeline
   * requires explicit confirmation (blast-radius preview fed by N-5
   * pinned_by[] — real data, never fabricated). Unpinned models remove
   * directly.
   */
  const requestRemoveModel = useCallback(
    (key: string) => {
      const affected = rowByKey.get(key)?.pinnedBy ?? [];
      if (affected.length === 0) {
        removeModel(key);
        return;
      }
      setBlastPending({ key, affected });
    },
    [rowByKey, removeModel],
  );

  const moveModel = useCallback((key: string, direction: -1 | 1) => {
    setPipeline((prev) => {
      const index = prev.findIndex((entry) => pipelineEntryKey(entry.ref, entry.credential_id) === key);
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

  /**
   * PRV-076: selecting a model without native tool calling while the draft
   * has pinned tools warns (amber) and requires explicit confirmation — it
   * never hard-blocks. Removing an entry goes through the blast-radius check.
   */
  const toggleModel = useCallback(
    (ref: string, credentialId: string | null) => {
      const key = pipelineEntryKey(ref, credentialId);
      if (pipeline.some((entry) => pipelineEntryKey(entry.ref, entry.credential_id) === key)) {
        requestRemoveModel(key);
        return;
      }
      const row = rowByKey.get(key);
      if (pinnedToolCount > 0 && row && row.capabilities.tools === false) {
        setToolGuardPending({ ref, credentialId });
        return;
      }
      addModel(ref, credentialId);
    },
    [pipeline, rowByKey, pinnedToolCount, requestRemoveModel, addModel],
  );

  const scrollToGroup = useCallback((key: string) => {
    document.getElementById(`model-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // B1: the "+ Add model from catalog" button performs a real add-or-guide
  // flow — it is not a scroll anchor. If a usable catalog model exists and
  // the pipeline is empty, add the first usable model directly (the row
  // expands for configuration via addModel). Otherwise scroll to the catalog
  // and state the true unblock step.
  const handleAddModel = useCallback(() => {
    const usable = (groupedRows ?? []).filter(
      (row) => row.usable && !pipeline.some((entry) => pipelineEntryKey(entry.ref, entry.credential_id) === row.key),
    );
    if (usable.length > 0 && pipeline.length === 0) {
      toggleModel(usable[0].ref, usable[0].credentialId);
      return;
    }
    if (usable.length > 0) {
      // Pipeline isn't empty — guide to the catalog to pick the next model.
      scrollToGroup('catalog');
      return;
    }
    scrollToGroup('catalog');
    toast('No usable models yet — visit Providers to connect a credential or enable models.');
  }, [groupedRows, pipeline, toggleModel, scrollToGroup]);

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
  // B7: draft buffering — onDraft writes to a local buffer only; onSave
  // validates then applies; onClose ("Back to Model") discards the buffer.
  // Back never applies because the draft was never in section state.
  // The buffer holds the block itself (ModalBlock), not a SavedBlock wrapper.
  const schemaDraftRef = useRef<ModalBlock | null>(null);
  const [schemaEdit, setSchemaEdit] = useState<{
    target: EditableBlock;
    apply: (saved: { block: { mode: string; content: string } }) => void;
  } | null>(null);

  const openSchemaEditor = useCallback(() => {
    schemaDraftRef.current = null;
    setSchemaEdit({
      target: {
        key: 'model:output-schema',
        sectionLabel: 'Model',
        title: 'Output schema',
        jsonKind: 'any',
        // D7: a JSON schema is JSON-only — offering Plain/Markdown surfaces
        // here is confusing and lossy (leaving JSON unwraps the string).
        surfaces: ['json'],
        block: { mode: 'json', content: defaults.output_schema ?? '' },
        placeholder: '{"type": "object", "properties": { … }}',
        cap: ENGINE_RANGES.outputSchemaMax,
      },
      apply: (saved) => {
        const text = saved.block.content;
        // Harden: reject invalid JSON regardless of caller — an invalid
        // schema must never enter section state.
        if (text.trim() !== '' && !validateOutputSchema(text).ok) return;
        setDefaults((prev) =>
          text.trim() === '' ? { ...prev, output_schema: undefined } : { ...prev, output_schema: text },
        );
      },
    });
  }, [defaults.output_schema]);

  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Pipeline key sets + guard render state — hooks, so they must live above
  // the early returns below.
  const pipelineKeys = useMemo(
    () => new Set(pipeline.map((entry) => pipelineEntryKey(entry.ref, entry.credential_id))),
    [pipeline],
  );
  const credBlockedKeys = useMemo(() => new Set(credBlockers.map((b) => b.key)), [credBlockers]);
  const pendingGuardRow =
    toolGuardPending !== null
      ? rowByKey.get(pipelineEntryKey(toolGuardPending.ref, toolGuardPending.credentialId))
      : undefined;

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
        onDraft={(draft) => {
          schemaDraftRef.current = draft.block;
        }}
        onSave={(saved) => {
          schemaEdit.apply(saved);
          schemaDraftRef.current = null;
          setSchemaEdit(null);
        }}
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
      meta: groupedRows === undefined ? 'Loading…' : `${groupedRows.length} models`,
      done: groupedRows !== undefined,
    },
    {
      key: 'defaults',
      label: 'Defaults',
      meta: RESPONSE_FORMAT_OPTIONS.find((o) => o.value === responseFormat)?.label ?? 'Text',
      done: paramIssues.length === 0,
    },
  ];

  const primaryEntry = pipeline.length > 0 ? pipeline[0] : null;
  const primaryName =
    primaryEntry !== null
      ? (rowByKey.get(pipelineEntryKey(primaryEntry.ref, primaryEntry.credential_id))?.displayName ?? primaryEntry.ref)
      : null;
  const readinessItems = [
    {
      label: 'Primary model picked',
      done: pipeline.length > 0,
      meta: primaryName ?? 'No model yet — add one from the catalog.',
    },
    {
      label: 'Credential for every model',
      // D9: vacuously true on an empty pipeline — the row must not read
      // "done" when there is nothing to credential.
      done: pipeline.length > 0 && credBlockers.length === 0,
      meta:
        credBlockers.length > 0
          ? `${credBlockers.length} model${credBlockers.length === 1 ? '' : 's'} missing a credential`
          : pipeline.length === 0
            ? 'No models yet — credentials attach when you add one'
            : 'All connected',
      fix: credBlockers.length > 0 ? () => scrollToGroup('pipeline') : undefined,
    },
    {
      label: 'Parameters within limits',
      // D9: same vacuous-done shape as the credential row.
      done: pipeline.length > 0 && paramIssues.length === 0,
      meta:
        pipeline.length === 0
          ? 'No models yet'
          : paramIssues.length > 0
            ? `${paramIssues.length} issue${paramIssues.length === 1 ? '' : 's'} to fix`
            : 'Within limits',
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

  return (
    <SectionPage
      title="Model"
      subtitle="Which models serve this agent, in what order — and how each one is reached."
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
          label="Pipeline"
          description="The models that serve this agent, in order. Configure each one below."
        >
          <PipelineCard>
            <PipelineHeader>
              <ServingOrderLabel>Serving order</ServingOrderLabel>
              {canAuthor && (
                <SwitchLabelPair>
                  <Switch label="Fallback" checked={fallback} onChange={setFallback} id="model-fallback-switch" />
                  <SwitchLabelText htmlFor="model-fallback-switch">Fallback</SwitchLabelText>
                </SwitchLabelPair>
              )}
            </PipelineHeader>
            {pipeline.length === 0 ? (
              <EmptyPipeline>
                No models yet — add one from the catalog below. The first model you add becomes the primary.
              </EmptyPipeline>
            ) : (
              pipeline.map((entry, index) => {
                const key = pipelineEntryKey(entry.ref, entry.credential_id);
                const row = rowByKey.get(key);
                return (
                  <PipelineRow
                    key={key}
                    entry={entry}
                    index={index}
                    total={pipeline.length}
                    row={row}
                    cost={costsByRef.get(entry.ref)}
                    providerCreds={liveCredsByProvider.get(entry.ref.split('/')[0] ?? '') ?? []}
                    credBlocked={credBlockedKeys.has(key)}
                    toolWarn={pinnedToolCount > 0 && row !== undefined && row.capabilities.tools === false}
                    expanded={expanded[key] ?? false}
                    onToggleExpand={() => setExpanded((prev) => ({ ...prev, [key]: !(prev[key] ?? false) }))}
                    overrideOpen={overrideOpen[key] ?? false}
                    onToggleOverride={() => setOverrideOpen((prev) => ({ ...prev, [key]: !(prev[key] ?? false) }))}
                    pinCustom={pinCustom[key] ?? false}
                    onPinCustomChange={(custom) => setPinCustom((prev) => ({ ...prev, [key]: custom }))}
                    canAuthor={canAuthor}
                    onMoveUp={() => moveModel(key, -1)}
                    onMoveDown={() => moveModel(key, 1)}
                    onRemove={() => requestRemoveModel(key)}
                    onPatchEntry={(patch) => patchEntry(key, patch)}
                    onPatchParams={(patch) => patchEntryParams(key, patch)}
                  />
                );
              })
            )}
            {canAuthor && (
              <AddModelButton type="button" onClick={handleAddModel}>
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
          label="Catalog"
          description="Every model your organization can use, grouped by source. Locked rows name the subscription they need."
        >
          <ModelPicker
            rows={groupedRows}
            loadError={grouped.isError}
            pipelineKeys={pipelineKeys}
            credBlockedKeys={credBlockedKeys}
            pinnedToolCount={pinnedToolCount}
            canAuthor={canAuthor}
            isEnterprise={isEnterprise}
            returnTo={buildAgentBuildPath(assistantId)}
            onToggle={toggleModel}
          />
          {/* PRV-076: warn, don't forbid — explicit confirmation to select a
              tool-less model while the draft has pinned tools. */}
          {toolGuardPending !== null && pendingGuardRow !== undefined && (
            <ToolCompatGuard
              modelCapabilities={pendingGuardRow.capabilities}
              pinnedToolCount={pinnedToolCount}
              onConfirm={() => {
                addModel(toolGuardPending.ref, toolGuardPending.credentialId);
                setToolGuardPending(null);
              }}
              onCancel={() => setToolGuardPending(null)}
            />
          )}
          {/* PRV-077: blast-radius preview before removing a model pinned by
              a live assistant's published pipeline. */}
          {blastPending !== null && (
            <BlastRadiusConfirm
              affected={blastPending.affected}
              actionLabel="Remove model"
              message={`${blastPending.affected.length} published ${blastPending.affected.length === 1 ? 'assistant' : 'assistants'} pin${blastPending.affected.length === 1 ? 's' : ''} this exact model. Removing it from this draft's pipeline does not touch their published versions — but the next publish will serve without it.`}
              onConfirm={() => {
                removeModel(blastPending.key);
                setBlastPending(null);
              }}
              onCancel={() => setBlastPending(null)}
            />
          )}
        </SectionGroup>
      </div>

      {/* ---- DEFAULTS ---- */}
      <div id="model-defaults">
        <SectionGroup
          label="Defaults"
          description="Generation defaults for every run. Unset means the model default. Per-model overrides live in the pipeline above."
        >
          <DefaultsGrid>
            <SliderRow>
              <SliderHead>
                <SliderName>Temperature</SliderName>
                {/* D4: quantize the readout — legacy drafts can hold float32 artifacts like 0.8999999761581421. */}
                <SliderValue>
                  {defaults.temperature === undefined
                    ? 'default'
                    : formatStepValue(defaults.temperature, ENGINE_RANGES.temperature.step)}
                </SliderValue>
              </SliderHead>
              {canAuthor && (
                <>
                  <RangeInput
                    type="range"
                    min={ENGINE_RANGES.temperature.min}
                    max={ENGINE_RANGES.temperature.max}
                    step={ENGINE_RANGES.temperature.step}
                    value={formatStepValue(defaults.temperature ?? 1, ENGINE_RANGES.temperature.step)}
                    aria-label="Temperature"
                    onChange={(event) =>
                      setDefaults((prev) => ({
                        ...prev,
                        temperature: roundToStep(Number(event.target.value), ENGINE_RANGES.temperature.step),
                      }))
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
                      value={topPDraft.value}
                      onChange={(event) => topPDraft.onChange(event.target.value)}
                      onBlur={topPDraft.onBlur}
                      onKeyDown={topPDraft.onKeyDown}
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
                      value={maxOutputDraft.value}
                      onChange={(event) => maxOutputDraft.onChange(event.target.value)}
                      onBlur={maxOutputDraft.onBlur}
                      onKeyDown={maxOutputDraft.onKeyDown}
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
                <SliderRow>
                  <SliderHead>
                    <SliderName>Reasoning budget</SliderName>
                    <SliderValue>
                      {defaults.reasoning_budget_tokens === undefined
                        ? 'default'
                        : defaults.reasoning_budget_tokens.toLocaleString()}
                    </SliderValue>
                  </SliderHead>
                  {canAuthor && (
                    <TextInput
                      aria-label="Reasoning budget tokens (whole number, 1–100000)"
                      inputMode="numeric"
                      value={budgetDraft.value}
                      onChange={(event) => budgetDraft.onChange(event.target.value)}
                      onBlur={budgetDraft.onBlur}
                      onKeyDown={budgetDraft.onKeyDown}
                      placeholder="e.g. 16000"
                    />
                  )}
                </SliderRow>
                <HelperText>
                  Explicit thinking budget in tokens. An explicit budget wins over the reasoning
                  effort tier at call time; unset means the provider default.
                </HelperText>
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
                    // 'text' is the default (the wire omits it) — selecting it
                    // writes unset, mirroring the Reasoning effort
                    // 'default'→undefined above. Storing the literal 'text'
                    // would never equal the omitted source, phantoming
                    // "Unsaved changes" after a JSON→Text round trip.
                    setDefaults((prev) =>
                      value === 'text'
                        ? { ...prev, response_format: undefined }
                        : { ...prev, response_format: value as ResponseFormat },
                    )
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
  row: BuilderModelRow | undefined;
  cost: { costMicrosPer1kInput: number | null; costMicrosPer1kOutput: number | null } | undefined;
  providerCreds: { id: string; label: string }[];
  credBlocked: boolean;
  /** PRV-076: draft has pinned tools but this model has no tool calling. */
  toolWarn: boolean;
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
}

function PipelineRow({
  entry,
  index,
  total,
  row,
  cost,
  providerCreds,
  credBlocked,
  toolWarn,
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
}: PipelineRowProps) {
  const provider = entry.ref.split('/')[0] ?? entry.ref;
  const displayName = row?.displayName ?? entry.ref;
  const ctx = fmtCtx(row?.contextWindowTokens);
  const caps = row ? Object.entries(row.capabilities).filter(([, v]) => !!v).map(([k]) => k) : [];
  const capLabels = caps
    .map((c) => (c === 'vision' ? 'Vision' : c === 'tools' ? 'Tools' : c === 'reasoning' ? 'Reasoning' : null))
    .filter((c): c is 'Vision' | 'Tools' | 'Reasoning' => c !== null);
  // Supergroup serving label (doc 20 §5): the pin selects the source —
  // platform pool when unpinned, the named credential when pinned.
  const sourceLabel =
    row?.supergroup === 'byok' ? `BYOK · ${row.credentialLabel ?? 'unlabeled credential'}` : 'Platform';
  // W18: the in/out suffixes attach only to real prices — an unpriced side
  // contributes nothing, and a fully unpriced row reads "Pricing not listed"
  // with no suffixes.
  const inPerM = pricePerM(cost?.costMicrosPer1kInput);
  const outPerM = pricePerM(cost?.costMicrosPer1kOutput);
  const priceLine =
    inPerM === null && outPerM === null
      ? 'Pricing not listed'
      : [inPerM === null ? null : `${inPerM} in`, outPerM === null ? null : `${outPerM} out`]
          .filter((part): part is string => part !== null)
          .join(' · ');

  const selectedCred = providerCreds.find((c) => c.id === entry.credential_id) ?? null;

  // String-draft inputs (B3/B4/B5): same pattern as the defaults above —
  // raw text while typing, commit on blur/Enter, NaN can never enter state.
  const overrideTopPDraft = useStringDraft(entry.params?.top_p, (value) =>
    onPatchParams({ top_p: value }),
  );
  const overrideMaxOutputDraft = useStringDraft(
    entry.params?.max_output_tokens,
    (value) => onPatchParams({ max_output_tokens: value }),
    { format: (v) => v.toLocaleString() },
  );
  const overrideBudgetDraft = useStringDraft(
    entry.params?.reasoning_budget_tokens,
    (value) => onPatchParams({ reasoning_budget_tokens: value }),
    { format: (v) => v.toLocaleString() },
  );
  // Unusable for a known reason — render the human text plus the Providers
  // deep-link (PRV-080). Unknown rows (no N-5 match) render nothing.
  const unusableReason = row && !row.usable ? (row.reasons[0] ?? 'unknown') : null;
  // W19: credential-exempt rows — the demo provider, or platform-sourced
  // rows the platform pool serves — never need an org credential. Keys off
  // the same signal as the readiness panel: only a genuine
  // provider_credential_missing blocker (credBlocked) may offer the
  // connect-credential helper.
  const credentialExempt =
    !credBlocked && (isDemoProvider(row?.provider ?? provider) || row?.supergroup === 'platform');

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
              {row?.providerDisplayName ?? providerLabel(provider)} · {row?.modelId ?? entry.ref}
              {ctx ? ` · ${ctx}` : ''}
              {` · ${sourceLabel}`}
              {capLabels.length > 0 ? ` · ${capLabels.join(' ')}` : ''}
            </PipelineRowMeta>
            <PipelineRowMeta>{priceLine}</PipelineRowMeta>
            {unusableReason !== null && (
              <PipelineRowMeta>
                unusable: {humanizeReason(unusableReason)} ·{' '}
                <Link to="/agent-studio/providers">Open Providers →</Link>
              </PipelineRowMeta>
            )}
          </div>
          {credBlocked && <CredBadge $tone="red">Required</CredBadge>}
          {!credBlocked && toolWarn && <CredBadge $tone="amber">No tool support</CredBadge>}
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
              <Dropdown
                variant="select"
                aria-label={`Credential for ${displayName}`}
                value={entry.credential_id ?? ''}
                onChange={(v) =>
                  onPatchEntry({ credential_id: v === '' ? undefined : v })
                }
                disabled={!canAuthor}
                items={[
                  // PRV-024: unpinned resolves to the platform pool — the
                  // label states the routing truth. Key labels only here;
                  // fingerprints have no builder rendering (doc 20 §1.3).
                  { value: '', label: 'Platform pool (no pin)' },
                  ...providerCreds.map((cred) => ({
                    value: cred.id,
                    label: cred.label,
                  })),
                ]}
              />
            ) : credentialExempt ? (
              <HelperText>Served by platform pool — no credential needed</HelperText>
            ) : (
              <HelperText>
                {credBlocked ? (
                  <>
                    <CredBadge $tone="red">Required</CredBadge> Connect a {providerLabel(provider)} credential to
                    serve this model.{' '}
                  </>
                ) : (
                  <>No {providerLabel(provider)} credential connected.{' '}</>
                )}
                {canAuthor && (
                  <Link to="/agent-studio/providers">Connect {providerLabel(provider)} →</Link>
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
              <SwitchLabelPair>
                <Switch
                  label="Override defaults for this model"
                  checked={overrideOpen}
                  onChange={(checked) => {
                    onToggleOverride();
                    if (!checked) onPatchParams(null);
                  }}
                  id={`model-override-${index}`}
                />
                <SwitchLabelText htmlFor={`model-override-${index}`}>
                  Override defaults for this model
                </SwitchLabelText>
              </SwitchLabelPair>
            ) : (
              <ParamLabel>Per-model overrides</ParamLabel>
            )}
          </OverrideToggle>
          {overrideOpen && (
            <OverrideGrid>
              <SliderRow>
                <SliderHead>
                  <SliderName>Temperature</SliderName>
                  {/* D4: quantize the readout — see the defaults slider above. */}
                  <SliderValue>
                    {entry.params?.temperature === undefined
                      ? 'default'
                      : formatStepValue(entry.params.temperature, ENGINE_RANGES.temperature.step)}
                  </SliderValue>
                </SliderHead>
                {canAuthor && (
                  <RangeInput
                    type="range"
                    min={ENGINE_RANGES.temperature.min}
                    max={ENGINE_RANGES.temperature.max}
                    step={ENGINE_RANGES.temperature.step}
                    value={formatStepValue(entry.params?.temperature ?? 1, ENGINE_RANGES.temperature.step)}
                    aria-label={`${displayName} temperature override`}
                    onChange={(event) =>
                      onPatchParams({
                        temperature: roundToStep(Number(event.target.value), ENGINE_RANGES.temperature.step),
                      })
                    }
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
                    value={overrideTopPDraft.value}
                    onChange={(event) => overrideTopPDraft.onChange(event.target.value)}
                    onBlur={overrideTopPDraft.onBlur}
                    onKeyDown={overrideTopPDraft.onKeyDown}
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
                    value={overrideMaxOutputDraft.value}
                    onChange={(event) => overrideMaxOutputDraft.onChange(event.target.value)}
                    onBlur={overrideMaxOutputDraft.onBlur}
                    onKeyDown={overrideMaxOutputDraft.onKeyDown}
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
              <SliderRow>
                <SliderHead>
                  <SliderName>Reasoning budget</SliderName>
                  <SliderValue>
                    {entry.params?.reasoning_budget_tokens === undefined
                      ? 'default'
                      : entry.params.reasoning_budget_tokens.toLocaleString()}
                  </SliderValue>
                </SliderHead>
                {canAuthor && (
                  <TextInput
                    aria-label={`${displayName} reasoning budget override (whole number, 1–100000)`}
                    inputMode="numeric"
                    value={overrideBudgetDraft.value}
                    onChange={(event) => overrideBudgetDraft.onChange(event.target.value)}
                    onBlur={overrideBudgetDraft.onBlur}
                    onKeyDown={overrideBudgetDraft.onKeyDown}
                    placeholder="e.g. 16000"
                  />
                )}
              </SliderRow>
            </OverrideGrid>
          )}
        </div>
      )}
    </PipelineRowShell>
  );
}
