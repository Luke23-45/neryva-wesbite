import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { CopyButton } from '@components/common/ui/CopyButton';
import { Segmented } from '@components/common/ui/Segmented';
import { pageItem } from '@styles/motion';
import { relativeTime } from '@/sections/pages/products/agent-studio/builder/lib/memory-model';
import { MarkdownText } from '@/sections/pages/products/agent-studio/chat/ChatMessages/MarkdownText';
import { useMemoryById } from './useMemoryById';
import { MEMORY_LIST_PATH } from './MemoryComposerForm';
import { SectionBackRow } from '../SectionBackRow';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';

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

const StatusNote = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.6;
`;

/** Full route id once the coordinator wires it (additive leaf under the libraries area, path '/memory/$memoryId'). */
export const LIBRARIES_MEMORY_DETAIL_ROUTE_ID = '/agent-studio/memory/$memoryId' as const;

/**
 * Memory detail — dedicated section replacing the "Memory detail" modal
 * from the Memory library page. The read view was ungated in the modal
 * version, so the section is ungated too; the Edit action keeps the
 * modal's `setup:author` disable rule. Unknown id → bounce to the memory
 * list (same rule as the tools edit unknown-id bounce).
 */
export function LibrariesMemoryDetailSection() {
  const { memoryId } = useParams({ from: LIBRARIES_MEMORY_DETAIL_ROUTE_ID });
  const navigate = useNavigate();
  const { role } = useOrg();
  const canWrite = canSetup(role, 'setup:author');
  const { item, isPending, isError } = useMemoryById(memoryId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [rendered, setRendered] = useState(false);

  const unknownId = !isPending && !isError && item === null;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Unknown memory id → back to the list. A failed read is NOT an
  // unknown id: when the request errors with no row, the honest error
  // state below renders instead of a blank page.
  useEffect(() => {
    if (unknownId) {
      navigate({ to: MEMORY_LIST_PATH });
    }
  }, [unknownId, navigate]);

  if (unknownId) {
    return null;
  }

  // The edit section path shares this route id's prefix — interpolate the
  // id into the path (P1 channels pattern: styled links erase TanStack's
  // per-route param inference).
  const editPath = `/agent-studio/memory/${memoryId}/edit`;

  const sourceRef = item?.sourceRef;
  const sourceEntries = sourceRef ? Object.entries(sourceRef) : [];

  return (
    <ViewShell>
      <SectionBackRow to={MEMORY_LIST_PATH}>
        <span aria-hidden="true">‹</span> Memory
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Memory detail</ViewTitle>
          <ViewSubtitle>
            The stored row — scope, provenance, validity, and TTL, exactly as the agents see it.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        {item ? (
          <Panel
            title="Memory"
            subtitle={`${item.scopeType ?? 'organization'} scope${item.scopeId ? ` · ${item.scopeId}` : ''}`}
            action={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <CopyButton value={item.content ?? ''} label="Copy" />
                <ActionButton
                  variant="secondary"
                  size="sm"
                  disabled={!canWrite}
                  title={canWrite ? 'Edit this memory\u2019s content (audited)' : 'Editing memories needs owner, admin, or developer.'}
                  onClick={() => navigate({ to: editPath })}
                >
                  Edit
                </ActionButton>
              </div>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'inherit', opacity: 0.7 }}>Content</span>
              <Segmented
                options={[
                  { value: 'plain' as const, label: 'Plain' },
                  { value: 'rendered' as const, label: 'Rendered' },
                ]}
                value={rendered ? 'rendered' : 'plain'}
                onChange={(v) => setRendered(v === 'rendered')}
                size="sm"
                ariaLabel="Content display"
              />
            </div>
            {rendered ? (
              <MarkdownText text={item.content ?? ''} />
            ) : (
              <p style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{item.content ?? '—'}</p>
            )}
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
              <DetailValue>
                {sourceEntries.length > 0 ? (
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {sourceEntries.map(([key, value]) => (
                      <span key={key}>
                        <code style={{ opacity: 0.7 }}>{key}</code>
                        {' — '}
                        {typeof value === 'string' ? value : JSON.stringify(value)}
                      </span>
                    ))}
                  </span>
                ) : (
                  '—'
                )}
              </DetailValue>
              <DetailKey>Embedding</DetailKey>
              <DetailValue>{item.embeddingModel ?? 'legacy row (pre-model stamp)'}</DetailValue>
              <DetailKey>Updated</DetailKey>
              <DetailValue>{item.updatedAt ? `${relativeTime(item.updatedAt)} · ${item.updatedAt}` : '—'}</DetailValue>
            </DetailGrid>
          </Panel>
        ) : isPending ? (
          <StatusNote>Loading the memory…</StatusNote>
        ) : (
          <StatusNote>Could not load this memory. It may have been deleted — return to the list and try again.</StatusNote>
        )}
      </motion.div>
    </ViewShell>
  );
}
