import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ShieldCheck, User } from 'lucide-react';
import { StatusPill, type StatusTone } from '@components/common/ui/StatusPill';
import { Panel } from '@components/common/ui/Panel';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { TextInput } from '@components/common/ui/TextInput';
import { EmptyState } from '@components/common/ui/EmptyState';
import { QueryView } from '@components/common/ui/AsyncStates';
import {
  ViewShell,
  ViewHeader,
  ViewHeaderRow,
  ViewTitle,
  ViewSubtitle,
} from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import {
  useCurateDocument,
  useDocumentProvenance,
  useSetDocumentOwner,
  type CurationAction,
} from '@hooks/studio/useKnowledgeLibrary';
import { useDocuments } from '@hooks/studio/useSetupKnowledge';
import { SectionBackRow } from './SectionBackRow';

/** Full route id (child of agentStudioKnowledgeRoute, path '/$docId/curate'). */
export const KNOWLEDGE_CURATE_ROUTE_ID = '/agent-studio/knowledge/$docId/curate' as const;

const curationTone: Record<string, StatusTone> = {
  unreviewed: 'info',
  curated: 'success',
  verified: 'success',
  deprecated: 'warning',
  rejected: 'error',
};

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin: 24px 0 12px;
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin: 16px 0;
`;

const StatusItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StatusLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const StatusValue = styled.span`
  font-size: 14px;
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 16px 0;
`;

const OwnerRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin: 16px 0;
`;

const JsonBlock = styled.pre`
  background: ${({ theme }) => theme.app.surface.subtle};
  border-radius: 8px;
  padding: 16px;
  font-size: 12px;
  overflow-x: auto;
  line-height: 1.5;
`;

const Collapsible = styled.details`
  margin: 12px 0;
  summary {
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 0;
  }
`;

const ACTIONS: { action: CurationAction; label: string; variant: 'secondary' | 'danger' }[] = [
  { action: 'curated', label: 'Curated', variant: 'secondary' },
  { action: 'verified', label: 'Verified', variant: 'secondary' },
  { action: 'deprecated', label: 'Deprecated', variant: 'secondary' },
  { action: 'rejected', label: 'Rejected', variant: 'danger' },
];

export function CurateView() {
  const params = useParams({ from: KNOWLEDGE_CURATE_ROUTE_ID });
  const docId = params.docId ?? '';
  const provenance = useDocumentProvenance(docId, { enabled: docId !== '' });
  const documents = useDocuments();
  const curate = useCurateDocument();
  const setOwner = useSetDocumentOwner();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectConfirm, setRejectConfirm] = useState('');
  const [ownerInput, setOwnerInput] = useState('');

  const doc = documents.data?.find((d) => d.id === docId);
  const curationStatus = doc?.curationStatus ?? 'unreviewed';

  const handleCurate = (action: CurationAction) => {
    if (action === 'rejected') {
      setRejectOpen(true);
      return;
    }
    curate.mutate({ documentId: docId, action });
  };

  const handleRejectConfirm = () => {
    if (rejectConfirm.trim().toLowerCase() !== 'reject') return;
    curate.mutate({ documentId: docId, action: 'rejected' });
    setRejectOpen(false);
    setRejectConfirm('');
  };

  const handleSaveOwner = () => {
    const trimmed = ownerInput.trim();
    setOwner.mutate({
      documentId: docId,
      ownerId: trimmed === '' ? null : trimmed,
    });
  };

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/knowledge">
        <span aria-hidden="true">‹</span> Knowledge
      </SectionBackRow>
      <ViewHeader>
        <ViewHeaderRow>
          <div>
            <ViewTitle>Curate document</ViewTitle>
            <ViewSubtitle>Review status, ownership, and provenance.</ViewSubtitle>
          </div>
        </ViewHeaderRow>
      </ViewHeader>

      <QueryView query={provenance}>
        {(data) => {
          if (!data) {
            return (
              <EmptyState
                icon={<ShieldCheck size={32} />}
                title="Document not found"
                description="This document does not exist in your organization."
              />
            );
          }
          return (
            <motion.div {...pageItem}>
              <SectionTitle>Current status</SectionTitle>
              <Panel>
                <StatusGrid>
                  <StatusItem>
                    <StatusLabel>Curation</StatusLabel>
                    <StatusValue>
                      <StatusPill tone={curationTone[curationStatus] ?? 'info'}>
                        {curationStatus}
                      </StatusPill>
                    </StatusValue>
                  </StatusItem>
                  <StatusItem>
                    <StatusLabel>Owner</StatusLabel>
                    <StatusValue>{data.ownerId ?? '—'}</StatusValue>
                  </StatusItem>
                  <StatusItem>
                    <StatusLabel>Reviewer</StatusLabel>
                    <StatusValue>{data.reviewerId ?? '—'}</StatusValue>
                  </StatusItem>
                  <StatusItem>
                    <StatusLabel>Reviewed at</StatusLabel>
                    <StatusValue>
                      {data.reviewedAt
                        ? new Date(data.reviewedAt).toLocaleString()
                        : '—'}
                    </StatusValue>
                  </StatusItem>
                </StatusGrid>
              </Panel>

              <SectionTitle>Set curation</SectionTitle>
              <ActionsRow>
                {ACTIONS.map(({ action, label, variant }) => (
                  <ActionButton
                    key={action}
                    variant={variant}
                    onClick={() => handleCurate(action)}
                    disabled={curate.isPending}
                  >
                    {label}
                  </ActionButton>
                ))}
              </ActionsRow>

              <SectionTitle>Owner</SectionTitle>
              <Panel>
                <OwnerRow>
                  <div style={{ flex: 1 }}>
                    <TextInput
                      label="Owner ID (UUID, empty to clear)"
                      value={ownerInput}
                      onChange={(e) => setOwnerInput(e.target.value)}
                      placeholder={data.ownerId ?? 'No owner assigned'}
                    />
                  </div>
                  <ActionButton
                    onClick={handleSaveOwner}
                    disabled={setOwner.isPending}
                  >
                    <User size={14} /> Save
                  </ActionButton>
                </OwnerRow>
              </Panel>

              <SectionTitle>Provenance</SectionTitle>
              <Panel>
                <StatusGrid>
                  <StatusItem>
                    <StatusLabel>Origin</StatusLabel>
                    <StatusValue>{data.origin}</StatusValue>
                  </StatusItem>
                  <StatusItem>
                    <StatusLabel>Source artifact</StatusLabel>
                    <StatusValue style={{ fontFamily: 'monospace', fontSize: 12 }}>
                      {data.sourceArtifactId.slice(0, 8)}…
                    </StatusValue>
                  </StatusItem>
                  <StatusItem>
                    <StatusLabel>Created</StatusLabel>
                    <StatusValue>
                      {new Date(data.createdAt).toLocaleString()}
                    </StatusValue>
                  </StatusItem>
                </StatusGrid>
                <Collapsible>
                  <summary>Provenance JSON</summary>
                  <JsonBlock>{JSON.stringify(data.provenance, null, 2)}</JsonBlock>
                </Collapsible>
              </Panel>

              <ConfirmDialog
                open={rejectOpen}
                title="Reject this document"
                message="Rejected documents are excluded from retrieval. Type 'reject' to confirm."
                confirmLabel="Reject"
                destructive
                confirmDisabled={rejectConfirm.trim().toLowerCase() !== 'reject' || curate.isPending}
                onConfirm={handleRejectConfirm}
                onCancel={() => {
                  setRejectOpen(false);
                  setRejectConfirm('');
                }}
              >
                <TextInput
                  label="Type 'reject' to confirm"
                  value={rejectConfirm}
                  onChange={(e) => setRejectConfirm(e.target.value)}
                  placeholder="reject"
                />
              </ConfirmDialog>
            </motion.div>
          );
        }}
      </QueryView>
    </ViewShell>
  );
}
