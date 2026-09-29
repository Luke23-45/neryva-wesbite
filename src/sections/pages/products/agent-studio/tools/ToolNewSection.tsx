import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useToolCatalog } from '@hooks/studio/useSetupTools';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { ToolUpsertForm } from './ToolUpsertForm';

/**
 * Register a tool — dedicated section replacing the UpsertModal's create
 * mode (O-1). The old "New tool" header button opened the modal for any
 * role with `setup:author`; the section gates on the same capability and
 * bounces anything else to the tools list (server gates too). Nothing
 * renders before the gate.
 *
 * Deliberate deviation: the collision set includes disabled rows
 * (`includeDisabled: true`). The old modal only warned when the colliding
 * tool was visible in the list (toggle-dependent); the engine PUT replaces
 * the row regardless, so the warning now fires whenever a replace would
 * actually happen. Advisory only — it never blocks the save.
 */
export function ToolNewSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canWrite = canSetup(role, 'setup:author');

  const catalog = useToolCatalog({ enabled: canWrite, includeDisabled: true });

  // Non-author roles land here directly — bounce to the list (server gates
  // too). Nothing renders before the gate.
  useEffect(() => {
    if (!canWrite) {
      navigate({ to: '/agent-studio/tools' });
    }
  }, [canWrite, navigate]);

  if (!canWrite) {
    return null;
  }

  return (
    <ToolUpsertForm
      mode="new"
      initial={null}
      existingNames={(catalog.data ?? []).map((t) => t.name)}
    />
  );
}
