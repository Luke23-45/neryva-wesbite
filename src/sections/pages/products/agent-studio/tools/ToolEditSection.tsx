import { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useToolCatalog } from '@hooks/studio/useSetupTools';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { ToolUpsertForm } from './ToolUpsertForm';

/**
 * Edit a tool — dedicated section replacing the UpsertModal's edit mode
 * (O-1). Form-identical to the modal's edit mode: name locked (disabled),
 * endpoint/credential inputs absent (create-only — the engine preserves the
 * existing binding and sealed credential when omitted), the perimeter /
 * endpoint note, and A4-60 round-tripping of the fields the form does not
 * render.
 *
 * Unknown tool id → bounce to the tools list (same rule as the models
 * credential-rotate unknown-id bounce).
 *
 * Deliberate deviation: the lookup includes disabled rows. The old modal
 * could only edit a disabled tool when the list's "show disabled" toggle
 * was on (the row had to be visible to click Edit); a deep-linked disabled
 * tool now resolves instead of bouncing, and saving re-enables it —
 * consistent with the form's own "Saving updates the row in place,
 * re-enables it" copy.
 */
export function ToolEditSection() {
  const { toolId } = useParams({ from: '/agent-studio/tools/$toolId/edit' });
  const navigate = useNavigate();
  const { role } = useOrg();
  const canWrite = canSetup(role, 'setup:author');

  const catalog = useToolCatalog({ enabled: canWrite, includeDisabled: true });

  const tool = useMemo(
    () => (catalog.data ?? []).find((t) => t.name === toolId) ?? null,
    [catalog.data, toolId],
  );
  const unknownId = !catalog.isPending && !catalog.isError && tool === null;

  // Non-author roles land here directly — bounce to the list (server gates
  // too). Nothing renders before the gates.
  useEffect(() => {
    if (!canWrite) {
      navigate({ to: '/agent-studio/tools' });
    }
  }, [canWrite, navigate]);

  // Unknown tool id → back to the list.
  useEffect(() => {
    if (unknownId) {
      navigate({ to: '/agent-studio/tools' });
    }
  }, [unknownId, navigate]);

  if (!canWrite || unknownId || !tool) {
    return null;
  }

  return (
    <ToolUpsertForm
      key={tool.name}
      mode="edit"
      initial={tool}
      existingNames={(catalog.data ?? []).map((t) => t.name)}
    />
  );
}
