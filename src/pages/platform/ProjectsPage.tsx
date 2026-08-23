/**
 * /platform/projects — project containers: create, rename, archive/restore.
 */
import { useState } from 'react';
import { FolderPlus, Archive, RotateCcw } from 'lucide-react';
import { useProjects } from '@hooks/engine/queries';
import { useCreateProject, useUpdateProject, useArchiveProject, useUnarchiveProject } from '@hooks/engine/mutations';
import { useOrg } from '@/Context/OrgContext';
import { Panel } from '@components/common/ui/Panel/Panel';
import { Modal } from '@components/common/ui/Modal/Modal';
import { TextInput } from '@components/common/ui/TextInput/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton/ActionButton';
import { StatusPill } from '@components/common/ui/StatusPill/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import { DataTable, DataHead, DataRow, DataCell, CellPrimary, CellMeta } from '@components/common/ui/DataTable';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';

export default function ProjectsPage() {
  const { atLeast } = useOrg();
  const canManage = atLeast('developer');
  const [showArchived, setShowArchived] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const projects = useProjects(showArchived);
  const create = useCreateProject();
  const update = useUpdateProject();
  const archive = useArchiveProject();
  const unarchive = useUnarchiveProject();

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>Projects</ViewTitle>
        <ViewSubtitle>Sub-organization containers that scope API keys, limits, and usage.</ViewSubtitle>
      </ViewHeader>

      <Panel
        title="Projects"
        flush
        action={
          <>
            <ActionButton variant="ghost" size="sm" onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Hide archived' : 'Show archived'}
            </ActionButton>
            {canManage && (
              <ActionButton variant="primary" size="sm" onClick={() => { setName(''); setDescription(''); setCreateOpen(true); }}>
                <FolderPlus size={13} /> New project
              </ActionButton>
            )}
          </>
        }
      >
        <QueryView query={projects} isEmpty={(d) => d.projects.length === 0} empty={{ title: 'No projects', description: canManage ? 'Create the first project to scope keys and usage.' : 'Ask a developer or admin to create one.' }}>
          {(data) => (
            <DataTable>
              <thead>
                <DataHead>
                  <DataCell as="th">Project</DataCell>
                  <DataCell as="th">Created</DataCell>
                  <DataCell as="th">State</DataCell>
                  <DataCell as="th" />
                </DataHead>
              </thead>
              <tbody>
                {data.projects.map((project) => (
                  <DataRow key={project.id}>
                    <DataCell>
                      <CellPrimary>{project.name}</CellPrimary>
                      {project.description && <CellMeta>{project.description}</CellMeta>}
                    </DataCell>
                    <DataCell>{new Date(project.createdAt).toLocaleDateString()}</DataCell>
                    <DataCell>
                      <StatusPill tone={project.archivedAt ? 'neutral' : 'success'}>{project.archivedAt ? 'archived' : 'active'}</StatusPill>
                    </DataCell>
                    <DataCell>
                      {canManage && !project.archivedAt && (
                        <>
                          <ActionButton variant="ghost" size="sm" onClick={() => setRenaming({ id: project.id, name: project.name })}>Rename</ActionButton>
                          <ActionButton variant="ghost" size="sm" onClick={() => archive.mutate({ projectId: project.id })}><Archive size={12} /> Archive</ActionButton>
                        </>
                      )}
                      {canManage && project.archivedAt && (
                        <ActionButton variant="secondary" size="sm" onClick={() => unarchive.mutate({ projectId: project.id })}><RotateCcw size={12} /> Restore</ActionButton>
                      )}
                    </DataCell>
                  </DataRow>
                ))}
              </tbody>
            </DataTable>
          )}
        </QueryView>
      </Panel>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New project"
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" disabled={name.trim().length < 1 || create.isPending} onClick={() => create.mutate({ name, description }, { onSuccess: () => setCreateOpen(false) })}>
              Create project
            </ActionButton>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
          <TextInput label="Name" name="project-name" placeholder="production" value={name} onChange={(e) => setName(e.target.value)} />
          <TextInput label="Description (optional)" name="project-desc" placeholder="What lives here" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </Modal>

      <Modal
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        title="Rename project"
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setRenaming(null)}>Cancel</ActionButton>
            <ActionButton
              variant="primary"
              disabled={!renaming || renaming.name.trim().length < 1 || update.isPending}
              onClick={() => renaming && update.mutate({ projectId: renaming.id, name: renaming.name }, { onSuccess: () => setRenaming(null) })}
            >
              Save
            </ActionButton>
          </>
        }
      >
        <div style={{ paddingTop: 4 }}>
          <TextInput label="Name" name="project-rename" value={renaming?.name ?? ''} onChange={(e) => setRenaming((prev) => (prev ? { ...prev, name: e.target.value } : prev))} />
        </div>
      </Modal>
    </ViewShell>
  );
}
