import { useMemo, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Plus, Upload, Pencil, Search, Database, Plug, Eye, Trash2, X } from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { Segmented } from '@components/common/ui/Segmented';
import { ActionButton } from '@components/common/ui/ActionButton';
import { CopyButton } from '@components/common/ui/CopyButton';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { useAttachmentUpload, KNOWLEDGE_MEDIA_TYPES, type AttachmentStatus, type PasteUploadType } from '@hooks/studio/useAttachmentUpload';
import {
  slugifyFilename,
  validatePaste,
  PASTE_MEDIA_TYPES,
  RETENTION_NOTE,
} from '@/sections/pages/products/agent-studio/builder/lib/knowledge-model';
import {
  useDocuments,
  useRenameDocumentSlug,
  useDeleteDocument,
  useDocumentPreview,
  useKnowledgeSearch,
} from '@hooks/studio/useSetupKnowledge';
import { formatValidationDetails } from '@lib/engine/errors';
import { ApiError } from '@lib/engine/client';
import { checkSourceSlug } from '@lib/engine/setup-caps';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';

// Document states (engine knowledge schema): processing|ready|failed|retired.
// Retired = source-deleted tombstone (mapping kept for resurrection,
// unreachable by retrieval) — rendered distinctly, never as an error.
const docTone: Record<string, StatusTone> = {
  ready: 'success',
  processing: 'info',
  failed: 'error',
  retired: 'warning',
};

const docHint: Record<string, string> = {
  ready: 'Indexed and retrievable.',
  processing: 'Ingestion running (scan → extract → index).',
  failed: 'Ingestion failed — re-upload the source.',
  retired: 'Source deleted upstream (tombstone). Mapping kept — a resync resurrects it.',
};

const uploadTone: Record<AttachmentStatus, StatusTone> = {
  uploading: 'info',
  processing: 'info',
  ready: 'success',
  failed: 'error',
  quarantined: 'error',
};

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.55;
`;

/** A4-10 — the terminal failure reason is visible text (truncated), not a
 *  hover-only tooltip: touch and keyboard users get the actionable reason
 *  too; the full text stays on hover. */
const FailureReason = styled.span`
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RowActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 6px;
`;

const IconBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

const SearchRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-end;
  margin-bottom: 14px;

  & > *:first-child {
    flex: 1;
  }
`;

const HitCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
`;

const HitMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  margin-bottom: 6px;
`;

const HitText = styled.div`
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
`;

const SectionGap = styled.div`
  margin-top: 18px;
`;

const PageNote = styled.div`
  font-size: 12px;
  opacity: 0.6;
  margin-top: 10px;
  line-height: 1.55;
`;

/** A4-06 — the documents list endpoint caps at 200 (engine max); the table
 *  loads the full window and says so instead of silently truncating at 50. */
const DOCUMENTS_CAP = 200;

const TERMINAL_UPLOAD = new Set<AttachmentStatus>(['ready', 'failed', 'quarantined']);

/** A4-04 — validation refusals carry the actionable reason in `details`
 *  (e.g. byte_length: exceeds KNOWLEDGE_MAX_UPLOAD_BYTES (1024)); the
 *  toast must name it, not just "Request validation failed". */
function uploadErrorCopy(name: string, error: unknown): string {
  const base = error instanceof Error ? error.message : 'upload failed';
  const details = error instanceof ApiError ? formatValidationDetails(error.details) : null;
  return details ? `${name}: ${base} — ${details}` : `${name}: ${base}`;
}

export function KnowledgeView() {
  const { role } = useOrg();
  const canWrite = canSetup(role, 'setup:author');
  const writeDenied = setupDeniedCopy(role, 'setup:author');
  // A4-06: load the full 200-document window the engine serves (default 50
  // silently hid older documents); the cap is disclosed under the table.
  const documents = useDocuments(DOCUMENTS_CAP);
  const { uploads, attach, attachText, dismiss } = useAttachmentUpload();
  const rename = useRenameDocumentSlug();
  const remove = useDeleteDocument();

  const [filter, setFilter] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; slug: string } | null>(null);
  const [previewTarget, setPreviewTarget] = useState<{ id: string; slug: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; slug: string } | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const search = useKnowledgeSearch(searchQuery, 5, { enabled: searchQuery.trim().length > 0 });

  const finishedUploads = uploads.filter((u) => TERMINAL_UPLOAD.has(u.status));
  const clearFinished = () => {
    for (const u of finishedUploads) {
      dismiss(u.sessionId);
    }
  };

  const rows = useMemo(() => {
    const list = documents.data ?? [];
    const q = filter.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter(
      (d) => d.sourceSlug.toLowerCase().includes(q) || (d.title?.toLowerCase().includes(q) ?? false) || d.state.toLowerCase().includes(q),
    );
  }, [documents.data, filter]);

  // Coverage is per-agent-pin, not per-document (C05) — the library states
  // this instead of faking a coverage column it cannot compute.
  const unsettled = (documents.data ?? []).some((d) => d.state === 'processing' || d.state === 'failed');

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Knowledge base</ViewTitle>
          <ViewSubtitle>
            Documents your agents retrieve — uploads, connector syncs, and the pin addresses versions bind to.
          </ViewSubtitle>
        </ViewHeader>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/agent-studio/integrations">
            <ActionButton variant="secondary" size="sm">
              <Plug size={13} strokeWidth={1.8} />
              Connectors
            </ActionButton>
          </Link>
          <ActionButton size="sm" disabled={!canWrite} title={canWrite ? 'Upload a document' : writeDenied} onClick={() => setUploadOpen(true)}>
            <Plus size={14} strokeWidth={2} />
            Upload
          </ActionButton>
        </div>
      </ViewHeaderRow>

      {uploads.length > 0 && (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
          <Panel
            title="Uploads"
            subtitle="Presigned sessions tracked through ingestion to READY."
            action={
              finishedUploads.length > 0 ? (
                <ActionButton variant="ghost" size="sm" onClick={clearFinished} aria-label="Clear finished uploads">
                  <X size={13} strokeWidth={1.8} />
                  Clear finished
                </ActionButton>
              ) : undefined
            }
          >
            <DataTable>
              <DataHead>
                <DataCell $w="40%">File</DataCell>
                <DataCell $w="20%">Pin address</DataCell>
                <DataCell $w="16%">Status</DataCell>
                <DataCell $w="18%">Detail</DataCell>
                <DataCell $w="6%" $align="right">
                  <span className="sr-only">Dismiss</span>
                </DataCell>
              </DataHead>
              {uploads.map((u) => (
                <DataRow key={u.sessionId} $interactive={false}>
                  <DataCell $w="40%">
                    <div>{u.filename}</div>
                    <Muted>{(u.size / 1024).toFixed(1)} KB</Muted>
                  </DataCell>
                  <DataCell $w="20%">{u.sourceSlug ? <Mono>{u.sourceSlug}</Mono> : <Muted>derived at ingestion</Muted>}</DataCell>
                  <DataCell $w="16%">
                    <StatusPill tone={uploadTone[u.status]}>{u.status}</StatusPill>
                  </DataCell>
                  <DataCell $w="18%">
                    {u.lastError ? <FailureReason title={u.lastError}>{u.lastError}</FailureReason> : <Muted>—</Muted>}
                  </DataCell>
                  <DataCell $w="6%" $align="right">
                    {TERMINAL_UPLOAD.has(u.status) ? (
                      <IconBtn type="button" aria-label={`Dismiss ${u.filename}`} title="Dismiss" onClick={() => dismiss(u.sessionId)}>
                        <X size={13} strokeWidth={1.7} />
                      </IconBtn>
                    ) : (
                      <Muted>—</Muted>
                    )}
                  </DataCell>
                </DataRow>
              ))}
            </DataTable>
          </Panel>
        </motion.div>
      )}

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <SectionGap>
          <Panel
            title="Documents"
            subtitle="Slug is the pin address versions bind; title is display only. Rename never rewrites history."
            action={
              <TextInput
                aria-label="Filter documents"
                placeholder="Filter by slug, title, state…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            }
            flush
          >
            <QueryView
              query={documents}
              isEmpty={(d) => d.length === 0 && filter.trim() === ''}
              empty={{ title: 'No documents yet', description: 'Upload a file or link a connector — mapped slugs become retrievable pins.' }}
            >
              {(docs) =>
                rows.length === 0 ? (
                  <EmptyState
                    icon={<Database size={18} opacity={0.5} />}
                    title={docs.length === 0 ? 'No documents yet' : 'No documents match'}
                    description={docs.length === 0 ? 'Upload a file or link a connector.' : 'Try a different filter.'}
                  />
                ) : (
                  <DataTable>
                    <DataHead>
                      <DataCell $w="24%">Pin address</DataCell>
                      <DataCell $w="24%">Title</DataCell>
                      <DataCell $w="12%">State</DataCell>
                      <DataCell $w="8%">Ver</DataCell>
                      <DataCell $w="16%">Updated</DataCell>
                      <DataCell $w="16%" $align="right">Actions</DataCell>
                    </DataHead>
                    {rows.map((doc, i) => (
                      <DataRow key={doc.id} as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={i + 3} $interactive={false}>
                        <DataCell $w="24%">
                          <Mono>{doc.sourceSlug || <Muted>—</Muted>}</Mono>
                        </DataCell>
                        <DataCell $w="24%">{doc.title ?? <Muted>—</Muted>}</DataCell>
                        <DataCell $w="12%">
                          <span title={docHint[doc.state] ?? doc.state}>
                            <StatusPill tone={docTone[doc.state] ?? 'neutral'}>{doc.state}</StatusPill>
                          </span>
                        </DataCell>
                        <DataCell $w="8%">{doc.latestVersion ?? <Muted>—</Muted>}</DataCell>
                        <DataCell $w="16%">{doc.updatedAt ? doc.updatedAt.slice(0, 16).replace('T', ' ') : <Muted>—</Muted>}</DataCell>
                        <DataCell $w="16%" $align="right">
                          <RowActions>
                            <IconBtn
                              type="button"
                              aria-label={`Preview ${doc.sourceSlug}`}
                              title="Preview the stored text agents retrieve"
                              onClick={() => setPreviewTarget({ id: doc.id, slug: doc.sourceSlug })}
                            >
                              <Eye size={13} strokeWidth={1.7} />
                            </IconBtn>
                            <CopyButton value={doc.sourceSlug} label="Copy pin address" />
                            <IconBtn
                              type="button"
                              aria-label={`Rename pin address of ${doc.sourceSlug}`}
                              title={canWrite ? 'Rename pin address' : writeDenied}
                              disabled={!canWrite || rename.isPending}
                              onClick={() => setRenameTarget({ id: doc.id, slug: doc.sourceSlug })}
                            >
                              <Pencil size={13} strokeWidth={1.7} />
                            </IconBtn>
                            {doc.state !== 'retired' && (
                              <IconBtn
                                type="button"
                                aria-label={`Retire ${doc.sourceSlug}`}
                                title={canWrite ? 'Retire document (tombstone — leaves retrieval, mapping kept)' : writeDenied}
                                disabled={!canWrite || remove.isPending}
                                onClick={() => setDeleteTarget({ id: doc.id, slug: doc.sourceSlug })}
                              >
                                <Trash2 size={13} strokeWidth={1.7} />
                              </IconBtn>
                            )}
                          </RowActions>
                        </DataCell>
                      </DataRow>
                    ))}
                  </DataTable>
                )
              }
            </QueryView>
          </Panel>
          {(documents.data?.length ?? 0) >= DOCUMENTS_CAP && (
            <PageNote>
              Showing the {DOCUMENTS_CAP} newest documents — the list is capped and not paginated; older documents are not listed.
            </PageNote>
          )}
          <PageNote>
            {unsettled
              ? 'A source is still ingesting or failed — pin health and embedding coverage are per-agent: open the agent’s Knowledge section for the verdict. '
              : 'Pin health and embedding coverage are per-agent — open the agent’s Knowledge section for the verdict. '}
            {RETENTION_NOTE}
          </PageNote>
        </SectionGap>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
        <SectionGap>
          <Panel title="Search console" subtitle="Unconstrained hybrid retrieval — an evaluation workbench, not runtime truth (runtime retrieval is pin-constrained).">
            <SearchRow>
              <TextInput
                label="Query"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="How do refunds work?"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchInput);
                  }
                }}
              />
              <ActionButton size="sm" disabled={!searchInput.trim()} onClick={() => setSearchQuery(searchInput)}>
                <Search size={13} strokeWidth={1.8} />
                Search
              </ActionButton>
            </SearchRow>
            {searchQuery.trim() !== '' && (
              <QueryView
                query={search}
                isEmpty={(d) => d.length === 0}
                empty={{ title: 'No chunks matched', description: 'Nothing retrievable answers this yet — ingest the source first.' }}
              >
                {(hits) => (
                  <div>
                    {hits.map((hit) => (
                      <HitCard key={hit.chunkId}>
                        <HitMeta>
                          <Mono>{hit.title ?? hit.documentId.slice(0, 8)}</Mono>
                          <Muted>
                            chunk #{hit.sequence}
                            {hit.byteStart !== null && hit.byteEnd !== null ? ` · bytes ${hit.byteStart}–${hit.byteEnd}` : ''}
                            {' · '}score {hit.score.toFixed(3)}
                          </Muted>
                          <CopyButton value={hit.documentId} label="Copy document id" />
                        </HitMeta>
                        <HitText>{hit.text}</HitText>
                      </HitCard>
                    ))}
                  </div>
                )}
              </QueryView>
            )}
          </Panel>
        </SectionGap>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>
        <SectionGap>
          <Panel
            title="Long-term memories"
            subtitle="Memories moved to their own surface in C08 — one surface remembers."
          >
            <Muted>
              Browse, search, and manage memories in the <Link to="/agent-studio/memory">Memory library</Link> —
              moved there from this page, not copied.
            </Muted>
          </Panel>
        </SectionGap>
      </motion.div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onAttach={attach} onAttachText={attachText} canWrite={canWrite} writeDenied={writeDenied} />
      <PreviewModal target={previewTarget} onClose={() => setPreviewTarget(null)} />
      <DeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        pending={remove.isPending}
        onConfirm={(id) => {
          remove.mutate(id, {
            onSuccess: () => {
              toast.success('Document retired — it leaves retrieval immediately; the mapping stays as a tombstone.');
              setDeleteTarget(null);
            },
          });
        }}
      />
      <RenameModal
        target={renameTarget}
        onClose={() => setRenameTarget(null)}
        onRename={(slug) => {
          if (!renameTarget) {
            return;
          }
          rename.mutate(
            { documentId: renameTarget.id, sourceSlug: slug },
            { onSuccess: () => setRenameTarget(null) },
          );
        }}
        pending={rename.isPending}
      />
    </ViewShell>
  );
}

interface UploadRow {
  key: number;
  file: File;
  slug: string;
  title: string;
}

/* Slug intent + paste validation live in the shared knowledge model (C05) —
   one rule, builder and library. */

/** Paste-tab formats (labels for the shared allowlist subset). */
const PASTE_LABELS: Record<PasteUploadType, string> = {
  'text/plain': 'Text',
  'text/markdown': 'Markdown',
  'text/csv': 'CSV',
  'application/json': 'JSON',
};

function UploadModal({
  open,
  onClose,
  onAttach,
  onAttachText,
  canWrite,
  writeDenied,
}: {
  open: boolean;
  onClose: () => void;
  onAttach: (input: { file: File; sourceSlug?: string; title?: string }) => Promise<string | null>;
  onAttachText: (input: { text: string; slug: string; mediaType: PasteUploadType; title?: string }) => Promise<string | null>;
  canWrite: boolean;
  writeDenied: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteMedia, setPasteMedia] = useState<PasteUploadType>('text/markdown');
  const [pasteSlug, setPasteSlug] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const keyRef = useRef(0);

  const addFiles = (files: FileList | null) => {
    if (!files) {
      return;
    }
    const next: UploadRow[] = [];
    for (const file of Array.from(files)) {
      keyRef.current += 1;
      next.push({ key: keyRef.current, file, slug: slugifyFilename(file.name), title: file.name.replace(/\.[a-z0-9]+$/i, '') });
    }
    setRows((prev) => [...prev, ...next]);
  };

  const setRow = (key: number, patch: Partial<UploadRow>) => {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const problems = rows.map((row) => (row.slug.trim() ? checkSourceSlug(row.slug) : null));
  const blocked = problems.some((problem) => problem !== null);

  const submit = () => {
    if (rows.length === 0 || blocked || busy) {
      return;
    }
    setBusy(true);
    void (async () => {
      let authorized = 0;
      let unsupported = 0;
      for (const row of rows) {
        try {
          const sessionId = await onAttach({
            file: row.file,
            ...(row.slug.trim() ? { sourceSlug: row.slug.trim().toLowerCase() } : {}),
            ...(row.title.trim() ? { title: row.title.trim() } : {}),
          });
          if (sessionId === null) {
            unsupported += 1;
          } else {
            authorized += 1;
          }
        } catch (error) {
          toast.error(uploadErrorCopy(row.file.name, error));
        }
      }
      if (unsupported > 0) {
        toast.error(`${unsupported} file${unsupported === 1 ? '' : 's'} not a supported type (${KNOWLEDGE_MEDIA_TYPES.join(', ')})`);
      }
      if (authorized > 0) {
        toast.success(`${authorized} upload${authorized === 1 ? '' : 's'} authorized — tracking ingestion to READY`);
        setRows([]);
        setBusy(false);
        onClose();
      } else {
        // A4-09 — nothing was authorized: keep the selection and the modal
        // open so the user can address the refusal (e.g. shrink the file)
        // and retry without reselecting everything.
        setBusy(false);
      }
    })();
  };

  const submitPaste = () => {
    if (busy) return;
    const pasteCheck = validatePaste(pasteText, pasteMedia);
    if (!pasteCheck.ok) {
      toast.error(pasteCheck.message);
      return;
    }
    const slugProblem = pasteSlug.trim() ? checkSourceSlug(pasteSlug) : 'A pin address is required for pastes.';
    if (slugProblem) {
      toast.error(slugProblem);
      return;
    }
    setBusy(true);
    void (async () => {
      try {
        const sessionId = await onAttachText({
          text: pasteText,
          slug: pasteSlug.trim().toLowerCase(),
          mediaType: pasteCheck.mediaType,
          ...(pasteTitle.trim() ? { title: pasteTitle.trim() } : {}),
        });
        if (sessionId === null) {
          toast.error('Paste could not start — try again.');
        } else {
          toast.success('Paste authorized — tracking ingestion to READY');
        }
        setPasteText('');
        setPasteSlug('');
        setPasteTitle('');
        setBusy(false);
        onClose();
      } catch (error) {
        toast.error(uploadErrorCopy('Paste', error));
        setBusy(false);
      }
    })();
  };

  const pasteBlocked = pasteText.trim() === '' || pasteSlug.trim() === '' || busy;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload documents"
      width={640}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          {tab === 'upload' ? (
            <ActionButton disabled={!canWrite || rows.length === 0 || blocked || busy} title={canWrite ? 'Authorize an upload session per file' : writeDenied} onClick={submit}>
              <Upload size={13} strokeWidth={1.8} />
              Upload {rows.length > 0 ? `${rows.length} file${rows.length === 1 ? '' : 's'}` : ''}
            </ActionButton>
          ) : (
            <ActionButton disabled={!canWrite || pasteBlocked} title={canWrite ? 'Authorize an upload session for the paste' : writeDenied} onClick={submitPaste}>
              <Upload size={13} strokeWidth={1.8} />
              Ingest paste
            </ActionButton>
          )}
        </>
      }
    >
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <ActionButton variant={tab === 'upload' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('upload')}>
          Files
        </ActionButton>
        <ActionButton variant={tab === 'paste' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('paste')}>
          Paste text
        </ActionButton>
      </div>
      {tab === 'upload' ? (
        <>
          <input
            ref={fileRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            accept={KNOWLEDGE_MEDIA_TYPES.join(',')}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <ActionButton variant="secondary" onClick={() => fileRef.current?.click()}>
            Choose files (pdf, markdown, text, csv, json, image)
          </ActionButton>
          {rows.map((row) => (
            <div key={row.key} style={{ borderTop: '1px solid var(--neryva-border, #222)', marginTop: 12, paddingTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <strong style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.file.name}</strong>
                <Muted>{(row.file.size / 1024).toFixed(1)} KB</Muted>
                <ActionButton variant="ghost" size="sm" onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}>
                  Remove
                </ActionButton>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                <TextInput
                  label="Pin address intent"
                  value={row.slug}
                  onChange={(e) => setRow(row.key, { slug: e.target.value })}
                  placeholder="omit to derive"
                  hint="Kebab 3–64, reserved now — 409 on collision."
                  error={(row.slug.trim() ? checkSourceSlug(row.slug) : null) ?? undefined}
                />
                <TextInput
                  label="Display title"
                  value={row.title}
                  onChange={(e) => setRow(row.key, { title: e.target.value })}
                  placeholder="Defaults to the slug, else auto"
                />
              </div>
            </div>
          ))}
          {rows.length === 0 && <p style={{ fontSize: 13, opacity: 0.7 }}>No files yet — each file gets its own presigned session and ingestion tracker row.</p>}
        </>
      ) : (
        <>
          <Segmented
            options={PASTE_MEDIA_TYPES.map((mediaType) => ({ value: mediaType, label: PASTE_LABELS[mediaType as PasteUploadType] }))}
            value={pasteMedia}
            onChange={(value) => setPasteMedia(value as PasteUploadType)}
            size="sm"
            ariaLabel="Paste format"
          />
          <div style={{ marginTop: 12 }}>
            <TextArea
              label="Content"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={5}
              placeholder={pasteMedia === 'application/json' ? '{"policy": "refunds within 30 days…"}' : 'Paste the source text…'}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <TextInput
              label="Pin address (required)"
              value={pasteSlug}
              onChange={(e) => setPasteSlug(e.target.value)}
              placeholder="kebab-case, 3–64 chars"
              error={(pasteSlug.trim() ? checkSourceSlug(pasteSlug) : null) ?? undefined}
            />
            <TextInput
              label="Display title"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Defaults to the slug, else auto"
            />
          </div>
          <p style={{ fontSize: 12, opacity: 0.65, marginTop: 8 }}>
            Pasted bytes ride the same verified session flow as files — pin the slug from an agent once READY.
          </p>
        </>
      )}
    </Modal>
  );
}

/** A4-01 — the stored text agents retrieve, inspectable. Latest-version
 *  chunks in sequence order; the server caps the window and says when the
 *  tail is cut (truncated). */
function PreviewModal({ target, onClose }: { target: { id: string; slug: string } | null; onClose: () => void }) {
  const preview = useDocumentPreview(target?.id ?? null, { enabled: target !== null });

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title="Document preview"
      width={720}
      footer={
        <ActionButton variant="secondary" onClick={onClose}>
          Close
        </ActionButton>
      }
    >
      <QueryView
        query={preview}
        isEmpty={(p) => p === null}
        empty={{ title: 'Preview unavailable', description: 'The stored text could not be read.' }}
      >
        {(doc) => {
          // Type guard only: isEmpty already renders the empty state for
          // null, so children never receives it at runtime.
          if (!doc) return null;
          return (
          <div>
            <HitMeta>
              <Mono>{doc.title ?? doc.sourceSlug}</Mono>
              <StatusPill tone={docTone[doc.state] ?? 'neutral'}>{doc.state}</StatusPill>
              <Muted>
                version {doc.latestVersion ?? '—'} · {doc.totalChunks} chunk{doc.totalChunks === 1 ? '' : 's'}
              </Muted>
            </HitMeta>
            {doc.chunks.length === 0 ? (
              <Muted>No stored text yet — chunks appear once ingestion reaches READY.</Muted>
            ) : (
              <>
                {doc.truncated && (
                  <p style={{ fontSize: 12, opacity: 0.65 }}>
                    Showing the first {doc.chunks.length} of {doc.totalChunks} chunks — the stored text continues.
                  </p>
                )}
                {doc.chunks.map((chunk) => (
                  <HitCard key={chunk.sequence}>
                    <HitMeta>
                      <Muted>
                        chunk #{chunk.sequence}
                        {chunk.byteStart !== null && chunk.byteEnd !== null ? ` · bytes ${chunk.byteStart}–${chunk.byteEnd}` : ''}
                      </Muted>
                    </HitMeta>
                    <HitText>{chunk.text}</HitText>
                  </HitCard>
                ))}
              </>
            )}
          </div>
          );
        }}
      </QueryView>
    </Modal>
  );
}

/** A4-05 — removal is a tombstone, and the modal says so: the document
 *  leaves retrieval immediately; the mapping is kept (retired pill). */
function DeleteModal({
  target,
  onClose,
  onConfirm,
  pending,
}: {
  target: { id: string; slug: string } | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  pending: boolean;
}) {
  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title="Retire document"
      width={520}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton variant="danger" disabled={target === null || pending} onClick={() => target && onConfirm(target.id)}>
            Retire
          </ActionButton>
        </>
      }
    >
      <p style={{ fontSize: 13, opacity: 0.75 }}>
        Retire <Mono>{target?.slug}</Mono>? It leaves retrieval immediately — no agent can pull its chunks again. The
        mapping stays as a tombstone so history and existing pins stay answerable; this cannot be undone from the console.
      </p>
    </Modal>
  );
}

function RenameModal({
  target,
  onClose,
  onRename,
  pending,
}: {
  target: { id: string; slug: string } | null;
  onClose: () => void;
  onRename: (slug: string) => void;
  pending: boolean;
}) {
  const [slug, setSlug] = useState('');
  const problem = slug.trim() ? checkSourceSlug(slug) : 'Enter the new pin address.';
  const unchanged = target !== null && slug.trim().toLowerCase() === target.slug;

  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title="Rename pin address"
      width={520}
      footer={
        <>
          <ActionButton variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton disabled={target === null || !!checkSourceSlug(slug) || unchanged || pending} onClick={() => onRename(slug.trim().toLowerCase())}>
            Rename
          </ActionButton>
        </>
      }
    >
      <p style={{ fontSize: 13, opacity: 0.75 }}>
        <Mono>{target?.slug}</Mono> → <Mono>{slug.trim().toLowerCase() || '…'}</Mono>. Existing pins referencing the old slug resolve
        visibly unresolved at next publish — history is never rewritten. A collision refuses (409), never silent-renames.
      </p>
      <div style={{ marginTop: 12 }}>
        <TextInput
          label="New pin address"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="kebab-case, 3–64 chars"
          autoFocus
          error={slug.trim() && !unchanged ? (problem ?? undefined) : undefined}
        />
      </div>
    </Modal>
  );
}
