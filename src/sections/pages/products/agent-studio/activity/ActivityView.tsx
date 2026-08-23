import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { EmptyState } from '@components/common/ui/EmptyState';
import { ActionButton } from '@components/common/ui/ActionButton';
import { SearchField } from '@components/common/ui/SearchField';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import activity from '@neryva_data/products/agent_studio/activity.json';
import {
  FilterBar,
  FilterChip,
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

type FilterKind = 'all' | 'resolved' | 'escalation' | 'error' | 'deploy' | 'config' | 'new' | 'milestone';

const FILTERS: { value: FilterKind; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'error', label: 'Error' },
  { value: 'deploy', label: 'Deploy' },
  { value: 'config', label: 'Config' },
  { value: 'new', label: 'New' },
  { value: 'milestone', label: 'Milestone' },
];

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
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Activity</ViewTitle>
        <ViewSubtitle>
          Every event across your agents — escalations, deploys, integrations, and more.
        </ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel
          action={
            <ActionButton
              variant="secondary"
              size="sm"
              onClick={() => toast.success('Exporting activity CSV…')}
            >
              <Download size={13} strokeWidth={1.8} />
              Export CSV
            </ActionButton>
          }
        >
          <FilterBar>
            {FILTERS.map((f) => (
              <FilterChip
                key={f.value}
                type="button"
                $active={kind === f.value}
                aria-pressed={kind === f.value}
                onClick={() => setKind(f.value)}
              >
                {f.label}
              </FilterChip>
            ))}
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search events…"
              ariaLabel="Search events"
              width={180}
            />
          </FilterBar>

          {Object.entries(grouped).length === 0 ? (
            <EmptyState title="No events match" description="Try a different filter or search term." />
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
                    variants={pageItem}
                    custom={i}
                  >
                    <RowTime>{e.time}</RowTime>
                    <RowDot $tone={e.tone as 'success' | 'warning' | 'error' | 'info'} aria-hidden="true" />
                    <RowMain>
                      <RowTitle>{e.title}</RowTitle>
                      <RowDetail>{e.detail}</RowDetail>
                      <RowMeta>
                        {e.agent !== '—' && <span>{e.agent}</span>}
                        {e.agent !== '—' && <span aria-hidden="true">·</span>}
                        <span>{e.actor}</span>
                        <span aria-hidden="true">·</span>
                        <StatusPill tone={e.tone as 'success' | 'warning' | 'error' | 'info'}>
                          {e.kind}
                        </StatusPill>
                      </RowMeta>
                    </RowMain>
                  </Row>
                ))}
              </Group>
            ))
          )}
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
