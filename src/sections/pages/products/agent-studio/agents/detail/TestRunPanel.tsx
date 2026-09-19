import { useState } from 'react';
import { Panel } from '@components/common/ui/Panel';
import { useAssistantDefinition, type AgentVersion } from '@hooks/studio/useAgentAuthoring';
import { useModelAvailability } from '@hooks/studio/useSetupModels';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { TryConsole } from '../../builder/inspector/TryConsole';
import { resetTryParam } from '../../builder/lib/try-thread-param';
import { buildAgentBuildPath } from '../../builder/lib/slot-model';

/**
 * Test-run panel — the dedicated manage path for trying versions
 * (team_setup_ledger.md F-E1, G13). Thin over the shared TryConsole:
 * version picker + reads, same thread/dock/trace truth as the builder.
 * Switching version remounts the console (fresh session — turns pin
 * their version, so a switch never replays another version's thread).
 */
export function TestRunPanel({ agentId, versions }: { agentId: string; versions: AgentVersion[] }) {
  const { role } = useOrg();
  const canTest = canSetup(role, 'setup:author');
  const testDenied = setupDeniedCopy(role, 'setup:author');
  const [versionId, setVersionId] = useState<string>('');

  const form = useAssistantDefinition(agentId);
  const models = useModelAvailability();

  const runnable = versions.filter((v) => v.status === 'DRAFT' || v.status === 'PUBLISHED');
  const effectiveVersionId = versionId || runnable[0]?.id || '';
  const picked = runnable.find((v) => v.id === effectiveVersionId) ?? null;
  const versionLabel = picked
    ? `v${picked.version} · ${picked.status}${picked.hash ? ` · ${picked.hash.slice(0, 8)}` : ''}`
    : 'No runnable version';

  return (
    <Panel
      title="Test-run"
      subtitle="Execute a version through the real conversation plane without publishing it — draft-pinned, never billable."
    >
      {runnable.length === 0 ? (
        <p style={{ fontSize: 12, opacity: 0.6 }}>No DRAFT or PUBLISHED version to run — save a draft in the editor first.</p>
      ) : (
        <TryConsole
          key={effectiveVersionId}
          assistantId={agentId}
          definition={form.data?.definition ?? null}
          runnableVersionId={effectiveVersionId}
          versionLabel={versionLabel}
          runnable
          canRun={canTest}
          deniedCopy={testDenied}
          models={models.data}
          modelsLoading={models.isPending}
          editMode={{ kind: 'link', builderHref: buildAgentBuildPath(agentId) }}
          header={
            <label style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
              Version
              <select
                value={effectiveVersionId}
                onChange={(e) => {
                  resetTryParam();
                  setVersionId(e.target.value);
                }}
                style={{ display: 'block', width: '100%', marginTop: 4 }}
              >
                {runnable.map((v) => (
                  <option key={v.id} value={v.id}>
                    v{v.version} · {v.status}{v.hash ? ` · ${v.hash.slice(0, 12)}` : ''}
                  </option>
                ))}
              </select>
            </label>
          }
        />
      )}
    </Panel>
  );
}
