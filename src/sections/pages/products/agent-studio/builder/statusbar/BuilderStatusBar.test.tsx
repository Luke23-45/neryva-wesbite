// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { theme } from '@styles/theme';
import { BuilderStatusBar, type BuilderStatusBarProps } from './BuilderStatusBar';

/** The Engine Room link renders as a TanStack Link — it needs router context. */
async function renderBar(overrides: Partial<BuilderStatusBarProps> = {}) {
  const props: BuilderStatusBarProps = {
    configured: 5,
    total: 14,
    blockers: 2,
    suggestions: 3,
    version: 3,
    editPath: null,
    ...overrides,
  };
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <ThemeProvider theme={theme}>
        <BuilderStatusBar {...props} />
      </ThemeProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  });
  await act(async () => {
    render(<RouterProvider router={router} />);
  });
  return within(screen.getByRole('contentinfo', { name: 'Builder status' }));
}

describe('BuilderStatusBar', () => {
  it('renders the left segment with computed readiness values', async () => {
    const bar = await renderBar();
    expect(bar.getByText('5/14 configured · 2 blocking · 3 suggestions')).toBeTruthy();
  });

  it('omits the blockers segment when blockers is 0 — never shows "0 blocking"', async () => {
    const bar = await renderBar({ blockers: 0 });
    expect(bar.getByText('5/14 configured · 3 suggestions')).toBeTruthy();
    expect(bar.queryByText(/0 blocking/)).toBeNull();
  });

  it('omits the suggestions segment when suggestions is 0 — never shows "0 suggestions"', async () => {
    const bar = await renderBar({ suggestions: 0 });
    expect(bar.getByText('5/14 configured · 2 blocking')).toBeTruthy();
    expect(bar.queryByText(/0 suggestions/)).toBeNull();
  });

  it('renders "ready to publish" when everything is configured and no issues remain', async () => {
    const bar = await renderBar({ configured: 14, blockers: 0, suggestions: 0 });
    expect(bar.getByText('14/14 configured · ready to publish')).toBeTruthy();
  });

  it('does not claim ready to publish when issues remain', async () => {
    const bar = await renderBar({ configured: 14, blockers: 1, suggestions: 0 });
    expect(bar.getByText('14/14 configured · 1 blocking')).toBeTruthy();
    expect(bar.queryByText(/ready to publish/)).toBeNull();
  });

  it('renders the draft version pill when version is set', async () => {
    const bar = await renderBar({ version: 3 });
    expect(bar.getByText('Draft v3')).toBeTruthy();
  });

  it('omits the draft version pill when version is null', async () => {
    const bar = await renderBar({ version: null });
    expect(bar.queryByText(/Draft v/)).toBeNull();
  });

  it('shows canvas hints without the deferred ⌘K palette (A4)', async () => {
    const bar = await renderBar();
    expect(bar.getByText('Drag to pan · Scroll to zoom · Click a node to inspect')).toBeTruthy();
    expect(bar.queryByText(/⌘K/)).toBeNull();
  });

  it('has no save/readout or realtime indicators — the topbar owns the honest save state (A2)', async () => {
    const bar = await renderBar();
    expect(bar.queryByText(/autosaved/i)).toBeNull();
    expect(bar.queryByText(/realtime/i)).toBeNull();
  });

  it('renders the Engine Room link when editPath is set (moved out of the merged topbar, T13)', async () => {
    const bar = await renderBar({ editPath: '/agent-studio/agents/abc/edit' });
    expect(bar.getByText('Engine Room')).toBeTruthy();
  });

  it('omits the Engine Room link when editPath is null', async () => {
    const bar = await renderBar({ editPath: null });
    expect(bar.queryByText(/engine room/i)).toBeNull();
  });
});
