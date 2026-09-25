/**
 * /platform/settings — the org profile + workspace settings against the
 * engine: name/region/retention (tenants seam), support email, default
 * project, branding, preferences; groups management; service accounts
 * (rotate/disable with one-time token reveal); and the danger zone
 * (ownership transfer + staged deletion with step-up proofs and the
 * grace-window status). Default model/provider stays read-only here —
 * model catalogs belong to the config-publish regime.
 */
import { useState } from 'react';
import styled from 'styled-components';
import { Save, Plus, Trash2, Bot, RefreshCw, AlertTriangle, Crown } from 'lucide-react';
import { useOrgProfile, useGroups, useGroupMembers, useServiceAccounts, useDeletionStatus, useMembers, type GroupMemberRow } from '@hooks/engine/queries';
import {
  useUpdateOrgSettings, useCreateGroup, useDeleteGroup, useAddGroupMember, useRemoveGroupMember,
  useCreateServiceAccount, useRotateServiceAccountToken, useDisableServiceAccount, useEnableServiceAccount,
  useTransferOwnership, useRequestOrgDeletion, useCancelOrgDeletion,
} from '@hooks/engine/mutations';
import { useOrg } from '@/Context/OrgContext';
import { requestStepUp } from '@lib/engine/stepup';
import { Panel } from '@components/common/ui/Panel/Panel';
import { Modal } from '@components/common/ui/Modal/Modal';
import { TextInput } from '@components/common/ui/TextInput/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog/ConfirmDialog';
import { StatusPill } from '@components/common/ui/StatusPill/StatusPill';
import { Segmented } from '@components/common/ui/Segmented/Segmented';
import { QueryView } from '@components/common/ui/AsyncStates';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { DataTable, DataHead, DataRow, DataCell, CellPrimary, CellMeta, CellMono } from '@components/common/ui/DataTable';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle, SectionTitle, Toolbar, ToolbarGroup } from '@components/common/ui/ViewLayout';

type Tab = 'general' | 'groups' | 'service-accounts' | 'danger';

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 460px;
  padding-top: 4px;
`;

const SaveRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const TokenReveal = styled.div`
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 8px;
  padding: 12px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  word-break: break-all;
`;

const DangerNote = styled.p`
  font-size: 12px;
  opacity: 0.65;
  margin: 0;
`;

export default function OrgSettingsPage() {
  const { role, canManageMembers, atLeast } = useOrg();
  const [tab, setTab] = useState<Tab>('general');

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>Settings</ViewTitle>
        <ViewSubtitle>Organization profile, access groups, machine identities, and lifecycle.</ViewSubtitle>
      </ViewHeader>
      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        size="md"
        options={[
          { value: 'general', label: 'General' },
          { value: 'groups', label: 'Groups' },
          { value: 'service-accounts', label: 'Service accounts' },
          { value: 'danger', label: 'Danger zone' },
        ]}
      />
      {tab === 'general' && <GeneralTab canEdit={atLeast('admin')} />}
      {tab === 'groups' && <GroupsTab canManage={canManageMembers} />}
      {tab === 'service-accounts' && <ServiceAccountsTab canManage={atLeast('admin')} />}
      {tab === 'danger' && <DangerTab isOwner={role === 'owner'} />}
    </ViewShell>
  );
}

// ── General ─────────────────────────────────────────────────────────────────

function GeneralTab({ canEdit }: { canEdit: boolean }) {
  const profile = useOrgProfile();
  const update = useUpdateOrgSettings();
  const [form, setForm] = useState<{ name?: string; region?: string; retentionDays?: number; supportEmail?: string } | null>(null);

  return (
    <QueryView query={profile} skeleton={<Skeleton $h="320px" $r="12px" />}>
      {(data) => {
        const value = form ?? {
          name: data.org.name,
          region: data.org.region ?? '',
          retentionDays: data.org.retentionDays ?? undefined,
          supportEmail: data.settings.supportEmail ?? '',
        };
        const dirty = form !== null;
        return (
          <Panel title="Workspace" subtitle="Identity and defaults for this organization.">
            <Form>
              <TextInput label="Organization name" name="org-name" value={value.name ?? ''} onChange={(e) => setForm({ ...value, name: e.target.value })} disabled={!canEdit} />
              <TextInput label="Region" name="org-region" value={value.region ?? ''} onChange={(e) => setForm({ ...value, region: e.target.value })} disabled={!canEdit} hint="Data residency hint used by product runtimes." />
              <TextInput
                label="Retention (days)"
                name="org-retention"
                type="number"
                value={value.retentionDays?.toString() ?? ''}
                onChange={(e) => setForm({ ...value, retentionDays: e.target.value ? Number.parseInt(e.target.value, 10) : undefined })}
                disabled={!canEdit}
                hint="Runtime data retention for this organization (1–3650)."
              />
              <TextInput label="Support email" name="org-support" type="email" value={value.supportEmail ?? ''} onChange={(e) => setForm({ ...value, supportEmail: e.target.value })} disabled={!canEdit} hint="Where this org's members reach your internal help desk." />
              <DangerNote>Default model and provider are managed by published product configuration, not org settings.</DangerNote>
              {canEdit && (
                <SaveRow>
                  <ActionButton variant="ghost" disabled={!dirty || update.isPending} onClick={() => setForm(null)}>Reset</ActionButton>
                  <ActionButton
                    variant="primary"
                    disabled={!dirty || update.isPending}
                    onClick={() => update.mutate({ ...(value.name ? { name: value.name } : {}), ...(value.region ? { region: value.region } : {}), ...(value.retentionDays ? { retention_days: value.retentionDays } : {}), ...(value.supportEmail !== undefined ? { support_email: value.supportEmail || null } : {}) }, { onSuccess: () => setForm(null) })}
                  >
                    <Save size={13} /> Save changes
                  </ActionButton>
                </SaveRow>
              )}
            </Form>
          </Panel>
        );
      }}
    </QueryView>
  );
}

// ── Groups ──────────────────────────────────────────────────────────────────

function GroupsTab({ canManage }: { canManage: boolean }) {
  const groups = useGroups();
  const members = useMembers({ limit: 100 });
  const create = useCreateGroup();
  const remove = useDeleteGroup();
  const addMember = useAddGroupMember();
  const removeMember = useRemoveGroupMember();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [addTo, setAddTo] = useState<string | null>(null);
  const [memberId, setMemberId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ groupId: string; accountId: string; label: string } | null>(null);

  return (
    <>
      <SectionTitle>Groups</SectionTitle>
      <Panel
        flush
        action={canManage ? (
          <ActionButton variant="primary" size="sm" onClick={() => { setName(''); setDescription(''); setCreateOpen(true); }}>
            <Plus size={13} /> New group
          </ActionButton>
        ) : undefined}
      >
        <QueryView query={groups} isEmpty={(d) => d.groups.length === 0} empty={{ title: 'No groups', description: canManage ? 'Groups organize members for finer-grained product access.' : 'No groups have been created yet.' }}>
          {(data) => (
            <DataTable>
              <thead>
                <DataHead>
                  <DataCell as="th">Group</DataCell>
                  <DataCell as="th">Members</DataCell>
                  <DataCell as="th" />
                </DataHead>
              </thead>
              <tbody>
                {data.groups.map((group) => (
                  <DataRow key={group.id}>
                    <DataCell>
                      <CellPrimary>{group.name}</CellPrimary>
                      {group.description && <CellMeta>{group.description}</CellMeta>}
                    </DataCell>
                    <DataCell>
                      {group.memberCount > 0 ? (
                        <ActionButton variant="ghost" size="sm" onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}>
                          {expandedGroup === group.id ? 'Hide' : 'View'} {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                        </ActionButton>
                      ) : (
                        group.memberCount
                      )}
                    </DataCell>
                    <DataCell>
                      {canManage && (
                        <>
                          <ActionButton variant="ghost" size="sm" onClick={() => { setAddTo(group.id); setMemberId(''); }}>Add member</ActionButton>
                          <ActionButton variant="ghost" size="sm" onClick={() => setDeleteTarget({ id: group.id, name: group.name })}><Trash2 size={12} /> Delete</ActionButton>
                        </>
                      )}
                    </DataCell>
                  </DataRow>
                ))}
              </tbody>
            </DataTable>
          )}
        </QueryView>
      </Panel>
      {expandedGroup && (
        <Panel>
          <GroupMemberList groupId={expandedGroup} canManage={canManage} onClose={() => setExpandedGroup(null)} onRemove={(m) => setRemoveTarget({ groupId: expandedGroup, accountId: m.accountId, label: m.displayName ?? m.email })} />
        </Panel>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New group"
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</ActionButton>
            <ActionButton variant="primary" disabled={name.trim().length < 1 || create.isPending} onClick={() => create.mutate({ name, description }, { onSuccess: () => setCreateOpen(false) })}>Create group</ActionButton>
          </>
        }
      >
        <Form>
          <TextInput label="Name" name="group-name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextInput label="Description (optional)" name="group-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Form>
      </Modal>

      <Modal
        open={addTo !== null}
        onClose={() => setAddTo(null)}
        title="Add member to group"
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setAddTo(null)}>Cancel</ActionButton>
            <ActionButton variant="primary" disabled={!memberId || addMember.isPending} onClick={() => addTo && addMember.mutate({ groupId: addTo, accountId: memberId }, { onSuccess: () => setAddTo(null) })}>Add</ActionButton>
          </>
        }
      >
        <div style={{ paddingTop: 4 }}>
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#eceef4', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
            <option value="">Select a member…</option>
            {(members.data?.members ?? []).map((m) => (
              <option key={m.accountId} value={m.accountId}>{m.displayName ?? m.email} ({m.email})</option>
            ))}
          </select>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete group "${deleteTarget?.name ?? ''}"?`}
        message="Members keep their org roles; only the grouping is removed."
        confirmLabel="Delete group"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            remove.mutate({ groupId: deleteTarget.id });
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={removeTarget !== null}
        title={`Remove ${removeTarget?.label ?? 'member'} from this group?`}
        message="The member keeps their org role; only the group assignment is removed."
        confirmLabel="Remove member"
        destructive
        onConfirm={() => {
          if (removeTarget) {
            removeMember.mutate({ groupId: removeTarget.groupId, accountId: removeTarget.accountId });
          }
          setRemoveTarget(null);
        }}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  );
}

function GroupMemberList({ groupId, canManage, onClose, onRemove }: { groupId: string; canManage: boolean; onClose: () => void; onRemove: (m: GroupMemberRow) => void }) {
  const members = useGroupMembers(groupId);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <SectionTitle style={{ margin: 0 }}>Group members</SectionTitle>
        <ActionButton variant="ghost" size="sm" onClick={onClose}>Close</ActionButton>
      </div>
      <QueryView query={members} isEmpty={(d) => d.members.length === 0} empty={{ title: 'No members', description: 'This group has no members yet.' }}>
        {(data) => (
          <DataTable>
            <tbody>
              {data.members.map((m) => (
                <DataRow key={m.accountId}>
                  <DataCell>
                    <CellPrimary>{m.displayName ?? m.email}</CellPrimary>
                    <CellMeta>{m.email} · {m.role}</CellMeta>
                  </DataCell>
                  <DataCell>
                    {canManage && (
                      <ActionButton variant="ghost" size="sm" onClick={() => onRemove(m)}>Remove</ActionButton>
                    )}
                  </DataCell>
                </DataRow>
              ))}
            </tbody>
          </DataTable>
        )}
      </QueryView>
    </>
  );
}

// ── Service accounts ────────────────────────────────────────────────────────

function ServiceAccountsTab({ canManage }: { canManage: boolean }) {
  const accounts = useServiceAccounts();
  const create = useCreateServiceAccount();
  const rotate = useRotateServiceAccountToken();
  const disable = useDisableServiceAccount();
  const enable = useEnableServiceAccount();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [scopes, setScopes] = useState('agent-studio:read');
  const [issued, setIssued] = useState<string | null>(null);

  return (
    <>
      <SectionTitle>Service accounts</SectionTitle>
      <Panel
        flush
        action={canManage ? (
          <ActionButton variant="primary" size="sm" onClick={() => { setName(''); setScopes('agent-studio:read'); setIssued(null); setCreateOpen(true); }}>
            <Bot size={13} /> New service account
          </ActionButton>
        ) : undefined}
      >
        <QueryView query={accounts} isEmpty={(d) => d.serviceAccounts.length === 0} empty={{ title: 'No service accounts', description: canManage ? 'Machine identities for CI and integrations — shown alongside humans in the member inventory.' : 'None created yet.' }}>
          {(data) => (
            <DataTable>
              <thead>
                <DataHead>
                  <DataCell as="th">Account</DataCell>
                  <DataCell as="th">Token</DataCell>
                  <DataCell as="th">Last used</DataCell>
                  <DataCell as="th">State</DataCell>
                  <DataCell as="th" />
                </DataHead>
              </thead>
              <tbody>
                {data.serviceAccounts.map((account) => (
                  <DataRow key={account.id}>
                    <DataCell>
                      <CellPrimary>{account.name}</CellPrimary>
                      <CellMeta>{account.scopes.join(', ')}</CellMeta>
                    </DataCell>
                    <DataCell>
                      {account.tokenPrefix ? <CellMono>{account.tokenPrefix}…</CellMono> : <CellMeta>none</CellMeta>}
                    </DataCell>
                    <DataCell>{account.tokenLastUsedAt ? new Date(account.tokenLastUsedAt).toLocaleString() : 'never'}</DataCell>
                    <DataCell>
                      <StatusPill tone={account.status === 'active' ? 'success' : 'neutral'}>{account.status}</StatusPill>
                    </DataCell>
                    <DataCell>
                      {canManage && account.status === 'active' && (
                        <ActionButton variant="ghost" size="sm" onClick={() => { void requestStepUp('Rotate service-account token').then((proof) => rotate.mutate({ id: account.id, mfaProof: proof }, { onSuccess: (result) => setIssued(result.token) })).catch(() => undefined); }}>
                          <RefreshCw size={12} /> Rotate
                        </ActionButton>
                      )}
                      {canManage && account.status === 'active' && (
                        <ActionButton variant="ghost" size="sm" onClick={() => disable.mutate({ id: account.id })}>Disable</ActionButton>
                      )}
                      {canManage && account.status === 'disabled' && (
                        <ActionButton variant="ghost" size="sm" onClick={() => enable.mutate({ id: account.id })}>Enable</ActionButton>
                      )}
                    </DataCell>
                  </DataRow>
                ))}
              </tbody>
            </DataTable>
          )}
        </QueryView>
      </Panel>
      {canManage && (
        <Toolbar style={{ marginTop: 10 }}>
          <ToolbarGroup>
          </ToolbarGroup>
        </Toolbar>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={issued ? 'Token issued — copy it now' : 'New service account'}
        footer={
          issued ? (
            <ActionButton variant="primary" onClick={() => setCreateOpen(false)}>Done</ActionButton>
          ) : (
            <>
              <ActionButton variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</ActionButton>
              <ActionButton
                variant="primary"
                disabled={name.trim().length < 1 || create.isPending}
                onClick={async () => {
                  let proof: string;
                  try {
                    proof = await requestStepUp('Create service account');
                  } catch {
                    return;
                  }
                  create.mutate(
                    { name, scopes: scopes.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean), mfaProof: proof },
                    { onSuccess: (result) => setIssued(result.token) },
                  )
                }}
              >
                Create
              </ActionButton>
            </>
          )
        }
      >
        {issued ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            <TokenReveal>{issued}</TokenReveal>
            <DangerNote>Shown once. The engine stores only the hash; rotation voids the previous token immediately.</DangerNote>
          </div>
        ) : (
          <Form>
            <TextInput label="Name" name="sa-name" placeholder="ci-pipelines" value={name} onChange={(e) => setName(e.target.value)} />
            <TextInput label="Scopes (space or comma separated)" name="sa-scopes" value={scopes} onChange={(e) => setScopes(e.target.value)} />
          </Form>
        )}
      </Modal>

      <Modal
        open={issued !== null && !createOpen}
        onClose={() => setIssued(null)}
        title="Rotated token — copy it now"
        footer={<ActionButton variant="primary" onClick={() => setIssued(null)}>Done</ActionButton>}
      >
        <TokenReveal>{issued}</TokenReveal>
      </Modal>
    </>
  );
}

// ── Danger zone ─────────────────────────────────────────────────────────────

function DangerTab({ isOwner }: { isOwner: boolean }) {
  const members = useMembers({ limit: 100 });
  const deletion = useDeletionStatus();
  const transfer = useTransferOwnership();
  const requestDeletion = useRequestOrgDeletion();
  const cancelDeletion = useCancelOrgDeletion();

  const [transferTarget, setTransferTarget] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typed, setTyped] = useState('');

  const pending = deletion.data?.deletion;

  return (
    <>
      <SectionTitle>Danger zone</SectionTitle>
      {!isOwner && <DangerNote>Only the organization owner can transfer ownership or delete the organization.</DangerNote>}
      {isOwner && (
        <Form>
          <Panel title="Transfer ownership" subtitle="Promote another member to owner; you become an admin.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', color: '#eceef4', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
                <option value="">Select the new owner…</option>
                {(members.data?.members ?? []).filter((m) => m.status === 'active' && m.role !== 'owner').map((m) => (
                  <option key={m.accountId} value={m.accountId}>{m.displayName ?? m.email} ({m.email})</option>
                ))}
              </select>
              <ActionButton variant="secondary" disabled={!transferTarget || transfer.isPending} onClick={() => { void requestStepUp('Transfer ownership').then((mfaProof) => transfer.mutate({ targetAccountId: transferTarget, mfaProof })).catch(() => undefined); }}>
                <Crown size={13} /> Transfer ownership
              </ActionButton>
            </div>
          </Panel>
          <Panel title="Delete organization" subtitle="Staged deletion: entitlements expire and keys revoke immediately; data is purged after a grace window.">
            {pending?.status === 'requested' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <DangerNote>
                  <AlertTriangle size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                  Deletion scheduled — permanent purge on {pending.scheduled_purge_at ? new Date(pending.scheduled_purge_at).toLocaleDateString() : '—'}. Export your data from the audit page first.
                </DangerNote>
                <ActionButton variant="secondary" disabled={cancelDeletion.isPending} onClick={() => { void requestStepUp('Cancel organization deletion').then((mfaProof) => cancelDeletion.mutate({ mfaProof })).catch(() => undefined); }}>
                  Cancel deletion
                </ActionButton>
              </div>
            ) : (
              <ActionButton variant="danger" onClick={() => { setTyped(''); setDeleteOpen(true); }}>
                Delete this organization…
              </ActionButton>
            )}
          </Panel>
        </Form>
      )}

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete organization"
        footer={
          <>
            <ActionButton variant="ghost" onClick={() => setDeleteOpen(false)}>Cancel</ActionButton>
            <ActionButton
              variant="danger"
              disabled={typed !== 'delete' || requestDeletion.isPending}
              onClick={() => {
                void requestStepUp('Delete organization').then((mfaProof) =>
                  requestDeletion.mutate({ mfaProof }, { onSuccess: () => setDeleteOpen(false) }),
                ).catch(() => undefined);
              }}
            >
              Schedule deletion
            </ActionButton>
          </>
        }
      >
        <Form>
          <DangerNote>This immediately expires all product entitlements and revokes invites, API keys, and service-account tokens. Engine-owned data is purged after the grace window; billing records are retained (pseudonymous) as required.</DangerNote>
          <TextInput label='Type "delete" to confirm' name="delete-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </Form>
      </Modal>
    </>
  );
}
