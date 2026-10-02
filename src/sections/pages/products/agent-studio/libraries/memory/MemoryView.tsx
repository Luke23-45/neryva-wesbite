import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ShieldAlert, ChevronDown, Search, Download, X } from 'lucide-react';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { CopyButton } from '@components/common/ui/CopyButton';
import {
  ViewShell,
  ViewHeader,
  ViewTitle,
  ViewSubtitle,
} from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useDeleteMemory,
  useExpireMemory,
  useMemories,
  useMemoryCounts,
  useOrgMemoryPolicy,
  usePurgeMemories,
  type MemoryItem,
} from '@hooks/studio/useSetupKnowledge';
import {
  PURGE_SUBSTRING_MAX,
  PURGE_SUBSTRING_MIN,
  SCRUB_COPY,
  describeTtl,
  filterMemories,
  relativeTime,
  validatePurgeSubstring,
} from '@/sections/pages/products/agent-studio/builder/lib/memory-model';
import { LIBRARIES_MEMORY_NEW_ROUTE_ID } from './MemoryNewSection';
import { LIBRARIES_MEMORY_EDIT_ROUTE_ID } from './MemoryEditSection';

type MemoryScope = 'organization' | 'user' | 'assistant';

const SCOPES: { value: MemoryScope; label: string }[] = [
  { value: 'organization', label: 'Organization' },
  { value: 'user', label: 'User' },
  { value: 'assistant', label: 'Assistant' },
];

type SortKey = 'newest' | 'oldest';

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 24px;
  align-items: start;
  @media (max-width: 1024px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const MainColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;

const RightRail = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 16px;
  @media (max-width: 1024px) {
    display: none;
  }
`;

const RailCard = styled.div`
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 16px;
`;

const RailTitle = styled.h3`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
  margin: 0 0 12px;
`;

const RailRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 12.5px;
`;

const RailLabel = styled.span`
  color: ${({ theme }) => theme.app.text.secondary};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RailValue = styled.span`
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: 11.5px;
`;

const ScopeDot = styled.span<{ $active?: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme, $active }) => ($active ? theme.app.text.link : theme.app.border.strong)};
  flex-shrink: 0;
`;

const RailLink = styled(Link)`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.link};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const InfoCard = styled(RailCard)`
  background: ${({ theme }) => theme.app.surface.subtle};
  display: flex;
  gap: 10px;
  align-items: flex-start;
  font-size: 12px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.secondary};
`;

/* ------------------------------------------------------------------ */
/* Policy strip                                                        */
/* ------------------------------------------------------------------ */

const PolicyStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  align-items: center;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 12px 16px;
  font-size: 12.5px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const PolicyLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: ${({ theme }) => theme.app.text.muted};
`;

const PolicyPill = styled.span<{ $tone?: 'warning' | 'neutral' }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 11px;
  font-size: 11px;
  font-weight: 500;
  background: ${({ theme, $tone }) =>
    $tone === 'warning' ? 'rgba(255, 214, 10, 0.12)' : theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme, $tone }) => ($tone === 'warning' ? '#ffd60a' : theme.app.text.secondary)};
`;

/* ------------------------------------------------------------------ */
/* Toolbar: scope tabs, search, filters                                */
/* ------------------------------------------------------------------ */

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
`;

const ScopeTabs = styled.div`
  display: flex;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
`;

const ScopeTab = styled.button<{ $active?: boolean }>`
  border: none;
  background: ${({ theme, $active }) => ($active ? theme.app.surface.tint : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.app.text.primary : theme.app.text.secondary)};
  font-size: 12px;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    color: ${({ theme }) => theme.app.text.primary};
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.text.link};
    outline-offset: 1px;
  }
`;

const SearchWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 320px;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: ${({ theme }) => theme.app.text.muted};
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px 8px 32px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.primary};
  font-size: 12.5px;
  &::placeholder {
    color: ${({ theme }) => theme.app.text.muted};
  }
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.app.text.link};
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  color: ${({ theme }) => theme.app.text.secondary};
  font-size: 12px;
  cursor: pointer;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.app.text.link};
  }
`;

/* ------------------------------------------------------------------ */
/* Actions row                                                         */
/* ------------------------------------------------------------------ */

const ActionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const CountText = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.muted};
`;

const ActionsGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

/* ------------------------------------------------------------------ */
/* Table                                                               */
/* ------------------------------------------------------------------ */

const TableCard = styled.div`
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  overflow: hidden;
`;

const TableHead = styled.div`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 180px 100px 110px 32px;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
`;

const HeadCell = styled.span`
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: ${({ theme }) => theme.app.text.muted};
`;

const BulkBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: rgba(64, 152, 255, 0.08);
  border-bottom: 1px solid rgba(64, 152, 255, 0.2);
  font-size: 12px;
`;

const BulkCount = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.link};
`;

const BulkAction = styled.button<{ $danger?: boolean }>`
  background: none;
  border: none;
  font-size: 12px;
  cursor: pointer;
  color: ${({ theme, $danger }) => ($danger ? theme.app.status.error.fg : theme.app.text.link)};
  padding: 4px 0;
  &:hover {
    text-decoration: underline;
  }
`;

const RowWrap = styled.div<{ $selected?: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  background: ${({ $selected }) => ($selected ? 'rgba(64, 152, 255, 0.04)' : 'transparent')};
  &:last-child {
    border-bottom: none;
  }
`;

const DataRowGrid = styled.div`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 180px 100px 110px 32px;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.app.surface.hover};
  }
`;

const CellContent = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CellMeta = styled.span`
  font-size: 11.5px;
  color: ${({ theme }) => theme.app.text.secondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 16px;
  height: 16px;
  accent-color: ${({ theme }) => theme.app.accentControl};
  cursor: pointer;
`;

const ExpandIcon = styled(ChevronDown)<{ $open?: boolean }>`
  width: 16px;
  height: 16px;
  color: ${({ theme }) => theme.app.text.muted};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'none')};
  transition: transform 0.15s ease;
`;

const TtlPill = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 10.5px;
  font-weight: 500;
  background: ${({ theme, $active }) =>
    $active ? 'rgba(255, 214, 10, 0.12)' : theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme, $active }) => ($active ? '#ffd60a' : theme.app.text.secondary)};
  white-space: nowrap;
`;

/* ------------------------------------------------------------------ */
/* Expanded detail panel                                               */
/* ------------------------------------------------------------------ */

const DetailPanel = styled.div`
  margin: 0 16px 16px 60px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 16px;
`;

const DetailText = styled.p`
  font-size: 13px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.primary};
  margin: 0 0 16px;
  white-space: pre-wrap;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
  padding: 12px 0;
  border-top: 1px solid ${({ theme }) => theme.app.border.hairline};
  border-bottom: 1px solid ${({ theme }) => theme.app.border.hairline};
  margin-bottom: 12px;
`;

const DetailField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DetailLabel = styled.span`
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: ${({ theme }) => theme.app.text.muted};
`;

const DetailValue = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const DetailActions = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const DetailAction = styled.button<{ $danger?: boolean }>`
  background: none;
  border: none;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
  color: ${({ theme, $danger }) => ($danger ? theme.app.status.error.fg : theme.app.text.link)};
  &:hover {
    text-decoration: underline;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    text-decoration: none;
  }
`;

/* ------------------------------------------------------------------ */
/* Footnotes                                                           */
/* ------------------------------------------------------------------ */

const FootNote = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.muted};
  margin: 0;
  line-height: 1.6;
`;

const ErrorText = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.app.status.error.fg};
  margin: 4px 0 0;
`;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Assistant deep-links arrive `?scope=assistant&scope_id=<agentId>` (additive params, no route change). */
function initialScope(): { scope: MemoryScope; scopeId: string | null } {
  try {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
    const scope = params.get('scope');
    const scopeId = params.get('scope_id');
    if (scope === 'assistant' && scopeId) return { scope: 'assistant', scopeId };
    if (scope === 'user' || scope === 'organization') return { scope, scopeId: null };
  } catch {
    // Non-browser render: fall through to the default.
  }
  return { scope: 'organization', scopeId: null };
}

/** Honest author label — provenance when present, never invented. */
function authorOf(m: MemoryItem): string {
  return m.provenance?.trim() || '—';
}

/** Honest source reference — full id + short label when identifiable. */
function sourceRefOf(m: MemoryItem): { id: string; label: string } | null {
  const ref = m.sourceRef;
  if (!ref) return null;
  for (const key of ['conversation_id', 'message_id', 'document_id', 'proposal_id']) {
    const v = ref[key];
    if (typeof v === 'string' && v.trim()) {
      const short = v.replace(/-/g, '').slice(-4);
      return { id: v.trim(), label: `#${short}` };
    }
  }
  return null;
}

function ttlLabel(expiresAt: string | null): { text: string; active: boolean } {
  if (!expiresAt) return { text: 'no TTL', active: false };
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return { text: 'expired', active: false };
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return { text: `in ${days}d`, active: true };
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return { text: `in ${hours}h`, active: true };
  return { text: 'soon', active: true };
}

/* ------------------------------------------------------------------ */
/* Main view                                                           */
/* ------------------------------------------------------------------ */

/**
 * Memory library — scope-aware browse of org memories.
 *
 * Conversation-scoped items are NOT library rows: they surface on the
 * conversation and its trace, or nowhere in v1 (stated, not implied).
 * There is no proposals LIST endpoint server-side, so no proposals queue is
 * rendered — the rail states it once instead of faking an inbox.
 */
export function MemoryView() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canWrite = canSetup(role, 'setup:author');
  const canGovern = canSetup(role, 'setup:govern');
  const [initial] = useState(initialScope);
  const [scope, setScope] = useState<MemoryScope>(initial.scope);
  const [scopeId, setScopeId] = useState<string | null>(initial.scopeId);
  const [query, setQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const memories = useMemories(scope, scopeId ?? undefined);
  const counts = useMemoryCounts();
  const policy = useOrgMemoryPolicy();
  const remove = useDeleteMemory();
  const expire = useExpireMemory();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; preview: string } | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [expireTarget, setExpireTarget] = useState<{ id: string; preview: string } | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);

  const items = useMemo(() => {
    let list = filterMemories(memories.data ?? [], query);
    if (authorFilter !== 'all') {
      list = list.filter((m) => authorOf(m) === authorFilter);
    }
    const byTime = (m: MemoryItem) => new Date(m.updatedAt ?? m.createdAt ?? 0).getTime();
    list = [...list].sort((a, b) => (sortKey === 'newest' ? byTime(b) - byTime(a) : byTime(a) - byTime(b)));
    return list;
  }, [memories.data, query, authorFilter, sortKey]);

  const authors = useMemo(() => {
    const set = new Set<string>();
    for (const m of memories.data ?? []) {
      const a = authorOf(m);
      if (a !== '—') set.add(a);
    }
    return [...set].sort();
  }, [memories.data]);

  const pickScope = (next: MemoryScope) => {
    setScope(next);
    setSelected(new Set());
    setExpandedId(null);
    // Assistant rows need an agent to scope to — dropping the id widens the
    // read to every assistant row, so clear it instead of guessing.
    if (next !== 'assistant') setScopeId(null);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((m) => m.id)));
  };

  const exportSelected = () => {
    const rows = items.filter((m) => selected.has(m.id));
    const payload = rows.map((m) => ({
      id: m.id,
      content: m.content,
      scope_type: m.scopeType,
      visibility: m.visibility,
      provenance: m.provenance,
      created_at: m.createdAt,
      updated_at: m.updatedAt,
      expires_at: m.expiresAt,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memories-${scope}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bulkDelete = () => {
    const ids = [...selected];
    let done = 0;
    for (const id of ids) {
      remove.mutate(id, {
        onSettled: () => {
          done += 1;
          if (done === ids.length) {
            setSelected(new Set());
            setBulkDeleteOpen(false);
          }
        },
      });
    }
  };

  const scopeCount = (s: MemoryScope) => counts.data?.[s] ?? null;

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Memory</ViewTitle>
        <ViewSubtitle>
          What your agents remember — org-shared, TTL-bound, and deletable. Visibility defaults to
          organization: treat content here as shared unless scoped otherwise.
        </ViewSubtitle>
      </ViewHeader>

      <ContentGrid>
        <MainColumn>
          <PolicyStrip>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PolicyLabel>SCRUB</PolicyLabel>
              <PolicyPill $tone={policy.policy?.scrub === 'off' ? 'warning' : 'neutral'}>
                {policy.policy ? SCRUB_COPY[policy.policy.scrub] : 'loading…'}
              </PolicyPill>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PolicyLabel>DEFAULT TTL</PolicyLabel>
              <PolicyPill>
                {policy.policy ? describeTtl(policy.policy.ttlSeconds) : 'loading…'}
              </PolicyPill>
            </span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
              <Link to="/agent-studio/settings/workspace" style={{ fontSize: 12.5, color: 'inherit' }}>
                Workspace settings →
              </Link>
              <Link to="/agent-studio/compliance" style={{ fontSize: 12.5, color: 'inherit' }}>
                Compliance →
              </Link>
            </span>
          </PolicyStrip>

          <Toolbar>
            <ScopeTabs role="tablist" aria-label="Memory scope">
              {SCOPES.map((s) => {
                const c = scopeCount(s.value);
                return (
                  <ScopeTab
                    key={s.value}
                    role="tab"
                    aria-selected={scope === s.value}
                    $active={scope === s.value}
                    onClick={() => pickScope(s.value)}
                  >
                    {s.label}{c !== null ? ` · ${c}` : ''}
                  </ScopeTab>
                );
              })}
            </ScopeTabs>
            <SearchWrap>
              <SearchIcon />
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search content…"
                aria-label="Search memories"
              />
            </SearchWrap>
            <Select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              aria-label="Filter by author"
            >
              <option value="all">All authors</option>
              {authors.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </Select>
            <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} aria-label="Sort order">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </Select>
          </Toolbar>

          {scope === 'assistant' && !scopeId && (
            <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>
              All assistants — arrive from an agent to narrow to one.
            </p>
          )}
          {scope === 'assistant' && scopeId && (
            <p style={{ fontSize: 12, opacity: 0.7, margin: 0 }}>
              Agent <code>{scopeId.slice(0, 8)}…</code>{' '}
              <button
                type="button"
                onClick={() => setScopeId(null)}
                style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 }}
              >
                clear
              </button>
            </p>
          )}

          <ActionsRow>
            <CountText>
              {items.length} {items.length === 1 ? 'memory' : 'memories'} in this scope
            </CountText>
            <ActionsGroup>
              <ActionButton
                variant="secondary"
                size="sm"
                onClick={() => setPurgeOpen(true)}
                disabled={!canGovern}
                title={canGovern ? 'Purge memories by text (audited)' : 'Purging memories needs owner or admin.'}
              >
                <ShieldAlert size={13} strokeWidth={1.8} />
                Purge by text…
              </ActionButton>
              <ActionButton
                variant="primary"
                size="sm"
                onClick={() => navigate({ to: LIBRARIES_MEMORY_NEW_ROUTE_ID })}
                disabled={!canWrite}
                title={canWrite ? 'Save a memory (audited)' : 'Saving memories needs owner, admin, or developer.'}
              >
                New memory
              </ActionButton>
            </ActionsGroup>
          </ActionsRow>

          <QueryView
            query={memories}
            isEmpty={(d) => d.length === 0}
            empty={{
              title: `No ${scopeId ? 'assistant' : scope} memories yet`,
              description:
                'Memories appear as agents write them within this scope. Nothing is broken — an empty memory is a clean slate.',
            }}
          >
            {() => {
              if (items.length === 0) {
                return (
                  <p style={{ fontSize: 12, opacity: 0.65 }}>
                    No memories match this search — loosen it. Nothing was deleted.
                  </p>
                );
              }
              return (
                <TableCard>
                  <TableHead>
                    <Checkbox
                      checked={items.length > 0 && selected.size === items.length}
                      onChange={toggleSelectAll}
                      aria-label="Select all memories"
                    />
                    <HeadCell>CONTENT</HeadCell>
                    <HeadCell>AUTHOR · SOURCE</HeadCell>
                    <HeadCell>UPDATED</HeadCell>
                    <HeadCell>EXPIRY</HeadCell>
                    <HeadCell />
                  </TableHead>
                  {selected.size > 0 && (
                    <BulkBar>
                      <BulkCount>{selected.size} selected</BulkCount>
                      <BulkAction onClick={exportSelected}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Download size={12} /> Export
                        </span>
                      </BulkAction>
                      <BulkAction $danger onClick={() => setBulkDeleteOpen(true)} disabled={!canWrite}>
                        Delete
                      </BulkAction>
                      <BulkAction onClick={() => setSelected(new Set())}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <X size={12} /> Clear
                        </span>
                      </BulkAction>
                    </BulkBar>
                  )}
                  {items.map((m) => {
                    const isOpen = expandedId === m.id;
                    const isSelected = selected.has(m.id);
                    const ttl = ttlLabel(m.expiresAt);
                    const source = sourceRefOf(m);
                    return (
                      <RowWrap key={m.id} $selected={isSelected}>
                        <DataRowGrid
                          onClick={() => setExpandedId(isOpen ? null : m.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setExpandedId(isOpen ? null : m.id);
                            }
                          }}
                          aria-expanded={isOpen}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelect(m.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select memory ${m.id.slice(0, 8)}`}
                          />
                          <CellContent title={m.content ?? ''}>{(m.content ?? '—').slice(0, 120)}</CellContent>
                          <CellMeta>
                            {authorOf(m)}
                            {source ? ` · ${source.label}` : ''}
                          </CellMeta>
                          <CellMeta title={m.updatedAt ?? m.createdAt ?? undefined}>
                            {relativeTime(m.updatedAt ?? m.createdAt)}
                          </CellMeta>
                          <span>
                            <TtlPill $active={ttl.active}>{ttl.text}</TtlPill>
                          </span>
                          <ExpandIcon $open={isOpen} />
                        </DataRowGrid>
                        {isOpen && (
                          <DetailPanel>
                            <DetailText>{m.content ?? '—'}</DetailText>
                            <DetailGrid>
                              <DetailField>
                                <DetailLabel>SCOPE</DetailLabel>
                                <DetailValue style={{ textTransform: 'capitalize' }}>
                                  {m.scopeType ?? '—'}
                                </DetailValue>
                              </DetailField>
                              <DetailField>
                                <DetailLabel>VISIBILITY</DetailLabel>
                                <DetailValue style={{ textTransform: 'capitalize' }}>
                                  {m.visibility ?? 'organization'}
                                </DetailValue>
                              </DetailField>
                              <DetailField>
                                <DetailLabel>AUTHOR</DetailLabel>
                                <DetailValue>{authorOf(m)}</DetailValue>
                              </DetailField>
                              <DetailField>
                                <DetailLabel>SOURCE</DetailLabel>
                                {source ? (
                                  <DetailValue>
                                    {source.label}
                                    <span style={{ opacity: 0.6 }}> · {source.id.slice(0, 8)}…</span>
                                  </DetailValue>
                                ) : (
                                  <DetailValue>—</DetailValue>
                                )}
                              </DetailField>
                              <DetailField>
                                <DetailLabel>CREATED</DetailLabel>
                                <DetailValue>
                                  {m.createdAt ? new Date(m.createdAt).toLocaleString() : '—'}
                                </DetailValue>
                              </DetailField>
                              <DetailField>
                                <DetailLabel>UPDATED</DetailLabel>
                                <DetailValue>
                                  {m.updatedAt ? relativeTime(m.updatedAt) : '—'}
                                </DetailValue>
                              </DetailField>
                            </DetailGrid>
                            <DetailActions>
                              <DetailAction
                                disabled={!canWrite}
                                onClick={() =>
                                  navigate({ to: LIBRARIES_MEMORY_EDIT_ROUTE_ID.replace('$memoryId', m.id) })
                                }
                              >
                                Edit
                              </DetailAction>
                              <CopyButton value={m.content ?? ''} label="Copy" />
                              <DetailAction
                                disabled={!canWrite}
                                onClick={() =>
                                  setExpireTarget({ id: m.id, preview: (m.content ?? '').slice(0, 80) })
                                }
                              >
                                Expire now
                              </DetailAction>
                              <DetailAction
                                $danger
                                disabled={!canWrite}
                                onClick={() =>
                                  setDeleteTarget({ id: m.id, preview: (m.content ?? '').slice(0, 80) })
                                }
                              >
                                Delete
                              </DetailAction>
                            </DetailActions>
                          </DetailPanel>
                        )}
                      </RowWrap>
                    );
                  })}
                </TableCard>
              );
            }}
          </QueryView>

          <div>
            <FootNote>
              Shows the newest 100 entries per scope — older entries are not listed. Search filters
              only what is loaded.
            </FootNote>
            <FootNote>Conversation-scoped memories surface on their conversation, not here.</FootNote>
          </div>
        </MainColumn>

        <RightRail aria-label="Memory policy summary">
          <RailCard>
            <RailTitle>Scopes</RailTitle>
            {SCOPES.map((s) => (
              <RailRow key={s.value}>
                <RailLabel>
                  <ScopeDot $active={scope === s.value} />
                  <span style={{ color: scope === s.value ? 'inherit' : undefined }}>{s.label}</span>
                </RailLabel>
                <RailValue>{scopeCount(s.value) ?? '—'}</RailValue>
              </RailRow>
            ))}
            <RailRow>
              <RailLabel>
                <ScopeDot />
                <span style={{ opacity: 0.6 }}>Conversation</span>
              </RailLabel>
              <RailValue>on conversation</RailValue>
            </RailRow>
          </RailCard>
          <RailCard>
            <RailTitle>Lifecycle</RailTitle>
            <RailRow>
              <RailLabel>Scrub</RailLabel>
              <RailValue>
                {policy.policy ? (
                  <PolicyPill $tone={policy.policy.scrub === 'off' ? 'warning' : 'neutral'}>
                    {policy.policy.scrub === 'off' ? 'Off · verbatim' : SCRUB_COPY[policy.policy.scrub]}
                  </PolicyPill>
                ) : (
                  '—'
                )}
              </RailValue>
            </RailRow>
            <RailRow>
              <RailLabel>Default TTL</RailLabel>
              <RailValue>{policy.policy ? describeTtl(policy.policy.ttlSeconds) : '—'}</RailValue>
            </RailRow>
            <RailRow>
              <RailLabel>Retention</RailLabel>
              <RailValue>until deleted</RailValue>
            </RailRow>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <RailLink to="/agent-studio/settings/workspace">Workspace settings →</RailLink>
              <RailLink to="/agent-studio/compliance">Compliance →</RailLink>
            </div>
          </RailCard>
          <InfoCard>
            <span style={{ flexShrink: 0, marginTop: 2 }}>✦</span>
            <span>
              Memory proposals have no approval surface in this build — writes land directly,
              attributed.
            </span>
          </InfoCard>
        </RightRail>
      </ContentGrid>

      <MemoryPurgeModal open={purgeOpen} onClose={() => setPurgeOpen(false)} />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this memory?"
        message={`“${deleteTarget?.preview ?? ''}” is tombstoned — retrieval stops seeing it immediately. Audited; history stays answerable.`}
        confirmLabel="Delete memory"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            remove.mutate(deleteTarget.id, {
              onSettled: () => setDeleteTarget(null),
            });
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selected.size} memories?`}
        message="They are tombstoned — retrieval stops seeing them immediately. Audited; history stays answerable."
        confirmLabel="Delete memories"
        destructive
        onConfirm={bulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />

      <ConfirmDialog
        open={expireTarget !== null}
        title="Expire this memory now?"
        message={`“${expireTarget?.preview ?? ''}” stops being served to runs immediately. The row stays for history.`}
        confirmLabel="Expire now"
        onConfirm={() => {
          if (expireTarget) {
            expire.mutate(expireTarget.id, {
              onSettled: () => setExpireTarget(null),
            });
          }
        }}
        onCancel={() => setExpireTarget(null)}
      />
    </ViewShell>
  );
}

/**
 * DSR purge entry (C08): substring 3–128 with counter, blast-radius copy, one
 * explicit commit. The count is reported after the run — no count endpoint
 * exists to preview it, and none is faked.
 */
function MemoryPurgeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const purge = usePurgeMemories();
  const [substring, setSubstring] = useState('');
  const [result, setResult] = useState<{ purged: number; truncated: boolean } | null>(null);

  const problem = validatePurgeSubstring(substring);
  const length = substring.trim().length;

  return (
    <Modal
      open={!!open}
      onClose={() => {
        setSubstring('');
        setResult(null);
        onClose();
      }}
      title="Purge memories by text"
      width={560}
      footer={
        <>
          <ActionButton
            variant="secondary"
            onClick={() => {
              setSubstring('');
              setResult(null);
              onClose();
            }}
          >
            Cancel
          </ActionButton>
          <ActionButton
            variant="danger"
            disabled={problem !== null || purge.isPending}
            onClick={() =>
              purge.mutate(substring.trim(), {
                onSuccess: (data) => setResult({ purged: data.purged, truncated: data.truncated === true }),
              })
            }
          >
            <ShieldAlert size={13} strokeWidth={1.8} />
            {purge.isPending ? 'Purging…' : 'Purge matches'}
          </ActionButton>
        </>
      }
    >
      <TextInput
        label="Text to purge"
        id="memory-purge-substring"
        value={substring}
        onChange={(e) => {
          setSubstring(e.target.value);
          setResult(null);
        }}
        placeholder="acme-contract-2024"
      />
      <p style={{ fontSize: 12, opacity: 0.75 }}>
        {length} / {PURGE_SUBSTRING_MIN} min – {PURGE_SUBSTRING_MAX} max, literal match (case-insensitive).
      </p>
      {problem && substring.trim() !== '' ? <ErrorText>{problem}</ErrorText> : null}
      <p style={{ fontSize: 12, opacity: 0.85 }}>
        Every scope. Tombstoned — retrieval stops immediately. The query itself is never stored:
        the audit keeps a hash, the count, and the ids.
      </p>
      {result !== null && (
        <p style={{ fontSize: 13 }}>
          Purged {result.purged} {result.purged === 1 ? 'memory' : 'memories'}
          {result.truncated
            ? ' — the run hit the 1000-match cap, so more may match. Re-run the purge to continue.'
            : ' — nothing matched stays retrievable.'}
        </p>
      )}
    </Modal>
  );
}
