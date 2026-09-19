import type { ModelAvailability } from '@hooks/studio/useSetupModels';
import type { ConsumerDefinition } from '@lib/engine/agent-payload';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import type { OrgRole } from '@/Context/OrgContext';
import { TryConsole } from './TryConsole';
import type { TraceEditTarget } from './TraceDrawer';

export interface TrySectionProps {
  assistantId: string;
  definition: ConsumerDefinition | null;
  versionId: string | null;
  versionHash: string | null;
  versionStatus: string | null;
  isDraft: boolean;
  canAuthor: boolean;
  role: OrgRole | null;
  models: ModelAvailability[] | undefined;
  modelsLoading: boolean;
  /** Reports terminal turns upward so the canvas grade reflects this load. */
  onTryEvent: (event: { at: string; failed: boolean }) => void;
  onEditJump: (target: TraceEditTarget) => void;
}

/**
 * C13 mount — the builder Try console on the response spine. Thin over the
 * shared TryConsole: runnable gating comes from the open version, Edit
 * jumps select builder slots, terminal turns report to the canvas grade.
 */
export function TrySection({
  assistantId,
  definition,
  versionId,
  versionHash,
  versionStatus,
  isDraft,
  canAuthor,
  role,
  models,
  modelsLoading,
  onTryEvent,
  onEditJump,
}: TrySectionProps) {
  const runnable = versionId !== null && (isDraft || versionStatus === 'DRAFT' || versionStatus === 'PUBLISHED');
  const versionLabel = `${isDraft ? 'Draft' : (versionStatus ?? 'Version')}${versionHash ? ` · ${versionHash.slice(0, 8)}` : ''}`;

  return (
    <TryConsole
      assistantId={assistantId}
      definition={definition}
      runnableVersionId={runnable ? versionId : null}
      versionLabel={versionLabel}
      runnable={runnable}
      canRun={canAuthor && canSetup(role, 'setup:author')}
      deniedCopy={setupDeniedCopy(role, 'setup:author')}
      models={models}
      modelsLoading={modelsLoading}
      onTryEvent={onTryEvent}
      editMode={{ kind: 'jump', onEditJump }}
    />
  );
}
