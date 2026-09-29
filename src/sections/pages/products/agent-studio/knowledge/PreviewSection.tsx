import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useParams } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import { pageItem } from '@styles/motion';
import { useDocumentPreview } from '@hooks/studio/useSetupKnowledge';
import { SectionBackRow } from './SectionBackRow';

const KNOWLEDGE_PATH = '/agent-studio/knowledge';

/** Full route id (child of agentStudioKnowledgeRoute, path '/$docId/preview'). */
export const KNOWLEDGE_PREVIEW_ROUTE_ID = '/agent-studio/knowledge/$docId/preview' as const;

// Document states (engine knowledge schema): processing|ready|failed|retired.
const docTone: Record<string, StatusTone> = {
  ready: 'success',
  processing: 'info',
  failed: 'error',
  retired: 'warning',
};

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.55;
`;

const HitCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
`;

const HitMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  margin-bottom: 6px;
`;

const HitText = styled.div`
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
`;

const TruncatedNote = styled.p`
  font-size: 12px;
  opacity: 0.65;
`;

/**
 * Document preview — dedicated section replacing the PreviewModal (A4-01).
 * Byte-faithful to the modal: the stored text agents retrieve, latest-version
 * chunks in sequence order, the state pill, the server-capped window notice
 * (truncated), and the "no stored text yet" state before READY. Read-only —
 * no write gate (the library's preview affordance never had one).
 */
export function PreviewSection() {
  // Strict-from: the route is registered in routes.tsx under
  // agentStudioKnowledgeRoute.
  const params = useParams({ from: KNOWLEDGE_PREVIEW_ROUTE_ID });
  const docId = params.docId ?? '';
  const preview = useDocumentPreview(docId, { enabled: docId !== '' });
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <ViewShell>
      <SectionBackRow to={KNOWLEDGE_PATH}>
        <span aria-hidden="true">‹</span> Knowledge
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>
            Document preview
          </ViewTitle>
          <ViewSubtitle>The stored text agents retrieve — latest version, chunks in sequence order.</ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel
          title="Stored text"
          subtitle="What the retriever sees — verify the pin holds what you expect."
        >
          <QueryView
              query={preview}
              isEmpty={(p) => p === null}
              empty={{ title: 'Preview unavailable', description: 'The stored text could not be read.' }}
            >
              {(doc) => {
                // Type guard only: isEmpty already renders the empty state for
                // null, so children never receives it at runtime.
                if (!doc) return null;
                return (
                  <div>
                    <HitMeta>
                      <Mono>{doc.title ?? doc.sourceSlug}</Mono>
                      <StatusPill tone={docTone[doc.state] ?? 'neutral'}>{doc.state}</StatusPill>
                      <Muted>
                        version {doc.latestVersion ?? '—'} · {doc.totalChunks} chunk{doc.totalChunks === 1 ? '' : 's'}
                      </Muted>
                    </HitMeta>
                    {doc.chunks.length === 0 ? (
                      <Muted>No stored text yet — chunks appear once ingestion reaches READY.</Muted>
                    ) : (
                      <>
                        {doc.truncated && (
                          <TruncatedNote>
                            Showing the first {doc.chunks.length} of {doc.totalChunks} chunks — the stored text continues.
                          </TruncatedNote>
                        )}
                        {doc.chunks.map((chunk) => (
                          <HitCard key={chunk.sequence}>
                            <HitMeta>
                              <Muted>
                                chunk #{chunk.sequence}
                                {chunk.byteStart !== null && chunk.byteEnd !== null
                                  ? ` · bytes ${chunk.byteStart}–${chunk.byteEnd}`
                                  : ''}
                              </Muted>
                            </HitMeta>
                            <HitText>{chunk.text}</HitText>
                          </HitCard>
                        ))}
                      </>
                    )}
                  </div>
                );
              }}
            </QueryView>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
