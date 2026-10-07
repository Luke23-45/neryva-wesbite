import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { pageItem } from '@styles/motion';
import { KNOWLEDGE_MEDIA_TYPES } from '@hooks/studio/useAttachmentUpload';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { formatValidationDetails } from '@lib/engine/errors';
import { ApiError } from '@lib/engine/client';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { useDocuments, type KnowledgeDocument } from '@hooks/studio/useSetupKnowledge';
import { SectionBackRow } from './SectionBackRow';
import { useKnowledgeUploads } from './KnowledgeUploads';

const KNOWLEDGE_PATH = '/agent-studio/knowledge';

/** Full route id (child of agentStudioKnowledgeRoute, path '/$docId/versions/upload'). */
export const KNOWLEDGE_VERSION_UPLOAD_ROUTE_ID = '/agent-studio/knowledge/$docId/versions/upload' as const;

/** A4-06 — same 200-document window the library view loads. */
const DOCUMENTS_CAP = 200;

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.55;
`;

const BodyP = styled.p`
  font-size: 13px;
  margin: 0 0 4px;
`;

const NoteP = styled.p`
  font-size: 12px;
  opacity: 0.65;
  margin: 0 0 12px;
  line-height: 1.55;
`;

const HiddenFileInput = styled.input`
  /* Visually hidden but still rendered: Chrome will not open the file picker
     for a programmatic click() on a display:none input. */
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

const FileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  margin-top: 12px;
`;

const FileName = styled.strong`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

/** A4-04 — validation refusals carry the actionable reason in `details`
 *  (e.g. byte_length: exceeds KNOWLEDGE_MAX_UPLOAD_BYTES (1024)); the
 *  toast must name it, not just "Request validation failed". */
function uploadErrorCopy(name: string, error: unknown): string {
  const base = error instanceof Error ? error.message : 'upload failed';
  const details = error instanceof ApiError ? formatValidationDetails(error.details) : null;
  return details ? `${name}: ${base} — ${details}` : `${name}: ${base}`;
}

/**
 * Upload a new version of an existing document — dedicated section replacing
 * the VersionUploadModal (A4-11). Byte-faithful to the modal: single file
 * picker only (no slug field — the pin address is immutable on versions; no
 * title field — the document keeps its title), current-version line, the
 * K12 pin-resolution copy, authorize-per-file submit with identical A4-09
 * keep-on-refusal semantics, and the unsupported-type toast.
 *
 * attach comes from the shared knowledge uploads instance
 * (KnowledgeUploadsProvider, mounted by the knowledge route layout), so the
 * library's "Uploads" tracker keeps polling to READY and invalidating the
 * documents list (A4-02) exactly as when the modal fed KnowledgeView's own
 * hook. Unknown document ids bounce to the library (server gates the write
 * too; the id can only arrive from a stale link).
 */
export function VersionUploadSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canWrite = canSetup(role, 'setup:author');
  // Strict-from: the route is registered in routes.tsx under
  // agentStudioKnowledgeRoute (parent wires it at review).
  const params = useParams({ from: KNOWLEDGE_VERSION_UPLOAD_ROUTE_ID });
  const docId = params.docId ?? '';
  const documents = useDocuments(DOCUMENTS_CAP);
  const doc = (documents.data ?? []).find((d) => d.id === docId) ?? null;
  const unknownId = !documents.isPending && !documents.isError && doc === null;
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Non-author roles land here directly — bounce to the library (server
  // gates too). Nothing renders before the gate.
  useEffect(() => {
    if (!canWrite) {
      navigate({ to: KNOWLEDGE_PATH });
    }
  }, [canWrite, navigate]);

  useEffect(() => {
    if (unknownId) {
      navigate({ to: KNOWLEDGE_PATH });
    }
  }, [unknownId, navigate]);

  if (!canWrite || unknownId) {
    return null;
  }

  return (
    <ViewShell>
      <SectionBackRow to={KNOWLEDGE_PATH}>
        <span aria-hidden="true">‹</span> Knowledge
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>
            Upload new version
          </ViewTitle>
          <ViewSubtitle>
            Append a version to a document — the pin address never changes, and agents resolve the latest version at
            next publish.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <QueryView query={documents}>
          {(docs) => {
            const current = docs.find((d) => d.id === docId);
            return current ? <VersionUploadForm key={current.id} doc={current} /> : null;
          }}
        </QueryView>
      </motion.div>
    </ViewShell>
  );
}

function VersionUploadForm({ doc }: { doc: KnowledgeDocument }) {
  const navigate = useNavigate();
  const { attach } = useKnowledgeUploads();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  // Dirty guard: a selected-but-unauthorized file is unsent content.
  // Released on submit (file cleared) so the success navigation is never blocked.
  const dirty = file !== null;
  const { dialog: dirtyDialog } = useDirtyGuard(
    dirty,
    'You selected a file but did not upload it. Leaving now discards the selection.',
  );

  const submit = () => {
    if (!file || busy) {
      return;
    }
    const selected = file;
    setBusy(true);
    void (async () => {
      try {
        const sessionId = await attach({ file: selected, targetDocumentId: doc.id, versionOfSlug: doc.sourceSlug });
        if (sessionId === null) {
          toast.error(`'${selected.name}' is not a supported type (${KNOWLEDGE_MEDIA_TYPES.join(', ')})`);
          setBusy(false);
        } else {
          toast.success('New version authorized — tracking ingestion to READY');
          setFile(null);
          setBusy(false);
          navigate({ to: KNOWLEDGE_PATH });
        }
      } catch (error) {
        // A4-09 — authorize refusal: keep the selection on the page so the
        // user can address the refusal and retry without reselecting.
        toast.error(uploadErrorCopy(selected.name, error));
        setBusy(false);
      }
    })();
  };

  return (
    <Panel
      title={
        <>
          New version of <Mono>{doc.sourceSlug}</Mono>
        </>
      }
      subtitle="Single file — the pin address is immutable on versions and the document keeps its title."
    >
      {dirtyDialog}
      <BodyP>
        Current version: <strong>{doc.latestVersion ?? '—'}</strong>
        {doc.latestVersion === null && ' — this upload becomes version 1'}
      </BodyP>
      <NoteP>
        {/* K12 (console field audit): pins resolve to the latest READY
            version at publish-snapshot time — a version reaching READY
            does NOT re-point already-published snapshots. */}
        The pin address does not change. The new version becomes the served version at the next publish, once
        ingestion reaches READY; the previous version stays in history.
      </NoteP>
      <HiddenFileInput
        ref={fileRef}
        type="file"
        accept={KNOWLEDGE_MEDIA_TYPES.join(',')}
        onChange={(e) => {
          setFile(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
      <ActionButton variant="secondary" onClick={() => fileRef.current?.click()}>
        Choose file (pdf, markdown, text, csv, json, image)
      </ActionButton>
      {file && (
        <FileRow>
          <FileName>{file.name}</FileName>
          <Muted>{(file.size / 1024).toFixed(1)} KB</Muted>
          <ActionButton variant="ghost" size="sm" onClick={() => setFile(null)}>
            Remove
          </ActionButton>
        </FileRow>
      )}
      <ActionsRow>
        <ActionButton variant="secondary" onClick={() => navigate({ to: KNOWLEDGE_PATH })}>
          Cancel
        </ActionButton>
        <ActionButton
          disabled={!file || busy}
          title="Authorize a version-upload session for this file"
          onClick={submit}
        >
          <Upload size={13} strokeWidth={1.8} />
          Upload new version
        </ActionButton>
      </ActionsRow>
    </Panel>
  );
}
