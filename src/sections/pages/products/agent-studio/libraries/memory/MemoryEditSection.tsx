import { useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { MemoryComposerForm, MEMORY_LIST_PATH } from './MemoryComposerForm';
import { useMemoryById } from './useMemoryById';

/** Full route id once the coordinator wires it (additive leaf under the libraries area, path '/memory/$memoryId/edit'). */
export const LIBRARIES_MEMORY_EDIT_ROUTE_ID = '/agent-studio/memory/$memoryId/edit' as const;

/**
 * Edit memory — dedicated section replacing the composer modal's edit mode
 * from the Memory library page. Content-identical to the modal's edit mode:
 * content-only PATCH, scope/TTL/provenance not editable (stated, not
 * dropped), 8192-char cap.
 *
 * Gates on the same `setup:author` capability as the old row Edit button;
 * unknown id → bounce to the memory list (server gates too); a failed
 * read bounces to the detail section, which renders the honest error
 * state. Nothing renders before the gates.
 */
export function LibrariesMemoryEditSection() {
  const { memoryId } = useParams({ from: LIBRARIES_MEMORY_EDIT_ROUTE_ID });
  const navigate = useNavigate();
  const { role } = useOrg();
  const canWrite = canSetup(role, 'setup:author');
  const { item, isPending, isError } = useMemoryById(memoryId);

  const unknownId = !isPending && !isError && item === null;
  // A failed read is not an unknown id — the detail section owns the
  // honest error state, so bounce there instead of a blank page.
  const readFailed = !isPending && isError && !item;

  // The detail route shares this route id's prefix — interpolate the id
  // into the path (P1 channels pattern: styled links erase TanStack's
  // per-route param inference).
  const detailPath = `/agent-studio/memory/${memoryId}`;

  // Non-author roles land here directly — bounce to the list (server gates
  // too). Nothing renders before the gates.
  useEffect(() => {
    if (!canWrite) {
      navigate({ to: MEMORY_LIST_PATH });
    }
  }, [canWrite, navigate]);

  // Unknown memory id → back to the list; failed read → detail (honest error).
  useEffect(() => {
    if (unknownId) {
      navigate({ to: MEMORY_LIST_PATH });
    } else if (readFailed) {
      navigate({ to: detailPath });
    }
  }, [unknownId, readFailed, detailPath, navigate]);

  if (!canWrite || unknownId || readFailed || !item) {
    return null;
  }

  return (
    <MemoryComposerForm
      key={item.id}
      mode="edit"
      initial={{ id: item.id, content: item.content ?? '' }}
      backTo={detailPath}
      backLabel="Memory detail"
      successTo={detailPath}
    />
  );
}
