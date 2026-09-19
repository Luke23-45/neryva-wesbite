import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import {
  useAssistant,
  useAssistantDefinition,
  useAssistantVersions,
} from '@hooks/studio/useAgentAuthoring';
import { costLabel, useModelAvailability, useModelCosts } from '@hooks/studio/useSetupModels';
import { useProviderCredentials } from '@hooks/studio/useSetupProviders';
import { useOrg } from '@/Context/OrgContext';
import { matchPreset, humanizeReason } from '@/sections/pages/products/agent-studio/builder/lib/brain-model';
import { buildAgentBuildPath } from '@/sections/pages/products/agent-studio/builder/lib/slot-model';

const ChainTrack = styled.div`
  display: flex;
  align-items: stretch;
  gap: 8px;
  flex-wrap: wrap;
`;

const ChainNode = styled.div<{ $excluded?: boolean }>`
  flex: 1 1 180px;
  min-width: 0;
  border-radius: 11px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  ${({ $excluded }) => $excluded ? `border-style: dashed;` : ''}
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ChainName = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 650;
  color: ${({ theme }) => theme.app.text.primary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChainMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.55;
`;

const ChainArrow = styled.div`
  align-self: center;
  color: ${({ theme }) => theme.app.status.info.fg};
  font-size: 16px;
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

const CredList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
`;

const CredRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  flex-wrap: wrap;
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

/**
 * Dedicated Brain section on the agent detail page (C04 PLAN.md §4.9, approved
 * mock `design_brain_detail_dark.svg`): serving chain, params, costs, credential
 * status. READ-ONLY by contract — edits live in the builder Brain slot and the
 * Models library; this panel deep-links out and never forks them. Served-reality
 * counts are deliberately absent (no per-run model source exists — §12.4).
 */
export function BrainPanel({ agentId }: { agentId: string }) {
  const detail = useAssistant(agentId);
  const form = useAssistantDefinition(agentId);
  const versions = useAssistantVersions(agentId);
  const models = useModelAvailability();
  const costs = useModelCosts();
  const { role } = useOrg();
  const canReadCredentials = role === 'owner' || role === 'admin' || role === 'developer';
  const credentials = useProviderCredentials({ enabled: canReadCredentials });

  const definition = form.data?.definition ?? null;
  const allowed = definition?.model_policy.allowed_models ?? [];
  const catalogByRef = new Map((models.data ?? []).map((m) => [m.ref, m]));
  const usable = new Set((models.data ?? []).filter((m) => m.usable).map((m) => m.ref));
  const versionNumber = versions.data?.find((v) => v.id === (form.data?.versionId ?? ''))?.version ?? null;
  const versionLabel = !form.data
    ? null
    : form.data.isDraft
      ? `Open draft${detail.data?.activeVersionId ? ' · live version served' : ''}`
      : versionNumber !== null
        ? `Active v${versionNumber}`
        : 'Active version';

  const matched = matchPreset({
    temperature: definition?.model_params.temperature,
    top_p: definition?.model_params.top_p,
    max_output_tokens: definition?.model_params.max_output_tokens,
    reasoning_effort: definition?.model_params.reasoning_effort,
  });

  const pinnedProviders = [...new Set(allowed.map((ref) => ref.split('/')[0] ?? ref))];
  const pinnedCreds = (credentials.data ?? []).filter((c) => pinnedProviders.includes(c.provider));

  return (
    <Panel
      title="Brain — model policy"
      subtitle="What serves this agent, in what order, at what cost. Edits live in the builder."
      action={<Link to={buildAgentBuildPath(agentId)}>Edit in builder →</Link>}
    >
      {!definition || allowed.length === 0 ? (
        <EmptyNote>No model picked yet — open the builder to choose one. Saving without a picked model is refused.</EmptyNote>
      ) : (
        <>
          <ChainTrack>
            {allowed.map((ref, index) => {
              const row = catalogByRef.get(ref);
              const isUsable = usable.has(ref);
              const cost = costs.data?.find((c) => c.ref === ref);
              return (
                <Chain
                  key={ref}
                  modelRef={ref}
                  isUsable={isUsable}
                  costText={cost ? `${costLabel(cost, 'in')} in / ${costLabel(cost, 'out')} out` : 'unpriced'}
                  reasonText={!isUsable ? (row ? humanizeReason(row.reasons[0] ?? 'unknown') : 'not in catalog') : null}
                  last={index === allowed.length - 1}
                />
              );
            })}
          </ChainTrack>
          <SectionNote>
            Fallback serves availability in listed order — never a silent downgrade.
            {definition.model_policy.fallback_enabled ? ' Fallback is armed.' : ' Fallback is off.'}
            {versionLabel ? ` · ${versionLabel}` : ''}
          </SectionNote>

          <TileGrid>
            <Tile>
              <TileKey>TEMPERATURE</TileKey>
              <TileValue>{definition.model_params.temperature ?? 'default'}</TileValue>
            </Tile>
            <Tile>
              <TileKey>TOP-P</TileKey>
              <TileValue>{definition.model_params.top_p ?? 'default'}</TileValue>
            </Tile>
            <Tile>
              <TileKey>MAX OUTPUT</TileKey>
              <TileValue>{definition.model_params.max_output_tokens?.toLocaleString() ?? 'default'}</TileValue>
            </Tile>
            <Tile>
              <TileKey>REASONING</TileKey>
              <TileValue>{definition.model_params.reasoning_effort ?? 'default'}</TileValue>
            </Tile>
            <Tile>
              <TileKey>OUTPUT SCHEMA</TileKey>
              <TileValue>{definition.model_params.output_schema ? 'set ✓' : '—'}</TileValue>
            </Tile>
            <Tile>
              <TileKey>PRESET</TileKey>
              <TileValue>{matched ? matched.label : 'custom'}</TileValue>
            </Tile>
          </TileGrid>

          <CredList>
            {pinnedCreds.length === 0 && (
              <CredRow>
                {canReadCredentials ? 'No provider credentials on file for the pinned providers.' : 'Credential status needs an owner, admin, or developer role.'}
              </CredRow>
            )}
            {pinnedCreds.map((cred) => {
              const revoked = cred.revokedAt !== null || cred.status === 'revoked';
              return (
                <CredRow key={cred.id}>
                  <StatusPill tone={revoked ? 'error' : 'success'} dot={false}>
                    {cred.provider}
                  </StatusPill>
                  <span>
                    {cred.label} · {cred.secretFingerprint ?? 'no fingerprint'}
                    {cred.revocationReason ? ` — ${cred.revocationReason}` : ''}
                    {revoked ? ' — pinned models on this provider are unusable (derived)' : ''}
                  </span>
                </CredRow>
              );
            })}
          </CredList>
          <SectionNote>
            Keys rotate and revoke in the Models library — this panel never touches sealed material.{' '}
            <Link to="/agent-studio/models">Manage in Models →</Link>
          </SectionNote>
        </>
      )}
    </Panel>
  );
}

function Chain({
  modelRef,
  isUsable,
  costText,
  reasonText,
  last,
}: {
  modelRef: string;
  isUsable: boolean;
  costText: string;
  reasonText: string | null;
  last: boolean;
}) {
  return (
    <>
      <ChainNode $excluded={!isUsable}>
        <ChainName>
          <StatusPill tone={isUsable ? 'success' : 'warning'} dot={false}>
            {isUsable ? 'serves' : 'excluded'}
          </StatusPill>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{modelRef}</span>
        </ChainName>
        <ChainMeta>
          {costText}
          {reasonText ? ` · ${reasonText}` : ''}
        </ChainMeta>
      </ChainNode>
      {!last && <ChainArrow aria-hidden="true">→</ChainArrow>}
    </>
  );
}
