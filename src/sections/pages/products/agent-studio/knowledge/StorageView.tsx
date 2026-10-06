import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Database, HardDrive, Trash2, ArrowRight } from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import {
  ViewShell,
  ViewHeader,
  ViewHeaderRow,
  ViewTitle,
  ViewSubtitle,
} from '@components/common/ui/ViewLayout';
import { DataTable, DataHead, DataRow, DataCell } from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { useStorageMeter } from '@hooks/studio/useKnowledgeLibrary';
import { useState } from 'react';
import { SectionBackRow } from './SectionBackRow';

const MeterPanel = styled(Panel)`
  padding: 24px;
  margin: 16px 0;
`;

const MeterNumbers = styled.div`
  display: flex;
  gap: 32px;
  margin: 16px 0;
  flex-wrap: wrap;
`;

const MeterNumber = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MeterLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const MeterValue = styled.span<{ $warning?: boolean }>`
  font-size: 24px;
  font-weight: 600;
  color: ${({ theme, $warning }) =>
    $warning ? theme.app.status.warning.fg : theme.app.text.primary};
`;

const WarningBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.status.warning.bg};
  color: ${({ theme }) => theme.app.status.warning.fg};
  font-size: 14px;
  margin: 16px 0;
`;

const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
`;

const BarLabel = styled.span`
  width: 120px;
  font-size: 14px;
  flex-shrink: 0;
`;

const BarValue = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
  font-variant-numeric: tabular-nums;
  min-width: 80px;
  text-align: right;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 24px 0 12px;
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 12px;
  margin: 24px 0;
  flex-wrap: wrap;
`;

const stateTone: Record<string, StatusTone> = {
  ready: 'success',
  processing: 'info',
  failed: 'error',
  retired: 'warning',
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function StorageView() {
  const meter = useStorageMeter();
  const [purgeOpen, setPurgeOpen] = useState(false);

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/knowledge" label="Knowledge" />
      <ViewHeader>
        <ViewHeaderRow>
          <div>
            <ViewTitle>Storage</ViewTitle>
            <ViewSubtitle>Quota usage and breakdowns across your knowledge base.</ViewSubtitle>
          </div>
        </ViewHeaderRow>
      </ViewHeader>

      <QueryView query={meter} loadingText="Loading storage meter…">
        {(data) => {
          if (!data) {
            return (
              <EmptyState
                icon={<Database size={32} />}
                title="No storage data"
                description="Storage metrics are not available yet."
              />
            );
          }
          const used = data.committedBytes + data.reservedBytes;
          const pct = data.maxBytes ? (used / data.maxBytes) * 100 : 0;
          const warnAt = data.warnAtPercent ?? 80;
          const isWarning = pct >= warnAt;

          return (
            <motion.div {...pageItem}>
              {isWarning && (
                <WarningBanner>
                  <HardDrive size={16} />
                  Storage is {pct.toFixed(1)}% full — consider purging retired documents or requesting more quota.
                </WarningBanner>
              )}

              <MeterPanel>
                <MeterNumbers>
                  <MeterNumber>
                    <MeterLabel>Used</MeterLabel>
                    <MeterValue $warning={isWarning}>{formatBytes(used)}</MeterValue>
                  </MeterNumber>
                  <MeterNumber>
                    <MeterLabel>Quota</MeterLabel>
                    <MeterValue>{data.maxBytes ? formatBytes(data.maxBytes) : 'Unlimited'}</MeterValue>
                  </MeterNumber>
                  <MeterNumber>
                    <MeterLabel>Available</MeterLabel>
                    <MeterValue>{formatBytes(Math.max(0, data.availableBytes))}</MeterValue>
                  </MeterNumber>
                </MeterNumbers>
                {data.maxBytes && (
                  <ProgressBar
                    value={pct}
                    label={`Storage ${pct.toFixed(1)}% used`}
                    tone={isWarning ? 'amber' : 'emerald'}
                    height={12}
                  />
                )}
              </MeterPanel>

              <ActionsRow>
                <Link to="/agent-studio/knowledge/usage">
                  <ActionButton variant="secondary">
                    View unused <ArrowRight size={14} />
                  </ActionButton>
                </Link>
                <ActionButton variant="secondary" onClick={() => setPurgeOpen(true)}>
                  <Trash2 size={14} /> Purge retired
                </ActionButton>
                <Link to="/agent-studio/settings/billing">
                  <ActionButton variant="secondary">Request quota</ActionButton>
                </Link>
              </ActionsRow>

              <SectionTitle>By state</SectionTitle>
              <Panel>
                {data.byState.map((entry) => {
                  const entryPct = used > 0 ? (entry.bytes / used) * 100 : 0;
                  return (
                    <BarRow key={entry.state}>
                      <BarLabel>
                        <StatusPill tone={stateTone[entry.state] ?? 'info'}>{entry.state}</StatusPill>
                      </BarLabel>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={entryPct} label={`${entry.state} storage`} height={8} />
                      </div>
                      <BarValue>
                        {formatBytes(entry.bytes)} · {entry.count}
                      </BarValue>
                    </BarRow>
                  );
                })}
              </Panel>

              <SectionTitle>By origin</SectionTitle>
              <Panel>
                {data.byOrigin.map((entry) => {
                  const entryPct = used > 0 ? (entry.bytes / used) * 100 : 0;
                  return (
                    <BarRow key={entry.origin}>
                      <BarLabel>{entry.origin}</BarLabel>
                      <div style={{ flex: 1 }}>
                        <ProgressBar value={entryPct} label={`${entry.origin} storage`} height={8} />
                      </div>
                      <BarValue>
                        {formatBytes(entry.bytes)} · {entry.count}
                      </BarValue>
                    </BarRow>
                  );
                })}
              </Panel>

              <SectionTitle>Top 20 documents</SectionTitle>
              <DataTable>
                <thead>
                  <DataRow>
                    <DataHead>Title</DataHead>
                    <DataHead>Size</DataHead>
                  </DataRow>
                </thead>
                <tbody>
                  {data.topDocuments.map((doc) => (
                    <DataRow key={doc.documentId}>
                      <DataCell>
                        <Link to={`/agent-studio/knowledge/${doc.documentId}/preview`}>
                          {doc.title ?? doc.documentId.slice(0, 8)}
                        </Link>
                      </DataCell>
                      <DataCell>{formatBytes(doc.bytes)}</DataCell>
                    </DataRow>
                  ))}
                </tbody>
              </DataTable>

              <ConfirmDialog
                open={purgeOpen}
                title="Purge retired documents"
                message="This permanently deletes all retired documents and their versions. This cannot be undone."
                confirmLabel="Purge"
                destructive
                onConfirm={() => {
                  // TODO: wire to purge endpoint when available
                  setPurgeOpen(false);
                }}
                onCancel={() => setPurgeOpen(false)}
              />
            </motion.div>
          );
        }}
      </QueryView>
    </ViewShell>
  );
}
