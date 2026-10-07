import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Dropdown } from '@components/common/ui/Dropdown';
import {
  ViewShell,
  ViewHeader,
  ViewHeaderRow,
  ViewTitle,
  ViewSubtitle,
} from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import {
  useHealthFindings,
  useDismissFinding,
  useSnoozeFinding,
  type HealthFinding,
  type FindingSeverity,
} from '@hooks/studio/useKnowledgeLibrary';
import { relativeTime } from '@/sections/pages/products/agent-studio/builder/lib/memory-model';
import { SectionBackRow } from './SectionBackRow';

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin: 16px 0;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
`;

const FindingCard = styled(Panel)`
  padding: 16px 18px;
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`;

const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  margin: 0;
  flex: 1;
`;

const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-bottom: 8px;
`;

const CardAction = styled.p`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.primary};
  margin: 0 0 12px;
`;

const CardButtons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const severityTone: Record<FindingSeverity, StatusTone> = {
  info: 'info',
  warning: 'warning',
  critical: 'error',
};

const FINDING_TITLES: Record<string, string> = {
  quota_warning: 'Storage quota warning',
  quota_drift: 'Quota drift detected',
  session_failed: 'Upload session failed',
  session_stale: 'Upload session stale',
};

const FINDING_ACTIONS: Record<string, { label: string; to: string }> = {
  quota_warning: { label: 'View storage', to: '/agent-studio/knowledge/storage' },
  quota_drift: { label: 'View storage', to: '/agent-studio/knowledge/storage' },
  session_failed: { label: 'View uploads', to: '/agent-studio/knowledge/upload' },
  session_stale: { label: 'View uploads', to: '/agent-studio/knowledge/upload' },
};

const SNOOZE_OPTIONS = [
  { value: '1d', label: 'Snooze 1 day' },
  { value: '7d', label: 'Snooze 7 days' },
  { value: '30d', label: 'Snooze 30 days' },
];

function affectedCount(finding: HealthFinding): string {
  const details = finding.details ?? {};
  const count = details['affected_count'] ?? details['count'] ?? details['sessions'];
  if (typeof count === 'number') return count === 1 ? '1 item' : `${count} items`;
  if (finding.subjectId) return '1 item';
  return '—';
}

function FindingCardView({ finding }: { finding: HealthFinding }) {
  const dismiss = useDismissFinding();
  const snooze = useSnoozeFinding();
  const [snoozeValue, setSnoozeValue] = useState('7d');

  const title = FINDING_TITLES[finding.findingType] ?? finding.findingType;
  const fix = FINDING_ACTIONS[finding.findingType];

  const handleSnooze = (value: string) => {
    setSnoozeValue(value);
    snooze.mutate(finding.fingerprint);
  };

  return (
    <FindingCard>
      <CardTop>
        <StatusPill tone={severityTone[finding.severity]}>{finding.severity}</StatusPill>
        <CardTitle>{title}</CardTitle>
      </CardTop>
      <CardMeta>
        <span>{affectedCount(finding)} affected</span>
        <span>First seen {relativeTime(finding.firstSeenAt)}</span>
        <span>Last seen {relativeTime(finding.lastSeenAt)}</span>
        <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{finding.findingType}</span>
      </CardMeta>
      <CardAction>
        {finding.findingType === 'quota_warning' &&
          'Storage usage is approaching or over quota. Review usage or request a quota increase.'}
        {finding.findingType === 'quota_drift' &&
          'Recorded quota usage drifted from computed usage. The reconciler has run — verify the numbers.'}
        {finding.findingType === 'session_failed' &&
          'An upload session failed. The session can be retried or cancelled from the uploads page.'}
        {finding.findingType === 'session_stale' &&
          'An upload session has been stale beyond its lease. It will be reclaimed by the orphan sweeper.'}
        {!FINDING_TITLES[finding.findingType] && 'Review this finding and take action.'}
      </CardAction>
      <CardButtons>
        {fix && (
          <Link to={fix.to} style={{ textDecoration: 'none' }}>
            <ActionButton variant="primary" size="sm">
              {fix.label}
              <ArrowRight size={14} />
            </ActionButton>
          </Link>
        )}
        <ActionButton
          variant="secondary"
          size="sm"
          onClick={() => dismiss.mutate(finding.fingerprint)}
          disabled={dismiss.isPending}
        >
          {dismiss.isPending ? 'Dismissing…' : 'Dismiss'}
        </ActionButton>
        <Dropdown
          variant="select"
          aria-label="Snooze duration"
          value={snoozeValue}
          onChange={handleSnooze}
          items={SNOOZE_OPTIONS}
        />
      </CardButtons>
    </FindingCard>
  );
}

export function HealthView() {
  const [severity, setSeverity] = useState<string>('all');
  const [findingType, setFindingType] = useState<string>('all');

  const findings = useHealthFindings('open');

  const filtered = useMemo(() => {
    const list = findings.data?.findings ?? [];
    return list.filter((f) => {
      if (severity !== 'all' && f.severity !== severity) return false;
      if (findingType !== 'all' && f.findingType !== findingType) return false;
      return true;
    });
  }, [findings.data, severity, findingType]);

  const typeOptions = useMemo(() => {
    const types = new Set((findings.data?.findings ?? []).map((f) => f.findingType));
    return [
      { value: 'all', label: 'All types' },
      ...[...types].map((t) => ({
        value: t,
        label: FINDING_TITLES[t] ?? t,
      })),
    ];
  }, [findings.data]);

  return (
    <ViewShell>
      <motion.div variants={pageItem} initial="hidden" animate="visible">
        <SectionBackRow to="/agent-studio/knowledge">‹ Knowledge</SectionBackRow>
        <ViewHeader>
          <ViewHeaderRow>
            <div>
              <ViewTitle>Health</ViewTitle>
              <ViewSubtitle>
                Open findings from library health checks — quota, sessions, drift.
              </ViewSubtitle>
            </div>
          </ViewHeaderRow>
        </ViewHeader>

        <FilterBar>
          <Dropdown
            variant="select"
            aria-label="Severity filter"
            value={severity}
            onChange={setSeverity}
            items={[
              { value: 'all', label: 'All severities' },
              { value: 'critical', label: 'Critical' },
              { value: 'warning', label: 'Warning' },
              { value: 'info', label: 'Info' },
            ]}
          />
          <Dropdown
            variant="select"
            aria-label="Type filter"
            value={findingType}
            onChange={setFindingType}
            items={typeOptions}
          />
        </FilterBar>

        <QueryView
          query={findings}
        >
          {() =>
            filtered.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck size={24} />}
                title="No open findings"
                description="The library is healthy. New findings appear here when health checks detect issues."
              />
            ) : (
              <CardGrid>
                {filtered.map((finding) => (
                  <FindingCardView key={finding.fingerprint} finding={finding} />
                ))}
              </CardGrid>
            )
          }
        </QueryView>
        <div style={{ height: 32 }} />
      </motion.div>
    </ViewShell>
  );
}

export const KNOWLEDGE_HEALTH_ROUTE_ID = '/agent-studio/knowledge/health';
