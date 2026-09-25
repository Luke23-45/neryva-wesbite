import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, X as XIcon, Camera, MailCheck, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { Avatar } from '@components/common/ui/Avatar';
import { ConfirmDialog } from '@components/common/ui/ConfirmDialog';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { QueryView } from '@components/common/ui/AsyncStates';
import { useAccount, useUpdateAccount, useRequestEmailVerification, useRequestEmailChange, useConfirmEmailChange, useIdentities, useUnlinkIdentity, type AccountInfo, type AccountIdentity } from '@hooks/studio/useAccount';
import { spring, pageItem } from '@styles/motion';
import { SaveRow } from './shared';

/**
 * Settings → Profile (ledger T-1)
 *
 * - Identity fields save through PATCH /auth/me; a name change also
 *   updates the OP session store so the chrome follows without re-login.
 * - Email is owned by the account, not editable inline: verification and
 *   change flows run through the engine's request/confirm endpoints.
 * - Linked identities list + unlink.
 * - Avatar upload: ⛔ E-14 (server-side avatar storage pending) — the
 *   picker persists to localStorage meanwhile; never presented as synced.
 */

const STORAGE_KEY = 'studio.profile.avatar';

const TIMEZONE_FALLBACK = ['UTC', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Europe/Zurich', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney'];

function timezoneOptions(): string[] {
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    if (typeof supported === 'function') {
      return supported('timeZone');
    }
  } catch {
    /* older runtimes — fall through to the shortlist */
  }
  return TIMEZONE_FALLBACK;
}

const LOCALES = ['en', 'en-US', 'en-GB', 'de', 'fr', 'es', 'pt-BR', 'ja', 'ko', 'zh-CN'];

export function SettingsProfile() {
  const account = useAccount();
  return (
    <QueryView query={account} skeleton={<Skeleton $h="280px" $r="12px" />} isEmpty={(d) => d === null} empty={{ title: 'Account unavailable', description: 'Your account details could not be loaded — try refreshing.' }}>
      {(info) => info && <ProfileForm key={info.id} info={info} />}
    </QueryView>
  );
}

function ProfileForm({ info }: { info: AccountInfo }) {
  const update = useUpdateAccount();
  const requestVerification = useRequestEmailVerification();
  const requestEmailChange = useRequestEmailChange();
  const confirmEmailChange = useConfirmEmailChange();

  const [name, setName] = useState(info.name ?? '');
  // P7-PF-08: timezone/locale/bio have no engine storage (the accounts table
  // and PATCH /auth/me accept only display_name). The controls are rendered
  // disabled with honest copy rather than silently discarding input.
  const [tz] = useState(info.timezone ?? 'UTC');
  const [loc] = useState(info.locale ?? 'en');

  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changeCode, setChangeCode] = useState('');
  const [changeRequested, setChangeRequested] = useState(false);

  const [avatar, setAvatar] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const onPick = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Avatar must be an image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Avatar must be under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (result) {
        setAvatar(result);
        try {
          localStorage.setItem(STORAGE_KEY, result);
        } catch {
          /* quota */
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatar(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  // Keyboard a11y — Enter / Space opens the picker when the avatar is focused.
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileRef.current?.click();
    }
  };

  // P7-PF-07: the engine's PATCH /auth/me accepts only `display_name` —
  // sending `name` 400s every save. Timezone/locale/bio are not sent
  // (P7-PF-08: no engine storage; the controls are honestly disabled).
  const save = () => {
    update.mutate(
      { display_name: name.trim() || undefined },
      { onSuccess: () => toast.success('Profile saved') },
    );
  };

  return (
    <>
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <Panel title="Identity" subtitle="How you appear in your workspace and to your agents.">
          <IdentityRow>
            <PhotoSlot
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={onKey}
              whileTap={{ scale: 0.97 }}
              transition={spring.snap}
              aria-label="Upload profile photo"
            >
              <Avatar initials={initials || 'NV'} hue="azure" size={64} status="online" src={avatar ?? undefined} />
              <PhotoOverlay>
                <Camera size={14} strokeWidth={1.7} />
                Update
              </PhotoOverlay>
            </PhotoSlot>
            <PhotoActions>
              <ActionButton variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload size={13} strokeWidth={1.8} />
                Upload photo
              </ActionButton>
              {avatar && (
                <ActionButton variant="danger" size="sm" onClick={removeAvatar}>
                  <XIcon size={13} strokeWidth={1.8} />
                  Remove
                </ActionButton>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => onPick(e.target.files?.[0])}
                aria-label="Profile photo file"
              />
              <PhotoMeta>
                <PhotoMetaRow><strong>{name || 'Your name'}</strong></PhotoMetaRow>
                <PhotoMetaRow>{info.email ?? '—'}</PhotoMetaRow>
              </PhotoMeta>
            </PhotoActions>
          </IdentityRow>

          <FieldGrid>
            <TextInput label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
            {/* P7-PF-08: honestly disabled — the engine stores only display_name. */}
            <SelectField label="Timezone">
              <ProfileSelect value={tz} aria-label="Timezone" disabled title="Timezone preferences are not configurable yet">
                {timezoneOptions().map((zone) => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </ProfileSelect>
              <TheaterNote>Not configurable yet — shown for reference only.</TheaterNote>
            </SelectField>
            <SelectField label="Locale">
              <ProfileSelect value={loc} aria-label="Locale" disabled title="Locale preferences are not configurable yet">
                {LOCALES.map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </ProfileSelect>
              <TheaterNote>Not configurable yet — shown for reference only.</TheaterNote>
            </SelectField>
          </FieldGrid>
          <SaveRow onSave={save} />
        </Panel>
      </motion.div>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Email & sign-in" subtitle="Your sign-in address and how it’s verified.">
          <EmailRow>
            <EmailMain>
              <EmailValue>{info.email ?? '—'}</EmailValue>
              {info.emailVerified === true && (
                <VerifiedPill><MailCheck size={11} strokeWidth={1.8} /> verified</VerifiedPill>
              )}
              {info.emailVerified === false && (
                <UnverifiedPill>not verified</UnverifiedPill>
              )}
            </EmailMain>
            <EmailActions>
              {info.emailVerified === false && (
                <ActionButton
                  variant="secondary"
                  size="sm"
                  disabled={requestVerification.isPending}
                  onClick={() => requestVerification.mutate(undefined, { onSuccess: () => toast.success('Verification email sent') })}
                >
                  <MailCheck size={13} strokeWidth={1.8} />
                  Verify email
                </ActionButton>
              )}
              <ActionButton variant="secondary" size="sm" onClick={() => { setChangeEmailOpen((v) => !v); setChangeRequested(false); }}>
                Change email
              </ActionButton>
            </EmailActions>
          </EmailRow>

          {(changeEmailOpen || info.pendingEmail) && (
            <EmailChangeBox>
              {info.pendingEmail && !changeRequested && (
                <PendingNote>
                  A change to <strong>{info.pendingEmail}</strong> is awaiting confirmation — check that inbox for the code.
                </PendingNote>
              )}
              {!changeRequested ? (
                <>
                  <EmailChangeRow>
                    <div style={{ flex: 1 }}>
                      <TextInput
                        label="New email address"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="you@company.com"
                      />
                    </div>
                    <ActionButton
                      variant="secondary"
                      size="sm"
                      disabled={!newEmail.includes('@') || requestEmailChange.isPending}
                      onClick={() => requestEmailChange.mutate(newEmail.trim(), { onSuccess: () => setChangeRequested(true) })}
                    >
                      Send confirmation
                    </ActionButton>
                  </EmailChangeRow>
                </>
              ) : (
                <EmailChangeRow>
                  <div style={{ flex: 1 }}>
                    <TextInput
                      label="Confirmation code"
                      value={changeCode}
                      onChange={(e) => setChangeCode(e.target.value)}
                      placeholder="6-digit code from your new inbox"
                      autoFocus
                    />
                  </div>
                  <ActionButton
                    variant="primary"
                    size="sm"
                    disabled={changeCode.trim().length < 4 || confirmEmailChange.isPending}
                    onClick={() => confirmEmailChange.mutate(changeCode.trim(), { onSuccess: () => { toast.success('Email updated'); setChangeEmailOpen(false); setChangeRequested(false); setNewEmail(''); setChangeCode(''); } })}
                  >
                    Confirm change
                  </ActionButton>
                </EmailChangeRow>
              )}
            </EmailChangeBox>
          )}
        </Panel>
      </motion.div>

      <LinkedIdentities />

      {/* ⛔ E-14: avatar is local-only until server-side asset storage lands. */}
    </>
  );
}

function LinkedIdentities() {
  const identities = useIdentities();
  const unlink = useUnlinkIdentity();
  const [target, setTarget] = useState<AccountIdentity | null>(null);

  return (
    <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
      <Panel title="Connected sign-in" subtitle="External accounts linked to your Neryva Account.">
        <QueryView
          query={identities}
          skeleton={<Skeleton $h="72px" $r="10px" />}
          empty={{ title: 'No linked accounts', description: 'You sign in with your email. Social sign-in accounts you link appear here.' }}
        >
          {(rows) => (
            <IdentityList>
              {rows.map((identity) => (
                <IdentityRowBox key={identity.id}>
                  <IdentityIcon aria-hidden="true"><Link2 size={14} strokeWidth={1.7} /></IdentityIcon>
                  <IdentityInfo>
                    <IdentityProvider>{identity.provider}</IdentityProvider>
                    {identity.identifier && <IdentityMeta>{identity.identifier}</IdentityMeta>}
                  </IdentityInfo>
                  <ActionButton variant="secondary" size="sm" onClick={() => setTarget(identity)}>
                    Unlink
                  </ActionButton>
                </IdentityRowBox>
              ))}
            </IdentityList>
          )}
        </QueryView>
      </Panel>

      <ConfirmDialog
        open={!!target}
        title="Unlink this account?"
        message={
          target
            ? `You will no longer be able to sign in with ${target.provider}${target.identifier ? ` (${target.identifier})` : ''}. This cannot be undone from here.`
            : ''
        }
        destructive
        confirmLabel="Unlink"
        onConfirm={() => {
          if (target) {
            unlink.mutate(target.id, { onError: () => toast.error('The account stays linked') });
          }
          setTarget(null);
        }}
        onCancel={() => setTarget(null)}
      />
    </motion.div>
  );
}

// ─── styled ──────────────────────────────────────────────────────────
const IdentityRow = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 22px;

  @media (max-width: 640px) {
    flex-wrap: wrap;
  }
`;

const PhotoSlot = styled(motion.div)`
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.app.status.lilac.border};
  }

  &:focus-visible {
    outline: none;
    border-color: ${({ theme }) => theme.app.border.focus};
    box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.32);
  }
`;

const PhotoOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 10.5px;
  font-weight: 500;
  color: #fff;
  background: rgba(11, 13, 18, 0.65);
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity ${({ theme }) => theme.transitions.fast};

  ${PhotoSlot}:hover &,
  ${PhotoSlot}:focus-visible & {
    opacity: 1;
  }
`;

const PhotoActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const PhotoMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-left: 4px;
`;

const PhotoMetaRow = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};

  strong {
    color: ${({ theme }) => theme.app.text.primary};
    font-weight: 500;
  }
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

function SelectField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <SelectFieldBox>
      <SelectLabel>{label}</SelectLabel>
      {children}
    </SelectFieldBox>
  );
}

const SelectFieldBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SelectLabel = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const TheaterNote = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.faint};
  line-height: 1.4;
`;

const ProfileSelect = styled.select`
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 9px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }

  option {
    background: #14151c;
    color: ${({ theme }) => theme.app.text.primary};
  }
`;

const EmailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const EmailMain = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

const EmailValue = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 500;
  white-space: nowrap;
`;

const VerifiedPill = styled(Pill)`
  background: ${({ theme }) => theme.app.status.success.bg};
  border: 1px solid ${({ theme }) => theme.app.status.success.border};
  color: ${({ theme }) => theme.app.status.success.fg};
`;

const UnverifiedPill = styled(Pill)`
  background: ${({ theme }) => theme.app.status.warning.bg};
  border: 1px solid ${({ theme }) => theme.app.status.warning.border};
  color: ${({ theme }) => theme.app.status.warning.fg};
`;

const EmailActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const EmailChangeBox = styled.div`
  margin-top: 14px;
  padding: 14px;
  border-radius: 11px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EmailChangeRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 10px;

  @media (max-width: 560px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PendingNote = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.5;
`;

const IdentityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const IdentityRowBox = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.surface.subtle};
  border: 1px solid ${({ theme }) => theme.app.border.default};
`;

const IdentityIcon = styled.span`
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.default};
  color: ${({ theme }) => theme.app.text.secondary};
  flex-shrink: 0;
`;

const IdentityInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const IdentityProvider = styled.div`
  font-size: ${({ theme }) => theme.app.type.body};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

const IdentityMeta = styled.div`
  font-size: ${({ theme }) => theme.app.type.micro};
  color: ${({ theme }) => theme.app.text.muted};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
