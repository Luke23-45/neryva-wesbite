/**
 * /platform/api-keys — org API keys: issue (name, role, scopes, expiry —
 * step-up proof required; the raw key is revealed exactly ONCE), revoke.
 */
import { useState } from 'react';
import { KeyRound, Copy, Check, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { useKeys, type KeyRow } from '@hooks/engine/queries';
import { useIssueKey, useRevokeKey } from '@hooks/engine/mutations';
import { useOrg } from '@/Context/OrgContext';
import { requestStepUp } from '@lib/engine/stepup';
import { ApiError } from '@lib/engine/client';
import { EmptyState } from '@components/common/ui/EmptyState';
import { Panel } from '@components/common/ui/Panel/Panel';
import { Modal } from '@components/common/ui/Modal/Modal';
import { TextInput } from '@components/common/ui/TextInput/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton/ActionButton';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog/ConfirmDialog';
import { StatusPill } from '@components/common/ui/StatusPill/StatusPill';
import { QueryView } from '@components/common/ui/AsyncStates';
import { DataTable, DataHead, DataRow, DataCell, CellPrimary, CellMeta, CellMono } from '@components/common/ui/DataTable';
import { ViewShell, ViewHeader, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import styled from 'styled-components';

const KeyReveal = styled.div`
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 8px;
  padding: 12px;
  font-family: ui-monospace, monospace;
  font-size: 12px;
  word-break: break-all;
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: space-between;
`;

const ScopesInput = styled.textarea`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: #eceef4;
  padding: 8px 10px;
  font-size: 13px;
  font-family: ui-monospace, monospace;
  min-height: 64px;
  resize: vertical;
`;

const ORG_KEY_ROLES = ['operator', 'auditor'] as const;

export default function ApiKeysPage() {
  const { role: orgRole } = useOrg();
  // P5-E20: see SettingsApiKeys — engine key write roles exclude billing;
  // `atLeast('developer')` wrongly admits billing (ROLE_RANK tie at 2).
  const canManage = orgRole === 'owner' || orgRole === 'admin' || orgRole === 'developer';
  const keys = useKeys();
  const issue = useIssueKey();
  const revoke = useRevokeKey();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<(typeof ORG_KEY_ROLES)[number]>('operator');
  const [scopes, setScopes] = useState('agent-studio:read');
  const [expiresAt, setExpiresAt] = useState('');
  const [issued, setIssued] = useState<{ key: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<KeyRow | null>(null);

  // J1-04: a 404 on the keys read means the engine's keys module is disabled
  // in this deployment (MODULES__KEYS_ENABLED=false, the default) — not a
  // failure. Issuing is impossible too, so the page shows an honest
  // unavailable state and the Issue action is withheld (same pattern as J1-03
  // for the channels module).
  const keysDisabled =
    keys.isError && keys.error instanceof ApiError && keys.error.status === 404;

  return (
    <ViewShell>
      <ViewHeader>
        <ViewTitle>API Keys</ViewTitle>
        <ViewSubtitle>Organization credentials for the engine API. Keys are shown once at creation — store them safely.</ViewSubtitle>
      </ViewHeader>

      <Panel
        title="Keys"
        flush
        action={canManage && !keysDisabled ? (
          <ActionButton variant="primary" size="sm" onClick={() => { setName(''); setRole('operator'); setScopes('agent-studio:read'); setExpiresAt(''); setIssued(null); setOpen(true); }}>
            <KeyRound size={13} /> Issue key
          </ActionButton>
        ) : undefined}
      >
        {keysDisabled ? (
          <EmptyState
            icon={<KeyRound size={18} opacity={0.5} />}
            title="API keys are not available in this deployment"
            description="The engine's API keys module is disabled, so keys cannot be listed or issued. Enable the keys module on the engine to use API keys."
          />
        ) : (
        <QueryView query={keys} isEmpty={(d) => d.keys.length === 0} empty={{ title: 'No API keys', description: canManage ? 'Issue the first key to call the engine from your services.' : 'Ask a developer or admin to issue keys.' }}>
          {(data) => (
            <DataTable>
              <thead>
                <DataHead>
                  <DataCell as="th">Key</DataCell>
                  <DataCell as="th">Role</DataCell>
                  <DataCell as="th">Scopes</DataCell>
                  <DataCell as="th">Last used</DataCell>
                  <DataCell as="th">State</DataCell>
                  <DataCell as="th" />
                </DataHead>
              </thead>
              <tbody>
                {data.keys.map((key) => (
                  <DataRow key={key.id}>
                    <DataCell>
                      <CellPrimary>{key.name}</CellPrimary>
                      <CellMono>{key.prefix}…</CellMono>
                    </DataCell>
                    <DataCell>{key.role}</DataCell>
                    <DataCell><CellMeta>{key.scopes.join(', ') || '—'}</CellMeta></DataCell>
                    <DataCell>{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'never'}</DataCell>
                    <DataCell>
                      <StatusPill tone={key.revoked ? 'neutral' : key.expiresAt && Date.parse(key.expiresAt) < Date.now() ? 'warning' : 'success'}>
                        {key.revoked ? 'revoked' : key.expiresAt && Date.parse(key.expiresAt) < Date.now() ? 'expired' : 'active'}
                      </StatusPill>
                    </DataCell>
                    <DataCell>
                      {canManage && !key.revoked && (
                        <ActionButton variant="ghost" size="sm" onClick={() => setRevokeTarget(key)}><Ban size={12} /> Revoke</ActionButton>
                      )}
                    </DataCell>
                  </DataRow>
                ))}
              </tbody>
            </DataTable>
          )}
        </QueryView>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={issued ? 'Key issued — copy it now' : 'Issue API key'}
        footer={
          issued ? (
            <ActionButton variant="primary" onClick={() => setOpen(false)}>Done</ActionButton>
          ) : (
            <>
              <ActionButton variant="ghost" onClick={() => setOpen(false)}>Cancel</ActionButton>
              <ActionButton
                variant="primary"
                disabled={name.trim().length < 1 || issue.isPending}
                onClick={async () => {
                  let mfaProof: string;
                  try {
                    mfaProof = await requestStepUp('Issue API key');
                  } catch {
                    return;
                  }
                  issue.mutate(
                    {
                      name,
                      role,
                      scopes: scopes.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean),
                      ...(expiresAt ? { expires_at: new Date(expiresAt).toISOString() } : {}),
                      mfaProof,
                    },
                    {
                      onSuccess: (result) => {
                        setIssued({ key: result.key });
                        void keys.refetch();
                      },
                    },
                  );
                }}
              >
                Issue key
              </ActionButton>
            </>
          )
        }
      >
        {issued ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            <KeyReveal>
              <span>{issued.key}</span>
              <ActionButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(issued.key).then(() => {
                    setCopied(true);
                    toast.success('Key copied');
                    setTimeout(() => setCopied(false), 2000);
                  });
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </ActionButton>
            </KeyReveal>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.65 }}>This is the only time the full key is shown. The engine stores only its hash.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 4 }}>
            <TextInput label="Name" name="key-name" placeholder="ci-runner" value={name} onChange={(e) => setName(e.target.value)} />
            <div>
              <select value={role} onChange={(e) => setRole(e.target.value as (typeof ORG_KEY_ROLES)[number])} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: '#eceef4', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
                {ORG_KEY_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>Scopes (space or comma separated; * alone = everything)</label>
              <ScopesInput value={scopes} onChange={(e) => setScopes(e.target.value)} />
            </div>
            <TextInput label="Expires (optional)" name="key-expiry" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={revokeTarget !== null}
        title={`Revoke "${revokeTarget?.name ?? 'key'}"?`}
        message="Applications using this key will receive 401s immediately (satellite caches converge within seconds)."
        confirmLabel="Revoke key"
        destructive
        onConfirm={() => {
          if (revokeTarget) {
            revoke.mutate({ keyId: revokeTarget.id });
          }
          setRevokeTarget(null);
        }}
        onCancel={() => setRevokeTarget(null)}
      />
    </ViewShell>
  );
}
