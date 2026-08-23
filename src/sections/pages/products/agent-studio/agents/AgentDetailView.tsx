import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams, Link } from '@tanstack/react-router';
import { ArrowLeft, Bot, Pause, Play, Copy as CopyIcon, MessageSquare, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { MetricCard } from '@components/common/ui/MetricCard';
import { Sparkline } from '@components/common/ui/Sparkline';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { Tooltip } from '@components/common/ui/Tooltip';
import { Avatar } from '@components/common/ui/Avatar';
import { CopyButton } from '@components/common/ui/CopyButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { EmptyState } from '@components/common/ui/EmptyState';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ViewShell, SectionTitle, KpiGrid } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import agents from '@neryva_data/products/agent_studio/agents.json';

import {
  BackLink,
  HeaderRow,
  HeaderMain,
  HeaderTitle,
  HeaderSub,
  ActionCluster,
  MetaGrid,
  MetaItem,
  MetaLabel,
  MetaValue,
  CodeBlock,
  PromptTitle,
  PromptBody,
  ChipRow,
  Chip,
  GuardList,
  GuardItem,
  GuardDot,
  EmptyNote,
} from './AgentDetailView.styles';

const statusTone = { active: 'success', paused: 'warning', draft: 'neutral' } as const;
const toneToHue: Record<string, 'azure' | 'emerald' | 'lilac' | 'amethyst'> = {
  azure: 'azure', emerald: 'emerald', lilac: 'lilac', amethyst: 'amethyst',
};

export function AgentDetailView() {
  const params = useParams({ from: '/agent-studio/agents/$agentId' });
  const agent = agents.agents.find((a) => a.id === params.agentId);
  const [confirm, setConfirm] = useState<null | 'pause' | 'delete'>(null);
  const navigate = useNavigate();

  if (!agent) {
    return (
      <ViewShell>
        <BackLink as={Link} to="/agent-studio/agents">
          <ArrowLeft size={13} strokeWidth={1.7} />
          Back to agents
        </BackLink>
        <EmptyState
          icon={<Bot size={28} strokeWidth={1.5} />}
          title="Agent not found"
          description="The agent you're looking for doesn't exist or was removed."
        />
      </ViewShell>
    );
  }

  const hueForAvatar: 'azure' | 'emerald' | 'lilac' | 'amethyst' = toneToHue[agent.tone] ?? 'azure';
  const toneForBar: 'azure' | 'emerald' | 'lilac' | 'amber' = (() => {
    if (agent.tone === 'warning') return 'amber';
    const t = toneToHue[agent.tone];
    return t === 'amethyst' ? 'azure' : (t ?? 'azure');
  })();

  return (
    <ViewShell>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <BackLink as={Link} to="/agent-studio/agents">
          <ArrowLeft size={13} strokeWidth={1.7} />
          Back to agents
        </BackLink>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <HeaderRow>
          <HeaderMain>
            <Avatar
              initials={agent.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
              hue={hueForAvatar}
              size={44}
              status={agent.status === 'active' ? 'online' : agent.status === 'paused' ? 'idle' : 'offline'}
            />
            <div style={{ minWidth: 0 }}>
              <HeaderTitle>{agent.name}</HeaderTitle>
              <HeaderSub>{agent.description}</HeaderSub>
            </div>
            <StatusPill tone={statusTone[agent.status as keyof typeof statusTone]}>
              {agent.status}
            </StatusPill>
          </HeaderMain>
          <ActionCluster>
            <Tooltip label="Test this agent">
              <ActionButton variant="secondary" size="sm" onClick={() => toast.success(`Opening test playground for ${agent.name}`)}>
                <MessageSquare size={13} strokeWidth={1.7} />
                Test
              </ActionButton>
            </Tooltip>
            <Tooltip label="Duplicate agent">
              <ActionButton variant="secondary" size="sm" onClick={() => toast.success('Cloned to a draft')}>
                <CopyIcon size={13} strokeWidth={1.7} />
                Clone
              </ActionButton>
            </Tooltip>
            <Tooltip label={agent.status === 'paused' ? 'Resume agent' : 'Pause agent'}>
              <ActionButton
                variant={agent.status === 'paused' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setConfirm('pause')}
              >
                {agent.status === 'paused' ? <Play size={13} strokeWidth={1.8} /> : <Pause size={13} strokeWidth={1.8} />}
                {agent.status === 'paused' ? 'Resume' : 'Pause'}
              </ActionButton>
            </Tooltip>
            <Tooltip label="Delete agent">
              <ActionButton variant="danger" size="sm" onClick={() => setConfirm('delete')} aria-label="Delete agent">
                <Trash2 size={13} strokeWidth={1.7} />
              </ActionButton>
            </Tooltip>
          </ActionCluster>
        </HeaderRow>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <KpiGrid>
          <MetricCard
            label="Volume (30d)"
            value={agent.volume.toLocaleString()}
            footnote={`${agent.channels.join(' · ')}`}
            spark={<Sparkline data={[20, 22, 28, 26, 30, 32, 34, 30, 36, 40, 38, 42, 44, 42, 46, 50].slice(0, 12)} color="#60a5fa" />}
          />
          <MetricCard
            label="Avg latency"
            value={agent.status === 'draft' ? '—' : `${(agent.responseMs / 1000).toFixed(2)}s`}
            footnote="p50"
            spark={<Sparkline data={[2, 1.8, 1.6, 1.5, 1.4, 1.3, 1.4, 1.3, 1.2, 1.2, 1.3, 1.2, 1.2, 1.1, 1.2, 1.2]} color="#05e3a4" />}
          />
          <MetricCard
            label="Resolution"
            value={agent.status === 'draft' ? '—' : `${agent.resolution}%`}
            footnote="of all conversations"
            spark={<Sparkline data={[88, 89, 90, 91, 90, 92, 93, 92, 93, 94, 93, 94, 95, 94, 95, 95]} color="#c084fc" />}
          />
          <MetricCard
            label="Cost / 1k msgs"
            value={agent.status === 'draft' ? '—' : `$${(0.6 + Math.random() * 0.5).toFixed(2)}`}
            footnote="blended"
            spark={<Sparkline data={[0.7, 0.72, 0.74, 0.71, 0.73, 0.76, 0.74, 0.75, 0.78, 0.76, 0.79, 0.80, 0.78, 0.81, 0.79, 0.80]} color="#fbbf24" />}
          />
        </KpiGrid>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={3}>
        <Panel title="System prompt" subtitle={`The prompt this agent runs on. ${agent.version}`} action={<CopyButton value={agent.prompt} label="Copy prompt" />}>
          <CodeBlock>
            <PromptTitle>System</PromptTitle>
            <PromptBody>{agent.prompt}</PromptBody>
          </CodeBlock>
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={4}>
        <SectionTitle>Guardrails</SectionTitle>
        <GuardList>
          {agent.guardrails.map((g) => (
            <GuardItem key={g}>
              <GuardDot aria-hidden="true" />
              {g}
            </GuardItem>
          ))}
        </GuardList>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={5}>
        <SectionTitle>Tools & integrations</SectionTitle>
        <ChipRow>
          {agent.tools.map((t) => (
            <Chip key={t}>
              <code>{t}</code>
            </Chip>
          ))}
          {agent.tools.length === 0 && <EmptyNote>No tools attached.</EmptyNote>}
        </ChipRow>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={6}>
        <SectionTitle>Knowledge sources</SectionTitle>
        <ChipRow>
          {agent.knowledgeSources.length === 0 ? (
            <EmptyNote>No sources linked. The agent will fall back to its system prompt.</EmptyNote>
          ) : (
            agent.knowledgeSources.map((s) => (
              <Chip key={s} $hue="azure">
                {s}
              </Chip>
            ))
          )}
        </ChipRow>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={7}>
        <Panel title="Configuration" subtitle="Version, environment, and last update.">
          <MetaGrid>
            <MetaItem>
              <MetaLabel>Model</MetaLabel>
              <MetaValue>{agent.model}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>Version</MetaLabel>
              <MetaValue>{agent.version}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>Channels</MetaLabel>
              <MetaValue>{agent.channels.join(', ')}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>Updated</MetaLabel>
              <MetaValue>{agent.updated}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>Resolution trend</MetaLabel>
              <MetaValue>
                <ProgressBar value={agent.resolution} tone={toneForBar} />
              </MetaValue>
            </MetaItem>
          </MetaGrid>
        </Panel>
      </motion.div>

      <ConfirmDialog
        open={confirm === 'pause'}
        title={agent.status === 'paused' ? 'Resume this agent?' : 'Pause this agent?'}
        message={
          agent.status === 'paused'
            ? 'Resumed agents start serving conversations immediately on all configured channels.'
            : 'Pausing stops the agent from receiving new conversations. In-flight conversations will be handed off to a human.'
        }
        confirmLabel={agent.status === 'paused' ? 'Resume' : 'Pause'}
        onConfirm={() => {
          toast.success(`${agent.name} ${agent.status === 'paused' ? 'resumed' : 'paused'}`);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        title="Delete this agent?"
        message={`This permanently removes ${agent.name} and all of its conversation history. This cannot be undone.`}
        destructive
        confirmLabel="Delete"
        onConfirm={() => {
          toast.error(`${agent.name} deleted`);
          setConfirm(null);
          navigate({ to: '/agent-studio/agents' });
        }}
        onCancel={() => setConfirm(null)}
      />
    </ViewShell>
  );
}
