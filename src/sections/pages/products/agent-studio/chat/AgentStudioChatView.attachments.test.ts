// @vitest-environment jsdom
/**
 * H3 — message attachment cap. The engine's AcceptMessageDto enforces
 * `@ArrayMaxSize(4)` on `attachments`
 * (`neryva-engine/src/modules/conversations/dto.ts:39`); the console's
 * send path must never hand it more ids than that. These tests pin the
 * constant and the pure selection the send path uses — if the engine
 * limit moves, the constant (and these tests) move with it.
 */
import { describe, expect, it } from 'vitest';
import { MAX_MESSAGE_ATTACHMENTS, sendableAttachmentIds } from './messageAttachments';
import type { AttachmentUpload } from '@hooks/studio/useAttachmentUpload';

const upload = (sessionId: string, status: AttachmentUpload['status'] = 'ready'): AttachmentUpload => ({
  sessionId,
  filename: `${sessionId}.txt`,
  size: 128,
  status,
  lastError: null,
  sourceSlug: null,
  versionOfSlug: null,
  touchedAt: 0,
});

describe('chat attachment cap (H3)', () => {
  it('MAX_MESSAGE_ATTACHMENTS matches the engine AcceptMessageDto @ArrayMaxSize(4)', () => {
    expect(MAX_MESSAGE_ATTACHMENTS).toBe(4);
  });

  it('sends every ready id when under the cap', () => {
    const ids = sendableAttachmentIds([upload('a'), upload('b'), upload('c')]);
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('slices to the cap in arrival order when more are ready', () => {
    const ids = sendableAttachmentIds([
      upload('a'),
      upload('b'),
      upload('c'),
      upload('d'),
      upload('e'),
      upload('f'),
    ]);
    expect(ids).toEqual(['a', 'b', 'c', 'd']);
  });

  it('never sends non-ready uploads (uploading/processing/failed/quarantined)', () => {
    const ids = sendableAttachmentIds([
      upload('a', 'uploading'),
      upload('b', 'processing'),
      upload('c', 'ready'),
      upload('d', 'failed'),
      upload('e', 'quarantined'),
    ]);
    expect(ids).toEqual(['c']);
  });

  it('sends nothing when no upload is ready', () => {
    expect(sendableAttachmentIds([upload('a', 'failed')])).toEqual([]);
    expect(sendableAttachmentIds([])).toEqual([]);
  });
});
