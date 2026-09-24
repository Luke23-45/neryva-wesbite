/**
 * Knowledge uploads (team_setup_ledger.md F-A1) — the engine's presigned
 * upload sessions over the EXACT contract
 * (`engine/src/modules/knowledge/knowledge.controller.ts:72-108`,
 * `artifacts.service.ts:57-168`):
 *
 * POST uploads {purpose, media_type, byte_length, sha256, source_slug?,
 * title?} → {session: {id, state, source_slug}, upload: {url, fields,
 * expiresIn}} → presigned POST (fields verbatim, exact-size window) →
 * POST complete (server verifies bytes + bound sha) → poll
 * GET uploads/:id (CREATED→…→READY, terminal QUARANTINED|FAILED with
 * last_error verbatim).
 *
 * Allowed media (engine allowlist — not free text):
 * text/plain|markdown|csv, application/json, image png|jpeg|webp, pdf.
 * Purpose defaults to SOURCE_DOCUMENT (knowledge uploads).
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { engine, ApiError } from '@lib/engine/client';
import { useOrg } from '@/Context/OrgContext';
import { KNOWLEDGE_KEY } from './useSetupKnowledge';

export const KNOWLEDGE_MEDIA_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
] as const;

export type KnowledgeMediaType = (typeof KNOWLEDGE_MEDIA_TYPES)[number];

export type AttachmentStatus = 'uploading' | 'processing' | 'ready' | 'failed' | 'quarantined';

export interface AttachmentUpload {
  sessionId: string;
  filename: string;
  size: number;
  /** Ingestion status; 'uploading' is the client-side transfer phase. */
  status: AttachmentStatus;
  /** Terminal failure reason (engine `last_error`, verbatim). */
  lastError: string | null;
  /** Reserved pin address (engine `session.source_slug`, may be derived). */
  sourceSlug: string | null;
  /** Last local observation (ms epoch) — stall detection reads this, never the server clock. */
  touchedAt: number;
}

export type ArtifactPurpose = 'SOURCE_DOCUMENT' | 'MESSAGE_ATTACHMENT';

export interface AttachInput {
  file: File;
  /**
   * Engine artifact purpose. Knowledge uploads use SOURCE_DOCUMENT; chat
   * images/files riding a message use MESSAGE_ATTACHMENT (engine
   * artifacts.service.ts:27 — harness attachment media).
   */
  purpose?: ArtifactPurpose;
  /** Pin-address intent (kebab 3–64, reserved now — 409 on collision). Omit to derive `doc-{artifact8}`. */
  sourceSlug?: string;
  /** Display title (defaults to the slug, else auto). */
  title?: string;
  mediaType?: KnowledgeMediaType;
}

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function inferMediaType(file: File): KnowledgeMediaType | null {
  const declared = file.type;
  if ((KNOWLEDGE_MEDIA_TYPES as readonly string[]).includes(declared)) {
    return declared as KnowledgeMediaType;
  }
  const name = file.name.toLowerCase();
  if (name.endsWith('.md') || name.endsWith('.markdown')) {
    return 'text/markdown';
  }
  if (name.endsWith('.txt')) {
    return 'text/plain';
  }
  if (name.endsWith('.csv')) {
    return 'text/csv';
  }
  if (name.endsWith('.json')) {
    return 'application/json';
  }
  if (name.endsWith('.pdf')) {
    return 'application/pdf';
  }
  if (name.endsWith('.png')) {
    return 'image/png';
  }
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    return 'image/jpeg';
  }
  if (name.endsWith('.webp')) {
    return 'image/webp';
  }
  return null;
}

const TERMINAL_FAILED = new Set(['FAILED', 'QUARANTINED']);

/** Paste-tab formats: the text subset of KNOWLEDGE_MEDIA_TYPES (C05). */
export const PASTE_UPLOAD_TYPES = ['text/plain', 'text/markdown', 'text/csv', 'application/json'] as const;
export type PasteUploadType = (typeof PASTE_UPLOAD_TYPES)[number];

const PASTE_EXTENSIONS: Record<PasteUploadType, string> = {
  'text/plain': 'txt',
  'text/markdown': 'md',
  'text/csv': 'csv',
  'application/json': 'json',
};

/**
 * Pasted text → File through the SAME session flow (C05 PLAN.md §5/§10).
 * Encoding client-side keeps one transfer path (sha256 → presign → PUT →
 * complete → poll); the engine never learns whether bytes were picked or pasted.
 */
export function encodePasteFile(text: string, slug: string, mediaType: PasteUploadType): File {
  const stem = slug.trim().toLowerCase() || 'pasted-source';
  return new File([text], `${stem}.${PASTE_EXTENSIONS[mediaType]}`, { type: mediaType });
}

export function useAttachmentUpload() {
  const { orgId } = useOrg();
  const queryClient = useQueryClient();
  const [uploads, setUploads] = useState<AttachmentUpload[]>([]);

  const update = (sessionId: string, patch: Partial<AttachmentUpload>) => {
    setUploads((list) => list.map((u) => (u.sessionId === sessionId ? { ...u, ...patch, touchedAt: Date.now() } : u)));
  };

  /**
   * A4-02 — ingestion may have created or updated a document row (or failed
   * one), so a terminal tracker state invalidates the documents list: the
   * library reflects the outcome without a manual reload. Terminal for
   * *every* upload purpose — the refetch is a no-op when the list query
   * isn't mounted (e.g. chat attachments), never a lie.
   */
  const invalidateDocuments = () => {
    if (orgId) {
      void queryClient.invalidateQueries({ queryKey: [...KNOWLEDGE_KEY, orgId, 'documents'] });
    }
  };

  /**
   * Authorize → transfer → complete → track. Resolves the session id on
   * authorize success (even when a later phase fails — the tracker row
   * carries the terminal state); null only when the session was never
   * created (unsupported type, authorize refusal). Throws ApiError on
   * authorize/complete refusals so callers render them verbatim.
   */
  const attach = async (input: AttachInput): Promise<string | null> => {
    const { file } = input;
    const mediaType = input.mediaType ?? inferMediaType(file);
    if (!mediaType) {
      return null;
    }
    const sha256 = await sha256Hex(file);
    const presign = await engine<unknown>(`/console/org/${orgId}/uploads`, {
      method: 'POST',
      body: {
        purpose: input.purpose ?? 'SOURCE_DOCUMENT',
        media_type: mediaType,
        byte_length: file.size,
        sha256,
        ...(input.sourceSlug ? { source_slug: input.sourceSlug } : {}),
        ...(input.title ? { title: input.title } : {}),
      },
      idempotent: true,
    });
    const record = typeof presign === 'object' && presign !== null ? (presign as Record<string, unknown>) : {};
    const session = typeof record.session === 'object' && record.session !== null ? (record.session as Record<string, unknown>) : {};
    const upload = typeof record.upload === 'object' && record.upload !== null ? (record.upload as Record<string, unknown>) : {};
    const sessionId = str(session.id);
    const uploadUrl = str(upload.url);
    const fields = typeof upload.fields === 'object' && upload.fields !== null ? (upload.fields as Record<string, string>) : null;
    if (!sessionId || !uploadUrl || !fields) {
      throw new Error('The upload session response was missing its transfer instructions');
    }
    setUploads((list) => [
      ...list,
      {
        sessionId,
        filename: file.name,
        size: file.size,
        status: 'uploading',
        lastError: null,
        sourceSlug: str(session.source_slug),
        touchedAt: Date.now(),
      },
    ]);

    // Presigned POST with the engine-issued fields, verbatim. The size
    // window is exact (min = max = byte_length) — no chunking, no resize.
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value);
    }
    form.append('file', file);
    const response = await fetch(uploadUrl, { method: 'POST', body: form });
    if (!response.ok) {
      update(sessionId, { status: 'failed', lastError: 'The byte transfer was rejected — retry the upload.' });
      return sessionId;
    }

    // A4-08 — a failed completion handshake must terminal the tracker row:
    // without this the row sticks on 'uploading' forever (no poll starts).
    try {
      await engine(`/console/org/${orgId}/uploads/${sessionId}/complete`, { method: 'POST', idempotent: true });
    } catch (error) {
      update(sessionId, {
        status: 'failed',
        lastError: error instanceof Error ? error.message : 'The upload could not be completed — retry the upload.',
      });
      throw error;
    }
    update(sessionId, { status: 'processing' });

    // Poll ingestion until terminal. 5xx keeps polling (worker still
    // working); anything else fails honestly with the engine's last_error.
    const poll = async () => {
      try {
        const status = await engine<unknown>(`/console/org/${orgId}/uploads/${sessionId}`);
        const statusRecord = typeof status === 'object' && status !== null ? (status as Record<string, unknown>) : {};
        const inner = typeof statusRecord.session === 'object' && statusRecord.session !== null ? (statusRecord.session as Record<string, unknown>) : {};
        const state = (str(inner.state) ?? '').toUpperCase();
        if (state === 'READY') {
          update(sessionId, { status: 'ready' });
          invalidateDocuments();
        } else if (TERMINAL_FAILED.has(state)) {
          update(sessionId, {
            status: state === 'QUARANTINED' ? 'quarantined' : 'failed',
            lastError: str(inner.last_error) ?? 'Ingestion failed.',
          });
          invalidateDocuments();
        } else {
          window.setTimeout(() => void poll(), 2000);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status >= 500) {
          window.setTimeout(() => void poll(), 3000);
        } else {
          update(sessionId, { status: 'failed', lastError: error instanceof Error ? error.message : 'Ingestion status unreachable.' });
        }
      }
    };
    window.setTimeout(() => void poll(), 1500);
    return sessionId;
  };

  const reset = () => setUploads([]);

  /** A4-07 — dismiss a single tracker row (terminal rows accumulate otherwise). */
  const dismiss = (sessionId: string) => {
    setUploads((list) => list.filter((u) => u.sessionId !== sessionId));
  };

  /**
   * Paste-tab entry (C05): encode then ride `attach` — same sha256 binding,
   * same session machine, same tracker rows. Validation (non-empty, JSON
   * guard) lives in knowledge-model `validatePaste`; this stays the pipe.
   */
  const attachText = async (input: {
    text: string;
    slug: string;
    mediaType: PasteUploadType;
    title?: string;
  }): Promise<string | null> =>
    attach({
      file: encodePasteFile(input.text, input.slug, input.mediaType),
      mediaType: input.mediaType,
      sourceSlug: input.slug.trim().toLowerCase() || undefined,
      ...(input.title ? { title: input.title } : {}),
    });

  return { uploads, attach, attachText, reset, dismiss };
}
