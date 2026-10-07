import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { Plus, Pencil, Play, Trash2 } from 'lucide-react';
import { StatusPill } from '@components/common/ui/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import { ActionButton } from '@components/common/ui/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import {
  ViewShell,
  ViewHeader,
  ViewHeaderRow,
  ViewTitle,
  ViewSubtitle,
} from '@components/common/ui/ViewLayout';
import {
  DataTable,
  DataHead,
  DataRow,
  DataCell,
} from '@components/common/ui/DataTable';
import { pageItem } from '@styles/motion';
import { useDeleteScope, useScopes, type KnowledgeScope } from '@hooks/studio/useKnowledgeLibrary';
import { relativeTime } from '@/sections/pages/products/agent-studio/builder/lib/memory-model';
import { SectionBackRow } from './SectionBackRow';

const Mono = styled.span`
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: ${({ theme }) => theme.app.text.secondary};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast},
    color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.app.surface.active};
    color: ${({ theme }) => theme.app.text.primary};
  }

  &:hover.danger {
    color: ${({ theme }) => theme.app.status.error.fg};
  }

  svg {
    width: 15px;
    height: 15px;
  }
`;

export function ScopesView() {
  const navigate = useNavigate();
  const scopesQuery = useScopes();
  const deleteScope = useDeleteScope();
  const [deleting, setDeleting] = useState<KnowledgeScope | null>(null);

  const confirmDelete = async () => {
    if (!deleting) return;
    await deleteScope.mutateAsync(deleting.slug);
    setDeleting(null);
  };

  return (
    <ViewShell>
      <SectionBackRow to="/agent-studio/knowledge">‹ Knowledge</SectionBackRow>
      <ViewHeader>
        <ViewHeaderRow>
          <div>
            <ViewTitle>Scopes</ViewTitle>
            <ViewSubtitle>
              Governed retrieval boundaries — attribute filters, pinned documents, and exclusions.
            </ViewSubtitle>
          </div>
          <ActionButton
            onClick={() => void navigate({ to: '/agent-studio/knowledge/scopes/new' })}
          >
            <Plus size={15} /> New scope
          </ActionButton>
        </ViewHeaderRow>
      </ViewHeader>

      <QueryView
        query={scopesQuery}
        isEmpty={(d) => d.length === 0}
        empty={{
          title: 'No scopes yet',
          description: 'Scopes bound what each agent may retrieve. Create one to get started.',
        }}
      >
        {(scopes) => (
          <motion.div {...pageItem}>
            <DataTable>
              <DataHead>
                <DataCell>Name</DataCell>
                <DataCell>Slug</DataCell>
                <DataCell>Version policy</DataCell>
                <DataCell>Updated</DataCell>
                <DataCell style={{ textAlign: 'right' }}>Actions</DataCell>
              </DataHead>
              {scopes.map((scope) => (
                  <DataRow key={scope.id}>
                    <DataCell>
                      <Link
                        to="/agent-studio/knowledge/scopes/$slug/simulate"
                        params={{ slug: scope.slug }}
                        style={{ fontWeight: 600, textDecoration: 'none', color: 'inherit' }}
                      >
                        {scope.name}
                      </Link>
                    </DataCell>
                    <DataCell>
                      <Mono>{scope.slug}</Mono>
                    </DataCell>
                    <DataCell>
                      <StatusPill tone={scope.versionPolicy === 'pinned_versions' ? 'info' : 'success'}>
                        {scope.versionPolicy === 'pinned_versions' ? 'Pinned' : 'Org-wide'}
                      </StatusPill>
                    </DataCell>
                    <DataCell>{relativeTime(scope.updatedAt)}</DataCell>
                    <DataCell>
                      <ActionRow>
                        <IconButton
                          title="Simulate retrieval"
                          onClick={() =>
                            void navigate({
                              to: '/agent-studio/knowledge/scopes/$slug/simulate',
                              params: { slug: scope.slug },
                            })
                          }
                        >
                          <Play />
                        </IconButton>
                        <IconButton
                          title="Edit scope"
                          onClick={() =>
                            void navigate({
                              to: '/agent-studio/knowledge/scopes/$slug/edit',
                              params: { slug: scope.slug },
                            })
                          }
                        >
                          <Pencil />
                        </IconButton>
                        <IconButton
                          title="Delete scope"
                          className="danger"
                          onClick={() => setDeleting(scope)}
                        >
                          <Trash2 />
                        </IconButton>
                      </ActionRow>
                    </DataCell>
                  </DataRow>
                ))}
            </DataTable>
          </motion.div>
        )}
      </QueryView>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete scope"
        message={
          deleting
            ? `Delete the scope "${deleting.name}" (${deleting.slug})? Agents bound to it will fall back to org-wide retrieval. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </ViewShell>
  );
}
