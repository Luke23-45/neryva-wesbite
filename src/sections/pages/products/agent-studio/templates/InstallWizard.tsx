import { useEffect } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import type { TemplateListEntry } from '@hooks/studio/useSetupTemplates';

export interface InstallWizardProps {
  entry: TemplateListEntry;
  onClose: () => void;
  canInstall: boolean;
  installDenied: string;
  onInstalled?: (assistantId: string) => void;
}

/**
 * R-1 migration shim: the install wizard is now a routed section at
 * /agent-studio/templates/$templateId/install (InstallSection). The shared
 * Modal is gone. This component keeps the old prop contract so the builder
 * origin screen keeps working untouched — it redirects to the section,
 * threading the current location as returnTo so Cancel/Close return here.
 * (The gallery, builder banner, and agent-detail origin navigate to the
 * section directly instead of rendering this shim.)
 */
export function InstallWizard({ entry }: InstallWizardProps) {
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    const back = router.state.location.pathname;
    void navigate({
      to: `/agent-studio/templates/${entry.template.slug}/install`,
      search: { returnTo: back.startsWith('/agent-studio/') ? back : undefined },
      replace: true,
    });
  }, [entry.template.slug, navigate, router]);

  return null;
}
