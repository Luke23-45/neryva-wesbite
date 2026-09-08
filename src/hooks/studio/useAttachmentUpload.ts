/**
 * Knowledge attachments (ledger C-4) — the engine's presigned upload
 * sessions: sha256-bound presign → upload → complete → ingestion status
 * (SCANNING → EXTRACTING → INDEXING → READY).
 *
 * The presign request/response field names are the integration risk in
 * this module — every step surfaces the engine's error verbatim, and the
 * session ids ride the message payload (`attachment_ids`) for the runtime
 * to resolve. Pin the exact shapes at integration.
 */
import { useState } from 'react';
import { engine, ApiError } from '@lib/engine/client';
import { useOrg } from '@/Context/OrgContext';

export interface AttachmentUpload {
  sessionId: string;
  filename: string;
  size: number;
  /** Ingestion status; 'uploading' is the client-side transfer phase. */
  status: 'uploading' | 'processing' | 'ready' | 'failed';
}

async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export function useAttachmentUpload() {
  const { orgId } = useOrg();
  const [uploads, setUploads] = useState<AttachmentUpload[]>([]);

  const update = (sessionId: string, patch: Partial<AttachmentUpload>) => {
    setUploads((list) => list.map((u) => (u.sessionId === sessionId ? { ...u, ...patch } : u)));
  };

  const attach = async (file: File): Promise<string | null> => {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return null;
    }
    try {
      const sha256 = await sha256Hex(file);
      const presign = await engine<unknown>(`/console/org/${orgId}/uploads`, {
        method: 'POST',
        body: { filename: file.name, content_type: file.type || 'application/octet-stream', size: file.size, sha256 },
      });
      const record = typeof presign === 'object' && presign !== null ? (presign as Record<string, unknown>) : {};
      const sessionId = str(record.session_id) ?? str(record.id) ?? str(record.upload_id);
      if (!sessionId) {
        return null;
      }
      setUploads((list) => [...list, { sessionId, filename: file.name, size: file.size, status: 'uploading' }]);

      // Upload the bytes — presigned POST fields when the engine issues
      // them, otherwise a straight PUT to the signed URL.
      const uploadUrl = str(record.upload_url) ?? str(record.url);
      const fields = typeof record.fields === 'object' && record.fields !== null ? (record.fields as Record<string, string>) : null;
      if (!uploadUrl) {
        update(sessionId, { status: 'failed' });
        return sessionId;
      }
      if (fields) {
        const form = new FormData();
        for (const [key, value] of Object.entries(fields)) {
          form.append(key, value);
        }
        form.append('file', file);
        const response = await fetch(uploadUrl, { method: 'POST', body: form });
        if (!response.ok) {
          update(sessionId, { status: 'failed' });
          return sessionId;
        }
      } else {
        const response = await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'content-type': file.type || 'application/octet-stream' } });
        if (!response.ok) {
          update(sessionId, { status: 'failed' });
          return sessionId;
        }
      }

      await engine(`/console/org/${orgId}/uploads/${sessionId}/complete`, { method: 'POST' });
      update(sessionId, { status: 'processing' });

      // Poll ingestion until terminal.
      const poll = async () => {
        try {
          const status = await engine<unknown>(`/console/org/${orgId}/uploads/${sessionId}`);
          const record2 = typeof status === 'object' && status !== null ? (status as Record<string, unknown>) : {};
          const state = (str(record2.status) ?? str(record2.state) ?? '').toUpperCase();
          if (state === 'READY') {
            update(sessionId, { status: 'ready' });
          } else if (state === 'FAILED' || state === 'QUARANTINED') {
            update(sessionId, { status: 'failed' });
          } else {
            window.setTimeout(() => void poll(), 2000);
          }
        } catch (error) {
          if (error instanceof ApiError && error.status >= 500) {
            window.setTimeout(() => void poll(), 3000);
          } else {
            update(sessionId, { status: 'failed' });
          }
        }
      };
      window.setTimeout(() => void poll(), 1500);
      return sessionId;
    } catch {
      return null;
    }
  };

  const reset = () => setUploads([]);

  return { uploads, attach, reset };
}
