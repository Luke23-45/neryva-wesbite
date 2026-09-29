import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView, ErrorState } from '@components/common/ui/AsyncStates';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { UsageExplorer } from '@components/platform/UsageExplorer';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, SectionTitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import { useOrgLimits, parseQuotaStatus } from '@hooks/engine/queries';
import { useCan } from '@lib/engine/capabilities';

/**
 * Usage (ledger B-1) — the real metering story for this workspace: the
 * shared UsageExplorer (overview KPIs, daily series, range + product
 * filters, CSV export) preset to Agent Studio, plus live quota meters from
 * the org's plan limits. The static report and its double-unit peak label
 * are gone.
 */
export function UsageView() {
  const limits = useOrgLimits();
  const can = useCan('agent_studio');
  // P2-3 (US-09): the explorer's overview/series/export endpoints are
  // owner/admin/billing only — developer/reader got 403 error states while
  // the quota meters (developer-readable via `/limits`) loaded fine. Gate
  // the explorer on the capability; the meters below keep their own
  // per-role behavior (reader 403s on `/limits` and sees the query error).
  const canViewUsage = can('billing:view');
  // P2-5 (US-07): the engine returns entitlement_state/allowed/reason
  // alongside the meters — surface the over-quota and read-only plan
  // states instead of dropping them.
  const status = parseQuotaStatus(limits.data, 'agent_studio');
  const meters = status.meters;
  const signal = status.signal;
  const overMeters = meters.filter((m) => m.limit !== null && m.used > m.limit);
  const planState = signal.entitlementState;
  const planReadOnly = planState === 'past_due' || planState === 'suspended';
  const planInactive = planState === 'none' || planState === 'expired';

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Usage</ViewTitle>
        <ViewSubtitle>Tokens, cost, and quota for your agents — metered by the engine on every run.</ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        {canViewUsage ? (
          <UsageExplorer defaultProduct="agent_studio" />
        ) : (
          <Panel>
            <ErrorState
              title="Usage explorer needs the billing role"
              message="Metered usage and exports are a finance surface — your role doesn't include billing visibility. Owners, admins, and billing managers can view them."
            />
          </Panel>
        )}
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <SectionTitle>Quotas & limits</SectionTitle>
        {signal.overQuota && (
          <QuotaAlert role="alert" $tone="error">
            Over quota —{' '}
            {overMeters
              .map((m) => `${m.label} ${m.used.toLocaleString()} / ${m.limit!.toLocaleString()}`)
              .join('; ')}
            . New runs are refused until the counters reset or the plan changes.
          </QuotaAlert>
        )}
        {planReadOnly && (
          <QuotaAlert role="status" $tone="warn">
            Plan is {planState!.replace('_', ' ')} — the workspace is read-only until billing is settled.
          </QuotaAlert>
        )}
        {planInactive && (
          <QuotaAlert role="status" $tone="warn">
            No active plan — quota limits apply once this organization carries an active plan.
          </QuotaAlert>
        )}
        {meters.length > 0 ? (
          <Panel>
            <QueryView query={limits} skeleton={<Skeleton $h="100px" $r="12px" />}>
              {() => (
                <MeterList>
                  {meters.map((meter) => {
                    const pct = meter.limit !== null && meter.limit > 0 ? (meter.used / meter.limit) * 100 : 0;
                    const over = meter.limit !== null && meter.used > meter.limit;
                    return (
                      <div key={meter.label}>
                        <MeterRow>
                          <span>
                            {meter.label}
                            {over && <OverTag>over quota</OverTag>}
                          </span>
                          <MeterValue>
                            {meter.used.toLocaleString()}
                            {meter.limit !== null ? ` / ${meter.limit.toLocaleString()}` : ' (no cap)'}
                          </MeterValue>
                        </MeterRow>
                        <ProgressBar value={pct} tone={over ? 'rose' : pct > 80 ? 'amber' : 'azure'} />
                      </div>
                    );
                  })}
                </MeterList>
              )}
            </QueryView>
          </Panel>
        ) : limits.isError ? (
          <Panel>
            <QueryView query={limits} skeleton={<Skeleton $h="100px" $r="12px" />}>
              {() => null}
            </QueryView>
          </Panel>
        ) : (
          <Panel>
            <p>No quota snapshot yet — limits appear once this organization carries an active plan.</p>
          </Panel>
        )}
      </motion.div>
    </ViewShell>
  );
}

const MeterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const MeterRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  margin-bottom: 6px;
  text-transform: capitalize;
`;

const MeterValue = styled.span`
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.app.text.primary};
`;

/**
 * P2-5 — over-quota / plan-state signals the parser used to drop. Colors
 * follow the theme tokens; no new palette invented.
 */
const QuotaAlert = styled.div<{ $tone: 'error' | 'warn' }>`
  border: 1px solid
    ${({ theme, $tone }) => ($tone === 'error' ? 'rgba(244, 63, 94, 0.45)' : theme.app.border.strong)};
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 12px;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme, $tone }) => ($tone === 'error' ? '#fda4af' : theme.app.text.secondary)};
  background: ${({ theme }) => theme.app.surface.subtle};
`;

const OverTag = styled.span`
  display: inline-block;
  margin-left: 8px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #fda4af;
  border: 1px solid rgba(244, 63, 94, 0.45);
  vertical-align: 1px;
`;
