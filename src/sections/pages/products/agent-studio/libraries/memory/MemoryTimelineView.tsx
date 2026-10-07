import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Link, useParams } from '@tanstack/react-router';
import { History, ArrowRight } from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import { useMemoryTimeline, type MemoryTimelineEvent } from '@hooks/studio/useKnowledgeLibrary';
import { relativeTime } from '@/sections/pages/products/agent-studio/builder/lib/memory-model';

const stateTone: Record<string, StatusTone> = {
  proposed: 'info',
  approved: 'success',
  active: 'success',
  cited: 'info',
  decayed: 'warning',
  rejected: 'error',
  expired: 'warning',
  deleted: 'error',
};

const Timeline = styled.div`
  position: relative;
  margin: 16px 0;
  padding-left: 24px;
  &::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: ${({ theme }) => theme.app.border.default};
    border-radius: 1px;
  }
`;

const EventCard = styled(Panel)<{ $current?: boolean }>`
  position: relative;
  padding: 14px 16px;
  margin-bottom: 12px;
  ${({ $current, theme }) =>
    $current &&
    `
    border-color: ${theme.app.status.success.fg};
    border-width: 2px;
  `}
  &::before {
    content: '';
    position: absolute;
    left: -20px;
    top: 18px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ theme, $current }) =>
      $current ? theme.app.status.success.fg : theme.app.border.default};
  }
`;

const EventHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
`;

const Transition = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
`;

const EventMeta = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 6px;
`;

const Reason = styled.div`
  font-size: 13px;
  margin-top: 6px;
  line-height: 1.5;
`;

const MetadataBox = styled.pre`
  font-size: 11px;
  font-family: monospace;
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 8px;
  overflow-x: auto;
  max-height: 120px;
  overflow-y: auto;
`;

function TimelineEvent({ event, isCurrent }: { event: MemoryTimelineEvent; isCurrent: boolean }) {
  const hasMetadata = event.metadata && Object.keys(event.metadata).length > 0;

  return (
    <EventCard $current={isCurrent}>
      <EventHeader>
        <Transition>
          {event.fromState ? (
            <>
              <StatusPill tone={stateTone[event.fromState] ?? 'info'}>{event.fromState}</StatusPill>
              <ArrowRight size={14} />
            </>
          ) : null}
          <StatusPill tone={stateTone[event.toState] ?? 'info'}>{event.toState}</StatusPill>
        </Transition>
        {isCurrent && <StatusPill tone="success">Current</StatusPill>}
      </EventHeader>
      {event.reason && <Reason>{event.reason}</Reason>}
      <EventMeta>
        {event.createdAt && <span>{relativeTime(event.createdAt)}</span>}
        {event.actorType && <span>Actor: {event.actorType}{event.actorId ? ` (${event.actorId.slice(0, 8)}…)` : ''}</span>}
        {event.source && <span>Source: {event.source}</span>}
        {event.runId && <span>Run: {event.runId.slice(0, 8)}…</span>}
      </EventMeta>
      {hasMetadata && (
        <MetadataBox>{JSON.stringify(event.metadata, null, 2)}</MetadataBox>
      )}
    </EventCard>
  );
}

export function MemoryTimelineView() {
  const { memoryId } = useParams({ from: '/agent-studio/memory/$memoryId/timeline' });
  const eventsQuery = useMemoryTimeline(memoryId);

  return (
    <ViewShell>
      <Link
        to="/agent-studio/memory/$memoryId"
        params={{ memoryId }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 16,
          fontSize: 13,
          fontWeight: 600,
          opacity: 0.72,
          textDecoration: 'none',
        }}
      >
        <span aria-hidden="true">‹</span> Memory detail
      </Link>
      <ViewHeader>
        <div>
          <ViewTitle>Memory timeline</ViewTitle>
          <ViewSubtitle>Full lifecycle history with state transitions and reasons.</ViewSubtitle>
        </div>
      </ViewHeader>

      <QueryView query={eventsQuery}>
        {(events) =>
          !events || events.length === 0 ? (
          <EmptyState
            icon={<History size={24} />}
            title="No timeline events"
            description="This memory has no recorded state transitions yet."
          />
        ) : (
          <motion.div variants={pageItem} initial="hidden" animate="visible">
            <Timeline>
              {events.map((event, i) => (
                <TimelineEvent
                  key={event.id || i}
                  event={event}
                  isCurrent={i === events.length - 1}
                />
              ))}
            </Timeline>
          </motion.div>
          )
        }
      </QueryView>
    </ViewShell>
  );
}
