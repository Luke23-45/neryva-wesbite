import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ViewShell, ViewHeader, ViewHeaderRow, ViewTitle, ViewSubtitle } from '@components/common/ui/ViewLayout';
import { Panel } from '@components/common/ui/Panel';
import { pageItem } from '@styles/motion';
import { useAssistant } from '@hooks/studio/useAgentAuthoring';
import { canSetup } from '@lib/engine/capabilities';
import { useOrg } from '@/Context/OrgContext';
import { ImportPane } from '../ImportPane';
import { SectionBackRow } from '../SectionBackRow';

/** Full route id once the coordinator wires it (child of agentStudioAgentsRoute, path '/$agentId/versions/import'). */
export const VERSION_IMPORT_ROUTE_ID = '/agent-studio/agents/$agentId/versions/import' as const;

/** sessionStorage marker preserving the C12 post-import landing (imported draft pulses + banner) across the new navigation. */
export const IMPORT_HIGHLIGHT_KEY = (agentId: string) => `agents:import:highlighted:${agentId}`;

/**
 * Import a definition — dedicated section replacing the import Modal
 * (A-13) from the agent detail Versions panel.
 *
 * Embeds the same ImportPane (C12 owns it, never forked). On success the
 * section auto-navigates to the agent detail (the versions list) with a
 * sessionStorage highlight marker so the imported draft row pulses with
 * the "Imported as draft — review then publish." banner — replacing the
 * old auto-close → onImported callback without losing the landing. A null
 * version id falls back to the plain detail navigation. Copy verbatim.
 */
export function VersionImportSection() {
  const params = useParams({ from: VERSION_IMPORT_ROUTE_ID });
  const agentId = params.agentId;
  const { role } = useOrg();
  const navigate = useNavigate();
  // ImportPane gates sending on setup:author itself; the section bounces
  // earlier on the same capability so the gate is a route, not a dead end.
  const canImport = canSetup(role, 'setup:author');
  // Don't fire the agent read for users who are about to bounce (server gates too).
  const assistant = useAssistant(canImport ? agentId : null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus the heading on mount (preventScroll) — matches shell announcement pattern.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  // Capability gate + unknown-agent bounce. Nothing renders before the gates.
  const agentUnknown = !assistant.isPending && (assistant.isError || assistant.data === null);
  useEffect(() => {
    if (!canImport || agentUnknown) {
      navigate({ to: '/agent-studio/agents' });
    }
  }, [canImport, agentUnknown, navigate]);

  if (!canImport || agentUnknown) {
    return null;
  }

  const detailTo = { to: '/agent-studio/agents/$agentId' as const, params: { agentId } };
  // The styled back row erases TanStack's per-route param/search inference,
  // so the account id is interpolated into the path (P1 channels pattern).
  const detailPath = `/agent-studio/agents/${agentId}`;

  return (
    <ViewShell>
      <SectionBackRow to={detailPath}>
        <span aria-hidden="true">‹</span> Agent detail
      </SectionBackRow>
      <ViewHeaderRow as={motion.div} initial="hidden" animate="visible" variants={pageItem} custom={0}>
        <ViewHeader>
          <ViewTitle ref={headingRef} tabIndex={-1}>Import a definition</ViewTitle>
          <ViewSubtitle>
            Import a definition from an export file — it lands as a draft version, never published silently.
          </ViewSubtitle>
        </ViewHeader>
      </ViewHeaderRow>

      <motion.div initial="hidden" animate="visible" variants={pageItem} custom={1}>
        <Panel title="Definition import" subtitle="File or paste — validated client-side before anything is sent.">
          <ImportPane
            assistantId={agentId}
            onImported={({ versionId }) => {
              // Preserve the C12 landing: the detail page consumes this
              // marker once and highlights the imported draft row.
              if (versionId) {
                try {
                  window.sessionStorage.setItem(IMPORT_HIGHLIGHT_KEY(agentId), versionId);
                } catch {
                  // Private mode etc. — the highlight is a convenience, never load-bearing.
                }
              }
              navigate(detailTo);
            }}
          />
        </Panel>
      </motion.div>
    </ViewShell>
  );
}
