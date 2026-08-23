import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, X, MessagesSquare } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { EmptyState } from '@components/common/ui/EmptyState';
import { SearchField } from '@components/common/ui/SearchField';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import conversations from '@neryva_data/products/agent_studio/conversations.json';

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
  RowAgent,
  RowChannel,
  Rating,
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

type StatusKey = 'resolved' | 'open' | 'escalated';

const statusTone: Record<StatusKey, 'success' | 'info' | 'warning'> = {
  resolved: 'success',
  open: 'info',
  escalated: 'warning',
};

export function ConversationsView() {
  const data = conversations;
  const [agentFilter, setAgentFilter] = useState(data.agents[0]);
  const [statusFilter, setStatusFilter] = useState(data.statuses[0]);
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(data.conversations[0].id);

  const list = useMemo(() => {
    return data.conversations.filter((c) => {
      if (agentFilter !== 'All agents' && c.agent !== agentFilter) return false;
      if (statusFilter !== 'All') {
        const map: Record<string, StatusKey> = { Resolved: 'resolved', Open: 'open', Escalated: 'escalated' };
        if (c.status !== map[statusFilter]) return false;
      }
      if (query.trim()) {
        const q = query.toLowerCase();
        return c.user.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q);
      }
      return true;
    });
  }, [agentFilter, statusFilter, query, data]);

  const active = activeId ? data.conversations.find((c) => c.id === activeId) : undefined;

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Conversations</ViewTitle>
        <ViewSubtitle>Review transcripts, outcomes, and escalations across every channel.</ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Layout>
          <ListPane>
            <Filters>
              <FilterSelect
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                aria-label="Filter by agent"
              >
                {data.agents.map((a) => <option key={a}>{a}</option>)}
              </FilterSelect>
              <FilterSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                {data.statuses.map((s) => <option key={s}>{s}</option>)}
              </FilterSelect>
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder="Search…"
                ariaLabel="Search conversations"
              />
            </Filters>

            {list.length === 0 ? (
              <EmptyState title="No conversations" description="Adjust your filters to see more." />
            ) : (
              <List>
                {list.map((c, i) => (
                  <Row
                    key={c.id}
                    type="button"
                    $active={c.id === activeId}
                    aria-current={c.id === activeId ? 'true' : undefined}
                    onClick={() => setActiveId(c.id)}
                    as={motion.button}
                    initial="hidden"
                    animate="visible"
                    variants={pageItem}
                    custom={i}
                  >
                    <RowMain>
                      <RowTop>
                        <RowUser>{c.user}</RowUser>
                        <RowTime>{c.time}</RowTime>
                      </RowTop>
                      <RowPreview>{c.preview}</RowPreview>
                      <RowMeta>
                        <RowAgent>{c.agent}</RowAgent>
                        <RowChannel>· {c.channel}</RowChannel>
                        <StatusPill tone={statusTone[c.status as StatusKey]} dot={false}>
                          {c.status}
                        </StatusPill>
                        {c.rating > 0 && (
                          <Rating>
                            <Star size={11} fill="#fbbf24" strokeWidth={0} aria-label={`${c.rating} star rating`} />
                            {c.rating}
                          </Rating>
                        )}
                      </RowMeta>
                    </RowMain>
                  </Row>
                ))}
              </List>
            )}
          </ListPane>

          <DetailPane>
            {active ? (
              <Panel
                title={
                  <DetailTitle>
                    {active.user}
                    <DetailTitleAgent>· {active.agent}</DetailTitleAgent>
                  </DetailTitle>
                }
                subtitle={
                  <DetailHeader>
                    <DetailMeta>
                      <StatusPill tone={statusTone[active.status as StatusKey]} dot={false}>
                        {active.status}
                      </StatusPill>
                      <span>{active.channel}</span>
                      <span>·</span>
                      <span>{active.messages} messages</span>
                      <span>·</span>
                      <span>{active.duration}</span>
                    </DetailMeta>
                    <DetailClose aria-label="Close detail" onClick={() => setActiveId(null)}>
                      <X size={14} strokeWidth={1.7} />
                    </DetailClose>
                  </DetailHeader>
                }
              >
                <Transcript>
                  {active.transcript.map((m, i) => (
                    <Bubble
                      key={i}
                      $role={m.role as 'user' | 'agent'}
                      as={motion.div}
                      initial="hidden"
                      animate="visible"
                      variants={pageItem}
                      custom={i}
                    >
                      <BubbleMeta>{m.role === 'user' ? active.user : active.agent}</BubbleMeta>
                      <BubbleText>{m.text}</BubbleText>
                    </Bubble>
                  ))}
                </Transcript>
              </Panel>
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
    </ViewShell>
  );
}
