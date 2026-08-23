import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { Plus, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ProgressBar } from '@components/common/ui/ProgressBar';
import { EmptyState } from '@components/common/ui/EmptyState';
import { Modal } from '@components/common/ui/Modal';
import { Segmented, type SegmentedOption } from '@components/common/ui/Segmented';
import { SearchField } from '@components/common/ui/SearchField';
import { ActionButton } from '@components/common/ui/ActionButton';
import {
  ViewShell,
  ViewHeader,
  ViewTitle,
  ViewSubtitle,
  Toolbar,
  ToolbarGroup,
} from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
  CellMono,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import agents from '@neryva_data/products/agent_studio/agents.json';

import {
  AgentMain,
  AgentName,
  AgentDesc,
  ChannelRow,
  ModelTag,
  ProgressCell,
  ProgressLabel,
  RowMenuButton,
  ModalIntro,
  TemplateGrid,
  TemplateCard,
  TemplateIcon,
  TemplateTitle,
  TemplateDesc,
  ToolbarArea,
} from './AgentsView.styles';

type AgentStatus = 'all' | 'active' | 'paused' | 'draft';
type Agent = (typeof agents.agents)[number];

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

const filterOptions: SegmentedOption<AgentStatus>[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'draft', label: 'Draft' },
];

const TEMPLATES = [
  { title: 'Support concierge', desc: 'Billing & account help', hue: 'lilac' },
  { title: 'Onboarding guide', desc: 'Walk new customers through setup', hue: 'emerald' },
  { title: 'Sales researcher', desc: 'Prospect briefs for AEs', hue: 'azure' },
  { title: 'Voice concierge', desc: 'Phone support with TTS', hue: 'azure' },
  { title: 'Refund specialist', desc: 'Process refunds within policy', hue: 'amber' },
  { title: 'Blank agent', desc: 'Build from scratch', hue: 'neutral' },
];

export function AgentsView() {
  const [filter, setFilter] = useState<AgentStatus>('all');
  const [search, setSearch] = useState('');
  const [newAgentOpen, setNewAgentOpen] = useState(false);
  const navigate = useNavigate();

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

  const openAgent = (id: string) =>
    navigate({ to: '/agent-studio/agents/$agentId', params: { agentId: id } });

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Agents</ViewTitle>
        <ViewSubtitle>
          Your deployed AI agents — status, performance, and configuration.
        </ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel
          flush
          action={
            <ActionButton size="sm" onClick={() => setNewAgentOpen(true)}>
              <Plus size={14} strokeWidth={2} />
              New agent
            </ActionButton>
          }
        >
          <ToolbarArea>
            <Toolbar>
              <ToolbarGroup>
                <Segmented
                  options={filterOptions}
                  value={filter}
                  onChange={setFilter}
                  size="md"
                  ariaLabel="Filter agents by status"
                />
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder="Search agents…"
                  ariaLabel="Search agents"
                />
              </ToolbarGroup>
            </Toolbar>
          </ToolbarArea>

          {list.length === 0 ? (
            <div style={{ padding: '0 22px 22px' }}>
              <EmptyState
                title="No agents match"
                description="Try a different filter or search term."
              />
            </div>
          ) : (
            <DataTable>
              <DataHead>
                <DataCell $w="34%">Agent</DataCell>
                <DataCell $w="12%">Status</DataCell>
                <DataCell $w="16%">Model</DataCell>
                <DataCell $w="10%" $align="right">Volume</DataCell>
                <DataCell $w="12%">Latency</DataCell>
                <DataCell $w="16%">Resolution</DataCell>
                <DataCell $w="44px" />
              </DataHead>
              {list.map((a, i) => (
                <DataRow
                  key={a.id}
                  as={motion.div}
                  initial="hidden"
                  animate="visible"
                  variants={pageItem}
                  custom={i + 2}
                  onClick={() => openAgent(a.id)}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openAgent(a.id);
                    }
                  }}
                >
                  <DataCell $w="34%">
                    <AgentMain>
                      <AgentName>{a.name}</AgentName>
                      <AgentDesc>{a.description}</AgentDesc>
                      <ChannelRow>
                        {a.channels.map((c) => (
                          <ModelTag key={c}>{c}</ModelTag>
                        ))}
                      </ChannelRow>
                    </AgentMain>
                  </DataCell>
                  <DataCell $w="12%">
                    <StatusPill tone={statusTone[a.status]}>{a.status}</StatusPill>
                  </DataCell>
                  <DataCell $w="16%">
                    <ModelTag>{a.model}</ModelTag>
                  </DataCell>
                  <DataCell $w="10%" $align="right">
                    <CellMono>{a.volume.toLocaleString()}</CellMono>
                  </DataCell>
                  <DataCell $w="12%">
                    <CellMono>
                      {a.status === 'draft' ? '—' : `${(a.responseMs / 1000).toFixed(2)}s`}
                    </CellMono>
                  </DataCell>
                  <DataCell $w="16%">
                    <ProgressCell>
                      <ProgressBar
                        value={a.resolution}
                        tone={toneToBar[a.tone] ?? 'azure'}
                      />
                      <ProgressLabel>{a.resolution}%</ProgressLabel>
                    </ProgressCell>
                  </DataCell>
                  <DataCell $w="44px">
                    <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <RowMenuButton
                        aria-label={`Actions for ${a.name}`}
                        onClick={() => toast(`Actions for ${a.name}`, { icon: '⚙️' })}
                      >
                        <MoreHorizontal size={15} strokeWidth={1.7} />
                      </RowMenuButton>
                    </div>
                  </DataCell>
                </DataRow>
              ))}
            </DataTable>
          )}
        </Panel>
      </motion.div>

      <Modal
        open={newAgentOpen}
        onClose={() => setNewAgentOpen(false)}
        title="Create a new agent"
        footer={
          <ActionButton variant="ghost" size="sm" onClick={() => setNewAgentOpen(false)}>
            Cancel
          </ActionButton>
        }
      >
        <ModalIntro>
          Start from a template — you can customize the system prompt, tools, and guardrails after.
        </ModalIntro>
        <TemplateGrid>
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.title}>
              <TemplateIcon $hue={t.hue} aria-hidden="true" />
              <TemplateTitle>{t.title}</TemplateTitle>
              <TemplateDesc>{t.desc}</TemplateDesc>
              <ActionButton
                variant="secondary"
                size="sm"
                style={{ alignSelf: 'flex-start', marginTop: 4 }}
                onClick={() => {
                  toast.success(`Created ${t.title} — opening editor`);
                  setNewAgentOpen(false);
                }}
              >
                Use template
              </ActionButton>
            </TemplateCard>
          ))}
        </TemplateGrid>
      </Modal>
    </ViewShell>
  );
}
