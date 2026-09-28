import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from '@tanstack/react-router';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { ActionButton } from '@components/common/ui/ActionButton';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useAssistant, useAssistantDefinition, useAssistantVersions, useKnowledgeHealth, usePublishReadiness, DRAFT_WRITE_MUTATION_KEY } from '@hooks/studio/useAgentAuthoring';
import { useIsMutating } from '@tanstack/react-query';
import { useModelAvailability } from '@hooks/studio/useSetupModels';
import { useEvalRuns } from '@hooks/studio/useSetupEval';
import { useDocuments } from '@hooks/studio/useSetupKnowledge';
import { BUILT_IN_TOOLS, useToolCatalog } from '@hooks/studio/useSetupTools';
import { useProviderCredentials } from '@hooks/studio/useSetupProviders';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { BuilderTopbarActions, BuilderTopbarIdentity } from './topbar/BuilderTopBar';
import { BuilderTopbarSlotsContext, type BuilderTopbarSlots } from './topbar/BuilderTopbarSlots';
import {
  clampWidth,
  loadPanelLayout,
  savePanelLayout,
  PALETTE_LIMITS,
  INSPECTOR_LIMITS,
  type PanelLayout,
} from './panels';
import { ComponentPalette, type PaletteHealth, type PaletteNodeEntry } from './palette/ComponentPalette';
import { BuilderInspector, type InspectorContext } from './inspector/BuilderInspector';
import type { TraceEditTarget } from './inspector/TraceDrawer';
import { OriginScreen } from './origin/OriginScreen';
import { TemplateBanner } from '../templates/TemplateBanner';
import type { PurposeFormState, PurposeHandle } from './inspector/PurposeInspector';
import { BuilderBottomBar } from './bottombar/BuilderBottomBar';
import { BuilderStatusBar } from './statusbar/BuilderStatusBar';
import { deriveBottomAction, type BottomPrimary } from './lib/bottom-action';
import { knowledgeSlot, projectBuilderGraph, FUNCTIONAL_NODE_IDS } from './lib/projector';
import { selectVersionEvalState } from './lib/eval-model';
import type { PublishEditTarget } from './lib/publish-model';
import { useBuilderUI } from './lib/builder-store';
import { usableRefs } from './lib/brain-model';
import {
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

export function AgentBuilder({ mode, agentId = null, initialSlot = null }: AgentBuilderProps) {
  const navigate = useNavigate();
  const { role, name: orgName } = useOrg();
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
    positions,
    selectedId,
    paletteFilter,
    hydrate,
    select,
    setPosition,
    persistPositions,
    tidy,
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

  // Trace Edit jumps land on builder slots (C13): fixed 16-node ids —
  // every TraceEditTarget IS a node id, so jumps select directly.
  const onEditJump = useCallback(
    (target: TraceEditTarget) => {
      select(target);
    },
    [select],
  );

  // Ship fix jumps (C14): every PublishEditTarget IS a fixed node id.
  // Disabled in new mode — the Ship slot is locked there.
  const onShipJump = useCallback(
    (target: PublishEditTarget) => {
      if (mode === 'new') return;
      select(target);
    },
    [mode, select],
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

  /**
   * Provider-credential count for the credentials node (v10 §8.3). Same
   * cached read the CredentialsPanel owns — React Query dedupes, so this is
   * no extra network. Disabled in new mode (node is locked there anyway).
   * ProviderCredential exposes no expiry field — expired stays 0 ("none
   * reported"), never invented.
   */
  const credentials = useProviderCredentials({ enabled: mode === 'build' });

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
        positions,
        selectedId,
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
                blockers: shipReadiness.rows.filter((row) => row.ok === false).length,
                checking: false,
              }
            : mode === 'build' && shipReadiness.isPending
              ? { verdict: 'unknown' as const, blockers: 0, checking: true }
              : undefined,
      }),
    [mode, agentName, hasDraft, definition, librarySlugs, positions, selectedId, modelLabel, models.data, health.data, toolCatalog.data, form.data?.versionId, form.data?.status, lastTry, evalRuns.data, allVersions.data, shipReadiness.rows, shipReadiness.verdict, shipReadiness.isPending, credentials.data],
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
      // All 16 ids exist (resolveInitialSlot) — unknown values fall
      // through to default selection, never an error.
      const resolved = resolveInitialSlot(initialSlot);
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
    select('knowledge');
  }, [mode, scopeKey, selectedId, form.data, definition, select, initialSlot]);

  // ── v10 palette mapping (WS-A) ─────────────────────────────────────
  // The 16 fixed lane nodes — lane assignment, per-node colors, and
  // readiness-derived health, all projected from contract truth. Nothing
  // is invented: every row rides the node's own grade.
  const paletteNodes = useMemo<PaletteNodeEntry[]>(() => {
    return projected.nodes.map((node) => ({
      id: node.id,
      label: node.data.title,
      color: node.data.color,
      statusText: node.data.subtitle ?? node.data.hint ?? '',
      status: node.data.status,
      lane: node.data.lane,
    }));
  }, [projected.nodes]);

  // Palette health (v10 §8.10): the 14 functional ids (everything except
  // context/response — the honest not-yet-available panels never count as
  // unconfigured). configured = 'ready' nodes among them; nextStep =
  // first attention/error, else first untouched, else null.
  const paletteHealth = useMemo<PaletteHealth>(() => {
    const functional = projected.nodes.filter((n) => (FUNCTIONAL_NODE_IDS as readonly string[]).includes(n.id));
    const configured = functional.filter((n) => n.data.status === 'ready').length;
    const next =
      functional.find((n) => n.data.status === 'attention' || n.data.status === 'error') ??
      functional.find((n) => n.data.status === 'untouched') ??
      null;
    return {
      configured,
      total: functional.length,
      blockers: mode === 'build' ? shipReadiness.rows.filter((row) => row.ok === false).length : 0,
      // No defensible advisory count exists yet (the only candidate,
      // noChangeHint, is boolean) — omitted rather than invented (§8.11).
      suggestions: 0,
      nextStep: next ? { label: next.data.title, nodeId: next.id } : null,
    };
  }, [projected.nodes, shipReadiness.rows, mode]);

  const handlePaletteFilterChange = useCallback(
    (filter: string | null) => setPaletteFilter(filter as SlotKind | null),
    [setPaletteFilter],
  );

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
        // Fixed 16-node ids — bottom-action targets select directly.
        select(primary.target);
        return;
      }
      if (agentId) navigate({ to: buildAgentEditPath(agentId) });
    },
    [agentId, navigate, select],
  );

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

  // A2-23: honest save readout — a draft write in flight must never display as "Saved".
  // Computed here (above the keyboard map) so the manual-save trigger can
  // no-op when nothing is dirty.
  const syncing = assistant.isFetching || form.isFetching === true || models.isFetching || documents.isFetching;
  const saving = draftWritesInFlight > 0;
  const anySectionDirty =
    composerDirty || brandDirty || brainDirty || knowledgeDirty || toolsDirty || guardrailsDirty || memoryDirty || budgetDirty;
  const saveState = mode === 'new' ? 'saved' : saving ? 'saving' : anySectionDirty ? 'unsaved' : syncing ? 'syncing' : 'saved';

  // Manual save signal (topbar Save button / Ctrl+S / ⌘S). Sections watch
  // this counter and fire their own doSave; only the mounted section is
  // listening, and doSave already guards on canAuthor/blocked/conflict.
  const [saveSignal, setSaveSignal] = useState(0);
  const requestSave = useCallback(() => {
    if (mode === 'new' || !canAuthor || !anySectionDirty) return;
    // No section mounted to hear the signal (e.g. explicit deselect) — no-op.
    if (selectedId === null) return;
    setSaveSignal((s) => s + 1);
  }, [mode, canAuthor, anySectionDirty, selectedId]);

  // Manual publish signal (v10 §8.12 — topbar Publish). Blocked clicks land
  // on the ship node (the gate truth lives there); unblocked clicks
  // increment the counter and the Ship section fires its publish flow.
  const [publishSignal, setPublishSignal] = useState(0);
  const handlePublish = useCallback(() => {
    if (mode === 'new' || !canAuthor) return;
    if (paletteHealth.blockers > 0) {
      select('ship');
      return;
    }
    setPublishSignal((s) => s + 1);
  }, [mode, canAuthor, paletteHealth.blockers, select]);

  /**
   * T15 — resizable + collapsible sidebars. Widths persist to localStorage.
   * During a drag the aside's style.width is mutated directly (no setState —
   * this is what keeps the drag at 60fps); the width commits on pointer-up.
   * `layoutRef` mirrors state so drag handlers never read stale closures,
   * and persisting happens outside setState updaters.
   */
  const [panelLayout, setPanelLayout] = useState<PanelLayout>(loadPanelLayout);
  const layoutRef = useRef(panelLayout);
  const paletteAsideRef = useRef<HTMLElement | null>(null);
  const inspectorAsideRef = useRef<HTMLElement | null>(null);
  const liveWidthRef = useRef<{ palette?: number; inspector?: number }>({});

  const updatePanelLayout = useCallback((patch: Partial<PanelLayout>) => {
    layoutRef.current = { ...layoutRef.current, ...patch };
    setPanelLayout(layoutRef.current);
    savePanelLayout(layoutRef.current);
  }, []);

  const handlePanelDelta = useCallback((side: 'palette' | 'inspector', dx: number) => {
    const limits = side === 'palette' ? PALETTE_LIMITS : INSPECTOR_LIMITS;
    const key = side === 'palette' ? 'paletteWidth' : 'inspectorWidth';
    const base = liveWidthRef.current[side] ?? layoutRef.current[key];
    // Right panel: its inner (resize) edge is on the left, so a rightward
    // pointer move narrows it — invert the delta.
    const next = clampWidth(base + (side === 'palette' ? dx : -dx), limits);
    liveWidthRef.current[side] = next;
    const aside = side === 'palette' ? paletteAsideRef.current : inspectorAsideRef.current;
    if (aside) aside.style.width = `${next}px`;
  }, []);

  const handlePanelEnd = useCallback(
    (side: 'palette' | 'inspector') => {
      const w = liveWidthRef.current[side];
      liveWidthRef.current[side] = undefined;
      if (w == null) return;
      if (side === 'palette') updatePanelLayout({ paletteWidth: w });
      else updatePanelLayout({ inspectorWidth: w });
    },
    [updatePanelLayout],
  );

  const collapsePanel = useCallback(
    (side: 'palette' | 'inspector') => {
      // A mid-drag collapse must not resurrect a stale live width on expand.
      liveWidthRef.current[side] = undefined;
      updatePanelLayout(side === 'palette' ? { paletteCollapsed: true } : { inspectorCollapsed: true });
    },
    [updatePanelLayout],
  );

  const expandPanel = useCallback(
    (side: 'palette' | 'inspector') => {
      liveWidthRef.current[side] = undefined;
      updatePanelLayout(side === 'palette' ? { paletteCollapsed: false } : { inspectorCollapsed: false });
    },
    [updatePanelLayout],
  );

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
          paletteCollapsed={panelLayout.paletteCollapsed}
          onRestorePalette={() => expandPanel('palette')}
        />
      ),
      actions: (
        <BuilderTopbarActions
          mode={mode}
          saveState={saveState}
          onSave={requestSave}
          canAuthor={canAuthor}
          onTestRun={() => select('try')}
          onPublish={handlePublish}
          blockingCount={paletteHealth.blockers}
          inspectorCollapsed={panelLayout.inspectorCollapsed}
          onRestoreInspector={() => expandPanel('inspector')}
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
    select,
    handlePublish,
    paletteHealth.blockers,
    panelLayout.paletteCollapsed,
    panelLayout.inspectorCollapsed,
    expandPanel,
  ]);

  // Closed keyboard map, v10 (BUILD_PLAN.md §7b): Esc, N, node keys.
  // Never fires from inputs (except Escape, which only ever deselects, and
  // Ctrl/⌘+S, the standard save shortcut — preventDefault stops the browser's
  // own save dialog).
  // Node keys select the fixed node id directly — the footer promises them.
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
      if ((event.ctrlKey || event.metaKey) && (event.key === 's' || event.key === 'S')) {
        event.preventDefault();
        requestSave();
        return;
      }
      if (inField || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (mode === 'new' || !canAuthor) return;
      // ⇧K selects knowledge (PLAN v2: bare K navigates to the Knowledge
      // library page studio-wide — the builder must not steal it).
      if (event.shiftKey && (event.key === 'K' || event.key === 'k')) {
        event.preventDefault();
        select('knowledge');
        return;
      }
      const nodeKey: Record<string, string> = { t: 'tools', g: 'guardrails', b: 'brand', e: 'evaluation', s: 'budget' };
      const lower = event.key.toLowerCase();
      if (!event.shiftKey && nodeKey[lower] !== undefined) {
        event.preventDefault();
        select(nodeKey[lower]);
        return;
      }
      if (event.shiftKey && (event.key === 'M' || event.key === 'm')) {
        event.preventDefault();
        select('memory');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [select, setPaletteFilter, mode, formState.dirty, composerDirty, brandDirty, brainDirty, knowledgeDirty, toolsDirty, guardrailsDirty, memoryDirty, budgetDirty, canAuthor, requestSave]);

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
      /** Manual save counter — sections fire doSave when it increments. */
      saveSignal,
      /**
       * Manual publish counter (v10 §8.12 — topbar Publish). The Ship
       * section fires its publish flow when this increments; blocked
       * clicks never reach it — they select the ship node instead.
       */
      publishSignal,
    }),
    [mode, agentId, agentName, description, canAuthor, role, hasDraft, definition, form.data?.versionId, form.data?.hash, form.data?.status, models.data, models.isPending, lastTry, onTryEvent, onEditJump, onShipJump, saveSignal, publishSignal],
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

  return (
    <BuilderTopbarSlotsContext.Provider value={topbarSlots}>
      <Shell>
        {guardDialog}
        {mode === 'build' && agentId && form.data?.versionId && (
          <div style={{ padding: '0 16px' }}>
            <TemplateBanner assistantId={agentId} versionId={form.data.versionId} />
          </div>
        )}
      <Main>
        {!panelLayout.paletteCollapsed && (
          <ComponentPalette
            ref={searchRef}
            asideRef={paletteAsideRef}
            // Intentional ref read during render (T15): the drag mutates the
            // aside width directly in the DOM; if an unrelated re-render lands
            // mid-drag, the prop must reflect the live width or React snaps it
            // back to the stale committed width. Read-only — never written here.
            // eslint-disable-next-line react-hooks/refs
            width={liveWidthRef.current.palette ?? panelLayout.paletteWidth}
            onResizeDelta={(dx) => handlePanelDelta('palette', dx)}
            onResizeEnd={() => handlePanelEnd('palette')}
            onCollapse={() => collapsePanel('palette')}
            nodes={paletteNodes}
            selectedId={selectedId}
            filter={paletteFilter}
            onFilterChange={handlePaletteFilterChange}
            onSelectNode={select}
            locked={mode === 'new'}
            canAuthor={canAuthor}
            health={paletteHealth}
            onHealthReview={() => select('ship')}
            onHealthNext={(nodeId) => select(nodeId)}
          />
        )}
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
              onPortClick={handlePortClick}
              onTidy={handleTidy}
              blockers={paletteHealth.blockers}
              suggestions={paletteHealth.suggestions}
              onValidate={() => {
                shipReadiness.retry();
                select('ship');
              }}
              onReviewIssues={() => select('ship')}
            />
          )}
        </Suspense>
        {!panelLayout.inspectorCollapsed && (
          <BuilderInspector
            selected={selectedNode}
          context={inspectorContext}
          nodes={paletteNodes}
          onSelectNode={select}
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
          asideRef={inspectorAsideRef}
          // Intentional ref read during render (T15): same as the palette —
          // keeps the live drag width stable across unrelated re-renders.
          // eslint-disable-next-line react-hooks/refs
          width={liveWidthRef.current.inspector ?? panelLayout.inspectorWidth}
          onResizeDelta={(dx) => handlePanelDelta('inspector', dx)}
          onResizeEnd={() => handlePanelEnd('inspector')}
          onCollapse={() => collapsePanel('inspector')}
          onCreated={(id) => {
            // A2-02: creation consumed the Purpose form — it is not "unsaved
            // changes". Clear it synchronously (flushSync) so the dirty
            // guard's shouldBlockFn sees clean state before we navigate.
            flushSync(() => {
              setFormState({ dirty: false, valid: false });
            });
            navigate({ to: buildAgentBuildPath(id) });
          }}
        />
        )}
      </Main>
      {mode === 'build' ? (
        <BuilderStatusBar
          configured={paletteHealth.configured}
          total={14}
          blockers={paletteHealth.blockers}
          suggestions={paletteHealth.suggestions}
          version={shipReadiness.version?.version ?? null}
          editPath={agentId ? buildAgentEditPath(agentId) : null}
        />
      ) : (
        <BuilderBottomBar
          action={bottomAction}
          createReady={formState.valid}
          busy={false}
          onPrimary={handlePrimary}
        />
      )}
      </Shell>
    </BuilderTopbarSlotsContext.Provider>
  );
}
