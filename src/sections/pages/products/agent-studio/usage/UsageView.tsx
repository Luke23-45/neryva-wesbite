import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { UsageExplorer } from '@components/platform/UsageExplorer';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, SectionTitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import { useOrgLimits, parseQuotaMeters } from '@hooks/engine/queries';

/**
 * Usage (ledger B-1) — the real metering story for this workspace: the
 * shared UsageExplorer (overview KPIs, daily series, range + product
 * filters, CSV export) preset to Agent Studio, plus live quota meters from
 * the org's plan limits. The static report and its double-unit peak label
 * are gone.
 */
export function UsageView() {
  const limits = useOrgLimits();
  const meters = parseQuotaMeters(limits.data, 'agent_studio');

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Usage</ViewTitle>
        <ViewSubtitle>Tokens, cost, and quota for your agents — measured by the engine, not estimated.</ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <UsageExplorer defaultProduct="agent_studio" />
      </motion.div>

      {meters.length > 0 ? (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
          <SectionTitle>Quotas & limits</SectionTitle>
          <Panel>
            <QueryView query={limits} skeleton={<Skeleton $h="100px" $r="12px" />}>
              {() => (
                <MeterList>
                  {meters.map((meter) => {
                    const pct = meter.limit !== null && meter.limit > 0 ? (meter.used / meter.limit) * 100 : 0;
                    return (
                      <div key={meter.label}>
                        <MeterRow>
                          <span>{meter.label}</span>
                          <MeterValue>
                            {meter.used.toLocaleString()}
                            {meter.limit !== null ? ` / ${meter.limit.toLocaleString()}` : ' (no cap)'}
                          </MeterValue>
                        </MeterRow>
                        <ProgressBar value={pct} tone={pct > 80 ? 'amber' : 'azure'} />
                      </div>
                    );
                  })}
                </MeterList>
              )}
            </QueryView>
          </Panel>
        </motion.div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
          <SectionTitle>Quotas & limits</SectionTitle>
          <Panel>
            <p>No quota snapshot yet — limits appear once this organization carries an active plan.</p>
          </Panel>
        </motion.div>
      )}
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
