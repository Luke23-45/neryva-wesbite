import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import styled from 'styled-components';
import { ArrowRight } from 'lucide-react';
import { Modal } from '@components/common/ui/Modal';
import { Skeleton } from '@components/common/ui/Skeleton/Skeleton';
import { ActionButton } from '@components/common/ui/ActionButton';
import { EmptyState } from '@components/common/ui/EmptyState';
import {
  diffDefinitions,
  useAssistantDefinition,
  useVersionProvenance,
  type DefinitionDiffRow,
} from '@hooks/studio/useAgentAuthoring';
import { useAssistantTemplate, useAssistantTemplates } from '@hooks/studio/useSetupTemplates';
import { fromEnginePayload } from '@lib/engine/agent-payload';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { checkTemplateDrift, describeUpdateAction } from '../builder/lib/template-model';
import { PostInstallChecklist } from './PostInstallChecklist';
import { InstallWizard } from './InstallWizard';

const Banner = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.strong};
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.6;
  background: ${({ theme }) => theme.app.surface.subtle};
`;

const Badge = styled.span`
  display: inline-block;
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
  background: ${({ theme }) => theme.app.status.lilac.bg};
  border: 1px solid ${({ theme }) => theme.app.status.lilac.border};
  color: ${({ theme }) => theme.app.status.lilac.fg};
  margin-right: 8px;
`;

const UpdateBadge = styled.span<{ $tone: 'info' | 'warning' }>`
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  margin-top: 8px;
  background: ${({ theme, $tone }) => ($tone === 'warning' ? theme.app.status.warning.bg : theme.app.status.info.bg)};
  border: 1px solid ${({ theme, $tone }) => ($tone === 'warning' ? theme.app.status.warning.border : theme.app.status.info.border)};
  color: ${({ theme, $tone }) => ($tone === 'warning' ? theme.app.status.warning.fg : theme.app.status.info.fg)};
`;

const Mono = styled.span`
  font-family: ${({ theme }) => theme.typography.fonts.mono};
  font-size: 12px;
`;

const Muted = styled.span`
  opacity: 0.6;
`;

const DiffList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
`;

const DiffRow = styled.div<{ $kind: DefinitionDiffRow['kind'] }>`
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid
    ${({ theme, $kind }) =>
      $kind === 'removed' ? theme.app.status.error.border : $kind === 'added' ? theme.app.status.success.border : theme.app.status.warning.border};
`;

export interface TemplateBannerProps {
  assistantId: string;
  versionId: string | null;
}

/**
 * Post-install map state (C11): installed badge + drift truth + update
 * lifecycle + fulfillment checklist entry. Renders ONLY when the open
 * version grew from a template (provenance.template non-null) — blank
 * builds never see it.
 *
 * Update adoption is always re-install-as-new + diff (Q1 — no update
 * path exists): the banner offers the latest row's wizard plus a
 * definition diff, never an in-place button.
 */
export function TemplateBanner({ assistantId, versionId }: TemplateBannerProps) {
  const { role } = useOrg();
  const canInstall = canSetup(role, 'setup:author');
  const installDenied = setupDeniedCopy(role, 'setup:author');
  const provenance = useVersionProvenance(assistantId, versionId);
  const templates = useAssistantTemplates();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);

  const installed = provenance.data?.template ?? null;
  const live = useAssistantTemplate(installed?.slug ?? null);
  const installedDetail = useAssistantTemplate(installed?.slug ?? null, installed?.version);

  if (provenance.data === undefined) {
    return null;
  }
  if (!installed) {
    return null;
  }

  const liveRow = (templates.data ?? []).find((entry) => entry.template.slug === installed.slug) ?? null;
  const liveVersion = live.data?.version ?? liveRow?.template.version ?? null;
  const drift = checkTemplateDrift(installed.version, liveVersion);
  const update = describeUpdateAction(
    provenance.data?.updateAvailable ?? liveRow?.updateAvailable ?? 'none',
    liveVersion ?? installed.version,
  );
  // Fulfillment binds to the INSTALLED row (what was copied), falling back
  // to the live row while it loads.
  const checklistTemplate = checklistOpen ? (installedDetail.data ?? live.data ?? null) : null;

  return (
    <Banner aria-label="Template origin">
      <div>
        <Badge>{installed.slug}@{installed.version}</Badge>
        Installed from a template — runs stay pinned, nothing auto-migrates.
      </div>
      {drift === 'unknown' || drift === 'up-to-date' ? null : (
        <div style={{ marginTop: 6 }}>
          <Muted>
            Registry moved since install ({installed.version} → {liveVersion}) — adoption is manual.
          </Muted>
        </div>
      )}
      {update.action !== 'silent' && update.badge && update.cta && (
        <div>
          <UpdateBadge $tone={update.action === 'major' ? 'warning' : 'info'}>{update.badge}</UpdateBadge>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <ActionButton size="sm" disabled={!canInstall} title={canInstall ? update.cta : installDenied} onClick={() => setWizardOpen(true)}>
              {update.cta}
              <ArrowRight size={11} strokeWidth={1.8} />
            </ActionButton>
            <ActionButton size="sm" variant="secondary" onClick={() => setDiffOpen(true)}>
              View changes
            </ActionButton>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
        <ActionButton
          size="sm"
          variant="ghost"
          onClick={() => setChecklistOpen((v) => !v)}
        >
          {checklistOpen ? 'Hide fulfillment checklist' : 'Review fulfillment checklist ›'}
        </ActionButton>
        <Link to="/platform/audit" style={{ fontSize: 12 }}>Recorded in Audit ›</Link>
      </div>
      {checklistTemplate && (
        <div style={{ marginTop: 8 }}>
          <PostInstallChecklist
            template={checklistTemplate}
            assistantId={assistantId}
            role={role}
          />
        </div>
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
    </Banner>
  );
}

export function TemplateDiffModal({
  assistantId,
  installedSlug,
  installedVersion,
  liveVersion,
  onClose,
}: {
  assistantId: string;
  installedSlug: string;
  installedVersion: string;
  liveVersion: string | null;
  onClose: () => void;
}) {
  const form = useAssistantDefinition(assistantId);
  const live = useAssistantTemplate(installedSlug);
  const ready = form.data !== undefined && live.data !== undefined;
  // fromEnginePayload is total (junk → defaults), so the diff never throws.
  const rows: DefinitionDiffRow[] =
    ready && form.data && live.data ? diffDefinitions(form.data.definition, fromEnginePayload(live.data.definition)) : [];
  return (
    <Modal
      open
      onClose={onClose}
      title={`Changes — ${installedSlug}@${installedVersion} → ${liveVersion ?? 'latest'}`}
      width={640}
      footer={
        <ActionButton variant="secondary" onClick={onClose}>
          Close
        </ActionButton>
      }
    >
      {!ready ? (
        <Skeleton $h="220px" $r="12px" />
      ) : rows.length === 0 ? (
        <EmptyState title="No definition differences" description="The installed draft already matches the registry row." />
      ) : (
        <>
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            Installed draft vs registry {installedSlug}@{liveVersion ?? 'latest'} — adopt by installing as new, never by editing in place.
          </p>
          <DiffList>
            {rows.map((row) => (
              <DiffRow key={row.path} $kind={row.kind}>
                <Mono>{row.path}</Mono> [{row.kind}]
                <div style={{ opacity: 0.8 }}>
                  {row.kind !== 'added' && <>was: {row.from || '—'} </>}
                  {row.kind !== 'removed' && <>now: {row.to || '—'}</>}
                </div>
              </DiffRow>
            ))}
          </DiffList>
        </>
      )}
    </Modal>
  );
}
