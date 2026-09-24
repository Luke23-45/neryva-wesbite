import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { useAssistantDefinition } from '@hooks/studio/useAgentAuthoring';
import { BUILT_IN_TOOLS, useToolCatalog } from '@hooks/studio/useSetupTools';
import { buildAgentBuildPath } from '@/sections/pages/products/agent-studio/builder/lib/slot-model';
import {
  approvalMode,
  isBuiltinTool,
  pinState,
  SKIP_COPY,
} from '@/sections/pages/products/agent-studio/builder/lib/tools-model';

const EntryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const EntryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  flex-wrap: wrap;
`;

const EntryName = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
  margin-top: 12px;
`;

const Tile = styled.div`
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 8px 10px;
`;

const TileKey = styled.div`
  font-size: 10px;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.app.text.ghost};
`;

const TileValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  margin-top: 2px;
`;

const SectionNote = styled.div`
  margin-top: 10px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.ghost};
  line-height: 1.55;
`;

const EmptyNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.6;
`;

/** Per-entry remediation for pins that refuse publish (mirrors the builder). */
const PinFix = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  margin-top: 4px;
`;

/**
 * Dedicated Tools section on the agent detail page (C06 PLAN.md §3).
 * READ-ONLY by contract — entries, modes, and pins live in the builder Tools
 * slot and the Tools library; this panel deep-links out and never forks them.
 * Approval modes shown are the authorize-time verdicts (entry∨catalog).
 */
export function ToolsPanel({ agentId }: { agentId: string }) {
  const form = useAssistantDefinition(agentId, { prefer: 'active' });
  const catalog = useToolCatalog({ includeDisabled: true });

  const definition = form.data?.definition ?? null;
  const entries = definition?.tools ?? [];
  const byName = new Map((catalog.data ?? []).map((row) => [row.name, row]));

  const shadowCount = entries.filter((e) => e.execution_mode === 'shadow').length;
  const approvalCount = entries.filter((e) => {
    const row = byName.get(e.name) ?? null;
    return approvalMode(e.approval, row?.approvalRequirement ?? null).mode === 'required';
  }).length;

  return (
    <Panel
      title="Tools — bound capabilities"
      subtitle="What this agent may call, and whether each pin is servable. Edits live in the builder."
      action={<Link to={buildAgentBuildPath(agentId)}>Edit in builder →</Link>}
    >
      {entries.length === 0 ? (
        <EmptyNote>No bound tools — {SKIP_COPY}</EmptyNote>
      ) : (
        <>
          <EntryList>
            {entries.map((entry) => {
              const builtin = isBuiltinTool(entry.name, BUILT_IN_TOOLS);
              const row = byName.get(entry.name) ?? null;
              const pin = pinState(
                entry.schema_hash,
                row ? { hash: row.hash, version: row.version, enabled: row.enabled } : null,
                builtin,
              );
              const verdict = approvalMode(entry.approval, row?.approvalRequirement ?? null);
              const tone =
                pin.kind === 'missing' || pin.kind === 'disabled' || pin.kind === 'stale'
                  ? 'error'
                  : pin.kind === 'unpinned'
                    ? 'warning'
                    : 'success';
              const pinWord =
                pin.kind === 'builtin'
                  ? 'built-in'
                  : pin.kind === 'ready'
                    ? `${pin.version ?? '?'} ✓`
                    : pin.kind === 'stale'
                      ? `stale — re-pin to ${pin.liveVersion ?? 'live'}`
                      : pin.kind;
              return (
                <EntryRow key={entry.name}>
                  <StatusPill tone={tone} dot={false}>
                    {entry.execution_mode === 'shadow' ? 'shadow' : pinWord}
                  </StatusPill>
                  <EntryName>{entry.name}</EntryName>
                  <span>
                    {`${builtin ? 'in_process' : (row?.effectClass ?? 'effect unknown')} · approval ${verdict.mode}${verdict.source === 'catalog' ? ' (row escalates)' : ''} · ${entry.access}${entry.execution_mode === 'shadow' ? ' · simulated, executes nothing' : ''}`}
                  </span>
                  {pin.kind === 'disabled' && (
                    <PinFix>The catalog row is disabled — publish refuses. Enable it in the Tools library or unbind it in the builder.</PinFix>
                  )}
                </EntryRow>
              );
            })}
          </EntryList>

          <TileGrid>
            <Tile>
              <TileKey>BOUND</TileKey>
              <TileValue>{entries.length} / 32</TileValue>
            </Tile>
            <Tile>
              <TileKey>SHADOW</TileKey>
              <TileValue>{shadowCount}</TileValue>
            </Tile>
            <Tile>
              <TileKey>APPROVAL REQUIRED</TileKey>
              <TileValue>{approvalCount}</TileValue>
            </Tile>
          </TileGrid>

          <SectionNote>
            Approval modes are authorize-time verdicts (entry or catalog row, whichever requires).
            Pins resolve against the live catalog — stale pins refuse publish.{' '}
            <Link to="/agent-studio/tools">Open Tools library →</Link>
          </SectionNote>
        </>
      )}
    </Panel>
  );
}
