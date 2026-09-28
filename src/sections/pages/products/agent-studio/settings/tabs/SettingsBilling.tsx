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
import { useEnterpriseStatus } from '@hooks/engine/billing';
import { useCreditWallet } from '@hooks/engine/credits';
import { UpgradeModal } from '../../UpgradeModal';
import { deriveSubscriptionKind, SUBSCRIPTION_COPY, type SubscriptionKind } from './subscriptionKind';

/**
 * Settings → Billing — the live summary (ledger D-3: summary + deep-link;
 * the full ledger plane lives at /platform/billing).
 *
 * D-1 update (2026-09-28, explicit user direction): the CURRENT subscription
 * is shown here, derived from real entitlement data (enterprise commitment
 * boolean, the engine's single 'payg' plan identifier, else the free monthly
 * grant). The pricing sheet (UpgradeModal) owns how plans and prices display;
 * this section never invents tiers or prices.
 * PDF downloads are ⛔ E-13 — no fake download buttons.
 * BUG-2: the fabricated UpgradeModal plan picker (invented tiers/prices,
 * dead "Continue" CTA) was removed — purchase UI is out of scope per user
 * direction (Google-tied purchase; no Stripe in the console).
 */

function stateTone(state: string): 'success' | 'warning' | 'error' | 'neutral' {
  // Trials are not offered: an engine-reported trial state grants full access
  // and is displayed as active.
  const display = state === 'trial' ? 'active' : state;
  if (display === 'active') return 'success';
  if (display === 'past_due') return 'warning';
  if (display === 'suspended') return 'error';
  return 'neutral';
}

function displayStatus(status: string): string {
  return status === 'trial' ? 'active' : status.replace('_', ' ');
}

export function SettingsBilling() {
  const entitlements = useEntitlements();
  const row: EntitlementRow | undefined = entitlements.data?.entitlements.find((e) => e.product === 'agent_studio');
  const limits = useOrgLimits();
  const meters = parseQuotaMeters(limits.data, 'agent_studio');
  const enterprise = useEnterpriseStatus();
  const wallet = useCreditWallet();

  const subLoading = entitlements.isPending || enterprise.isPending;
  const subError = entitlements.isError || enterprise.isError;
  const kind: SubscriptionKind | null = subLoading || subError
    ? null
    : deriveSubscriptionKind({ enterprise: enterprise.data === true, plan: row?.plan ?? null });
  const copy = kind ? SUBSCRIPTION_COPY[kind] : null;

  return (
    <>
      {/* Subscriptions — the deep-link target for locked models in the
          builder (id="subscriptions"). Current state only, from real
          entitlement data; the UpgradeModal action owns pricing display. */}
      <motion.div id="subscriptions" initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <Panel
          title="Subscriptions"
          subtitle="Your current plan, from your live entitlement."
          action={<UpgradeModal />}
        >
          <PlanCard>
            <PlanName>{copy ? copy.name : 'Subscription'}</PlanName>
            <PlanStatus>
              {subLoading ? (
                <Skeleton $h="22px" $w="92px" $r="999px" />
              ) : subError || !copy ? (
                <StatusPill tone="error" dot={false}>couldn’t load</StatusPill>
              ) : (
                <StatusPill tone={kind === 'free' ? 'neutral' : 'success'} dot={false}>
                  {copy.name}
                </StatusPill>
              )}
            </PlanStatus>
          </PlanCard>

          {copy && <SubscriptionNote>{copy.blurb}</SubscriptionNote>}

          {/* BUG-4 posture: the balance is real wallet data — loading
              skeleton, plain error note, never a guessed number. */}
          {wallet.isPending ? (
            <Skeleton $h="20px" $w="220px" $r="6px" />
          ) : wallet.isError || !wallet.data ? (
            <QuotaNote>Credit balance couldn’t be loaded — try refreshing.</QuotaNote>
          ) : (
            <UsageRow>
              <span>Available credit balance</span>
              <UsageValue>{wallet.data.available.toLocaleString()} credits</UsageValue>
            </UsageRow>
          )}
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel
          title="Agent Studio"
          subtitle={periodSubtitle(row)}
        >
          <PlanCard>
            <PlanName>Entitlement</PlanName>
            <PlanStatus>
              {row ? (
                <StatusPill tone={stateTone(row.status)} dot={false}>
                  {displayStatus(row.status)}
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

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
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

function periodSubtitle(row: EntitlementRow | undefined): string {
  if (!row) {
    return 'Enable Agent Studio for this organization from the console.';
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

const SubscriptionNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.5;
  margin: -8px 0 14px;
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
