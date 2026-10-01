import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Circle, MoreHorizontal, Wrench, Zap } from 'lucide-react';
import { TextInput } from '@components/common/ui/TextInput';
import { Switch } from '@components/common/ui/Switch';
import { Segmented } from '@components/common/ui/Segmented';
import { ApiError } from '@lib/engine/client';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import {
  BUILT_IN_TOOLS,
  useToolCatalog,
  type ToolCatalogEntry,
} from '@hooks/studio/useSetupTools';
import {
  normalizeEffectfulApprovalDefault,
  normalizeToolEntry,
  type ConsumerApproval,
  type ConsumerTool,
  type ToolAccess,
  type ToolExecutionMode,
} from '@lib/engine/agent-payload';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import {
  BUILTIN_TOOL_APPROVAL,
  approvalSourceLabel,
  binaryFromEffective,
  binaryToEntryApproval,
  canBind,
  driftNames,
  effectMix,
  effectiveApprovalDetailed,
  formatRelativeTime,
  isBuiltinTool,
  isEffectfulTool,
  pinState,
  repinHash,
  ungatedEffectful,
  validateEntries,
  APPROVAL_PREVIEW_COPY,
  DRIFT_COPY,
  LINT_EFFECTFUL_COPY,
  SHADOW_COPY,
  TOOLS_MAX,
  UNBIND_COPY,
  SKIP_COPY,
  type BinaryApproval,
  type EffectiveSource,
  type PinState,
  type ToolRiskInput,
} from '../lib/tools-model';
import { ConflictDialog } from './ConflictDialog';
import { Whisper } from './InstructionsSection.styles';
import { SkeletonRows } from './SkeletonRows';
import { SectionGroup, SectionPage } from '../section-ui/SectionPage';
import { RailCard, RailTitle, TipCard, TipIcon, TipText } from '../section-ui/SectionPage.styles';
import {
  AmberPill,
  ApprovalDefaultLabel,
  ApprovalDefaultRow,
  ApprovalRow,
  BindAction,
  BoundLabel,
  BoundList,
  BoundRow,
  CardHead,
  CardIcon,
  CardSub,
  CardTitle,
  CardTitleWrap,
  CatalogList,
  CatalogName,
  CatalogRow,
  CatalogStatus,
  Chip,
  ChipRow,
  CountPill,
  DashedBind,
  DriftDot,
  DriftText,
  EffectChip,
  EmptyNote,
  ExpandPanel,
  FilterBar,
  FilterInputWrap,
  FixLine,
  Footnote,
  GateChip,
  GroupCard,
  IconButton,
  MenuCheck,
  MenuDivider,
  MenuItem,
  MenuList,
  MenuWrap,
  PanelBlock,
  PanelFixes,
  PanelLabel,
  PanelNoteAmber,
  PerimeterLabel,
  PerimeterRow,
  PerimeterRows,
  PillDot,
  RailDot,
  RailLabel,
  RailRow,
  RailValue,
  RowBar,
  RowChevron,
  RowExpand,
  RowIcon,
  RowName,
  RowSub,
  RowText,
  SourceLabel,
  SourceNote,
  StyledSelect,
  TextButton,
  ToggleLabel,
  ToggleRow,
  UngatedList,
  UngatedRow,
} from './ToolsSection.styles';

export interface ToolsSectionProps {
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

/** Normalize on read (missing → redesign defaults) so dirty-checking converges (C06 precedent). */
function readEntries(definition: AgentDefinition): ConsumerTool[] {
  return definition.tools.map((t) =>
    normalizeToolEntry({
      name: t.name,
      access: t.access,
      approval: t.approval,
      ...(t.schema_hash ? { schema_hash: t.schema_hash } : {}),
      execution_mode: t.execution_mode,
      enabled: (t as { enabled?: unknown }).enabled,
      expose_description_to_planner: (t as { expose_description_to_planner?: unknown }).expose_description_to_planner,
      log_call_payloads: (t as { log_call_payloads?: unknown }).log_call_payloads,
    }),
  );
}

function readApprovalDefault(definition: AgentDefinition): 'never' | 'always' {
  return normalizeEffectfulApprovalDefault(definition.effectful_approval_default);
}

interface BoundView {
  entry: ConsumerTool;
  builtin: boolean;
  row: ToolCatalogEntry | null;
  effectful: boolean;
  effectiveMode: 'required' | 'optional';
  effectiveSource: EffectiveSource;
  pin: PinState;
}

interface CatalogItem {
  key: string;
  name: string;
  builtin: boolean;
  bound: boolean;
  effectful: boolean;
  approvalRequirement: string | null;
  effectClass: string | null;
  executionEnvironment: string | null;
  egressDomains: string[];
  version: string | null;
  row: ToolCatalogEntry | null;
}

function EntryMenu({
  entryName,
  access,
  shadow,
  repinLabel,
  onAccess,
  onToggleShadow,
  onRepin,
  onUnbind,
}: {
  entryName: string;
  access: ToolAccess;
  shadow: boolean;
  repinLabel: string | null;
  onAccess: (access: ToolAccess) => void;
  onToggleShadow: () => void;
  onRepin: () => void;
  onUnbind: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open ]);

  return (
    <MenuWrap ref={wrapRef}>
      <IconButton
        type="button"
        aria-label={`More actions for ${entryName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontal size={16} />
      </IconButton>
      {open && (
        <MenuList role="menu">
          <MenuItem
            type="button"
            role="menuitemradio"
            aria-checked={access === 'read'}
            onClick={() => {
              onAccess('read');
              setOpen(false);
            }}
          >
            <MenuCheck>{access === 'read' && <Check size={13} />}</MenuCheck>Access: Read
          </MenuItem>
          <MenuItem
            type="button"
            role="menuitemradio"
            aria-checked={access === 'write'}
            onClick={() => {
              onAccess('write');
              setOpen(false);
            }}
          >
            <MenuCheck>{access === 'write' && <Check size={13} />}</MenuCheck>Access: Write
          </MenuItem>
          <MenuDivider />
          <MenuItem
            type="button"
            role="menuitemcheckbox"
            aria-checked={shadow}
            onClick={() => {
              onToggleShadow();
              setOpen(false);
            }}
          >
            <MenuCheck>{shadow && <Check size={13} />}</MenuCheck>Shadow mode
          </MenuItem>
          {repinLabel && (
            <MenuItem
              type="button"
              onClick={() => {
                onRepin();
                setOpen(false);
              }}
            >
              <MenuCheck />
              {repinLabel}
            </MenuItem>
          )}
          <MenuDivider />
          <MenuItem
            type="button"
            $danger
            onClick={() => {
              onUnbind();
              setOpen(false);
            }}
          >
            <MenuCheck />
            Unbind
          </MenuItem>
        </MenuList>
      )}
    </MenuWrap>
  );
}

/**
 * Tools — bound tools with entry-local switches, catalog binding,
 * perimeter, approvals. The proven save machine (debounce, PUT/POST, 409
 * adopt, 412 dialog, dirty flag) is byte-identical logic in a new
 * presentation; catalog authoring stays in the Tools library.
 */
export function ToolsSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
  saveSignal = 0,
}: ToolsSectionProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');

  // A4-67 — pin state must see disabled rows (a disabled bound tool is
  // "disabled", not "missing"). The bind picker below stays enabled-only.
  const catalog = useToolCatalog({ includeDisabled: true });
  const catalogRef = useRef<HTMLDivElement>(null);

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [entries, setEntries] = useState<ConsumerTool[]>(() => (definition ? readEntries(definition) : []));
  const [effectfulDefault, setEffectfulDefault] = useState<'never' | 'always'>(() =>
    definition ? readApprovalDefault(definition) : 'never',
  );
  const [filter, setFilter] = useState('');
  const [effectFilter, setEffectFilter] = useState<'all' | 'readonly' | 'effectful'>('all');
  const [approvalFilter, setApprovalFilter] = useState<'any' | 'required' | 'optional'>('any');
  const [expanded, setExpanded] = useState<string | null>(null);
  // T-BUG1: catalog rows expand independently of bound rows (separate key space).
  const [expandedCatalog, setExpandedCatalog] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const sendHashRef = useRef('');

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);

  const source = useMemo(
    () =>
      definition
        ? { tools: readEntries(definition), effectful_approval_default: readApprovalDefault(definition) }
        : { tools: [] as ConsumerTool[], effectful_approval_default: 'never' as const },
    [definition],
  );
  const current = useMemo(
    () => JSON.stringify({ tools: entries, effectful_approval_default: effectfulDefault }),
    [entries, effectfulDefault],
  );
  const dirty = current !== JSON.stringify(source);

  if (docKey !== sourceKey && !dirty) {
    setDocKey(sourceKey);
    setEntries(source.tools);
    setEffectfulDefault(source.effectful_approval_default);
  } else if (docKey !== sourceKey) {
    setDocKey(sourceKey);
  }

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const rows = useMemo(() => {
    const all = catalog.data ?? [];
    const byName = new Map(all.map((row) => [row.name, row]));
    // A4-67 — the bind picker offers enabled rows only; pin state (byName)
    // still resolves disabled rows so bound entries show "disabled".
    return { byName, list: all.filter((row) => row.enabled !== false) };
  }, [catalog.data]);

  const views: BoundView[] = useMemo(
    () =>
      entries.map((entry) => {
        const builtin = isBuiltinTool(entry.name, BUILT_IN_TOOLS);
        const row = rows.byName.get(entry.name) ?? null;
        const effectful = isEffectfulTool(row?.effectClass ?? null, builtin ? entry.name : null);
        const verdict = effectiveApprovalDetailed({
          entryApproval: entry.approval,
          catalogRequirement: row?.approvalRequirement ?? (builtin ? (BUILTIN_TOOL_APPROVAL[entry.name] ?? null) : null),
          effectful,
          agentDefault: effectfulDefault,
        });
        const pin = pinState(
          entry.schema_hash,
          row ? { hash: row.hash, version: row.version, enabled: row.enabled } : null,
          builtin,
        );
        return {
          entry,
          builtin,
          row,
          effectful,
          effectiveMode: verdict.mode,
          effectiveSource: verdict.source,
          pin,
        };
      }),
    [entries, rows, effectfulDefault],
  );

  const riskInputs: ToolRiskInput[] = useMemo(
    () =>
      views.map((v) => ({
        name: v.entry.name,
        effectful: v.effectful,
        effectiveMode: v.effectiveMode,
        pinKind: v.pin.kind,
      })),
    [views],
  );
  const ungated = useMemo(() => ungatedEffectful(riskInputs), [riskInputs]);
  const mix = useMemo(() => effectMix(riskInputs), [riskInputs]);
  const drifted = useMemo(() => driftNames(riskInputs), [riskInputs]);

  const catalogItems: CatalogItem[] = useMemo(() => {
    const boundNames = new Set(entries.map((e) => e.name));
    const items: CatalogItem[] = [];
    for (const name of BUILT_IN_TOOLS) {
      items.push({
        key: `builtin:${name}`,
        name,
        builtin: true,
        bound: boundNames.has(name),
        effectful: isEffectfulTool(null, name),
        approvalRequirement: BUILTIN_TOOL_APPROVAL[name] ?? null,
        effectClass: null,
        executionEnvironment: 'in_process',
        egressDomains: [],
        version: null,
        row: null,
      });
    }
    for (const row of rows.list) {
      items.push({
        key: `row:${row.name}`,
        name: row.name,
        builtin: false,
        bound: boundNames.has(row.name),
        effectful: isEffectfulTool(row.effectClass, null),
        approvalRequirement: row.approvalRequirement,
        effectClass: row.effectClass,
        executionEnvironment: row.executionEnvironment,
        egressDomains: row.allowedEgressDomains ?? [],
        version: row.version,
        row,
      });
    }
    return items;
  }, [entries, rows]);

  const q = filter.trim().toLowerCase();
  const visibleCatalog = catalogItems.filter((item) => {
    if (q !== '' && !item.name.toLowerCase().includes(q)) return false;
    if (effectFilter === 'readonly' && item.effectful) return false;
    if (effectFilter === 'effectful' && !item.effectful) return false;
    if (approvalFilter === 'required' && item.approvalRequirement !== 'REQUIRED') return false;
    if (approvalFilter === 'optional' && item.approvalRequirement === 'REQUIRED') return false;
    return true;
  });
  const CATALOG_PAGE = 50;
  const pagedCatalog = visibleCatalog.slice(0, CATALOG_PAGE);

  const environments = useMemo(() => {
    const set = new Set<string>();
    for (const v of views) {
      if (!v.builtin && v.row?.executionEnvironment) set.add(v.row.executionEnvironment);
    }
    return [...set].sort();
  }, [views]);
  const egressDomains = useMemo(() => {
    const set = new Set<string>();
    for (const v of views) {
      for (const d of v.row?.allowedEgressDomains ?? []) set.add(d);
    }
    return [...set].sort();
  }, [views]);
  const driftCheckedAgo = formatRelativeTime(catalog.dataUpdatedAt);

  const buildNext = useCallback((): AgentDefinition | null => {
    if (!definition) return null;
    return buildDraftPayload(definition, {
      tools: entries.map((e) => ({ ...e })),
      effectful_approval_default: effectfulDefault,
    });
  }, [definition, entries, effectfulDefault]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    const check = validateEntries(entries);
    if (!check.ok) messages.push(check.message);
    const next = buildNext();
    if (next) {
      messages.push(
        ...checkDefinitionCaps(next)
          .filter((issue) => issue.path === 'tools' || issue.path.startsWith('tools[') || issue.path === 'secrets')
          .map((i) => i.message),
      );
    }
    return messages;
  }, [entries, buildNext]);
  const blocked = heldMessages.length > 0;
  const pending = saveDraft.isPending || updateDraft.isPending;

  const sourcePolicyJson = useMemo(
    () => (definition ? JSON.stringify({ tools: definition.tools, effectful_approval_default: definition.effectful_approval_default }) : null),
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
                attempted: JSON.stringify({ tools: next.tools, effectful_approval_default: next.effectful_approval_default }),
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
          toast.success('A draft opened elsewhere — resumed it. Your tools stay; the next save writes to it.');
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
    pending,
    holdReason: () => heldMessages[0] ?? null,
  });

  const patchEntry = useCallback((name: string, patch: Partial<ConsumerTool>) => {
    setEntries((prev) => prev.map((e) => (e.name === name ? { ...e, ...patch } : e)));
  }, []);

  const unbind = useCallback((name: string) => {
    setEntries((prev) => prev.filter((e) => e.name !== name));
    toast.success(`Unbound “${name}”. ${UNBIND_COPY}`);
  }, []);

  const bindRow = useCallback(
    (row: ToolCatalogEntry) => {
      const hold = canBind(entries.length);
      if (!hold.ok) {
        toast.error(hold.message);
        return;
      }
      if (entries.some((e) => e.name === row.name)) return;
      setEntries((prev) => [
        ...prev,
        normalizeToolEntry({
          name: row.name,
          access: 'read',
          approval: 'never',
          ...(row.hash ? { schema_hash: row.hash } : {}),
          execution_mode: 'live',
        }),
      ]);
      toast.success(`Bound “${row.name}”${row.hash ? ' with hash pin' : ' — no hash on the row yet, pin it when published'} — saves with the draft.`);
    },
    [entries],
  );

  const bindBuiltin = useCallback(
    (name: string) => {
      const hold = canBind(entries.length);
      if (!hold.ok) {
        toast.error(hold.message);
        return;
      }
      if (entries.some((e) => e.name === name)) return;
      setEntries((prev) => [
        ...prev,
        normalizeToolEntry({ name, access: 'read', approval: 'never', execution_mode: 'live' }),
      ]);
      toast.success(`Bound “${name}” (built-in, no row needed) — saves with the draft.`);
    },
    [entries],
  );

  const scrollToCatalog = useCallback(() => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const pill =
    ungated.length > 0 ? (
      <AmberPill>
        <PillDot aria-hidden="true" />
        {ungated.length} ungated effectful
      </AmberPill>
    ) : null;

  const rail = (
    <>
      <RailCard>
        <RailTitle>On this page</RailTitle>
        <RailRow>
          <RailLabel>
            <RailDot $tone={entries.length > 0 ? 'ok' : 'muted'} aria-hidden="true" />
            Bound tools
          </RailLabel>
          <RailValue>{entries.length}</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>
            <RailDot $tone="muted" aria-hidden="true" />
            Catalog
          </RailLabel>
          <RailValue>{catalogItems.length}</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>
            <RailDot $tone={drifted.length > 0 ? 'warning' : 'ok'} aria-hidden="true" />
            Perimeter
          </RailLabel>
          <RailValue $tone={drifted.length > 0 ? 'warning' : undefined}>
            {drifted.length > 0 ? `${drifted.length} need attention` : 'pinned'}
          </RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>
            <RailDot $tone={ungated.length > 0 ? 'warning' : 'muted'} aria-hidden="true" />
            Approvals
          </RailLabel>
          <RailValue $tone={ungated.length > 0 ? 'warning' : undefined}>
            {ungated.length > 0 ? `${ungated.length} ungated` : 'gated'}
          </RailValue>
        </RailRow>
      </RailCard>
      <RailCard>
        <RailTitle>Effect mix</RailTitle>
        <RailRow>
          <RailLabel>
            <RailDot $tone="muted" aria-hidden="true" />
            Bound
          </RailLabel>
          <RailValue>{mix.bound}</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>
            <RailDot $tone="ok" aria-hidden="true" />
            Read-only binds
          </RailLabel>
          <RailValue>{mix.readOnly}</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>
            <RailDot $tone="warning" aria-hidden="true" />
            Effectful · ungated
          </RailLabel>
          <RailValue $tone={mix.effectfulUngated > 0 ? 'warning' : undefined}>{mix.effectfulUngated}</RailValue>
        </RailRow>
        <RailRow>
          <RailLabel>
            <RailDot $tone="muted" aria-hidden="true" />
            Effectful · gated
          </RailLabel>
          <RailValue>{mix.effectfulGated}</RailValue>
        </RailRow>
      </RailCard>
      <TipCard>
        <TipIcon>
          <Zap size={14} />
        </TipIcon>
        <TipText>Every bound tool is a promise the model may keep on your behalf. Bind the smallest set.</TipText>
      </TipCard>
    </>
  );

  if (!definition) {
    return (
      <SectionPage
        title="Tools"
        subtitle="Bind catalog tools the agent may call — and gate the effectful ones."
      >
        <SkeletonRows rows={4} />
      </SectionPage>
    );
  }

  const effectfulBoundCount = riskInputs.filter((r) => r.effectful).length;

  return (
      <SectionPage
        title="Tools"
        subtitle="Bind catalog tools the agent may call — and gate the effectful ones."
        pill={pill}
        rail={rail}
      >
        {/* BOUND TOOLS */}
        <SectionGroup label="Bound tools">
          <GroupCard>
            <CardHead>
              <CardIcon $tone={ungated.length > 0 ? 'warning' : 'ok'}>
                {ungated.length > 0 ? <AlertTriangle size={15} /> : <Check size={15} />}
              </CardIcon>
              <CardTitleWrap>
                <CardTitle>Bound tools</CardTitle>
                <CardSub>What the agent may call at runtime. Tools are optional — skipped is not broken.</CardSub>
              </CardTitleWrap>
              <CountPill>
                {entries.length} / {TOOLS_MAX}
              </CountPill>
            </CardHead>

            {entries.length === 0 ? (
              <EmptyNote>{SKIP_COPY}</EmptyNote>
            ) : (
              <BoundList>
                {views.map((view) => {
                  const { entry } = view;
                  const isOpen = expanded === entry.name;
                  const shadow = entry.execution_mode === 'shadow';
                  const chipVariant = !view.effectful ? 'readonly' : view.effectiveMode === 'optional' ? 'ungated' : 'gated';
                  const chipLabel = !view.effectful
                    ? 'read-only'
                    : view.effectiveMode === 'optional'
                      ? 'effectful · ungated'
                      : 'effectful · gated';
                  const attention = view.pin.kind === 'missing' || view.pin.kind === 'disabled' || view.pin.kind === 'stale';
                  const envLabel = view.builtin
                    ? 'in_process'
                    : (view.row?.executionEnvironment ?? 'in_process');
                  const egressLabel =
                    view.row?.allowedEgressDomains && view.row.allowedEgressDomains.length > 0
                      ? `egress: ${view.row.allowedEgressDomains.join(', ')}`
                      : 'no egress';
                  const binaryValue: BinaryApproval = binaryFromEffective(view.effectiveMode);
                  const sourceLabel = approvalSourceLabel(view.effectiveSource);
                  const repinTarget = repinHash(
                    view.row ? { hash: view.row.hash, version: view.row.version, enabled: view.row.enabled } : null,
                  );
                  return (
                    <BoundRow key={entry.name} $expanded={isOpen} $attention={attention}>
                      <RowBar>
                        <RowExpand
                          type="button"
                          onClick={() => setExpanded(isOpen ? null : entry.name)}
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${entry.name} settings`}
                        >
                          <RowIcon>
                            <Wrench size={14} />
                          </RowIcon>
                          <RowText>
                            <RowName>{entry.name}</RowName>
                            <RowSub>
                              {envLabel} · {egressLabel} · {view.effectful ? 'effectful' : 'read-only'}
                              {!entry.enabled ? ' · disabled' : ''}
                            </RowSub>
                          </RowText>
                          <EffectChip $variant={chipVariant}>{chipLabel}</EffectChip>
                          <RowChevron size={15} $open={isOpen} aria-hidden="true" />
                        </RowExpand>
                        {canAuthor && (
                          <Switch
                            checked={entry.enabled}
                            onChange={(next) => patchEntry(entry.name, { enabled: next })}
                            label={`Enable ${entry.name}`}
                            id={`enable-${entry.name}`}
                          />
                        )}
                        {canAuthor && (
                          <EntryMenu
                            entryName={entry.name}
                            access={entry.access}
                            shadow={shadow}
                            repinLabel={
                              view.pin.kind === 'stale' && repinTarget
                                ? `Re-pin to ${view.row?.version ?? 'live'}`
                                : null
                            }
                            onAccess={(access) => patchEntry(entry.name, { access })}
                            onToggleShadow={() =>
                              patchEntry(entry.name, {
                                execution_mode: (shadow ? 'live' : 'shadow') as ToolExecutionMode,
                              })
                            }
                            onRepin={() => {
                              if (repinTarget) patchEntry(entry.name, { schema_hash: repinTarget });
                            }}
                            onUnbind={() => unbind(entry.name)}
                          />
                        )}
                      </RowBar>

                      {isOpen && (
                        <ExpandPanel>
                          <PanelFixes>
                            {shadow && <FixLine $tone="info">{SHADOW_COPY}</FixLine>}
                            {view.pin.kind === 'stale' && (
                              <FixLine $tone="warning">
                                {`${DRIFT_COPY} Catalog is at ${view.pin.liveVersion ?? 'an unknown version'}.`}
                              </FixLine>
                            )}
                            {view.pin.kind === 'missing' && (
                              <FixLine $tone="error">
                                Not in the catalog or built-ins — publish refuses. Bind from the catalog or unbind it.
                              </FixLine>
                            )}
                            {view.pin.kind === 'disabled' && (
                              <FixLine $tone="error">
                                The catalog row is disabled — publish refuses. Enable it in the Tools library or unbind it.
                              </FixLine>
                            )}
                            {view.pin.kind === 'unpinned' && (
                              <FixLine $tone="info">
                                Pin discipline: no hash pin — legal, but the next catalog change drifts it silently.
                              </FixLine>
                            )}
                          </PanelFixes>

                          <PanelBlock>
                            <PanelLabel>Approval policy</PanelLabel>
                            {canAuthor ? (
                              <ApprovalRow>
                                <Segmented
                                  options={[
                                    { value: 'ungated', label: 'Run ungated' },
                                    { value: 'gated', label: 'Require approval' },
                                  ]}
                                  value={binaryValue}
                                  onChange={(value) =>
                                    patchEntry(entry.name, { approval: binaryToEntryApproval(value as BinaryApproval) })
                                  }
                                  size="sm"
                                  ariaLabel={`Approval policy for ${entry.name}`}
                                />
                                {sourceLabel && <SourceNote>{sourceLabel}</SourceNote>}
                              </ApprovalRow>
                            ) : (
                              <SourceNote>
                                {binaryValue === 'gated' ? 'Require approval' : 'Run ungated'}
                                {sourceLabel ? ` · ${sourceLabel}` : ''}
                              </SourceNote>
                            )}
                            {view.effectiveMode === 'optional' && (
                              <PanelNoteAmber>Every call runs ungated — listed in Approvals.</PanelNoteAmber>
                            )}
                          </PanelBlock>

                          <PanelBlock>
                            <PanelLabel>Entry-local switches</PanelLabel>
                            {canAuthor ? (
                              <>
                                <ToggleRow>
                                  <Switch
                                    checked={entry.expose_description_to_planner}
                                    onChange={(next) => patchEntry(entry.name, { expose_description_to_planner: next })}
                                    label={`Expose description to planner for ${entry.name}`}
                                    id={`planner-${entry.name}`}
                                  />
                                  <ToggleLabel>Expose description to planner</ToggleLabel>
                                </ToggleRow>
                                <ToggleRow>
                                  <Switch
                                    checked={entry.log_call_payloads}
                                    onChange={(next) => patchEntry(entry.name, { log_call_payloads: next })}
                                    label={`Log call payloads for ${entry.name}`}
                                    id={`logpayloads-${entry.name}`}
                                  />
                                  <ToggleLabel>Log call payloads</ToggleLabel>
                                </ToggleRow>
                              </>
                            ) : (
                              <SourceNote>
                                Expose description to planner: {entry.expose_description_to_planner ? 'on' : 'off'} · Log
                                call payloads: {entry.log_call_payloads ? 'on' : 'off'} · Access: {entry.access} ·{' '}
                                {shadow ? 'shadow' : 'live'}
                              </SourceNote>
                            )}
                          </PanelBlock>
                        </ExpandPanel>
                      )}
                    </BoundRow>
                  );
                })}
              </BoundList>
            )}

            {canAuthor && (
              <DashedBind type="button" onClick={scrollToCatalog}>
                + Bind from catalog
              </DashedBind>
            )}
            <Footnote>Unbinding removes the entry here — the catalog row stays in the Tools library.</Footnote>
          </GroupCard>
        </SectionGroup>

        {/* CATALOG */}
        <SectionGroup label="Catalog">
          <GroupCard>
            <div ref={catalogRef} style={{ scrollMarginTop: 12 }}>
              <CardHead>
                <CardIcon>
                  <Circle size={15} />
                </CardIcon>
                <CardTitleWrap>
                  <CardTitle>Catalog</CardTitle>
                  <CardSub>Authoring lives in the Tools library — here you bind and flip entry-local switches.</CardSub>
                </CardTitleWrap>
                <CountPill>{catalogItems.length} entries</CountPill>
                <TextButton type="button" onClick={() => navigate({ to: '/agent-studio/tools' })}>
                  Open library
                </TextButton>
              </CardHead>
            </div>

            {canAuthor ? (
              <>
                <FilterBar>
                  <FilterInputWrap>
                    <TextInput
                      aria-label="Filter catalog"
                      value={filter}
                      onChange={(event) => setFilter(event.target.value)}
                      placeholder="Filter by name, effect, approval…"
                    />
                  </FilterInputWrap>
                  <StyledSelect
                    aria-label="Filter by effect"
                    value={effectFilter}
                    onChange={(event) => setEffectFilter(event.target.value as 'all' | 'readonly' | 'effectful')}
                  >
                    <option value="all">Effect · All</option>
                    <option value="readonly">Effect · Read-only</option>
                    <option value="effectful">Effect · Effectful</option>
                  </StyledSelect>
                  <StyledSelect
                    aria-label="Filter by approval"
                    value={approvalFilter}
                    onChange={(event) => setApprovalFilter(event.target.value as 'any' | 'required' | 'optional')}
                  >
                    <option value="any">Approval · Any</option>
                    <option value="required">Approval · Required</option>
                    <option value="optional">Approval · Optional</option>
                  </StyledSelect>
                </FilterBar>

                {catalog.isPending ? (
                  <SkeletonRows rows={5} barHeight="52px" />
                ) : catalog.isError ? (
                  <Whisper $tone="amber">
                    The catalog is unreachable — bound entries above still save; binding resumes on reload.
                  </Whisper>
                ) : pagedCatalog.length === 0 ? (
                  <EmptyNote>No catalog rows match — register one in the Tools library.</EmptyNote>
                ) : (
                  <CatalogList>
                    {pagedCatalog.map((item) => {
                      // T-BUG1: catalog rows expand like bound rows (RowExpand +
                      // RowChevron + aria-expanded); 38b0461 shipped them static.
                      const catOpen = expandedCatalog === item.key;
                      const panelId = `catalog-detail-${item.key}`;
                      return (
                        <Fragment key={item.key}>
                          <CatalogRow>
                            <RowExpand
                              type="button"
                              onClick={() => setExpandedCatalog(catOpen ? null : item.key)}
                              aria-expanded={catOpen}
                              aria-controls={panelId}
                              aria-label={`${catOpen ? 'Collapse' : 'Expand'} ${item.name} details`}
                            >
                              <CatalogStatus aria-hidden="true">
                                {item.bound ? <Check size={15} color="currentColor" /> : <Circle size={14} />}
                              </CatalogStatus>
                              <CatalogName>{item.name}</CatalogName>
                              <RowChevron size={15} $open={catOpen} aria-hidden="true" />
                            </RowExpand>
                            <ChipRow>
                              {item.executionEnvironment && (
                                <Chip $tone="neutral">{item.executionEnvironment}</Chip>
                              )}
                              <Chip $tone="neutral">{item.egressDomains.length > 0 ? 'egress' : 'no egress'}</Chip>
                              <Chip $tone={item.effectful ? 'warning' : 'success'}>
                                {item.effectful ? 'effectful' : 'read-only'}
                              </Chip>
                              {item.approvalRequirement && (
                                <Chip $tone={item.approvalRequirement === 'REQUIRED' ? 'warning' : 'neutral'}>
                                  {item.approvalRequirement === 'REQUIRED' ? 'approval' : 'no approval'}
                                </Chip>
                              )}
                            </ChipRow>
                            <SourceLabel>{item.builtin ? 'built-in' : 'org'}</SourceLabel>
                            {item.bound ? (
                              <BoundLabel>Bound</BoundLabel>
                            ) : (
                              <BindAction
                                type="button"
                                onClick={() => (item.builtin ? bindBuiltin(item.name) : item.row && bindRow(item.row))}
                              >
                                Bind
                              </BindAction>
                            )}
                          </CatalogRow>
                          {catOpen && (
                            <ExpandPanel id={panelId}>
                              <PanelBlock>
                                <PanelLabel>Details</PanelLabel>
                                {item.row?.description && <SourceNote>{item.row.description}</SourceNote>}
                                <SourceNote>
                                  {item.version ? `version ${item.version}` : 'unversioned'}
                                  {' · '}effect class {item.effectClass ?? '—'}
                                  {' · '}approval{' '}
                                  {item.approvalRequirement === 'REQUIRED'
                                    ? 'required'
                                    : item.approvalRequirement === 'NONE'
                                      ? 'not required'
                                      : '—'}
                                  {' · '}environment {item.executionEnvironment ?? '—'}
                                  {' · '}egress{' '}
                                  {item.egressDomains.length > 0 ? item.egressDomains.join(', ') : 'none'}
                                  {item.row?.bindingHost && <> · host {item.row.bindingHost}</>}
                                  {item.row?.rateLimitPerRun != null && (
                                    <> · rate limit {item.row.rateLimitPerRun}/run</>
                                  )}
                                </SourceNote>
                              </PanelBlock>
                            </ExpandPanel>
                          )}
                        </Fragment>
                      );
                    })}
                  </CatalogList>
                )}
                {visibleCatalog.length > CATALOG_PAGE && (
                  <Footnote>
                    Showing {CATALOG_PAGE} of {visibleCatalog.length} — refine the filter to narrow it.
                  </Footnote>
                )}
              </>
            ) : (
              <Footnote>Catalog — binding needs an owner, admin, or developer — {denied}</Footnote>
            )}
            <Footnote>Entry names: 2–64, lowercase/digits/underscores. Catalog names keep their own rule.</Footnote>
          </GroupCard>
        </SectionGroup>

        {/* PERIMETER */}
        <SectionGroup label="Perimeter">
          <GroupCard>
            <CardHead>
              <CardIcon $tone={drifted.length > 0 ? 'warning' : 'ok'}>
                {drifted.length > 0 ? <AlertTriangle size={15} /> : <Check size={15} />}
              </CardIcon>
              <CardTitleWrap>
                <CardTitle>Perimeter</CardTitle>
                <CardSub>Environments, egress, and enablement — pinned at publish.</CardSub>
              </CardTitleWrap>
            </CardHead>

            {entries.length === 0 ? (
              <EmptyNote>Nothing bound — nothing to perimeter.</EmptyNote>
            ) : (
              <PerimeterRows>
                <PerimeterRow>
                  <PerimeterLabel>Environments</PerimeterLabel>
                  {environments.length > 0 ? (
                    <ChipRow>
                      {environments.map((env) => (
                        <Chip key={env} $tone="neutral">
                          {env}
                        </Chip>
                      ))}
                    </ChipRow>
                  ) : (
                    <DriftText>in_process only — nothing bound reaches an external environment.</DriftText>
                  )}
                </PerimeterRow>
                <PerimeterRow>
                  <PerimeterLabel>Egress destinations</PerimeterLabel>
                  {egressDomains.length > 0 ? (
                    <ChipRow>
                      {egressDomains.map((domain) => (
                        <Chip key={domain} $tone="neutral">
                          {domain}
                        </Chip>
                      ))}
                    </ChipRow>
                  ) : (
                    <DriftText>none declared</DriftText>
                  )}
                </PerimeterRow>
                <PerimeterRow>
                  <DriftDot $tone={drifted.length > 0 ? 'warning' : 'ok'} aria-hidden="true" />
                  <PerimeterLabel>Enablement drift</PerimeterLabel>
                  <DriftText>
                    {drifted.length > 0
                      ? `${drifted.length} need attention: ${drifted.join(', ')}`
                      : 'No drift'}
                    {driftCheckedAgo ? ` · ${driftCheckedAgo}` : ''}
                  </DriftText>
                  <TextButton type="button" onClick={() => void catalog.refetch()}>
                    Re-check
                  </TextButton>
                </PerimeterRow>
              </PerimeterRows>
            )}
            <Footnote>Catalog writes — owner/admin in the Tools library. Authorize denies on drift.</Footnote>
          </GroupCard>
        </SectionGroup>

        {/* APPROVALS */}
        <SectionGroup label="Approvals">
          <GroupCard>
            <CardHead>
              <CardIcon $tone={ungated.length > 0 ? 'warning' : 'ok'}>
                {ungated.length > 0 ? <AlertTriangle size={15} /> : <Check size={15} />}
              </CardIcon>
              <CardTitleWrap>
                <CardTitle>Approvals</CardTitle>
                <CardSub>Who pauses a call before it runs.</CardSub>
              </CardTitleWrap>
            </CardHead>

            <ApprovalDefaultRow>
              <ApprovalDefaultLabel>Default for effectful tools</ApprovalDefaultLabel>
              {canAuthor ? (
                <Segmented
                  options={[
                    { value: 'ungated', label: 'Run ungated' },
                    { value: 'gated', label: 'Require approval' },
                  ]}
                  value={effectfulDefault === 'always' ? 'gated' : 'ungated'}
                  onChange={(value) => setEffectfulDefault(binaryToEntryApproval(value as BinaryApproval))}
                  size="sm"
                  ariaLabel="Default approval for effectful tools"
                />
              ) : (
                <SourceNote>{effectfulDefault === 'always' ? 'Require approval' : 'Run ungated'}</SourceNote>
              )}
            </ApprovalDefaultRow>

            {ungated.length > 0 ? (
              <>
                <PanelLabel>Ungated effectful binds</PanelLabel>
                <UngatedList>
                  {ungated.map((tool) => (
                    <UngatedRow key={tool.name}>
                      <GateChip>{tool.name}</GateChip>
                      {canAuthor && (
                        <TextButton type="button" onClick={() => patchEntry(tool.name, { approval: 'always' })}>
                          Gate it
                        </TextButton>
                      )}
                    </UngatedRow>
                  ))}
                </UngatedList>
                <PanelNoteAmber>{APPROVAL_PREVIEW_COPY}</PanelNoteAmber>
              </>
            ) : (
              <EmptyNote>
                {effectfulBoundCount === 0
                  ? 'No effectful tools bound — nothing to gate.'
                  : 'Every effectful bind is gated — calls pause for a human in Approvals.'}
              </EmptyNote>
            )}
            {canAuthor && (
              <TextButton type="button" onClick={() => navigate({ to: '/agent-studio/approvals' })}>
                Open Approvals →
              </TextButton>
            )}
            <Footnote>Effectful-without-approval rows are tinted amber everywhere — legal, but visible.</Footnote>
          </GroupCard>
        </SectionGroup>

        {entries.some((entry) => {
          const v = views.find((x) => x.entry.name === entry.name);
          return v ? v.effectful && v.effectiveMode !== 'required' : false;
        }) && <Whisper $tone="amber">{LINT_EFFECTFUL_COPY}</Whisper>}

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
            selectTheirs={(live) =>
              JSON.stringify({ tools: live.tools, effectful_approval_default: live.effectful_approval_default })
            }
            onReloadTheirs={(theirs) => {
              try {
                const parsed = JSON.parse(theirs) as { tools?: unknown; effectful_approval_default?: unknown };
                if (Array.isArray(parsed.tools)) {
                  setEntries(
                    parsed.tools
                      .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
                      .map((t) =>
                        normalizeToolEntry({
                          name: typeof t.name === 'string' ? t.name : '',
                          access: t.access === 'write' ? 'write' : ('read' as ToolAccess),
                          approval: (['never', 'on_effect', 'always'] as const).includes(t.approval as ConsumerApproval)
                            ? (t.approval as ConsumerApproval)
                            : ('never' as ConsumerApproval),
                          ...(typeof t.schema_hash === 'string' ? { schema_hash: t.schema_hash } : {}),
                          execution_mode: (t.execution_mode === 'shadow' ? 'shadow' : 'live') as ToolExecutionMode,
                          enabled: t.enabled,
                          expose_description_to_planner: t.expose_description_to_planner,
                          log_call_payloads: t.log_call_payloads,
                        }),
                      )
                      .filter((e) => e.name !== ''),
                  );
                  setEffectfulDefault(normalizeEffectfulApprovalDefault(parsed.effectful_approval_default));
                }
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
