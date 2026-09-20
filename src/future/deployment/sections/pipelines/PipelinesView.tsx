import toast from 'react-hot-toast';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, ViewHeaderRow } from '@components/common/ui/ViewLayout';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { StatusPill } from '@components/common/ui/StatusPill';
import pipelines from '../../data/pipelines.json';
import { pageItem } from '@styles/motion';
import {
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
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
          <ViewHeader><ViewTitle>Pipelines</ViewTitle>
          <ViewSubtitle>
            Track every stage of your deployment lifecycle — from architecture to operations.
          </ViewSubtitle></ViewHeader>
        <NewBtn type="button"
          onClick={() => toast.success('Pipeline scaffold created')}>
          <Plus size={14} strokeWidth={2} />
          New pipeline
        </NewBtn>
      </ViewHeaderRow>

      <FilterBar as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={1}>
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
            variants={pageItem}
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
    </ViewShell>
  );
}

