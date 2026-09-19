import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ShieldAlert } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
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
  useCreateMemory,
  useDeleteMemory,
  useMemories,
  useOrgMemoryPolicy,
  usePurgeMemories,
  type MemoryItem,
} from '@hooks/studio/useSetupKnowledge';
import {
  MEMORY_CONTENT_MAX,
  PURGE_SUBSTRING_MAX,
  PURGE_SUBSTRING_MIN,
  SCRUB_COPY,
  describeTtl,
  filterMemories,
  relativeTime,
  validatePurgeSubstring,
} from '@/sections/pages/products/agent-studio/builder/lib/memory-model';

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

const FootNote = styled.p`
  font-size: 12px;
  opacity: 0.65;
  margin-top: 12px;
  line-height: 1.6;
`;

const DetailGrid = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: 130px 1fr;
  row-gap: 8px;
  column-gap: 12px;
  font-size: 13px;
`;

const DetailKey = styled.dt`
  color: ${({ theme }) => theme.app.text.ghost};
`;

const DetailValue = styled.dd`
  margin: 0;
  color: ${({ theme }) => theme.app.text.secondary};
  overflow-wrap: anywhere;
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
  const [detail, setDetail] = useState<MemoryItem | null>(null);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

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
          Scrub: {policy.policy ? SCRUB_COPY[policy.policy.scrub] : 'loading…'}
        </span>
        <span>
          Default TTL: {policy.policy ? describeTtl(policy.policy.ttlSeconds) : 'loading…'}
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
            <span style={{ fontSize: 12, opacity: 0.7 }}>All assistants — arrive from an agent to narrow.</span>
          )
        )}
      </div>

      <FilterBar>
        <TextInput label="Search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search content…" />
        <ActionButton
          variant="secondary"
          onClick={() => setComposerOpen(true)}
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
              </DataHead>
              {visible.map((m) => {
                const deleting = deletingId === m.id;
                return (
                  <DataRow key={m.id}>
                    <DataCell>{(m.content ?? '—').slice(0, 140)}</DataCell>
                    <DataCell>
                      <StatusPill tone={m.visibility === 'organization' ? 'info' : 'warning'} dot={false}>
                        {m.visibility ?? 'organization'}
                      </StatusPill>
                    </DataCell>
                    <DataCell title={m.expiresAt ?? undefined}>
                      {m.expiresAt ? relativeTime(m.expiresAt) : 'no TTL'}
                    </DataCell>
                    <DataCell title={m.createdAt ?? undefined}>{relativeTime(m.createdAt)}</DataCell>
                    <DataCell>
                      <ActionButton variant="ghost" size="sm" onClick={() => setDetail(m)}>
                        Detail
                      </ActionButton>
                    </DataCell>
                    <DataCell>
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
                          setDeletingId(m.id);
                          setDeleteTarget({ id: m.id, preview: (m.content ?? '').slice(0, 80) });
                        }}
                      >
                        {deleting ? 'Deleting…' : 'Delete'}
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
        <Link to="/agent-studio/compliance">Compliance</Link>. Conversation-scoped memories surface
        on their conversation, not here. Memory proposals are approved where they surface — no
        proposals queue endpoint exists yet, so none is faked here.
      </FootNote>

      <MemoryDetailModal item={detail} onClose={() => setDetail(null)} />
      <MemoryComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} />
      <MemoryPurgeModal open={purgeOpen} onClose={() => setPurgeOpen(false)} />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this memory?"
        message={`“${deleteTarget?.preview ?? ''}” is tombstoned — retrieval stops seeing it immediately. Audited; history stays answerable.`}
        confirmLabel="Delete memory"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            const id = deleteTarget.id;
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

function MemoryDetailModal({ item, onClose }: { item: MemoryItem | null; onClose: () => void }) {
  const sourceRef = item?.sourceRef;
  const sourceText = sourceRef
    ? Object.entries(sourceRef)
        .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
        .join(' · ')
    : '—';
  return (
    <Modal open={item !== null} onClose={onClose} title="Memory detail" width={600}>
      {item && (
        <>
          <p style={{ fontSize: 13, lineHeight: 1.6 }}>{item.content ?? '—'}</p>
          <DetailGrid>
            <DetailKey>Scope</DetailKey>
            <DetailValue>
              {item.scopeType ?? 'organization'}
              {item.scopeId ? ` · ${item.scopeId}` : ''}
            </DetailValue>
            <DetailKey>Visibility</DetailKey>
            <DetailValue>{item.visibility ?? 'organization'}</DetailValue>
            <DetailKey>Provenance</DetailKey>
            <DetailValue>{item.provenance ?? '—'}</DetailValue>
            <DetailKey>Confidence</DetailKey>
            <DetailValue>{item.confidence !== null && item.confidence !== undefined ? item.confidence : '—'}</DetailValue>
            <DetailKey>Valid</DetailKey>
            <DetailValue>
              {item.validFrom ? relativeTime(item.validFrom) : '—'} →{' '}
              {item.invalidAt ? relativeTime(item.invalidAt) : 'now'}
            </DetailValue>
            <DetailKey>Expires</DetailKey>
            <DetailValue>{item.expiresAt ? `${relativeTime(item.expiresAt)} · ${item.expiresAt}` : 'no TTL — kept until deleted'}</DetailValue>
            <DetailKey>Source ref</DetailKey>
            <DetailValue>{sourceText}</DetailValue>
            <DetailKey>Embedding</DetailKey>
            <DetailValue>{item.embeddingModel ?? 'legacy row (pre-model stamp)'}</DetailValue>
            <DetailKey>Updated</DetailKey>
            <DetailValue>{item.updatedAt ? `${relativeTime(item.updatedAt)} · ${item.updatedAt}` : '—'}</DetailValue>
          </DetailGrid>
        </>
      )}
    </Modal>
  );
}

/**
 * Composer migrated from KnowledgeView (C05 PLAN §10.5 — moved, not copied):
 * same POST memories contract, now with an organization/user scope picker
 * (the engine coerces anything else to organization, so nothing else is
 * offered) and an 8192-char cap with counter (the engine silent-truncates).
 */
function MemoryComposerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createMemory = useCreateMemory();
  const [content, setContent] = useState('');
  const [scopeType, setScopeType] = useState<'organization' | 'user'>('organization');

  const trimmed = content.trim();
  const overCap = content.length > MEMORY_CONTENT_MAX;
  const valid = trimmed !== '' && !overCap;

  return (
    <Modal
      open={open}
      onClose={() => {
        setContent('');
        onClose();
      }}
      title="New memory"
      width={560}
      footer={
        <>
          <ActionButton
            variant="secondary"
            onClick={() => {
              setContent('');
              onClose();
            }}
          >
            Cancel
          </ActionButton>
          <ActionButton
            size="sm"
            disabled={!valid || createMemory.isPending}
            onClick={() =>
              createMemory.mutate(
                { content: trimmed.slice(0, MEMORY_CONTENT_MAX), scopeType },
                {
                  onSuccess: () => {
                    setContent('');
                    onClose();
                  },
                },
              )
            }
          >
            Save memory
          </ActionButton>
        </>
      }
    >
      <TextArea
        label="Memory content"
        id="memory-composer-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="The org ships on Fridays; freeze Thursdays…"
      />
      <p style={{ fontSize: 12, opacity: 0.75 }}>
        {content.length.toLocaleString()} / {MEMORY_CONTENT_MAX.toLocaleString()} — the engine truncates past the cap.
      </p>
      <div style={{ marginTop: 8 }}>
        <Segmented
          options={[
            { value: 'organization' as const, label: 'Organization' },
            { value: 'user' as const, label: 'User' },
          ]}
          value={scopeType}
          onChange={setScopeType}
          size="sm"
          ariaLabel="New memory scope"
        />
      </div>
      <p style={{ fontSize: 12, opacity: 0.75 }}>
        {scopeType === 'user'
          ? 'User memories resolve per account at run time — visible only to that account.'
          : 'Organization memories are retrievable by every run in the org.'}{' '}
        Writes are scrubbed then embedded, TTL-defaulted, and audited.
      </p>
    </Modal>
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
  const [result, setResult] = useState<number | null>(null);

  const problem = validatePurgeSubstring(substring);
  const length = substring.trim().length;

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
                onSuccess: (data) => setResult(data.purged),
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
        the audit keeps a hash, the count, and the ids. <Link to="/platform/audit">Open Audit →</Link>
      </p>
      {result !== null && (
        <p style={{ fontSize: 13 }}>
          Purged {result} {result === 1 ? 'memory' : 'memories'} — nothing matched stays retrievable.
        </p>
      )}
    </Modal>
  );
}
