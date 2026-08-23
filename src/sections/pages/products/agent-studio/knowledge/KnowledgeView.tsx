import { motion } from 'framer-motion';
import { Plus, Globe, FileText, BookOpen, MoreHorizontal } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import knowledge from '@neryva_data/products/agent_studio/knowledge.json';
import {
  PageRoot,
  PageHeader,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  NewBtn,
  TotalsGrid,
  TotalCard,
  TotalLabel,
  TotalValue,
  SourcesTable,
  TableHeader,
  TableRow,
  Cell,
  SourceName,
  SourceUrl,
  KindPill,
  Metric,
  Meta,
} from './KnowledgeView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.05 },
  }),
};

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

export function KnowledgeView() {
  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>Knowledge base</PageTitle>
          <PageSubtitle>
            Sources your agents reference to answer questions. Add URLs, files, or connect Notion
            workspaces.
          </PageSubtitle>
        </TitleBlock>
        <NewBtn type="button">
          <Plus size={14} strokeWidth={2} />
          Add source
        </NewBtn>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
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

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <SourcesTable>
            <TableHeader>
              <Cell $w="32%">Source</Cell>
              <Cell $w="10%">Type</Cell>
              <Cell $w="12%" $align="right">Documents</Cell>
              <Cell $w="14%" $align="right">Size</Cell>
              <Cell $w="16%">Last sync</Cell>
              <Cell $w="14%">Status</Cell>
              <Cell $w="40px" />
            </TableHeader>
            {knowledge.sources.map((s, i) => {
              const Icon = KIND_ICON[s.kind as keyof typeof KIND_ICON];
              return (
                <TableRow
                  key={s.id}
                  as={motion.div}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={i + 3}
                >
                  <Cell $w="32%">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          color: 'rgba(229, 231, 235, 0.7)',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={14} strokeWidth={1.7} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <SourceName>{s.name}</SourceName>
                        <SourceUrl>{s.url}</SourceUrl>
                      </div>
                    </div>
                  </Cell>
                  <Cell $w="10%">
                    <KindPill $kind={s.kind}>{s.kind}</KindPill>
                  </Cell>
                  <Cell $w="12%" $align="right">
                    <Metric>{s.documents.toLocaleString()}</Metric>
                  </Cell>
                  <Cell $w="14%" $align="right">
                    <Metric>{s.size}</Metric>
                  </Cell>
                  <Cell $w="16%">
                    <Meta>
                      {s.lastSync}
                      <br />
                      <span style={{ color: 'rgba(229, 231, 235, 0.40)' }}>by {s.addedBy}</span>
                    </Meta>
                  </Cell>
                  <Cell $w="14%">
                    <StatusPill tone={statusTone[s.status]}>{statusLabel[s.status]}</StatusPill>
                  </Cell>
                  <Cell $w="40px" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      aria-label={`Actions for ${s.name}`}
                      style={{
                        width: 28,
                        height: 28,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 0,
                        background: 'transparent',
                        color: 'rgba(229, 231, 235, 0.55)',
                        borderRadius: 7,
                        cursor: 'pointer',
                      }}
                    >
                      <MoreHorizontal size={15} strokeWidth={1.7} />
                    </button>
                  </Cell>
                </TableRow>
              );
            })}
          </SourcesTable>
        </div>
      </motion.div>
    </PageRoot>
  );
}
