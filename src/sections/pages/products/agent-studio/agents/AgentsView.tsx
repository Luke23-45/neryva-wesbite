import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { Plus, MoreHorizontal, Pencil, MessageSquare, Copy as CopyIcon, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { Segmented } from '@components/common/ui/Segmented';
import { SearchField } from '@components/common/ui/SearchField';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
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
import { useAssistantsPage, type AssistantPageCursor } from '@hooks/studio/useAssistants';
import { useDeleteAssistant } from '@hooks/studio/useAgentAuthoring';
import { useFleetKnowledgeHealth } from '@hooks/studio/useFleetHealth';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';

import {
  AgentMain,
  AgentName,
  AgentDesc,
  ModelTag,
  RowMenuButton,
  ToolbarArea,
  PagerRow,
} from './AgentsView.styles';

/**
 * Agents (ledger A-1/A-2) — live engine assistants with clone,
 * edit-deep-link, and the test entry point. Creation moved to the guided
 * builder (/agents/new, C01) — the inline modal is retired, not relocated.
 * Telemetry columns moved out — per-agent metrics are their own task (A-9)
 * and were previously invented.
 */

type Sort = 'newest' | 'name';
const sortOptions: { value: Sort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name' },
];

export function AgentsView() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const navigate = useNavigate();
  const { role } = useOrg();
  const canClone = canSetup(role, 'setup:author');
  const cloneDenied = setupDeniedCopy(role, 'setup:author');
  // Z-011: delete is owner/admin-only server-side — the row menu mirrors
  // the gate instead of walking non-governors into a 403.
  const canDelete = canSetup(role, 'setup:govern');
  const deleteDenied = setupDeniedCopy(role, 'setup:govern');
  // Fleet-wide list for health badges (badges need the whole fleet, not the
  // visible page). The table below reads the paged query instead.
  const assistants = useAssistants();

  // Server-driven search + sort + cursor pages. The search box stays
  // immediate for typing; the query goes out debounced. Any filter change
  // restarts from page one (a cursor from another filter is meaningless).
  const [debouncedQ, setDebouncedQ] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(search);
      setCursors([null]);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const [cursors, setCursors] = useState<(AssistantPageCursor | null)[]>([null]);
  const cursor = cursors[cursors.length - 1] ?? null;
  const page = useAssistantsPage({ sort, q: debouncedQ, cursor });

  // Fleet health at a glance (G11): shared hook — same query keys as the
  // Overview, one cache, never refetched per surface.
  const degradedById = useFleetKnowledgeHealth(assistants.data);

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
        <Panel flush>
          <ToolbarArea>
            <Toolbar>
              <ToolbarGroup>
                <Segmented
                  options={sortOptions}
                  value={sort}
                  onChange={(v) => {
                    setSort(v);
                    setCursors([null]);
                  }}
                  size="md"
                  ariaLabel="Sort agents"
                />
                <SearchField
                  value={search}
                  onChange={setSearch}
                  placeholder="Search agents…"
                  ariaLabel="Search agents"
                  width={240}
                />
              </ToolbarGroup>
              <ToolbarGroup>
                <ActionButton size="sm" onClick={() => navigate({ to: '/agent-studio/agents/new' })}>
                  <Plus size={14} strokeWidth={2} />
                  New agent
                </ActionButton>
              </ToolbarGroup>
            </Toolbar>
          </ToolbarArea>

          <QueryView
            query={page}
            skeleton={<Skeleton $h="280px" $r="12px" />}
            isEmpty={(d) => d.assistants.length === 0}
            empty={{ title: debouncedQ ? 'No agents match' : 'No agents yet', description: debouncedQ ? 'Try a different search term.' : 'Create your first agent — pick a template and make it yours.' }}
          >
            {(data) => {
              const nextCursor = data.nextCursor;
              return (
              <>
              <DataTable>
                <DataHead>
                  <DataCell $w="44%">Agent</DataCell>
                  <DataCell $w="14%">Status</DataCell>
                  <DataCell $w="18%">Model</DataCell>
                  <DataCell $w="18%">Updated</DataCell>
                  <DataCell $w="44px" />
                </DataHead>
                {data.assistants.map((a, i) => (
                  <AgentRow
                    key={a.id}
                    agent={a}
                    degraded={degradedById.get(a.id) === true}
                    index={i}
                    onOpen={() => openAgent(a.id)}
                    canClone={canClone}
                    cloneDenied={cloneDenied}
                    canDelete={canDelete}
                    deleteDenied={deleteDenied}
                    onClone={() => navigate({ to: '/agent-studio/agents/clone', search: { sourceId: a.id, returnTo: '/agent-studio/agents' } })}
                  />
                ))}
              </DataTable>
              <PagerRow>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  disabled={cursors.length <= 1}
                  onClick={() => setCursors((c) => c.slice(0, -1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={13} />
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  size="sm"
                  disabled={!nextCursor}
                  onClick={() => nextCursor && setCursors((c) => [...c, nextCursor])}
                  aria-label="Next page"
                >
                  <ChevronRight size={13} />
                </ActionButton>
              </PagerRow>
              </>
              );
            }}
          </QueryView>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}

function AgentRow({
  agent,
  degraded,
  index,
    onOpen,
    canClone,
    cloneDenied,
    canDelete,
    deleteDenied,
    onClone,
  }: {
    agent: AssistantSummary;
    degraded: boolean;
    index: number;
    onOpen: () => void;
    canClone: boolean;
    cloneDenied: string;
    canDelete: boolean;
    deleteDenied: string;
    onClone: () => void;
  }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const deleteAssistant = useDeleteAssistant();
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
        <StatusPill tone={agent.status === 'live' ? 'success' : agent.status === 'disabled' ? 'warning' : 'neutral'}>{agent.status}</StatusPill>
        {degraded && (
          <span title="Knowledge pins unresolved or not READY — open the agent to map documents">
            {' '}<StatusPill tone="warning" dot={false}>degraded</StatusPill>
          </span>
        )}
      </DataCell>
      <DataCell $w="18%">
        {agent.model ? <ModelTag>{agent.model}</ModelTag> : <span style={{ opacity: 0.4 }}>—</span>}
      </DataCell>
      <DataCell $w="18%">
        {agent.updatedAt ? <span style={{ opacity: 0.75 }}>{agent.updatedAt.slice(0, 16).replace('T', ' ')}</span> : <span style={{ opacity: 0.4 }}>—</span>}
      </DataCell>
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
                      // Edit opens the creation page repopulated (?edit=):
                      // same surface, same flow — saving updates the agent.
                      navigate({ to: '/agent-studio/agents/new', search: { edit: agent.id } });
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
                    disabled={!canClone}
                    title={canClone ? 'Pick a source, name the copy' : cloneDenied}
                    onClick={() => {
                      setMenuOpen(false);
                      onClone();
                    }}
                  >
                    <CopyIcon size={13} strokeWidth={1.7} />
                    Clone
                  </RowMenuItem>
                  <RowMenuItem
                    type="button"
                    role="menuitem"
                    disabled={!canDelete}
                    title={canDelete ? 'Delete this agent' : deleteDenied}
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteConfirm(true);
                    }}
                  >
                    <Trash2 size={13} strokeWidth={1.7} />
                    Delete
                  </RowMenuItem>
                </RowMenu>
              )}
            </AnimatePresence>
            <ConfirmDialog
              open={deleteConfirm}
              title='Delete this agent?'
              message='This removes the agent, all its versions, and its archived conversations. Active conversations must be archived first.'
              destructive
              confirmLabel='Delete'
              onConfirm={() => {
                deleteAssistant.mutate(agent.id);
                setDeleteConfirm(false);
              }}
              onCancel={() => setDeleteConfirm(false)}
            />
          </div>
        </DataCell>
      </DataRow>
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
