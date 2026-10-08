import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { StatusPill } from '@components/common/ui/StatusPill';
import { useAssistantDefinition, useKnowledgeHealth } from '@hooks/studio/useAgentAuthoring';
import { useDocuments } from '@hooks/studio/useSetupKnowledge';
import {
  coverageLabel,
  documentStateLabel,
  matchPinToDocument,
  MAX_RESULTS_DEFAULT,
  SKIP_COPY,
} from '@/sections/pages/products/agent-studio/builder/lib/knowledge-model';

import { EmptyNote, Tile, TileGrid, TileKey, TileValue, Whisper } from './primitives';
const PinList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const PinRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  flex-wrap: wrap;
`;

const PinSlug = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

/**
 * Dedicated Knowledge section on the agent detail page (C05 PLAN.md §3).
 * READ-ONLY by contract — pins, retrieval, and uploads live in the builder
 * Knowledge slot and the Knowledge library; this panel deep-links out and
 * never forks them. Pin health reads the ACTIVE version; draft pins resolve
 * to exact versions at publish.
 */
export function KnowledgePanel({ agentId }: { agentId: string }) {
  const form = useAssistantDefinition(agentId, { prefer: 'active' });
  const documents = useDocuments();
  const health = useKnowledgeHealth(agentId);

  const definition = form.data?.definition ?? null;
  const pins = definition?.context_policy.knowledge_sources ?? [];
  const retrieval = definition?.knowledge_policy?.retrieval_enabled ?? false;
  const maxResults = definition?.knowledge_policy?.max_results ?? MAX_RESULTS_DEFAULT;
  const inventory = documents.data ?? [];
  const healthPins = health.data?.pins ?? [];

  return (
    <Panel
      title="Knowledge — pinned sources"
      subtitle="What this agent may retrieve, and whether each pin is servable."
    >
      {pins.length === 0 ? (
        <EmptyNote>
          No pinned sources — {SKIP_COPY} {retrieval ? 'Retrieval is on but nothing is pinned.' : 'Retrieval is off.'}
        </EmptyNote>
      ) : (
        <>
          <PinList>
            {pins.map((slug) => {
              const matched = matchPinToDocument(slug, inventory);
              const healthPin = healthPins.find((p) => p.sourceSlug === slug);
              if (!matched.resolved) {
                return (
                  <PinRow key={slug}>
                    <StatusPill tone="warning" dot={false}>
                      unresolved
                    </StatusPill>
                    <PinSlug>{slug}</PinSlug>
                    <span>no document carries this slug — publish refuses without the degraded-knowledge ack</span>
                  </PinRow>
                );
              }
              const doc = matched.document;
              const docLabel = documentStateLabel(doc.state);
              const coverage =
                healthPin?.embeddingComplete === true
                  ? coverageLabel('ready', 'the current model').word
                  : healthPin?.embeddingComplete === false
                    ? coverageLabel('incomplete', 'the current model').word
                    : 'coverage at publish';
              const tone = doc.state === 'failed' ? 'error' : healthPin && !healthPin.resolved ? 'warning' : healthPin?.embeddingComplete === false ? 'warning' : 'success';
              return (
                <PinRow key={slug}>
                  <StatusPill tone={tone} dot={false}>
                    {docLabel.word}
                  </StatusPill>
                  <PinSlug>{slug}</PinSlug>
                  <span>
                    {doc.title ?? 'Untitled'} · v{doc.latestVersion ?? '—'} · {coverage}
                  </span>
                </PinRow>
              );
            })}
          </PinList>

          <TileGrid>
            <Tile>
              <TileKey>RETRIEVAL</TileKey>
              <TileValue>{retrieval ? 'On' : 'Off'}</TileValue>
            </Tile>
            <Tile>
              <TileKey>MAX RESULTS</TileKey>
              <TileValue>{maxResults}</TileValue>
            </Tile>
            <Tile>
              <TileKey>PIN HEALTH</TileKey>
              <TileValue>{health.data === undefined ? 'checking…' : health.data.degraded ? 'degraded' : 'healthy'}</TileValue>
            </Tile>
          </TileGrid>

          <Whisper>
            Pin health reads the ACTIVE version — draft pins resolve to exact versions at publish.{' '}
            <Link to="/agent-studio/knowledge">Open Knowledge library →</Link>
          </Whisper>
        </>
      )}
    </Panel>
  );
}
