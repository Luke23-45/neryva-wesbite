import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { SearchField } from '@components/common/ui/SearchField';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import { engineDownload } from '@lib/engine/client';
import { useAudit, useAuditFacets, useOrgRequired, type AuditEventRow } from '@hooks/engine/queries';
import { useUrlSearchParams, useUrlState } from '@lib/useUrlState';
import { useNavigate } from '@tanstack/react-router';
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

/**
 * Activity (ledger G-2) — the organization's hash-chained audit trail as a
 * live tail: facet-driven filters, time window, search, per-event detail,
 * and NDJSON export. Polls every 30s so "live event stream" is honest
 * enough until the engine exposes a stream (E-12).
 */

const PAGE_SIZE = 50;

/** Full identifier shown in an expanded row, with a copy button. */
function FullId({ id, label }: { id: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — selection still works */
    }
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <span style={{ opacity: 0.55 }}>{label}:</span>
      <code
        style={{
          fontFamily: 'monospace',
          fontSize: '0.9em',
          wordBreak: 'break-all',
          userSelect: 'all',
        }}
      >
        {id}
      </code>
      <button
        type="button"
        onClick={(ev) => { ev.stopPropagation(); void copy(); }}
        aria-label={copied ? 'Copied' : `Copy ${label.toLowerCase()} ID`}
        title={copied ? 'Copied' : `Copy ${label.toLowerCase()} ID`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          fontSize: 11,
          opacity: copied ? 1 : 0.55,
          color: 'inherit',
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </span>
  );
}

function toneFor(action: string): 'success' | 'warning' | 'error' | 'info' {
  const a = action.toLowerCase();
  if (a.includes('fail') || a.includes('error') || a.includes('delete') || a.includes('revoke')) return 'error';
  if (a.includes('suspend') || a.includes('past_due') || a.includes('warn')) return 'warning';
  if (a.includes('create') || a.includes('publish') || a.includes('issue')) return 'success';
  return 'info';
}

function dayLabel(iso: string): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return iso.slice(0, 10);
  return new Date(at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function timeLabel(iso: string): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return '';
  return new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function ActivityView() {
  const orgId = useOrgRequired();
  const params = useUrlSearchParams();
  const navigate = useNavigate();
  const [, setActionParam] = useUrlState('action', { default: 'all' });
  // Date-range picker (P6-AC-22): YYYY-MM-DD values synced to the URL so the
  // range is shareable and restored on reload, like every other filter here.
  const [fromParam, setFromParam] = useUrlState('from');
  const [toParam, setToParam] = useUrlState('to');
  // Search is URL-synced like every other filter (P6-AC-26) — shareable and
  // restored on reload. Local useState lost the query on every reload while
  // chips and dates survived, which was the inconsistency the browser proved.
  const [query, setQuery] = useUrlState('q');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const actionFilter = params.action ?? 'all';
  const facets = useAuditFacets();
  // The engine filters server-side by action prefix — pass the selected chip
  // through instead of fetching everything and filtering client-side.
  // `from` is the start of the chosen day; `to` is the END of the chosen day
  // so a range ending today includes today's events.
  const audit = useAudit({
    limit: PAGE_SIZE,
    ...(actionFilter !== 'all' ? { action: actionFilter } : {}),
    ...(fromParam ? { from: `${fromParam}T00:00:00.000Z` } : {}),
    ...(toParam ? { to: `${toParam}T23:59:59.999Z` } : {}),
  });
  const rangeActive = fromParam !== '' || toParam !== '';
  // Atomic clear: two sequential useUrlState setters each rebuild the URL
  // from the same stale snapshot, so the second overwrote the first (only
  // `to` was cleared). One navigate removes both keys at once.
  const clearRange = () => {
    const updated: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (typeof v === 'string' && v !== '' && k !== 'from' && k !== 'to') {
        updated[k] = v;
      }
    }
    void navigate({ search: (() => updated) as never, replace: true });
  };

  const facetActions = (facets.data?.actions ?? []).slice(0, 6);

  const rows = useMemo(() => {
    const events = audit.data?.events ?? [];
    if (!query.trim()) return events;
    const q = query.toLowerCase();
    return events.filter((e) =>
      e.action.toLowerCase().includes(q) ||
      e.resource_type.toLowerCase().includes(q) ||
      (e.actor_id ?? '').toLowerCase().includes(q),
    );
  }, [audit.data, query]);

  const grouped = useMemo(() => {
    const out = new Map<string, AuditEventRow[]>();
    for (const e of rows) {
      const day = dayLabel(e.created_at);
      if (!out.has(day)) out.set(day, []);
      out.get(day)!.push(e);
    }
    return [...out.entries()];
  }, [rows]);

  const exportTrail = () => {
    setExportError(null);
    void engineDownload(`/console/org/${orgId}/audit/export`).catch((err: unknown) => {
      // Surface export failures instead of swallowing them — P6-AC-24.
      setExportError(err instanceof Error ? err.message : 'Export failed');
    });
  };

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Activity</ViewTitle>
        <ViewSubtitle>
          The organization's hash-chained audit trail — every privileged action, in order, with receipts.
        </ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel
          action={
            <>
              <ActionButton variant="secondary" size="sm" onClick={exportTrail}>
                <Download size={13} strokeWidth={1.8} />
                Export NDJSON
              </ActionButton>
              {exportError && (
                <span role="alert" style={{ color: '#f87171', fontSize: 12, marginLeft: 8 }}>
                  Export failed: {exportError}
                </span>
              )}
            </>
          }
        >
          <FilterBar>
            <FilterChip
              type="button"
              $active={actionFilter === 'all'}
              aria-pressed={actionFilter === 'all'}
              onClick={() => setActionParam('')}
            >
              All
            </FilterChip>
            {facetActions.map((action) => (
              <FilterChip
                key={action}
                type="button"
                $active={actionFilter === action}
                aria-pressed={actionFilter === action}
                onClick={() => setActionParam(action)}
              >
                {action}
              </FilterChip>
            ))}
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search events…"
              ariaLabel="Search events"
              width={180}
            />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.75 }}>
              From
              <input
                type="date"
                value={fromParam}
                max={toParam || undefined}
                onChange={(e) => setFromParam(e.target.value)}
                aria-label="From date"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: 'inherit',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 12,
                }}
              />
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, opacity: 0.75 }}>
              To
              <input
                type="date"
                value={toParam}
                min={fromParam || undefined}
                onChange={(e) => setToParam(e.target.value)}
                aria-label="To date"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  color: 'inherit',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 12,
                }}
              />
            </label>
            {rangeActive && (
              <button
                type="button"
                onClick={clearRange}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  opacity: 0.75,
                  color: 'inherit',
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                }}
              >
                Clear dates
              </button>
            )}
          </FilterBar>

          <QueryView
            query={audit}
            skeleton={<Skeleton $h="320px" $r="12px" />}
            isEmpty={(d) => d.events.length === 0}
            empty={{ title: 'No events match', description: 'As your organization acts — keys, agents, invites — the trail fills in.' }}
          >
            {(data) => (
              <>
                {grouped.map(([date, events]) => (
                  <Group key={date}>
                    <GroupTitle>
                      {date} · {events.length}
                    </GroupTitle>
                    {events.map((e, i) => {
                      const isOpen = expanded === e.id;
                      return (
                        <Row
                          key={e.id}
                          as={motion.div}
                          initial="hidden"
                          animate="visible"
                          variants={pageItem}
                          custom={i}
                          onClick={() => setExpanded(isOpen ? null : e.id)}
                          style={{ cursor: 'pointer' }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                              ev.preventDefault();
                              setExpanded(isOpen ? null : e.id);
                            }
                          }}
                        >
                          <RowTime>{timeLabel(e.created_at)}</RowTime>
                          <RowDot $tone={toneFor(e.action)} aria-hidden="true" />
                          <RowMain>
                            <RowTitle>{e.action}</RowTitle>
                            <RowDetail>
                              {e.resource_type}
                              {e.resource_id ? (
                                <span title={e.resource_id} style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                                  {' · '}{e.resource_id}
                                </span>
                              ) : ''}
                            </RowDetail>
                            <RowMeta>
                              <span>{e.actor_type}</span>
                              {e.actor_id ? (
                                isOpen ? (
                                  <FullId id={e.actor_id} label="Actor" />
                                ) : (
                                  <span title={e.actor_id} style={{ fontFamily: 'monospace', fontSize: '0.9em', opacity: 0.7 }}>
                                    {e.actor_id.length > 24 ? `${e.actor_id.slice(0, 24)}…` : e.actor_id}
                                  </span>
                                )
                              ) : null}
                              {isOpen && (
                                <span aria-hidden="true">·</span>
                              )}
                              {isOpen && (
                                <code style={{ fontSize: 'inherit', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                                  {JSON.stringify(e.details ?? {}, null, 2) || '{}'}
                                </code>
                              )}
                              {!isOpen && <ChevronDown size={11} strokeWidth={1.7} aria-hidden="true" />}
                              {isOpen && <ChevronUp size={11} strokeWidth={1.7} aria-hidden="true" />}
                            </RowMeta>
                          </RowMain>
                        </Row>
                      );
                    })}
                  </Group>
                ))}
                {data.events.length >= PAGE_SIZE && (
                  <div style={{ padding: '12px 22px', fontSize: 12, opacity: 0.55 }}>
                    {rangeActive
                      ? `Showing the ${PAGE_SIZE} most recent events in the selected range — use the export for the full trail.`
                      : `Showing the ${PAGE_SIZE} most recent events — use the export for the full trail.`}
                  </div>
                )}
              </>
            )}
          </QueryView>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
