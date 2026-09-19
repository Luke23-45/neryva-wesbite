import styled from 'styled-components';
import { Link } from '@tanstack/react-router';
import { Panel } from '@components/common/ui/Panel';
import { ErrorState } from '@components/common/ui/AsyncStates';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { EmptyState } from '@components/common/ui/EmptyState';
import { ActionButton } from '@components/common/ui/ActionButton';
import { useAudit } from '@hooks/engine/queries';
import { useMemberNameMap } from '@hooks/studio/useSetupOperate';
import { OPERATE_COPY } from '@/sections/pages/products/agent-studio/builder/lib/operate-model';

/**
 * Per-agent operate trail (C15) — the org audit stream filtered to THIS
 * agent. The audit query is EXACT-match on action
 * (`org-audit.service.ts:51-53` — the "prefix filter" comment is stale, so
 * the old `action:'assistant.'` query matched NOTHING in production), hence
 * this reads the newest 100 org events and filters client-side by action
 * prefix set + resource linkage. Scope is stated, never claimed complete.
 */

const OPERATE_PREFIXES = ['assistant.', 'release.', 'control.', 'approval.'] as const;

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.6;
`;

const TrailList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
`;

const TrailRow = styled.li`
  display: flex;
  gap: 10px;
  align-items: baseline;
  font-size: 13px;
  padding: 7px 0;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.strong};

  &:last-child {
    border-bottom: 0;
  }
`;

const TrailHead = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

function detailsRecord(details: unknown): Record<string, unknown> | null {
  return typeof details === 'object' && details !== null ? (details as Record<string, unknown>) : null;
}

/** Human fragment from known detail keys (never the raw JSON dump). */
function describeDetails(details: unknown): string | null {
  const record = detailsRecord(details);
  if (!record) {
    return null;
  }
  const parts: string[] = [];
  for (const key of ['reason', 'degraded_reason', 'paused_reason'] as const) {
    if (typeof record[key] === 'string' && (record[key] as string).trim() !== '') {
      parts.push(record[key] as string);
    }
  }
  const slugs = ['unresolved_slugs', 'undercovered_pins'].flatMap((key) =>
    Array.isArray(record[key]) ? (record[key] as unknown[]).filter((v): v is string => typeof v === 'string') : [],
  );
  if (slugs.length > 0) {
    parts.push(`pins: ${slugs.join(', ')}`);
  }
  if (typeof record.version === 'number') {
    parts.push(`v${record.version}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

export function AgentTrail({ assistantId }: { assistantId: string }) {
  const audit = useAudit({ limit: 100 });
  const members = useMemberNameMap();

  const rows = (audit.data?.events ?? [])
    .filter((event) => OPERATE_PREFIXES.some((prefix) => event.action.startsWith(prefix)))
    .filter((event) => {
      if (event.resource_id === assistantId) {
        return true;
      }
      return detailsRecord(event.details)?.assistant_id === assistantId;
    })
    .sort((a, b) => (b.created_at < a.created_at ? -1 : b.created_at > a.created_at ? 1 : 0));

  const shown = rows.slice(0, 30);

  // QueryView can't take overridden data (refetch typing) — the three
  // states render directly; same primitives underneath.
  return (
    <Panel
      title="Trail"
      subtitle="Operate events for this agent — newest first, from the org audit stream."
      action={
        <span style={{ display: 'inline-flex', gap: 8 }}>
          <ActionButton variant="ghost" size="sm" disabled={audit.isPending} onClick={() => void audit.refetch()}>
            Refresh
          </ActionButton>
          <Link to="/platform/audit" style={{ fontSize: 12 }}>
            View all in Audit →
          </Link>
        </span>
      }
    >
      {audit.isPending ? (
        <Skeleton $h="120px" $r="12px" />
      ) : audit.isError ? (
        <ErrorState message={audit.error instanceof Error ? audit.error.message : 'Trail unreachable.'} onRetry={() => void audit.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title="No operate events yet" description={OPERATE_COPY.trailEmpty} />
      ) : (
        <>
          <TrailHead>
            <Muted>{OPERATE_COPY.trailScopeNote}</Muted>
          </TrailHead>
          <TrailList>
            {shown.map((event) => {
              const extra = describeDetails(event.details);
              return (
                <TrailRow key={event.id}>
                  <Mono>{event.created_at.slice(0, 16).replace('T', ' ')}</Mono>
                  <span style={{ flex: 1 }}>
                    <Mono>{event.action}</Mono>
                    {event.actor_id && <> by {members.nameOf(event.actor_id) ?? event.actor_id.slice(0, 8)}</>}
                    {extra && <> — {extra}</>}
                  </span>
                </TrailRow>
              );
            })}
          </TrailList>
          <Muted>
            {rows.length} event{rows.length === 1 ? '' : 's'} (showing {shown.length}).{' '}
            <Link to="/platform/audit">View all in Audit →</Link>
          </Muted>
        </>
      )}
    </Panel>
  );
}
