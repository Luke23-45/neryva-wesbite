import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { EmptyState } from '@components/common/ui/EmptyState';
import agents from '@neryva_data/products/agent_studio/agents.json';

import {
  PageRoot,
  PageHeader,
  PageTitle,
  PageSubtitle,
  Toolbar,
  FilterGroup,
  FilterChip,
  PrimaryButton,
  TableWrap,
  TableHeader,
  TableRow,
  Cell,
  AgentMain,
  AgentName,
  AgentDesc,
  ModelTag,
  SparkCell,
  VolumeCell,
  ProgressCell,
  ActionsCell,
  ActionButton,
} from './AgentsView.styles';

type AgentStatus = 'all' | 'active' | 'paused' | 'draft';
type Agent = (typeof agents.agents)[number];

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0, transition: { duration: 0.55, ease: premiumEase, delay: i * 0.05 },
  }),
};

const statusTone: Record<Agent['status'], 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  paused: 'warning',
  draft: 'neutral',
};

const toneToBar: Record<string, 'azure' | 'emerald' | 'lilac' | 'amber'> = {
  azure: 'azure',
  emerald: 'emerald',
  lilac: 'lilac',
  warning: 'amber',
};

export function AgentsView() {
  const [filter, setFilter] = useState<AgentStatus>('all');
  const [search, setSearch] = useState('');

  const list = useMemo(() => {
    return agents.agents.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [filter, search]);

  return (
    <PageRoot>
      <PageHeader
        as={motion.div}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <PageTitle>Agents</PageTitle>
        <PageSubtitle>
          Your deployed AI agents — status, performance, and configuration.
        </PageSubtitle>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <Panel
          action={
            <PrimaryButton
              as={motion.button}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => toast.success('Agent creation wizard — coming soon')}
            >
              <Plus size={14} strokeWidth={2} />
              New agent
            </PrimaryButton>
          }
        >
          <Toolbar>
            <FilterGroup>
              <Filter size={13} strokeWidth={1.7} style={{ color: 'rgba(229,231,235,0.5)' }} />
              {(['all', 'active', 'paused', 'draft'] as AgentStatus[]).map((s) => (
                <FilterChip
                  key={s}
                  $active={filter === s}
                  onClick={() => setFilter(s)}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </FilterChip>
              ))}
            </FilterGroup>
            <input
              aria-label="Search agents"
              placeholder="Search agents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                color: '#f5f7fb',
                fontSize: 13,
                padding: '6px 10px',
                minWidth: 200,
                outline: 'none',
              }}
            />
          </Toolbar>

          {list.length === 0 ? (
            <EmptyState
              title="No agents match"
              description="Try a different filter or search term."
            />
          ) : (
            <TableWrap>
              <TableHeader>
                <Cell $w="34%">Agent</Cell>
                <Cell $w="14%">Status</Cell>
                <Cell $w="16%">Model</Cell>
                <Cell $w="10%" $align="right">Volume</Cell>
                <Cell $w="13%">Latency</Cell>
                <Cell $w="13%">Resolution</Cell>
                <Cell $w="44px" />
              </TableHeader>
              {list.map((a, i) => (
                <TableRow
                  key={a.id}
                  as={motion.div}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  custom={i + 2}
                >
                  <Cell $w="34%">
                    <AgentMain>
                      <AgentName>{a.name}</AgentName>
                      <AgentDesc>{a.description}</AgentDesc>
                      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                        {a.channels.map((c) => (
                          <ModelTag key={c}>{c}</ModelTag>
                        ))}
                      </div>
                    </AgentMain>
                  </Cell>
                  <Cell $w="14%">
                    <StatusPill tone={statusTone[a.status]}>{a.status}</StatusPill>
                  </Cell>
                  <Cell $w="16%">
                    <ModelTag>{a.model}</ModelTag>
                  </Cell>
                  <Cell $w="10%" $align="right">
                    <VolumeCell>{a.volume.toLocaleString()}</VolumeCell>
                  </Cell>
                  <Cell $w="13%">
                    <SparkCell>{a.status === 'draft' ? '—' : `${(a.responseMs / 1000).toFixed(2)}s`}</SparkCell>
                  </Cell>
                  <Cell $w="13%">
                    <ProgressCell>
                      <ProgressBar
                        value={a.resolution}
                        tone={toneToBar[a.tone] ?? 'azure'}
                      />
                      <span style={{ fontSize: 11.5, color: 'rgba(229,231,235,0.55)' }}>{a.resolution}%</span>
                    </ProgressCell>
                  </Cell>
                  <ActionsCell>
                    <ActionButton
                      aria-label={`Actions for ${a.name}`}
                      onClick={() => toast(`Actions for ${a.name}`, { icon: '⚙️' })}
                    >
                      <MoreHorizontal size={15} strokeWidth={1.7} />
                    </ActionButton>
                  </ActionsCell>
                </TableRow>
              ))}
            </TableWrap>
          )}
        </Panel>
      </motion.div>
    </PageRoot>
  );
}
