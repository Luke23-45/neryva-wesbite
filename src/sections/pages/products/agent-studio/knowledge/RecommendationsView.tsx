import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import {
  Archive,
  FileWarning,
  Copy,
  SearchX,
  Gauge,
  X,
  Lightbulb,
} from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import { useRecommendations, type Recommendation } from '@hooks/studio/useKnowledgeLibrary';

const typeIcon: Record<string, React.ReactNode> = {
  deprecate_unused: <Archive size={18} />,
  review_rejected: <FileWarning size={18} />,
  merge_duplicates: <Copy size={18} />,
  fill_recall_gap: <SearchX size={18} />,
  curate_low_confidence: <Gauge size={18} />,
};

const typeLabel: Record<string, string> = {
  deprecate_unused: 'Deprecate unused',
  review_rejected: 'Review rejected',
  merge_duplicates: 'Merge duplicates',
  fill_recall_gap: 'Fill recall gap',
  curate_low_confidence: 'Low confidence',
};

const severityTone: Record<string, StatusTone> = {
  info: 'info',
  warning: 'warning',
  action: 'error',
};

const RecCard = styled(Panel)`
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  gap: 12px;
`;

const IconWrap = styled.div`
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.secondary};
`;

const CardBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
`;

const CardTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
`;

const CardDetail = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.secondary};
  margin: 0 0 8px;
  line-height: 1.5;
`;

const SuggestedAction = styled.div`
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.subtle};
  margin-bottom: 8px;
`;

const DocLinks = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
`;

const DismissButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.app.text.secondary};
  padding: 4px;
  border-radius: 4px;
  flex-shrink: 0;
  align-self: flex-start;
  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    background: ${({ theme }) => theme.app.surface.subtle};
  }
`;

const ReadOnlyNote = styled.p`
  font-size: 12px;
  opacity: 0.65;
  margin: 0 0 16px;
  line-height: 1.6;
`;

function RecommendationCard({
  rec,
  onDismiss,
}: {
  rec: Recommendation;
  onDismiss: () => void;
}) {
  return (
    <RecCard>
      <IconWrap>{typeIcon[rec.type] ?? <Lightbulb size={18} />}</IconWrap>
      <CardBody>
        <CardHeader>
          <StatusPill tone={severityTone[rec.severity] ?? 'info'}>
            {rec.severity}
          </StatusPill>
          <span style={{ fontSize: 12, opacity: 0.7 }}>{typeLabel[rec.type] ?? rec.type}</span>
        </CardHeader>
        <CardTitle>{rec.title}</CardTitle>
        <CardDetail>{rec.detail}</CardDetail>
        {rec.suggestedAction && (
          <SuggestedAction>
            <strong>Suggested:</strong> {rec.suggestedAction}
          </SuggestedAction>
        )}
        {rec.documentIds.length > 0 && (
          <DocLinks>
            {rec.documentIds.slice(0, 5).map((docId) => (
              <Link
                key={docId}
                to="/agent-studio/knowledge/$docId/diagnostics"
                params={{ docId }}
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              >
                {docId.slice(0, 8)}…
              </Link>
            ))}
            {rec.documentIds.length > 5 && (
              <span style={{ opacity: 0.6 }}>+{rec.documentIds.length - 5} more</span>
            )}
          </DocLinks>
        )}
      </CardBody>
      <DismissButton onClick={onDismiss} aria-label="Dismiss recommendation">
        <X size={16} />
      </DismissButton>
    </RecCard>
  );
}

export function RecommendationsView() {
  const recsQuery = useRecommendations();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleDismiss = (index: number) => {
    setDismissed((prev) => new Set(prev).add(`${index}`));
  };

  return (
    <ViewShell>
      <ViewHeader>
        <div>
          <ViewTitle>Recommendations</ViewTitle>
          <ViewSubtitle>Automated suggestions from usage, quality, and gap analysis.</ViewSubtitle>
        </div>
      </ViewHeader>

      <ReadOnlyNote>
        Recommendations are read-only suggestions — nothing is applied automatically.
        Review each item and take action manually.
      </ReadOnlyNote>

      <QueryView query={recsQuery}>
        {(recommendations) => {
          const visible = (recommendations ?? []).filter(
            (_, i) => !dismissed.has(`${i}`),
          );
          return visible.length === 0 ? (
            <EmptyState
              icon={<Lightbulb size={24} />}
              title="No recommendations"
              description="The library looks healthy. Check back after more usage data accumulates."
            />
          ) : (
            <motion.div {...pageItem}>
              {visible.map((rec, i) => (
                <RecommendationCard
                  key={`${rec.type}-${i}`}
                  rec={rec}
                  onDismiss={() => handleDismiss(i)}
                />
              ))}
            </motion.div>
          );
        }}
      </QueryView>
    </ViewShell>
  );
}
