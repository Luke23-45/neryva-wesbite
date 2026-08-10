import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Pause, Play, Server, Activity } from 'lucide-react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Panel } from '@components/common/ui/Panel';
import { MetricCard } from '@components/common/ui/MetricCard';
import { Sparkline } from '@components/common/ui/Sparkline';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import deploymentsData from '@neryva_data/products/deployment/deployments.json';
import {
  PageRoot,
  BackLink,
  PageHeader,
  TitleBlock,
  PageTitle,
  VersionPill,
  Meta,
  HeaderActions,
  ActionBtn,
  KpiGrid,
  TwoColumn,
  MetaGrid,
  MetaCell,
  MetaLabel,
  MetaValue,
  ResourceBlock,
  ResourceRow,
  ResourceLabel,
  ResourceValue,
  ReplicaBlock,
  ReplicaVisual,
  ReplicaCell,
  ReplicaMeta,
  ReplicaReady,
  ReplicaFailed,
} from './DeployDetailView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.06 },
  }),
};

const statusTone: Record<string, 'success' | 'warning' | 'azure' | 'amber'> = {
  healthy: 'success',
  degraded: 'warning',
  canary: 'azure',
  queued: 'amber',
};

const envTone: Record<string, 'success' | 'warning' | 'azure' | 'neutral'> = {
  production: 'success',
  staging: 'warning',
  dev: 'azure',
};

function parsePct(s: string): number {
  if (!s || s === '—') return 0;
  return parseInt(s.replace('%', ''), 10) || 0;
}

function parseMs(s: string): number {
  if (!s || s === '—') return 0;
  return parseInt(s.replace('ms', ''), 10) || 0;
}

function genSpark(base: number, variance = 0.15): number[] {
  return Array.from({ length: 16 }, (_, i) => {
    const t = i / 15;
    return Math.max(0, Math.round(base * (1 - variance * 0.5 + variance * t * Math.sin(i * 1.2))));
  });
}

export function DeployDetailView() {
  const navigate = useNavigate();
  const params = useParams({ from: '/deployment/deployments/$deployId' });
  const deploy = deploymentsData.deployments.find((d) => d.id === params.deployId);

  if (!deploy) {
    return (
      <PageRoot>
        <BackLink onClick={() => navigate({ to: '/deployment/deployments' })}>
          <ArrowLeft size={12} strokeWidth={1.7} /> Back to deployments
        </BackLink>
        <Panel title="Deployment not found" subtitle={`No deployment with id "${params.deployId}".`} />
      </PageRoot>
    );
  }

  const failed = deploy.replicas - deploy.ready;
  const rps = typeof deploy.rps === 'number' ? deploy.rps : 0;
  const p95 = parseMs(deploy.p95);
  const errPct = parsePct(deploy.errorRate);

  return (
    <PageRoot>
      <BackLink onClick={() => navigate({ to: '/deployment/deployments' })}>
        <ArrowLeft size={12} strokeWidth={1.7} /> Back to deployments
      </BackLink>

      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>
            {deploy.name}
            <VersionPill>{deploy.version}</VersionPill>
            <StatusPill tone={statusTone[deploy.status]}>{deploy.status}</StatusPill>
          </PageTitle>
          <Meta>
            <StatusPill tone={envTone[deploy.env]} dot={false}>
              {deploy.env}
            </StatusPill>
            <span>·</span>
            <span>{deploy.region}</span>
            <span>·</span>
            <span>Deployed {deploy.deployedAt} by {deploy.deployedBy}</span>
          </Meta>
        </TitleBlock>
        <HeaderActions>
          <ActionBtn type="button">
            <Pause size={13} strokeWidth={1.8} />
            Pause
          </ActionBtn>
          <ActionBtn type="button" $variant="ghost">
            <RotateCcw size={13} strokeWidth={1.8} />
            Rollback
          </ActionBtn>
          <ActionBtn type="button" $variant="primary">
            <Play size={13} strokeWidth={1.8} />
            Scale up
          </ActionBtn>
        </HeaderActions>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <KpiGrid>
          <MetricCard
            label="Throughput"
            value={rps.toLocaleString()}
            delta={{ value: '+8.4%', positive: true }}
            footnote="requests / sec"
            spark={<Sparkline data={genSpark(rps)} color="#f59e0b" />}
          />
          <MetricCard
            label="p95 latency"
            value={p95 > 0 ? `${p95}ms` : '—'}
            delta={{ value: '-22ms', positive: true }}
            footnote="trailing 5 min"
            spark={<Sparkline data={genSpark(p95 || 100)} color="#60a5fa" />}
          />
          <MetricCard
            label="Error rate"
            value={errPct > 0 ? `${errPct.toFixed(2)}%` : '—'}
            delta={{ value: '-0.04pt', positive: true }}
            footnote="last 24 hours"
            spark={<Sparkline data={genSpark(errPct || 1)} color="#34d399" />}
          />
          <MetricCard
            label="Replicas"
            value={`${deploy.ready} / ${deploy.replicas}`}
            delta={{ value: failed > 0 ? `${failed} down` : 'all healthy', positive: failed === 0 }}
            footnote="across the fleet"
            spark={<Sparkline data={genSpark(deploy.replicas || 1)} color="#fbbf24" />}
          />
        </KpiGrid>
      </motion.div>

      <TwoColumn>
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} style={{ flex: 1 }}>
          <Panel
            title="Resource utilization"
            subtitle={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Server size={12} strokeWidth={1.7} /> Live cluster metrics
              </span> as any
            }
          >
            <ResourceBlock>
              <ResourceRow>
                <ResourceLabel>
                  CPU
                  <ResourceValue>{deploy.cpu}</ResourceValue>
                </ResourceLabel>
                <ProgressBar value={parsePct(deploy.cpu)} tone="azure" />
              </ResourceRow>
              <ResourceRow>
                <ResourceLabel>
                  Memory
                  <ResourceValue>{deploy.memory}</ResourceValue>
                </ResourceLabel>
                <ProgressBar value={parsePct(deploy.memory)} tone="emerald" />
              </ResourceRow>
              <ResourceRow>
                <ResourceLabel>
                  GPU
                  <ResourceValue>{deploy.gpu}</ResourceValue>
                </ResourceLabel>
                <ProgressBar value={parsePct(deploy.gpu)} tone="amber" />
              </ResourceRow>
            </ResourceBlock>
          </Panel>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} style={{ flex: 1 }}>
          <Panel
            title="Replicas"
            subtitle={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Activity size={12} strokeWidth={1.7} /> Per-instance readiness
              </span> as any
            }
          >
            <ReplicaBlock>
              <ReplicaVisual>
                {Array.from({ length: deploy.replicas }).map((_, i) => (
                  <ReplicaCell key={i} $ready={i < deploy.ready} aria-label={i < deploy.ready ? 'ready' : 'not ready'} />
                ))}
                {deploy.replicas === 0 && (
                  <div style={{ fontSize: 12.5, color: 'rgba(229, 231, 235, 0.45)' }}>
                    No replicas scheduled yet
                  </div>
                )}
              </ReplicaVisual>
              <ReplicaMeta>
                <span>
                  <ReplicaReady>{deploy.ready}</ReplicaReady>{' '}
                  <span style={{ color: 'rgba(229, 231, 235, 0.55)' }}>ready</span>
                </span>
                {failed > 0 && (
                  <span>
                    <ReplicaFailed>{failed}</ReplicaFailed>{' '}
                    <span style={{ color: 'rgba(229, 231, 235, 0.55)' }}>not ready</span>
                  </span>
                )}
              </ReplicaMeta>
            </ReplicaBlock>
          </Panel>
        </motion.div>
      </TwoColumn>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
        <Panel title="Configuration" subtitle="Image, endpoint, and deployment metadata.">
          <MetaGrid>
            <MetaCell>
              <MetaLabel>Container image</MetaLabel>
              <MetaValue>{deploy.image}</MetaValue>
            </MetaCell>
            <MetaCell>
              <MetaLabel>Endpoint</MetaLabel>
              <MetaValue>{deploy.endpoint}</MetaValue>
            </MetaCell>
            <MetaCell>
              <MetaLabel>Environment</MetaLabel>
              <MetaValue>{deploy.env}</MetaValue>
            </MetaCell>
            <MetaCell>
              <MetaLabel>Region</MetaLabel>
              <MetaValue>{deploy.region}</MetaValue>
            </MetaCell>
            <MetaCell>
              <MetaLabel>Version</MetaLabel>
              <MetaValue>{deploy.version}</MetaValue>
            </MetaCell>
            <MetaCell>
              <MetaLabel>Deployed at</MetaLabel>
              <MetaValue>{deploy.deployedAt}</MetaValue>
            </MetaCell>
            <MetaCell>
              <MetaLabel>Deployed by</MetaLabel>
              <MetaValue>{deploy.deployedBy}</MetaValue>
            </MetaCell>
            <MetaCell>
              <MetaLabel>Replicas</MetaLabel>
              <MetaValue>{deploy.replicas}</MetaValue>
            </MetaCell>
          </MetaGrid>
        </Panel>
      </motion.div>
    </PageRoot>
  );
}
