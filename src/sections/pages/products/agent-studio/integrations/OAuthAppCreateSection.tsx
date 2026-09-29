import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from '@tanstack/react-router';
import { ActionButton } from '@components/common/ui/ActionButton';
import { TextInput } from '@components/common/ui/TextInput';
import { Panel } from '@components/common/ui/Panel';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import { useCreateOAuthApp } from '@hooks/studio/useSetupConnectors';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';

const FieldBlock = styled.div`
  margin-top: 12px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

/**
 * Register an OAuth app — dedicated section replacing OAuthAppModal.
 * Validation byte-identical: provider, client id, and client secret all
 * required. The secret is write-only and cleared on submit.
 */
export function OAuthAppCreateSection() {
  const navigate = useNavigate();
  const { role } = useOrg();
  const canGovern = canSetup(role, 'setup:govern');
  const governDenied = setupDeniedCopy(role, 'setup:govern');
  const createApp = useCreateOAuthApp();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [provider, setProvider] = useState('google_drive');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Owner/admin only — bounce to the list (server gates the POST too).
  useEffect(() => {
    if (!canGovern) {
      navigate({ to: '/agent-studio/integrations' });
    }
  }, [canGovern, navigate]);

  // Dirty guard: block navigation while the form holds an unregistered app.
  const dirty = provider.trim() !== 'google_drive' || clientId.trim() !== '' || clientSecret !== '';
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unregistered OAuth app. Leaving now discards it.');

  if (!canGovern) {
    return null;
  }

  const valid = provider.trim() !== '' && clientId.trim() !== '' && clientSecret.trim() !== '';

  const submit = () => {
    if (!valid || createApp.isPending) {
      return;
    }
    createApp.mutate(
      { provider: provider.trim(), clientId: clientId.trim(), clientSecret: clientSecret.trim() },
      {
        onSuccess: () => {
          setClientSecret('');
          toast.success(`Registered OAuth app for ${provider.trim()}`);
          navigate({ to: '/agent-studio/integrations' });
        },
      },
    );
  };

  return (
    <ViewShell>
      {dirtyDialog}
      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <SectionBackRow to="/agent-studio/integrations">
          <span aria-hidden="true">‹</span> All integrations
        </SectionBackRow>
      </motion.div>

      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Register OAuth app</ViewTitle>
          <ViewSubtitle>Per-tenant provider app for the OAuth dance. Client secrets are write-only.</ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={2}>
        <Panel title="App credentials" subtitle="Register the Google app before linking Drive — linking fails without it.">
          <TextInput label="Provider" value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="google_drive" autoFocus />
          <FieldBlock>
            <TextInput label="Client ID" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="…" />
          </FieldBlock>
          <FieldBlock>
            <TextInput
              label="Client secret (write-only — cleared on submit)"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="…"
              autoComplete="off"
            />
          </FieldBlock>
          <ActionRow>
            <ActionButton variant="secondary" onClick={() => navigate({ to: '/agent-studio/integrations' })}>
              Cancel
            </ActionButton>
            <ActionButton disabled={!valid || createApp.isPending} onClick={submit} title={canGovern ? 'Register an OAuth app' : governDenied}>
              Register
            </ActionButton>
          </ActionRow>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
