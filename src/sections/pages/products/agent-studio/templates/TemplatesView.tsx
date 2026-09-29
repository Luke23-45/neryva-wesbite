import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { pageItem } from '@styles/motion';
import { type TemplateListEntry } from '@hooks/studio/useSetupTemplates';
import { TemplateGallery } from './TemplateGallery';

/**
 * Templates library — page shell over the shared gallery (C11 owns it;
 * the builder origin reuses it, never forks it). "Install" routes to the
 * dedicated install section (R-1), threading the gallery as returnTo so
 * Cancel/Close land back here.
 */
export function TemplatesView() {
  const navigate = useNavigate();

  const onInstall = (entry: TemplateListEntry) => {
    void navigate({
      to: `/agent-studio/templates/${entry.template.slug}/install`,
      search: { returnTo: '/agent-studio/templates' },
    });
  };

  return (
    <ViewShell>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle>Templates</ViewTitle>
          <ViewSubtitle>
            Registry blueprints with compatibility truth — install copies into a draft, never live. Unresolved tool pins block install; the checklist shows the fix.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <TemplateGallery onInstall={onInstall} />
      </motion.div>
    </ViewShell>
  );
}
