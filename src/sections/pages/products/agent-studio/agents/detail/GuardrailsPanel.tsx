import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { useAssistantDefinition } from '@hooks/studio/useAgentAuthoring';
import {
  displayPolicyName,
  parseGuardrailMode,
  resolvePolicyBehavior,
  PII_NON_RETRO_COPY,
  type PolicyDirection,
} from '@/sections/pages/products/agent-studio/builder/lib/guardrails-model';
import { buildAgentBuildPath } from '@/sections/pages/products/agent-studio/builder/lib/slot-model';

const GuardList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const GuardItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.55;
`;

const Whisper = styled.div`
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
 * Read-only guardrails panel on the agent detail page (C07 PLAN §6, approved
 * mock `design_guardrails_blocks_dark.svg`): mode badge, per-direction rows
 * with engine-resolved behavior, PII row. READ-ONLY — edits live in the
 * builder guardrails satellite; this panel deep-links out and never forks it.
 *
 * Watch-out law: nothing here implies engine-side blocking for logging-mode
 * verdicts — logging rows state "recorded, nothing refused" explicitly.
 */
export function GuardrailsPanel({ agentId }: { agentId: string }) {
  const form = useAssistantDefinition(agentId);
  const definition = form.data?.definition ?? null;

  return (
    <Panel
      title="Guardrails"
      subtitle="What may never pass through, in or out. Edits live in the builder."
      action={<Link to={buildAgentBuildPath(agentId)}>Edit in builder →</Link>}
    >
      {!definition ? (
        <EmptyNote>Loading the policy…</EmptyNote>
      ) : (
        <GuardRows
          input={definition.guardrails.input_policy}
          output={definition.guardrails.output_policy}
          pii={definition.guardrails.pii_redaction}
          mode={parseGuardrailMode(definition.guardrails.execution_mode)}
        />
      )}
    </Panel>
  );
}

export function GuardRows({
  input,
  output,
  pii,
  mode,
}: {
  input: string;
  output: string;
  pii: boolean;
  mode: 'blocking' | 'logging';
}) {
  const rows: Array<{ direction: PolicyDirection; raw: string }> = [
    { direction: 'input', raw: input },
    { direction: 'output', raw: output },
  ];
  return (
    <>
      <p style={{ margin: '0 0 8px' }}>
        <StatusPill tone={mode === 'logging' ? 'warning' : 'success'} dot={false}>
          {mode === 'logging' ? 'Logging — verdicts recorded, nothing refused' : 'Blocking'}
        </StatusPill>
      </p>
      <GuardList>
        {rows.map(({ direction, raw }) => {
          const name = displayPolicyName(raw, direction);
          const resolved = resolvePolicyBehavior(raw, mode);
          return (
            <GuardItem key={direction}>
              <StatusPill tone={resolved.behavior === 'disabled' ? 'warning' : 'success'} dot={false}>
                {direction}
              </StatusPill>
              <span>
                {name} — {resolved.consequence}
              </span>
            </GuardItem>
          );
        })}
        <GuardItem>
          <StatusPill tone={pii ? 'success' : 'warning'} dot={false}>
            PII
          </StatusPill>
          <span>{pii ? 'redaction on' : 'redaction off — identifiers reach storage, logs, and the provider'}</span>
        </GuardItem>
      </GuardList>
      <Whisper>{PII_NON_RETRO_COPY}</Whisper>
    </>
  );
}
