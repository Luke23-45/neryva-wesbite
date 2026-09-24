/**
 * The usage explorer (ledger B-1) — real metering data over the engine's
 * overview/series endpoints: KPI grid, daily series chart, product and
 * range filters (URL-synced), CSV export. Shared verbatim by
 * /platform/usage and the studio Usage page (no fork).
 *
 * Series/KPI shapes are parsed defensively (`parseOverviewKpis`,
 * `parseSeries`) — the wire contract gets pinned against the live engine
 * at integration without the UI crashing on surprises.
 */
import styled from 'styled-components';
import { Download } from 'lucide-react';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { ActionButton } from '@components/common/ui/ActionButton';
import { Segmented } from '@components/common/ui/Segmented';
import { QueryView, ErrorState } from '@components/common/ui/AsyncStates';
import { StudioAreaChart } from '@components/common/ui/StudioAreaChart';
import { engineDownload } from '@lib/engine/client';
import { useOrg } from '@/Context/OrgContext';
import {
  parseOverviewKpis,
  parseSeries,
  rangeDates,
  useUsageOverview,
  useUsageSeries,
  type UsageRange,
} from '@hooks/engine/usage';
import { useUrlSearchParams, useUrlState } from '@lib/useUrlState';

const SERIES_COLORS = ['#8b8ff8', '#05e3a4', '#f5b942'];

const RANGE_OPTIONS: { value: '7d' | '30d' | '90d'; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

const PRODUCT_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All products' },
  { value: 'agent_studio', label: 'Agent Studio' },
  { value: 'deployment', label: 'Deployment' },
];

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px;
  margin: 18px 0 22px;
`;

const KpiCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  padding: 13px 15px;
  background: ${({ theme }) => theme.app.surface.subtle};
`;

const KpiLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  text-transform: capitalize;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.app.text.muted};
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const KpiValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.app.text.primary};
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const Spacer = styled.div`
  flex: 1;
`;

const ProductSelect = styled.select`
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 8px;
  padding: 7px 10px;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }

  option {
    background: #14151c;
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

const ChartWrap = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 12px;
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 14px;
`;

const EmptyChart = styled.div`
  padding: 44px 16px;
  text-align: center;
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.faint};
`;

const LegendRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-bottom: 10px;
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  text-transform: capitalize;
`;

const LegendSwatch = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 3px;
  background: ${({ $color }) => $color};
  flex: none;
`;

export function UsageExplorer({ defaultProduct = 'all' }: { defaultProduct?: string }) {
  const { orgId } = useOrg();
  // URL-synced filters (F-9) — shareable views, back/forward friendly.
  const params = useUrlSearchParams();
  const [, setProductParam] = useUrlState('product', { default: 'all' });
  const [range, setRange] = useUrlState('range', { default: '30d' });

  const product = params.product ?? defaultProduct;
  const rangeValue = (range === '7d' || range === '90d' ? range : '30d') as '7d' | '30d' | '90d';
  const dates: UsageRange = rangeDates(rangeValue);
  const scopedProduct = product === 'all' ? undefined : product;

  const overview = useUsageOverview(scopedProduct, dates);
  const series = useUsageSeries(product === 'all' ? 'agent_studio' : product, dates);
  const kpis = parseOverviewKpis(overview.data);
  const chart = parseSeries(series.data);
  // One source of truth for the chart's series — the legend below renders
  // from the same definitions so a near-zero line (e.g. cost on an
  // events-scale axis) is still identifiable (P6-US-26).
  const seriesDefs = chart.valueKeys.map((key, i) => ({
    dataKey: key,
    name: key.replace(/_/g, ' '),
    color: SERIES_COLORS[i % SERIES_COLORS.length],
    gradientId: `usage-grad-${key}`,
  }));

  const setProduct = (next: string) => {
    setProductParam(next === 'all' ? '' : next);
  };

  const exportCsv = () => {
    if (!orgId) return;
    void engineDownload(`/console/billing/org/${orgId}/usage/export`, {
      ...(scopedProduct ? { product: scopedProduct } : {}),
      ...dates,
    }).catch(() => undefined);
  };

  return (
    <div>
      <Toolbar>
        <ProductSelect
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          aria-label="Product filter"
        >
          {PRODUCT_OPTIONS.filter((o) => o.value !== 'all' || defaultProduct === 'all').map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </ProductSelect>
        <Segmented options={RANGE_OPTIONS} value={rangeValue} onChange={setRange} ariaLabel="Usage range" />
        <Spacer />
        <ActionButton variant="secondary" size="sm" onClick={exportCsv}>
          <Download size={13} strokeWidth={1.8} />
          Export NDJSON
        </ActionButton>
      </Toolbar>

      <QueryView query={overview} skeleton={<Skeleton $h="120px" $r="12px" />}>
        {(data) => (
          <KpiGrid>
            {(kpis.length > 0 ? kpis : parseOverviewKpis(data)).map((kpi) => (
              <KpiCard key={kpi.key}>
                <KpiLabel>{kpi.label}</KpiLabel>
                <KpiValue>{kpi.value}</KpiValue>
              </KpiCard>
            ))}
          </KpiGrid>
        )}
      </QueryView>

      <ChartWrap>
        {product === 'all' && (
          <p style={{ fontSize: '12px', opacity: 0.7, margin: '0 0 8px' }}>
            Chart shows Agent Studio only — the series endpoint is per-product. KPIs above are per-product slices, not cross-product totals.
          </p>
        )}
        {chart.valueKeys.length > 0 && chart.points.length > 0 ? (
          <>
            <LegendRow aria-label="Chart series">
              {seriesDefs.map((s) => (
                <LegendItem key={s.dataKey}>
                  <LegendSwatch $color={s.color} />
                  {s.name}
                </LegendItem>
              ))}
            </LegendRow>
            <StudioAreaChart
              data={chart.points}
              series={seriesDefs}
              height={260}
            />
          </>
        ) : series.isPending ? (
          <Skeleton $h="220px" $r="10px" />
        ) : series.isError ? (
          <ErrorState
            title="Couldn’t load the usage chart"
            message={(series.error as Error).message}
            onRetry={() => void series.refetch()}
          />
        ) : (
          <EmptyChart>No usage recorded in this period yet — charts fill as metered events flow through the engine.</EmptyChart>
        )}
      </ChartWrap>
    </div>
  );
}
