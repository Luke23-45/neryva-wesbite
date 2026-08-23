import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { StatusPill } from '@components/common/ui/StatusPill';
import pipelines from '@neryva_data/products/deployment/pipelines.json';
import {
  PageRoot,
  PageHeader,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  NewBtn,
  FilterBar,
  FilterPill,
  PipelineGrid,
  PipelineCard,
  CardTop,
  CardTitle,
  Name,
  Description,
  StageStrip,
  StageDot,
  MetricsRow,
  MetricCell,
  MetricLabel,
  MetricValue,
} from './PipelinesView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.05 },
  }),
};

const FILTERS = ['all', 'production', 'staging', 'dev'] as const;

const statusTone: Record<string, 'success' | 'warning' | 'azure' | 'amber'> = {
  running: 'azure',
  healthy: 'success',
  queued: 'warning',
  review: 'azure',
};

export function PipelinesView() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const list = pipelines.pipelines.filter((p) => filter === 'all' || p.env === filter);

  return (
    <PageRoot>
      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>Pipelines</PageTitle>
          <PageSubtitle>
            Track every stage of your deployment lifecycle — from architecture to operations.
          </PageSubtitle>
        </TitleBlock>
        <NewBtn type="button">
          <Plus size={14} strokeWidth={2} />
          New pipeline
        </NewBtn>
      </PageHeader>

      <FilterBar as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        {FILTERS.map((f) => (
          <FilterPill
            key={f}
            type="button"
            $active={filter === f}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All environments' : f}
          </FilterPill>
        ))}
      </FilterBar>

      <PipelineGrid>
        {list.map((p, i) => (
          <PipelineCard
            key={p.id}
            as={motion.div}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={i + 2}
          >
            <CardTop>
              <CardTitle>
                <Name>
                  <Link
                    to="/deployment/pipelines/$pipelineId"
                    params={{ pipelineId: p.id }}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {p.name}
                  </Link>
                  <StatusPill tone={statusTone[p.status]}>{p.status}</StatusPill>
                </Name>
                <Description>{p.description}</Description>
              </CardTitle>
            </CardTop>

            <StageStrip>
              {p.stages.map((s) => (
                <StageDot key={s.id} $state={s.status as 'done' | 'active' | 'pending'} />
              ))}
            </StageStrip>

            <MetricsRow>
              <MetricCell>
                <MetricLabel>Version</MetricLabel>
                <MetricValue>{p.version}</MetricValue>
              </MetricCell>
              <MetricCell>
                <MetricLabel>Region</MetricLabel>
                <MetricValue>{p.region}</MetricValue>
              </MetricCell>
              <MetricCell>
                <MetricLabel>Runtime</MetricLabel>
                <MetricValue>{p.runtime}</MetricValue>
              </MetricCell>
              <MetricCell>
                <MetricLabel>Replicas</MetricLabel>
                <MetricValue>{p.replicas}</MetricValue>
              </MetricCell>
              <MetricCell>
                <MetricLabel>RPS</MetricLabel>
                <MetricValue>{typeof p.rps === 'number' ? p.rps.toLocaleString() : p.rps}</MetricValue>
              </MetricCell>
              <MetricCell>
                <MetricLabel>p95</MetricLabel>
                <MetricValue>{p.p95}</MetricValue>
              </MetricCell>
              <MetricCell>
                <MetricLabel>Last run</MetricLabel>
                <MetricValue>{p.lastRun}</MetricValue>
              </MetricCell>
              <Link
                to="/deployment/pipelines/$pipelineId"
                params={{ pipelineId: p.id }}
                style={{
                  marginLeft: 'auto',
                  alignSelf: 'center',
                  color: '#fbbf24',
                  fontSize: 12.5,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                View details <ArrowRight size={11} strokeWidth={1.8} />
              </Link>
            </MetricsRow>
          </PipelineCard>
        ))}
      </PipelineGrid>
    </PageRoot>
  );
}
