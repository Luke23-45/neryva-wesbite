import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { Segmented } from '@components/common/ui/Segmented';
import { ActionButton } from '@components/common/ui/ActionButton';
import { pageItem } from '@styles/motion';
import { KNOWLEDGE_MEDIA_TYPES, type PasteUploadType } from '@hooks/studio/useAttachmentUpload';
import {
  slugifyFilename,
  validatePaste,
  validateSourceSlug,
  PASTE_MEDIA_TYPES,
} from '@/sections/pages/products/agent-studio/builder/lib/knowledge-model';
import { checkSourceSlug } from '@lib/engine/setup-caps';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { formatValidationDetails } from '@lib/engine/errors';
import { ApiError } from '@lib/engine/client';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import { useKnowledgeUploads } from './KnowledgeUploads';

const Muted = styled.span`
  opacity: 0.55;
`;

const TabsRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const RowCard = styled.div`
  border-top: 1px solid ${({ theme }) => theme.app.border.strong};
  margin-top: 12px;
  padding-top: 12px;
`;

const RowHead = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
`;

const RowName = styled.strong`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
`;

const NoteP = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  margin: 8px 0 0;
`;

const EmptyNote = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

interface UploadRow {
  key: number;
  file: File;
  slug: string;
  title: string;
}

/** A4-04 — validation refusals carry the actionable reason in `details`
 *  (e.g. byte_length: exceeds KNOWLEDGE_MAX_UPLOAD_BYTES (1024)); the
 *  toast must name it, not just "Request validation failed". */
function uploadErrorCopy(name: string, error: unknown): string {
  const base = error instanceof Error ? error.message : 'upload failed';
  const details = error instanceof ApiError ? formatValidationDetails(error.details) : null;
  return details ? `${name}: ${base} — ${details}` : `${name}: ${base}`;
}

/** Paste-tab formats (labels for the shared allowlist subset). */
const PASTE_LABELS: Record<PasteUploadType, string> = {
  'text/plain': 'Text',
  'text/markdown': 'Markdown',
  'text/csv': 'CSV',
  'application/json': 'JSON',
};

/**
 * Upload documents — dedicated section replacing UploadModal (K-1). Both
 * tabs are byte-faithful to the modal: per-file rows with kebab-case
 * pin-address intent validated by the same shared `checkSourceSlug`
 * (setup-caps, one rule with the builder), display titles, and the
 * authorize-per-file / ingest-paste submit flow with identical
 * A4-09 keep-on-refusal semantics.
 *
 * attach/attachText come from the shared knowledge uploads instance
 * (KnowledgeUploadsProvider), so the library's "Uploads" tracker keeps
 * polling to READY and invalidating the documents list (A4-02) exactly as
 * when the modal fed KnowledgeView's own hook.
 */
export function UploadSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canWrite = canSetup(role, 'setup:author');
  const { attach, attachText } = useKnowledgeUploads();

  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteMedia, setPasteMedia] = useState<PasteUploadType>('text/markdown');
  const [pasteSlug, setPasteSlug] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const keyRef = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Dirty guard: block navigation while files or pasted text are unsent.
  const dirty =
    rows.length > 0 || pasteText.trim() !== '' || pasteSlug.trim() !== '' || pasteTitle.trim() !== '';
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have unsent uploads. Leaving now discards the selected files and pasted text.');

  // Non-author roles land here directly — bounce to the library (server
  // gates too). Nothing renders before the gate.
  useEffect(() => {
    if (!canWrite) {
      navigate({ to: '/agent-studio/knowledge' });
    }
  }, [canWrite, navigate]);

  if (!canWrite) {
    return null;
  }

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
          const sessionId = await attach({
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
        navigate({ to: '/agent-studio/knowledge' });
      } else {
        // A4-09 — nothing was authorized: keep the selection on the page
        // so the user can address the refusal (e.g. shrink the file)
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
        const sessionId = await attachText({
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
        navigate({ to: '/agent-studio/knowledge' });
      } catch (error) {
        toast.error(uploadErrorCopy('Paste', error));
        setBusy(false);
      }
    })();
  };

  // K-BUG4: an invalid slug must hold the button, not just a blank one —
  // the field already shows the error inline; the button must agree.
  const pasteBlocked = pasteText.trim() === '' || !!validateSourceSlug(pasteSlug) || busy;

  return (
    <ViewShell>
      {dirtyDialog}
      <SectionBackRow to="/agent-studio/knowledge">
        <span aria-hidden="true">‹</span> Knowledge
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Upload documents</ViewTitle>
          <ViewSubtitle>
            Each file gets its own presigned session and ingestion tracker row — pasted bytes ride the same verified
            session flow.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Upload" subtitle="Pin address intent is kebab-case; the pin address stays reserved even on collision (409).">
          <TabsRow>
            <ActionButton variant={tab === 'upload' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('upload')}>
              Files
            </ActionButton>
            <ActionButton variant={tab === 'paste' ? 'primary' : 'secondary'} size="sm" onClick={() => setTab('paste')}>
              Paste text
            </ActionButton>
          </TabsRow>
          {tab === 'upload' ? (
            <>
              <HiddenFileInput
                ref={fileRef}
                type="file"
                multiple
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
                <RowCard key={row.key}>
                  <RowHead>
                    <RowName>{row.file.name}</RowName>
                    <Muted>{(row.file.size / 1024).toFixed(1)} KB</Muted>
                    <ActionButton variant="ghost" size="sm" onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}>
                      Remove
                    </ActionButton>
                  </RowHead>
                  <Grid2>
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
                      maxLength={256}
                      hint="≤256 characters — the engine rejects longer titles (400)."
                    />
                  </Grid2>
                </RowCard>
              ))}
              {rows.length === 0 && (
                <EmptyNote>No files yet — each file gets its own presigned session and ingestion tracker row.</EmptyNote>
              )}
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
              <Grid2 style={{ marginTop: 12 }}>
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
                  maxLength={256}
                  hint="≤256 characters — the engine rejects longer titles (400)."
                />
              </Grid2>
              <NoteP>
                Pasted bytes ride the same verified session flow as files — pin the slug from an agent once READY.
              </NoteP>
            </>
          )}
          <ActionsRow>
            <ActionButton variant="secondary" onClick={() => navigate({ to: '/agent-studio/knowledge' })}>
              Cancel
            </ActionButton>
            {tab === 'upload' ? (
              <ActionButton disabled={rows.length === 0 || blocked || busy} title="Authorize an upload session per file" onClick={submit}>
                <Upload size={13} strokeWidth={1.8} />
                Upload {rows.length > 0 ? `${rows.length} file${rows.length === 1 ? '' : 's'}` : ''}
              </ActionButton>
            ) : (
              <ActionButton disabled={pasteBlocked} title="Authorize an upload session for the paste" onClick={submitPaste}>
                <Upload size={13} strokeWidth={1.8} />
                Ingest paste
              </ActionButton>
            )}
          </ActionsRow>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
