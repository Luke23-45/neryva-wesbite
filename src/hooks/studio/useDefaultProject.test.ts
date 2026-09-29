/**
 * Default-project resolution (console field audit P1-8): the workspace's
 * `default_project_id` setting must resolve to a live, non-archived project
 * before key issuance binds it at issue time. A stale default (deleted or
 * archived after being set) resolves to null and is never sent.
 */
import { describe, expect, it } from 'vitest';
import { resolveDefaultProject } from './useDefaultProject';
import type { ProjectRow } from '@hooks/engine/queries';

function project(id: string, archivedAt: string | null = null): ProjectRow {
  return { id, name: `Project ${id}`, description: null, archivedAt, createdAt: '2026-01-01T00:00:00Z' };
}

describe('resolveDefaultProject', () => {
  it('resolves a configured, live project', () => {
    const projects = [project('p1'), project('p2')];
    expect(resolveDefaultProject('p2', projects)).toEqual(project('p2'));
  });

  it('returns null when no default is configured', () => {
    const projects = [project('p1')];
    expect(resolveDefaultProject(null, projects)).toBeNull();
    expect(resolveDefaultProject('', projects)).toBeNull();
    expect(resolveDefaultProject(undefined, projects)).toBeNull();
  });

  it('returns null when the configured project no longer exists', () => {
    expect(resolveDefaultProject('gone', [project('p1')])).toBeNull();
  });

  it('returns null when the configured project is archived', () => {
    const projects = [project('p1', '2026-09-01T00:00:00Z')];
    expect(resolveDefaultProject('p1', projects)).toBeNull();
  });

  it('returns null on an empty project list', () => {
    expect(resolveDefaultProject('p1', [])).toBeNull();
  });
});
