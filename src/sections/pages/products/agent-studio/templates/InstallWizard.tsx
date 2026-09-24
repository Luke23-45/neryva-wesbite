import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import toast from 'react-hot-toast';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '@components/common/ui/Modal';
import { TextInput } from '@components/common/ui/TextInput';
import { ActionButton } from '@components/common/ui/ActionButton';
import { useCreateAssistant } from '@hooks/studio/useAgentAuthoring';
import { TEMPLATES_QUERY_KEY, type TemplateListEntry } from '@hooks/studio/useSetupTemplates';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { describeBlockExpiry, matchTemplateBlock, useControlBlocks } from '@hooks/studio/useSetupOperate';
import { TEMPLATE_COPY, describeInstallOutcome, validateTemplateName } from '../builder/lib/template-model';
import { buildAgentBuildPath } from '../builder/lib/slot-model';
import { PostInstallChecklist } from './PostInstallChecklist';
import { BlockedBanner } from './TemplatesView.styles';

export interface InstallWizardProps {
  entry: TemplateListEntry;
  onClose: () => void;
  canInstall: boolean;
  installDenied: string;
  onInstalled?: (assistantId: string) => void;
}

/**
 * Shared install wizard (C11 owns it; the library gallery and the builder
 * origin reuse it, never fork it). One transaction copies the template
 * into a fresh assistant + DRAFT v0 + install row + provisioning outbox —
 * the active pointer is untouched, nothing goes live.
 *
 * Honesty rules: no description input (the engine discards it and the
 * description is immutable after — D7); no phase stepper (provisioning
 * phases don't exist — D5); outcome whispers name fixes, never codes;
 * re-install confirms the duplication; blocked installs disable for
 * block-readers while install-time 409/403 stays the backstop.
 */
export function InstallWizard({ entry, onClose, canInstall, installDenied, onInstalled }: InstallWizardProps) {
  const navigate = useNavigate();
  const { orgId, role } = useOrg();
  const queryClient = useQueryClient();
  const create = useCreateAssistant();
  const canReadBlocks = canSetup(role, 'setup:govern');
  const blocks = useControlBlocks({ enabled: canReadBlocks });
  const [name, setName] = useState(entry.template.slug);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [confirmedReinstall, setConfirmedReinstall] = useState(false);

  const block = canReadBlocks && blocks.data
    ? matchTemplateBlock(blocks.data, entry.template.slug, entry.template.version)
    : null;
  const nameCheck = validateTemplateName(name);
  const nameProblem = nameCheck.ok ? null : nameCheck.error;
  const outcome = create.error ? describeInstallOutcome(create.error) : null;
  const needsConfirm = entry.installed && !confirmedReinstall && !assistantId;

  const install = () => {
    if (nameProblem || create.isPending) {
      return;
    }
    create.mutate(
      { name: name.trim(), template: { slug: entry.template.slug, version: entry.template.version } },
      {
        onSuccess: (result) => {
          if (!result.assistantId) {
            toast.error('Install returned no assistant — try again.');
            return;
          }
          toast.success(`Installed ${entry.template.slug}@${entry.template.version} as a draft — never live`);
          setAssistantId(result.assistantId);
          // Installed flags live on the templates list — refresh them.
          void queryClient.invalidateQueries({ queryKey: [...TEMPLATES_QUERY_KEY, orgId, 'list'] });
          onInstalled?.(result.assistantId);
        },
      },
    );
  };

  const installDisabled = !canInstall || block !== null || needsConfirm;
  const installTitle = !canInstall
    ? installDenied
    : block !== null
      ? 'Install blocked — pick another template'
      : needsConfirm
        ? 'Confirm the duplication first'
        : 'Copy into a draft (one transaction)';

  return (
    <Modal
      open
      onClose={onClose}
      title={`Install ${entry.template.slug}@${entry.template.version}`}
      width={640}
      footer={
        assistantId ? (
          <>
            <ActionButton variant="secondary" onClick={onClose}>
              Close
            </ActionButton>
            <ActionButton onClick={() => navigate({ to: buildAgentBuildPath(assistantId) })}>
              Open in builder — try the draft
              <ArrowRight size={11} strokeWidth={1.8} />
            </ActionButton>
          </>
        ) : (
          <>
            <ActionButton variant="secondary" onClick={onClose}>
              Cancel
            </ActionButton>
            <ActionButton disabled={installDisabled} title={installTitle} onClick={install}>
              Install as draft
            </ActionButton>
          </>
        )
      }
    >
      {!assistantId ? (
        <>
          <p style={{ fontSize: 13, opacity: 0.75 }}>
            One transaction copies the template into a fresh assistant + DRAFT v0 + install row + provisioning outbox. The active
            pointer is untouched — nothing goes live. {TEMPLATE_COPY.provisioningHonest}
          </p>
          {!entry.compatible && (
            <p style={{ fontSize: 13 }}>
              <AlertTriangle size={13} style={{ verticalAlign: -2 }} /> Incompatible at this org ({entry.reasons.map((r) => r.code).join(', ')}) —
              unresolved tool pins block install; other rows are advisory. Resolve each row in the checklist, then install.
            </p>
          )}
          {block !== null && (
            <BlockedBanner>
              Install blocked{block.reason ? ` — ${block.reason}` : ''} · {describeBlockExpiry(block.expiresAt)} · pick another template.
            </BlockedBanner>
          )}
          {needsConfirm && (
            <div style={{ marginTop: 12, fontSize: 13 }}>
              <p>{TEMPLATE_COPY.reinstallConfirm}</p>
              <ActionButton size="sm" variant="secondary" onClick={() => setConfirmedReinstall(true)}>
                Install anyway — new assistant
              </ActionButton>
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <TextInput label="Agent name" name="install-agent-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={entry.template.slug} autoFocus error={nameProblem ?? undefined} hint="Unique per organization — duplicates refuse (409) with rename guidance." />
          </div>
          <p style={{ fontSize: 12, opacity: 0.65, marginTop: 8 }}>{TEMPLATE_COPY.descriptionImmutable}</p>
          {outcome && (
            <div style={{ marginTop: 12, fontSize: 13 }} role="alert">
              <strong>{outcome.headline}</strong>
              <p style={{ margin: '4px 0 0', opacity: 0.8 }}>{outcome.detail}</p>
            </div>
          )}
        </>
      ) : (
        <>
          <PostInstallChecklist template={entry.template} assistantId={assistantId} role={role} />
          <p style={{ fontSize: 12, opacity: 0.65, marginTop: 8 }}>
            <Link to="/platform/audit">Recorded in Audit ›</Link>
          </p>
        </>
      )}
    </Modal>
  );
}
