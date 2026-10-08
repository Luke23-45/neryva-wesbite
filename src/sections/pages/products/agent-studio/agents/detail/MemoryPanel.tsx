import { Link } from '@tanstack/react-router';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { useAssistantDefinition } from '@hooks/studio/useAgentAuthoring';
import { useOrgMemoryPolicy } from '@hooks/studio/useSetupKnowledge';
import {
  COMPACTION_COPY,
  HISTORY_SERVED_MAX,
  SCRUB_COPY,
  SCOPE_CONSEQUENCES,
  describeTtl,
  parseMemoryScope,
} from '@/sections/pages/products/agent-studio/builder/lib/memory-model';
import { EmptyNote, LOADING_POLICY_COPY, SpecItem, SpecList, Whisper } from './primitives';

/**
 * Read-only memory panel on the agent detail page (C08 PLAN §6, approved mock
 * `design_memory_library_dark.svg`): scope + consequence, history with the
 * served-20 note, unconditional compaction line, org scrub/TTL rows.
 * READ-ONLY — edits live in the builder memory satellite; this panel
 * deep-links out and never forks it. The stored `summary_enabled` flag is
 * deliberately NOT displayed (stored-but-unread — showing it would imply
 * effect; PLAN §8.2).
 */
export function MemoryPanel({ agentId }: { agentId: string }) {
  const form = useAssistantDefinition(agentId, { prefer: 'active' });
  const policy = useOrgMemoryPolicy();
  const definition = form.data?.definition ?? null;

  return (
    <Panel
      title="Memory"
      subtitle="What this agent remembers, and for how long."
    >
      {!definition ? (
        <EmptyNote>{LOADING_POLICY_COPY}</EmptyNote>
      ) : (
        <>
          <SpecList>
            <SpecItem>
              <StatusPill tone={definition.context_policy.memory_scope === 'none' ? 'neutral' : 'success'} dot={false}>
                {scopeLabel(parseMemoryScope(definition.context_policy.memory_scope))}
              </StatusPill>
              <span>{SCOPE_CONSEQUENCES[parseMemoryScope(definition.context_policy.memory_scope)]}</span>
            </SpecItem>
            <SpecItem>
              <StatusPill tone="info" dot={false}>
                History {definition.context_policy.history_limit}
              </StatusPill>
              <span>
                {definition.context_policy.history_limit > HISTORY_SERVED_MAX
                  ? `Stored ${definition.context_policy.history_limit} — runs serve the ${HISTORY_SERVED_MAX} most recent.`
                  : 'Recent thread kept verbatim.'}{' '}
                {COMPACTION_COPY}
              </span>
            </SpecItem>
            <SpecItem>
              <StatusPill tone="info" dot={false}>
                Org defaults
              </StatusPill>
              <span>
                {policy.policy
                  ? `Scrub ${policy.policy.scrub} — ${scrubShort(policy.policy.scrub)}. Default TTL ${describeTtl(policy.policy.ttlSeconds)}.`
                  : 'Loading org defaults…'}
              </span>
            </SpecItem>
          </SpecList>
          <Whisper>
            Thread memories live on their conversation — the{' '}
            {/* A4-23: the assistant tab is reachable via ?scope=assistant&scope_id=<agentId>. */}
            <Link to="/agent-studio/memory" search={{ scope: 'assistant', scope_id: agentId }}>
              Memory library
            </Link>{' '}
            holds the durable scopes.
          </Whisper>
        </>
      )}
    </Panel>
  );
}

function scopeLabel(scope: 'user' | 'conversation' | 'organization' | 'assistant' | 'none'): string {
  return scope.charAt(0).toUpperCase() + scope.slice(1);
}

function scrubShort(scrub: 'off' | 'redact' | 'block'): string {
  return SCRUB_COPY[scrub].split(' — ')[1] ?? SCRUB_COPY[scrub];
}
