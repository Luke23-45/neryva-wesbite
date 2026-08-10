import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Search, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import activity from '@neryva_data/products/agent_studio/activity.json';
import {
  PageRoot,
  PageHeader,
  PageTitle,
  PageSubtitle,
  FilterBar,
  FilterChip,
  SearchWrap,
  SearchIconWrap,
  SearchInput,
  ExportButton,
  Group,
  GroupTitle,
  Row,
  RowTime,
  RowDot,
  RowMain,
  RowTitle,
  RowDetail,
  RowMeta,
} from './ActivityView.styles';

const premiumEase = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, ease: premiumEase, delay: i * 0.03 } }),
};

type FilterKind = 'all' | 'resolved' | 'escalation' | 'error' | 'deploy' | 'config' | 'new' | 'milestone';

export function ActivityView() {
  const [kind, setKind] = useState<FilterKind>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    return activity.events.filter((e) => {
      if (kind !== 'all' && e.kind !== kind) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.detail.toLowerCase().includes(q) ||
          e.agent.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [kind, query]);

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, e) => {
    (acc[e.date] ||= []).push(e);
    return acc;
  }, {});

  return (
    <PageRoot>
      <PageHeader
        as={motion.div}
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        custom={0}
      >
        <PageTitle>Activity</PageTitle>
        <PageSubtitle>
          Every event across your agents — escalations, deploys, integrations, and more.
        </PageSubtitle>
      </PageHeader>

      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
        <Panel
          action={
            <ExportButton type="button" onClick={() => toast.success('Exporting activity CSV…')}>
              <Download size={13} strokeWidth={1.8} />
              Export CSV
            </ExportButton>
          }
        >
          <FilterBar>
            {(['all', 'resolved', 'escalation', 'error', 'deploy', 'config', 'new', 'milestone'] as FilterKind[]).map((k) => (
              <FilterChip key={k} $active={kind === k} onClick={() => setKind(k)}>
                {k === 'all' ? 'All' : k.charAt(0).toUpperCase() + k.slice(1)}
              </FilterChip>
            ))}
            <SearchWrap>
              <SearchIconWrap><Search size={13} strokeWidth={1.7} /></SearchIconWrap>
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events…"
              />
            </SearchWrap>
          </FilterBar>

          {Object.entries(grouped).length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', fontSize: 13, color: 'rgba(229,231,235,0.5)' }}>
              No events match.
            </div>
          ) : (
            Object.entries(grouped).map(([date, events]) => (
              <Group key={date}>
                <GroupTitle>{date}</GroupTitle>
                {events.map((e, i) => (
                  <Row
                    key={e.id}
                    as={motion.div}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    custom={i}
                  >
                    <RowTime>{e.time}</RowTime>
                    <RowDot $tone={(e.tone as 'success' | 'warning' | 'error' | 'info')} aria-hidden="true" />
                    <RowMain>
                      <RowTitle>{e.title}</RowTitle>
                      <RowDetail>{e.detail}</RowDetail>
                      <RowMeta>
                        {e.agent !== '—' && <span>{e.agent}</span>}
                        {e.agent !== '—' && <span>·</span>}
                        <span>{e.actor}</span>
                        <span>·</span>
                        <StatusPill tone={(e.tone as 'success' | 'warning' | 'error' | 'info')}>{e.kind}</StatusPill>
                      </RowMeta>
                    </RowMain>
                  </Row>
                ))}
              </Group>
            ))
          )}
        </Panel>
      </motion.div>
    </PageRoot>
  );
}
