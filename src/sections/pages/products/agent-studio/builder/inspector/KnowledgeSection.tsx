import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Ellipsis, FileText, Minus, Pencil, Plus, TriangleAlert, X } from 'lucide-react';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { Switch } from '@components/common/ui/Switch';
import { Segmented } from '@components/common/ui/Segmented';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ApiError, engine } from '@lib/engine/client';
import { toastEngineError } from '@lib/engine/errors';
import { setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useKnowledgeHealth,
  useSaveDraftVersion,
  useUpdateDraftVersion,
  type AgentDefinition,
} from '@hooks/studio/useAgentAuthoring';
import {
  useAttachmentUpload,
  KNOWLEDGE_MEDIA_TYPES,
  type PasteUploadType,
} from '@hooks/studio/useAttachmentUpload';
import { useDocuments, useRenameDocumentSlug } from '@hooks/studio/useSetupKnowledge';
import { useConnectors, useSyncConnector } from '@hooks/studio/useSetupConnectors';
import { checkDefinitionCaps } from '@lib/engine/setup-caps';
import { buildDraftPayload } from '../lib/draft-save';
import { useDraftAutosave, useManualSaveSignal } from '../lib/use-draft-autosave';
import {
  canPin,
  coverageLabel,
  documentStateLabel,
  isSessionStalled,
  isRefreshPolicy,
  isRetrievalMode,
  matchPinToDocument,
  validateChunkOverlap,
  validateChunkSize,
  validateMaxResults,
  validatePins,
  validatePaste,
  validateSourceSlug,
  CHUNK_SIZE_MAX,
  CHUNK_SIZE_MIN,
  EMBEDDING_MODELS,
  MAX_RESULTS_DEFAULT,
  MAX_RESULTS_MAX,
  MAX_RESULTS_MIN,
  NO_RETRY_COPY,
  PINS_MAX,
  DEGRADED_ACK_COPY,
  REFRESH_POLICY_LABELS,
  REFRESH_POLICIES,
  REQUIRE_CITATIONS_DEFAULT,
  RERANK_DEFAULT,
  RETRIEVAL_MODE_DEFAULT,
  RETRIEVAL_MODE_LABELS,
  RETRIEVAL_MODES,
  RETRIEVAL_OFF_COPY,
  SKIP_COPY,
  SOURCE_DEFAULTS,
  STALLED_COPY,
  UNMAP_COPY,
  sessionStateLabel,
  slugifyFilename,
  PASTE_MEDIA_TYPES,
  type RefreshPolicy,
  type RetrievalMode,
  type SourceDefaults,
} from '../lib/knowledge-model';
import { ConflictDialog } from './ConflictDialog';
import { SkeletonRows } from './SkeletonRows';
import { StatusDot } from '../canvas/nodes/SlotNode.styles';
import { Whisper } from './InstructionsSection.styles';
import { MicroTip, PageOutline, SectionGroup, SectionPage } from '../section-ui/SectionPage';
import {
  BudgetBar,
  BudgetFill,
  RailCard,
  RailTitle,
} from '../section-ui/SectionPage.styles';
import { BlockerPill } from './ModelSection.styles';
import {
  Card,
  CardHeadRow,
  CardHelper,
  ConnectorList,
  ConnectorRow,
  ControlRow,
  ControlSub,
  ControlText,
  ControlTitle,
  DefaultsGrid,
  DropSub,
  DropTitle,
  Dropzone,
  EmptyPins,
  FieldGrid,
  FieldLabel,
  FileHead,
  FileMeta,
  FileName,
  FileRow,
  IconBtn,
  InlineForm,
  KebabItem,
  KebabMenu,
  KebabWrap,
  MonoLine,
  MutedButton,
  OrgBadge,
  PinActions,
  PinCard,
  PinCta,
  PinCounter,
  PinFix,
  PinHead,
  PinIcon,
  PinList,
  PinMeta,
  PinProgress,
  PinProgressLabel,
  PinState,
  PinTitle,
  Select,
  StaleBadge,
  StalePill,
  StatLabel,
  StatRow,
  StatRows,
  StatValue,
  StepBtn,
  Stepper,
  StepValue,
  Tab,
  TabPanel,
  TabStrip,
  TextButton,
  UploadList,
  ViewerNote,
  VisuallyHidden,
} from './KnowledgeSection.styles';

export interface KnowledgeSectionProps {
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

type AddTab = 'upload' | 'paste' | 'library' | 'connector';

interface UploadRow {
  key: number;
  file: File;
  slug: string;
  title: string;
}

const PASTE_LABELS: Record<PasteUploadType, string> = {
  'text/plain': 'Text',
  'text/markdown': 'Markdown',
  'text/csv': 'CSV',
  'application/json': 'JSON',
};

interface KnowledgeDraft {
  pins: string[];
  retrieval: boolean;
  maxResults: number;
  retrievalMode: RetrievalMode;
  rerank: boolean;
  requireCitations: boolean;
  sourceDefaults: SourceDefaults;
}

/**
 * Read the section's state from a definition. The retrieval extensions
 * (mode / rerank / citations / source defaults) hydrate when a definition
 * carries them; otherwise the documented defaults apply.
 */
function readKnowledge(definition: AgentDefinition): KnowledgeDraft {
  const policy = definition.knowledge_policy ?? {};
  const rawMode = policy.retrieval_mode;
  const rawRefresh = policy.source_defaults?.refresh_policy;
  const rawEmbedding = policy.source_defaults?.embedding_model;
  return {
    pins: definition.context_policy.knowledge_sources,
    retrieval: policy.retrieval_enabled ?? false,
    maxResults: policy.max_results ?? MAX_RESULTS_DEFAULT,
    retrievalMode: isRetrievalMode(rawMode) ? rawMode : RETRIEVAL_MODE_DEFAULT,
    rerank: policy.rerank ?? RERANK_DEFAULT,
    requireCitations: policy.require_citations ?? REQUIRE_CITATIONS_DEFAULT,
    sourceDefaults: {
      chunkSize: policy.source_defaults?.chunk_size ?? SOURCE_DEFAULTS.chunkSize,
      chunkOverlap: policy.source_defaults?.chunk_overlap ?? SOURCE_DEFAULTS.chunkOverlap,
      embeddingModel:
        typeof rawEmbedding === 'string' && rawEmbedding.length > 0 ? rawEmbedding : SOURCE_DEFAULTS.embeddingModel,
      refreshPolicy: isRefreshPolicy(rawRefresh) ? rawRefresh : SOURCE_DEFAULTS.refreshPolicy,
    },
  };
}

function emptyDraft(): KnowledgeDraft {
  return {
    pins: [],
    retrieval: false,
    maxResults: MAX_RESULTS_DEFAULT,
    retrievalMode: RETRIEVAL_MODE_DEFAULT,
    rerank: RERANK_DEFAULT,
    requireCitations: REQUIRE_CITATIONS_DEFAULT,
    sourceDefaults: { ...SOURCE_DEFAULTS },
  };
}

/**
 * Lightweight kebab popover for a pin row — Rename / Copy slug. A popover,
 * never a modal: closes on outside pointer-down or Escape.
 */
function RowKebab({
  slug,
  onRename,
  onCopySlug,
}: {
  slug: string;
  onRename: () => void;
  onCopySlug: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  return (
    <KebabWrap ref={wrapRef}>
      <IconBtn
        type="button"
        aria-label={`More actions for ${slug}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Ellipsis size={16} strokeWidth={2} />
      </IconBtn>
      {open && (
        <KebabMenu role="menu">
          <KebabItem
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onRename();
            }}
          >
            <Pencil size={14} strokeWidth={2} aria-hidden="true" /> Rename pin address
          </KebabItem>
          <KebabItem
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onCopySlug();
            }}
          >
            <Copy size={14} strokeWidth={2} aria-hidden="true" /> Copy slug
          </KebabItem>
        </KebabMenu>
      )}
    </KebabWrap>
  );
}

/**
 * Knowledge — retrieval policy, pinned sources, add sources, source
 * defaults. The proven save machine (8s debounce autosave, PUT/POST,
 * 409 adopt, 412 dialog, dirty flag) is preserved byte-for-byte in
 * behavior; the layout moves onto the SectionPage shell.
 *
 * Persistence: retrieval_mode / rerank / require_citations /
 * source_defaults are first-class wire fields (engine zod
 * knowledge_policy, additive v1.14 — the v1.13 model_policy.pipeline
 * precedent). buildNext writes them, toEnginePayload picks them, and the
 * engine echoes them back, so dirty detection and resync treat them like
 * every other field. readKnowledge hydrates them when a definition
 * carries them; otherwise the documented defaults apply.
 */
export function KnowledgeSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
  saveSignal = 0,
}: KnowledgeSectionProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { role, orgId } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');

  const documents = useDocuments();
  const rename = useRenameDocumentSlug();
  const { uploads, attach, attachText, dismiss } = useAttachmentUpload();
  const connectors = useConnectors();
  const syncConnector = useSyncConnector();
  const health = useKnowledgeHealth(assistantId, versionId);

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const initial = definition ? readKnowledge(definition) : emptyDraft();
  const [docKey, setDocKey] = useState(sourceKey);
  const [pins, setPins] = useState<string[]>(initial.pins);
  const [retrieval, setRetrieval] = useState(initial.retrieval);
  const [maxResults, setMaxResults] = useState(initial.maxResults);
  // Retrieval extensions — first-class wire fields (v1.14); part of
  // dirty/buildNext like every other field.
  const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>(initial.retrievalMode);
  const [rerank, setRerank] = useState(initial.rerank);
  const [requireCitations, setRequireCitations] = useState(initial.requireCitations);
  const [sourceDefaults, setSourceDefaults] = useState<SourceDefaults>(initial.sourceDefaults);
  const [tab, setTab] = useState<AddTab>('upload');
  const [filter, setFilter] = useState('');
  const [renameState, setRenameState] = useState<{ docId: string; oldSlug: string; value: string } | null>(null);
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [authorizing, setAuthorizing] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteMedia, setPasteMedia] = useState<PasteUploadType>('text/markdown');
  const [pasteSlug, setPasteSlug] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [adopting, setAdopting] = useState<string | null>(null);
  const [repinning, setRepinning] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef(0);
  const toastedReady = useRef<Set<string>>(new Set());
  const sendHashRef = useRef('');

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);

  const source = useMemo(() => (definition ? readKnowledge(definition) : emptyDraft()), [definition]);
  const current = useMemo(
    () =>
      JSON.stringify({ pins, retrieval, maxResults, retrievalMode, rerank, requireCitations, sourceDefaults }),
    [pins, retrieval, maxResults, retrievalMode, rerank, requireCitations, sourceDefaults],
  );
  const dirty =
    current !==
    JSON.stringify({
      pins: source.pins,
      retrieval: source.retrieval,
      maxResults: source.maxResults,
      retrievalMode: source.retrievalMode,
      rerank: source.rerank,
      requireCitations: source.requireCitations,
      sourceDefaults: source.sourceDefaults,
    });

  if (docKey !== sourceKey && !dirty) {
    setDocKey(sourceKey);
    setPins(source.pins);
    setRetrieval(source.retrieval);
    setMaxResults(source.maxResults);
    setRetrievalMode(source.retrievalMode);
    setRerank(source.rerank);
    setRequireCitations(source.requireCitations);
    setSourceDefaults(source.sourceDefaults);
  } else if (docKey !== sourceKey) {
    setDocKey(sourceKey);
  }

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  // Ingestion completions refresh the inventory (tracker rows are session
  // truth; the table is document truth — the refresh joins them).
  useEffect(() => {
    for (const upload of uploads) {
      if (upload.status === 'ready' && !toastedReady.current.has(upload.sessionId)) {
        toastedReady.current.add(upload.sessionId);
        void queryClient.invalidateQueries({ queryKey: ['studio', 'setup', 'knowledge'] });
        toast.success(
          upload.sourceSlug ? `Ready — pin “${upload.sourceSlug}” below to serve it.` : 'Ready — pin its slug below to serve it.',
        );
      }
    }
  }, [uploads, queryClient]);

  const buildNext = useCallback((): AgentDefinition | null => {
    if (!definition) return null;
    return buildDraftPayload(definition, {
      context_policy: { ...definition.context_policy, knowledge_sources: pins },
      knowledge_policy: {
        ...(definition.knowledge_policy ?? { retrieval_enabled: false, max_results: MAX_RESULTS_DEFAULT }),
        retrieval_enabled: retrieval,
        max_results: maxResults,
        // v1.14 retrieval extensions — first-class wire fields (the engine
        // echoes them back, so dirty/resync treat them like the rest).
        retrieval_mode: retrievalMode,
        rerank,
        require_citations: requireCitations,
        source_defaults: {
          chunk_size: sourceDefaults.chunkSize,
          chunk_overlap: sourceDefaults.chunkOverlap,
          embedding_model: sourceDefaults.embeddingModel,
          refresh_policy: sourceDefaults.refreshPolicy,
        },
      },
    });
  }, [definition, pins, retrieval, maxResults, retrievalMode, rerank, requireCitations, sourceDefaults]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    const pinsCheck = validatePins(pins);
    if (!pinsCheck.ok) messages.push(pinsCheck.message);
    const maxCheck = validateMaxResults(maxResults);
    if (!maxCheck.ok) messages.push(maxCheck.message);
    const chunkCheck = validateChunkSize(sourceDefaults.chunkSize);
    if (!chunkCheck.ok) messages.push(chunkCheck.message);
    const overlapCheck = validateChunkOverlap(sourceDefaults.chunkOverlap, sourceDefaults.chunkSize);
    if (!overlapCheck.ok) messages.push(overlapCheck.message);
    const next = buildNext();
    if (next) {
      messages.push(
        ...checkDefinitionCaps(next)
          .filter((issue) => issue.path === 'knowledge_policy' || issue.path.startsWith('knowledge_policy.'))
          .map((i) => i.message),
      );
    }
    return messages;
  }, [pins, maxResults, sourceDefaults, buildNext]);
  const blocked = heldMessages.length > 0;
  const pending = saveDraft.isPending || updateDraft.isPending;

  const sourcePolicyJson = useMemo(
    () =>
      definition
        ? JSON.stringify({
          context_policy: { knowledge_sources: definition.context_policy.knowledge_sources },
          knowledge_policy: definition.knowledge_policy ?? null,
        })
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
                  ? (error.details as Record<string, unknown>) : {};
              setConflict({
                expectedHash: versionHash,
                currentHash: typeof details.current === 'string' ? details.current : null,
                attempted: JSON.stringify({
                  context_policy: { knowledge_sources: next.context_policy.knowledge_sources },
                  knowledge_policy: next.knowledge_policy,
                }),
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
          toast.success('A draft opened elsewhere — resumed it. Your pins stay; the next save writes to it.');
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

  const unmap = useCallback(
    (slug: string) => {
      setPins((prev) => prev.filter((s) => s !== slug));
      toast.success(`Unmapped “${slug}”. ${UNMAP_COPY}`);
    },
    [],
  );

  const pin = useCallback(
    (slug: string) => {
      const normalized = slug.trim().toLowerCase();
      const hold = canPin(pins.length);
      if (!hold.ok) {
        toast.error(hold.message);
        return;
      }
      if (pins.includes(normalized)) return;
      setPins((prev) => [...prev, normalized]);
      toast.success(`Pinned “${normalized}” — saves with the draft.`);
    },
    [pins],
  );

  const repin = useCallback(
    (slug: string) => {
      // Re-pin advances the DRAFT's pin to the library's latest READY
      // version (engine route, OCC via If-Match, idempotent). The draft
      // version changes, so authoring queries (incl. health) refresh.
      if (!canAuthor || !orgId || !isDraft || !versionId || !versionHash || repinning) return;
      setRepinning(slug);
      void (async () => {
        try {
          await engine(
            `/console/org/${orgId}/assistants/${assistantId}/versions/${versionId}/knowledge-pins/repin`,
            {
              method: 'POST',
              body: { slug },
              headers: { 'If-Match': versionHash },
              idempotent: true,
            },
          );
          toast.success(`Re-pinned “${slug}” to the latest library version.`);
          void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
        } catch (error) {
          if (error instanceof ApiError && error.status === 412) {
            // The draft moved under us — reload the fresh hash; the 412
            // panel flow is owned by doSave, here a re-read is enough.
            void queryClient.invalidateQueries({ queryKey: ['studio', 'assistants'] });
            toast.error('The draft changed — reloaded. Try re-pinning again.');
          } else {
            toastEngineError(error, 'Could not re-pin the source');
          }
        } finally {
          setRepinning(null);
        }
      })();
    },
    [canAuthor, orgId, isDraft, versionId, versionHash, repinning, assistantId, queryClient],
  );

  const copySlug = useCallback((slug: string) => {
    void navigator.clipboard
      .writeText(slug)
      .then(() => toast.success(`Copied “${slug}”.`))
      .catch(() => toast.error('Could not copy the slug.'));
  }, []);

  /**
   * 0086 — the ingestion overrides for a new source: the section's current
   * source_defaults travel on the upload session so the engine chunks and
   * embeds exactly the way the maker configured. Memoized on the three
   * scalars so the upload/paste callbacks below always send the current
   * values (no stale closure).
   */
  const ingestionOverrides = useMemo(
    () => ({
      chunkSize: sourceDefaults.chunkSize,
      chunkOverlap: sourceDefaults.chunkOverlap,
      embeddingModel: sourceDefaults.embeddingModel,
    }),
    [sourceDefaults.chunkSize, sourceDefaults.chunkOverlap, sourceDefaults.embeddingModel],
  );

  const authorizeUploads = useCallback(() => {
    if (rows.length === 0 || authorizing) return;
    setAuthorizing(true);
    void (async () => {
      let authorized = 0;
      let unsupported = 0;
      for (const row of rows) {
        try {
          const sessionId = await attach({
            file: row.file,
            ...(row.slug.trim() ? { sourceSlug: row.slug.trim().toLowerCase() } : {}),
            ...(row.title.trim() ? { title: row.title.trim() } : {}),
            ingestionOverrides,
          });
          if (sessionId === null) unsupported += 1;
          else authorized += 1;
        } catch (error) {
          toast.error(error instanceof Error ? `${row.file.name}: ${error.message}` : `${row.file.name}: upload failed`);
        }
      }
      if (unsupported > 0) toast.error(`${unsupported} file${unsupported === 1 ? '' : 's'} not a supported type.`);
      if (authorized > 0) toast.success(`${authorized} upload${authorized === 1 ? '' : 's'} authorized — tracking ingestion below.`);
      setRows([]);
      setAuthorizing(false);
    })();
  }, [rows, authorizing, attach, ingestionOverrides]);

  const ingestPaste = useCallback(() => {
    if (pasting) return;
    const pasteCheck = validatePaste(pasteText, pasteMedia);
    if (!pasteCheck.ok) {
      toast.error(pasteCheck.message);
      return;
    }
    const slugProblem = validateSourceSlug(pasteSlug);
    if (slugProblem) {
      toast.error(`Pin address: ${slugProblem}`);
      return;
    }
    setPasting(true);
    void (async () => {
      try {
        const sessionId = await attachText({
          text: pasteText,
          slug: pasteSlug.trim().toLowerCase(),
          mediaType: pasteCheck.mediaType,
          ...(pasteTitle.trim() ? { title: pasteTitle.trim() } : {}),
          ingestionOverrides,
        });
        if (sessionId === null) {
          toast.error('Paste could not start — try again.');
        } else {
          toast.success('Paste authorized — tracking ingestion below. Pin its slug once READY.');
          setPasteText('');
          setPasteSlug('');
          setPasteTitle('');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Paste upload failed.');
      } finally {
        setPasting(false);
      }
    })();
  }, [pasting, pasteText, pasteMedia, pasteSlug, pasteTitle, attachText, ingestionOverrides]);

  const scrollToGroup = useCallback((key: string) => {
    document.getElementById(`knowledge-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const pinFromLibrary = useCallback(() => {
    setTab('library');
    scrollToGroup('add');
  }, [scrollToGroup]);

  const resetSourceDefaults = useCallback(() => {
    setSourceDefaults({ ...SOURCE_DEFAULTS });
    toast.success('Source defaults reset.');
  }, []);

  const onEscapeBlur = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && event.target instanceof HTMLElement) {
      event.target.blur();
    }
  }, []);

  if (!definition) {
    return (
      <SectionPage title="Knowledge" subtitle="Ground answers in pinned sources.">
        <SkeletonRows rows={4} />
      </SectionPage>
    );
  }

  const inventory = documents.data ?? [];
  const healthPins = health.data?.pins ?? [];
  const degraded = health.data?.degraded === true;
  const undercovered = healthPins.some((p) => p.embeddingComplete === false);
  const unresolvedCount = pins.filter((slug) => matchPinToDocument(slug, inventory).resolved === false).length;
  // Live staleness comes from the engine's knowledge-health (the pinned
  // version vs the library's latest READY version per slug) — never
  // invented client-side.
  const staleSlugs = useMemo(
    () => new Set(healthPins.filter((p) => p.stale).map((p) => p.sourceSlug)),
    [healthPins],
  );

  const indexedCount = inventory.filter((d) => d.state === 'ready').length;
  const indexingCount = inventory.filter((d) => d.state === 'processing').length;

  const outlineItems = [
    {
      key: 'retrieval',
      label: 'Retrieval',
      meta: retrieval ? `${maxResults} / query` : 'Off',
      done: retrieval && pins.length > 0,
    },
    {
      key: 'pinned',
      label: 'Pinned sources',
      meta: `${pins.length} / ${PINS_MAX}`,
      done: pins.length > 0,
    },
    { key: 'add', label: 'Add sources', meta: '', done: false },
    {
      key: 'defaults',
      label: 'Source defaults',
      meta: `${sourceDefaults.chunkSize}/${sourceDefaults.chunkOverlap}`,
      done: true,
    },
  ];

  const libraryRows = (() => {
    const q = filter.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(
      (d) => d.sourceSlug.toLowerCase().includes(q) || (d.title?.toLowerCase().includes(q) ?? false),
    );
  })();

  const rowProblems = rows.map((row) => (row.slug.trim() ? validateSourceSlug(row.slug) : null));
  const rowsBlocked = rowProblems.some((p) => p !== null);
  const chunkSizeProblem = validateChunkSize(sourceDefaults.chunkSize);
  const chunkOverlapProblem = validateChunkOverlap(sourceDefaults.chunkOverlap, sourceDefaults.chunkSize);
  const refreshModeWord = sourceDefaults.refreshPolicy === 'pin_version' ? 'pinned' : 'track-latest';

  const renderPinRow = (slug: string) => {
    const matched = matchPinToDocument(slug, inventory);
    const healthPin = healthPins.find((p) => p.sourceSlug === slug);
    const isStale = staleSlugs.has(slug);
    if (!matched.resolved) {
      return (
        <PinCard key={slug} $tone="attention">
          <PinHead>
            <PinIcon aria-hidden="true">
              <FileText size={15} strokeWidth={2} />
            </PinIcon>
            <PinTitle>{slug}</PinTitle>
            <PinState>Unresolved</PinState>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              <IconBtn type="button" aria-label={`Unmap ${slug}`} onClick={() => unmap(slug)}>
                <X size={15} strokeWidth={2} aria-hidden="true" />
                <VisuallyHidden>Unmap</VisuallyHidden>
              </IconBtn>
            </span>
          </PinHead>
          <MonoLine>kb/{slug}</MonoLine>
          <PinFix>Unresolved pin — publish refuses without the degraded-knowledge ack.</PinFix>
        </PinCard>
      );
    }
    const doc = matched.document;
    const docLabel = documentStateLabel(doc.state);
    const coverage =
      healthPin?.embeddingComplete === true
        ? { word: 'ready-for-retrieval', detail: 'Covered for the current model.' }
        : healthPin?.embeddingComplete === false
          ? coverageLabel('incomplete', 'the current model')
          : null;
    const tone =
      doc.state === 'failed' ? 'error' : coverage && coverage.word !== 'ready-for-retrieval' ? 'attention' : health.data === undefined ? 'info' : 'ok';
    return (
      <PinCard key={slug} $tone={tone}>
        <PinHead>
          <PinIcon aria-hidden="true">
            <FileText size={15} strokeWidth={2} />
          </PinIcon>
          <PinTitle title={doc.title ?? slug}>{slug}</PinTitle>
          <PinState>{docLabel.word}</PinState>
          {isStale && (
            <StalePill>
              Stale — v{healthPin?.pinnedVersion ?? '—'} → v{healthPin?.latestVersion ?? '—'} in library
            </StalePill>
          )}
          {isStale && canAuthor && isDraft && versionId && (
            <TextButton type="button" onClick={() => repin(slug)} disabled={repinning === slug}>
              {repinning === slug ? 'Re-pinning…' : 'Re-pin'}
            </TextButton>
          )}
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 2, alignItems: 'center' }}>
            {canAuthor && (
              <RowKebab
                slug={slug}
                onRename={() => setRenameState({ docId: doc.id, oldSlug: slug, value: slug })}
                onCopySlug={() => copySlug(slug)}
              />
            )}
            {canAuthor && (
              <IconBtn type="button" aria-label={`Unmap ${slug}`} title={UNMAP_COPY} onClick={() => unmap(slug)}>
                <X size={15} strokeWidth={2} aria-hidden="true" />
                <VisuallyHidden>Unmap</VisuallyHidden>
              </IconBtn>
            )}
          </span>
        </PinHead>
        <MonoLine>
          kb/{slug} · v{doc.latestVersion ?? '—'} · {refreshModeWord}
        </MonoLine>
        <PinMeta>
          {doc.title ?? 'Untitled'} · {coverage ? coverage.word : health.data === undefined ? 'checking coverage…' : 'mapped · coverage at publish'}
        </PinMeta>
        {doc.state === 'failed' && <PinFix>Ingestion failed — {NO_RETRY_COPY}</PinFix>}
        {coverage && coverage.word !== 'ready-for-retrieval' && <PinFix>{coverage.detail}</PinFix>}
        {renameState?.docId === doc.id ? (
          <InlineForm>
            <TextInput
              label="New pin address"
              value={renameState.value}
              onChange={(event) => setRenameState((prev) => (prev ? { ...prev, value: event.target.value } : prev))}
              placeholder="kebab-case, 3–64 chars"
              error={(renameState.value.trim() ? validateSourceSlug(renameState.value) : 'Enter the new pin address.') ?? undefined}
            />
            <PinActions>
              <TextButton
                type="button"
                disabled={!!validateSourceSlug(renameState.value) || rename.isPending}
                onClick={() => {
                  const next = renameState.value.trim().toLowerCase();
                  rename.mutate(
                    { documentId: doc.id, sourceSlug: next },
                    {
                      onSuccess: () => {
                        setPins((prev) => prev.map((s) => (s === renameState.oldSlug ? next : s)));
                        setRenameState(null);
                        toast.success(`Renamed to “${next}” — pins follow the new address.`);
                      },
                    },
                  );
                }}
              >
                Rename
              </TextButton>
              <MutedButton type="button" onClick={() => setRenameState(null)}>
                Cancel
              </MutedButton>
            </PinActions>
            <PinMeta>Renaming mutates the pin address org-wide (audited) — old pins resolve unresolved next publish.</PinMeta>
          </InlineForm>
        ) : null}
      </PinCard>
    );
  };

  return (
    <SectionPage
      title="Knowledge"
      subtitle="Ground answers in pinned sources — retrieval policy, pins, and how new sources are chunked."
      pill={blocked ? <BlockerPill>{heldMessages.length} blocker{heldMessages.length === 1 ? '' : 's'} — autosave held</BlockerPill> : undefined}
      rail={
        <>
          <PageOutline items={outlineItems} onSelect={scrollToGroup} />
          <RailCard>
            <RailTitle>Library</RailTitle>
            <StatRows>
              <StatRow>
                <StatLabel>Documents</StatLabel>
                <StatValue>{documents.isPending ? '—' : inventory.length}</StatValue>
              </StatRow>
              <StatRow>
                <StatLabel>Indexed</StatLabel>
                <StatValue>{documents.isPending ? '—' : indexedCount}</StatValue>
              </StatRow>
              <StatRow>
                <StatLabel>Indexing</StatLabel>
                <StatValue>{documents.isPending ? '—' : indexingCount}</StatValue>
              </StatRow>
              <StatRow>
                <StatLabel>Stale pins</StatLabel>
                <StatValue>{staleSlugs.size}</StatValue>
              </StatRow>
            </StatRows>
            <PinProgress>
              <PinProgressLabel>
                <span>Pinned</span>
                <span>
                  {pins.length} of {PINS_MAX}
                </span>
              </PinProgressLabel>
              <BudgetBar role="progressbar" aria-valuenow={pins.length} aria-valuemin={0} aria-valuemax={PINS_MAX} aria-label={`${pins.length} of ${PINS_MAX} pins used`}>
                <BudgetFill $pct={PINS_MAX > 0 ? (pins.length / PINS_MAX) * 100 : 0} />
              </BudgetBar>
            </PinProgress>
          </RailCard>
          <MicroTip>
            Publish resolves each slug to an exact version — unresolved pins refuse publish without the degraded-knowledge
            ack.
          </MicroTip>
        </>
      }
    >
      {/* Group 1 · retrieval policy */}
      <div id="knowledge-retrieval" onKeyDown={onEscapeBlur}>
        <SectionGroup label="Retrieval">
          <Card>
            <ControlRow>
              <ControlText>
                <ControlTitle>Retrieval enabled</ControlTitle>
                <ControlSub>{retrieval ? 'Pinned sources ground answers at runtime.' : RETRIEVAL_OFF_COPY}</ControlSub>
              </ControlText>
              {canAuthor ? (
                <Switch checked={retrieval} onChange={setRetrieval} label="Retrieval enabled" id="knowledge-retrieval-switch" />
              ) : (
                <ControlSub>{retrieval ? 'On' : 'Off — deliberate, not empty'}</ControlSub>
              )}
            </ControlRow>
            <ControlRow>
              <ControlText>
                <ControlTitle>Results per query</ControlTitle>
                <ControlSub>
                  Chunks per query · {MAX_RESULTS_MIN}–{MAX_RESULTS_MAX} · default {MAX_RESULTS_DEFAULT}
                </ControlSub>
              </ControlText>
              {canAuthor ? (
                <Stepper>
                  <StepBtn type="button" aria-label="Decrease max results" disabled={maxResults <= MAX_RESULTS_MIN} onClick={() => setMaxResults((v) => Math.max(MAX_RESULTS_MIN, v - 1))}>
                    <Minus size={14} strokeWidth={2} />
                  </StepBtn>
                  <StepValue aria-live="polite">{maxResults}</StepValue>
                  <StepBtn type="button" aria-label="Increase max results" disabled={maxResults >= MAX_RESULTS_MAX} onClick={() => setMaxResults((v) => Math.min(MAX_RESULTS_MAX, v + 1))}>
                    <Plus size={14} strokeWidth={2} />
                  </StepBtn>
                </Stepper>
              ) : (
                <StepValue>{maxResults}</StepValue>
              )}
            </ControlRow>
            <ControlRow>
              <ControlText>
                <ControlTitle>Retrieval mode</ControlTitle>
                <ControlSub>How chunks are matched — Hybrid blends both.</ControlSub>
              </ControlText>
              {canAuthor ? (
                <Segmented
                  options={RETRIEVAL_MODES.map((mode) => ({ value: mode, label: RETRIEVAL_MODE_LABELS[mode] }))}
                  value={retrievalMode}
                  onChange={(value) => setRetrievalMode(value as RetrievalMode)}
                  size="sm"
                  ariaLabel="Retrieval mode"
                />
              ) : (
                <ControlSub>{RETRIEVAL_MODE_LABELS[retrievalMode]}</ControlSub>
              )}
            </ControlRow>
            <ControlRow>
              <ControlText>
                <ControlTitle>Rerank results</ControlTitle>
                <ControlSub>Score candidates with a second model before answering.</ControlSub>
              </ControlText>
              {canAuthor ? (
                <Switch checked={rerank} onChange={setRerank} label="Rerank results" id="knowledge-rerank-switch" />
              ) : (
                <ControlSub>{rerank ? 'On' : 'Off'}</ControlSub>
              )}
            </ControlRow>
            <ControlRow>
              <ControlText>
                <ControlTitle>Require citations</ControlTitle>
                <ControlSub>Answers must cite the chunks they used.</ControlSub>
              </ControlText>
              {canAuthor ? (
                <Switch checked={requireCitations} onChange={setRequireCitations} label="Require citations" id="knowledge-citations-switch" />
              ) : (
                <ControlSub>{requireCitations ? 'On' : 'Off'}</ControlSub>
              )}
            </ControlRow>
          </Card>
        </SectionGroup>
      </div>

      {/* Group 2 · pinned sources */}
      <div id="knowledge-pinned" onKeyDown={onEscapeBlur}>
        <SectionGroup label="Pinned sources">
          <Card>
            <CardHeadRow>
              <CardHelper>
                {pins.length} / {PINS_MAX} — slugs resolve to exact versions at publish.
              </CardHelper>
              {staleSlugs.size > 0 && (
                <StaleBadge>
                  <TriangleAlert size={12} strokeWidth={2} aria-hidden="true" />
                  {staleSlugs.size} stale pin{staleSlugs.size === 1 ? '' : 's'}
                </StaleBadge>
              )}
            </CardHeadRow>
            {pins.length === 0 ? (
              <EmptyPins>{retrieval ? 'Retrieval is on but nothing is pinned — answers will not ground.' : SKIP_COPY}</EmptyPins>
            ) : (
              <PinList>{pins.map((slug) => renderPinRow(slug))}</PinList>
            )}
            {(degraded || undercovered || unresolvedCount > 0) && (
              <Whisper $tone="amber">
                {unresolvedCount > 0
                  ? `${unresolvedCount} pin${unresolvedCount === 1 ? '' : 's'} unresolved — publish refuses without the degraded-knowledge ack. `
                  : ''}
                {undercovered ? 'A pinned source is still embedding for the current model. ' : ''}
                {DEGRADED_ACK_COPY}
              </Whisper>
            )}
            {pins.length > 0 && !degraded && !undercovered && unresolvedCount === 0 && (
              <PinMeta>All pins resolved{health.data === undefined ? ' — coverage checks while health loads.' : ' and covered.'}</PinMeta>
            )}
            <PinMeta>{UNMAP_COPY}</PinMeta>
            {canAuthor && (
              <PinCta type="button" onClick={pinFromLibrary}>
                + Pin from library
              </PinCta>
            )}
            <PinCounter>
              {pins.length} / {PINS_MAX}
            </PinCounter>
          </Card>
        </SectionGroup>
      </div>

      {/* Group 3 · add sources */}
      <div id="knowledge-add" onKeyDown={onEscapeBlur}>
        <SectionGroup label="Add sources">
          <Card>
            {canAuthor ? (
              <>
                <TabStrip role="tablist" aria-label="Add sources">
                  {(['upload', 'paste', 'library', 'connector'] as const).map((id) => (
                    <Tab key={id} type="button" role="tab" aria-selected={tab === id} $active={tab === id} onClick={() => setTab(id)}>
                      {id === 'upload' ? 'Upload' : id === 'paste' ? 'Paste' : id === 'library' ? 'Library' : 'Connectors'}
                      {id === 'connector' && <OrgBadge>org</OrgBadge>}
                    </Tab>
                  ))}
                </TabStrip>

                {tab === 'upload' && (
                  <TabPanel>
                    <input
                      ref={fileRef}
                      type="file"
                      multiple
                      style={{ display: 'none' }}
                      accept={KNOWLEDGE_MEDIA_TYPES.join(',')}
                      onChange={(event) => {
                        const files = event.target.files ? Array.from(event.target.files) : [];
                        setRows((prev) => [
                          ...prev,
                          ...files.map((file) => {
                            keyRef.current += 1;
                            return { key: keyRef.current, file, slug: slugifyFilename(file.name), title: file.name.replace(/\.[a-z0-9]+$/i, '') };
                          }),
                        ]);
                        event.target.value = '';
                      }}
                    />
                    <Dropzone type="button" onClick={() => fileRef.current?.click()}>
                      <DropTitle>Drop files here or browse</DropTitle>
                      <DropSub>PDF · PNG · JPG · WebP · TXT · MD · CSV · JSON — no Word/Excel, convert first.</DropSub>
                      <DropSub>Uploads write to the org library · Recorded in Audit</DropSub>
                    </Dropzone>
                    {rows.length > 0 && (
                      <UploadList>
                        {rows.map((row) => (
                          <FileRow key={row.key}>
                            <FileHead>
                              <FileName>{row.file.name}</FileName>
                              <FileMeta>{(row.file.size / 1024).toFixed(1)} KB</FileMeta>
                              <MutedButton type="button" onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}>
                                Remove
                              </MutedButton>
                            </FileHead>
                            <FieldGrid>
                              <TextInput
                                label="Pin address intent"
                                value={row.slug}
                                onChange={(event) => setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, slug: event.target.value } : r)))}
                                placeholder="omit to derive"
                                hint="Kebab 3–64, reserved now — 409 on collision."
                                error={(row.slug.trim() ? validateSourceSlug(row.slug) : null) ?? undefined}
                              />
                              <TextInput
                                label="Display title"
                                value={row.title}
                                onChange={(event) => setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, title: event.target.value } : r)))}
                                placeholder="Defaults to the slug, else auto"
                              />
                            </FieldGrid>
                          </FileRow>
                        ))}
                      </UploadList>
                    )}
                    {rows.length > 0 && (
                      <div>
                        <ActionButton size="sm" disabled={rowsBlocked || authorizing} onClick={authorizeUploads}>
                          Authorize {rows.length} upload{rows.length === 1 ? '' : 's'}
                        </ActionButton>
                      </div>
                    )}
                    {uploads.length > 0 && (
                      <PinList>
                        {uploads.map((upload) => {
                          const terminal = upload.status === 'ready' || upload.status === 'failed' || upload.status === 'quarantined';
                          const label =
                            upload.status === 'uploading'
                              ? { word: 'Uploading', fix: 'Bytes in flight — upload complete does not mean ready.' }
                              : upload.status === 'processing'
                                ? {
                                  word: 'Processing',
                                  fix: isSessionStalled('INDEXING', upload.touchedAt, Date.now()) ? STALLED_COPY : 'Upload complete — pipeline running (scan → extract → index).',
                                }
                                : upload.status === 'ready'
                                  ? sessionStateLabel('READY')
                                  : sessionStateLabel(upload.status.toUpperCase());
                          const pinned = upload.sourceSlug ? pins.includes(upload.sourceSlug) : false;
                          return (
                            <PinCard key={upload.sessionId} $tone={upload.status === 'ready' ? 'ok' : terminal ? 'error' : 'info'}>
                              <PinHead>
                                <StatusDot $status={upload.status === 'ready' ? 'ready' : terminal ? 'error' : 'info'} aria-hidden="true" />
                                <PinTitle>{upload.filename}</PinTitle>
                                <PinState>{label.word}</PinState>
                                <span style={{ marginLeft: 'auto' }}>
                                  <IconBtn
                                    type="button"
                                    aria-label={`Dismiss ${upload.filename} from the tracker`}
                                    title="Remove this tracker row"
                                    onClick={() => dismiss(upload.sessionId)}
                                  >
                                    <X size={15} strokeWidth={2} aria-hidden="true" />
                                  </IconBtn>
                                </span>
                              </PinHead>
                              <PinMeta>
                                {(upload.size / 1024).toFixed(1)} KB{upload.sourceSlug ? ` · ${upload.sourceSlug}` : ' · slug derives at ingestion'} · session {upload.sessionId.slice(0, 8)}…
                              </PinMeta>
                              <PinFix>{upload.lastError ?? label.fix}</PinFix>
                              {terminal && upload.status !== 'ready' && <PinFix>{NO_RETRY_COPY}</PinFix>}
                              {upload.status === 'ready' && upload.sourceSlug && !pinned && (
                                <PinActions>
                                  <TextButton type="button" onClick={() => pin(upload.sourceSlug as string)}>
                                    Pin “{upload.sourceSlug}”
                                  </TextButton>
                                </PinActions>
                              )}
                            </PinCard>
                          );
                        })}
                      </PinList>
                    )}
                  </TabPanel>
                )}

                {tab === 'paste' && (
                  <TabPanel>
                    <InlineForm>
                      <Segmented
                        options={PASTE_MEDIA_TYPES.map((mediaType) => ({ value: mediaType, label: PASTE_LABELS[mediaType as PasteUploadType] }))}
                        value={pasteMedia}
                        onChange={(value) => setPasteMedia(value as PasteUploadType)}
                        size="sm"
                        ariaLabel="Paste format"
                      />
                      <TextArea
                        label="Content"
                        value={pasteText}
                        onChange={(event) => setPasteText(event.target.value)}
                        rows={5}
                        placeholder={pasteMedia === 'application/json' ? '{"policy": "refunds within 30 days…"}' : 'Paste the source text…'}
                      />
                      <FieldGrid>
                        <TextInput
                          label="Pin address (required)"
                          value={pasteSlug}
                          onChange={(event) => setPasteSlug(event.target.value)}
                          placeholder="kebab-case, 3–64 chars"
                          error={(pasteSlug.trim() ? validateSourceSlug(pasteSlug) : null) ?? undefined}
                        />
                        <TextInput
                          label="Display title"
                          value={pasteTitle}
                          onChange={(event) => setPasteTitle(event.target.value)}
                          placeholder="Defaults to the slug, else auto"
                        />
                      </FieldGrid>
                      <div>
                        <ActionButton size="sm" disabled={pasting || pasteText.trim() === '' || pasteSlug.trim() === ''} onClick={ingestPaste}>
                          Ingest paste
                        </ActionButton>
                      </div>
                      <PinMeta>Pasted bytes ride the same verified session flow as files — pin the slug once READY.</PinMeta>
                    </InlineForm>
                  </TabPanel>
                )}

                {tab === 'library' && (
                  <TabPanel>
                    <TextInput
                      aria-label="Filter library"
                      value={filter}
                      onChange={(event) => setFilter(event.target.value)}
                      placeholder="Filter by slug or title…"
                    />
                    {documents.isPending ? (
                      <SkeletonRows rows={4} barHeight="72px" />
                    ) : documents.isError ? (
                      <Whisper $tone="red">The library is unreachable — pins below still save; mapping resumes on reload.</Whisper>
                    ) : libraryRows.length === 0 ? (
                      <PinMeta>No documents match — upload or paste one first.</PinMeta>
                    ) : (
                      <PinList>
                        {libraryRows.slice(0, 30).map((doc) => {
                          const docLabel = documentStateLabel(doc.state);
                          const isPinned = pins.includes(doc.sourceSlug);
                          return (
                            <PinCard key={doc.id} $tone={isPinned ? 'ok' : 'info'}>
                              <PinHead>
                                <PinIcon aria-hidden="true">
                                  <FileText size={15} strokeWidth={2} />
                                </PinIcon>
                                <PinTitle>{doc.sourceSlug || '—'}</PinTitle>
                                <PinState>{docLabel.word}</PinState>
                              </PinHead>
                              <MonoLine>
                                kb/{doc.sourceSlug} · v{doc.latestVersion ?? '—'}
                              </MonoLine>
                              <PinMeta>{doc.title ?? 'Untitled'}</PinMeta>
                              <PinActions>
                                {isPinned ? (
                                  <MutedButton type="button" onClick={() => unmap(doc.sourceSlug)}>
                                    Unmap
                                  </MutedButton>
                                ) : (
                                  <TextButton type="button" onClick={() => pin(doc.sourceSlug)} disabled={!doc.sourceSlug}>
                                    Pin
                                  </TextButton>
                                )}
                              </PinActions>
                            </PinCard>
                          );
                        })}
                      </PinList>
                    )}
                  </TabPanel>
                )}

                {tab === 'connector' && (
                  <TabPanel>
                    <PinMeta>
                      <OrgBadge>org</OrgBadge> Connector accounts are org-wide — syncing pulls documents into the shared library for every agent.
                    </PinMeta>
                    {connectors.isPending ? (
                      <SkeletonRows rows={3} barHeight="44px" />
                    ) : connectors.isError ? (
                      <Whisper $tone="red">Connector accounts are unreachable — linking and syncing resume on reload.</Whisper>
                    ) : (connectors.data ?? []).length === 0 ? (
                      <PinMeta>No accounts linked yet.</PinMeta>
                    ) : (
                      <ConnectorList>
                        {(connectors.data ?? []).map((account) => (
                          <ConnectorRow key={account.id}>
                            <PinHead>
                              <PinTitle>{account.displayName}</PinTitle>
                              <PinState>
                                {syncingId === account.id ? 'Syncing' : `${account.provider} · ${account.state}`}
                              </PinState>
                            </PinHead>
                            <PinMeta>
                              {account.lastSyncedAt ? `Last sync ${account.lastSyncedAt.slice(0, 16).replace('T', ' ')}` : 'Never synced'}
                              {account.lastError ? ` · ${account.lastError}` : ''}
                            </PinMeta>
                            <PinActions>
                              <TextButton
                                type="button"
                                disabled={syncConnector.isPending}
                                onClick={() => {
                                  setSyncingId(account.id);
                                  syncConnector.mutate(account.id, {
                                    onSettled: () => setSyncingId((v) => (v === account.id ? null : v)),
                                  });
                                }}
                              >
                                {syncingId === account.id ? 'Syncing…' : 'Sync now'}
                              </TextButton>
                            </PinActions>
                          </ConnectorRow>
                        ))}
                      </ConnectorList>
                    )}
                    <PinActions>
                      <TextButton type="button" onClick={() => navigate({ to: '/agent-studio/integrations' })}>
                        Open Integrations →
                      </TextButton>
                    </PinActions>
                    <PinMeta>New accounts link in Integrations (org-wide, role-gated) — synced documents appear in the Library tab.</PinMeta>
                  </TabPanel>
                )}
              </>
            ) : (
              <ViewerNote>Knowledge editing needs an owner, admin, or developer — {denied}</ViewerNote>
            )}
          </Card>
        </SectionGroup>
      </div>

      {/* Group 4 · source defaults */}
      <div id="knowledge-defaults" onKeyDown={onEscapeBlur}>
        <SectionGroup label="Source defaults">
          <Card>
            <CardHeadRow>
              <CardHelper>Applied to newly added sources; per-source overrides live on each pin.</CardHelper>
              {canAuthor && (
                <TextButton type="button" onClick={resetSourceDefaults}>
                  Reset
                </TextButton>
              )}
            </CardHeadRow>
            <DefaultsGrid>
              <TextInput
                label="Chunk size (tokens)"
                type="number"
                value={Number.isNaN(sourceDefaults.chunkSize) ? '' : String(sourceDefaults.chunkSize)}
                onChange={(event) => {
                  const raw = event.target.value;
                  setSourceDefaults((prev) => ({ ...prev, chunkSize: raw === '' ? NaN : Number.parseInt(raw, 10) }));
                }}
                placeholder={String(SOURCE_DEFAULTS.chunkSize)}
                hint={`Tokens per chunk · ${CHUNK_SIZE_MIN}–${CHUNK_SIZE_MAX}`}
                error={chunkSizeProblem.ok ? undefined : chunkSizeProblem.message}
                disabled={!canAuthor}
              />
              <TextInput
                label="Chunk overlap"
                type="number"
                value={Number.isNaN(sourceDefaults.chunkOverlap) ? '' : String(sourceDefaults.chunkOverlap)}
                onChange={(event) => {
                  const raw = event.target.value;
                  setSourceDefaults((prev) => ({ ...prev, chunkOverlap: raw === '' ? NaN : Number.parseInt(raw, 10) }));
                }}
                placeholder={String(SOURCE_DEFAULTS.chunkOverlap)}
                hint="Shared tokens between chunks"
                error={chunkOverlapProblem.ok ? undefined : chunkOverlapProblem.message}
                disabled={!canAuthor}
              />
              <div>
                <FieldLabel htmlFor="knowledge-embedding-model">Embedding model</FieldLabel>
                <Select
                  id="knowledge-embedding-model"
                  value={sourceDefaults.embeddingModel}
                  onChange={(event) => setSourceDefaults((prev) => ({ ...prev, embeddingModel: event.target.value }))}
                  disabled={!canAuthor}
                >
                  {EMBEDDING_MODELS.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                  {!EMBEDDING_MODELS.includes(sourceDefaults.embeddingModel as (typeof EMBEDDING_MODELS)[number]) && (
                    <option value={sourceDefaults.embeddingModel}>{sourceDefaults.embeddingModel}</option>
                  )}
                </Select>
              </div>
              <div>
                <FieldLabel id="knowledge-refresh-policy-label">Refresh policy</FieldLabel>
                {canAuthor ? (
                  <Segmented
                    options={REFRESH_POLICIES.map((policy) => ({ value: policy, label: REFRESH_POLICY_LABELS[policy] }))}
                    value={sourceDefaults.refreshPolicy}
                    onChange={(value) => setSourceDefaults((prev) => ({ ...prev, refreshPolicy: value as RefreshPolicy }))}
                    size="sm"
                    ariaLabel="Refresh policy"
                  />
                ) : (
                  <ControlSub>{REFRESH_POLICY_LABELS[sourceDefaults.refreshPolicy]}</ControlSub>
                )}
                <ControlSub style={{ marginTop: 6 }}>
                  Track-latest re-resolves every run; pinned versions freeze at publish.
                </ControlSub>
              </div>
            </DefaultsGrid>
          </Card>
        </SectionGroup>
      </div>

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
            JSON.stringify({
              context_policy: { knowledge_sources: live.context_policy.knowledge_sources },
              knowledge_policy: live.knowledge_policy,
            })
          }
          onReloadTheirs={(theirs) => {
            try {
              const parsed = JSON.parse(theirs) as {
                context_policy?: { knowledge_sources?: unknown };
                knowledge_policy?: {
                  retrieval_enabled?: unknown;
                  max_results?: unknown;
                  retrieval_mode?: unknown;
                  rerank?: unknown;
                  require_citations?: unknown;
                  source_defaults?: {
                    chunk_size?: unknown;
                    chunk_overlap?: unknown;
                    embedding_model?: unknown;
                    refresh_policy?: unknown;
                  };
                };
              };
              const sources = parsed.context_policy?.knowledge_sources;
              if (Array.isArray(sources)) setPins(sources.filter((s): s is string => typeof s === 'string'));
              const policy = parsed.knowledge_policy;
              if (policy && typeof policy.retrieval_enabled === 'boolean') setRetrieval(policy.retrieval_enabled);
              if (policy && typeof policy.max_results === 'number') setMaxResults(policy.max_results);
              // Retrieval extensions hydrate when the definition carries
              // them (post contract change); otherwise keep local values.
              if (policy && isRetrievalMode(policy.retrieval_mode)) setRetrievalMode(policy.retrieval_mode);
              if (policy && typeof policy.rerank === 'boolean') setRerank(policy.rerank);
              if (policy && typeof policy.require_citations === 'boolean') setRequireCitations(policy.require_citations);
              const sd = policy?.source_defaults;
              if (sd && typeof sd === 'object') {
                setSourceDefaults((prev) => ({
                  chunkSize: typeof sd.chunk_size === 'number' ? sd.chunk_size : prev.chunkSize,
                  chunkOverlap: typeof sd.chunk_overlap === 'number' ? sd.chunk_overlap : prev.chunkOverlap,
                  embeddingModel: typeof sd.embedding_model === 'string' && sd.embedding_model ? sd.embedding_model : prev.embeddingModel,
                  refreshPolicy: isRefreshPolicy(sd.refresh_policy) ? sd.refresh_policy : prev.refreshPolicy,
                }));
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
