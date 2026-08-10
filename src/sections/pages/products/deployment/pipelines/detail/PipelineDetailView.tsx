import { motion } from 'framer-motion';
import { ArrowLeft, Check, Circle, Play, RotateCcw, Pause, GitBranch } from 'lucide-react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import pipelinesData from '@neryva_data/products/deployment/pipelines.json';
import logsData from '@neryva_data/products/deployment/logs.json';
import {
  PageRoot,
  BackLink,
  PageHeader,
  TitleBlock,
  PageTitle,
  PageSubtitle,
  StatusPillWrap,
  HeaderActions,
  ActionBtn,
  StagesWrap,
  StageHeader,
  StageTitle,
  StageProgress,
  StagesList,
  StageItem,
  StageMark,
  StageBody,
  StageName,
  StageStatus,
  StageTime,
  Connector,
  TwoColumn,
  MetaGrid,
  MetaCell,
  MetaLabel,
  MetaValue,
  LogsPanel,
  LogLine,
  LogTime,
  LogLevel,
} from './PipelineDetailView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: premiumEase, delay: i * 0.06 },
  }),
};

const STAGE_DESCRIPTIONS: Record<string, string> = {
  Architecture: 'Define models, runtimes, and resource plan.',
  Provisioning: 'Allocate GPUs and provision clusters.',
  Serving: 'Deploy to fleet with traffic management.',
  Optimization: 'Tune inference, batch sizes, and caching.',
  Operations: 'Monitor, autoscale, and patch in flight.',
  Governance: 'Apply access, audit, and compliance policies.',
  Support: 'On-call escalation and incident response.',
};

const stateLabel: Record<string, string> = {
  done: 'completed',
  active: 'in progress',
  pending: 'waiting',
};

export function PipelineDetailView() {
  const navigate = useNavigate();
  const params = useParams({ from: '/deployment/pipelines/$pipelineId' });
  const pipelineId = params.pipelineId;
  const pipeline = pipelinesData.pipelines.find((p) => p.id === pipelineId);
  if (!pipeline) {
    return (
      <PageRoot>
        <BackLink onClick={() => navigate({ to: '/deployment/pipelines' })}>
          <ArrowLeft size={12} strokeWidth={1.7} /> Back to pipelines
        </BackLink>
        <Panel title="Pipeline not found" subtitle={`No pipeline with id "${pipelineId}".`} />
      </PageRoot>
    );
  }

  const stageStatus = (s: string) => s as 'done' | 'active' | 'pending';
  const completedStages = pipeline.stages.filter((s) => s.status === 'done').length;
  const progressPct = Math.round((completedStages / pipeline.stages.length) * 100);

  const relatedLogs = logsData.logs.filter((l) => l.source === pipeline.name).slice(0, 8);

  return (
    <PageRoot>
      <BackLink onClick={() => navigate({ to: '/deployment/pipelines' })}>
        <ArrowLeft size={12} strokeWidth={1.7} /> Back to pipelines
      </BackLink>

      <PageHeader as={motion.div} initial="hidden" animate="visible" variants={fadeUp} custom={0}>
        <TitleBlock>
          <PageTitle>
            {pipeline.name}
            <StatusPillWrap>
              <StatusPill tone={pipeline.status === 'healthy' ? 'success' : pipeline.status === 'queued' ? 'warning' : 'azure'}>
                {pipeline.status}
              </StatusPill>
            </StatusPillWrap>
          </PageTitle>
          <PageSubtitle>{pipeline.description}</PageSubtitle>
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
            Promote
          </ActionBtn>
        </HeaderActions>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <Panel
          title="Pipeline stages"
          subtitle={`${completedStages} of ${pipeline.stages.length} complete · ${progressPct}%`}
        >
          <StagesWrap>
            <StageHeader>
              <StageTitle>Lifecycle</StageTitle>
              <StageProgress>{progressPct}%</StageProgress>
            </StageHeader>
            <StagesList>
              {pipeline.stages.map((stage, i) => (
                <div key={stage.id}>
                  <StageItem $state={stageStatus(stage.status)}>
                    <StageMark $state={stageStatus(stage.status)}>
                      {stage.status === 'done' ? (
                        <Check size={14} strokeWidth={2.4} />
                      ) : stage.status === 'active' ? (
                        <Play size={11} strokeWidth={2.2} fill="currentColor" />
                      ) : (
                        <Circle size={10} strokeWidth={1.7} />
                      )}
                    </StageMark>
                    <StageBody>
                      <StageName>{stage.name}</StageName>
                      <StageStatus $state={stageStatus(stage.status)}>
                        <Circle size={5} fill="currentColor" />
                        {stateLabel[stage.status]} · {STAGE_DESCRIPTIONS[stage.name] ?? '—'}
                      </StageStatus>
                    </StageBody>
                    <StageTime>{stage.duration}</StageTime>
                  </StageItem>
                  {i < pipeline.stages.length - 1 && (
                    <Connector $state={stageStatus(stage.status)} />
                  )}
                </div>
              ))}
            </StagesList>
          </StagesWrap>
        </Panel>
      </motion.div>

      <TwoColumn>
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} style={{ flex: 1 }}>
          <Panel title="Configuration" subtitle="Runtime, model, and deployment metadata.">
            <MetaGrid>
              <MetaCell>
                <MetaLabel>Environment</MetaLabel>
                <MetaValue>{pipeline.env}</MetaValue>
              </MetaCell>
              <MetaCell>
                <MetaLabel>Version</MetaLabel>
                <MetaValue>{pipeline.version}</MetaValue>
              </MetaCell>
              <MetaCell>
                <MetaLabel>Region</MetaLabel>
                <MetaValue>{pipeline.region}</MetaValue>
              </MetaCell>
              <MetaCell>
                <MetaLabel>Model</MetaLabel>
                <MetaValue>{pipeline.model}</MetaValue>
              </MetaCell>
              <MetaCell>
                <MetaLabel>Runtime</MetaLabel>
                <MetaValue>{pipeline.runtime}</MetaValue>
              </MetaCell>
              <MetaCell>
                <MetaLabel>Replicas</MetaLabel>
                <MetaValue>{pipeline.replicas}</MetaValue>
              </MetaCell>
              <MetaCell>
                <MetaLabel>Throughput</MetaLabel>
                <MetaValue>{typeof pipeline.rps === 'number' ? `${pipeline.rps.toLocaleString()} rps` : pipeline.rps}</MetaValue>
              </MetaCell>
              <MetaCell>
                <MetaLabel>p95 latency</MetaLabel>
                <MetaValue>{pipeline.p95}</MetaValue>
              </MetaCell>
              <MetaCell>
                <MetaLabel>Error rate</MetaLabel>
                <MetaValue>{pipeline.errorRate}</MetaValue>
              </MetaCell>
              <MetaCell>
                <MetaLabel>Last run</MetaLabel>
                <MetaValue>{pipeline.lastRun}</MetaValue>
              </MetaCell>
            </MetaGrid>
          </Panel>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} style={{ flex: 1 }}>
          <Panel
            title="Recent activity"
            subtitle={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <GitBranch size={12} strokeWidth={1.7} /> Pipeline events
              </span>
            }
          >
            {relatedLogs.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'rgba(229, 231, 235, 0.5)' }}>
                No recent activity for this pipeline.
              </div>
            ) : (
              <LogsPanel>
                {relatedLogs.map((l) => (
                  <LogLine key={l.id} $level={l.level as 'info' | 'warn' | 'error' | 'debug'}>
                    <LogTime>{l.time}</LogTime>
                    <LogLevel $level={l.level as 'info' | 'warn' | 'error' | 'debug'}>{l.level}</LogLevel>
                    <span style={{ flex: 1, minWidth: 0 }}>{l.message}</span>
                  </LogLine>
                ))}
              </LogsPanel>
            )}
          </Panel>
        </motion.div>
      </TwoColumn>
    </PageRoot>
  );
}
