import { useState } from 'react';
import toast from 'react-hot-toast';
import { TextInput } from '@components/common/ui/TextInput';
import { TextArea } from '@components/common/ui/TextArea';
import { ActionButton } from '@components/common/ui/ActionButton';
import {
  MODEL_PROVIDERS,
  useCreateProviderCredential,
  useProviderCredentials,
  useRotateProviderCredential,
  useRevokeProviderCredential,
  type ProviderCredential,
} from '@hooks/studio/useSetupProviders';
import {
  CheckRow,
  Counter,
  CredFlag,
  CredHead,
  CredMeta,
  CredName,
  CredRow,
  DangerButton,
  DeniedNote,
  FieldLabel,
  FormNote,
  InlineForm,
  RowActions,
  Select,
  SelectWrap,
  TextButton,
  Wrap,
} from './CredentialsPanel.styles';

/** Engine secret bounds (SPEC bind — enforced before any step-up prompt). */
const SECRET_MIN = 8;
const SECRET_MAX = 4096;
const REASON_MAX = 512;

export interface CredentialsPanelProps {
  /** Providers of the allowed models (badged "pinned"). */
  pinnedProviders: string[];
  /** owner/admin mutate; developer/reader read + denied copy. */
  canGovern: boolean;
  /** List route allows owner/admin/developer (reader sees denied, never a fetch). */
  canRead: boolean;
  /** Preselect provider in the connect form (inline-fix entry). */
  highlightProvider?: string | null;
  /** Row whose revoke form is open (incident entry, controlled upstream). */
  revokeOpenId: string | null;
  /** Connect form visibility (controlled upstream so fix-entry reopens reliably). */
  connectOpen: boolean;
  onConnectOpenChange: (open: boolean) => void;
  onRevokeOpenChange: (id: string | null) => void;
}

/**
 * Provider credentials, builder-compact (C04 PLAN.md §5): fingerprint list,
 * key-only connect (step-up inside the hook), rotate, revoke-with-reason +
 * compromised flag (proof-free, stated), history that is never deleted.
 * Reads stay open to permitted roles; every mutate control is governed.
 */
export function CredentialsPanel({ pinnedProviders, canGovern, canRead, highlightProvider, revokeOpenId, connectOpen, onConnectOpenChange, onRevokeOpenChange }: CredentialsPanelProps) {
  const credentials = useProviderCredentials({ enabled: canRead });

  if (!canRead) {
    return (
      <Wrap>
        <DeniedNote>
          Provider credentials are visible to owners, admins, and developers — your role doesn’t include this list.
        </DeniedNote>
      </Wrap>
    );
  }

  return (
    <Wrap>
      {credentials.data === undefined && !credentials.isError && (
        <DeniedNote>Loading credentials…</DeniedNote>
      )}
      {credentials.isError && (
        <DeniedNote>Credentials unreachable — retry the page. Model rows keep their last-known reasons.</DeniedNote>
      )}
      {(credentials.data ?? []).map((cred) => (
        <CredentialRow
          key={cred.id}
          cred={cred}
          pinned={pinnedProviders.includes(cred.provider)}
          canGovern={canGovern}
          revokeOpen={revokeOpenId === cred.id}
          onRevokeOpenChange={(open) => onRevokeOpenChange(open ? cred.id : null)}
        />
      ))}
      {canGovern ? (
        connectOpen ? (
          <ConnectForm
            key={highlightProvider ?? 'none'}
            presetProvider={highlightProvider}
            onDone={() => onConnectOpenChange(false)}
            onCancel={() => onConnectOpenChange(false)}
          />
        ) : (
          <ActionButton size="sm" variant="secondary" onClick={() => onConnectOpenChange(true)}>
            Connect provider
          </ActionButton>
        )
      ) : (
        <DeniedNote>Connecting, rotating, and revoking need an owner or admin.</DeniedNote>
      )}
    </Wrap>
  );
}

function Fingerprint({ cred }: { cred: ProviderCredential }) {
  return (
    <CredMeta>
      {cred.secretFingerprint ?? 'no fingerprint'} · added {cred.createdAt?.slice(0, 10) ?? '—'}
      {cred.rotatedAt ? ` · rotated ${cred.rotatedAt.slice(0, 10)}` : ''}
    </CredMeta>
  );
}

function CredentialRow({
  cred,
  pinned,
  canGovern,
  revokeOpen,
  onRevokeOpenChange,
}: {
  cred: ProviderCredential;
  pinned: boolean;
  canGovern: boolean;
  revokeOpen: boolean;
  onRevokeOpenChange: (open: boolean) => void;
}) {
  const [rotating, setRotating] = useState(false);
  const rotate = useRotateProviderCredential();
  const revoke = useRevokeProviderCredential();
  const [secret, setSecret] = useState('');
  const [reason, setReason] = useState('');
  const [compromised, setCompromised] = useState(false);

  const revoked = cred.revokedAt !== null || cred.status === 'revoked';
  const secretValid = secret.length >= SECRET_MIN && secret.length <= SECRET_MAX;

  return (
    <CredRow $revoked={revoked}>
      <CredHead>
        <CredName>
          {cred.provider} · {cred.label}
        </CredName>
        {pinned && !revoked && <CredFlag $tone="info">pinned</CredFlag>}
        {cred.compromised && <CredFlag $tone="red">compromised</CredFlag>}
        {revoked && !cred.compromised && <CredFlag $tone="muted">revoked</CredFlag>}
      </CredHead>
      <Fingerprint cred={cred} />
      {cred.revocationReason && <CredMeta>Reason: {cred.revocationReason}</CredMeta>}
      {canGovern && !revoked && (
        <RowActions>
          <TextButton type="button" onClick={() => { setRotating((v) => !v); onRevokeOpenChange(false); }}>
            Rotate
          </TextButton>
          <DangerButton type="button" onClick={() => { onRevokeOpenChange(!revokeOpen); setRotating(false); }}>
            Revoke
          </DangerButton>
        </RowActions>
      )}
      {canGovern && rotating && !revoked && (
        <InlineForm>
          <TextInput
            label="New secret"
            type="password"
            autoComplete="new-password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            placeholder="Paste the replacement secret"
          />
          <Counter>{secret.length} / {SECRET_MIN}–{SECRET_MAX} chars</Counter>
          <RowActions>
            <ActionButton
              size="sm"
              disabled={!secretValid || rotate.isPending}
              onClick={() =>
                rotate.mutate(
                  { credentialId: cred.id, secret },
                  { onSuccess: () => { setSecret(''); setRotating(false); } },
                )
              }
            >
              Rotate with step-up
            </ActionButton>
          </RowActions>
          <FormNote>Rotation asks for a fresh authenticator code — the secret itself is never displayed.</FormNote>
        </InlineForm>
      )}
      {canGovern && revokeOpen && !revoked && (
        <InlineForm>
          <TextArea
            label="Reason (optional, ≤512)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            placeholder="Why is this key going away?"
          />
          <Counter>{reason.length} / {REASON_MAX}</Counter>
          <CheckRow>
            <input type="checkbox" checked={compromised} onChange={(event) => setCompromised(event.target.checked)} />
            <span>Mark compromised — also page owners/admins. Use only for real incidents.</span>
          </CheckRow>
          <RowActions>
            <ActionButton
              size="sm"
              variant="secondary"
              disabled={revoke.isPending || reason.length > REASON_MAX}
              onClick={() =>
                revoke.mutate(
                  {
                    credentialId: cred.id,
                    ...(reason.trim() ? { reason: reason.trim() } : {}),
                    ...(compromised ? { compromised: true } : {}),
                  },
                  {
                    onSuccess: () => {
                      onRevokeOpenChange(false);
                      setReason('');
                      setCompromised(false);
                      if (compromised) toast.success('Credential revoked and owners paged.');
                    },
                  },
                )
              }
            >
              Revoke now
            </ActionButton>
          </RowActions>
          <FormNote>Revocation never waits on MFA — incident response first. History rows are never deleted.</FormNote>
        </InlineForm>
      )}
    </CredRow>
  );
}

function ConnectForm({
  presetProvider,
  onDone,
  onCancel,
}: {
  presetProvider?: string | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const create = useCreateProviderCredential();
  const [provider, setProvider] = useState(presetProvider ?? MODEL_PROVIDERS[0]);
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const valid =
    label.trim() !== '' && secret.length >= SECRET_MIN && secret.length <= SECRET_MAX;

  return (
    <InlineForm>
      <SelectWrap>
        <FieldLabel>Provider</FieldLabel>
        <Select value={provider} onChange={(event) => setProvider(event.target.value)}>
          {MODEL_PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </SelectWrap>
      <TextInput label="Label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="prod key" />
      <TextInput
        label="Secret (key only — sealed on arrival)"
        type="password"
        autoComplete="new-password"
        value={secret}
        onChange={(event) => setSecret(event.target.value)}
        placeholder="Paste once — it is never displayed again"
      />
      <Counter>{secret.length} / {SECRET_MIN}–{SECRET_MAX} chars</Counter>
      <RowActions>
        <ActionButton
          size="sm"
          disabled={!valid || create.isPending}
          onClick={() =>
            create.mutate(
              { provider, label: label.trim(), secret },
              { onSuccess: () => onDone() },
            )
          }
        >
          Connect with step-up
        </ActionButton>
        <TextButton type="button" onClick={onCancel}>
          Cancel
        </TextButton>
      </RowActions>
      <FormNote>Adding asks for a fresh authenticator code. Sealed material never leaves the vault.</FormNote>
    </InlineForm>
  );
}
