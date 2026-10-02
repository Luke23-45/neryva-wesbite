import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Search,
  Plug,
  Eye,
  Trash2,
  X,
  History,
  Upload as UploadIcon,
  FileText,
  Filter,
  ChevronDown,
  ArrowRight,
  Activity,
  Ban,
  SlidersHorizontal,
  Info,
} from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
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
import { type AttachmentStatus } from '@hooks/studio/useAttachmentUpload';
import {
  useDocuments,
  useRenameDocumentSlug,
  useDeleteDocument,
  useKnowledgeSearch,
  type KnowledgeSearchMode,
} from '@hooks/studio/useSetupKnowledge';
import { checkSourceSlug } from '@lib/engine/setup-caps';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { useKnowledgeUploads } from './KnowledgeUploads';

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

/* ── Hero Documents Card ─────────────────────────────────────── */

const HeroCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  background: ${({ theme }) => theme.app.surface.base};
  overflow: hidden;
`;

const HeroHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.default};
`;

const HeroTitle = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const CountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 18px;
  padding: 0 8px;
  border-radius: 9px;
  background: ${({ theme }) => theme.app.surface.active};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.muted};
`;

const HeroNote = styled.span`
  margin-left: auto;
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.muted};
`;

const HeroBody = styled.div`
  padding: 48px 24px;
  text-align: center;
`;

const EmptyIconWrap = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: ${({ theme }) => theme.app.surface.active};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  margin-bottom: 20px;
  position: relative;
`;

const EmptyPlus = styled.span`
  position: absolute;
  bottom: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ theme }) => theme.app.text.link};
  border: 2px solid ${({ theme }) => theme.app.surface.base};
  color: white;
`;

const EmptyTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const EmptyDesc = styled.p`
  margin: 0 0 24px;
  font-size: 13.5px;
  line-height: 1.5;
  color: ${({ theme }) => theme.app.text.muted};
`;

const CtaRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

/* ── How-it-works strip ──────────────────────────────────────── */

const HowStrip = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const HowStep = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 20px 24px;

  & + & {
    border-left: 1px solid ${({ theme }) => theme.app.border.default};

    @media (max-width: 720px) {
      border-left: none;
      border-top: 1px solid ${({ theme }) => theme.app.border.default};
    }
  }
`;

const HowIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.active};
  color: ${({ theme }) => theme.app.text.muted};
  flex-shrink: 0;
`;

const HowTitle = styled.h4`
  margin: 0 0 2px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const HowDesc = styled.div`
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.app.text.muted};
`;

/* ── Fact strip ──────────────────────────────────────────────── */

const FactStrip = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  margin: 32px 0;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Fact = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const FactIcon = styled.span`
  color: ${({ theme }) => theme.app.text.muted};
  flex-shrink: 0;
  margin-top: 2px;
`;

const FactTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  margin-bottom: 4px;
`;

const FactDesc = styled.div`
  font-size: 12px;
  line-height: 1.55;
  color: ${({ theme }) => theme.app.text.muted};
`;

/* ── Search console ──────────────────────────────────────────── */

const EvalBadge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 10px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.status.info.bg};
  border: 1px solid ${({ theme }) => theme.app.status.info.border};
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: ${({ theme }) => theme.app.status.info.fg};
`;

const SearchComposer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
`;

const SearchInputWrap = styled.div`
  position: relative;
  flex: 1;
`;

const KbdHint = styled.kbd`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 6px;
  background: ${({ theme }) => theme.app.surface.active};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  font-family: inherit;
  font-size: 11px;
  color: ${({ theme }) => theme.app.text.muted};
  pointer-events: none;
`;

const ChipRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const ChipSelectWrap = styled.label`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const ChipSelect = styled.select`
  appearance: none;
  height: 28px;
  padding: 0 28px 0 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.muted};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.app.border.strong};
    color: ${({ theme }) => theme.app.text.secondary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.text.link};
    outline-offset: 1px;
  }
`;

const ChipChevron = styled.span`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.app.text.muted};
  pointer-events: none;
  display: flex;
`;

const ChipNote = styled.span`
  margin-left: auto;
  font-size: 11.5px;
  color: ${({ theme }) => theme.app.text.muted};
`;

const ResultsWell = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 32px 24px;
  text-align: center;
`;

const HitCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  text-align: left;
  background: ${({ theme }) => theme.app.surface.base};
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

/* ── Memory redirect row ─────────────────────────────────────── */

const MemoryRow = styled(Link)`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  background: ${({ theme }) => theme.app.surface.base};
  text-decoration: none;
  transition: border-color 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.app.border.strong};
  }
`;

const MemoryIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.status.info.bg};
  border: 1px solid ${({ theme }) => theme.app.status.info.border};
  color: ${({ theme }) => theme.app.status.info.fg};
  flex-shrink: 0;
`;

const MemoryText = styled.span`
  flex: 1;
`;

const MemoryTitle = styled.span`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  margin-bottom: 2px;
`;

const MemoryDesc = styled.span`
  display: block;
  font-size: 12.5px;
  color: ${({ theme }) => theme.app.text.muted};
`;

const MemoryLink = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.link};
  white-space: nowrap;
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

const SEARCH_MODES: { value: KnowledgeSearchMode; label: string }[] = [
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'semantic', label: 'Semantic' },
  { value: 'keyword', label: 'Keyword' },
];

const TOP_K_OPTIONS = [4, 8, 12, 16, 20];

export function KnowledgeView() {
  const { role } = useOrg();
  const canWrite = canSetup(role, 'setup:author');
  const writeDenied = setupDeniedCopy(role, 'setup:author');
  const navigate = useNavigate();
  // A4-06: load the full 200-document window the engine serves (default 50
  // silently hid older documents); the cap is disclosed under the table.
  const documents = useDocuments(DOCUMENTS_CAP);
  const { uploads, dismiss } = useKnowledgeUploads();
  const rename = useRenameDocumentSlug();
  const remove = useDeleteDocument();

  const [filter, setFilter] = useState('');
  const [renameTarget, setRenameTarget] = useState<{ id: string; slug: string } | null>(null);
  const [renameSlug, setRenameSlug] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; slug: string } | null>(null);

  // Search workbench state
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<KnowledgeSearchMode>('hybrid');
  const [searchTopK, setSearchTopK] = useState(8);
  const [searchScope, setSearchScope] = useState<string>('all');

  // Inline rename: a typed-but-unsaved slug is unsent content — leaving
  // the page discards it.
  const renameDirty = renameTarget !== null && renameSlug !== renameTarget.slug;
  const { dialog: renameDirtyDialog } = useDirtyGuard(
    renameDirty,
    'You have an unsaved pin address rename. Leaving now discards it.',
  );

  // Same rules as the old RenameModal, byte-identical: kebab-case via the
  // shared checkSourceSlug, empty input asks for an address, an unchanged
  // slug is a no-op (Save stays disabled).
  const renameProblem = renameSlug.trim() ? checkSourceSlug(renameSlug) : 'Enter the new pin address.';
  const renameUnchanged = renameTarget !== null && renameSlug.trim().toLowerCase() === renameTarget.slug;
  const renameInvalid = checkSourceSlug(renameSlug) !== null;

  const startRename = (id: string, slug: string) => {
    if (renameTarget?.id === id) {
      setRenameTarget(null);
      setRenameSlug('');
      return;
    }
    setRenameTarget({ id, slug });
    setRenameSlug(slug);
  };

  const cancelRename = () => {
    setRenameTarget(null);
    setRenameSlug('');
  };

  const saveRename = () => {
    if (!renameTarget || renameInvalid || renameUnchanged || rename.isPending) {
      return;
    }
    rename.mutate(
      { documentId: renameTarget.id, sourceSlug: renameSlug.trim().toLowerCase() },
      { onSuccess: () => cancelRename() },
    );
  };

  const runSearch = () => {
    if (searchInput.trim()) {
      setSearchQuery(searchInput);
    }
  };

  const search = useKnowledgeSearch(searchQuery, searchTopK, {
    enabled: searchQuery.trim().length > 0,
    mode: searchMode,
    documentId: searchScope === 'all' ? undefined : searchScope,
  });

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

  const docCount = documents.data?.length ?? 0;

  return (
    <ViewShell>
      {renameDirtyDialog}
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Knowledge base</ViewTitle>
          <ViewSubtitle>
            Every document your agents retrieve — uploads and connector syncs — and the pinned versions they bind to.
          </ViewSubtitle>
        </ViewHeader>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/agent-studio/integrations">
            <ActionButton variant="secondary" size="sm">
              <Plug size={13} strokeWidth={1.8} />
              Connectors
            </ActionButton>
          </Link>
          <ActionButton size="sm" disabled={!canWrite} title={canWrite ? 'Upload a document' : writeDenied} onClick={() => {
            if (canWrite) {
              navigate({ to: '/agent-studio/knowledge/upload' });
            }
          }}>
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
                  <DataCell $w="20%">
                    {u.versionOfSlug ? (
                      <span>
                        <Mono>{u.versionOfSlug}</Mono> <Muted>· new version</Muted>
                      </span>
                    ) : u.sourceSlug ? (
                      <Mono>{u.sourceSlug}</Mono>
                    ) : (
                      <Muted>derived at ingestion</Muted>
                    )}
                  </DataCell>
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

      {/* ── Documents hero card ── */}
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <SectionGap>
          <HeroCard>
            <HeroHeader>
              <HeroTitle>Documents</HeroTitle>
              <CountBadge>{docCount}</CountBadge>
              <span title="Titles are display-only — pins bind to slugs, never titles.">
                <Info size={14} style={{ opacity: 0.6 }} />
              </span>
              <HeroNote>Titles are display-only · pins bind to slugs</HeroNote>
            </HeroHeader>

            <QueryView
              query={documents}
            >
              {(docs) =>
                docs.length === 0 && filter.trim() === '' ? (
                  <HeroBody>
                    <EmptyIconWrap>
                      <FileText size={28} strokeWidth={1.3} style={{ color: '#93c5fd' }} />
                      <EmptyPlus>
                        <Plus size={12} strokeWidth={2.5} />
                      </EmptyPlus>
                    </EmptyIconWrap>
                    <EmptyTitle>No documents yet</EmptyTitle>
                    <EmptyDesc>
                      Upload a file or connect a source to build the pool<br />
                      your agents retrieve from.
                    </EmptyDesc>
                    <CtaRow>
                      <ActionButton
                        size="sm"
                        disabled={!canWrite}
                        title={canWrite ? 'Upload a document' : writeDenied}
                        onClick={() => canWrite && navigate({ to: '/agent-studio/knowledge/upload' })}
                      >
                        <UploadIcon size={14} strokeWidth={2} />
                        Upload a file
                      </ActionButton>
                      <Link to="/agent-studio/integrations">
                        <ActionButton variant="secondary" size="sm">
                          <Plug size={13} strokeWidth={1.8} />
                          Connect a source
                        </ActionButton>
                      </Link>
                    </CtaRow>
                  </HeroBody>
                ) : (
                  <div style={{ padding: '0 0 8px' }}>
                    <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: 280 }}>
                        <TextInput
                          aria-label="Filter documents"
                          placeholder="Filter by slug, title, state…"
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                        />
                      </div>
                    </div>
                    {rows.length === 0 ? (
                      <EmptyState
                        icon={<Search size={18} opacity={0.5} />}
                        title="No documents match"
                        description="Try a different filter."
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
                        {rows.map((doc) => (
                          <DataRow key={doc.id} $interactive={false}>
                            <DataCell $w="24%">
                              {renameTarget?.id === doc.id ? (
                                <div>
                                  <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>
                                    <Mono>{renameTarget.slug}</Mono> → <Mono>{renameSlug.trim().toLowerCase() || '…'}</Mono>
                                  </div>
                                  <TextInput
                                    aria-label={`New pin address for ${renameTarget.slug}`}
                                    value={renameSlug}
                                    onChange={(e) => setRenameSlug(e.target.value)}
                                    placeholder="kebab-case, 3–64 chars"
                                    autoFocus
                                    error={renameSlug.trim() && !renameUnchanged ? (renameProblem ?? undefined) : undefined}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        saveRename();
                                      } else if (e.key === 'Escape') {
                                        cancelRename();
                                      }
                                    }}
                                  />
                                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                    <ActionButton
                                      size="sm"
                                      disabled={renameInvalid || renameUnchanged || rename.isPending}
                                      title="Rename the pin address — history is never rewritten"
                                      onClick={saveRename}
                                    >
                                      Save
                                    </ActionButton>
                                    <ActionButton variant="ghost" size="sm" onClick={cancelRename}>
                                      Cancel
                                    </ActionButton>
                                  </div>
                                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8, lineHeight: 1.5 }}>
                                    Existing pins referencing the old slug resolve visibly unresolved at next publish —
                                    history is never rewritten. A collision refuses (409), never silent-renames.
                                  </div>
                                </div>
                              ) : (
                                <Mono>{doc.sourceSlug || <Muted>—</Muted>}</Mono>
                              )}
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
                                  onClick={() => navigate({ to: `/agent-studio/knowledge/${doc.id}/preview` })}
                                >
                                  <Eye size={13} strokeWidth={1.7} />
                                </IconBtn>
                                <CopyButton value={doc.sourceSlug} label="Copy pin address" />
                                <IconBtn
                                  type="button"
                                  aria-label={`Rename pin address of ${doc.sourceSlug}`}
                                  title={canWrite ? 'Rename pin address' : writeDenied}
                                  disabled={!canWrite || rename.isPending}
                                  onClick={() => startRename(doc.id, doc.sourceSlug)}
                                >
                                  <Pencil size={13} strokeWidth={1.7} />
                                </IconBtn>
                                {doc.state !== 'retired' && (
                                  <IconBtn
                                    type="button"
                                    aria-label={`Upload new version of ${doc.sourceSlug}`}
                                    title={
                                      canWrite
                                        ? 'Upload a new version — the pin address stays the same; agents resolve the latest version at next publish'
                                        : writeDenied
                                    }
                                    disabled={!canWrite}
                                    onClick={() => navigate({ to: `/agent-studio/knowledge/${doc.id}/versions/upload` })}
                                  >
                                    <History size={13} strokeWidth={1.7} />
                                  </IconBtn>
                                )}
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
                    )}
                  </div>
                )
              }
            </QueryView>

            <HowStrip>
              <HowStep>
                <HowIcon>
                  <UploadIcon size={16} strokeWidth={1.8} />
                </HowIcon>
                <div>
                  <HowTitle>Ingest</HowTitle>
                  <HowDesc>Upload files or sync connector sources.</HowDesc>
                </div>
              </HowStep>
              <HowStep>
                <HowIcon>
                  <Filter size={16} strokeWidth={1.8} />
                </HowIcon>
                <div>
                  <HowTitle>Pin</HowTitle>
                  <HowDesc>Slugs are stable addresses versions bind to.</HowDesc>
                </div>
              </HowStep>
              <HowStep>
                <HowIcon>
                  <Search size={16} strokeWidth={1.8} />
                </HowIcon>
                <div>
                  <HowTitle>Retrieve</HowTitle>
                  <HowDesc>Agents pull pinned versions at runtime.</HowDesc>
                </div>
              </HowStep>
            </HowStrip>
          </HeroCard>

          {(documents.data?.length ?? 0) >= DOCUMENTS_CAP && (
            <PageNote>
              Showing the {DOCUMENTS_CAP} newest documents — the list is capped and not paginated; older documents are not listed.
            </PageNote>
          )}
        </SectionGap>
      </motion.div>

      {/* ── Fact strip ── */}
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
        <FactStrip>
          <Fact>
            <FactIcon>
              <Activity size={16} strokeWidth={1.8} />
            </FactIcon>
            <div>
              <FactTitle>Health is per-agent</FactTitle>
              <FactDesc>
                Pin health and embedding coverage are scored per agent — open its Knowledge section.
              </FactDesc>
            </div>
          </Fact>
          <Fact>
            <FactIcon>
              <Ban size={16} strokeWidth={1.8} />
            </FactIcon>
            <div>
              <FactTitle>No delete verb</FactTitle>
              <FactDesc>
                The engine exposes no delete. Retired rows remain as upstream tombstones.
              </FactDesc>
            </div>
          </Fact>
          <Fact>
            <FactIcon>
              <SlidersHorizontal size={16} strokeWidth={1.8} />
            </FactIcon>
            <div>
              <FactTitle>Unmap to stop serving</FactTitle>
              <FactDesc>
                Unmap a pin in the builder to stop serving. History stays intact.
              </FactDesc>
            </div>
          </Fact>
        </FactStrip>
      </motion.div>

      {/* ── Search console ── */}
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>
        <SectionGap>
          <Panel
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                Search console
                <EvalBadge>EVALUATION MODE</EvalBadge>
              </span>
            }
            subtitle="Unconstrained hybrid retrieval across every document — a workbench for testing recall, not runtime truth."
          >
            <SearchComposer>
              <SearchInputWrap>
                <TextInput
                  aria-label="Search query"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="How do refunds work?"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      runSearch();
                    }
                  }}
                />
                <KbdHint>⌘↵</KbdHint>
              </SearchInputWrap>
              <ActionButton size="sm" disabled={!searchInput.trim()} onClick={runSearch}>
                <Search size={13} strokeWidth={1.8} />
                Run search
              </ActionButton>
            </SearchComposer>

            <ChipRow>
              <ChipSelectWrap>
                <ChipSelect
                  aria-label="Search scope"
                  value={searchScope}
                  onChange={(e) => setSearchScope(e.target.value)}
                >
                  <option value="all">Scope: All documents</option>
                  {(documents.data ?? []).map((d) => (
                    <option key={d.id} value={d.id}>
                      Scope: {d.sourceSlug || d.title || d.id.slice(0, 8)}
                    </option>
                  ))}
                </ChipSelect>
                <ChipChevron>
                  <ChevronDown size={14} strokeWidth={2} />
                </ChipChevron>
              </ChipSelectWrap>

              <ChipSelectWrap>
                <ChipSelect
                  aria-label="Top K results"
                  value={searchTopK}
                  onChange={(e) => setSearchTopK(Number(e.target.value))}
                >
                  {TOP_K_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      Top K: {k}
                    </option>
                  ))}
                </ChipSelect>
                <ChipChevron>
                  <ChevronDown size={14} strokeWidth={2} />
                </ChipChevron>
              </ChipSelectWrap>

              <ChipSelectWrap>
                <ChipSelect
                  aria-label="Retrieval mode"
                  value={searchMode}
                  onChange={(e) => setSearchMode(e.target.value as KnowledgeSearchMode)}
                >
                  {SEARCH_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      Mode: {m.label}
                    </option>
                  ))}
                </ChipSelect>
                <ChipChevron>
                  <ChevronDown size={14} strokeWidth={2} />
                </ChipChevron>
              </ChipSelectWrap>

              <ChipNote>Queries the live index · results are not cached</ChipNote>
            </ChipRow>

            {searchQuery.trim() === '' ? (
              <ResultsWell>
                <Search size={20} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 12 }} />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Results appear here</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>Ranked chunks with scores, source document, and pin metadata.</div>
              </ResultsWell>
            ) : (
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

      {/* ── Memory redirect ── */}
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={5}>
        <SectionGap>
          <MemoryRow to="/agent-studio/memory">
            <MemoryIcon>
              <FileText size={18} strokeWidth={1.8} />
            </MemoryIcon>
            <MemoryText>
              <MemoryTitle>Long-term memories live in the Memory library</MemoryTitle>
              <MemoryDesc>Moved there from this page — one surface remembers, nothing is copied.</MemoryDesc>
            </MemoryText>
            <MemoryLink>
              Open Memory library
              <ArrowRight size={14} strokeWidth={2} />
            </MemoryLink>
          </MemoryRow>
        </SectionGap>
      </motion.div>

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
    </ViewShell>
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
