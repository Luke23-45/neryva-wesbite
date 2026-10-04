// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  agentStudioModelsCredentialsNewRoute,
  agentStudioModelsCredentialsRotateRoute,
  agentStudioModelsRoute,
} from './routes';

/**
 * B8 kill-switch (Providers Phase 5, Wave D): the retired /models surface is
 * three beforeLoad redirects into /agent-studio/providers. The redirects keep
 * builder/ and agents-detail/ links (Phase 6 owns those) working without
 * rendering anything.
 */

interface RedirectOptions {
  to?: string;
}

interface BeforeLoadRoute {
  options: {
    path?: string;
    beforeLoad?: (ctx: never) => unknown;
  };
}

/** Run the route's beforeLoad and return the redirect target it throws. */
function thrownRedirectTarget(route: BeforeLoadRoute): string | null {
  const beforeLoad = route.options.beforeLoad;
  if (!beforeLoad) return null;
  try {
    beforeLoad({} as never);
  } catch (err) {
    const options = (err as { options?: RedirectOptions } | null | undefined)?.options;
    return options?.to ?? null;
  }
  return null;
}

describe('B8 kill-switch: legacy /models routes redirect to the providers surface', () => {
  it.each([
    ['/agent-studio/models', agentStudioModelsRoute as unknown as BeforeLoadRoute],
    ['/agent-studio/models/credentials/new', agentStudioModelsCredentialsNewRoute as unknown as BeforeLoadRoute],
    [
      '/agent-studio/models/credentials/$credentialId/rotate',
      agentStudioModelsCredentialsRotateRoute as unknown as BeforeLoadRoute,
    ],
  ])('%s redirects to /agent-studio/providers', (_path, route) => {
    expect(thrownRedirectTarget(route)).toBe('/agent-studio/providers');
  });

  it('registers exactly three legacy paths (no duplicate /models entry)', () => {
    const paths = [
      (agentStudioModelsRoute as unknown as BeforeLoadRoute).options.path,
      (agentStudioModelsCredentialsNewRoute as unknown as BeforeLoadRoute).options.path,
      (agentStudioModelsCredentialsRotateRoute as unknown as BeforeLoadRoute).options.path,
    ];
    expect(paths).toEqual(['/models', '/models/credentials/new', '/models/credentials/$credentialId/rotate']);
  });

  it('renders nothing (component is a null stub)', () => {
    for (const route of [
      agentStudioModelsRoute,
      agentStudioModelsCredentialsNewRoute,
      agentStudioModelsCredentialsRotateRoute,
    ]) {
      const component = (route as unknown as { options: { component?: () => null } }).options.component;
      expect(component?.()).toBeNull();
    }
  });
});
