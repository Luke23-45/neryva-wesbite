import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { History, GitCommit } from 'lucide-react';
import releases from '@neryva_data/products/deployment/releases.json';
import {
import { pageItem } from '@styles/motion';
  SectionTitle,
  KpiGrid,
  KpiCard,
  KpiLabel,
  KpiValue,
  KpiMeta,
  FilterRow,
  FilterPill,
  Timeline,
  ReleaseCard,
  ReleaseTop,
  ReleaseLeft,
  ReleaseHeader,
  VersionTag,
  DeploymentName,
  ReleaseMeta,
  StatusPill,
  EnvPill,
  ChangesGrid,
  ChangeBlock,
  ChangeHeader,
  ChangeLabel,
  ChangeCount,
  ChangeList,
  ChangeItem,
  Empty,
  MetricsRow,
  MetricItem,
  MetricLabel,
  MetricValue,
} from './ReleasesView.styles';

type Filter = 'all' | 'live' | 'canary' | 'rolled-back' | 'degraded';
const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live' },
  { key: 'canary', label: 'Canary' },
  { key: 'rolled-back', label: 'Rolled back' },
  { key: 'degraded', label: 'Degraded' },
];

export function ReleasesView() {
  const [filter, setFilter] = useState<Filter>('all');
  const filtered = filter === 'all' ? releases.releases : releases.releases.filter((r) => r.status === filter);

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
          <ViewTitle>Releases</ViewTitle>
          <ViewSubtitle>
            Release history, changelogs, and rollout metrics across every deployment.
          </ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <KpiGrid>
          <KpiCard>
            <KpiLabel>Releases (30d)</KpiLabel>
            <KpiValue>{releases.summary.releasesThisMonth}</KpiValue>
            <KpiMeta>across {new Set(releases.releases.map((r) => r.deployment)).size} deployments</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Today</KpiLabel>
            <KpiValue>{releases.summary.deploysToday}</KpiValue>
            <KpiMeta>so far</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Avg lead time</KpiLabel>
            <KpiValue>{releases.summary.avgLeadTimeMinutes}m</KpiValue>
            <KpiMeta>commit → production</KpiMeta>
          </KpiCard>
          <KpiCard>
            <KpiLabel>Rollback rate</KpiLabel>
            <KpiValue style={{ color: '#fbbf24' }}>{releases.summary.rollbackRate}%</KpiValue>
            <KpiMeta>last 30 days</KpiMeta>
          </KpiCard>
        </KpiGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <FilterRow>
          {FILTERS.map((f) => (
            <FilterPill
              key={f.key}
              type="button"
              $active={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </FilterPill>
          ))}
        </FilterRow>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
        <SectionTitle>
          <History size={14} strokeWidth={1.7} />
          Timeline ({filtered.length})
        </SectionTitle>
        <Timeline>
          {filtered.map((r, i) => (
            <ReleaseCard
              key={r.id}
              as={motion.div}
              initial="hidden"
              animate="visible"
              variants={pageItem}
              custom={i + 4}
            >
              <ReleaseTop>
                <ReleaseLeft>
                  <ReleaseHeader>
                    <VersionTag>{r.version}</VersionTag>
                    <DeploymentName>{r.deployment}</DeploymentName>
                    <EnvPill $env={r.environment}>{r.environment}</EnvPill>
                    <StatusPill $tone={r.tone}>{r.status}</StatusPill>
                  </ReleaseHeader>
                  <ReleaseMeta>
                    <GitCommit size={10} strokeWidth={1.7} style={{ display: 'inline', verticalAlign: 'middle' }} /> {r.commit} · {r.branch} · released by {r.releasedBy} · {r.releasedAt}
                  </ReleaseMeta>
                </ReleaseLeft>
              </ReleaseTop>

              <ChangesGrid>
                <ChangeBlock $kind="features">
                  <ChangeHeader>
                    <ChangeLabel $kind="features">Features</ChangeLabel>
                    <ChangeCount>{r.changes.features.length}</ChangeCount>
                  </ChangeHeader>
                  {r.changes.features.length > 0 ? (
                    <ChangeList>
                      {r.changes.features.map((c) => (
                        <ChangeItem key={c}>{c}</ChangeItem>
                      ))}
                    </ChangeList>
                  ) : (
                    <Empty>No features</Empty>
                  )}
                </ChangeBlock>

                <ChangeBlock $kind="fixes">
                  <ChangeHeader>
                    <ChangeLabel $kind="fixes">Fixes</ChangeLabel>
                    <ChangeCount>{r.changes.fixes.length}</ChangeCount>
                  </ChangeHeader>
                  {r.changes.fixes.length > 0 ? (
                    <ChangeList>
                      {r.changes.fixes.map((c) => (
                        <ChangeItem key={c}>{c}</ChangeItem>
                      ))}
                    </ChangeList>
                  ) : (
                    <Empty>No fixes</Empty>
                  )}
                </ChangeBlock>

                <ChangeBlock $kind="perf">
                  <ChangeHeader>
                    <ChangeLabel $kind="perf">Performance</ChangeLabel>
                    <ChangeCount>{r.changes.perf.length}</ChangeCount>
                  </ChangeHeader>
                  {r.changes.perf.length > 0 ? (
                    <ChangeList>
                      {r.changes.perf.map((c) => (
                        <ChangeItem key={c}>{c}</ChangeItem>
                      ))}
                    </ChangeList>
                  ) : (
                    <Empty>No perf changes</Empty>
                  )}
                </ChangeBlock>
              </ChangesGrid>

              <MetricsRow>
                <MetricItem>
                  <MetricLabel>Rollout time</MetricLabel>
                  <MetricValue>{r.metrics.rolloutTime}</MetricValue>
                </MetricItem>
                <MetricItem>
                  <MetricLabel>Canary duration</MetricLabel>
                  <MetricValue>{r.metrics.canaryDuration}</MetricValue>
                </MetricItem>
                <MetricItem>
                  <MetricLabel>Auto-rollback</MetricLabel>
                  <MetricValue $tone={r.metrics.autoRollback ? 'error' : 'emerald'}>
                    {r.metrics.autoRollback ? 'triggered' : 'not triggered'}
                  </MetricValue>
                </MetricItem>
                <MetricItem>
                  <MetricLabel>Tests</MetricLabel>
                  <MetricValue $tone={r.metrics.testsPassed === r.metrics.testsRun ? 'emerald' : 'warning'}>
                    {r.metrics.testsPassed} / {r.metrics.testsRun}
                  </MetricValue>
                </MetricItem>
                <MetricItem>
                  <MetricLabel>Test pass rate</MetricLabel>
                  <MetricValue
                    $tone={
                      r.metrics.testsPassed / r.metrics.testsRun >= 0.99
                        ? 'emerald'
                        : r.metrics.testsPassed / r.metrics.testsRun >= 0.95
                          ? 'warning'
                          : 'error'
                    }
                  >
                    {((r.metrics.testsPassed / r.metrics.testsRun) * 100).toFixed(1)}%
                  </MetricValue>
                </MetricItem>
              </MetricsRow>
            </ReleaseCard>
          ))}
        </Timeline>
      </motion.div>
    </ViewShell>
  );
}
