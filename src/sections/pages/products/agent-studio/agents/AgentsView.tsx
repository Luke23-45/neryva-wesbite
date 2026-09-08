import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { Plus, MoreHorizontal, Pencil, MessageSquare, Copy as CopyIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Modal } from '@components/common/ui/Modal';
import { Segmented } from '@components/common/ui/Segmented';
import { SearchField } from '@components/common/ui/SearchField';
import { TextInput } from '@components/common/ui/TextInput';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
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
} from '@components/common/ui/DataTable';
import { spring, pageItem } from '@styles/motion';
import { useAssistants, type AssistantSummary } from '@hooks/studio/useAssistants';
import { useCreateAssistant, useCloneAssistant, defaultDefinition, type AgentDefinition } from '@hooks/studio/useAgentAuthoring';

import {
  AgentMain,
  AgentName,
  AgentDesc,
  ModelTag,
  RowMenuButton,
  ModalIntro,
  TemplateGrid,
  TemplateCard,
  TemplateIcon,
  TemplateTitle,
  TemplateDesc,
  ToolbarArea,
} from './AgentsView.styles';

/**
 * Agents (ledger A-1/A-2) — live engine assistants with real create
 * (template prefill seeds the definition), clone, edit-deep-link, and the
 * test entry point. Telemetry columns moved out — per-agent metrics are
 * their own task (A-9) and were previously invented.
 */

type Sort = 'newest' | 'name';
const sortOptions: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
];

interface Template {
  title: string;
  desc: string;
  hue: string;
  instructions: string;
}

const TEMPLATES: Template[] = [
  {
    title: 'Support concierge',
    desc: 'Billing & account help',
    hue: 'lilac',
    instructions:
      'You are a support concierge for billing and account questions. Be precise, reference the customer\'s plan when relevant, and escalate anything outside policy to a human.',
  },
  {
    title: 'Onboarding guide',
    desc: 'Walk new customers through setup',
    hue: 'emerald',
    instructions:
      'You guide new customers through first-time setup, one step at a time. Confirm each step succeeded before moving on, and keep the tone warm and practical.',
  },
  {
    title: 'Sales researcher',
    desc: 'Prospect briefs for AEs',
    hue: 'azure',
    instructions:
      'You research prospects and produce short, factual briefs: company, role, likely priorities, and two conversation openers. Never speculate — mark unknowns explicitly.',
  },
  {
    title: 'Voice concierge',
    desc: 'Phone support with TTS',
    hue: 'azure',
    instructions:
      'You are a phone-based concierge. Keep replies to one or two spoken sentences, confirm details by repeating them back, and offer a human handoff when frustrated.',
  },
  {
    title: 'Refund specialist',
    desc: 'Process refunds within policy',
    hue: 'amber',
    instructions:
      'You handle refund requests strictly within published policy. Verify the order, state the decision and reasoning plainly, and log anything ambiguous for human review.',
  },
  {
    title: 'Blank agent',
    desc: 'Build from scratch',
    hue: 'neutral',
    instructions: '',
  },
];

function definitionFromTemplate(template: Template): AgentDefinition {
  const base = defaultDefinition();
  return { ...base, instructions: template.instructions };
}

export function AgentsView() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [newAgentOpen, setNewAgentOpen] = useState(false);
  const navigate = useNavigate();
  const assistants = useAssistants();
  const clone = useCloneAssistant();

  // Client-side sort over the fetched list — the engine list contract is
  // pinned at integration; server-side ordering lands with it if offered.
  const list = useMemo(() => {
    const items = [...(assistants.data ?? [])];
    if (search.trim()) {
      const q = search.toLowerCase();
      return items
        .filter((a) => a.name.toLowerCase().includes(q) || (a.description?.toLowerCase().includes(q) ?? false))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return items.sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : 0));
  }, [assistants.data, search, sort]);

  const openAgent = (id: string) =>
    navigate({ to: '/agent-studio/agents/$agentId', params: { agentId: id } });

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Agents</ViewTitle>
        <ViewSubtitle>
          Your agents — definitions, versions, and configuration. Publish to put them to work.
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
                  options={sortOptions}
                  value={sort}
                  onChange={setSort}
                  size="md"
                  ariaLabel="Sort agents"
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

          <QueryView
            query={assistants}
            skeleton={<Skeleton $h="280px" $r="12px" />}
            isEmpty={(d) => d.length === 0}
            empty={{ title: search ? 'No agents match' : 'No agents yet', description: search ? 'Try a different search term.' : 'Create your first agent — pick a template and make it yours.' }}
          >
            {(items) => (items.length === 0 ? null : (
              <DataTable>
                <DataHead>
                  <DataCell $w="44%">Agent</DataCell>
                  <DataCell $w="14%">Status</DataCell>
                  <DataCell $w="18%">Model</DataCell>
                  <DataCell $w="18%">Updated</DataCell>
                  <DataCell $w="44px" />
                </DataHead>
                {list.map((a, i) => (
                  <AgentRow
                    key={a.id}
                    agent={a}
                    index={i}
                    onOpen={() => openAgent(a.id)}
                    onClone={() => clone.mutate(
                      { assistantId: a.id },
                      {
                        onSuccess: (created) => {
                          const id = created.id ?? created.assistant_id;
                          toast.success(`Cloned "${a.name}"`);
                          if (id) {
                            navigate({ to: '/agent-studio/agents/$agentId/edit', params: { agentId: id } });
                          }
                        },
                      },
                    )}
                  />
                ))}
              </DataTable>
            ))}
          </QueryView>
        </Panel>
      </motion.div>

      <CreateAgentModal open={newAgentOpen} onClose={() => setNewAgentOpen(false)} />
    </ViewShell>
  );
}

function AgentRow({
  agent,
  index,
  onOpen,
  onClone,
}: {
  agent: AssistantSummary;
  index: number;
  onOpen: () => void;
  onClone: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <DataRow
      as={motion.div}
      initial="hidden"
      animate="visible"
      variants={pageItem}
      custom={index + 2}
      onClick={onOpen}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <DataCell $w="44%">
        <AgentMain>
          <AgentName>{agent.name}</AgentName>
          {agent.description && <AgentDesc>{agent.description}</AgentDesc>}
        </AgentMain>
      </DataCell>
      <DataCell $w="14%">
        {agent.status ? <StatusPill tone={agent.status === 'active' ? 'success' : 'neutral'}>{agent.status}</StatusPill> : <span style={{ opacity: 0.4 }}>—</span>}
      </DataCell>
      <DataCell $w="18%">
        {agent.model ? <ModelTag>{agent.model}</ModelTag> : <span style={{ opacity: 0.4 }}>—</span>}
      </DataCell>
      <DataCell $w="18%" />
      <DataCell $w="44px">
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }} ref={wrapRef}>
          <RowMenuButton
            aria-label={`Actions for ${agent.name}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MoreHorizontal size={15} strokeWidth={1.7} />
          </RowMenuButton>
          <AnimatePresence>
            {menuOpen && (
              <RowMenu
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={spring.gentle}
                role="menu"
              >
                <RowMenuItem
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate({ to: '/agent-studio/agents/$agentId/edit', params: { agentId: agent.id } });
                  }}
                >
                  <Pencil size={13} strokeWidth={1.7} />
                  Edit definition
                </RowMenuItem>
                <RowMenuItem
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate({ to: '/agent-studio/chat', search: { agent: agent.id } });
                  }}
                >
                  <MessageSquare size={13} strokeWidth={1.7} />
                  Test
                </RowMenuItem>
                <RowMenuItem
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onClone();
                  }}
                >
                  <CopyIcon size={13} strokeWidth={1.7} />
                  Clone
                </RowMenuItem>
              </RowMenu>
            )}
          </AnimatePresence>
        </div>
      </DataCell>
    </DataRow>
  );
}

function CreateAgentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<string>(TEMPLATES[TEMPLATES.length - 1].title);
  const create = useCreateAssistant();
  const navigate = useNavigate();

  const createAgent = () => {
    if (!name.trim()) {
      toast.error('Give the agent a name');
      return;
    }
    const template = TEMPLATES.find((t) => t.title === selected) ?? TEMPLATES[TEMPLATES.length - 1];
    create.mutate(
      { name: name.trim(), description: description.trim() || undefined, definition: definitionFromTemplate(template) },
      {
        onSuccess: (created) => {
          const id = created.id ?? created.assistant_id;
          toast.success(`${name.trim()} created — configure it in the editor`);
          onClose();
          if (id) {
            navigate({ to: '/agent-studio/agents/$agentId/edit', params: { agentId: id } });
          }
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a new agent"
      footer={
        <>
          <ActionButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton size="sm" disabled={!name.trim() || create.isPending} onClick={createAgent}>
            <Plus size={13} strokeWidth={2} />
            Create agent
          </ActionButton>
        </>
      }
    >
      <ModalIntro>
        Pick a starting point, name it, and the editor opens with everything prefilled — publish when it's ready.
      </ModalIntro>
      <TemplateGrid>
        {TEMPLATES.map((t) => {
          const isSelected = selected === t.title;
          return (
            <TemplateCard
              key={t.title}
              $selected={isSelected}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => setSelected(t.title)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected(t.title);
                }
              }}
            >
              <TemplateIcon $hue={t.hue} aria-hidden="true" />
              <TemplateTitle>{t.title}</TemplateTitle>
              <TemplateDesc>{t.desc}</TemplateDesc>
              {isSelected && (
                <SelectedTag>
                  <Check size={10} strokeWidth={2.4} /> selected
                </SelectedTag>
              )}
            </TemplateCard>
          );
        })}
      </TemplateGrid>
      <CreateFields>
        <TextInput label="Agent name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Billing concierge" autoFocus />
        <TextInput label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this agent does" />
      </CreateFields>
    </Modal>
  );
}

// ─── local styled additions ──────────────────────────────────────────
const RowMenu = styled(motion.div)`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 80;
  min-width: 190px;
  padding: 4px;
  border-radius: 12px;
  background: rgba(15, 17, 22, 0.96);
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
  transform-origin: top right;
`;

const RowMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.caption};
  cursor: pointer;
  text-align: left;
  color: ${({ theme }) => theme.app.text.primary};
  transition: background ${({ theme }) => theme.transitions.fast};

  svg {
    color: ${({ theme }) => theme.app.text.muted};
  }

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: -2px;
  }
`;

const SelectedTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 999px;
  background: ${({ theme }) => theme.app.status.success.bg};
  border: 1px solid ${({ theme }) => theme.app.status.success.border};
  color: ${({ theme }) => theme.app.status.success.fg};
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const CreateFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.app.border.default};
`;
