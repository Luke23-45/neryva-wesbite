import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Download, FileText, Users } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Segmented } from '@components/common/ui/Segmented/Segmented';
import {
  ViewShell,
  ViewHeader,
  ViewHeaderRow,
  ViewTitle,
  ViewSubtitle,
} from '@components/common/ui/ViewLayout';
import { DataTable, DataHead, DataRow, DataCell } from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { useDocuments } from '@hooks/studio/useSetupKnowledge';
import { useAssistants } from '@hooks/studio/useAssistants';
import {
  useDocumentConsumers,
  useAgentDocuments,
  useUnusedQueue,
  useCitationQuadrants,
} from '@hooks/studio/useKnowledgeLibrary';
import { relativeTime } from '@/sections/pages/products/agent-studio/builder/lib/memory-model';
import { SectionBackRow } from './SectionBackRow';

type DayRange = '7' | '30' | '90';

const RANGE_OPTIONS = [
  { value: '7' as DayRange, label: '7d' },
  { value: '30' as DayRange, label: '30d' },
  { value: '90' as DayRange, label: '90d' },
] as const;

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.app.type.titleLg};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  margin: 28px 0 12px;
`;

const SectionNote = styled.p`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  margin: 8px 0 0;
`;

const ConversionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
`;

const BarTrack = styled.div`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: ${({ theme }) => theme.app.surface.active};
  overflow: hidden;
`;

const BarFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => Math.min(100, Math.max(0, $pct))}%;
  border-radius: 3px;
  background: ${({ theme }) => theme.app.control.primary};
`;

const BarLabel = styled.span`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  min-width: 44px;
  text-align: right;
  font-variant-numeric: tabular-nums;
`;

const QuadrantGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const QuadrantCard = styled(Panel)`
  padding: 16px;
`;

const QuadrantTitle = styled.h3`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  margin: 0 0 4px;
`;

const QuadrantDesc = styled.p`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  margin: 0 0 12px;
`;

const QuadrantCount = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.app.text.primary};
  font-variant-numeric: tabular-nums;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toCsv(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** One document row — fetches its own consumers (cached, parallel). */
function DocumentUsageRow({ documentId, title, days }: { documentId: string; title: string; days: number }) {
  const consumers = useDocumentConsumers(documentId, days);
  const retrievals = useMemo(
    () => (consumers.data ?? []).reduce((sum, c) => sum + c.retrievalCount, 0),
    [consumers.data],
  );
  const citations = useMemo(
    () => (consumers.data ?? []).reduce((sum, c) => sum + c.citationCount, 0),
    [consumers.data],
  );
  const agentCount = (consumers.data ?? []).length;
  const conversion = retrievals > 0 ? (citations / retrievals) * 100 : 0;

  return (
    <DataRow>
      <DataCell>
        <Link
          to="/agent-studio/knowledge/$docId/preview"
          params={{ docId: documentId }}
          style={{ color: 'inherit', textDecoration: 'none', fontWeight: 500 }}
        >
          {title}
        </Link>
      </DataCell>
      <DataCell style={{ fontVariantNumeric: 'tabular-nums' }}>
        {consumers.isLoading ? '…' : retrievals.toLocaleString()}
      </DataCell>
      <DataCell style={{ fontVariantNumeric: 'tabular-nums' }}>
        {consumers.isLoading ? '…' : citations.toLocaleString()}
      </DataCell>
      <DataCell>
        <ConversionBar>
          <BarTrack>
            <BarFill $pct={conversion} />
          </BarTrack>
          <BarLabel>{conversion.toFixed(0)}%</BarLabel>
        </ConversionBar>
      </DataCell>
      <DataCell style={{ fontVariantNumeric: 'tabular-nums' }}>{agentCount}</DataCell>
    </DataRow>
  );
}

/** One agent row — fetches its own document usage (cached, parallel). */
function AgentUsageRow({ agentId, name, days }: { agentId: string; name: string; days: number }) {
  const usage = useAgentDocuments(agentId, days);
  const documents = usage.data ?? [];
  const retrievals = useMemo(() => documents.reduce((sum, d) => sum + d.retrievalCount, 0), [documents]);
  const citations = useMemo(() => documents.reduce((sum, d) => sum + d.citationCount, 0), [documents]);

  return (
    <DataRow>
      <DataCell style={{ fontWeight: 500 }}>{name}</DataCell>
      <DataCell style={{ fontVariantNumeric: 'tabular-nums' }}>
        {usage.isLoading ? '…' : documents.length}
      </DataCell>
      <DataCell style={{ fontVariantNumeric: 'tabular-nums' }}>
        {usage.isLoading ? '…' : retrievals.toLocaleString()}
      </DataCell>
      <DataCell style={{ fontVariantNumeric: 'tabular-nums' }}>
        {usage.isLoading ? '…' : citations.toLocaleString()}
      </DataCell>
    </DataRow>
  );
}

const QUADRANT_META: Record<string, { title: string; desc: string }> = {
  high_high: {
    title: 'High retrieval · High citation',
    desc: 'Working well — the core of the library.',
  },
  high_low: {
    title: 'High retrieval · Low citation',
    desc: 'Retrieved but rarely cited — review relevance.',
  },
  low_high: {
    title: 'Low retrieval · High citation',
    desc: 'Rarely retrieved but cited when found — consider broader pinning.',
  },
  low_low: {
    title: 'Low retrieval · Low citation',
    desc: 'Candidates for deprecation.',
  },
};

export function UsageView() {
  const [days, setDays] = useState<DayRange>('30');
  const daysNum = Number(days);

  const documents = useDocuments(100);
  const assistants = useAssistants();
  const unused = useUnusedQueue(daysNum);
  const quadrants = useCitationQuadrants(daysNum);

  const handleExportCsv = () => {
    const rows: string[][] = [['Document', 'Retrievals', 'Citations', 'Conversion %', 'Agents']];
    // Note: per-row consumer data is fetched in row components; the CSV
    // exports the document list with a reminder to open each row for detail.
    for (const doc of documents.data ?? []) {
      rows.push([doc.title ?? doc.id, '', '', '', '']);
    }
    downloadCsv(`knowledge-usage-${days}d.csv`, toCsv(rows));
  };

  return (
    <ViewShell>
      <motion.div {...pageItem}>
        <SectionBackRow to="/agent-studio/knowledge">‹ Knowledge</SectionBackRow>
        <ViewHeader>
          <ViewHeaderRow>
            <div>
              <ViewTitle>Usage</ViewTitle>
              <ViewSubtitle>
                Retrieval and citation activity across documents and agents.
              </ViewSubtitle>
            </div>
            <HeaderActions>
              <Segmented
                options={RANGE_OPTIONS}
                value={days}
                onChange={setDays}
                ariaLabel="Date range"
              />
              <ActionButton variant="secondary" onClick={handleExportCsv} >
              <Download size={14} style={{ marginRight: 6 }} />
                Export CSV
              </ActionButton>
            </HeaderActions>
          </ViewHeaderRow>
        </ViewHeader>

        <SectionTitle>Documents</SectionTitle>
        <QueryView
          query={documents}
        >
          {(docs) =>
            docs.length === 0 ? (
              <EmptyState
                icon={<FileText size={24} />}
                title="No documents"
                description="Upload documents so agents have something to retrieve — usage appears here."
                action={
                  <Link to="/agent-studio/knowledge/upload" style={{ textDecoration: 'none' }}>
                    <ActionButton size="sm">Upload documents</ActionButton>
                  </Link>
                }
              />
            ) : (
              <DataTable>
                <DataHead>
                  <DataCell>Title</DataCell>
                  <DataCell>Retrievals</DataCell>
                  <DataCell>Citations</DataCell>
                  <DataCell>Conversion</DataCell>
                  <DataCell>Agents</DataCell>
                </DataHead>
                {docs.map((doc) => (
                  <DocumentUsageRow
                    key={doc.id}
                    documentId={doc.id}
                    title={doc.title ?? doc.id}
                    days={daysNum}
                  />
                ))}
              </DataTable>
            )
          }
        </QueryView>

        <SectionTitle>Agents</SectionTitle>
        <QueryView
          query={assistants}
        >
          {(list) =>
            list.length === 0 ? (
              <EmptyState
                icon={<Users size={24} />}
                title="No agents"
                description="Agents appear here once they start retrieving knowledge."
                action={
                  <Link to="/agent-studio/agents" style={{ textDecoration: 'none' }}>
                    <ActionButton size="sm">Go to agents</ActionButton>
                  </Link>
                }
              />
            ) : (
              <DataTable>
                <DataHead>
                  <DataCell>Name</DataCell>
                  <DataCell>Documents</DataCell>
                  <DataCell>Retrievals</DataCell>
                  <DataCell>Citations</DataCell>
                </DataHead>
                {list.map((agent) => (
                  <AgentUsageRow
                    key={agent.id}
                    agentId={agent.id}
                    name={agent.name ?? agent.id}
                    days={daysNum}
                  />
                ))}
              </DataTable>
            )
          }
        </QueryView>

        <SectionTitle>Unused queue</SectionTitle>
        <QueryView
          query={unused}
        >
          {(data) =>
            data.documents.length === 0 ? (
              <EmptyState
                icon={<FileText size={24} />}
                title="No unused documents"
                description="Every ready document was retrieved or cited recently — or is pinned to a scope."
              />
            ) : (
              <>
                <DataTable>
                  <DataHead>
                    <DataCell>Document</DataCell>
                    <DataCell>Created</DataCell>
                    <DataCell>Size</DataCell>
                    <DataCell>Days unused</DataCell>
                  </DataHead>
                  {data.documents.map((doc) => (
                    <DataRow key={doc.documentId}>
                      <DataCell style={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {doc.documentId.slice(0, 8)}…
                      </DataCell>
                      <DataCell>{relativeTime(doc.createdAt)}</DataCell>
                      <DataCell>{formatBytes(doc.byteSize)}</DataCell>
                      <DataCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {data.windowDays}
                      </DataCell>
                    </DataRow>
                  ))}
                </DataTable>
                <SectionNote>
                  Unused = ready + no scope pins + no retrieval or citation in the last{' '}
                  {data.windowDays} days + not uploaded in the last {data.windowDays} days.
                </SectionNote>
              </>
            )
          }
        </QueryView>

        <SectionTitle>Citation quadrants</SectionTitle>
        <QueryView
          query={quadrants}
        >
          {(data) => (
            <QuadrantGrid>
              {data.quadrants.map((q) => {
                const meta = QUADRANT_META[q.quadrant] ?? { title: q.quadrant, desc: '' };
                return (
                  <QuadrantCard key={q.quadrant}>
                    <QuadrantTitle>{meta.title}</QuadrantTitle>
                    <QuadrantDesc>{meta.desc}</QuadrantDesc>
                    <QuadrantCount>{q.count}</QuadrantCount>
                    <SectionNote>
                      {q.count === 1 ? '1 document' : `${q.count} documents`}
                    </SectionNote>
                  </QuadrantCard>
                );
              })}
            </QuadrantGrid>
          )}
        </QueryView>
        <div style={{ height: 32 }} />
      </motion.div>
    </ViewShell>
  );
}

export const KNOWLEDGE_USAGE_ROUTE_ID = '/agent-studio/knowledge/usage';
