/**
 * The workspace's default project (console field audit P1-8) — the org
 * setting `default_project_id` (Settings → Workspace), resolved against the
 * live project list.
 *
 * A stale default (project deleted or archived after being set) resolves to
 * null: it must never be sent to the engine, and the caller must not claim
 * the setting takes effect for it.
 */
import { useOrgProfile, useProjects, type ProjectRow } from '@hooks/engine/queries';

export function resolveDefaultProject(configuredId: string | null | undefined, projects: ProjectRow[]): ProjectRow | null {
  if (!configuredId) {
    return null;
  }
  return projects.find((p) => p.id === configuredId && !p.archivedAt) ?? null;
}

export function useDefaultProject() {
  const profile = useOrgProfile();
  const projects = useProjects();
  return {
    project: resolveDefaultProject(profile.data?.settings.defaultProjectId, projects.data?.projects ?? []),
    isLoading: profile.isLoading || projects.isLoading,
  };
}
