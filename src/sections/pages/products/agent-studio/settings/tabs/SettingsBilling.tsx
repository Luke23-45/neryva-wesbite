import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
  CellMono,
  CellMeta,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { useEntitlements, useInvoices, useOrgLimits, parseQuotaMeters, type EntitlementRow } from '@hooks/engine/queries';

/**
 * Settings → Billing — the live summary (ledger D-3: summary + deep-link;
 * the full ledger plane lives at /platform/billing).
 *
 * D-1 boundary: plan names and prices are NOT rendered here — the
 * entitlement state, period, quota meters, and invoices are real; how
 * plans display is a deferred decision owned by the upgrade surfaces.
 * PDF downloads are ⛔ E-13 — no fake download buttons.
 * BUG-2: the fabricated UpgradeModal plan picker (invented tiers/prices,
 * dead "Continue" CTA) was removed — purchase UI is out of scope per user
 * direction (Google-tied purchase; no Stripe in the console).
 */

function stateTone(state: string): 'success' | 'azure' | 'warning' | 'error' | 'neutral' {
  if (state === 'active') return 'success';
  if (state === 'trial') return 'azure';
  if (state === 'past_due') return 'warning';
  if (state === 'suspended') return 'error';
  return 'neutral';
}

export function SettingsBilling() {
  const entitlements = useEntitlements();
  const row: EntitlementRow | undefined = entitlements.data?.entitlements.find((e) => e.product === 'agent_studio');
  const limits = useOrgLimits();
  const meters = parseQuotaMeters(limits.data, 'agent_studio');

  const daysLeft = row?.msRemaining ? Math.ceil(row.msRemaining / 86_400_000) : null;

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <Panel
          title="Agent Studio"
          subtitle={periodSubtitle(row, daysLeft)}
        >
          <PlanCard>
            <PlanName>Entitlement</PlanName>
            <PlanStatus>
              {row ? (
                <StatusPill tone={stateTone(row.status)} dot={false}>
                  {row.status.replace('_', ' ')}
                </StatusPill>
              ) : entitlements.isPending ? (
                <Skeleton $h="22px" $w="92px" $r="999px" />
              ) : entitlements.isError ? (
                // BUG-4: a fetch failure is not "not enabled" — say so plainly.
                <StatusPill tone="error" dot={false}>couldn’t load</StatusPill>
              ) : (
                <StatusPill tone="neutral" dot={false}>not enabled</StatusPill>
              )}
            </PlanStatus>
          </PlanCard>

          {/* BUG-4: honest quota states — loading skeleton, error note, and an
              explicit empty state (the platform surface's "No quota snapshot"
              copy) instead of silently omitting the section. */}
          {limits.isPending ? (
            <Skeleton $h="96px" $r="12px" />
          ) : limits.isError ? (
            <QuotaNote>Quota couldn’t be loaded — try refreshing.</QuotaNote>
          ) : meters.length === 0 ? (
            <QuotaNote>No quota snapshot — limits appear once this organization carries an active plan.</QuotaNote>
          ) : (
            <UsageStack>
              {meters.map((meter) => {
                const pct = meter.limit !== null && meter.limit > 0 ? (meter.used / meter.limit) * 100 : 0;
                return (
                  <div key={meter.label}>
                    <UsageRow>
                      <span>{meter.label}</span>
                      <UsageValue>
                        {meter.used.toLocaleString()}
                        {meter.limit !== null ? ` / ${meter.limit.toLocaleString()}` : ' (no cap)'}
                      </UsageValue>
                    </UsageRow>
                    {/* BUG-5: threshold unified with the platform surface (80). */}
                    <ProgressBar value={pct} tone={pct > 80 ? 'amber' : 'azure'} />
                  </div>
                );
              })}
            </UsageStack>
          )}
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel
          title="Invoices"
          subtitle="Billing periods close into invoices here."
          flush
          action={
            <InvoiceLink to="/platform/billing">
              Full ledgers & billing <ArrowRight size={12} strokeWidth={1.8} />
            </InvoiceLink>
          }
        >
          <QueryView
            query={useInvoices()}
            skeleton={<Skeleton $h="160px" $r="12px" />}
            isEmpty={(d) => (d.invoices ?? []).length === 0}
            empty={{ title: 'No invoices yet', description: 'Invoices appear once a billing period closes.' }}
          >
            {(data) => (
              <DataTable>
                <DataHead>
                  <DataCell $w="34%">Invoice</DataCell>
                  <DataCell $w="34%">Period</DataCell>
                  <DataCell $w="18%" $align="right">Amount</DataCell>
                  <DataCell $w="14%">Status</DataCell>
                </DataHead>
                {(data.invoices as Array<Record<string, unknown>>).map((inv, i) => {
                  const id = typeof inv.id === 'string' ? inv.id : typeof inv.invoice_id === 'string' ? inv.invoice_id : `invoice-${i}`;
                  const period = typeof inv.period === 'string' ? inv.period : typeof inv.created_at === 'string' ? inv.created_at.slice(0, 10) : '—';
                  const amount = typeof inv.amount === 'number' ? `$${inv.amount.toFixed(2)}` : typeof inv.amount === 'string' ? inv.amount : '—';
                  const status = typeof inv.status === 'string' ? inv.status : '—';
                  return (
                    <DataRow key={id} $interactive={false}>
                      <DataCell $w="34%">
                        <CellMono>{id}</CellMono>
                      </DataCell>
                      <DataCell $w="34%">
                        <CellMeta>{period}</CellMeta>
                      </DataCell>
                      <DataCell $w="18%" $align="right">
                        <CellMono>{amount}</CellMono>
                      </DataCell>
                      <DataCell $w="14%">
                        <StatusPill
                          tone={status === 'paid' ? 'success' : status === 'void' ? 'neutral' : 'warning'}
                          dot={false}
                        >
                          {status}
                        </StatusPill>
                      </DataCell>
                    </DataRow>
                  );
                })}
              </DataTable>
            )}
          </QueryView>
        </Panel>
      </motion.div>
    </>
  );
}

function periodSubtitle(row: EntitlementRow | undefined, daysLeft: number | null): string {
  if (!row) {
    return 'Enable Agent Studio for this organization from the console.';
  }
  if (row.status === 'trial' && daysLeft !== null) {
    return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in the trial.`;
  }
  if (row.periodEnd) {
    const at = Date.parse(row.periodEnd);
    if (!Number.isNaN(at)) {
      return `Current period ends ${new Date(at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.`;
    }
  }
  return 'Usage counts against this organization’s plan limits.';
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
  text-transform: capitalize;
`;

const UsageValue = styled.span`
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.app.text.primary};
`;

const QuotaNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
  padding: 10px 0 2px;
`;

const InvoiceLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.secondary};
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
    text-decoration: underline;
  }
`;
