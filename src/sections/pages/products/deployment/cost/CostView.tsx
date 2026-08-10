import { motion } from 'framer-motion';
import { Panel } from '@components/common/ui/Panel';
import { MetricCard } from '@components/common/ui/MetricCard';
import { Sparkline } from '@components/common/ui/Sparkline';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { StudioAreaChart } from '@components/common/ui/StudioAreaChart';
import { StatusPill } from '@components/common/ui/StatusPill';
import cost from '@neryva_data/products/deployment/cost.json';
import {
  PageRoot,
  PageHeader,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  BudgetCard,
  BudgetTop,
  BudgetLeft,
  BudgetLabel,
  BudgetAmount,
  BudgetMeta,
  KpiGrid,
  SectionTitle,
  TwoColumn,
  ChartWrap,
  BreakdownTable,
  TableHeader,
  TableRow,
  Cell,
  DeployName,
  EnvMeta,
  Cost,
  ShareBar,
  CategoryList,
  CategoryRow,
  CategoryTop,
  CategoryName,
  CategorySwatch,
  CategoryValue,
  TrendBadge,
} from './CostView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.05 },
  }),
};

const CATEGORY_COLORS: Record<string, string> = {
  amber: '#fbbf24',
  azure: '#60a5fa',
  emerald: '#34d399',
  lilac: '#c084fc',
  neutral: 'rgba(229, 231, 235, 0.55)',
};

const envTone: Record<string, 'success' | 'warning' | 'azure' | 'neutral'> = {
  production: 'success',
  staging: 'warning',
  dev: 'azure',
  global: 'neutral',
};

const PROGRESS_TONE: Record<string, 'amber' | 'azure' | 'emerald' | 'lilac'> = {
  amber: 'amber',
  azure: 'azure',
  emerald: 'emerald',
  lilac: 'lilac',
};

export function CostView() {
  const budgetPct = (cost.summary.monthToDate / cost.summary.budget) * 100;
  const forecastPct = (cost.summary.forecast / cost.summary.budget) * 100;

  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>Cost & usage</PageTitle>
          <PageSubtitle>
            Spend across deployments, regions, and resource categories. Forecast vs. budget.
          </PageSubtitle>
        </TitleBlock>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <BudgetCard>
          <BudgetTop>
            <BudgetLeft>
              <BudgetLabel>Month-to-date spend</BudgetLabel>
              <BudgetAmount>${cost.summary.monthToDate.toLocaleString()}</BudgetAmount>
              <BudgetMeta>
                of ${cost.summary.budget.toLocaleString()} budget · {budgetPct.toFixed(0)}% used
              </BudgetMeta>
            </BudgetLeft>
            <BudgetLeft style={{ alignItems: 'flex-end' }}>
              <BudgetLabel>Forecast</BudgetLabel>
              <BudgetAmount style={{ fontSize: 24 }}>
                ${cost.summary.forecast.toLocaleString()}
              </BudgetAmount>
              <BudgetMeta>
                {cost.summary.change} vs last month
              </BudgetMeta>
            </BudgetLeft>
          </BudgetTop>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <ProgressBar
              value={budgetPct}
              tone={budgetPct > 85 ? 'amber' : budgetPct > 70 ? 'azure' : 'emerald'}
            />
            <ProgressBar value={forecastPct} tone="lilac" />
          </div>
          <BudgetMeta style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>actual</span>
            <span>forecast</span>
          </BudgetMeta>
        </BudgetCard>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
        <KpiGrid>
          <MetricCard
            label="Total this month"
            value={`$${cost.summary.totalSpend.toLocaleString()}`}
            delta={{ value: cost.summary.change, positive: false }}
            footnote="USD"
            spark={<Sparkline data={[420, 440, 460, 480, 502, 520, 548, 580, 612]} color="#f59e0b" />}
          />
          <MetricCard
            label="MTD spend"
            value={`$${cost.summary.monthToDate.toLocaleString()}`}
            delta={{ value: '+9.8%', positive: false }}
            footnote="vs same period last month"
            spark={<Sparkline data={[380, 402, 420, 440, 460, 478, 498, 518, 540]} color="#fbbf24" />}
          />
          <MetricCard
            label="Forecast EOM"
            value={`$${cost.summary.forecast.toLocaleString()}`}
            delta={{ value: '+12%', positive: false }}
            footnote="end of month projection"
            spark={<Sparkline data={[18400, 18800, 19200, 19400, 19500, 19600, 19700, 19800, 19840]} color="#c084fc" />}
          />
          <MetricCard
            label="Budget remaining"
            value={`$${(cost.summary.budget - cost.summary.monthToDate).toLocaleString()}`}
            delta={{ value: '−52%', positive: true }}
            footnote={`${(100 - budgetPct).toFixed(0)}% left`}
            spark={<Sparkline data={[12000, 11000, 10000, 9500, 9000, 8500, 8000, 7500, 7200]} color="#05e3a4" />}
          />
        </KpiGrid>
      </motion.div>

      <TwoColumn>
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={6} style={{ flex: 1 }}>
          <Panel title="Daily spend" subtitle="Last 7 days · USD">
            <ChartWrap>
              <StudioAreaChart
                data={cost.byDay}
                series={[
                  { dataKey: 'spend', name: 'Spend', color: '#f59e0b', gradientId: 'cost-spend' },
                ]}
                height={260}
                yFormatter={(v) => `$${v}`}
              />
            </ChartWrap>
          </Panel>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={7} style={{ flex: 1 }}>
          <Panel title="By category" subtitle="Where the spend goes">
            <CategoryList>
              {cost.byCategory.map((c, i) => (
                <CategoryRow
                  key={c.name}
                  as={motion.div}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={i + 8}
                >
                  <CategoryTop>
                    <CategoryName>
                      <CategorySwatch $color={CATEGORY_COLORS[c.tone] ?? '#60a5fa'} />
                      {c.name}
                    </CategoryName>
                    <CategoryValue>
                      ${c.value.toLocaleString()} <span style={{ color: 'rgba(229, 231, 235, 0.55)' }}>· {c.share}%</span>
                    </CategoryValue>
                  </CategoryTop>
                  <ProgressBar
                    value={c.share}
                    tone={PROGRESS_TONE[c.tone] ?? 'azure'}
                    height={4}
                  />
                </CategoryRow>
              ))}
            </CategoryList>
          </Panel>
        </motion.div>
      </TwoColumn>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={14}>
        <Panel title="By deployment" subtitle="Cost breakdown per active deployment">
          <BreakdownTable>
            <TableHeader>
              <Cell $w="38%">Deployment</Cell>
              <Cell $w="12%">Env</Cell>
              <Cell $w="12%">Region</Cell>
              <Cell $w="14%" $align="right">Cost</Cell>
              <Cell $w="16%">Share</Cell>
              <Cell $w="8%" $align="right">Trend</Cell>
            </TableHeader>
            {cost.byDeployment.map((d, i) => (
              <TableRow
                key={d.id}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 15}
              >
                <Cell $w="38%">
                  <DeployName>{d.name}</DeployName>
                </Cell>
                <Cell $w="12%">
                  <StatusPill tone={envTone[d.env]} dot={false}>
                    {d.env}
                  </StatusPill>
                </Cell>
                <Cell $w="12%">
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 12,
                      color: 'rgba(229, 231, 235, 0.65)',
                    }}
                  >
                    {d.region}
                  </span>
                </Cell>
                <Cell $w="14%" $align="right">
                  <Cost>${d.cost.toLocaleString()}</Cost>
                </Cell>
                <Cell $w="16%">
                  <ShareBar>
                    <ProgressBar value={d.share} tone="amber" height={4} />
                  </ShareBar>
                </Cell>
                <Cell $w="8%" $align="right">
                  <TrendBadge $positive={d.trend > 0}>
                    {d.trend > 0 ? '+' : ''}
                    {d.trend}%
                  </TrendBadge>
                </Cell>
              </TableRow>
            ))}
          </BreakdownTable>
        </Panel>
      </motion.div>
    </PageRoot>
  );
}
