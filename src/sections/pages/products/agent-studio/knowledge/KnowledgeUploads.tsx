import { createContext, useContext, type ReactNode } from 'react';
/* eslint-disable react-refresh/only-export-components -- Intentional: this is a
   cohesive context module (context + provider + hook). Splitting it apart
   would scatter the knowledge uploads sharing across three files for a
   dev-time fast-refresh nicety with zero runtime benefit. */
import { useAttachmentUpload } from '@hooks/studio/useAttachmentUpload';

type UploadsApi = ReturnType<typeof useAttachmentUpload>;

const KnowledgeUploadsContext = createContext<UploadsApi | null>(null);

/**
 * Shared attachment-upload instance for the knowledge domain.
 *
 * The old UploadModal received `attach`/`attachText` from KnowledgeView's
 * own hook call, so the "Uploads" tracker panel kept polling to READY (and
 * invalidated the documents list on terminal states, A4-02) even after the
 * modal closed. A routed upload section unmounts when the user navigates
 * back to the library — a per-instance hook in the section would orphan the
 * in-flight polls with the section. This provider is mounted by the
 * knowledge route layout (stays up across /knowledge and /knowledge/upload),
 * so both surfaces share one tracker instance with the modal flow's exact
 * semantics. Chat and builder surfaces keep their own per-instance hooks.
 */
export function KnowledgeUploadsProvider({ children }: { children: ReactNode }) {
  const api = useAttachmentUpload();
  return <KnowledgeUploadsContext.Provider value={api}>{children}</KnowledgeUploadsContext.Provider>;
}

/**
 * The shared knowledge uploads instance. Falls back to a fresh hook call
 * when rendered outside the provider (direct KnowledgeView renders, e.g.
 * in tests) — same as the pre-migration per-instance behavior.
 */
export function useKnowledgeUploads(): UploadsApi {
  const shared = useContext(KnowledgeUploadsContext);
  const fallback = useAttachmentUpload();
  return shared ?? fallback;
}
