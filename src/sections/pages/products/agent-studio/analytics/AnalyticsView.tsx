import { motion } from 'framer-motion';
import { Panel } from '@components/common/ui/Panel';
import { MetricCard } from '@components/common/ui/MetricCard';
import { Sparkline } from '@components/common/ui/Sparkline';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { StatusPill } from '@components/common/ui/StatusPill';
import { StudioAreaChart } from '@components/common/ui/StudioAreaChart';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, KpiGrid } from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
  CellPrimary,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import analytics from '@neryva_data/products/agent_studio/analytics.json';
import {
  TwoColumn,
  ChartWrap,
  DonutGrid,
  Donut,
  DonutCenter,
  DonutValue,
  DonutLabel,
  Legend,
  LegendRow,
  LegendSwatch,
  LegendName,
  LegendValue,
  Metric,
  TrendBadge,
  ResolutionCell,
  ResolutionBar,
  EmptyValue,
  RegionGrid,
  RegionCard,
  RegionTop,
  RegionName,
  RegionShare,
} from './AnalyticsView.styles';

// Build SVG arcs for a donut chart
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function arcPath(cx: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number) {
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  const sOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const eOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const sInner = polarToCartesian(cx, cy, rInner, endAngle);
  const eInner = polarToCartesian(cx, cy, rInner, startAngle);
  return [
    `M ${sOuter.x} ${sOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${eOuter.x} ${eOuter.y}`,
    `L ${sInner.x} ${sInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${eInner.x} ${eInner.y}`,
    'Z',
  ].join(' ');
}

function DonutSvg({ data }: { data: { name: string; value: number; color: string }[] }) {
  const cx = 100;
  const cy = 100;
  const rOuter = 90;
  const rInner = 60;
  let angle = 0;
  const arcs = data.map((d) => {
    const sweep = (d.value / 100) * 360;
    const path = arcPath(cx, cy, rOuter, rInner, angle, angle + sweep - 2);
    angle += sweep;
    return { d: path, color: d.color, key: d.name };
  });
  return (
    <svg viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="Conversations by channel">
      {arcs.map((a) => (
        <path key={a.key} d={a.d} fill={a.color} />
      ))}
    </svg>
  );
}

export function AnalyticsView() {
  const totalConvs = analytics.summary.totalConversations;
  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Analytics</ViewTitle>
        <ViewSubtitle>
          Deep dive into agent performance, conversation channels, and regional usage.
        </ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <KpiGrid>
          <MetricCard
            label="Conversations"
            value={totalConvs.toLocaleString()}
            delta={{ value: '+8.4%', positive: true }}
            footnote="last 30 days"
            spark={<Sparkline data={[8200, 8400, 8500, 8700, 8900, 9000, 9100, 9300, 9500, 9700, 9900, 10200, 10500, 10800, 11200, 11500, 11800, 12000, 12200, 12500, 12800]} color="#c084fc" />}
          />
          <MetricCard
            label="Messages"
            value={analytics.summary.totalMessages.toLocaleString()}
            delta={{ value: '+12%', positive: true }}
            footnote="last 30 days"
            spark={<Sparkline data={[44000, 45000, 47000, 49000, 52000, 54000, 56000, 58000, 61000, 63000, 65000, 68000, 70000, 72000, 74000, 76000, 78000, 80000, 81000, 82000]} color="#60a5fa" />}
          />
          <MetricCard
            label="Resolution rate"
            value={`${analytics.summary.resolutionRate}%`}
            delta={{ value: '+1.6pt', positive: true }}
            footnote="last 30 days"
            spark={<Sparkline data={[88, 89, 90, 91, 90, 91, 92, 92, 92, 93, 92, 93, 93, 92, 93, 92, 93, 93, 93, 92.7]} color="#05e3a4" />}
          />
          <MetricCard
            label="Avg duration"
            value={analytics.summary.avgDuration}
            delta={{ value: '-12s', positive: true }}
            footnote="per conversation"
            spark={<Sparkline data={[3.8, 3.7, 3.6, 3.6, 3.5, 3.5, 3.4, 3.4, 3.3, 3.3, 3.4, 3.3, 3.3, 3.3, 3.4, 3.3, 3.4, 3.4, 3.4, 3.4]} color="#fbbf24" />}
          />
        </KpiGrid>
      </motion.div>

      <TwoColumn>
        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={5}>
          <Panel title="Conversations & messages" subtitle="Last 7 days · daily totals">
            <ChartWrap>
              <StudioAreaChart
                data={analytics.byDay}
                series={[
                  { dataKey: 'conversations', name: 'Conversations', color: '#c084fc', gradientId: 'analytics-conv' },
                  { dataKey: 'messages', name: 'Messages', color: '#60a5fa', gradientId: 'analytics-msg' },
                ]}
                height={280}
                yFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
              />
            </ChartWrap>
          </Panel>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={pageItem} custom={6}>
          <Panel title="Channel distribution" subtitle="Share of conversations by source">
            <DonutGrid>
              <Donut>
                <DonutSvg data={analytics.byChannel} />
                <DonutCenter>
                  <DonutValue>{totalConvs.toLocaleString()}</DonutValue>
                  <DonutLabel>total</DonutLabel>
                </DonutCenter>
              </Donut>
              <Legend>
                {analytics.byChannel.map((c) => (
                  <LegendRow key={c.name}>
                    <LegendSwatch $color={c.color} />
                    <LegendName>{c.name}</LegendName>
                    <LegendValue>{c.value}%</LegendValue>
                  </LegendRow>
                ))}
              </Legend>
            </DonutGrid>
          </Panel>
        </motion.div>
      </TwoColumn>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={7}>
        <Panel
          title="Top agents"
          subtitle="Performance and customer satisfaction by agent"
          flush
        >
          <DataTable>
            <DataHead>
              <DataCell $w="32%">Agent</DataCell>
              <DataCell $w="20%" $align="right">Conversations</DataCell>
              <DataCell $w="16%" $align="right">Resolution</DataCell>
              <DataCell $w="16%" $align="right">CSAT</DataCell>
              <DataCell $w="16%" $align="right">Trend</DataCell>
            </DataHead>
            {analytics.topAgents.map((a, i) => (
              <DataRow
                key={a.name}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={pageItem}
                custom={i + 8}
                $interactive={false}
              >
                <DataCell $w="32%">
                  <CellPrimary>{a.name}</CellPrimary>
                </DataCell>
                <DataCell $w="20%" $align="right">
                  <Metric>{a.conversations > 0 ? a.conversations.toLocaleString() : '—'}</Metric>
                </DataCell>
                <DataCell $w="16%" $align="right">
                  {a.resolution > 0 ? (
                    <ResolutionCell>
                      <ResolutionBar>
                        <ProgressBar value={a.resolution} tone={a.resolution >= 90 ? 'emerald' : 'azure'} />
                      </ResolutionBar>
                      <Metric>{a.resolution}%</Metric>
                    </ResolutionCell>
                  ) : (
                    <EmptyValue>—</EmptyValue>
                  )}
                </DataCell>
                <DataCell $w="16%" $align="right">
                  <Metric>{a.satisfaction > 0 ? `${a.satisfaction.toFixed(1)} / 5` : '—'}</Metric>
                </DataCell>
                <DataCell $w="16%" $align="right">
                  {a.trend !== 0 ? (
                    <TrendBadge $positive={a.trend > 0}>
                      {a.trend > 0 ? '+' : ''}
                      {a.trend}%
                    </TrendBadge>
                  ) : (
                    <EmptyValue>—</EmptyValue>
                  )}
                </DataCell>
              </DataRow>
            ))}
          </DataTable>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={14}>
        <Panel title="Regional breakdown" subtitle="Conversation share by region — last 30 days">
          <RegionGrid>
            {analytics.byRegion.map((r, i) => (
              <RegionCard
                key={r.region}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={pageItem}
                custom={i + 15}
              >
                <RegionTop>
                  <RegionName>{r.region}</RegionName>
                  <StatusPill tone="azure" dot={false}>
                    {r.share}%
                  </StatusPill>
                </RegionTop>
                <ProgressBar value={r.share} tone="lilac" />
                <RegionShare>{r.conversations.toLocaleString()} conversations</RegionShare>
              </RegionCard>
            ))}
          </RegionGrid>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
