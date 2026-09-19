import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import styled from 'styled-components';
import { ActionButton } from '@components/common/ui/ActionButton';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { buildAgentBuildPath } from '../lib/slot-model';
import { TemplateGallery } from '../../templates/TemplateGallery';
import { InstallWizard } from '../../templates/InstallWizard';
import { ClonePicker } from '../../agents/ClonePicker';
import { ImportPane } from '../../agents/ImportPane';
import type { TemplateListEntry } from '@hooks/studio/useSetupTemplates';

const OriginWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 32px;
  max-width: 1080px;
  margin: 0 auto;
  overflow-y: auto;
  height: 100%;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.app.text.primary};
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  color: ${({ theme }) => theme.app.text.secondary};
`;

const PathGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const PathCard = styled.div`
  border: 1px solid ${({ theme }) => theme.app.border.default};
  border-radius: 14px;
  padding: 18px;
  background: ${({ theme }) => theme.app.surface.subtle};
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PathTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.app.text.primary};
`;

const PathBody = styled.div`
  font-size: 12px;
  line-height: 1.6;
  color: ${({ theme }) => theme.app.text.secondary};
  flex: 1;
`;

/**
 * Builder origin screen (C11 template paths + C12 clone/import paths,
 * new mode only): the pre-circuit choice. Template installs reuse the
 * shared wizard (I1 navigates into build mode); clones navigate into
 * build mode; imports create a new draft assistant, then navigate.
 * One pipeline per action, never a second install path.
 */
export function OriginScreen({ onBlank }: { onBlank: () => void }) {
  const navigate = useNavigate();
  const { role } = useOrg();
  const canAuthor = canSetup(role, 'setup:author');
  const authorDenied = setupDeniedCopy(role, 'setup:author');
  const [path, setPath] = useState<'template' | 'clone' | 'import' | null>(null);
  const [installing, setInstalling] = useState<TemplateListEntry | null>(null);

  const toggle = (next: 'template' | 'clone' | 'import') => setPath((current) => (current === next ? null : next));

  return (
    <OriginWrap>
      <div>
        <Title>Start from a template, a copy, a file — or blank</Title>
        <Subtitle>Templates copy into a draft, clones copy an agent, imports validate first. Nothing goes live.</Subtitle>
      </div>
      <PathGrid>
        <PathCard>
          <PathTitle>Start from template</PathTitle>
          <PathBody>Browse the gallery, preview the contract, install a proven starting point with its eval suite.</PathBody>
          <ActionButton size="sm" variant="secondary" onClick={() => toggle('template')}>
            {path === 'template' ? 'Hide gallery' : 'Browse gallery →'}
          </ActionButton>
        </PathCard>
        <PathCard>
          <PathTitle>Clone an agent</PathTitle>
          <PathBody>Search this org, pick a source, name the copy. The original is untouched.</PathBody>
          <ActionButton size="sm" variant="secondary" disabled={!canAuthor} title={canAuthor ? 'Pick a source, name the copy' : authorDenied} onClick={() => toggle('clone')}>
            {path === 'clone' ? 'Hide picker' : 'Pick a source →'}
          </ActionButton>
        </PathCard>
        <PathCard>
          <PathTitle>Import a file</PathTitle>
          <PathBody>Paste or drop an export. Validated here, then created as a new draft assistant.</PathBody>
          <ActionButton size="sm" variant="secondary" disabled={!canAuthor} title={canAuthor ? 'Validate, then create' : authorDenied} onClick={() => toggle('import')}>
            {path === 'import' ? 'Hide import' : 'Choose a file →'}
          </ActionButton>
        </PathCard>
        <PathCard>
          <PathTitle>Start blank</PathTitle>
          <PathBody>Name the agent, write the purpose, configure every slot by hand on the circuit.</PathBody>
          <ActionButton size="sm" variant="secondary" onClick={onBlank}>
            Name the agent →
          </ActionButton>
        </PathCard>
      </PathGrid>
      {path === 'template' && <TemplateGallery onInstall={setInstalling} />}
      {path === 'clone' && canAuthor && (
        <ClonePicker
          open
          onClose={() => setPath(null)}
          initialSourceId={null}
          onCloned={(id) => navigate({ to: buildAgentBuildPath(id) })}
        />
      )}
      {path === 'import' && canAuthor && (
        <ImportPane
          assistantId={null}
          onImported={({ assistantId }) => navigate({ to: buildAgentBuildPath(assistantId) })}
        />
      )}
      {installing && (
        <InstallWizard
          entry={installing}
          onClose={() => setInstalling(null)}
          canInstall={canAuthor}
          installDenied={authorDenied}
          onInstalled={(assistantId) => navigate({ to: buildAgentBuildPath(assistantId) })}
        />
      )}
    </OriginWrap>
  );
}
