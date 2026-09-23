import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { ActionButton } from '@components/common/ui/ActionButton';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useAssistant, useAssistantDefinition, useAssistantVersions, useKnowledgeHealth, usePublishReadiness, DRAFT_WRITE_MUTATION_KEY } from '@hooks/studio/useAgentAuthoring';
import { useIsMutating } from '@tanstack/react-query';
import { useModelAvailability } from '@hooks/studio/useSetupModels';
import { useEvalRuns } from '@hooks/studio/useSetupEval';
import { useDocuments } from '@hooks/studio/useSetupKnowledge';
import { BUILT_IN_TOOLS, useToolCatalog } from '@hooks/studio/useSetupTools';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { BuilderTopBar } from './topbar/BuilderTopBar';
import { ComponentPalette } from './palette/ComponentPalette';
import { BuilderInspector, type InspectorContext } from './inspector/BuilderInspector';
import type { TraceEditTarget } from './inspector/TraceDrawer';
import { OriginScreen } from './origin/OriginScreen';
import { TemplateBanner } from '../templates/TemplateBanner';
import type { PurposeFormState, PurposeHandle } from './inspector/PurposeInspector';
import { BuilderBottomBar } from './bottombar/BuilderBottomBar';
import { deriveBottomAction, type BottomPrimary } from './lib/bottom-action';
import { knowledgeSlot, projectBuilderGraph } from './lib/projector';
import { selectVersionEvalState } from './lib/eval-model';
import type { PublishEditTarget } from './lib/publish-model';
import { satelliteKind, useBuilderUI } from './lib/builder-store';
import { usableRefs } from './lib/brain-model';
import {
  KIND_ORDER,
  SKIPPABLE_KINDS,
  buildAgentBuildPath,
  buildAgentEditPath,
  resolveInitialSlot,
  type SlotKind,
} from './lib/slot-model';
import { LoadingVeil, Main, NotFound, NotFoundBody, NotFoundTitle, Shell } from './AgentBuilder.styles';

// Lazy chunk: @xyflow/react code + CSS load only with builder routes
// (BUILD_PLAN.md §13 — list/detail bundles never pay for the circuit).
const AgentCanvas = lazy(() => import('./canvas/AgentCanvas').then((module) => ({ default: module.AgentCanvas })));

export interface AgentBuilderProps {
  mode: 'new' | 'build';
  /** Build mode only (route param, passed by the page — never read here). */
  agentId?: string | null;
  /**
   * C15 re-entry (?slot=): resume on a spine id or satellite kind once.
   * Unknown values and unbound kinds fall through to default selection —
   * never an error, never a surprise card.
   */
  initialSlot?: string | null;
}

/** Draft-emptiness per kind: only empty kinds may leave the working set (§4r2). */
function kindDraftEmpty(
  kind: SlotKind,
  definition: { context_policy: { knowledge_sources: string[]; memory_scope: string }; tools: unknown[]; brand: string } | null,
): boolean {
  if (!definition) return true;
  switch (kind) {
    case 'knowledge':
      return definition.context_policy.knowledge_sources.length === 0;
    case 'tools':
      return definition.tools.length === 0;
    case 'brand':
      return (definition.brand || '').trim() === '';
    case 'memory':
      // The default scope is a standing configuration, not absence.
      return false;
    case 'guardrails':
      // Platform defaults are runtime truth from birth.
      return false;
    case 'budget':
      // Platform defaults are runtime truth from birth.
      return false;
    case 'evaluation':
      // Runs are unread in C01 — never strand a kind the UI cannot see.
      return false;
  }
}

export function AgentBuilder({ mode, agentId = null, initialSlot = null }: AgentBuilderProps) {
  const navigate = useNavigate();
  const { role } = useOrg();
  const canAuthor = canSetup(role, 'setup:author');

  const assistant = useAssistant(mode === 'build' ? (agentId ?? null) : null, { enabled: mode === 'build' });
  const form = useAssistantDefinition(mode === 'build' ? (agentId ?? null) : null);
  const models = useModelAvailability({ enabled: mode === 'build' });
  // ACTIVE-version pin health (C05) — grades the knowledge satellite and the
  // bottom hint. Disabled in new mode: no assistant exists to read.
  const health = useKnowledgeHealth(mode === 'build' ? (agentId ?? null) : null);
  // Unconditional by design: one cached library read that warms the cache for
  // the Knowledge passes in both modes (no render depends on it in origin).
  const documents = useDocuments();
  const librarySlugs = useMemo(
    () => documents.data?.map((d) => d.sourceSlug).filter((s): s is string => typeof s === 'string') ?? null,
    [documents.data],
  );
  // Unconditional by design: one cached catalog read shared with the Tools
  // library (30s stale) that grades the tools satellite in both modes.
  const toolCatalog = useToolCatalog();
  // C10: shared-cache eval reads (same EVAL_KEY family the libraries use)
  // that grade the evaluation satellite. Disabled in new mode.
  const evalRuns = useEvalRuns(undefined, { enabled: mode === 'build' });
  const allVersions = useAssistantVersions(mode === 'build' ? (agentId ?? null) : null);
  // C14: shared publish-readiness derivation (same cache the Ship section
  // reads) that grades the ship spine for the working draft. Disabled in
  // new mode — locked there.
  const shipReadiness = usePublishReadiness(mode === 'build' ? (agentId ?? null) : null, form.data?.versionId ?? null, {
    enabled: mode === 'build',
  });

  const agentKey = mode === 'build' ? agentId : null;
  const {
    satellites,
    positions,
    selectedId,
    skipped,
    paletteFilter,
    hydrate,
    select,
    addSatellite,
    bindSatellite,
    deleteSatellite,
    setPosition,
    persistPositions,
    tidy,
    toggleSkip,
    setPaletteFilter,
  } = useBuilderUI();

  useEffect(() => {
    hydrate(agentKey);
  }, [agentKey, hydrate]);

  const [layoutRev, setLayoutRev] = useState(0);
  // Origin choice (C11, new mode only): the pre-circuit start screen.
  // 'choose' shows the origin paths; 'blank' restores the locked circuit
  // with the Purpose form. Template installs navigate away (build mode).
  const [origin, setOrigin] = useState<'choose' | 'blank'>('choose');
  const [formState, setFormState] = useState<PurposeFormState>({ dirty: false, valid: false });
  const [composerDirty, setComposerDirty] = useState(false);
  const [brandDirty, setBrandDirty] = useState(false);
  const [brainDirty, setBrainDirty] = useState(false);
  const [knowledgeDirty, setKnowledgeDirty] = useState(false);
  const purposeRef = useRef<PurposeHandle | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

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

  const [budgetDirty, setBudgetDirty] = useState(false);

  const onBudgetDirty = useCallback((dirty: boolean) => {
    setBudgetDirty(dirty);
  }, []);

  // Canvas try state for this load (C13): terminal turns report up from the
  // Try console; the response-spine grade reflects them, nothing else reads this.
  const [lastTry, setLastTry] = useState<{ at: string; failed: boolean } | null>(null);

  const onTryEvent = useCallback((event: { at: string; failed: boolean }) => {
    setLastTry(event);
  }, []);

  // Trace Edit jumps land on builder slots (C13): spines by id, satellite
  // kinds by their bound instance; an unbound kind is a no-op, never a jump
  // to nowhere.
  const onEditJump = useCallback(
    (target: TraceEditTarget) => {
      if (target === 'purpose' || target === 'brain') {
        select(target);
        return;
      }
      const instance = satellites.find((s) => s.kind === target);
      if (instance) {
        select(instance.id);
      }
    },
    [select, satellites],
  );

  // Ship fix jumps (C14): the evaluation satellite rides the same
  // select-by-kind rule; every other target is a trace jump. Disabled in
  // new mode — the Ship slot is locked there.
  const onShipJump = useCallback(
    (target: PublishEditTarget) => {
      if (mode === 'new') return;
      if (target === 'evaluation') {
        const instance = satellites.find((s) => s.kind === 'evaluation');
        if (instance) {
          select(instance.id);
        }
        return;
      }
      onEditJump(target);
    },
    [mode, satellites, select, onEditJump],
  );

  const onBrandDirty = useCallback((dirty: boolean) => {
    setBrandDirty(dirty);
  }, []);

  // Dirty guard: new-mode Purpose form + build-mode composer + brand voice + brain + knowledge + tools + guardrails + memory + budget.
  // (Selection, drags, and skips are UI state — rebuilding them is free.)
  const { dialog: guardDialog } = useDirtyGuard(
    (mode === 'new' && formState.dirty) || composerDirty || brandDirty || brainDirty || knowledgeDirty || toolsDirty || guardrailsDirty || memoryDirty || budgetDirty,
  );

  // A2-23: honest save readout — a draft write in flight must never display as "Saved".
  const draftWritesInFlight = useIsMutating({ mutationKey: [...DRAFT_WRITE_MUTATION_KEY] });

  const modelLabel = useCallback(
    (ref: string) => models.data?.find((m) => m.ref === ref)?.displayName ?? ref,
    [models.data],
  );

  const projected = useMemo(
    () =>
      projectBuilderGraph({
        mode,
        assistantName: agentName,
        hasDraft,
        definition,
        librarySlugs,
        satellites,
        positions,
        selectedId,
        skippedIds: skipped,
        modelLabel,
        models: models.data,
        knowledgeHealth: health.data ?? undefined,
        toolCatalog: toolCatalog.data ?? undefined,
        toolBuiltins: BUILT_IN_TOOLS,
        tryState: {
          hasRunnableVersion:
            (form.data?.versionId ?? null) !== null &&
            (hasDraft || form.data?.status === 'DRAFT' || form.data?.status === 'PUBLISHED'),
          lastTryAt: lastTry?.at ?? null,
          lastTryFailed: lastTry?.failed ?? false,
        },
        evalState: (() => {
          const row = (allVersions.data ?? []).find((v) => v.id === (form.data?.versionId ?? null)) ?? null;
          if (!row) return undefined;
          return selectVersionEvalState(evalRuns.data ?? [], { id: row.id, status: row.status, updatedAt: row.updatedAt });
        })(),
        shipReadiness:
          mode === 'build' && shipReadiness.rows.length > 0
            ? {
                verdict: shipReadiness.verdict,
                blockers: shipReadiness.rows.filter((row) => row.ok === false).length,
                checking: false,
              }
            : mode === 'build' && shipReadiness.isPending
              ? { verdict: 'unknown' as const, blockers: 0, checking: true }
              : undefined,
      }),
    [mode, agentName, hasDraft, definition, librarySlugs, satellites, positions, selectedId, skipped, modelLabel, models.data, health.data, toolCatalog.data, form.data?.versionId, form.data?.status, lastTry, evalRuns.data, allVersions.data, shipReadiness.rows, shipReadiness.verdict, shipReadiness.isPending],
  );

  const selectedNode = projected.nodes.find((n) => n.id === selectedId) ?? null;

  // Default selection = next-best-action (BUILD_PLAN.md §3): purpose at
  // origin, brain while model-less, knowledge once the scaffold stands.
  // C15 ?slot= re-entry wins over all of it, once per scope. Once per
  // scope — an explicit deselect (Esc) must stick, never reselect.
  const scopeKey = mode === 'new' ? 'new' : (agentId ?? 'none');
  const defaultedFor = useRef<string | null>(null);
  useEffect(() => {
    if (selectedId !== null || defaultedFor.current === scopeKey) return;
    if (mode === 'new') {
      defaultedFor.current = scopeKey;
      select('purpose');
      return;
    }
    if (form.data === undefined) return;
    if (initialSlot) {
      // Spines always exist; kinds only when bound (resolveInitialSlot).
      const resolved = resolveInitialSlot(initialSlot, satellites);
      if (resolved) {
        defaultedFor.current = scopeKey;
        select(resolved);
        return;
      }
    }
    defaultedFor.current = scopeKey;
    const brainReady = !!definition && definition.model_policy.allowed_models.length > 0;
    if (!brainReady) {
      select('brain');
      return;
    }
    const knowledge = satellites.find((s) => s.kind === 'knowledge');
    select(knowledge ? knowledge.id : 'purpose');
  }, [mode, scopeKey, selectedId, form.data, definition, satellites, select, initialSlot]);

  const boundKinds = useMemo(
    () => KIND_ORDER.filter((kind) => satellites.some((s) => s.kind === kind)),
    [satellites],
  );
  const liveKinds = useMemo(() => {
    if (!definition) return [];
    const live: SlotKind[] = [];
    if (definition.context_policy.knowledge_sources.length > 0) live.push('knowledge');
    if (definition.tools.length > 0) live.push('tools');
    if ((definition.brand || '').trim() !== '') live.push('brand');
    live.push('memory', 'guardrails');
    return live;
  }, [definition]);

  const selectedSkippableUntouched = useMemo(() => {
    if (!selectedNode || selectedNode.data.nodeType !== 'satellite' || !selectedNode.data.kind) return false;
    if (!SKIPPABLE_KINDS.has(selectedNode.data.kind)) return false;
    return selectedNode.data.status === 'untouched' || selectedNode.data.status === 'info';
  }, [selectedNode]);

  const bottomAction = useMemo(() => {
    // Knowledge attention (C05): the graded satellite's own verdict, computed
    // once — the bar never re-derives what canvas already decided.
    const grade = mode === 'build' && definition ? knowledgeSlot(definition, librarySlugs, health.data ?? undefined) : null;
    return deriveBottomAction({
      mode,
      purposeValid: mode === 'new' ? formState.valid : true,
      hasDraft,
      // Usability, not presence (C04): a loading catalog is not-ready-yet
      // (neutral copy downstream), an all-unusable set selects brain.
      brainReady: usableRefs(definition?.model_policy.allowed_models ?? [], models.data).length > 0,
      instructionsEmpty:
        mode === 'build' && hasDraft && (definition?.instructions.trim() ?? '') === '',
      knowledgeAttention: grade !== null && grade.status === 'attention' ? grade.subtitle : null,
      selectedSkippableUntouched: canAuthor && selectedSkippableUntouched,
      selectedSlot: selectedId,
    });
  }, [mode, formState.valid, hasDraft, definition, librarySlugs, health.data, models.data, canAuthor, selectedSkippableUntouched, selectedId]);

  // — Actions —

  const ensureKind = useCallback(
    (kind: SlotKind) => {
      if (mode === 'new') return;
      const existing = satellites.find((s) => s.kind === kind);
      if (existing) {
        select(existing.id);
        return;
      }
      if (!canAuthor) {
        toast.error(setupDeniedCopy(role, 'setup:author'));
        return;
      }
      const id = addSatellite();
      const result = bindSatellite(id, kind);
      if (result === 'invalid') {
        // Untrusted payload (see store) — drop the card we just made.
        deleteSatellite(id);
        return;
      }
      if (result !== 'ok') {
        // Defensive: singleton raced us — focus the winner, never duplicate.
        const winner = useBuilderUI.getState().satellites.find((s) => s.kind === kind);
        if (winner) select(winner.id);
        return;
      }
      select(id);
    },
    [mode, satellites, select, canAuthor, role, addSatellite, bindSatellite, deleteSatellite],
  );

  const handleBindKind = useCallback(
    (satelliteId: string, kind: SlotKind) => {
      const result = bindSatellite(satelliteId, kind);
      if (result === 'ok') {
        select(satelliteId);
        return;
      }
      if (result === 'invalid') return;
      if (result === 'duplicate') {
        const winner = satellites.find((s) => s.kind === kind);
        if (winner) select(winner.id);
        toast.success('That kind is already on the canvas — focused it.');
        return;
      }
      // 'occupied' / 'missing': the card changed under us — say so, stay put.
      toast.error('That card already has a type — pick an empty card.');
    },
    [bindSatellite, satellites, select],
  );

  const handlePrimary = useCallback(
    (primary: BottomPrimary) => {
      if (primary.action === 'create') {
        purposeRef.current?.submit();
        return;
      }
      if (primary.action === 'select') {
        // Kind targets (C05 'knowledge') resolve to the bound satellite —
        // spine ids pass through untouched.
        const bound = satellites.find((s) => s.kind === (primary.target as SlotKind));
        select(bound ? bound.id : primary.target);
        return;
      }
      if (agentId) navigate({ to: buildAgentEditPath(agentId) });
    },
    [agentId, navigate, select, satellites],
  );

  const handleSkip = useCallback(() => {
    if (!bottomAction.skipTarget) return;
    const unskipping = skipped.includes(bottomAction.skipTarget);
    toggleSkip(bottomAction.skipTarget);
    toast.success(unskipping ? 'Back on the circuit.' : 'Skipped — skipped is not broken. Revisit anytime from the circuit.');
  }, [bottomAction.skipTarget, skipped, toggleSkip]);

  const handleDeleteSelected = useCallback(() => {
    if (!selectedId || mode === 'new' || !canAuthor) return;
    const kind = satelliteKind(satellites, selectedId);
    if (kind === null) {
      // Empty card — always safe.
      deleteSatellite(selectedId);
      return;
    }
    if (kindDraftEmpty(kind, definition)) {
      deleteSatellite(selectedId, { draftEmpty: true });
      return;
    }
    toast.error('That component holds configuration — collapse it instead of removing it.');
  }, [selectedId, mode, canAuthor, satellites, definition, deleteSatellite]);

  const handlePortClick = useCallback(
    (kind: SlotKind) => {
      setPaletteFilter(kind);
      searchRef.current?.focus();
    },
    [setPaletteFilter],
  );

  const handleTidy = useCallback(() => {
    tidy();
    setLayoutRev((rev) => rev + 1);
  }, [tidy]);

  // Closed keyboard map, C01 subset (BUILD_PLAN.md §7b): Esc, N, kind keys, M, Delete.
  // Never fires from inputs (except Escape, which only ever deselects).
  // Kind keys summon-or-focus (singleton, §4r1) — the footer promises them.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inField =
        !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      if (event.key === 'Escape') {
        // Never strand unsaved input: Escape must not unmount the Purpose
        // form (new mode), the composer, the voice, brain, knowledge, tools,
        // guardrails, memory, or budget while any is dirty.
        // Dirty surfaces blur instead (their own Esc handlers); selection stays.
        if ((mode === 'new' && formState.dirty) || composerDirty || brandDirty || brainDirty || knowledgeDirty || toolsDirty || guardrailsDirty || memoryDirty || budgetDirty) return;
        select(null);
        setPaletteFilter(null);
        return;
      }
      if (inField || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (mode === 'new' || !canAuthor) return;
      // ⇧K summons knowledge (PLAN v2: bare K navigates to the Knowledge
      // library page studio-wide — the builder must not steal it).
      if (event.shiftKey && (event.key === 'K' || event.key === 'k')) {
        event.preventDefault();
        ensureKind('knowledge');
        return;
      }
      const kindKey: Record<string, SlotKind> = { t: 'tools', g: 'guardrails', b: 'brand', e: 'evaluation', s: 'budget' };
      const lower = event.key.toLowerCase();
      if (!event.shiftKey && kindKey[lower] !== undefined) {
        event.preventDefault();
        ensureKind(kindKey[lower] as SlotKind);
        return;
      }
      if (event.shiftKey && (event.key === 'M' || event.key === 'm')) {
        event.preventDefault();
        ensureKind('memory');
        return;
      }
      if (event.key === 'm' || event.key === 'M') {
        if (selectedSkippableUntouched && selectedId) {
          event.preventDefault();
          toggleSkip(selectedId);
        }
        return;
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        event.preventDefault();
        handleDeleteSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [select, setPaletteFilter, mode, formState.dirty, composerDirty, brandDirty, brainDirty, knowledgeDirty, toolsDirty, guardrailsDirty, memoryDirty, budgetDirty, canAuthor, selectedSkippableUntouched, selectedId, toggleSkip, handleDeleteSelected, ensureKind]);

  const inspectorContext: InspectorContext = useMemo(
    () => ({
      mode,
      agentId,
      agentName,
      description,
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
    }),
    [mode, agentId, agentName, description, canAuthor, role, hasDraft, definition, form.data?.versionId, form.data?.hash, form.data?.status, models.data, models.isPending, lastTry, onTryEvent, onEditJump, onShipJump],
  );

  // — Build-mode loading / not-found (firsthand states, never blank) —

  if (mode === 'build' && assistant.data === undefined) {
    return (
      <Shell>
        <LoadingVeil>Loading the circuit…</LoadingVeil>
      </Shell>
    );
  }

  if (mode === 'build' && assistant.data === null) {
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

  const syncing = assistant.isFetching || form.isFetching === true || models.isFetching || documents.isFetching;
  const saving = draftWritesInFlight > 0;
  const anySectionDirty =
    composerDirty || brandDirty || brainDirty || knowledgeDirty || toolsDirty || guardrailsDirty || memoryDirty || budgetDirty;
  const saveState = mode === 'new' ? 'saved' : saving ? 'saving' : anySectionDirty ? 'unsaved' : syncing ? 'syncing' : 'saved';

  return (
    <Shell>
      {guardDialog}
      <BuilderTopBar
        mode={mode}
        agentName={agentName}
        hasDraft={hasDraft}
        hasLive={hasLive}
        saveState={saveState}
        editPath={mode === 'build' && agentId ? buildAgentEditPath(agentId) : null}
      />
      {mode === 'build' && agentId && form.data?.versionId && (
        <div style={{ padding: '0 16px' }}>
          <TemplateBanner assistantId={agentId} versionId={form.data.versionId} />
        </div>
      )}
      <Main>
        <ComponentPalette
          ref={searchRef}
          boundKinds={boundKinds}
          liveKinds={liveKinds}
          filter={paletteFilter}
          onFilterChange={setPaletteFilter}
          onPickKind={ensureKind}
          locked={mode === 'new'}
          canAuthor={canAuthor}
        />
        <Suspense
          fallback={
            <LoadingVeil>
              <Skeleton $h="240px" $r="12px" />
            </LoadingVeil>
          }
        >
          {mode === 'new' && origin === 'choose' ? (
            <OriginScreen onBlank={() => setOrigin('blank')} />
          ) : (
            <AgentCanvas
              nodes={projected.nodes}
              edges={projected.edges}
              layoutRev={layoutRev}
              locked={mode === 'new'}
              onSelectNode={select}
              onNodePosition={setPosition}
              onPositionsCommitted={persistPositions}
              onDropKind={ensureKind}
              onPortClick={handlePortClick}
              onTidy={handleTidy}
            />
          )}
        </Suspense>
        <BuilderInspector
          selected={selectedNode}
          context={inspectorContext}
          purposeRef={purposeRef}
          onFormState={onFormState}
          onComposerDirty={onComposerDirty}
          onBrandDirty={onBrandDirty}
          onBrainDirty={onBrainDirty}
          onKnowledgeDirty={onKnowledgeDirty}
          onToolsDirty={onToolsDirty}
          onGuardrailsDirty={onGuardrailsDirty}
          onMemoryDirty={onMemoryDirty}
          onBudgetDirty={onBudgetDirty}
          onCreated={(id) => {
            // A2-02: creation consumed the Purpose form — it is not "unsaved
            // changes". Clear it synchronously (flushSync) so the dirty
            // guard's shouldBlockFn sees clean state before we navigate.
            flushSync(() => {
              setFormState({ dirty: false, valid: false });
            });
            navigate({ to: buildAgentBuildPath(id) });
          }}
          onBindKind={handleBindKind}
        />
      </Main>
      <BuilderBottomBar
        action={bottomAction}
        createReady={formState.valid}
        busy={false}
        onPrimary={handlePrimary}
        onSkip={handleSkip}
      />
    </Shell>
  );
}
