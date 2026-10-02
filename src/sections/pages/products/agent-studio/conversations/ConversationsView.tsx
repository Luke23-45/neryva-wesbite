import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type { UseQueryResult } from '@tanstack/react-query';
import { X, MessagesSquare, Archive, RotateCcw } from 'lucide-react';
import { useOrg } from '@/Context/OrgContext';
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
import { useConversationsPaged, type ConversationSummary } from '@hooks/studio/useStudioConversations';
import { displayConversationTitle } from '@/lib/conversationTitles';
import {
  useConversationMessages,
  useConversationRuns,
  useUpdateConversationStatus,
  describeRunsCount,
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

  // C1 — cursor-paginated list ("load more", newest first): the old silent
  // 50-cap with no way to reach older threads is gone.
  const paged = useConversationsPaged();
  // C6 — archiving is owner/admin-only server-side; the buttons don't render
  // for other roles instead of failing loudly on click.
  const { canManageMembers } = useOrg();
  const updateStatus = useUpdateConversationStatus();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  // C5 — the engine supports restore (status='active'); this is its surface.
  const [restoreConfirm, setRestoreConfirm] = useState(false);

  // Flattened across loaded pages, newest first (each page arrives ordered).
  const serverRows = useMemo(
    () => (paged.data?.pages ?? []).flatMap((page) => page.items),
    [paged.data],
  );
  const hasMore = paged.hasNextPage ?? false;

  const statuses = useMemo(() => {
    const present = new Set(serverRows.map((c) => c.status).filter((s): s is string => !!s));
    return ['All', ...[...present].sort()];
  }, [serverRows]);

  // Display labels: capitalize status values ("active" → "Active") for HIG polish.
  // The underlying filter value stays as-is so the comparison still matches.
  const statusLabel = (s: string) => (s === 'All' ? s : s.charAt(0).toUpperCase() + s.slice(1));

  const list = useMemo(() => {
    return serverRows.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return c.title.toLowerCase().includes(q) || (c.agentName?.toLowerCase().includes(q) ?? false);
      }
      return true;
    });
  }, [serverRows, statusFilter, query]);

  const active: ConversationSummary | null =
    activeId ? serverRows.find((c) => c.id === activeId) ?? null : null;

  const openConversation = (id: string | null) => {
    // Route search schemas aren't declared per-route — contained cast (see useUrlState).
    // Omit the param entirely when closing (id === null) — never write the literal string "null".
    navigate({ search: (id === null ? {} : { chat: id }) as never, replace: true });
  };

  // QueryView only reads isPending/isError/data/refetch — flatten the
  // infinite pages into the shape it expects.
  const flatQuery = { ...paged, data: serverRows } as unknown as UseQueryResult<ConversationSummary[]>;

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
                {statuses.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </FilterSelect>
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder="Search…"
                ariaLabel="Search conversations"
              />
            </Filters>

            <QueryView
              query={flatQuery}
              skeleton={<Skeleton $h="320px" $r="12px" />}
              isEmpty={(d) => d.length === 0}
              empty={{ title: 'No conversations', description: 'Threads appear here as your agents carry conversations.' }}
            >
              {(rows) => (list.length === 0 ? (
                <EmptyState
                  title="No conversations match"
                  description={
                    hasMore
                      ? `No matches in the ${rows.length} loaded — load more below or adjust your filters.`
                      : 'No conversations match these filters.'
                  }
                />
              ) : (
                <>
                  <ListCaption>
                    {rows.length} loaded{hasMore ? ' — showing most recent first' : ''}
                  </ListCaption>
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
                            <RowUser>{displayConversationTitle(c.title, c.updatedAt)}</RowUser>
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
                  {hasMore && (
                    <LoadMoreWrap>
                      <ActionButton
                        variant="secondary"
                        size="sm"
                        disabled={paged.isFetchingNextPage}
                        onClick={() => void paged.fetchNextPage()}
                      >
                        {paged.isFetchingNextPage ? 'Loading…' : 'Load more'}
                      </ActionButton>
                    </LoadMoreWrap>
                  )}
                </>
              ))}
            </QueryView>
          </ListPane>

          <DetailPane>
            {active ? (
              <ConversationDetail
                conversation={active}
                canManage={canManageMembers}
                onArchive={() => setArchiveConfirm(true)}
                onRestore={() => setRestoreConfirm(true)}
                onClose={() => openConversation(null)}
                statusPending={updateStatus.isPending}
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
        message={active ? `"${displayConversationTitle(active.title, active.updatedAt)}" moves out of the active list. The transcript is kept.` : ''}
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
      <ConfirmDialog
        open={restoreConfirm}
        title="Restore this conversation?"
        message={active ? `"${displayConversationTitle(active.title, active.updatedAt)}" moves back to the active list.` : ''}
        confirmLabel="Restore"
        onConfirm={() => {
          if (active) {
            updateStatus.mutate(
              { conversationId: active.id, status: 'active' },
              { onSuccess: () => openConversation(null) },
            );
          }
          setRestoreConfirm(false);
        }}
        onCancel={() => setRestoreConfirm(false)}
      />
    </ViewShell>
  );
}

function ConversationDetail({
  conversation,
  canManage,
  onArchive,
  onRestore,
  onClose,
  statusPending,
}: {
  conversation: ConversationSummary;
  /** C6 — archive/restore/delete are owner/admin-only; buttons hidden otherwise. */
  canManage: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onClose: () => void;
  statusPending: boolean;
}) {
  const messages = useConversationMessages(conversation.id);
  const runs = useConversationRuns(conversation.id);

  return (
    <Panel
      title={
        <DetailTitle>
          {displayConversationTitle(conversation.title, conversation.updatedAt)}
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
            {runs.data && runs.data.length > 0 && <span>{describeRunsCount(runs.data.length)}</span>}
          </DetailMeta>
          <DetailCloseWrap>
            {canManage && conversation.status === 'archived' && (
              <ActionButton variant="secondary" size="sm" disabled={statusPending} onClick={onRestore}>
                <RotateCcw size={12} strokeWidth={1.8} />
                Restore
              </ActionButton>
            )}
            {canManage && conversation.status !== 'archived' && (
              <ActionButton variant="secondary" size="sm" disabled={statusPending} onClick={onArchive}>
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

// C1 — honest list accounting: how many threads are loaded, and whether
// older ones are still behind "Load more".
const ListCaption = styled.div`
  font-size: 12px;
  opacity: 0.6;
  padding: 4px 2px 8px;
`;

const LoadMoreWrap = styled.div`
  display: flex;
  justify-content: center;
  padding: 12px 0 4px;
`;

function relativeDay(iso: string): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) {
    return iso;
  }
  return new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
