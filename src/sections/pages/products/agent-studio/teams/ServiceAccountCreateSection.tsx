import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { useNavigate } from '@tanstack/react-router';
import { ActionButton } from '@components/common/ui/ActionButton';
import { CopyButton } from '@components/common/ui/CopyButton';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { pageItem } from '@styles/motion';
import { useOrg } from '@/Context/OrgContext';
import { useCreateServiceAccount } from '@hooks/engine/mutations';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import {
  InviteForm,
  InviteLabel,
  InviteInput,
} from './TeamsView.styles';

const REVEAL_MARKER = 'teams:service-account:revealed';

const TokenReveal = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TokenRevealTitle = styled.div`
  font-size: ${({ theme }) => theme.app.type.bodyLg};
  font-weight: 500;
  color: ${({ theme }) => theme.app.text.primary};
`;

const TokenRevealText = styled.div`
  font-size: ${({ theme }) => theme.app.type.caption};
  color: ${({ theme }) => theme.app.text.muted};
  line-height: 1.5;
`;

const TokenBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.30);
  border: 1px solid ${({ theme }) => theme.app.border.strong};

  code {
    flex: 1;
    font-family: ${({ theme }) => theme.typography.fonts.mono};
    font-size: ${({ theme }) => theme.app.type.caption};
    color: ${({ theme }) => theme.app.text.primary};
    word-break: break-all;
    line-height: 1.5;
  }
`;

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
 * New service account — dedicated section replacing the create modal (T-6).
 * Two phases on one page: form → token reveal (shown exactly once).
 * Validation byte-identical: name required (trimmed); scopes split on
 * whitespace/commas.
 */
export function ServiceAccountCreateSection() {
  const { canManageMembers } = useOrg();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scopes, setScopes] = useState('studio:read');
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [alreadyRevealed, setAlreadyRevealed] = useState(false);
  const create = useCreateServiceAccount();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    if (sessionStorage.getItem(REVEAL_MARKER) && !issuedToken) {
      setAlreadyRevealed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = !issuedToken && (name.trim() !== '' || description.trim() !== '' || scopes !== 'studio:read');
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsaved service account. Leaving now discards it.');

  useEffect(() => {
    if (!canManageMembers) {
      navigate({ to: '/agent-studio/teams' });
    }
  }, [canManageMembers, navigate]);

  if (!canManageMembers) {
    return null;
  }

  const submit = () => {
    if (!name.trim()) {
      return;
    }
    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        scopes: scopes.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean),
      },
      {
        onSuccess: (result) => {
          setIssuedToken(result.token);
          sessionStorage.setItem(REVEAL_MARKER, name.trim());
          toast.success('Service account created');
        },
      },
    );
  };

  const done = () => {
    sessionStorage.removeItem(REVEAL_MARKER);
    navigate({ to: '/agent-studio/teams' });
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
          <ViewTitle ref={headingRef} tabIndex={-1}>
            {issuedToken ? 'Service account token' : 'New service account'}
          </ViewTitle>
          <ViewSubtitle>
            {issuedToken
              ? 'Copy the token now — it is shown exactly once.'
              : 'Machine accounts for CI and integrations.'}
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel>
          {issuedToken ? (
            <TokenReveal>
              <TokenRevealTitle>Copy this token now</TokenRevealTitle>
              <TokenRevealText>It is shown exactly once and cannot be retrieved again.</TokenRevealText>
              <TokenBox>
                <code>{issuedToken}</code>
                <CopyButton value={issuedToken} label="Copy token" />
              </TokenBox>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                <ActionButton onClick={done}>Done</ActionButton>
              </div>
            </TokenReveal>
          ) : alreadyRevealed ? (
            <RevealNotice>
              A service account token was already generated in this session and shown once.
              It cannot be displayed again — rotate the token from the Teams page to issue a new one.
              <div style={{ marginTop: 12 }}>
                <ActionButton variant="secondary" size="sm" onClick={() => navigate({ to: '/agent-studio/teams' })}>
                  Back to Teams
                </ActionButton>
              </div>
            </RevealNotice>
          ) : (
            <InviteForm>
              <InviteLabel>
                Name
                <InviteInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ci-pipeline"
                  autoFocus
                />
              </InviteLabel>
              <InviteLabel>
                Description
                <InviteInput
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What runs on this account"
                />
              </InviteLabel>
              <InviteLabel>
                Scopes (space or comma separated)
                <InviteInput
                  value={scopes}
                  onChange={(e) => setScopes(e.target.value)}
                  placeholder="studio:read studio:write"
                />
              </InviteLabel>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <ActionButton variant="secondary" onClick={() => navigate({ to: '/agent-studio/teams' })}>
                  Cancel
                </ActionButton>
                <ActionButton disabled={!name.trim() || create.isPending} onClick={submit}>
                  Create
                </ActionButton>
              </div>
            </InviteForm>
          )}
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
