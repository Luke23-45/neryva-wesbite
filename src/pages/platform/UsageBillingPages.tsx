/**
 * /platform/usage + /platform/billing — the engine's metering rollups and
 * billing ledgers. v1 renders the engine payload's KPI entries generically
 * (the shapes are the engine's rollup/ledger contracts); charts land with
 * the studio analytics port.
 */
import styled from 'styled-components';
import { useUsageOverview, useUsageRollup, useLedgers, useInvoices } from '@hooks/engine/queries';
import { Panel } from '@components/common/ui/Panel/Panel';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, KpiGrid, SectionTitle } from '@components/common/ui/ViewLayout';

function kpiEntries(payload: Record<string, unknown>): Array<{ label: string; value: string }> {
  const entries: Array<{ label: string; value: string }> = [];
  const walk = (node: Record<string, unknown>, prefix = '') => {
    for (const [key, value] of Object.entries(node)) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        walk(value as Record<string, unknown>, `${prefix}${key}.`);
      } else if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
        entries.push({ label: `${prefix}${key}`, value: String(value) });
      }
    }
  };
  walk(payload);
  return entries.slice(0, 12);
}

const Kpi = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.02);
`;

const KpiLabel = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.55;
  margin-bottom: 6px;
  word-break: break-all;
`;

const KpiValue = styled.div`
  font-size: 20px;
  font-weight: 700;
`;

export function UsagePage() {
  const overview = useUsageOverview();
  const rollup = useUsageRollup();
  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>Usage</ViewTitle>
        <ViewSubtitle>Consumption across products and projects for this organization.</ViewSubtitle>
      </ViewHeader>
      <QueryView query={overview} skeleton={<Skeleton $h="140px" $r="12px" />}>
        {(data) => (
          <KpiGrid>
            {kpiEntries(data).map((kpi) => (
              <Kpi key={kpi.label}>
                <KpiLabel>{kpi.label}</KpiLabel>
                <KpiValue>{kpi.value}</KpiValue>
              </Kpi>
            ))}
          </KpiGrid>
        )}
      </QueryView>
      <SectionTitle>Rollup</SectionTitle>
      <Panel flush>
        <QueryView query={rollup} skeleton={<div style={{ padding: 20 }}><Skeleton $h="120px" /></div>}>
          {(data) => (
            <pre style={{ margin: 0, padding: 18, fontSize: 12, overflowX: 'auto', opacity: 0.85 }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </QueryView>
      </Panel>
    </ViewShell>
  );
}

export function BillingPage() {
  const ledgers = useLedgers();
  const invoices = useInvoices();
  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>Billing</ViewTitle>
        <ViewSubtitle>Per-product ledgers and invoices — separate by design (one plane, per-product money).</ViewSubtitle>
      </ViewHeader>
      <SectionTitle>Ledgers</SectionTitle>
      <Panel flush>
        <QueryView query={ledgers} skeleton={<div style={{ padding: 20 }}><Skeleton $h="160px" /></div>} isEmpty={(d) => Object.keys(d).length === 0} empty={{ title: 'No spend yet', description: 'Ledgers fill as metered usage flows through the engine ingest.' }}>
          {(data) => (
            <pre style={{ margin: 0, padding: 18, fontSize: 12, overflowX: 'auto', opacity: 0.85 }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </QueryView>
      </Panel>
      <SectionTitle>Invoices</SectionTitle>
      <Panel flush>
        <QueryView query={invoices} isEmpty={(d) => (d.invoices ?? []).length === 0} empty={{ title: 'No invoices', description: 'Invoices appear once a billing period closes.' }}>
          {(data) => (
            <pre style={{ margin: 0, padding: 18, fontSize: 12, overflowX: 'auto', opacity: 0.85 }}>
              {JSON.stringify(data.invoices, null, 2)}
            </pre>
          )}
        </QueryView>
      </Panel>
    </ViewShell>
  );
}
