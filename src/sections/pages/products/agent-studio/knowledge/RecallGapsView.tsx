import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { SearchX, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Dropdown } from '@components/common/ui/Dropdown';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import { useRecallGaps, type RecallGap } from '@hooks/studio/useKnowledgeLibrary';
import { relativeTime } from '@/sections/pages/products/agent-studio/builder/lib/memory-model';

const gapTone: Record<string, StatusTone> = {
  zero_results: 'error',
  negative_feedback: 'warning',
  should_have_used: 'info',
};

const gapLabel: Record<string, string> = {
  zero_results: 'Zero results',
  negative_feedback: 'Negative feedback',
  should_have_used: 'Should have used',
};

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin: 12px 0 16px;
  flex-wrap: wrap;
`;

const GapCard = styled(Panel)`
  padding: 16px;
  margin-bottom: 12px;
`;

const GapHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

const QueryPreview = styled.div`
  font-size: 15px;
  font-weight: 600;
`;

const Meta = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`;

const CandidateList = styled.div`
  margin-top: 12px;
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
  padding-top: 12px;
`;

const CandidateRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
`;

const WhyNotReason = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  padding: 4px 0;
`;

const DAYS_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
];

function GapCardView({ gap }: { gap: RecallGap }) {
  const [expanded, setExpanded] = useState(false);
  const candidates = gap.candidateDocumentIds ?? [];

  return (
    <GapCard>
      <GapHeader>
        <StatusPill tone={gapTone[gap.gapType] ?? 'info'}>
          {gapLabel[gap.gapType] ?? gap.gapType}
        </StatusPill>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {gap.occurrenceCount} occurrence{gap.occurrenceCount === 1 ? '' : 's'}
        </span>
        {gap.detectedAt && (
          <span style={{ fontSize: 12, opacity: 0.7 }}>detected {relativeTime(gap.detectedAt)}</span>
        )}
      </GapHeader>
      <QueryPreview>{gap.queryPreview || gap.queryHash.slice(0, 12)}</QueryPreview>
      <Meta>
        <span>Query hash: {gap.queryHash.slice(0, 12)}…</span>
        <span>{candidates.length} candidate document{candidates.length === 1 ? '' : 's'}</span>
      </Meta>
      {candidates.length > 0 && (
        <CandidateList>
          <ToggleButton onClick={() => setExpanded((v) => !v)}>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {expanded ? 'Hide' : 'Show'} candidate documents
          </ToggleButton>
          {expanded &&
            candidates.map((docId) => (
              <CandidateRow key={docId}>
                <FileText size={14} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                <Link
                  to="/agent-studio/knowledge/$docId/diagnostics"
                  params={{ docId }}
                  style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}
                >
                  {docId.slice(0, 8)}…
                </Link>
                  <WhyNotReason> — see diagnostics for why-not analysis</WhyNotReason>
                </div>
              </CandidateRow>
            ))}
        </CandidateList>
      )}
    </GapCard>
  );
}

export function RecallGapsView() {
  const [days, setDays] = useState('7');
  const gapsQuery = useRecallGaps(parseInt(days, 10));

  return (
    <ViewShell>
      <ViewHeader>
        <div>
          <ViewTitle>Recall gaps</ViewTitle>
          <ViewSubtitle>Queries where retrieval failed to surface the right content.</ViewSubtitle>
        </div>
      </ViewHeader>

      <FilterBar>
        <Dropdown
          variant="select"
          label="Time range"
          value={days}
          items={DAYS_OPTIONS}
          onChange={(v) => setDays(v)}
        />
      </FilterBar>

      <QueryView query={gapsQuery}>
        {(data) => {
          const gaps = data?.gaps ?? [];
          return gaps.length === 0 ? (
            <EmptyState
              icon={<SearchX size={24} />}
              title="No recall gaps"
              description={`No queries with zero results or negative feedback in the last ${days} days.`}
            />
          ) : (
            <motion.div variants={pageItem} initial="hidden" animate="visible">
              {gaps.map((gap, i) => (
                <GapCardView key={`${gap.queryHash}-${i}`} gap={gap} />
              ))}
            </motion.div>
          );
        }}
      </QueryView>
    </ViewShell>
  );
}
