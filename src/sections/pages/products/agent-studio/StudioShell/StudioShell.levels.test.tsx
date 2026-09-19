// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { SidebarDomains } from './SidebarDomains';
import { SidebarSection } from './SidebarSection';
import type { NavConfig, NavDomain } from './nav-config';
import navJson from '@neryva_data/products/agent_studio/nav.json';

const config = navJson as unknown as NavConfig;

/**
 * Minimal router context: Link requires a provider, nothing else is exercised.
 * RouterProvider renders the MATCHED route, never children — so the subject
 * mounts through the index route component. The router must also finish
 * loading first (empty body otherwise) — hence async.
 */
async function shell(children: ReactNode) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => <ThemeProvider theme={theme}>{children}</ThemeProvider>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}

describe('SidebarDomains (level 1, real nav.json)', () => {
  it('renders all 7 domains from the registry, nothing hardcoded', async () => {
    await shell(
      <SidebarDomains config={config} activeKey="agents" badges={{}} query="" role="admin" onNavigate={() => undefined} />,
    );
    for (const key of ['Dashboard', 'Chat', 'Agents', 'Libraries', 'Insights', 'Platform', 'Settings']) {
      expect(screen.getByText(key)).toBeTruthy();
    }
    expect(screen.getByText('Agents').closest('a')?.getAttribute('aria-current')).toBe('page');
  });

  it('jump-to reaches items across domains', async () => {
    await shell(
      <SidebarDomains config={config} activeKey={null} badges={{}} query="block" role="admin" onNavigate={() => undefined} />,
    );
    expect(screen.getByText(/Blocks · Platform/)).toBeTruthy();
  });

  it('explains denied rows instead of hiding them', async () => {
    await shell(
      <SidebarDomains config={config} activeKey={null} badges={{}} query="block" role="reader" onNavigate={() => undefined} />,
    );
    const row = screen.getByText(/Blocks · Platform/).closest('a');
    expect(row?.getAttribute('aria-disabled')).toBe('true');
    expect(row?.getAttribute('title')).toContain('Owners and admins only');
  });
});

describe('SidebarSection (level 2, real nav.json)', () => {
  const agents = config.domains.find((d) => d.key === 'agents') as NavDomain;

  it('renders the owning items with the active leaf highlighted', async () => {
    const onBack = vi.fn();
    const ref = { current: null };
    await shell(
      <SidebarSection
        domain={agents}
        activeTo="/agent-studio/templates"
        badges={{}}
        query=""
        role="admin"
        onNavigate={() => undefined}
        onBack={onBack}
        backRef={ref}
      />,
    );
    expect(screen.getByText('All agents')).toBeTruthy();
    expect(screen.getByText('Templates').closest('a')?.getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: 'Back to all sections' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('says plainly when a filter matches nothing', async () => {
    const ref = { current: null };
    await shell(
      <SidebarSection
        domain={agents}
        activeTo={null}
        badges={{}}
        query="zzz-no-such-thing"
        role="admin"
        onNavigate={() => undefined}
        onBack={() => undefined}
        backRef={ref}
      />,
    );
    expect(screen.getByText(/No matches for/)).toBeTruthy();
  });
});
