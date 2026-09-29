// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { InstallWizard } from './InstallWizard';
import type { TemplateListEntry } from '@hooks/studio/useSetupTemplates';

function entry(): TemplateListEntry {
  return {
    template: {
      slug: 'support-concierge',
      version: '3.0.0',
      status: 'stable',
      family: 'support',
      definition: {},
      bindings: { tools: { required: [] }, knowledge: { required: [] }, channels: { channels: [] } },
      evalRef: null,
      releasePolicy: null,
      hash: null,
      minEngineSchema: 2,
    },
    available: true,
    compatible: true,
    reasons: [],
    installed: false,
    updateAvailable: 'none',
  } as TemplateListEntry;
}

async function routerAtOrigin(opts?: { onInstalled?: (id: string) => void }) {
  const rootRoute = createRootRoute();
  const originRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/builder/origin',
    component: () => (
      <InstallWizard
        entry={entry()}
        onClose={() => {}}
        canInstall
        installDenied=""
        onInstalled={opts?.onInstalled}
      />
    ),
  });
  const installProbe = createRoute({
    getParentRoute: () => rootRoute,
    path: '/agent-studio/templates/$templateId/install',
    component: () => <div>install section</div>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([originRoute, installProbe]),
    history: createMemoryHistory({ initialEntries: ['/agent-studio/builder/origin'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  // The shim navigates in an effect — flush the redirect.
  await act(async () => {});
  return router;
}

describe('InstallWizard shim (R-1 redirect)', () => {
  it('redirects to the install section threading returnTo and autoLand when onInstalled is provided', async () => {
    const router = await routerAtOrigin({ onInstalled: () => {} });
    expect(router.state.location.pathname).toBe('/agent-studio/templates/support-concierge/install');
    expect(router.state.location.search).toMatchObject({
      returnTo: '/agent-studio/builder/origin',
      autoLand: 'builder',
    });
  });

  it('threads returnTo but omits autoLand when onInstalled is absent', async () => {
    const router = await routerAtOrigin();
    expect(router.state.location.pathname).toBe('/agent-studio/templates/support-concierge/install');
    expect(router.state.location.search).toMatchObject({ returnTo: '/agent-studio/builder/origin' });
    expect((router.state.location.search as Record<string, unknown>).autoLand).toBeUndefined();
  });
});
