import { useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Plus, Globe, FileText, BookOpen, MoreHorizontal } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { Modal } from '@components/common/ui/Modal';
import { Segmented } from '@components/common/ui/Segmented';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import knowledge from '@neryva_data/products/agent_studio/knowledge.json';
import {
  TotalsGrid,
  TotalCard,
  TotalLabel,
  TotalValue,
  SourceCell,
  KindIcon,
  SourceName,
  SourceUrl,
  KindPill,
  SyncMeta,
  SyncBy,
  RowMenuButton,
  AddForm,
  AddLabel,
  AddInput,
} from './KnowledgeView.styles';

const KIND_ICON = {
  url: Globe,
  file: FileText,
  notion: BookOpen,
} as const;

const statusTone: Record<string, 'emerald' | 'azure' | 'warning' | 'error'> = {
  synced: 'emerald',
  syncing: 'azure',
  outdated: 'warning',
  error: 'error',
};

const statusLabel: Record<string, string> = {
  synced: 'synced',
  syncing: 'syncing',
  outdated: 'outdated',
  error: 'failed',
};

type SourceKind = 'url' | 'file' | 'notion';
const kindOptions: { value: SourceKind; label: string }[] = [
  { value: 'url', label: 'URL' },
  { value: 'file', label: 'File' },
  { value: 'notion', label: 'Notion' },
];

const CellNum = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.secondary};
  font-variant-numeric: tabular-nums;
`;

export function KnowledgeView() {
  const [addOpen, setAddOpen] = useState(false);
  const [addValue, setAddValue] = useState('');
  const [addKind, setAddKind] = useState<SourceKind>('url');

  const submitSource = () => {
    const value = addValue.trim();
    if (!value) {
      toast.error('Enter a URL or file name');
      return;
    }
    toast.success(`Source queued for sync (${addKind})`);
    setAddValue('');
    setAddKind('url');
    setAddOpen(false);
  };

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Knowledge base</ViewTitle>
          <ViewSubtitle>
            Sources your agents reference to answer questions. Add URLs, files, or connect Notion
            workspaces.
          </ViewSubtitle>
        </ViewHeader>
        <ActionButton size="sm" onClick={() => setAddOpen(true)}>
          <Plus size={14} strokeWidth={2} />
          Add source
        </ActionButton>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <TotalsGrid>
          <TotalCard>
            <TotalLabel>Sources</TotalLabel>
            <TotalValue>{knowledge.totals.sources}</TotalValue>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Documents</TotalLabel>
            <TotalValue>{knowledge.totals.documents.toLocaleString()}</TotalValue>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Index size</TotalLabel>
            <TotalValue>{knowledge.totals.size}</TotalValue>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Queries</TotalLabel>
            <TotalValue>{knowledge.totals.queries.toLocaleString()}</TotalValue>
          </TotalCard>
          <TotalCard>
            <TotalLabel>Avg latency</TotalLabel>
            <TotalValue>{knowledge.totals.avgLatency}</TotalValue>
          </TotalCard>
        </TotalsGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel flush>
          <DataTable>
            <DataHead>
              <DataCell $w="32%">Source</DataCell>
              <DataCell $w="10%">Type</DataCell>
              <DataCell $w="12%" $align="right">Documents</DataCell>
              <DataCell $w="14%" $align="right">Size</DataCell>
              <DataCell $w="16%">Last sync</DataCell>
              <DataCell $w="14%">Status</DataCell>
              <DataCell $w="40px" />
            </DataHead>
            {knowledge.sources.map((s, i) => {
              const Icon = KIND_ICON[s.kind as keyof typeof KIND_ICON];
              return (
                <DataRow
                  key={s.id}
                  as={motion.div}
                  initial="hidden"
                  animate="visible"
                  variants={pageItem}
                  custom={i + 3}
                  $interactive={false}
                >
                  <DataCell $w="32%">
                    <SourceCell>
                      <KindIcon aria-hidden="true">
                        <Icon size={14} strokeWidth={1.7} />
                      </KindIcon>
                      <div style={{ minWidth: 0 }}>
                        <SourceName>{s.name}</SourceName>
                        <SourceUrl>{s.url}</SourceUrl>
                      </div>
                    </SourceCell>
                  </DataCell>
                  <DataCell $w="10%">
                    <KindPill $kind={s.kind}>{s.kind}</KindPill>
                  </DataCell>
                  <DataCell $w="12%" $align="right">
                    <CellNum>{s.documents.toLocaleString()}</CellNum>
                  </DataCell>
                  <DataCell $w="14%" $align="right">
                    <CellNum>{s.size}</CellNum>
                  </DataCell>
                  <DataCell $w="16%">
                    <SyncMeta>
                      {s.lastSync}
                      <br />
                      <SyncBy>by {s.addedBy}</SyncBy>
                    </SyncMeta>
                  </DataCell>
                  <DataCell $w="14%">
                    <StatusPill tone={statusTone[s.status]}>{statusLabel[s.status]}</StatusPill>
                  </DataCell>
                  <DataCell $w="40px">
                    <RowMenuButton
                      type="button"
                      aria-label={`Actions for ${s.name}`}
                      onClick={() => toast(`Actions for ${s.name}`, { icon: '📄' })}
                    >
                      <MoreHorizontal size={15} strokeWidth={1.7} />
                    </RowMenuButton>
                  </DataCell>
                </DataRow>
              );
            })}
          </DataTable>
        </Panel>
      </motion.div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a knowledge source"
        footer={
          <>
            <ActionButton variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </ActionButton>
            <ActionButton onClick={submitSource}>Add source</ActionButton>
          </>
        }
      >
        <AddForm>
          <AddLabel>
            {addKind === 'url' ? 'URL' : addKind === 'file' ? 'File name' : 'Notion page or database'}
            <AddInput
              value={addValue}
              onChange={(e) => setAddValue(e.target.value)}
              placeholder={
                addKind === 'url'
                  ? 'https://docs.company.com/handbook'
                  : addKind === 'file'
                    ? 'refund-policy.pdf'
                    : 'Notion workspace/page'
              }
              autoFocus
            />
          </AddLabel>
          <AddLabel>
            Type
            <Segmented
              options={kindOptions}
              value={addKind}
              onChange={setAddKind}
              size="md"
              ariaLabel="Source type"
            />
          </AddLabel>
        </AddForm>
      </Modal>
    </ViewShell>
  );
}
