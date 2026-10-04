import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { pageItem } from '@styles/motion';
import {
  useCreateProviderCredential,
  MODEL_PROVIDERS,
} from '@hooks/studio/useSetupProviders';
import { useEnterpriseStatus } from '@hooks/engine/billing';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { useDirtyGuard } from '@/sections/pages/products/agent-studio/StudioShell/useDirtyGuard';
import { SectionBackRow } from './SectionBackRow';
import { validateCredentialSecret } from './ModelsView';
import { Dropdown } from '@components/common/ui/Dropdown';

const FieldLabel = styled.label`
  font-size: ${({ theme }) => theme.app.type.body};
  display: block;
`;


const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.s2};
  margin-top: ${({ theme }) => theme.spacing.s4};
`;

/**
 * Add provider credential — dedicated section replacing CredentialModal
 * (M-1). Validation byte-identical to the modal version (Gap #8 closed
 * provider vocabulary select, Gap #10 client-side 8..4096 secret check
 * before the MFA step-up).
 *
 * The MFA step-up prompt itself stays the interruptive dialog: the section
 * collects the form and calls the SAME mutation hook, so `runWithStepUp`
 * raises the existing StepUpModal before the secret ever leaves the client.
 * The secret is write-only, never appears in the URL, and is cleared from
 * state the moment the submit lands.
 */
export function CredentialNewSection() {
  const { role } = useOrg();
  const navigate = useNavigate();
  const canGovern = canSetup(role, 'setup:govern');
  // P1-5 (console field audit): the engine 403s provider-credential
  // create() for orgs without an active enterprise commitment
  // (BYOK_ENTERPRISE_ONLY) — the modal hid the add flow BEFORE the MFA
  // step-up instead of directing users into a flow that can only end in
  // 403. The section bounces on the same settled `false`; unknown
  // (loading/error) fails open, exactly like the modal.
  const enterprise = useEnterpriseStatus({ enabled: canGovern });
  const byokBlocked = enterprise.data === false;

  const create = useCreateProviderCredential();
  const [provider, setProvider] = useState<string>(MODEL_PROVIDERS[1]);
  const [label, setLabel] = useState('');
  const [secret, setSecret] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Dirty guard: block navigation while the form has unsent content.
  const dirty = label.trim() !== '' || secret.trim() !== '' || provider !== MODEL_PROVIDERS[1];
  const { dialog: dirtyDialog } = useDirtyGuard(dirty, 'You have an unsent credential. Leaving now discards it.');

  // Non-govern users and non-enterprise orgs land here directly — bounce to
  // the models list (server gates too). Nothing renders before the gates.
  useEffect(() => {
    if (!canGovern || byokBlocked) {
      navigate({ to: '/agent-studio/models' });
    }
  }, [canGovern, byokBlocked, navigate]);

  if (!canGovern || byokBlocked) {
    return null;
  }

  // Gap #10 (console field audit): the engine rejects secrets outside
  // 8..4096 chars AFTER the MFA proof (`assertSecret`). Validate against
  // what we send (the trimmed value) before the proof so the refusal
  // happens client-side.
  const secretProblem = validateCredentialSecret(secret);

  const valid = !secretProblem && secret.trim() !== '' && label.trim() !== '';

  const submit = () => {
    if (!valid || create.isPending) {
      return;
    }
    const input = { provider: provider.trim(), label: label.trim(), secret: secret.trim() };
    // Write-only: clear the secret from state the moment the submit lands —
    // it never persists in the DOM, the URL, or sessionStorage.
    setSecret('');
    create.mutate(input, {
      onSuccess: () => {
        navigate({ to: '/agent-studio/models' });
      },
    });
  };

  return (
    <ViewShell>
      {dirtyDialog}
      <SectionBackRow to="/agent-studio/models">
        <span aria-hidden="true">‹</span> Models
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Add provider credential</ViewTitle>
          <ViewSubtitle>
            The secret seals on arrival and never renders again — adding demands a fresh MFA proof.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Credential" subtitle="Provider, label, and the write-only secret.">
          {/*
            Gap #8 (console field audit): the engine enforces a CLOSED
            provider vocabulary (`isModelProvider` → 400 otherwise). A
            free-text input let a typo ride all the way through a fresh MFA
            step-up to a guaranteed 400. A select over the same vocabulary
            makes the typo unrepresentable.
          */}
          <FieldLabel>
            Provider
            <div style={{ marginTop: 4 }}>
              <Dropdown
                variant="select"
                aria-label="Provider"
                value={provider}
                onChange={(v) => setProvider(v)}
                items={MODEL_PROVIDERS.map((p) => ({ value: p, label: p }))}
              />
            </div>
          </FieldLabel>
          <div style={{ marginTop: 12 }}>
            <TextInput label="Label" name="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. prod-anthropic" autoFocus />
          </div>
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
            />
          </div>
          <ActionsRow>
            <ActionButton variant="secondary" onClick={() => navigate({ to: '/agent-studio/models' })}>
              Cancel
            </ActionButton>
            <ActionButton disabled={!valid || create.isPending} onClick={submit}>
              <ShieldCheck size={13} strokeWidth={1.8} />
              Add (MFA proof required)
            </ActionButton>
          </ActionsRow>
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
