import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Star, X } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { EmptyState } from '@components/common/ui/EmptyState';
import conversations from '@neryva_data/products/agent_studio/conversations.json';

import {
  PageRoot,
  PageHeader,
  PageTitle,
  PageSubtitle,
  Layout,
  ListPane,
  Filters,
  FilterSelect,
  FilterSearchWrap,
  FilterSearchIcon,
  FilterSearch,
  List,
  Row,
  RowMain,
  RowTop,
  RowAgent,
  RowChannel,
  RowPreview,
  RowMeta,
  Rating,
  DetailPane,
  DetailHeader,
  DetailMeta,
  DetailTitle,
  DetailClose,
  Transcript,
  Bubble,
  BubbleMeta,
  BubbleText,
} from './ConversationsView.styles';

type StatusKey = 'resolved' | 'open' | 'escalated';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease: premiumEase, delay: i * 0.04 } }),
};

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
  const [activeId, setActiveId] = useState<string>(data.conversations[0].id);

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

  const active = data.conversations.find((c) => c.id === activeId) ?? data.conversations[0];

  return (
    <PageRoot>
      <PageHeader
        as={motion.div}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <PageTitle>Conversations</PageTitle>
        <PageSubtitle>
          Review transcripts, outcomes, and escalations across every channel.
        </PageSubtitle>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <Layout>
          <ListPane>
            <Filters>
              <FilterSelect value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
                {data.agents.map((a) => <option key={a}>{a}</option>)}
              </FilterSelect>
              <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {data.statuses.map((s) => <option key={s}>{s}</option>)}
              </FilterSelect>
              <FilterSearchWrap>
                <FilterSearchIcon><Search size={13} strokeWidth={1.7} /></FilterSearchIcon>
                <FilterSearch
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                />
              </FilterSearchWrap>
            </Filters>

            {list.length === 0 ? (
              <EmptyState title="No conversations" description="Adjust your filters to see more." />
            ) : (
              <List>
                {list.map((c, i) => (
                  <Row
                    key={c.id}
                    $active={c.id === activeId}
                    onClick={() => setActiveId(c.id)}
                    as={motion.div}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    custom={i}
                  >
                    <RowMain>
                      <RowTop>
                        <strong style={{ fontWeight: 500, color: '#f5f7fb' }}>{c.user}</strong>
                        <span style={{ fontSize: 11, color: 'rgba(229,231,235,0.4)' }}>{c.time}</span>
                      </RowTop>
                      <RowPreview>{c.preview}</RowPreview>
                      <RowMeta>
                        <RowAgent>{c.agent}</RowAgent>
                        <RowChannel>· {c.channel}</RowChannel>
                        <StatusPill tone={statusTone[c.status as StatusKey]} dot={false}>{c.status}</StatusPill>
                        {c.rating > 0 && (
                          <Rating>
                            <Star size={11} fill="#fbbf24" strokeWidth={0} />
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
            <Panel
              title={
                <DetailTitle>
                  {active.user}
                  <span style={{ fontSize: 12, color: 'rgba(229,231,235,0.5)', fontWeight: 400 }}>
                    · {active.agent}
                  </span>
                </DetailTitle>
              }
              subtitle={
                <DetailHeader>
                  <DetailMeta>
                    <StatusPill tone={statusTone[active.status as StatusKey]} dot={false}>{active.status}</StatusPill>
                    <span>{active.channel}</span>
                    <span>·</span>
                    <span>{active.messages} messages</span>
                    <span>·</span>
                    <span>{active.duration}</span>
                  </DetailMeta>
                  <DetailClose aria-label="Close detail">
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
                    variants={fadeUp}
                    custom={i}
                  >
                    <BubbleMeta>{m.role === 'user' ? active.user : active.agent}</BubbleMeta>
                    <BubbleText>{m.text}</BubbleText>
                  </Bubble>
                ))}
              </Transcript>
            </Panel>
          </DetailPane>
        </Layout>
      </motion.div>
    </PageRoot>
  );
}
