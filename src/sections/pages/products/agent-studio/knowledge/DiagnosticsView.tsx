import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { CheckCircle2, XCircle, Search, FlaskConical } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { TextInput } from '@components/common/ui/TextInput';
import { CopyButton } from '@components/common/ui/CopyButton';
import { EmptyState } from '@components/common/ui/EmptyState';
import {
  ViewShell,
  ViewHeader,
  ViewHeaderRow,
  ViewTitle,
  ViewSubtitle,
} from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import { useExplainRetrieval } from '@hooks/studio/useKnowledgeLibrary';
import { SectionBackRow } from './SectionBackRow';

/** Full route id (child of agentStudioKnowledgeRoute, path '/$docId/diagnostics'). */
export const KNOWLEDGE_DIAGNOSTICS_ROUTE_ID = '/agent-studio/knowledge/$docId/diagnostics' as const;

const CHECK_ORDER = [
  'exists',
  'state',
  'curation',
  'version',
  'acl',
  'attribute_filter',
  'exclusion',
  'threshold',
] as const;

const CHECK_LABELS: Record<string, string> = {
  exists: 'Exists',
  state: 'Ready state',
  curation: 'Curation',
  version: 'Version policy',
  acl: 'Access control',
  attribute_filter: 'Attribute filters',
  exclusion: 'Exclusion list',
  threshold: 'Score threshold',
};

const FormRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin: 16px 0;
`;

const Stepper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  margin: 24px 0;
`;

const Step = styled.div<{ $failed?: boolean; $isFinal?: boolean }>`
  display: flex;
  gap: 16px;
  padding: 16px;
  border-left: 3px solid
    ${({ theme, $failed }) =>
      $failed ? theme.app.status.error.fg : theme.app.status.success.fg};
  background: ${({ theme, $isFinal, $failed }) =>
    $isFinal
      ? $failed
        ? theme.app.status.error.bg
        : theme.app.status.success.bg
      : theme.app.surface.subtle};
  border-radius: 0 8px 8px 0;
  margin-bottom: 8px;
`;

const StepIcon = styled.div`
  flex-shrink: 0;
  margin-top: 2px;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepName = styled.div`
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
`;

const StepDetail = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.5;
`;

const TraceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 8px;
  margin: 16px 0;
  font-family: monospace;
  font-size: 13px;
`;

export function DiagnosticsView() {
  const params = useParams({ from: KNOWLEDGE_DIAGNOSTICS_ROUTE_ID });
  const docId = params.docId ?? '';
  const [query, setQuery] = useState('');
  const explain = useExplainRetrieval();

  const handleDiagnose = () => {
    if (!query.trim() || !docId) return;
    explain.mutate({ query: query.trim(), documentId: docId });
  };

  const result = explain.data;
  const whyNot = result?.whyNot ?? null;

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/knowledge">
        <span aria-hidden="true">‹</span> Knowledge
      </SectionBackRow>
      <ViewHeader>
        <ViewHeaderRow>
          <div>
            <ViewTitle>Diagnostics</ViewTitle>
            <ViewSubtitle>
              Why a document did or didn't surface for a query.
            </ViewSubtitle>
          </div>
        </ViewHeaderRow>
      </ViewHeader>

      <motion.div variants={pageItem} initial="hidden" animate="visible">
        <FormRow>
          <div style={{ flex: 1 }}>
            <TextInput
              label="Query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter the query to diagnose…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDiagnose();
              }}
            />
          </div>
          <ActionButton
            onClick={handleDiagnose}
            disabled={!query.trim() || explain.isPending}
          >
            <Search size={14} /> {explain.isPending ? 'Diagnosing…' : 'Diagnose'}
          </ActionButton>
        </FormRow>

        {explain.isError && (
          <EmptyState
            icon={<FlaskConical size={32} />}
            title="Diagnosis failed"
            description="Could not run the explain. Try again."
          />
        )}

        {whyNot && (
          <>
            <TraceRow>
              <span>Trace ID:</span>
              <span>{result?.traceId ?? '—'}</span>
              {result?.traceId && <CopyButton value={result.traceId} />}
              <StatusPill tone={whyNot.found ? 'info' : 'error'}>
                {whyNot.found ? 'Found' : 'Not found'}
              </StatusPill>
            </TraceRow>

            <Stepper>
              {CHECK_ORDER.map((check) => {
                const step = whyNot.steps.find((s) => s.check === check);
                if (!step) return null;
                const isFinal = whyNot.final_reason === check;
                const Icon = step.passed ? CheckCircle2 : XCircle;
                const color = step.passed ? 'var(--color-success)' : 'var(--color-error)';
                return (
                  <Step key={check} $failed={!step.passed} $isFinal={isFinal}>
                    <StepIcon>
                      <Icon size={20} color={color} />
                    </StepIcon>
                    <StepContent>
                      <StepName>
                        {CHECK_LABELS[check] ?? check}
                        {isFinal && !step.passed && ' — blocking'}
                      </StepName>
                      <StepDetail>{step.detail}</StepDetail>
                    </StepContent>
                  </Step>
                );
              })}
            </Stepper>

            {whyNot.final_reason === 'would_rank' && (
              <Panel>
                <StepDetail>
                  All exclusion checks passed — this document was a candidate.
                  If it didn't appear in results, the issue is scoring or the
                  result limit, not filtering.
                </StepDetail>
              </Panel>
            )}
          </>
        )}

        {!whyNot && !explain.isPending && !explain.isError && (
          <EmptyState
            icon={<FlaskConical size={32} />}
            title="Run a diagnosis"
            description="Enter a query above to see why this document did or didn't surface."
          />
        )}
      </motion.div>
    </ViewShell>
  );
}
