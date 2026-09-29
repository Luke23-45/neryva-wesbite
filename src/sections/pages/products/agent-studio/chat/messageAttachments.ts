import type { AttachmentUpload } from '@hooks/studio/useAttachmentUpload';

/**
 * H3 — client cap mirroring the engine's `AcceptMessageDto.attachments`
 * (`@ArrayMaxSize(4)`, `neryva-engine/src/modules/conversations/dto.ts:39`).
 * The send path never carries more than this, and the attach path refuses
 * past it with an honest toast — so a send can never 422 on attachment
 * count. If the engine limit ever changes, change this ONE constant;
 * nothing else in the console encodes the 4.
 */
export const MAX_MESSAGE_ATTACHMENTS = 4;

/**
 * H3 — pure: the attachment sessionIds a send may carry — ready uploads
 * only, sliced to `MAX_MESSAGE_ATTACHMENTS`. The slice is unreachable
 * while the attach path caps the pending set; it stays as belt-and-braces
 * so no code path can hand the engine more ids than its DTO accepts.
 */
export function sendableAttachmentIds(uploads: AttachmentUpload[]): string[] {
  return uploads
    .filter((u) => u.status === 'ready')
    .slice(0, MAX_MESSAGE_ATTACHMENTS)
    .map((u) => u.sessionId);
}
