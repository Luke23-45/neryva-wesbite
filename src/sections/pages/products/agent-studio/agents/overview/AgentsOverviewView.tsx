import { useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import { ActionButton } from '@components/common/ui/ActionButton';
import { QueryView } from '@components/common/ui/AsyncStates';
import {
  ViewShell,
  ViewHeader,
  ViewHeaderRow,
  ViewTitle,
  ViewSubtitle,
} from '@components/common/ui/ViewLayout';
import { DataTable, DataHead, DataRow, DataCell } from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { useAssistants } from '@hooks/studio/useAssistants';
import { useFleetKnowledgeHealth } from '@hooks/studio/useFleetHealth';
import { useAssistantTemplates } from '@hooks/studio/useSetupTemplates';
import { useModelAvailability } from '@hooks/studio/useSetupModels';
import {
  AsideBody,
  AsideCard,
  AsideGrid,
  AsideTitle,
  HealthCard,
  HealthCount,
  HealthGrid,
  HealthLabel,
  QueueDetail,
  QueueList,
  QueueMain,
  QueueName,
  QueueRow,
  SectionTitle,
} from './AgentsOverviewView.styles';

/**
 * Agents Overview (SIDEBAR_LEDGER.md P2) — fleet health ONLY (org-level
 * roll-up lives on Dashboard per the R3 boundary). Every number derives from
 * reads that already exist: assistants list (+lifecycle passthrough),
 * fleet knowledge-health (shared cache with the list), templates, models.
 * No invented states: cards render only for data on hand (the Blocked card
 * arrives with the Blocks page in P3). Creation enters through the builder —
 * the header button routes to /agents/new (C01).
 */
export function AgentsOverviewView() {
  const navigate = useNavigate();
  const assistants = useAssistants();
  const degradedById = useFleetKnowledgeHealth(assistants.data);
  const templates = useAssistantTemplates();
  const models = useModelAvailability();

  const stats = useMemo(() => {
    const list = assistants.data ?? [];
    const degraded = list.filter((a) => degradedById.get(a.id) === true);
    const disabled = list.filter((a) => a.status === 'disabled');
    const attentionIds = new Set([...degraded.map((a) => a.id), ...disabled.map((a) => a.id)]);
    return {
      total: list.length,
      live: list.filter((a) => a.status === 'live').length,
      draft: list.filter((a) => a.status === 'new').length,
      degraded,
      disabled,
      attention: attentionIds.size,
    };
  }, [assistants.data, degradedById]);

  const queue = useMemo(() => {
    const rows: Array<{ id: string; name: string; kind: 'degraded' | 'disabled'; detail: string }> = [];
    for (const a of stats.degraded) {
      rows.push({
        id: a.id,
        name: a.name,
        kind: 'degraded',
        detail: a.degradedReason ?? 'Degraded knowledge — review pins on the agent page',
      });
    }
    for (const a of stats.disabled) {
      if (rows.some((r) => r.id === a.id)) continue;
      rows.push({
        id: a.id,
        name: a.name,
        kind: 'disabled',
        detail: a.disabledReason ?? 'Disabled — review on the agent page',
      });
    }
    return rows;
  }, [stats]);

  const recents = useMemo(() => {
    const list = [...(assistants.data ?? [])];
    list.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
    return list.slice(0, 5);
  }, [assistants.data]);

  const templateStats = useMemo(() => {
    const list = templates.data ?? [];
    return { total: list.length, compatible: list.filter((t) => t.compatible).length };
  }, [templates.data]);

  const modelStats = useMemo(() => {
    const list = models.data ?? [];
    const usable = list.filter((m) => m.usable);
    const firstBlocked = list.find((m) => !m.usable);
    return { usable: usable.length, total: list.length, blockedReason: firstBlocked?.reasons[0] ?? null };
  }, [models.data]);

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Overview</ViewTitle>
          <ViewSubtitle>
            Fleet health across your agents — updated live from the same reads as the list.
          </ViewSubtitle>
        </ViewHeader>
        <ActionButton size="sm" onClick={() => navigate({ to: '/agent-studio/agents/new' })}>
          <Plus size={14} strokeWidth={2} />
          New agent
        </ActionButton>
      </ViewHeaderRow>

      <QueryView
        query={assistants}
        isEmpty={(d) => d.length === 0}
        empty={{
          title: 'No agents yet',
          description: 'Create your first agent from the All agents page — templates get you there fast.',
        }}
      >
        {() => (
          <>
            <HealthGrid as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={1}>
              <HealthCard>
                <HealthCount>{stats.live}</HealthCount>
                <HealthLabel>Live</HealthLabel>
              </HealthCard>
              <HealthCard>
                <HealthCount>{stats.draft}</HealthCount>
                <HealthLabel>Draft</HealthLabel>
              </HealthCard>
              <HealthCard>
                <HealthCount>{stats.attention}</HealthCount>
                <HealthLabel>Needs attention</HealthLabel>
              </HealthCard>
              <HealthCard>
                <HealthCount>{stats.degraded.length}</HealthCount>
                <HealthLabel>Degraded</HealthLabel>
              </HealthCard>
            </HealthGrid>

            {queue.length > 0 && (
              <>
                <SectionTitle>Needs attention · {queue.length}</SectionTitle>
                <QueueList>
                  {queue.map((row) => (
                    <QueueRow key={row.id}>
                      <StatusPill tone={row.kind === 'disabled' ? 'error' : 'warning'} dot>
                        {row.kind}
                      </StatusPill>
                      <QueueMain>
                        <QueueName>{row.name}</QueueName>
                        <QueueDetail>{row.detail}</QueueDetail>
                      </QueueMain>
                      <Link to="/agent-studio/agents/$agentId" params={{ agentId: row.id }}>
                        Review
                      </Link>
                    </QueueRow>
                  ))}
                </QueueList>
              </>
            )}

            <SectionTitle>Recently edited</SectionTitle>
            <DataTable>
              <DataHead>
                <DataCell $w="44%">Agent</DataCell>
                <DataCell $w="18%">Status</DataCell>
                <DataCell $w="24%">Updated</DataCell>
                <DataCell $w="44px" />
              </DataHead>
              {recents.map((a) => (
                <DataRow key={a.id}>
                  <DataCell>{a.name}</DataCell>
                  <DataCell>
                    <StatusPill
                      tone={a.status === 'live' ? 'success' : a.status === 'disabled' ? 'error' : 'info'}
                      dot={false}
                    >
                      {a.status === 'new' ? 'Draft' : a.status === 'live' ? 'Live' : 'Disabled'}
                    </StatusPill>
                  </DataCell>
                  <DataCell>{a.updatedAt ? a.updatedAt.slice(0, 16).replace('T', ' ') : '—'}</DataCell>
                  <DataCell>
                    <Link to="/agent-studio/agents/$agentId" params={{ agentId: a.id }}>
                      Open
                    </Link>
                  </DataCell>
                </DataRow>
              ))}
            </DataTable>

            <AsideGrid>
              <AsideCard>
                <AsideTitle>Start from a template</AsideTitle>
                <AsideBody>
                  {templates.isPending
                    ? 'Loading template counts…'
                    : `${templateStats.total} curated starting points · ${templateStats.compatible} compatible — never blocked.`}{' '}
                  <Link to="/agent-studio/templates">Browse templates</Link>
                </AsideBody>
              </AsideCard>
              <AsideCard>
                <AsideTitle>Models you can use</AsideTitle>
                <AsideBody>
                  {models.isPending
                    ? 'Loading model availability…'
                    : `${modelStats.usable} of ${modelStats.total} usable${
                        modelStats.blockedReason ? ` — first gap: ${modelStats.blockedReason}` : ''
                      }.`}{' '}
                  <Link to="/agent-studio/models">Manage</Link>
                </AsideBody>
              </AsideCard>
            </AsideGrid>
          </>
        )}
      </QueryView>
    </ViewShell>
  );
}
