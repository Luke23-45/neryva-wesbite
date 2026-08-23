import { motion } from 'framer-motion';
import { Gauge, Layers } from 'lucide-react';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, SectionTitle, KpiGrid } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import usage from '@neryva_data/products/agent_studio/usage.json';
import {
  KpiCard,
  KpiLabel,
  KpiValue,
  KpiMeta,
  MeterTrack,
  MeterFill,
  ChartCard,
  ChartHead,
  ChartTitle,
  ChartLegend,
  ChartBars,
  BarWrap,
  Bar,
  BarLabel,
  BreakdownGrid,
  BreakdownCard,
  BreakdownTitle,
  BreakdownItem,
  ItemTop,
  ItemName,
  ItemValue,
  ItemBar,
  ItemFill,
  ToneDot,
  QuotaGrid,
  QuotaCard,
  QuotaTop,
  QuotaName,
  QuotaRenew,
  QuotaBottom,
} from './UsageView.styles';

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function formatNumber(n: number) {
  return n.toLocaleString();
}

export function UsageView() {
  const dailyMax = Math.max(...usage.daily.map((d) => d.tokens));

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Usage</ViewTitle>
        <ViewSubtitle>
          Token consumption, costs, and quota limits across all agents and models in the workspace.
        </ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <KpiGrid>
          <KpiCard>
            <KpiLabel>Tokens (month)</KpiLabel>
            <KpiValue>{formatTokens(usage.summary.tokensThisMonth)}</KpiValue>
            <KpiMeta>
              {(((usage.summary.tokensThisMonth - usage.summary.tokensLastMonth) /
                usage.summary.tokensLastMonth) *
                100).toFixed(1)}
              % vs last month
            </KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Cost (month)</KpiLabel>
            <KpiValue>${usage.summary.costThisMonth.toLocaleString()}</KpiValue>
            <KpiMeta>USD, ex-VAT</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Quota used</KpiLabel>
            <KpiValue $tone={usage.summary.quotaUsed > 80 ? 'warning' : undefined}>
              {usage.summary.quotaUsed}%
            </KpiValue>
            <KpiMeta>renews {usage.summary.renewsIn}</KpiMeta>
            <MeterTrack>
              <MeterFill
                $pct={usage.summary.quotaUsed}
                $tone={usage.summary.quotaUsed > 80 ? 'warning' : undefined}
              />
            </MeterTrack>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Models active</KpiLabel>
            <KpiValue>{usage.byModel.length}</KpiValue>
            <KpiMeta>across {new Set(usage.byModel.map((m) => m.provider)).size} providers</KpiMeta>
          </KpiCard>
        </KpiGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <ChartCard>
          <ChartHead>
            <ChartTitle>Daily token consumption (last 14 days)</ChartTitle>
            <ChartLegend>
              <span>peak {formatTokens(dailyMax)}M</span>
            </ChartLegend>
          </ChartHead>
          <ChartBars
            $n={usage.daily.length}
            role="img"
            aria-label="Daily token consumption bar chart, last 14 days"
          >
            {usage.daily.map((d) => {
              const h = (d.tokens / dailyMax) * 100;
              return (
                <BarWrap key={d.date}>
                  <Bar
                    $h={h}
                    title={`${d.date} · ${d.tokens}M tokens · $${d.cost}`}
                    aria-label={`${d.date}: ${d.tokens}M tokens, $${d.cost}`}
                  />
                  <BarLabel aria-hidden="true">{d.date.replace('Jul ', '')}</BarLabel>
                </BarWrap>
              );
            })}
          </ChartBars>
        </ChartCard>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
        <SectionTitle>
          <Layers size={14} strokeWidth={1.7} />
          Breakdown
        </SectionTitle>
        <BreakdownGrid>
          <BreakdownCard>
            <BreakdownTitle>By model</BreakdownTitle>
            {usage.byModel.map((m) => (
              <BreakdownItem key={m.id}>
                <ItemTop>
                  <ItemName>
                    <ToneDot $tone={m.tone} aria-hidden="true" />
                    {m.model}
                  </ItemName>
                  <ItemValue>
                    {formatTokens(m.tokens)} · ${m.cost.toLocaleString()}
                  </ItemValue>
                </ItemTop>
                <ItemBar>
                  <ItemFill $pct={m.share} $tone={m.tone} />
                </ItemBar>
              </BreakdownItem>
            ))}
          </BreakdownCard>

          <BreakdownCard>
            <BreakdownTitle>By agent</BreakdownTitle>
            {usage.byAgent.map((a) => (
              <BreakdownItem key={a.id}>
                <ItemTop>
                  <ItemName>{a.name}</ItemName>
                  <ItemValue>
                    {formatTokens(a.tokens)} · ${a.cost.toLocaleString()}
                  </ItemValue>
                </ItemTop>
                <ItemBar>
                  <ItemFill $pct={a.share} />
                </ItemBar>
              </BreakdownItem>
            ))}
          </BreakdownCard>
        </BreakdownGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>
        <SectionTitle>
          <Gauge size={14} strokeWidth={1.7} />
          Quotas & limits
        </SectionTitle>
        <QuotaGrid>
          {usage.quotas.map((q, i) => {
            const pct = Math.min(100, (q.used / q.limit) * 100);
            return (
              <QuotaCard
                key={q.id}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={pageItem}
                custom={i + 5}
              >
                <QuotaTop>
                  <QuotaName>{q.name}</QuotaName>
                  <QuotaRenew>{q.renews}</QuotaRenew>
                </QuotaTop>
                <MeterTrack $flush>
                  <MeterFill $pct={pct} $tone={q.tone} />
                </MeterTrack>
                <QuotaBottom>
                  <span>
                    {formatNumber(q.used)} / {formatNumber(q.limit)}
                  </span>
                  <span>{pct.toFixed(1)}%</span>
                </QuotaBottom>
              </QuotaCard>
            );
          })}
        </QuotaGrid>
      </motion.div>
    </ViewShell>
  );
}
