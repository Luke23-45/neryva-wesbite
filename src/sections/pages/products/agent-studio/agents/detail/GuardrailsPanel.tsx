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

import { EmptyNote, LOADING_POLICY_COPY, SpecItem, SpecList, Whisper } from './primitives';
/**
 * Read-only guardrails panel on the agent detail page (C07 PLAN §6, approved
 * mock `design_guardrails_blocks_dark.svg`): mode badge, per-direction rows
 * with engine-resolved behavior, PII row. READ-ONLY — edits live in the
 * builder guardrails satellite; this panel deep-links out and never forks it.
 *
 * Watch-out law: nothing here implies engine-side blocking for logging-mode
 * screening verdicts — logging rows state the screening law explicitly
 * (verdicts recorded), with the deny-topic exception: deny topics still
 * refuse on contact in any execution mode.
 */
export function GuardrailsPanel({ agentId }: { agentId: string }) {
  const form = useAssistantDefinition(agentId, { prefer: 'active' });
  const definition = form.data?.definition ?? null;

  return (
    <Panel
      title="Guardrails"
      subtitle="What may never pass through, in or out."
    >
      {!definition ? (
        <EmptyNote>{LOADING_POLICY_COPY}</EmptyNote>
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
          {mode === 'logging' ? 'Logging — screening verdicts recorded; deny topics still refused' : 'Blocking'}
        </StatusPill>
      </p>
      <SpecList>
        {rows.map(({ direction, raw }) => {
          const name = displayPolicyName(raw, direction);
          const resolved = resolvePolicyBehavior(raw, mode);
          return (
            <SpecItem key={direction}>
              <StatusPill tone={resolved.behavior === 'disabled' ? 'warning' : 'success'} dot={false}>
                {direction}
              </StatusPill>
              <span>
                {name} — {resolved.consequence}
              </span>
            </SpecItem>
          );
        })}
        <SpecItem>
          <StatusPill tone={pii ? 'success' : 'warning'} dot={false}>
            PII
          </StatusPill>
          <span>{pii ? 'redaction on' : 'redaction off — identifiers reach storage and the provider'}</span>
        </SpecItem>
      </SpecList>
      <Whisper>{PII_NON_RETRO_COPY}</Whisper>
    </>
  );
}
