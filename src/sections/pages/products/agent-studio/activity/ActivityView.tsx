import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Download, ChevronDown, ChevronUp, SearchX, ShieldCheck } from 'lucide-react';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { SearchField } from '@components/common/ui/SearchField';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { EmptyState } from '@components/common/ui/EmptyState';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import { engineDownload } from '@lib/engine/client';
import {
  useAudit,
  useAuditFacets,
  useAuditVerify,
  useOrgRequired,
  type AuditEventRow,
} from '@hooks/engine/queries';
import { useOrg } from '@/Context/OrgContext';
import { useCan } from '@lib/engine/capabilities';
import { useUrlSearchParams, useUrlState } from '@lib/useUrlState';
import { useNavigate } from '@tanstack/react-router';

/** Render event details as pretty JSON. The engine may hand `details` back as
 *  an already-serialized JSON string — stringifying that again would render
 *  visible backslashes, so parse strings first (falling back to raw text). */
export function formatDetails(details: unknown): string {
  if (details === null || details === undefined) return '{}';
  if (typeof details === 'string') {
    const trimmed = details.trim();
    if (!trimmed) return '{}';
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return details;
    }
  }
  try {
    return JSON.stringify(details, null, 2) || '{}';
  } catch {
    return '{}';
  }
}

/**
 * P2-1 — the search box filters only the 50 loaded rows client-side, so the
 * empty copy must say so. Shown when a search query is active but matches
 * nothing in the loaded page; a match older than the window needs the date
 * range or the full-trail export, and the copy must not imply otherwise.
 */
export function auditSearchNoMatchCopy(): { title: string; description: string } {
  return {
    title: 'No matches in the 50 most recent events',
    description:
      'Search covers the loaded page only — widen the date range or export the full trail to look further back.',
  };
}
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
        onClick={ev => {
          ev.stopPropagation();
          void copy();
        }}
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
  if (a.includes('fail') || a.includes('error') || a.includes('delete') || a.includes('revoke'))
    return 'error';
  if (a.includes('suspend') || a.includes('past_due') || a.includes('warn')) return 'warning';
  if (a.includes('create') || a.includes('publish') || a.includes('issue')) return 'success';
  return 'info';
}

function dayLabel(iso: string): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return iso.slice(0, 10);
  return new Date(at).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function timeLabel(iso: string): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return '';
  return new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function ActivityView() {
  const orgId = useOrgRequired();
  const { role } = useOrg();
  const can = useCan('agent_studio');
  // P2-2/P2-4: the audit export and chain-verification endpoints are
  // owner/admin/billing only (`console-platform.controller.ts`) — the
  // buttons must not invite developer/reader into a guaranteed 403. The
  // audit *query* itself allows developer, so the page stays readable.
  const canExportAudit = can('billing:view');
  const exportDeniedCopy = `Exporting the audit trail requires the billing role or above — your role is ${role ?? 'unknown'}.`;
  // G1: the Verify chain button needs its own denial copy — reusing the
  // export copy told a developer hovering "Verify chain" about exporting.
  const verifyDeniedCopy = `Verifying the audit chain requires the billing role or above — your role is ${role ?? 'unknown'}.`;
  const params = useUrlSearchParams();
  const navigate = useNavigate();
  // P0: URL-synced action filter had a race — navigate() is async and
  // useSearch didn't update synchronously, so chips changed the URL but
  // the feed didn't refetch until reload. Use local state as the source
  // of truth for immediate UI response; sync to URL as a side effect
  // for shareability (back/forward still work via URL on mount).
  const [actionFilter, setActionFilter] = useState<string>(() => params.action ?? 'all');
  const [, setActionParam] = useUrlState('action', { default: 'all' });
  // Sync local filter to URL (debounced by React batching; not blocking UI)
  const setAction = (next: string) => {
    setActionFilter(next);
    setActionParam(next === 'all' ? '' : next);
  };
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
  // P2-4: the engine's chain verification (`GET …/audit/verify`) was never
  // called — the subtitle claimed a hash-chained trail "with receipts" the
  // page never verified. Disabled by default; refetched on demand.
  const verify = useAuditVerify();
  const [verifyNote, setVerifyNote] = useState<string | null>(null);
  const [verifyOk, setVerifyOk] = useState<boolean | null>(null);

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

  const facetActions = facets.data?.actions ?? [];

  const rows = useMemo(() => {
    const events = audit.data?.events ?? [];
    if (!query.trim()) return events;
    const q = query.toLowerCase();
    return events.filter(
      e =>
        e.action.toLowerCase().includes(q) ||
        e.resource_type.toLowerCase().includes(q) ||
        (e.actor_id ?? '').toLowerCase().includes(q)
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
    // P8-I02: success was silent — confirm the download started.
    void engineDownload(`/console/org/${orgId}/audit/export`)
      .then(() => toast.success('Export started — check your downloads'))
      .catch((err: unknown) => {
        // Surface export failures instead of swallowing them — P6-AC-24.
        setExportError(err instanceof Error ? err.message : 'Export failed');
      });
  };

  const verifyChain = () => {
    setVerifyNote(null);
    setVerifyOk(null);
    // The query is disabled by default — this is the only trigger, so no
    // role without the capability can fire it except through the gated button.
    void verify.refetch().then(res => {
      const result = res.data;
      if (res.isError || !result) {
        const message = res.error instanceof Error ? res.error.message : 'Verification failed';
        setVerifyNote(`Chain verification failed: ${message}`);
        setVerifyOk(false);
        return;
      }
      if (result.ok) {
        setVerifyNote(`Chain verified — ${result.checked} events checked, no breaks.`);
        setVerifyOk(true);
        toast.success('Audit chain verified — no breaks');
      } else {
        setVerifyNote(
          `Chain break detected${result.first_break ? ` at ${result.first_break}` : ''} — ${result.checked} events checked.`
        );
        setVerifyOk(false);
        toast.error('Audit chain break detected');
      }
    });
  };

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Activity</ViewTitle>
        <ViewSubtitle>
          The organization's hash-chained audit trail — every privileged action, in order, with
          receipts.
        </ViewSubtitle>
      </ViewHeader>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel
          action={
            <>
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={exportTrail}
                disabled={!canExportAudit}
                title={
                  canExportAudit ? 'Download the full audit trail as NDJSON' : exportDeniedCopy
                }
              >
                <Download size={13} strokeWidth={1.8} />
                Export NDJSON
              </ActionButton>
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={verifyChain}
                disabled={!canExportAudit || verify.isFetching}
                title={
                  canExportAudit
                    ? 'Verify the audit hash chain against the engine'
                    : verifyDeniedCopy
                }
              >
                <ShieldCheck size={13} strokeWidth={1.8} />
                {verify.isFetching ? 'Verifying…' : 'Verify chain'}
              </ActionButton>
              {exportError && (
                <span role="alert" style={{ color: '#f87171', fontSize: 12, marginLeft: 8 }}>
                  Export failed: {exportError}
                </span>
              )}
              {verifyNote && (
                <span
                  role="status"
                  style={{ color: verifyOk ? '#4ade80' : '#f87171', fontSize: 12, marginLeft: 8 }}
                >
                  {verifyNote}
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
              onClick={() => setAction('')}
            >
              All
            </FilterChip>
            {facetActions.map(action => (
              <FilterChip
                key={action}
                type="button"
                $active={actionFilter === action}
                aria-pressed={actionFilter === action}
                onClick={() => setAction(action)}
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
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                opacity: 0.75,
              }}
            >
              From
              <input
                type="date"
                value={fromParam}
                max={toParam || undefined}
                onChange={e => setFromParam(e.target.value)}
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
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                opacity: 0.75,
              }}
            >
              To
              <input
                type="date"
                value={toParam}
                min={fromParam || undefined}
                onChange={e => setToParam(e.target.value)}
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
            isEmpty={d => d.events.length === 0}
            empty={{
              title: 'No events match',
              description:
                'As your organization acts — keys, agents, invites — the trail fills in.',
            }}
          >
            {data => {
              // P2-1: QueryView's isEmpty keys on the raw 50-row page, so a
              // search matching nothing in the loaded page would render a
              // silent blank list. Name the window explicitly instead — the
              // copy must not imply the whole trail was searched.
              const noSearchMatch = query.trim().length > 0 && rows.length === 0;
              const noMatchCopy = auditSearchNoMatchCopy();
              return (
                <>
                  {noSearchMatch ? (
                    <EmptyState
                      icon={<SearchX size={18} opacity={0.5} />}
                      title={noMatchCopy.title}
                      description={noMatchCopy.description}
                    />
                  ) : (
                    grouped.map(([date, events]) => (
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
                            >
                              <button
                                type="button"
                                onClick={() => setExpanded(isOpen ? null : e.id)}
                                aria-expanded={isOpen}
                                aria-label={`${e.action} event, ${isOpen ? 'collapse' : 'expand'} details`}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  width: '100%',
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  margin: 0,
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  font: 'inherit',
                                  color: 'inherit',
                                }}
                              >
                                <RowTime>{timeLabel(e.created_at)}</RowTime>
                                <RowDot $tone={toneFor(e.action)} aria-hidden="true" />
                                <RowMain>
                                  <RowTitle>{e.action}</RowTitle>
                                  <RowDetail>
                                    {e.resource_type}
                                    {e.resource_id ? (
                                      <span
                                        title={e.resource_id}
                                        style={{ fontFamily: 'monospace', fontSize: '0.9em' }}
                                      >
                                        {' · '}
                                        {e.resource_id}
                                      </span>
                                    ) : (
                                      ''
                                    )}
                                  </RowDetail>
                                  <RowMeta>
                                    <span>{e.actor_type}</span>
                                    {e.actor_id ? (
                                      <span
                                        title={e.actor_id}
                                        style={{
                                          fontFamily: 'monospace',
                                          fontSize: '0.9em',
                                          opacity: 0.7,
                                        }}
                                      >
                                        {e.actor_id.length > 24
                                          ? `${e.actor_id.slice(0, 24)}…`
                                          : e.actor_id}
                                      </span>
                                    ) : null}
                                    {!isOpen && (
                                      <ChevronDown size={11} strokeWidth={1.7} aria-hidden="true" />
                                    )}
                                    {isOpen && (
                                      <ChevronUp size={11} strokeWidth={1.7} aria-hidden="true" />
                                    )}
                                  </RowMeta>
                                </RowMain>
                              </button>
                              {isOpen && (
                                <div style={{ padding: '8px 0 0 0', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
                                  <FullId id={e.actor_id} label="Actor" />
                                  <code
                                    style={{
                                      display: 'block',
                                      fontSize: '12px',
                                      wordBreak: 'break-all',
                                      whiteSpace: 'pre-wrap',
                                      marginTop: 8,
                                      opacity: 0.8,
                                    }}
                                  >
                                    {formatDetails(e.details)}
                                  </code>
                                </div>
                              )}
                            </Row>
                          );
                        })}
                      </Group>
                    ))
                  )}
                  {data.events.length >= PAGE_SIZE && !query && (
                    <div style={{ padding: '12px 22px', fontSize: 12, opacity: 0.55 }}>
                      {rangeActive
                        ? `Showing the ${PAGE_SIZE} most recent events in the selected range — use the export for the full trail.`
                        : `Showing the ${PAGE_SIZE} most recent events — use the export for the full trail.`}
                    </div>
                  )}
                </>
              );
            }}
          </QueryView>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
