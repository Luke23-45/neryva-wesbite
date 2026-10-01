import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ShieldCheck } from 'lucide-react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { pageItem } from '@styles/motion';
import {
  useProviderCredentials,
  useRotateProviderCredential,
  MODEL_PROVIDERS,
} from '@hooks/studio/useSetupProviders';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import { validateCredentialSecret } from './ModelsView';

const FieldLabel = styled.label`
  font-size: ${({ theme }) => theme.app.type.body};
  display: block;
`;

const FieldSelect = styled.select`
  display: block;
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.s1};
  background: ${({ theme }) => theme.app.surface.tint};
  color: ${({ theme }) => theme.app.text.primary};
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: ${({ theme }) => theme.spacing.s2} ${({ theme }) => theme.spacing.px10};
  font-family: inherit;
  font-size: ${({ theme }) => theme.app.type.body};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.app.border.focus};
    outline-offset: 1px;
  }
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.s2};
  margin-top: ${({ theme }) => theme.spacing.s4};
`;

/**
 * Rotate a provider credential — dedicated section replacing CredentialModal
 * (M-2). Form-identical to the modal's rotate mode: provider select +
 * secret, no label (the label is fixed at creation). The MFA step-up prompt
 * itself stays the interruptive dialog: the section collects the form and
 * calls the SAME mutation hook, so `runWithStepUp` raises the existing
 * StepUpModal before the new secret ever leaves the client.
 *
 * Unknown credential id → bounce to the models list (same rule as the
 * channels unknown-account bounce).
 */
export function CredentialRotateSection() {
  const { credentialId } = useParams({ from: '/agent-studio/models/credentials/$credentialId/rotate' });
  const navigate = useNavigate();
  const { role } = useOrg();
  const canGovern = canSetup(role, 'setup:govern');

  const credentials = useProviderCredentials({ enabled: canGovern });
  const rotate = useRotateProviderCredential();
  const [provider, setProvider] = useState<string>(MODEL_PROVIDERS[1]);
  const [secret, setSecret] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const credential = useMemo(
    () => (credentials.data ?? []).find((c) => c.id === credentialId) ?? null,
    [credentials.data, credentialId],
  );
  const unknownId = !credentials.isPending && !credentials.isError && credential === null;

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Dirty guard: block navigation while the form has unsent content.
  const dirty = secret.trim() !== '' || provider !== MODEL_PROVIDERS[1];
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsent credential. Leaving now discards it.');

  // Non-govern users land here directly — bounce to the list (server gates too).
  useEffect(() => {
    if (!canGovern) {
      navigate({ to: '/agent-studio/models' });
    }
  }, [canGovern, navigate]);

  // Unknown credential id → back to the list.
  useEffect(() => {
    if (unknownId) {
      navigate({ to: '/agent-studio/models' });
    }
  }, [unknownId, navigate]);

  if (!canGovern || unknownId || !credential) {
    return null;
  }

  // Gap #10 (console field audit): the engine rejects secrets outside
  // 8..4096 chars AFTER the MFA proof (`assertSecret`). Validate against
  // what we send (the trimmed value) before the proof so the refusal
  // happens client-side.
  const secretProblem = validateCredentialSecret(secret);

  const valid = !secretProblem && secret.trim() !== '';

  const submit = () => {
    if (!valid || rotate.isPending) {
      return;
    }
    // Write-only: clear the secret from state the moment the submit lands —
    // it never persists in the DOM, the URL, or sessionStorage.
    setSecret('');
    rotate.mutate(
      { credentialId: credential.id, secret: secret.trim() },
      {
        onSuccess: () => {
          navigate({ to: '/agent-studio/models' });
        },
      },
    );
  };

  return (
    <ViewShell>
      {dirtyDialog}
      <SectionBackRow to="/agent-studio/models">
        <span aria-hidden="true">‹</span> Models
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>{`Rotate — ${credential.label}`}</ViewTitle>
          <ViewSubtitle>
            The new secret seals on arrival and never renders again — rotating demands a fresh MFA proof.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="New secret" subtitle="Provider and the write-only replacement secret.">
          {/*
            Gap #8 (console field audit): the engine enforces a CLOSED
            provider vocabulary (`isModelProvider` → 400 otherwise). The
            modal's rotate mode carried the same select; the section keeps it
            form-identical (the rotate endpoint only accepts the secret).
          */}
          <FieldLabel>
            Provider
            <FieldSelect value={provider} onChange={(e) => setProvider(e.target.value)} aria-label="Provider">
              {MODEL_PROVIDERS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </FieldSelect>
          </FieldLabel>
          <div style={{ marginTop: 12 }}>
            <TextInput
              label="Secret (write-only — sealed on arrival, cleared on submit)"
              name="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="…"
              autoComplete="off"
              maxLength={4096}
              hint="8–4096 characters — the engine rejects shorter secrets."
              error={secretProblem ?? undefined}
              autoFocus
            />
          </div>
          <ActionsRow>
            <ActionButton variant="secondary" onClick={() => navigate({ to: '/agent-studio/models' })}>
              Cancel
            </ActionButton>
            <ActionButton disabled={!valid || rotate.isPending} onClick={submit}>
              <ShieldCheck size={13} strokeWidth={1.8} />
              Rotate (MFA proof required)
            </ActionButton>
          </ActionsRow>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
