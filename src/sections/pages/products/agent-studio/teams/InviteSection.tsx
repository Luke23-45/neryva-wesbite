import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from '@tanstack/react-router';
import { ActionButton } from '@components/common/ui/ActionButton';
import { CopyButton } from '@components/common/ui/CopyButton';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { toastEngineError } from '@lib/engine/errors';
import { pageItem } from '@styles/motion';
import { useOrg } from '@/Context/OrgContext';
import type { OrgRole } from '@/Context/OrgContext';
import { useInviteMember } from '@hooks/engine/mutations';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import {
  InviteForm,
  InviteLabel,
  InviteInput,
} from './TeamsView.styles';
import styled from 'styled-components';
import { Dropdown } from '@components/common/ui/Dropdown';

const INVITE_ROLES: OrgRole[] = ['admin', 'billing', 'developer', 'reader'];

// sessionStorage key for the shown-once reveal marker — survives refresh,
// scoped to the tab. If the page mounts with a marker but no active reveal
// state, the link was already shown and is gone: say so explicitly.
const REVEAL_MARKER = 'teams:invite:revealed';

const RevealNotice = styled.div`
  padding: 12px 14px;
  border-radius: 10px;
  background: ${({ theme }) => theme.app.surface.tint};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  font-size: ${({ theme }) => theme.app.type.body};
  color: ${({ theme }) => theme.app.text.secondary};
  line-height: 1.5;
`;

/**
 * Invite member — dedicated section replacing InviteModal (T-1).
 * Two phases on one page: form → link reveal. Validation byte-identical
 * to the modal version.
 */
export function InviteSection() {
  const { role: myRole, name: orgName, canManageMembers } = useOrg();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('developer');
  const [delivery, setDelivery] = useState<'email' | 'manual'>('manual');
  const [manual, setManual] = useState<{ accept_url: string; expires_at?: string; email: string } | null>(null);
  const [alreadyRevealed, setAlreadyRevealed] = useState(false);
  const invite = useInviteMember();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const isOwner = myRole === 'owner';
  const roleOptions = isOwner ? INVITE_ROLES : INVITE_ROLES.filter((r) => r !== 'admin');

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    // If a reveal marker exists but no active reveal state, the link was
    // shown in a previous render and is gone — say so explicitly.
    if (sessionStorage.getItem(REVEAL_MARKER) && !manual) {
      setAlreadyRevealed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dirty guard: block navigation while the form has unsent content.
  const dirty = !manual && (email.trim() !== '' || role !== 'developer' || delivery !== 'manual');
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsent invitation. Leaving now discards it.');

  // Non-managers land here directly — bounce to the list (server gates too).
  useEffect(() => {
    if (!canManageMembers) {
      navigate({ to: '/agent-studio/teams' });
    }
  }, [canManageMembers, navigate]);

  if (!canManageMembers) {
    return null;
  }

  const send = () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Enter a valid email address');
      return;
    }
    if (role === 'admin' && !isOwner) {
      toast.error('Only an owner may invite someone as admin.');
      return;
    }
    invite.mutate(
      { email: trimmed, role, delivery },
      {
        onSuccess: (result) => {
          if (delivery === 'manual' && result.accept_url) {
            setManual({ accept_url: result.accept_url, expires_at: result.expires_at, email: trimmed });
            sessionStorage.setItem(REVEAL_MARKER, trimmed);
            return;
          }
          toast.success(`Invite sent to ${trimmed}`);
          navigate({ to: '/agent-studio/teams' });
        },
        onError: (error) => {
          toastEngineError(error);
        },
      },
    );
  };

  return (
    <ViewShell>
      {dirtyDialog}
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <SectionBackRow to="/agent-studio/teams">
          <span aria-hidden="true">‹</span> Teams
        </SectionBackRow>
      </motion.div>

      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Invite a member</ViewTitle>
          <ViewSubtitle>
            {manual ? 'Share the invitation link below.' : 'Send an invitation to join your workspace.'}
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel>
          {manual ? (
            <InviteForm>
              <InviteLabel>
                One-time link for {manual.email} (shown once — resend to generate a new one)
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <InviteInput type="text" readOnly value={manual.accept_url} aria-label="One-time invitation link" onFocus={(e) => e.target.select()} />
                  <CopyButton value={manual.accept_url} label="Copy link" />
                </div>
              </InviteLabel>
              <InviteLabel>
                Share
                <div style={{ display: 'flex', gap: 8 }}>
                  <ActionButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const subject = `You've been invited to ${orgName ?? 'your workspace'} as ${role}`;
                      const body = [
                        `You have been invited to join ${orgName ?? 'your workspace'} as ${role}.`,
                        '',
                        manual.accept_url,
                        '',
                        'This link is single-use. Sign in with the invited address — other addresses will be rejected.',
                      ].join('\n');
                      window.location.href = `mailto:${encodeURIComponent(manual.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }}
                  >
                    Compose email
                  </ActionButton>
                  <ActionButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      sessionStorage.removeItem(REVEAL_MARKER);
                      navigate({ to: '/agent-studio/teams' });
                    }}
                  >
                    Done
                  </ActionButton>
                </div>
              </InviteLabel>
            </InviteForm>
          ) : alreadyRevealed ? (
            <RevealNotice>
              An invitation link was already generated in this session and shown once. It cannot
              be displayed again — resend from the Teams page to generate a new one.
              <div style={{ marginTop: 12 }}>
                <ActionButton variant="secondary" size="sm" onClick={() => navigate({ to: '/agent-studio/teams' })}>
                  Back to Teams
                </ActionButton>
              </div>
            </RevealNotice>
          ) : (
            <InviteForm>
              <InviteLabel>
                Email address
                <InviteInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teammate@company.com"
                  autoFocus
                />
              </InviteLabel>
              <InviteLabel>
                Role
                <Dropdown
                  variant="select"
                  value={role}
                  onChange={(v) => setRole(v as OrgRole)}
                  aria-label="Invite role"
                  items={roleOptions.map((r) => ({ value: r, label: r }))}
                />
              </InviteLabel>
              <InviteLabel>
                Delivery
                <Dropdown
                  variant="select"
                  value={delivery}
                  onChange={(v) => setDelivery(v as 'email' | 'manual')}
                  aria-label="Delivery method"
                  items={[
                    { value: 'manual', label: 'Manual link' },
                    { value: 'email', label: 'Email invitation' },
                  ]}
                />
              </InviteLabel>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <ActionButton variant="secondary" onClick={() => navigate({ to: '/agent-studio/teams' })}>
                  Cancel
                </ActionButton>
                <ActionButton disabled={invite.isPending} onClick={send}>
                  {delivery === 'manual' ? 'Create invite link' : 'Send invite'}
                </ActionButton>
              </div>
            </InviteForm>
          )}
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
