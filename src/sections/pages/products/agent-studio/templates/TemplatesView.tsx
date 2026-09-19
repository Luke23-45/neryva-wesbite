import { useState } from 'react';
import { motion } from 'framer-motion';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import { type TemplateListEntry } from '@hooks/studio/useSetupTemplates';
import { canSetup, setupDeniedCopy } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { TemplateGallery } from './TemplateGallery';
import { InstallWizard } from './InstallWizard';

/**
 * Templates library — page shell over the shared gallery + install wizard
 * (C11 owns both; the builder origin reuses them, never forks them).
 */
export function TemplatesView() {
  const { role } = useOrg();
  const canInstall = canSetup(role, 'setup:author');
  const installDenied = setupDeniedCopy(role, 'setup:author');
  const [installing, setInstalling] = useState<TemplateListEntry | null>(null);

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Templates</ViewTitle>
          <ViewSubtitle>
            Registry blueprints with compatibility truth — install copies into a draft, never live. Compatibility is advisory, never hiding.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <TemplateGallery onInstall={setInstalling} />
      </motion.div>

      {installing && (
        <InstallWizard
          entry={installing}
          onClose={() => setInstalling(null)}
          canInstall={canInstall}
          installDenied={installDenied}
        />
      )}
    </ViewShell>
  );
}