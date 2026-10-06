import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Play } from 'lucide-react';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ActionButton } from '@components/common/ui/ActionButton';
import { TextInput } from '@components/common/ui/TextInput';
import { Dropdown } from '@components/common/ui/Dropdown';
import { Segmented } from '@components/common/ui/Segmented';
import { Panel } from '@components/common/ui/Panel';
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
import { useScope, useSimulateScope } from '@hooks/studio/useKnowledgeLibrary';
import { useAssistants } from '@hooks/studio/useAssistants';
import { SectionBackRow } from './SectionBackRow';

const FormGrid = styled.div`
  display: grid;
  gap: 16px;
  max-width: 720px;
  margin-bottom: 24px;
`;

const Field = styled.label`
  display: grid;
  gap: 6px;
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
`;

const Row2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const HitCard = styled(Panel)`
  padding: 14px 16px;
  margin-bottom: 12px;
`;

const HitHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
`;

const HitTitle = styled.span`
  font-weight: 700;
  font-size: 14px;
`;

const HitScore = styled.span`
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  margin-left: auto;
`;

const ScoreBar = styled.div`
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.app.surface.subtle};
  margin-bottom: 8px;
  overflow: hidden;
`;

const ScoreFill = styled.div<{ width: number }>`
  height: 100%;
  width: ${({ width }) => Math.max(0, Math.min(100, width))}%;
  border-radius: 3px;
  background: ${({ theme }) => theme.app.status.info.fg};
`;

const HitText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TraceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
`;

const ExclusionList = styled.ul`
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
`;

const ExclusionItem = styled.li`
  padding: 8px 12px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  font-size: 13px;
  margin-bottom: 8px;
`;

type Mode = 'hybrid' | 'semantic' | 'keyword';

const MODE_OPTIONS = [
  { value: 'hybrid' as Mode, label: 'Hybrid' },
  { value: 'semantic' as Mode, label: 'Semantic' },
  { value: 'keyword' as Mode, label: 'Keyword' },
];

export const SCOPE_SIMULATE_ROUTE_ID = '/agent-studio/knowledge/scopes/$slug/simulate' as const;

export function ScopeSimulateView() {
  const { slug } = useParams({ from: SCOPE_SIMULATE_ROUTE_ID });
  const scopeQuery = useScope(slug);
  const simulate = useSimulateScope();
  const { data: assistants } = useAssistants({ enabled: true });

  const [query, setQuery] = useState('');
  const [agentId, setAgentId] = useState('');
  const [mode, setMode] = useState<Mode>('hybrid');
  const [topK, setTopK] = useState('10');
  const [threshold, setThreshold] = useState('');

  const result = simulate.data ?? null;

  const handleRun = () => {
    if (query.trim().length === 0) return;
    const k = Math.max(1, Math.min(50, Number(topK) || 10));
    const t = threshold.trim() === '' ? undefined : Number(threshold);
    simulate.mutate({
      slug,
      query: query.trim(),
      topK: k,
      threshold: t !== undefined && !isNaN(t) ? t : undefined,
      agentId: agentId || undefined,
      mode,
    });
  };

  const trace = result?.trace as Record<string, unknown> | null;
  const exclusions = Array.isArray((trace as Record<string, unknown> | null)?.exclusions)
    ? ((trace as Record<string, unknown>).exclusions as Array<Record<string, unknown>>)
    : [];

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/knowledge/scopes">‹ Scopes</SectionBackRow>
      <ViewHeader>
        <ViewHeaderRow>
          <div>
            <ViewTitle>Simulate: {scopeQuery.data?.scope?.name ?? slug}</ViewTitle>
            <ViewSubtitle>
              Run the retrieval pipeline constrained to this scope — configuration by observation.
            </ViewSubtitle>
          </div>
        </ViewHeaderRow>
      </ViewHeader>

      <QueryView query={scopeQuery}>
        {() => (
          <motion.div {...pageItem}>
          <FormGrid>
            <Field>
              Query
              <TextInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What does the refund policy say?"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRun();
                }}
              />
            </Field>
            <Row2>
              <Field>
                Agent (optional)
                <Dropdown
                  variant="select"
                  items={[
                    { value: '', label: 'No agent context' },
                    ...((assistants ?? []).map((a) => ({
                      value: a.id,
                      label: a.name ?? a.id,
                    }))),
                  ]}
                  value={agentId}
                  onChange={(v) => setAgentId(v)}
                />
              </Field>
              <Field>
                Mode
                <Segmented options={MODE_OPTIONS} value={mode} onChange={setMode} />
              </Field>
            </Row2>
            <Row2>
              <Field>
                Top-k
                <TextInput
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                  inputMode="numeric"
                />
              </Field>
              <Field>
                Threshold (optional)
                <TextInput
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="Leave empty for default"
                  inputMode="decimal"
                />
              </Field>
            </Row2>
            <div>
              <ActionButton onClick={handleRun} disabled={simulate.isPending || query.trim().length === 0}>
                <Play size={15} /> {simulate.isPending ? 'Running…' : 'Run simulation'}
              </ActionButton>
            </div>
          </FormGrid>

          {simulate.isError && (
            <EmptyState
              icon={<Play size={28} />}
              title="Simulation failed"
              description="Check the query and try again."
            />
          )}

          {result && (
            <>
              {result.hits.length === 0 ? (
                <EmptyState
                  icon={<Play size={28} />}
                  title="No hits"
                  description="The scope admitted no chunks for this query. Loosen filters or check pins."
                />
              ) : (
                result.hits.map((hit) => (
                  <HitCard key={hit.chunkId}>
                    <HitHeader>
                      <HitTitle>{hit.title ?? hit.documentId}</HitTitle>
                      <HitScore>{hit.score.toFixed(3)}</HitScore>
                    </HitHeader>
                    <ScoreBar>
                      <ScoreFill width={hit.score * 100} />
                    </ScoreBar>
                    <HitText>{hit.text}</HitText>
                  </HitCard>
                ))
              )}

              {exclusions.length > 0 && (
                <>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '24px 0 8px' }}>
                    Excluded ({exclusions.length})
                  </h3>
                  <ExclusionList>
                    {exclusions.map((ex, i) => (
                      <ExclusionItem key={i}>
                        {String(ex.document_id ?? ex.documentId ?? `item ${i + 1}`)}
                        {ex.reason ? ` — ${String(ex.reason)}` : ''}
                      </ExclusionItem>
                    ))}
                  </ExclusionList>
                </>
              )}

              {result.traceId && (
                <TraceRow>
                  <span>trace_id: {result.traceId}</span>
                  <CopyButton value={result.traceId} />
                </TraceRow>
              )}
            </>
          )}
          </motion.div>
        )}
      </QueryView>
    </ViewShell>
  );
}
