// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { BuilderStatusBar, type BuilderStatusBarProps } from './BuilderStatusBar';

function renderBar(overrides: Partial<BuilderStatusBarProps> = {}) {
  const props: BuilderStatusBarProps = {
    configured: 5,
    total: 14,
    blockers: 2,
    suggestions: 3,
    version: 3,
    ...overrides,
  };
  render(
    <ThemeProvider theme={theme}>
      <BuilderStatusBar {...props} />
    </ThemeProvider>,
  );
  return within(screen.getByRole('contentinfo', { name: 'Builder status' }));
}

describe('BuilderStatusBar', () => {
  it('renders the left segment with computed readiness values', () => {
    const bar = renderBar();
    expect(bar.getByText('5/14 configured · 2 blocking · 3 suggestions')).toBeTruthy();
  });

  it('omits the blockers segment when blockers is 0 — never shows "0 blocking"', () => {
    const bar = renderBar({ blockers: 0 });
    expect(bar.getByText('5/14 configured · 3 suggestions')).toBeTruthy();
    expect(bar.queryByText(/0 blocking/)).toBeNull();
  });

  it('omits the suggestions segment when suggestions is 0 — never shows "0 suggestions"', () => {
    const bar = renderBar({ suggestions: 0 });
    expect(bar.getByText('5/14 configured · 2 blocking')).toBeTruthy();
    expect(bar.queryByText(/0 suggestions/)).toBeNull();
  });

  it('renders "ready to publish" when everything is configured and no issues remain', () => {
    const bar = renderBar({ configured: 14, blockers: 0, suggestions: 0 });
    expect(bar.getByText('14/14 configured · ready to publish')).toBeTruthy();
  });

  it('does not claim ready to publish when issues remain', () => {
    const bar = renderBar({ configured: 14, blockers: 1, suggestions: 0 });
    expect(bar.getByText('14/14 configured · 1 blocking')).toBeTruthy();
    expect(bar.queryByText(/ready to publish/)).toBeNull();
  });

  it('renders the draft version pill when version is set', () => {
    const bar = renderBar({ version: 3 });
    expect(bar.getByText('Draft v3')).toBeTruthy();
  });

  it('omits the draft version pill when version is null', () => {
    const bar = renderBar({ version: null });
    expect(bar.queryByText(/Draft v/)).toBeNull();
  });

  it('shows canvas hints without the deferred ⌘K palette (A4)', () => {
    const bar = renderBar();
    expect(bar.getByText('Drag to pan · Scroll to zoom · Click a node to inspect')).toBeTruthy();
    expect(bar.queryByText(/⌘K/)).toBeNull();
  });

  it('has no save/readout or realtime indicators — the topbar owns the honest save state (A2)', () => {
    const bar = renderBar();
    expect(bar.queryByText(/autosaved/i)).toBeNull();
    expect(bar.queryByText(/realtime/i)).toBeNull();
  });
});
