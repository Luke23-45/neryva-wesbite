import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { Switch } from '@components/common/ui/Switch';
import { Segmented } from '@components/common/ui/Segmented';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ApiError } from '@lib/engine/client';
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
import { AUTOSAVE_MS, buildDraftPayload } from '../lib/draft-save';
import {
  canPin,
  coverageLabel,
  documentStateLabel,
  isSessionStalled,
  matchPinToDocument,
  MAX_RESULTS_DEFAULT,
  MAX_RESULTS_MAX,
  MAX_RESULTS_MIN,
  NO_RETRY_COPY,
  PINS_MAX,
  DEGRADED_ACK_COPY,
  RETRIEVAL_OFF_COPY,
  SKIP_COPY,
  STALLED_COPY,
  UNMAP_COPY,
  sessionStateLabel,
  slugifyFilename,
  validateMaxResults,
  validatePaste,
  validatePins,
  validateSourceSlug,
  PASTE_MEDIA_TYPES,
} from '../lib/knowledge-model';
import { ConflictDialog } from './ConflictDialog';
import { StatusDot } from '../canvas/nodes/SlotNode.styles';
import { EmptyState, SectionLabel, Whisper, Wrap } from './InstructionsSection.styles';
import { StaticLabel, StaticRow, SwitchRow, SwitchSub, SwitchText, SwitchTitle } from './BrainSection.styles';
import {
  ConnectorRow,
  DropSub,
  DropTitle,
  Dropzone,
  FieldGrid,
  FileHead,
  FileMeta,
  FileName,
  FileRow,
  InlineForm,
  MutedButton,
  OrgBadge,
  PinActions,
  PinCard,
  PinFix,
  PinHead,
  PinMeta,
  PinState,
  PinTitle,
  StepBtn,
  Stepper,
  StepValue,
  Tab,
  TabStrip,
  TextButton,
} from './KnowledgeSection.styles';

export interface KnowledgeSectionProps {
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

function readKnowledge(definition: AgentDefinition): { pins: string[]; retrieval: boolean; maxResults: number } {
  return {
    pins: definition.context_policy.knowledge_sources,
    retrieval: definition.knowledge_policy?.retrieval_enabled ?? false,
    maxResults: definition.knowledge_policy?.max_results ?? MAX_RESULTS_DEFAULT,
  };
}

/**
 * C05 mount — retrieval policy, pinned sources, four-tab add surface, coverage
 * consequence; the proven save machine (debounce, PUT/POST, 409 adopt, 412
 * dialog, dirty flag). Uploads/pins are draft-local until autosave; the
 * library itself is never written except slug renames (audited, org-wide).
 */
export function KnowledgeSection({
  assistantId,
  definition,
  versionId,
  versionHash,
  isDraft,
  canAuthor,
  onDirtyChange,
}: KnowledgeSectionProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { role } = useOrg();
  const denied = setupDeniedCopy(role, 'setup:author');

  const documents = useDocuments();
  const rename = useRenameDocumentSlug();
  const { uploads, attach, attachText } = useAttachmentUpload();
  const connectors = useConnectors();
  const syncConnector = useSyncConnector();
  const health = useKnowledgeHealth(assistantId);

  const sourceKey = `${versionId ?? 'none'}:${versionHash ?? 'none'}`;
  const [docKey, setDocKey] = useState(sourceKey);
  const [pins, setPins] = useState<string[]>(() => (definition ? readKnowledge(definition).pins : []));
  const [retrieval, setRetrieval] = useState(() => (definition ? readKnowledge(definition).retrieval : false));
  const [maxResults, setMaxResults] = useState(() => (definition ? readKnowledge(definition).maxResults : MAX_RESULTS_DEFAULT));
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
  const fileRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef(0);
  const toastedReady = useRef<Set<string>>(new Set());
  const sendHashRef = useRef('');

  const saveDraft = useSaveDraftVersion(canAuthor ? assistantId : null);
  const updateDraft = useUpdateDraftVersion(canAuthor ? assistantId : null, versionId);

  const source = useMemo(
    () => (definition ? readKnowledge(definition) : { pins: [], retrieval: false, maxResults: MAX_RESULTS_DEFAULT }),
    [definition],
  );
  const current = useMemo(() => JSON.stringify({ pins, retrieval, maxResults }), [pins, retrieval, maxResults]);
  const dirty = current !== JSON.stringify(source);

  if (docKey !== sourceKey && !dirty) {
    setDocKey(sourceKey);
    setPins(source.pins);
    setRetrieval(source.retrieval);
    setMaxResults(source.maxResults);
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
      },
    });
  }, [definition, pins, retrieval, maxResults]);

  const heldMessages = useMemo(() => {
    const messages: string[] = [];
    const pinsCheck = validatePins(pins);
    if (!pinsCheck.ok) messages.push(pinsCheck.message);
    const maxCheck = validateMaxResults(maxResults);
    if (!maxCheck.ok) messages.push(maxCheck.message);
    const next = buildNext();
    if (next) {
      messages.push(
        ...checkDefinitionCaps(next)
          .filter((issue) => issue.path === 'knowledge_policy' || issue.path.startsWith('knowledge_policy.'))
          .map((i) => i.message),
      );
    }
    return messages;
  }, [pins, maxResults, buildNext]);
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
                  ? (error.details as Record<string, unknown>)
                  : {};
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

  useEffect(() => {
    if (!canAuthor || !dirty || blocked || conflict || adoptingActive || pending || !definition) return;
    const timer = window.setTimeout(() => {
      doSave();
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [canAuthor, dirty, blocked, conflict, adoptingActive, pending, definition, current, doSave]);

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
  }, [rows, authorizing, attach]);

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
  }, [pasting, pasteText, pasteMedia, pasteSlug, pasteTitle, attachText]);

  if (!definition) {
    return (
      <Wrap>
        <EmptyState>Loading the draft…</EmptyState>
      </Wrap>
    );
  }

  const inventory = documents.data ?? [];
  const healthPins = health.data?.pins ?? [];
  const degraded = health.data?.degraded === true;
  const undercovered = healthPins.some((p) => p.embeddingComplete === false);
  const unresolvedCount = pins.filter((slug) => matchPinToDocument(slug, inventory).resolved === false).length;

  const libraryRows = (() => {
    const q = filter.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(
      (d) => d.sourceSlug.toLowerCase().includes(q) || (d.title?.toLowerCase().includes(q) ?? false),
    );
  })();

  const rowProblems = rows.map((row) => (row.slug.trim() ? validateSourceSlug(row.slug) : null));
  const rowsBlocked = rowProblems.some((p) => p !== null);

  return (
    <Wrap
      onKeyDown={(event) => {
        if (event.key === 'Escape' && event.target instanceof HTMLElement) {
          event.target.blur();
        }
      }}
    >
      {/* Block A · retrieval policy */}
      <div>
        <SectionLabel>RETRIEVAL</SectionLabel>
        {canAuthor ? (
          <SwitchRow>
            <SwitchText>
              <SwitchTitle>Retrieval enabled</SwitchTitle>
              <SwitchSub>{retrieval ? 'Pinned sources ground answers at runtime.' : RETRIEVAL_OFF_COPY}</SwitchSub>
            </SwitchText>
            <Switch checked={retrieval} onChange={setRetrieval} label="Retrieval enabled" id="knowledge-retrieval-switch" />
          </SwitchRow>
        ) : (
          <StaticRow>
            <StaticLabel>Retrieval</StaticLabel>
            <span>{retrieval ? 'On' : 'Off — deliberate, not empty'}</span>
          </StaticRow>
        )}
        <SwitchRow>
          <SwitchText>
            <SwitchTitle>Max results</SwitchTitle>
            <SwitchSub>
              Chunks per query · {MAX_RESULTS_MIN}–{MAX_RESULTS_MAX} · default {MAX_RESULTS_DEFAULT}
            </SwitchSub>
          </SwitchText>
          {canAuthor ? (
            <Stepper>
              <StepBtn type="button" aria-label="Decrease max results" disabled={maxResults <= MAX_RESULTS_MIN} onClick={() => setMaxResults((v) => Math.max(MAX_RESULTS_MIN, v - 1))}>
                −
              </StepBtn>
              <StepValue aria-live="polite">{maxResults}</StepValue>
              <StepBtn type="button" aria-label="Increase max results" disabled={maxResults >= MAX_RESULTS_MAX} onClick={() => setMaxResults((v) => Math.min(MAX_RESULTS_MAX, v + 1))}>
                +
              </StepBtn>
            </Stepper>
          ) : (
            <StepValue>{maxResults}</StepValue>
          )}
        </SwitchRow>
      </div>

      {/* Block B · pinned sources */}
      <div>
        <SectionLabel>
          PINNED · {pins.length} / {PINS_MAX}
        </SectionLabel>
        {pins.length === 0 ? (
          <PinMeta>{retrieval ? 'Retrieval is on but nothing is pinned — answers will not ground.' : SKIP_COPY}</PinMeta>
        ) : (
          pins.map((slug) => {
            const matched = matchPinToDocument(slug, inventory);
            const healthPin = healthPins.find((p) => p.sourceSlug === slug);
            if (!matched.resolved) {
              return (
                <PinCard key={slug} $tone="attention">
                  <PinHead>
                    <StatusDot $status="attention" aria-hidden="true" />
                    <PinTitle>{slug}</PinTitle>
                    <PinState>Unresolved</PinState>
                  </PinHead>
                  <PinFix>Unresolved pin — publish refuses without the degraded-knowledge ack.</PinFix>
                  {canAuthor && (
                    <PinActions>
                      <MutedButton type="button" onClick={() => unmap(slug)}>
                        Unmap
                      </MutedButton>
                    </PinActions>
                  )}
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
            const tone = doc.state === 'failed' ? 'error' : coverage && coverage.word !== 'ready-for-retrieval' ? 'attention' : health.data === undefined ? 'info' : 'ok';
            return (
              <PinCard key={slug} $tone={tone}>
                <PinHead>
                  <StatusDot $status={tone === 'ok' ? 'ready' : tone} aria-hidden="true" />
                  <PinTitle title={doc.title ?? slug}>{slug}</PinTitle>
                  <PinState>{docLabel.word}</PinState>
                </PinHead>
                <PinMeta>
                  {doc.title ?? 'Untitled'} · v{doc.latestVersion ?? '—'} · {coverage ? coverage.word : health.data === undefined ? 'checking coverage…' : 'mapped · coverage at publish'}
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
                ) : (
                  canAuthor && (
                    <PinActions>
                      <MutedButton type="button" onClick={() => unmap(slug)} title={UNMAP_COPY}>
                        Unmap
                      </MutedButton>
                      <TextButton type="button" onClick={() => setRenameState({ docId: doc.id, oldSlug: slug, value: slug })}>
                        Rename
                      </TextButton>
                    </PinActions>
                  )
                )}
              </PinCard>
            );
          })
        )}
        <PinMeta>{UNMAP_COPY}</PinMeta>
      </div>

      {/* Block C · add sources */}
      <div>
        <SectionLabel>ADD SOURCES</SectionLabel>
        {canAuthor ? (
          <>
            <TabStrip role="tablist" aria-label="Add sources">
              {(['upload', 'paste', 'library', 'connector'] as const).map((id) => (
                <Tab key={id} type="button" role="tab" aria-selected={tab === id} $active={tab === id} onClick={() => setTab(id)}>
                  {id === 'upload' ? 'Upload' : id === 'paste' ? 'Paste' : id === 'library' ? 'Library' : 'Connector'}
                  {id === 'connector' && <OrgBadge>org</OrgBadge>}
                </Tab>
              ))}
            </TabStrip>

            {tab === 'upload' && (
              <div>
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
                {rows.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <ActionButton size="sm" disabled={rowsBlocked || authorizing} onClick={authorizeUploads}>
                      Authorize {rows.length} upload{rows.length === 1 ? '' : 's'}
                    </ActionButton>
                  </div>
                )}
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
              </div>
            )}

            {tab === 'paste' && (
              <div>
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
              </div>
            )}

            {tab === 'library' && (
              <div>
                <div style={{ marginTop: 8 }}>
                  <TextInput
                    aria-label="Filter library"
                    value={filter}
                    onChange={(event) => setFilter(event.target.value)}
                    placeholder="Filter by slug or title…"
                  />
                </div>
                {documents.isPending ? (
                  <PinMeta>Loading the library…</PinMeta>
                ) : documents.isError ? (
                  <Whisper $tone="red">The library is unreachable — pins below still save; mapping resumes on reload.</Whisper>
                ) : libraryRows.length === 0 ? (
                  <PinMeta>No documents match — upload or paste one first.</PinMeta>
                ) : (
                  libraryRows.slice(0, 30).map((doc) => {
                    const docLabel = documentStateLabel(doc.state);
                    const isPinned = pins.includes(doc.sourceSlug);
                    return (
                      <PinCard key={doc.id} $tone={isPinned ? 'ok' : 'info'}>
                        <PinHead>
                          <StatusDot $status={isPinned ? 'ready' : 'info'} aria-hidden="true" />
                          <PinTitle>{doc.sourceSlug || '—'}</PinTitle>
                          <PinState>{docLabel.word}</PinState>
                        </PinHead>
                        <PinMeta>
                          {doc.title ?? 'Untitled'} · v{doc.latestVersion ?? '—'}
                        </PinMeta>
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
                  })
                )}
              </div>
            )}

            {tab === 'connector' && (
              <div>
                <PinMeta style={{ marginTop: 8 }}>
                  <OrgBadge>org</OrgBadge> Connector accounts are org-wide — syncing pulls documents into the shared library for every agent.
                </PinMeta>
                {connectors.isPending ? (
                  <PinMeta>Loading accounts…</PinMeta>
                ) : connectors.isError ? (
                  <Whisper $tone="red">Connector accounts are unreachable — linking and syncing resume on reload.</Whisper>
                ) : (connectors.data ?? []).length === 0 ? (
                  <PinMeta>No accounts linked yet.</PinMeta>
                ) : (
                  (connectors.data ?? []).map((account) => (
                    <ConnectorRow key={account.id}>
                      <PinHead>
                        <PinTitle>{account.displayName}</PinTitle>
                        <PinState>{account.provider} · {account.state}</PinState>
                      </PinHead>
                      <PinMeta>
                        {account.lastSyncedAt ? `Last sync ${account.lastSyncedAt.slice(0, 16).replace('T', ' ')}` : 'Never synced'}
                        {account.lastError ? ` · ${account.lastError}` : ''}
                      </PinMeta>
                      <PinActions>
                        <TextButton
                          type="button"
                          disabled={syncConnector.isPending}
                          onClick={() => syncConnector.mutate(account.id)}
                        >
                          Sync now
                        </TextButton>
                      </PinActions>
                    </ConnectorRow>
                  ))
                )}
                <PinActions>
                  <TextButton type="button" onClick={() => navigate({ to: '/agent-studio/integrations' })}>
                    Open Integrations →
                  </TextButton>
                </PinActions>
                <PinMeta>New accounts link in Integrations (org-wide, role-gated) — synced documents appear in the Library tab.</PinMeta>
              </div>
            )}
          </>
        ) : (
          <StaticRow>
            <StaticLabel>Sources</StaticLabel>
            <span>Knowledge editing needs an owner, admin, or developer — {denied}</span>
          </StaticRow>
        )}
      </div>

      {/* Block D · coverage & publish consequence */}
      <div>
        <SectionLabel>COVERAGE & PUBLISH</SectionLabel>
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
        <PinMeta>Pin health reads the ACTIVE version — new pins resolve to exact versions at publish.</PinMeta>
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
                knowledge_policy?: { retrieval_enabled?: unknown; max_results?: unknown };
              };
              const sources = parsed.context_policy?.knowledge_sources;
              if (Array.isArray(sources)) setPins(sources.filter((s): s is string => typeof s === 'string'));
              const policy = parsed.knowledge_policy;
              if (policy && typeof policy.retrieval_enabled === 'boolean') setRetrieval(policy.retrieval_enabled);
              if (policy && typeof policy.max_results === 'number') setMaxResults(policy.max_results);
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
    </Wrap>
  );
}
