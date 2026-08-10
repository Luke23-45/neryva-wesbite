import { motion } from 'framer-motion';
import { Activity, BarChart3, Gauge, Layers, Zap } from 'lucide-react';
import usage from '@neryva_data/products/deployment/usage.json';
import {
  PageRoot,
  PageHeader,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  SectionTitle,
  KpiGrid,
  KpiCard,
  KpiLabel,
  KpiValue,
  KpiMeta,
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
  QuotaProgress,
  QuotaFill,
  RateTable,
  RateHead,
  RateRow,
  Th,
  Td,
  TonePill,
} from './UsageView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 },
  }),
};

function formatCount(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function UsageView() {
  const dailyMax = Math.max(...usage.daily.map((d) => d.requests));
  const reqDelta = (
    ((usage.summary.requestsThisMonth - usage.summary.requestsLastMonth) /
      usage.summary.requestsLastMonth) *
    100
  ).toFixed(1);

  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>Usage</PageTitle>
          <PageSubtitle>
            Request volume, compute, bandwidth, and rate limits across all deployments and regions.
          </PageSubtitle>
        </TitleBlock>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <KpiGrid>
          <KpiCard>
            <KpiLabel>Requests (month)</KpiLabel>
            <KpiValue>{formatCount(usage.summary.requestsThisMonth)}</KpiValue>
            <KpiMeta>+{reqDelta}% vs last month</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Compute hours</KpiLabel>
            <KpiValue>{usage.summary.computeHours.toLocaleString()}</KpiValue>
            <KpiMeta>GPU + CPU combined</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Bandwidth</KpiLabel>
            <KpiValue>{usage.summary.bandwidthTB} TB</KpiValue>
            <KpiMeta>egress (all regions)</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Active regions</KpiLabel>
            <KpiValue>{usage.byRegion.length}</KpiValue>
            <KpiMeta>across 4 continents</KpiMeta>
          </KpiCard>
        </KpiGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
        <ChartCard>
          <ChartHead>
            <ChartTitle>Daily request volume (last 14 days)</ChartTitle>
            <ChartLegend>
              <span>peak {dailyMax}M</span>
            </ChartLegend>
          </ChartHead>
          <ChartBars $n={usage.daily.length}>
            {usage.daily.map((d) => {
              const h = (d.requests / dailyMax) * 100;
              return (
                <BarWrap key={d.date}>
                  <Bar $h={h} title={`${d.date} · ${d.requests}M requests`} />
                  <BarLabel>{d.date.replace('Jul ', '')}</BarLabel>
                </BarWrap>
              );
            })}
          </ChartBars>
        </ChartCard>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
        <SectionTitle>
          <Layers size={14} strokeWidth={1.7} />
          Breakdown
        </SectionTitle>
        <BreakdownGrid>
          <BreakdownCard>
            <BreakdownTitle>By region</BreakdownTitle>
            {usage.byRegion.map((r) => (
              <BreakdownItem key={r.code}>
                <ItemTop>
                  <ItemName>
                    <ToneDot $tone={r.tone} />
                    {r.name} <span style={{ color: 'rgba(229, 231, 235, 0.45)', fontFamily: 'inherit', fontSize: 11 }}>· {r.code}</span>
                  </ItemName>
                  <ItemValue>{r.requests}M req</ItemValue>
                </ItemTop>
                <ItemBar>
                  <ItemFill $pct={r.share} $tone={r.tone} />
                </ItemBar>
              </BreakdownItem>
            ))}
          </BreakdownCard>

          <BreakdownCard>
            <BreakdownTitle>By deployment</BreakdownTitle>
            {usage.byDeployment.map((d) => (
              <BreakdownItem key={d.id}>
                <ItemTop>
                  <ItemName>{d.name}</ItemName>
                  <ItemValue>{d.requests}M req</ItemValue>
                </ItemTop>
                <ItemBar>
                  <ItemFill $pct={d.share} />
                </ItemBar>
              </BreakdownItem>
            ))}
          </BreakdownCard>
        </BreakdownGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
        <SectionTitle>
          <Gauge size={14} strokeWidth={1.7} />
          Quotas
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
                variants={fadeUp}
                custom={i + 5}
              >
                <QuotaTop>
                  <QuotaName>{q.name}</QuotaName>
                  <QuotaRenew>{q.renews}</QuotaRenew>
                </QuotaTop>
                <QuotaProgress>
                  <QuotaFill $pct={pct} $tone={q.tone} />
                </QuotaProgress>
                <QuotaBottom>
                  <span>
                    {q.used.toLocaleString()} / {q.limit.toLocaleString()}
                  </span>
                  <span>{pct.toFixed(1)}%</span>
                </QuotaBottom>
              </QuotaCard>
            );
          })}
        </QuotaGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={10}>
        <SectionTitle>
          <Zap size={14} strokeWidth={1.7} />
          Rate limits
        </SectionTitle>
        <RateTable>
          <RateHead>
            <Th>Endpoint</Th>
            <Th>Sustained</Th>
            <Th>Burst</Th>
            <Th>Current</Th>
          </RateHead>
          {usage.rateLimits.map((rl, i) => (
            <RateRow
              key={rl.id}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i + 11}
            >
              <Td>
                <Mono style={{ fontSize: 12.5 }}>{rl.endpoint}</Mono>
              </Td>
              <Td>{rl.limit}</Td>
              <Td>{rl.burst}</Td>
              <Td>
                <TonePill $tone={rl.tone}>{rl.current}</TonePill>
              </Td>
            </RateRow>
          ))}
        </RateTable>
      </motion.div>
    </PageRoot>
  );
}
