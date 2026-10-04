import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import toast from 'react-hot-toast';
import { useNavigate } from '@tanstack/react-router';
import { ActionButton } from '@components/common/ui/ActionButton';
import { canSetup } from '@lib/engine/capabilities';
import { ApiError } from '@lib/engine/client';
import { useOrg } from '@/Context/OrgContext';
import { useAssistant, useAssistantDefinition, useAssistantVersions, useKnowledgeHealth, usePublishReadiness, DRAFT_WRITE_MUTATION_KEY } from '@hooks/studio/useAgentAuthoring';
import { useIsMutating } from '@tanstack/react-query';
import { useModelAvailability, useModelCosts } from '@hooks/studio/useSetupModels';
import { useEvalRuns } from '@hooks/studio/useSetupEval';
import { useDocuments } from '@hooks/studio/useSetupKnowledge';
import { BUILT_IN_TOOLS, useToolCatalog } from '@hooks/studio/useSetupTools';
import { useProviderCredentials } from '@hooks/studio/useSetupProviders';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { BuilderTopbarActions, BuilderTopbarIdentity } from './topbar/BuilderTopBar';
import { usePublishBuilderTopbarSlots, type BuilderTopbarSlots } from './topbar/BuilderTopbarSlots';
import { SectionNav } from './nav/SectionNav';
import { OVERVIEW_ID, sectionLabel, type SectionEntry } from './nav/section-groups';
import { OverviewScreen } from './overview/OverviewScreen';
import { SectionBody, type InspectorContext } from './sections/SectionBody';
import { DefinitionErrorPanel } from './inspector/DefinitionErrorPanel';
import type { PurposeNodeDatum } from './inspector/PurposeExtras';
import type { TraceEditTarget } from './inspector/TraceDrawer';
import { OriginScreen } from './origin/OriginScreen';
import { TemplateBanner } from '../templates/TemplateBanner';
import type { PurposeFormState, PurposeHandle } from './inspector/PurposeInspector';
import { BuilderBottomBar } from './bottombar/BuilderBottomBar';
import { deriveBottomAction, type BottomAction, type BottomPrimary } from './lib/bottom-action';
import { SETUP_ENTRY_STEP, clearSetupPosition, getSetupOrder, nextSetupSection, prevSetupSection, readSetupPosition, setupStepIndex, writeSetupPosition } from './lib/setup-flow';
import { knowledgeSlot, projectBuilderGraph, FUNCTIONAL_NODE_IDS } from './lib/projector';
import { estimateRun, PLATFORM_DEFAULTS } from './lib/budget-model';
import { selectVersionEvalState } from './lib/eval-model';
import type { PublishEditTarget } from './lib/publish-model';
import { useBuilderUI } from './lib/builder-store';
import { usableRefs } from './lib/brain-model';
import { useSectionConfirmation } from './lib/use-section-confirmation';
import { SectionConfirmationContext } from './lib/section-confirmation-context';
import {
  buildAgentBuildPath,
  buildAgentEditPath,
  resolveInitialSlot,
} from './lib/slot-model';
import { LoadingVeil, Main, NotFound, NotFoundBody, NotFoundTitle, Shell } from './AgentBuilder.styles';

// Configure-first builder (redesign): the v10 canvas is soft-deleted from
// frontend access (builder/canvas/** is preserved for a future Workflow
// Studio). The builder is now: SectionNav (left) + Overview/SectionBody
// (main pane). Every section keeps its real implementation — only re-homed.

export interface AgentBuilderProps {
  mode: 'new' | 'build';
  /** Build mode only (route param, passed by the page — never read here). */
  agentId?: string | null;
  /**
   * C15 re-entry (?slot=): resume on a section id once. Unknown values
   * fall through to default selection — never an error, never a surprise.
   */
  initialSlot?: string | null;
  /**
   * Guided setup flow (?setup=1, build mode only): after "Create agent" the
   * bottom bar becomes a Back / Continue stepper walking the 17 sections
   * instead of stranding the maker on the Overview.
   */
  setupFlow?: boolean;
}

export function AgentBuilder({ mode, agentId = null, initialSlot = null, setupFlow = false }: AgentBuilderProps) {
  const navigate = useNavigate();
  const { role, name: orgName } = useOrg();
  const canAuthor = canSetup(role, 'setup:author');
  // Guided setup is an author-only continuation of creation — viewers who
  // land on ?setup=1 get the ordinary build mode.
  const isSetupFlow = mode === 'build' && setupFlow === true && canAuthor && agentId != null;
  // P1-1 (T-01): publish is a setup:govern act (owner/admin only —
  // assistants.controller.ts:198-201). The topbar Publish must mirror the
  // Ship section's gate, never the broader setup:author tier.
  const canPublish = canSetup(role, 'setup:govern');

  const assistant = useAssistant(mode === 'build' ? (agentId ?? null) : null, { enabled: mode === 'build' });
  const form = useAssistantDefinition(mode === 'build' ? (agentId ?? null) : null);
  const models = useModelAvailability({ enabled: mode === 'build' });
  const modelCosts = useModelCosts({ enabled: mode === 'build' });
  // Draft-targeted pin health (C05) — grades the knowledge section and the
  // bottom hint against the draft Re-pin mutates, not the active version.
  // Disabled in new mode: no assistant exists to read.
  const health = useKnowledgeHealth(mode === 'build' ? (agentId ?? null) : null, form.data?.versionId ?? null);
  // Unconditional by design: one cached library read that warms the cache for
  // the Knowledge passes in both modes (no render depends on it in origin).
  const documents = useDocuments();
  const librarySlugs = useMemo(
    () => documents.data?.map((d) => d.sourceSlug).filter((s): s is string => typeof s === 'string') ?? null,
    [documents.data],
  );
  // Unconditional by design: one cached catalog read shared with the Tools
  // library (30s stale) that grades the tools section in both modes.
  const toolCatalog = useToolCatalog();
  // C10: shared-cache eval reads (same EVAL_KEY family the libraries use)
  // that grade the evaluation section. Disabled in new mode.
  const evalRuns = useEvalRuns(undefined, { enabled: mode === 'build' });
  const allVersions = useAssistantVersions(mode === 'build' ? (agentId ?? null) : null);
  // C14: shared publish-readiness derivation (same cache the Ship section
  // reads) for the working draft. Disabled in new mode — locked there.
  // SHP-2: the degraded-knowledge ack is lifted here so the topbar badge,
  // the graph node, and the Ship section all read the same ack-aware
  // derivation — never three disagreeing counts.
  const [degradedAck, setDegradedAck] = useState(false);
  const shipReadiness = usePublishReadiness(mode === 'build' ? (agentId ?? null) : null, form.data?.versionId ?? null, {
    enabled: mode === 'build',
    acknowledged: degradedAck,
  });

  // Per-version ceremony state resets with the working version (render-time
  // adjustment — an effect here would cascade renders).
  const [prevAckVersionId, setPrevAckVersionId] = useState<string | null>(null);
  const workingVersionId = mode === 'build' ? (form.data?.versionId ?? null) : null;
  if (prevAckVersionId !== workingVersionId) {
    setPrevAckVersionId(workingVersionId);
    setDegradedAck(false);
  }

  const agentKey = mode === 'build' ? agentId : null;

  // C-BUG4/M-BUG3 Option A: per-section confirmation tracking. When a
  // section's Save succeeds, it's marked confirmed; the projector treats
  // confirmed sections as `ready` even at engine defaults.
  const { confirmed: confirmedSections, confirm: confirmSection } = useSectionConfirmation(agentKey);
  const { selectedId, hydrate, select } = useBuilderUI();

  useEffect(() => {
    hydrate(agentKey);
  }, [agentKey, hydrate]);

  // Origin choice (C11, new mode only): the pre-builder start screen.
  // 'choose' shows the origin paths; 'blank' restores the locked builder
  // with the Identity form. Template installs navigate away (build mode).
  const [origin, setOrigin] = useState<'choose' | 'blank'>('choose');
  const [formState, setFormState] = useState<PurposeFormState>({ dirty: false, valid: false });
  const [composerDirty, setComposerDirty] = useState(false);
  const [brandDirty, setBrandDirty] = useState(false);
  const [brainDirty, setBrainDirty] = useState(false);
  const [modelDirty, setModelDirty] = useState(false);
  const [knowledgeDirty, setKnowledgeDirty] = useState(false);
  const purposeRef = useRef<PurposeHandle | null>(null);

  const definition = form.data?.definition ?? null;
  const hasDraft = form.data?.isDraft ?? false;
  const hasLive = (assistant.data?.activeVersionId ?? null) !== null;
  const agentName = assistant.data?.name ?? null;
  const description = assistant.data?.description ?? null;

  const onFormState = useCallback((state: PurposeFormState) => {
    setFormState(state);
  }, []);

  const onComposerDirty = useCallback((dirty: boolean) => {
    setComposerDirty(dirty);
  }, []);

  const onBrainDirty = useCallback((dirty: boolean) => {
    setBrainDirty(dirty);
  }, []);

  const onModelDirty = useCallback((dirty: boolean) => {
    setModelDirty(dirty);
  }, []);

  const onKnowledgeDirty = useCallback((dirty: boolean) => {
    setKnowledgeDirty(dirty);
  }, []);

  const [toolsDirty, setToolsDirty] = useState(false);

  const onToolsDirty = useCallback((dirty: boolean) => {
    setToolsDirty(dirty);
  }, []);

  const [guardrailsDirty, setGuardrailsDirty] = useState(false);

  const onGuardrailsDirty = useCallback((dirty: boolean) => {
    setGuardrailsDirty(dirty);
  }, []);

  const [memoryDirty, setMemoryDirty] = useState(false);

  const onMemoryDirty = useCallback((dirty: boolean) => {
    setMemoryDirty(dirty);
  }, []);

  const [contextDirty, setContextDirty] = useState(false);

  const onContextDirty = useCallback((dirty: boolean) => {
    setContextDirty(dirty);
  }, []);

  const [responseDirty, setResponseDirty] = useState(false);

  const onResponseDirty = useCallback((dirty: boolean) => {
    setResponseDirty(dirty);
  }, []);

  const [roleDirty, setRoleDirty] = useState(false);

  const onRoleDirty = useCallback((dirty: boolean) => {
    setRoleDirty(dirty);
  }, []);

  const [budgetDirty, setBudgetDirty] = useState(false);

  const onBudgetDirty = useCallback((dirty: boolean) => {
    setBudgetDirty(dirty);
  }, []);

  // Try state for this load (C13): terminal turns report up from the Try
  // console; the response section grade reflects them, nothing else reads this.
  // Restored turns (DS-3) report on a separate path: they carry no version
  // pin, so they must never set the live lastTry (TRY-2).
  const [lastTry, setLastTry] = useState<{ at: string; failed: boolean } | null>(null);
  const [restoredTry, setRestoredTry] = useState<{ at: string; failed: boolean } | null>(null);

  const onTryEvent = useCallback((event: { at: string; failed: boolean; restored?: boolean }) => {
    if (event.restored) {
      setRestoredTry({ at: event.at, failed: event.failed });
    } else {
      setLastTry({ at: event.at, failed: event.failed });
    }
  }, []);

  // Trace Edit jumps land on builder sections: every TraceEditTarget IS a
  // section id, so jumps select directly.
  const onEditJump = useCallback(
    (target: TraceEditTarget) => {
      select(target);
    },
    [select],
  );

  // Ship fix jumps: every PublishEditTarget IS a section id.
  // Disabled in new mode — the Ship section is locked there.
  const onShipJump = useCallback(
    (target: PublishEditTarget) => {
      if (mode === 'new') return;
      select(target);
    },
    [mode, select],
  );

  // Section selection with the new-mode lock (Identity only until created).
  const handleSelectSection = useCallback(
    (id: string) => {
      if (mode === 'new' && id !== 'purpose') return;
      select(id);
    },
    [mode, select],
  );

  const onBrandDirty = useCallback((dirty: boolean) => {
    setBrandDirty(dirty);
  }, []);

  // Dirty guard: Identity form (new-mode create + build-mode edit) + composer + brand voice + brain + model + knowledge + tools + guardrails + memory + context + response + role + budget.
  // (Selection is UI state — rebuilding it is free.)
  const { dialog: guardDialog } = useDirtyGuard(
    formState.dirty || composerDirty || brandDirty || brainDirty || modelDirty || knowledgeDirty || toolsDirty || guardrailsDirty || memoryDirty || contextDirty || responseDirty || roleDirty || budgetDirty,
  );

  // A2-23: honest save readout — a draft write in flight must never display as "Saved".
  const draftWritesInFlight = useIsMutating({ mutationKey: [...DRAFT_WRITE_MUTATION_KEY] });

  /**
   * Provider-credential count for the credentials section (v10 §8.3). Same
   * cached read the CredentialsPanel owns — React Query dedupes, so this is
   * no extra network. Disabled in new mode (section is locked there anyway).
   * ProviderCredential exposes no expiry field — expired stays 0 ("none
   * reported"), never invented.
   */
  const credentials = useProviderCredentials({ enabled: mode === 'build' });

  const modelLabel = useCallback(
    (ref: string) => models.data?.find((m) => m.ref === ref)?.displayName ?? ref,
    [models.data],
  );

  // BDT-5: worst-case run estimate for the budget graph node — primary
  // model's list rate × token cap. Null when unpriced (never a fake $0).
  const budgetEstimateMicros = useMemo(() => {
    const primaryRef = definition?.model_policy.allowed_models[0];
    if (!primaryRef) return null;
    const cost = (modelCosts.data ?? []).find((c) => c.ref === primaryRef);
    if (!cost) return null;
    const tokenCap = definition?.budget.max_total_tokens ?? PLATFORM_DEFAULTS.max_total_tokens;
    return estimateRun(tokenCap, {
      ref: cost.ref,
      costMicrosPer1kInput: cost.costMicrosPer1kInput,
      costMicrosPer1kOutput: cost.costMicrosPer1kOutput,
      costMicrosPer1kCachedInput: cost.costMicrosPer1kCachedInput,
    })?.micros ?? null;
  }, [definition, modelCosts.data]);

  const projected = useMemo(
    () =>
      projectBuilderGraph({
        mode,
        assistantName: agentName,
        hasDraft,
        definition,
        librarySlugs,
        // No canvas in this shell — positions only feed the projector's
        // status grades, which don't depend on coordinates.
        positions: {},
        selectedId,
        modelLabel,
        models: models.data,
        budgetEstimateMicros,
        knowledgeHealth: health.data ?? undefined,
        toolCatalog: toolCatalog.data ?? undefined,
        toolBuiltins: BUILT_IN_TOOLS,
        tryState: {
          hasRunnableVersion:
            (form.data?.versionId ?? null) !== null &&
            (hasDraft || form.data?.status === 'DRAFT' || form.data?.status === 'PUBLISHED'),
          lastTryAt: lastTry?.at ?? null,
          lastTryFailed: lastTry?.failed ?? false,
          restoredTryAt: restoredTry?.at ?? null,
          restoredTryFailed: restoredTry?.failed ?? false,
        },
        credentialsSummary: credentials.data ? { count: credentials.data.length, expired: 0 } : undefined,
        evalState: (() => {
          const row = (allVersions.data ?? []).find((v) => v.id === (form.data?.versionId ?? null)) ?? null;
          if (!row) return undefined;
          return selectVersionEvalState(evalRuns.data ?? [], { id: row.id, status: row.status, updatedAt: row.updatedAt });
        })(),
        shipReadiness:
          mode === 'build' && shipReadiness.rows.length > 0
            ? {
                verdict: shipReadiness.verdict,
                // SHP-2: the canonical ack-aware count from the shared
                // derivation — never a locally re-filtered second truth.
                blockers: shipReadiness.blockers,
                checking: false,
              }
            : mode === 'build' && shipReadiness.isPending
              ? { verdict: 'unknown' as const, blockers: 0, checking: true }
              : undefined,
        confirmedSections,
      }),
    [mode, agentName, hasDraft, definition, librarySlugs, selectedId, modelLabel, models.data, budgetEstimateMicros, health.data, toolCatalog.data, form.data?.versionId, form.data?.status, lastTry, restoredTry, evalRuns.data, allVersions.data, shipReadiness.rows, shipReadiness.verdict, shipReadiness.blockers, shipReadiness.isPending, credentials.data, confirmedSections],
  );

  // The main pane's view: 'overview' or a section id. New mode is locked to
  // Identity until the agent is created.
  const view = mode === 'new' ? 'purpose' : (selectedId ?? OVERVIEW_ID);

  // P1 flow-chrome: a section's dirty contribution must not outlive its
  // unmount. Sections report dirty through useEffect with no unmount
  // cleanup, so switching sections left the builder-level flag true after
  // the unmount flush had already persisted (or discarded) the edits — the
  // topbar kept showing "Unsaved changes" and Save fired a signal no
  // mounted section could hear. Retire the flags during render when the
  // view changes (the documented "adjust state during render" pattern —
  // an effect is the wrong tool here): the unmount flush
  // (use-draft-autosave) reads the section's own dirty gate, not these
  // indicator flags, so retiring them here never drops an unsaved edit;
  // the newly mounted section re-reports its own dirty on mount. In new
  // mode the view is locked to 'purpose' — the Identity form stays mounted
  // and its formState.dirty is untouched.
  const [prevView, setPrevView] = useState(view);
  if (prevView !== view) {
    setPrevView(view);
    setComposerDirty(false);
    setBrandDirty(false);
    setBrainDirty(false);
    setModelDirty(false);
    setKnowledgeDirty(false);
    setToolsDirty(false);
    setGuardrailsDirty(false);
    setMemoryDirty(false);
    setContextDirty(false);
    setResponseDirty(false);
    setRoleDirty(false);
    setBudgetDirty(false);
  }

  // Section navigation entries — the projector's honest per-section state.
  const sectionEntries = useMemo<SectionEntry[]>(
    () =>
      projected.nodes.map((node) => ({
        id: node.id,
        label: node.data.title,
        status: node.data.status,
        statusText: node.data.subtitle ?? node.data.hint ?? '',
      })),
    [projected.nodes],
  );

  // Guided setup flow (?setup=1): the bottom bar becomes a Back / Continue
  // stepper over the 17 sections. Continue always advances — each section
  // carries its own validation and the Ship publish-readiness is the real
  // gate at the end of the walkthrough. The Overview is not a step: from
  // there Continue restarts at the entry step.
  const setupAction = useMemo<BottomAction | null>(() => {
    if (!isSetupFlow) return null;
    const order = getSetupOrder();
    const stepId = view === OVERVIEW_ID ? null : view;
    const idx = setupStepIndex(stepId);
    const next = nextSetupSection(stepId);
    const position = idx === -1 ? 1 : idx + 1;
    const currentId = idx === -1 ? SETUP_ENTRY_STEP : (stepId ?? SETUP_ENTRY_STEP);
    const label =
      sectionEntries.find((entry) => entry.id === currentId)?.label ??
      sectionLabel(currentId, currentId);
    return {
      primaryLabel: next === null ? 'Finish' : 'Continue',
      primary: next === null ? { action: 'finish-setup' } : { action: 'select', target: next },
      whisper: `Step ${position} of ${order.length} · ${label}`,
      showSkip: false,
      skipTarget: null,
    };
  }, [isSetupFlow, view, sectionEntries]);
  const setupPrev = isSetupFlow ? prevSetupSection(view === OVERVIEW_ID ? null : view) : null;

  // Persist the walkthrough position (non-authoritative) so a refresh
  // resumes the exact section instead of restarting at the entry step.
  useEffect(() => {
    if (!isSetupFlow || !agentId || view === OVERVIEW_ID || setupStepIndex(view) === -1) return;
    writeSetupPosition(agentId, view);
  }, [isSetupFlow, agentId, view]);

  // Leave the walkthrough wherever the maker stands — just drop ?setup=1.
  const handleExitSetup = useCallback(() => {
    if (agentId) {
      clearSetupPosition(agentId);
      navigate({ to: buildAgentBuildPath(agentId), search: {} });
    }
  }, [agentId, navigate]);

  const selectedEntry = sectionEntries.find((entry) => entry.id === view) ?? undefined;

  // Identity next-steps data (I6/I7): id/label/status for the extras.
  const purposeNodeData = useMemo<PurposeNodeDatum[]>(
    () =>
      projected.nodes.map((node) => ({
        id: node.id,
        label: node.data.title,
        status: node.data.status,
      })),
    [projected.nodes],
  );

  // Default view: the Overview in build mode (the readiness + config
  // summary is the honest landing), Identity at origin in new mode.
  // C15 ?slot= re-entry wins over all of it, once per scope. Once per
  // scope — an explicit move to Overview (Esc) must stick, never reselect.
  const scopeKey = mode === 'new' ? 'new' : (agentId ?? 'none');
  const defaultedFor = useRef<string | null>(null);
  useEffect(() => {
    if (selectedId !== null || defaultedFor.current === scopeKey) return;
    if (mode === 'new') {
      defaultedFor.current = scopeKey;
      select('purpose');
      return;
    }
    if (isSetupFlow && agentId) {
      // Guided setup entry: Identity was just completed to create the
      // agent, so resume on Instructions — or on the stored section when
      // a refresh interrupted the walkthrough. A ?slot= deep link is
      // ignored here so the walkthrough never fights it — setup wins.
      defaultedFor.current = scopeKey;
      select(readSetupPosition(agentId) ?? SETUP_ENTRY_STEP);
      return;
    }
    if (form.data === undefined) return;
    if (initialSlot) {
      // All 18 ids exist (resolveInitialSlot) — unknown values fall
      // through to default selection, never an error.
      const resolved = resolveInitialSlot(initialSlot);
      if (resolved) {
        defaultedFor.current = scopeKey;
        select(resolved);
        return;
      }
    }
    defaultedFor.current = scopeKey;
    select(OVERVIEW_ID);
  }, [mode, scopeKey, selectedId, form.data, select, initialSlot, isSetupFlow, agentId]);

  // Section health (v10 §8.10): the 14 functional ids (everything except
  // context/response — excluded from readiness math). configured = 'ready'
  // sections among them; nextStep = first attention/error, else first
  // untouched, else null.
  const sectionHealth = useMemo(() => {
    const functional = projected.nodes.filter((n) => (FUNCTIONAL_NODE_IDS as readonly string[]).includes(n.id));
    const configured = functional.filter((n) => n.data.status === 'ready').length;
    const next =
      functional.find((n) => n.data.status === 'attention' || n.data.status === 'error') ??
      functional.find((n) => n.data.status === 'untouched') ??
      null;
    return {
      configured,
      total: functional.length,
      // SHP-2: ack-aware blocker count from the shared derivation — an
      // acknowledged exception is no longer reported as a "blocking issue"
      // by the topbar badge.
      blockers: mode === 'build' ? shipReadiness.blockers : 0,
      // No defensible advisory count exists yet (the only candidate,
      // noChangeHint, is boolean) — omitted rather than invented (§8.11).
      suggestions: 0,
      nextStep: next ? { label: next.data.title, nodeId: next.id } : null,
    };
  }, [projected.nodes, shipReadiness.blockers, mode]);

  const bottomAction = useMemo(() => {
    // Knowledge attention (C05): the graded section's own verdict, computed
    // once — the bar never re-derives what the projector already decided.
    const grade = mode === 'build' && definition ? knowledgeSlot(definition, librarySlugs, health.data ?? undefined) : null;
    return deriveBottomAction({
      mode,
      purposeValid: mode === 'new' ? formState.valid : true,
      hasDraft,
      // Usability, not presence (C04): a loading catalog is not-ready-yet
      // (neutral copy downstream), an all-unusable set selects the model section.
      modelReady: usableRefs(definition?.model_policy.allowed_models ?? [], models.data).length > 0,
      instructionsEmpty:
        mode === 'build' && hasDraft && (definition?.instructions.trim() ?? '') === '',
      knowledgeAttention: grade !== null && grade.status === 'attention' ? grade.subtitle : null,
      // v10: skip toggling is removed from the fixed topology — the bottom
      // bar never offers skip (showSkip stays false with this false).
      selectedSkippableUntouched: false,
      selectedSlot: selectedId,
    });
  }, [mode, formState.valid, hasDraft, definition, librarySlugs, health.data, models.data, selectedId]);

  // — Actions —

  const handlePrimary = useCallback(
    (primary: BottomPrimary) => {
      if (primary.action === 'create') {
        purposeRef.current?.submit();
        return;
      }
      if (primary.action === 'select') {
        // Section ids — bottom-action targets select directly.
        handleSelectSection(primary.target);
        return;
      }
      if (primary.action === 'finish-setup') {
        // Guided setup complete — drop ?setup=1 and land on the Overview.
        handleSelectSection(OVERVIEW_ID);
        if (agentId) {
          clearSetupPosition(agentId);
          navigate({ to: buildAgentBuildPath(agentId), search: {} });
        }
        return;
      }
      if (agentId) navigate({ to: buildAgentEditPath(agentId) });
    },
    [agentId, navigate, handleSelectSection],
  );

  // A2-23: honest save readout — a draft write in flight must never display as "Saved".
  // Computed here (above the keyboard map) so the manual-save trigger can
  // no-op when nothing is dirty.
  const syncing = assistant.isFetching || form.isFetching === true || models.isFetching || documents.isFetching;
  const saving = draftWritesInFlight > 0;
  const anySectionDirty =
    formState.dirty || composerDirty || brandDirty || brainDirty || modelDirty || knowledgeDirty || toolsDirty || guardrailsDirty || memoryDirty || contextDirty || responseDirty || roleDirty || budgetDirty;
  const saveState = mode === 'new' ? 'saved' : saving ? 'saving' : anySectionDirty ? 'unsaved' : syncing ? 'syncing' : 'saved';

  // Manual save signal (topbar Save button / Ctrl+S / ⌘S). Sections watch
  // this counter and fire their own doSave; only the mounted section is
  // listening, and doSave already guards on canAuthor/blocked/conflict.
  const [saveSignal, setSaveSignal] = useState(0);
  const requestSave = useCallback(() => {
    if (mode === 'new' || !canAuthor) return;
    // No editable section mounted (Overview) — no-op.
    if (view === OVERVIEW_ID) return;
    // Identity saves through its own handle (the real identity PATCH), not
    // the draft signal — the topbar Save / Ctrl+S is the same save as the
    // section's "Save Identity" button. (formState.dirty true implies the
    // Identity section is mounted: its unmount cleanup retires the flag.)
    if (formState.dirty) {
      purposeRef.current?.save();
      return;
    }
    // Item 14: the per-section "Save {name}" button is always enabled for
    // authors, so a clean mounted section used to swallow the click with no
    // feedback at all — the signal never fired and nothing explained why.
    // Say so instead; the topbar Save is already disabled when clean, so
    // this path only fires from the section button or Ctrl+S.
    if (!anySectionDirty) {
      toast('No changes to save');
      return;
    }
    setSaveSignal((s) => s + 1);
  }, [mode, canAuthor, anySectionDirty, view, formState.dirty]);

  // Manual publish signal (v10 §8.12 — topbar Publish). Blocked clicks land
  // on the ship section (the gate truth lives there); unblocked clicks
  // select the ship section and increment the counter — the Ship section
  // fires its publish flow once per increment (SHP-1: the old bump-without-
  // navigate dead-clicked from every other section, and the never-reset
  // signal popped the confirm dialog unprompted on every later Ship visit).
  // P1-1 (T-01): gated on setup:govern, not setup:author — the engine's
  // publish endpoint requires owner/admin, so a developer must never bump
  // this signal into a confirm dialog that can only 403. The topbar button
  // is disabled with the honest copy for non-governors; this guard is
  // defense-in-depth for any other caller of handlePublish.
  const [publishSignal, setPublishSignal] = useState(0);
  const handlePublish = useCallback(() => {
    if (mode === 'new' || !canAuthor || !canPublish) return;
    if (sectionHealth.blockers > 0) {
      select('ship');
      return;
    }
    select('ship');
    setPublishSignal((s) => s + 1);
  }, [mode, canAuthor, canPublish, sectionHealth.blockers, select]);

  /**
   * SHP-1: the Ship section calls this after firing a signal increment —
   * the signal is consumed idempotently back to idle (0), so a stale signal
   * can never fire the confirm dialog unprompted on a later visit. The
   * section re-arms its own seen mark when the consume lands (signal 0).
   */
  const consumePublishSignal = useCallback(() => {
    setPublishSignal(0);
  }, []);

  /**
   * Merged builder topbar (ledger T13): instead of a stacked 56px row,
   * the builder provides identity/actions slots that `StudioShell` renders
   * inside its single 48px app topbar. Null during build-mode
   * loading/not-found — the shell then shows no builder chrome, exactly
   * like the old stacked row (which was also absent in those states).
   */
  const topbarSlots = useMemo<BuilderTopbarSlots | null>(() => {
    if (mode === 'build' && assistant.data === undefined) return null;
    if (mode === 'build' && assistant.data === null) return null;
    return {
      identity: (
        <BuilderTopbarIdentity
          mode={mode}
          agentName={agentName}
          orgName={orgName}
          hasDraft={hasDraft}
          hasLive={hasLive}
        />
      ),
      actions: (
        <BuilderTopbarActions
          mode={mode}
          saveState={saveState}
          onSave={requestSave}
          canAuthor={canAuthor}
          canPublish={canPublish}
          onTestRun={() => handleSelectSection('try')}
          onPublish={handlePublish}
          blockingCount={sectionHealth.blockers}
        />
      ),
    };
  }, [
    mode,
    assistant.data,
    agentName,
    orgName,
    hasDraft,
    hasLive,
    saveState,
    requestSave,
    canAuthor,
    canPublish,
    handleSelectSection,
    handlePublish,
    sectionHealth.blockers,
  ]);

  // Publish the merged topbar slots to the layout-level provider above
  // StudioShell (T19 — the provider must sit above the shell, not inside
  // this component, or the shell reads null and the builder topbar never
  // renders). Cleared on unmount so no stale chrome lingers.
  usePublishBuilderTopbarSlots(topbarSlots);

  // Closed keyboard map (redesign): Esc, section keys, Ctrl/⌘+S.
  // Never fires from inputs (except Ctrl/⌘+S, the standard save shortcut —
  // preventDefault stops the browser's own save dialog). Escape inside a
  // field stays in the field; it never navigates away from under typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inField =
        !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      if (event.key === 'Escape') {
        // Fields own their Escape: pressing it while typing must never yank
        // the user out of the section. Components with local Esc behavior
        // (blur, dismiss) handle it themselves; the global map stays out of
        // the way so focus is never stolen from under the user.
        if (inField) return;
        // Never strand unsaved input: Escape must not unmount the Identity
        // form (new mode), the composer, the voice, brain, model, knowledge, tools,
        // guardrails, memory, context, response, role, or budget while any is dirty.
        // Dirty surfaces blur instead (their own Esc handlers); the view stays.
        if (formState.dirty || composerDirty || brandDirty || brainDirty || modelDirty || knowledgeDirty || toolsDirty || guardrailsDirty || memoryDirty || contextDirty || responseDirty || roleDirty || budgetDirty) return;
        handleSelectSection(OVERVIEW_ID);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && (event.key === 's' || event.key === 'S')) {
        event.preventDefault();
        requestSave();
        return;
      }
      if (inField || event.metaKey || event.ctrlKey || event.altKey) return;
      if (mode === 'new' || !canAuthor) return;
      // ⇧K selects knowledge (PLAN v2: bare K navigates to the Knowledge
      // library page studio-wide — the builder must not steal it).
      if (event.shiftKey && (event.key === 'K' || event.key === 'k')) {
        event.preventDefault();
        handleSelectSection('knowledge');
        return;
      }
      const sectionKey: Record<string, string> = { t: 'tools', g: 'guardrails', b: 'brand', e: 'evaluation', s: 'budget' };
      const lower = event.key.toLowerCase();
      if (!event.shiftKey && sectionKey[lower] !== undefined) {
        event.preventDefault();
        handleSelectSection(sectionKey[lower]);
        return;
      }
      if (event.shiftKey && (event.key === 'M' || event.key === 'm')) {
        event.preventDefault();
        handleSelectSection('memory');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSelectSection, mode, formState.dirty, composerDirty, brandDirty, brainDirty, modelDirty, knowledgeDirty, toolsDirty, guardrailsDirty, memoryDirty, contextDirty, responseDirty, roleDirty, budgetDirty, canAuthor, requestSave]);

  const inspectorContext: InspectorContext = useMemo(
    () => ({
      mode,
      agentId,
      agentName,
      description,
      identityPending: mode === 'build' && assistant.isPending,
      identityError: mode === 'build' && assistant.isError,
      onRetryIdentity: () => assistant.refetch(),
      canAuthor,
      role,
      hasDraft,
      definition,
      versionId: form.data?.versionId ?? null,
      versionHash: form.data?.hash ?? null,
      isDraft: hasDraft,
      versionStatus: form.data?.status ?? null,
      models: models.data,
      modelsLoading: models.isPending,
      editPath: agentId ? buildAgentEditPath(agentId) : null,
      tryState: {
        hasRunnableVersion:
          (form.data?.versionId ?? null) !== null &&
          (hasDraft || form.data?.status === 'DRAFT' || form.data?.status === 'PUBLISHED'),
        lastTryAt: lastTry?.at ?? null,
        lastTryFailed: lastTry?.failed ?? false,
      },
      onTryEvent,
      onEditJump,
      onShipJump,
      /** Manual save counter — sections fire doSave when it increments. */
      saveSignal,
      /**
       * Per-section "Save {name}" (section header). Same path as the topbar
       * Save — the mounted section's own guards decide.
       */
      requestSave,
      /**
       * Manual publish counter (v10 §8.12 — topbar Publish). The Ship
       * section fires its publish flow when this increments; blocked
       * clicks never reach it — they select the ship section instead.
       * The section consumes each increment back to 0 (SHP-1), so a stale
       * signal can never fire unprompted.
       */
      publishSignal,
      /** SHP-1: Ship calls this after firing a signal increment. */
      onPublishSignalConsumed: consumePublishSignal,
      /**
       * Degraded-knowledge ack (SHP-2): lifted here so the topbar badge,
       * the graph node, and the Ship section all read the same ack-aware
       * derivation. Resets with the working version.
       */
      degradedAck,
      onDegradedAck: setDegradedAck,
    }),
    [mode, agentId, agentName, description, assistant, canAuthor, role, hasDraft, definition, form.data?.versionId, form.data?.hash, form.data?.status, models.data, models.isPending, lastTry, onTryEvent, onEditJump, onShipJump, saveSignal, publishSignal, consumePublishSignal, degradedAck, requestSave],
  );

  // — Build-mode loading / not-found / fetch-error (firsthand states, never blank) —

  // The engine client throws ApiError on 404, so a missing agent arrives as
  // assistant.isError (not data === null) — map it to the not-found state.
  const assistantNotFound =
    mode === 'build' &&
    (assistant.data === null ||
      (assistant.isError && assistant.error instanceof ApiError && assistant.error.status === 404));

  if (assistantNotFound) {
    return (
      <Shell>
        <NotFound>
          <NotFoundTitle>Agent not found</NotFoundTitle>
          <NotFoundBody>This agent doesn&apos;t exist or was removed.</NotFoundBody>
          <ActionButton size="sm" variant="secondary" onClick={() => navigate({ to: '/agent-studio/agents' })}>
            Back to Agents
          </ActionButton>
        </NotFound>
      </Shell>
    );
  }

  if (mode === 'build' && assistant.isError) {
    return (
      <Shell>
        <NotFound>
          <DefinitionErrorPanel title="Couldn't load the agent" onRetry={() => assistant.refetch()} />
        </NotFound>
      </Shell>
    );
  }

  if (mode === 'build' && assistant.data === undefined) {
    return (
      <Shell>
        <LoadingVeil>Loading the agent…</LoadingVeil>
      </Shell>
    );
  }

  return (
    <Shell>
      {guardDialog}
      {mode === 'build' && agentId && form.data?.versionId && (
        <div style={{ padding: '0 16px' }}>
          <TemplateBanner assistantId={agentId} versionId={form.data.versionId} />
        </div>
      )}
      <Main>
        <SectionNav
          entries={sectionEntries}
          selectedId={view}
          onSelect={handleSelectSection}
          locked={mode === 'new'}
        />
        {mode === 'new' && origin === 'choose' ? (
          <OriginScreen onBlank={() => setOrigin('blank')} />
        ) : view === OVERVIEW_ID ? (
          <OverviewScreen
            readiness={shipReadiness}
            entries={sectionEntries}
            versions={allVersions.data ?? []}
            workingVersion={{
              versionId: form.data?.versionId ?? null,
              status: form.data?.status ?? null,
              isDraft: hasDraft,
            }}
            activeVersionId={assistant.data?.activeVersionId ?? null}
            draftDefinition={definition}
            buildHref={agentId ? buildAgentEditPath(agentId) : '/agent-studio/agents'}
            onSelectSection={handleSelectSection}
          />
        ) : mode === 'build' && form.isError ? (
          <DefinitionErrorPanel title="Couldn't load the draft" onRetry={() => form.refetch()} />
        ) : (
          <SectionConfirmationContext.Provider value={{ confirmSection }}>
            <SectionBody
              sectionId={view}
              entry={selectedEntry}
            context={inspectorContext}
            purposeNodes={purposeNodeData}
            onPurposeSelect={handleSelectSection}
            purposeRef={purposeRef}
            onFormState={onFormState}
            onComposerDirty={onComposerDirty}
            onBrandDirty={onBrandDirty}
            onBrainDirty={onBrainDirty}
            onModelDirty={onModelDirty}
            onKnowledgeDirty={onKnowledgeDirty}
            onToolsDirty={onToolsDirty}
            onGuardrailsDirty={onGuardrailsDirty}
            onMemoryDirty={onMemoryDirty}
            onContextDirty={onContextDirty}
            onResponseDirty={onResponseDirty}
            onRoleDirty={onRoleDirty}
            onBudgetDirty={onBudgetDirty}
            onCreated={(id) => {
              // A2-02: creation consumed the Identity form — it is not "unsaved
              // changes". Clear it synchronously (flushSync) so the dirty
              // guard's shouldBlockFn sees clean state before we navigate.
              flushSync(() => {
                setFormState({ dirty: false, valid: false });
              });
              // Continue into the guided setup walkthrough (?setup=1)
              // instead of stranding the maker on the Overview.
              navigate({ to: buildAgentBuildPath(id), search: { setup: '1' } });
            }}
          />
          </SectionConfirmationContext.Provider>
        )}
      </Main>
      {mode === 'new' && (
        <BuilderBottomBar
          action={bottomAction}
          createReady={formState.valid}
          busy={false}
          onPrimary={handlePrimary}
        />
      )}
      {isSetupFlow && setupAction && (
        <BuilderBottomBar
          action={setupAction}
          createReady
          busy={false}
          onPrimary={handlePrimary}
          onBack={setupPrev ? () => handleSelectSection(setupPrev) : undefined}
          onExitSetup={handleExitSetup}
        />
      )}
    </Shell>
  );
}
