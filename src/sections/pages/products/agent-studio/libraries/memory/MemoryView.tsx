import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ShieldAlert } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { Segmented } from '@components/common/ui/Segmented';
import {
  ViewShell,
  ViewHeader,
  ViewTitle,
  ViewSubtitle,
} from '@components/common/ui/ViewLayout';
import { DataTable, DataHead, DataRow, DataCell } from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import {
  useDeleteMemory,
  useMemories,
  useOrgMemoryPolicy,
  usePurgeMemories,
} from '@hooks/studio/useSetupKnowledge';
import {
  SCRUB_COPY,
  describeTtl,
  filterMemories,
  relativeTime,
  validatePurgeSubstring,
} from '@/sections/pages/products/agent-studio/builder/lib/memory-model';
import { LIBRARIES_MEMORY_NEW_ROUTE_ID } from './MemoryNewSection';
import { LIBRARIES_MEMORY_DETAIL_ROUTE_ID } from './MemoryDetailSection';
import { LIBRARIES_MEMORY_EDIT_ROUTE_ID } from './MemoryEditSection';

type MemoryScope = 'organization' | 'user' | 'assistant';

const SCOPES: { value: MemoryScope; label: string }[] = [
  { value: 'organization', label: 'Organization' },
  { value: 'user', label: 'User' },
  { value: 'assistant', label: 'Assistant' },
];

const PolicyStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  align-items: center;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.app.border.default};
  background: ${({ theme }) => theme.app.surface.subtle};
  padding: 8px 12px;
  margin: 12px 0;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
`;

const FilterBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  margin: 12px 0;
`;

const FilterActions = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
`;

const FootNote = styled.p`
  font-size: 12px;
  opacity: 0.65;
  margin-top: 12px;
  line-height: 1.6;
`;

const ErrorText = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.app.status.error.fg};
  margin: 4px 0 0;
`;

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

/**
 * Memory library (SIDEBAR_LEDGER.md P3) — scope-aware browse of org memories.
 * Conversation-scoped items are NOT library rows: they surface on the
 * conversation and its trace, or nowhere in v1 (stated, not implied).
 * There is no proposals LIST endpoint server-side, so no proposals queue is
 * rendered — the footer states it once instead of faking an inbox. Targeted
 * single-item delete is owner/admin/developer; org-wide purge (owner/admin)
 * and the scrub/TTL policy strip live here; retention authoring lives in
 * Workspace settings (owners/admins).
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
  const memories = useMemories(scope, scopeId ?? undefined);
  const policy = useOrgMemoryPolicy();
  const remove = useDeleteMemory();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; preview: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);

  const visible = useMemo(() => filterMemories(memories.data ?? [], query), [memories.data, query]);

  const pickScope = (next: MemoryScope) => {
    setScope(next);
    // Assistant rows need an agent to scope to — dropping the id widens the
    // read to every assistant row, so clear it instead of guessing.
    if (next !== 'assistant') setScopeId(null);
  };

  return (
    <ViewShell>
      <ViewHeader as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewTitle>Memory</ViewTitle>
        <ViewSubtitle>
          What your agents remember — org-shared, TTL-bound, and deletable. Visibility defaults to
          organization: treat content here as shared unless scoped otherwise.
        </ViewSubtitle>
      </ViewHeader>

      <PolicyStrip>
        <span>
          Scrub: {policy.policy ? SCRUB_COPY[policy.policy.scrub] : '—'}
        </span>
        <span>
          Default TTL: {policy.policy ? describeTtl(policy.policy.ttlSeconds) : '—'}
        </span>
        <Link to="/agent-studio/settings/workspace">Workspace settings →</Link>
      </PolicyStrip>

      <div style={{ margin: '12px 0', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <Segmented
          options={SCOPES}
          value={scope}
          onChange={pickScope}
          size="md"
          ariaLabel="Memory scope"
        />
        {scope === 'assistant' && (
          scopeId ? (
            <ActionButton variant="secondary" size="sm" onClick={() => setScopeId(null)} title="Widen to every assistant row">
              Agent {scopeId.slice(0, 8)}… · clear
            </ActionButton>
          ) : (
            <span style={{ fontSize: 12, opacity: 0.7 }}>All assistants — select an agent to narrow the list.</span>
          )
        )}
      </div>
      {/* A4-23: assistant-scoped rows ARE served — to runs of the agent they
          are scoped to, when that agent's memory scope policy is 'Assistant'
          (engine FL-1.5 assistant branch; fail-closed to zero rows when the
          agent is unresolvable). Any other policy never reads them. */}
      {scope === 'assistant' && (
        <p style={{ fontSize: 12, opacity: 0.75, margin: '0 0 12px' }}>
          Assistant-scoped rows reach the runs of the agent they belong to — but only when that
          agent&apos;s memory scope is set to Assistant (see the agent&apos;s Memory settings). Other
          policies never read them.
        </p>
      )}

      <FilterBar>
        <TextInput label="Search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search content…" />
        <FilterActions>
          <ActionButton
            variant="secondary"
            onClick={() => navigate({ to: LIBRARIES_MEMORY_NEW_ROUTE_ID })}
            disabled={!canWrite}
            title={canWrite ? 'Save a memory (audited)' : 'Saving memories needs owner, admin, or developer.'}
          >
            New memory
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={() => setPurgeOpen(true)}
            disabled={!canGovern}
            title={canGovern ? 'Purge memories by text (audited)' : 'Purging memories needs owner or admin.'}
          >
            <ShieldAlert size={13} strokeWidth={1.8} />
            Purge by text…
          </ActionButton>
        </FilterActions>
      </FilterBar>

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
          if (visible.length === 0) {
            return <FootNote>No memories match this search — loosen it. Nothing was deleted.</FootNote>;
          }
          return (
            <DataTable>
              <DataHead>
                <DataCell $w="40%">Content</DataCell>
                <DataCell $w="14%">Visibility</DataCell>
                <DataCell $w="16%">Expires</DataCell>
                <DataCell $w="14%">Created</DataCell>
                <DataCell $w="44px" />
                <DataCell $w="44px" />
                <DataCell $w="44px" />
              </DataHead>
              {visible.map((m) => {
                const deleting = deletingId === m.id;
                const preview = m.content ?? '—';
                const truncated = preview.length > 140 ? `${preview.slice(0, 140)}…` : preview;
                return (
                  <DataRow key={m.id}>
                    <DataCell $w="40%">{truncated}</DataCell>
                    <DataCell $w="14%">
                      <StatusPill tone={m.visibility === 'organization' ? 'info' : 'warning'} dot={false}>
                        {m.visibility === 'private' ? 'User' : (m.visibility ?? 'organization')}
                      </StatusPill>
                    </DataCell>
                    <DataCell $w="16%" title={m.expiresAt ?? undefined}>
                      {m.expiresAt ? relativeTime(m.expiresAt) : 'no TTL'}
                    </DataCell>
                    <DataCell $w="14%" title={m.createdAt ?? undefined}>{relativeTime(m.createdAt)}</DataCell>
                    <DataCell $w="44px">
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate({ to: LIBRARIES_MEMORY_DETAIL_ROUTE_ID.replace('$memoryId', m.id) })}
                      >
                        Detail
                      </ActionButton>
                    </DataCell>
                    <DataCell $w="44px">
                      <ActionButton
                        variant="ghost"
                        size="sm"
                        disabled={!canWrite}
                        title={canWrite ? 'Edit this memory\u2019s content (audited)' : 'Editing memories needs owner, admin, or developer.'}
                        onClick={() => navigate({ to: LIBRARIES_MEMORY_EDIT_ROUTE_ID.replace('$memoryId', m.id) })}
                      >
                        Edit
                      </ActionButton>
                    </DataCell>
                    <DataCell $w="44px">
                      <ActionButton
                        variant="secondary"
                        size="sm"
                        disabled={!canWrite || deleting}
                        title={
                          canWrite
                            ? 'Delete this memory (audited)'
                            : 'Deleting memories needs owner, admin, or developer.'
                        }
                        onClick={() => {
                          const content = m.content ?? '';
                          setDeleteTarget({ id: m.id, preview: content.length > 80 ? `${content.slice(0, 80)}…` : content });
                        }}
                      >
                        Delete
                      </ActionButton>
                    </DataCell>
                  </DataRow>
                );
              })}
            </DataTable>
          );
        }}
      </QueryView>

      <FootNote>
        Scrub defaults, retention windows, and org-wide purge live with lifecycle in{' '}
        <Link to="/agent-studio/compliance">Compliance</Link>.{' '}Conversation-scoped memories surface
        on their conversation, not here. Memory proposals have no approval surface in this build —
        the footer states it instead of faking a queue. The list shows the newest 100 entries per
        scope — older entries are not listed, and search filters only what is loaded.
      </FootNote>

      <MemoryPurgeModal open={purgeOpen} onClose={() => setPurgeOpen(false)} memories={memories.data ?? []} scope={scope} />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this memory?"
        message={`“${deleteTarget?.preview ?? ''}” is tombstoned — retrieval stops seeing it immediately. Audited; history stays answerable.`}
        confirmLabel="Delete memory"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            const id = deleteTarget.id;
            setDeletingId(id);
            remove.mutate(id, {
              onSuccess: () => {
                setDeleteTarget(null);
                if (deletingId === id) setDeletingId(null);
              },
              onSettled: () => {
                if (deletingId === id) setDeletingId(null);
              },
            });
          }
        }}
        onCancel={() => {
          setDeleteTarget(null);
          setDeletingId(null);
        }}
      />
    </ViewShell>
  );
}

/**
 * DSR purge entry (C08): substring 3–128 with counter, blast-radius copy, one
 * explicit commit. The count is reported after the run — no count endpoint
 * exists to preview it, and none is faked.
 */
function MemoryPurgeModal({ open, onClose, memories, scope }: { open: boolean; onClose: () => void; memories: { content: string | null }[]; scope: string }) {
  const purge = usePurgeMemories();
  const [substring, setSubstring] = useState('');
  const [result, setResult] = useState<{ purged: number; truncated: boolean } | null>(null);

  const problem = validatePurgeSubstring(substring);
  const length = substring.trim().length;
  const trimmed = substring.trim().toLowerCase();
  const matchCount = trimmed.length >= 3
    ? memories.filter((m) => (m.content ?? '').toLowerCase().includes(trimmed)).length
    : 0;

  return (
    <Modal
      open={open}
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
        {length} / 128 characters (min 3), literal match (case-insensitive).
      </p>
      {problem && substring.trim() !== '' ? <ErrorText>{problem}</ErrorText> : null}
      {trimmed.length >= 3 && problem === null && (
        <p style={{ fontSize: 13, fontWeight: 600, color: matchCount > 0 ? '#d97706' : undefined }}>
          {matchCount} {matchCount === 1 ? 'memory' : 'memories'} match in the {scope} view.
          Purge affects every scope — verify the text carefully.
        </p>
      )}
      <p style={{ fontSize: 12, opacity: 0.85 }}>
        Every scope. Tombstoned — retrieval stops immediately. The query itself is never stored:
        the audit keeps a hash, the count, and the ids. <Link to="/platform/audit">Open Audit →</Link>
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
