import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { MemoryComposerForm, MEMORY_LIST_PATH } from './MemoryComposerForm';

/** Full route id once the coordinator wires it (additive leaf under the libraries area, path '/memory/new'). */
export const LIBRARIES_MEMORY_NEW_ROUTE_ID = '/agent-studio/memory/new' as const;

/**
 * New memory — dedicated section replacing the composer modal's create mode
 * from the Memory library page. Gates on the same `setup:author`
 * capability as the old "New memory" button and bounces anything else to
 * the memory list (server gates too). Nothing renders before the gate.
 */
export function LibrariesMemoryNewSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canWrite = canSetup(role, 'setup:author');

  useEffect(() => {
    if (!canWrite) {
      navigate({ to: MEMORY_LIST_PATH });
    }
  }, [canWrite, navigate]);

  if (!canWrite) {
    return null;
  }

  return (
    <MemoryComposerForm
      mode="new"
      initial={null}
      backTo={MEMORY_LIST_PATH}
      backLabel="Memory"
      successTo={MEMORY_LIST_PATH}
    />
  );
}
