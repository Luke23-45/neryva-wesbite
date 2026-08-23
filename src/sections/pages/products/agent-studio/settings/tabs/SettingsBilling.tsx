import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
  CellMono,
  CellMeta,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { UpgradeModal } from '../../UpgradeModal/UpgradeModal';
import settings from '@neryva_data/products/agent_studio/settings.json';

export function SettingsBilling() {
  const b = settings.billing;
  const msgPct = (b.messagesUsed / b.messagesLimit) * 100;
  const storagePct = (b.storageUsedGb / b.storageLimitGb) * 100;

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <Panel
          title="Current plan"
          subtitle={`Renews on ${b.renewal}`}
          action={<UpgradeModal />}
        >
          <PlanCard>
            <PlanName>{b.plan}</PlanName>
            <PlanPrice>{b.price}</PlanPrice>
            <PlanStatus>
              <StatusPill tone="success">active</StatusPill>
            </PlanStatus>
          </PlanCard>

          <UsageStack>
            <div>
              <UsageRow>
                <span>Messages this month</span>
                <UsageValue>
                  {b.messagesUsed.toLocaleString()} / {b.messagesLimit.toLocaleString()}
                </UsageValue>
              </UsageRow>
              <ProgressBar value={msgPct} tone={msgPct > 85 ? 'amber' : 'azure'} />
            </div>
            <div>
              <UsageRow>
                <span>Knowledge storage</span>
                <UsageValue>
                  {b.storageUsedGb.toFixed(1)} GB / {b.storageLimitGb} GB
                </UsageValue>
              </UsageRow>
              <ProgressBar value={storagePct} tone="emerald" />
            </div>
          </UsageStack>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Invoices" subtitle="Past invoices available as PDF" flush>
          <DataTable>
            <DataHead>
              <DataCell $w="34%">Invoice</DataCell>
              <DataCell $w="34%">Period</DataCell>
              <DataCell $w="18%" $align="right">Amount</DataCell>
              <DataCell $w="14%" />
            </DataHead>
            {b.invoices.map((inv) => (
              <DataRow key={inv.id} $interactive={false}>
                <DataCell $w="34%">
                  <CellMono>{inv.id}</CellMono>
                </DataCell>
                <DataCell $w="34%">
                  <CellMeta>{inv.period}</CellMeta>
                </DataCell>
                <DataCell $w="18%" $align="right">
                  <CellMono>{inv.amount}</CellMono>
                </DataCell>
                <DataCell $w="14%">
                  <InvoiceActions>
                    <StatusPill tone="success" dot={false}>
                      {inv.status}
                    </StatusPill>
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      onClick={() => toast.success(`Downloading ${inv.id}.pdf`)}
                    >
                      <Download size={11} strokeWidth={1.8} /> PDF
                    </ActionButton>
                  </InvoiceActions>
                </DataCell>
              </DataRow>
            ))}
          </DataTable>
        </Panel>
      </motion.div>
    </>
  );
}

// ─── styled ──────────────────────────────────────────────────────────
const PlanCard = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  margin-bottom: 18px;
`;

const PlanName = styled.div`
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.015em;
  color: ${({ theme }) => theme.app.text.primary};
`;

const PlanPrice = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  color: ${({ theme }) => theme.app.text.muted};
`;

const PlanStatus = styled.div`
  margin-left: auto;
`;

const UsageStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const UsageRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-bottom: 6px;
`;

const UsageValue = styled.span`
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.app.text.primary};
`;

const InvoiceActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;
