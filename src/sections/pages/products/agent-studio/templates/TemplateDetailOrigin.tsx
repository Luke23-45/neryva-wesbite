import { useState } from 'react';
import styled from 'styled-components';
import { ArrowRight } from 'lucide-react';
import { ActionButton } from '@components/common/ui/ActionButton';
import { useAssistantVersions, useVersionProvenance } from '@hooks/studio/useAgentAuthoring';
import { useAssistantTemplates } from '@hooks/studio/useSetupTemplates';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { describeUpdateAction } from '../builder/lib/template-model';
import { InstallWizard } from './InstallWizard';
import { TemplateDiffModal } from './TemplateBanner';

const OriginRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const OriginBadge = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.app.status.lilac.bg};
  border: 1px solid ${({ theme }) => theme.app.status.lilac.border};
  color: ${({ theme }) => theme.app.status.lilac.fg};
`;

const UpdateBadge = styled.span<{ $tone: 'info' | 'warning' }>`
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  background: ${({ theme, $tone }) => ($tone === 'warning' ? theme.app.status.warning.bg : theme.app.status.info.bg)};
  border: 1px solid ${({ theme, $tone }) => ($tone === 'warning' ? theme.app.status.warning.border : theme.app.status.info.border)};
  color: ${({ theme, $tone }) => ($tone === 'warning' ? theme.app.status.warning.fg : theme.app.status.info.fg)};
`;

/**
 * Template origin row for the agent detail page (C11): installed badge +
 * update lifecycle for the ACTIVE version (what serves; drafts adopt in
 * the builder banner). Adoption is always re-install-as-new + diff —
 * never in place. Renders nothing for blank-built agents.
 */
export function TemplateDetailOrigin({ assistantId, activeVersionId }: { assistantId: string; activeVersionId: string | null }) {
  const { role } = useOrg();
  const canInstall = canSetup(role, 'setup:author');
  const installDenied = setupDeniedCopy(role, 'setup:author');
  const versions = useAssistantVersions(assistantId);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);

  const rows = versions.data ?? [];
  const row = (activeVersionId ? rows.find((v) => v.id === activeVersionId) : null) ?? rows.find((v) => v.status === 'DRAFT') ?? null;
  const provenance = useVersionProvenance(assistantId, row?.id ?? null);
  const templates = useAssistantTemplates();

  const installed = provenance.data?.template ?? null;
  if (!installed) {
    return null;
  }
  const liveRow = (templates.data ?? []).find((entry) => entry.template.slug === installed.slug) ?? null;
  const liveVersion = liveRow?.template.version ?? null;
  const update = describeUpdateAction(provenance.data?.updateAvailable ?? 'none', liveVersion ?? installed.version);

  return (
    <OriginRow aria-label="Template origin">
      <OriginBadge>{installed.slug}@{installed.version}</OriginBadge>
      <span>Installed from a template — runs stay pinned, nothing auto-migrates.</span>
      {update.action !== 'silent' && update.badge && update.cta && (
        <>
          <UpdateBadge $tone={update.action === 'major' ? 'warning' : 'info'}>{update.badge}</UpdateBadge>
          <ActionButton size="sm" disabled={!canInstall} title={canInstall ? update.cta : installDenied} onClick={() => setWizardOpen(true)}>
            {update.cta}
            <ArrowRight size={11} strokeWidth={1.8} />
          </ActionButton>
          <ActionButton size="sm" variant="secondary" onClick={() => setDiffOpen(true)}>
            View changes
          </ActionButton>
        </>
      )}
      {wizardOpen && liveRow && (
        <InstallWizard
          entry={liveRow}
          onClose={() => setWizardOpen(false)}
          canInstall={canInstall}
          installDenied={installDenied}
        />
      )}
      {diffOpen && (
        <TemplateDiffModal
          assistantId={assistantId}
          installedSlug={installed.slug}
          installedVersion={installed.version}
          liveVersion={liveVersion}
          onClose={() => setDiffOpen(false)}
        />
      )}
    </OriginRow>
  );
}
