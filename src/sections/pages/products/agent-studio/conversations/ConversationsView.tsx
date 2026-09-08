import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { X, MessagesSquare, Archive } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { EmptyState } from '@components/common/ui/EmptyState';
import { SearchField } from '@components/common/ui/SearchField';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import { useConversations, type ConversationSummary } from '@hooks/studio/useStudioConversations';
import {
  useConversationMessages,
  useConversationRuns,
  useUpdateConversationStatus,
} from '@hooks/studio/useChat';

import {
  Layout,
  ListPane,
  Filters,
  FilterSelect,
  List,
  Row,
  RowMain,
  RowTop,
  RowUser,
  RowTime,
  RowPreview,
  RowMeta,
  DetailPane,
  DetailHeader,
  DetailMeta,
  DetailTitle,
  DetailTitleAgent,
  DetailClose,
  Transcript,
  Bubble,
  BubbleMeta,
  BubbleText,
} from './ConversationsView.styles';

/**
 * Conversations (ledger C-7) — real transcripts from the engine's
 * conversations module, honoring the `?chat=<id>` deep-link contract the
 * sidebar recents and command palette use. Star ratings and channels were
 * fabricated before — the engine doesn't carry them, so they're gone.
 * Status changes (archive/restore) run through the engine's status
 * endpoint; escalation flows live with the runtime (ledger C-8/R-4).
 */

export function ConversationsView() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { chat?: string };
  const activeId = search.chat ?? null;

  const conversations = useConversations();
  const updateStatus = useUpdateConversationStatus();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [archiveConfirm, setArchiveConfirm] = useState(false);

  const statuses = useMemo(() => {
    const present = new Set((conversations.data ?? []).map((c) => c.status).filter((s): s is string => !!s));
    return ['All', ...[...present].sort()];
  }, [conversations.data]);

  const list = useMemo(() => {
    return (conversations.data ?? []).filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return c.title.toLowerCase().includes(q) || (c.agentName?.toLowerCase().includes(q) ?? false);
      }
      return true;
    });
  }, [conversations.data, statusFilter, query]);

  const active: ConversationSummary | null =
    activeId ? (conversations.data ?? []).find((c) => c.id === activeId) ?? null : null;

  const openConversation = (id: string | null) => {
    // Route search schemas aren't declared per-route — contained cast (see useUrlState).
    navigate({ search: (() => ({ chat: id })) as never, replace: true });
  };

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Conversations</ViewTitle>
        <ViewSubtitle>Every thread your agents have carried, with the full transcript.</ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Layout>
          <ListPane>
            <Filters>
              <FilterSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                {statuses.map((s) => <option key={s}>{s}</option>)}
              </FilterSelect>
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder="Search…"
                ariaLabel="Search conversations"
              />
            </Filters>

            <QueryView
              query={conversations}
              skeleton={<Skeleton $h="320px" $r="12px" />}
              isEmpty={(d) => d.length === 0}
              empty={{ title: 'No conversations', description: 'Threads appear here as your agents carry conversations.' }}
            >
              {(serverRows) => (list.length === 0 ? (
                <EmptyState title="No conversations match" description={`${serverRows.length} conversation${serverRows.length === 1 ? '' : 's'} loaded — adjust your filters to see more.`} />
              ) : (
                <List>
                  {list.map((c, i) => (
                    <Row
                      key={c.id}
                      type="button"
                      $active={c.id === activeId}
                      aria-current={c.id === activeId ? 'true' : undefined}
                      onClick={() => openConversation(c.id)}
                      as={motion.button}
                      initial="hidden"
                      animate="visible"
                      variants={pageItem}
                      custom={i}
                    >
                      <RowMain>
                        <RowTop>
                          <RowUser>{c.title}</RowUser>
                          <RowTime>{c.updatedAt ? relativeDay(c.updatedAt) : ''}</RowTime>
                        </RowTop>
                        <RowPreview>{c.agentName ?? 'Unassigned agent'}</RowPreview>
                        <RowMeta>
                          {c.status && (
                            <StatusPill tone={c.status === 'active' ? 'info' : c.status === 'archived' ? 'neutral' : 'warning'} dot={false}>
                              {c.status}
                            </StatusPill>
                          )}
                        </RowMeta>
                      </RowMain>
                    </Row>
                  ))}
                </List>
              ))}
            </QueryView>
          </ListPane>

          <DetailPane>
            {active ? (
              <ConversationDetail
                conversation={active}
                onArchive={() => setArchiveConfirm(true)}
                onClose={() => openConversation(null)}
                archivePending={updateStatus.isPending}
              />
            ) : (
              <Panel>
                <EmptyState
                  icon={<MessagesSquare size={26} strokeWidth={1.5} />}
                  title="No conversation selected"
                  description="Pick a conversation from the list to read its transcript."
                />
              </Panel>
            )}
          </DetailPane>
        </Layout>
      </motion.div>

      <ConfirmDialog
        open={archiveConfirm}
        title="Archive this conversation?"
        message={active ? `"${active.title}" moves out of the active list. The transcript is kept.` : ''}
        confirmLabel="Archive"
        onConfirm={() => {
          if (active) {
            updateStatus.mutate(
              { conversationId: active.id, status: 'archived' },
              { onSuccess: () => openConversation(null) },
            );
          }
          setArchiveConfirm(false);
        }}
        onCancel={() => setArchiveConfirm(false)}
      />
    </ViewShell>
  );
}

function ConversationDetail({
  conversation,
  onArchive,
  onClose,
  archivePending,
}: {
  conversation: ConversationSummary;
  onArchive: () => void;
  onClose: () => void;
  archivePending: boolean;
}) {
  const messages = useConversationMessages(conversation.id);
  const runs = useConversationRuns(conversation.id);

  return (
    <Panel
      title={
        <DetailTitle>
          {conversation.title}
          {conversation.agentName && <DetailTitleAgent>· {conversation.agentName}</DetailTitleAgent>}
        </DetailTitle>
      }
      subtitle={
        <DetailHeader>
          <DetailMeta>
            {conversation.status && (
              <StatusPill tone={conversation.status === 'active' ? 'info' : 'neutral'} dot={false}>
                {conversation.status}
              </StatusPill>
            )}
            {runs.data && runs.data.length > 0 && <span>{runs.data.length} run{runs.data.length === 1 ? '' : 's'}</span>}
          </DetailMeta>
          <DetailCloseWrap>
            {conversation.status !== 'archived' && (
              <ActionButton variant="secondary" size="sm" disabled={archivePending} onClick={onArchive}>
                <Archive size={12} strokeWidth={1.8} />
                Archive
              </ActionButton>
            )}
            <DetailClose aria-label="Close detail" onClick={onClose}>
              <X size={14} strokeWidth={1.7} />
            </DetailClose>
          </DetailCloseWrap>
        </DetailHeader>
      }
    >
      <QueryView
        query={messages}
        skeleton={<Skeleton $h="240px" $r="12px" />}
        isEmpty={(d) => d.length === 0}
        empty={{ title: 'No messages yet', description: 'The transcript fills in as turns are exchanged.' }}
      >
        {(rows) => (
          <Transcript>
            {rows.map((m, i) => (
              <Bubble
                key={m.id}
                $role={m.role}
                as={motion.div}
                initial="hidden"
                animate="visible"
                variants={pageItem}
                custom={i}
              >
                <BubbleMeta>{m.role === 'user' ? 'User' : 'Agent'}</BubbleMeta>
                <BubbleText>{m.text || '—'}</BubbleText>
              </Bubble>
            ))}
          </Transcript>
        )}
      </QueryView>
    </Panel>
  );
}


// ─── local styles ────────────────────────────────────────────────────
const DetailCloseWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

function relativeDay(iso: string): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) {
    return iso;
  }
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
