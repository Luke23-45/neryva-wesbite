// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import {
  BuilderTopbarActions,
  BuilderTopbarIdentity,
  type BuilderTopbarActionsProps,
  type BuilderTopbarIdentityProps,
} from './BuilderTopBar';

function renderIdentity(overrides: Partial<BuilderTopbarIdentityProps> = {}) {
  const props: BuilderTopbarIdentityProps = {
    mode: 'build',
    agentName: 'Test agent',
    orgName: 'Acme Org',
    hasDraft: true,
    hasLive: false,
    ...overrides,
  };
  render(
    <ThemeProvider theme={theme}>
      <BuilderTopbarIdentity {...props} />
    </ThemeProvider>,
  );
}

function renderActions(overrides: Partial<BuilderTopbarActionsProps> = {}) {
  const onSave = vi.fn();
  const onTestRun = vi.fn();
  const onPublish = vi.fn();
  const props: BuilderTopbarActionsProps = {
    mode: 'build',
    saveState: 'unsaved',
    onSave,
    canAuthor: true,
    onTestRun,
    onPublish,
    blockingCount: 0,
    ...overrides,
  };
  render(
    <ThemeProvider theme={theme}>
      <BuilderTopbarActions {...props} />
    </ThemeProvider>,
  );
  return { onSave, onTestRun, onPublish, container: document.body };
}

const saveButton = () => screen.getByRole('button', { name: 'Save changes' });
const testRunButton = () => screen.getByRole('button', { name: /test run/i });
const publishButton = () => screen.getByRole('button', { name: /publish/i });

describe('BuilderTopbarIdentity (T13)', () => {
  it('renders the flat 24px logo mark — no gradient anywhere on it', () => {
    renderIdentity();
    const logo = screen.getByTestId('topbar-logo');
    const style = window.getComputedStyle(logo);
    expect(style.backgroundImage).not.toContain('gradient');
    expect(style.backgroundColor).toBe('rgb(47, 127, 224)');
    expect(style.width).toBe('24px');
  });

  it('renders no "AgentStudio" wordmark — the mark + breadcrumb carry the brand', () => {
    renderIdentity();
    expect(screen.queryByText('AgentStudio')).toBeNull();
  });

  it('renders no tier badge — the engine exposes no org tier (ledger §8.2)', () => {
    renderIdentity();
    expect(screen.queryByText(/enterprise/i)).toBeNull();
  });

  it('shows the org crumb in the breadcrumb when orgName is set', () => {
    renderIdentity({ orgName: 'Acme Org' });
    expect(screen.getByText('Acme Org · Agents ·')).toBeTruthy();
    expect(screen.getByText('Test agent')).toBeTruthy();
  });

  it('omits the org crumb when orgName is null but keeps the agent name', () => {
    renderIdentity({ orgName: null });
    expect(screen.getByText('Test agent')).toBeTruthy();
    expect(screen.queryByText(/Agents ·/)).toBeNull();
  });

  it('shows "New agent" in new mode', () => {
    renderIdentity({ mode: 'new' });
    expect(screen.getByText('New agent')).toBeTruthy();
  });

  it('renders the Draft pill in build mode when hasDraft', () => {
    renderIdentity({ mode: 'build', hasDraft: true, hasLive: false });
    expect(screen.getByText('Draft')).toBeTruthy();
  });

  it('renders the Live pill in build mode when hasLive', () => {
    renderIdentity({ mode: 'build', hasDraft: false, hasLive: true });
    expect(screen.getByText('Live')).toBeTruthy();
  });

  it('renders no pills in new mode', () => {
    renderIdentity({ mode: 'new', hasDraft: true, hasLive: true });
    expect(screen.queryByText('Draft')).toBeNull();
    expect(screen.queryByText('Live')).toBeNull();
  });
});

describe('BuilderTopbarActions manual save', () => {
  it('calls onSave exactly once when the Save button is clicked', () => {
    const { onSave } = renderActions({ saveState: 'unsaved' });
    fireEvent.click(saveButton());
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('enables Save when there are unsaved changes', () => {
    renderActions({ saveState: 'unsaved' });
    expect(saveButton()).toBeEnabled();
  });

  it('disables Save when everything is saved', () => {
    renderActions({ saveState: 'saved' });
    expect(saveButton()).toBeDisabled();
  });

  it('disables Save while a save is in flight', () => {
    renderActions({ saveState: 'saving' });
    expect(saveButton()).toBeDisabled();
  });

  it('disables Save while syncing (clean but refetching — nothing dirty to save)', () => {
    renderActions({ saveState: 'syncing' });
    expect(saveButton()).toBeDisabled();
  });

  it('disables Save in new mode — there is nothing to save yet', () => {
    renderActions({ mode: 'new', saveState: 'unsaved' });
    expect(saveButton()).toBeDisabled();
    expect(screen.getByText('Not created yet')).toBeTruthy();
  });

  it('disables Save when the viewer cannot author', () => {
    renderActions({ canAuthor: false, saveState: 'unsaved' });
    expect(saveButton()).toBeDisabled();
  });

  it('keeps the honest save-state readout next to the button', () => {
    renderActions({ saveState: 'unsaved' });
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    expect(saveButton()).toBeTruthy();
  });

  it('renders no relative-timestamp save copy (A2)', () => {
    const { container } = renderActions();
    expect(container.textContent).not.toMatch(/\d+\s*(m|h)\s*ago/i);
    expect(screen.queryByText(/saved .* ago/i)).toBeNull();
  });
});

describe('BuilderTopbarActions Test run (T9)', () => {
  it('calls onTestRun when the Test run button is clicked', () => {
    const { onTestRun } = renderActions({ canAuthor: true });
    fireEvent.click(testRunButton());
    expect(onTestRun).toHaveBeenCalledTimes(1);
  });

  it('hides the Test run button in new mode', () => {
    renderActions({ mode: 'new' });
    expect(screen.queryByRole('button', { name: /test run/i })).toBeNull();
  });

  it('disables Test run with an honest reason when the viewer cannot author', () => {
    const { onTestRun } = renderActions({ canAuthor: false });
    const btn = testRunButton();
    expect(btn).toBeDisabled();
    expect(btn.getAttribute('title')).toBe('Testing requires an author role');
    fireEvent.click(btn);
    expect(onTestRun).not.toHaveBeenCalled();
  });
});

describe('BuilderTopbarActions Publish (T10)', () => {
  it('calls onPublish when the Publish button is clicked', () => {
    const { onPublish } = renderActions({ blockingCount: 0 });
    fireEvent.click(publishButton());
    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  it('hides the Publish button in new mode', () => {
    renderActions({ mode: 'new' });
    expect(screen.queryByRole('button', { name: /publish/i })).toBeNull();
  });

  it('never disables Publish in build mode — blocked clicks open the issues surface', () => {
    renderActions({ blockingCount: 3, canAuthor: true });
    expect(publishButton()).toBeEnabled();
  });

  it('shows the blocking-count badge when blockingCount > 0', () => {
    renderActions({ blockingCount: 3 });
    expect(screen.getByTestId('publish-badge').textContent).toBe('3');
  });

  it('renders no badge when blockingCount is 0', () => {
    renderActions({ blockingCount: 0 });
    expect(screen.queryByTestId('publish-badge')).toBeNull();
  });

  it('names the blocking count honestly in the Publish title', () => {
    renderActions({ blockingCount: 2 });
    expect(publishButton().getAttribute('title')).toContain('2 blocking issues');
  });

  it('renders the publish button flat — no gradient', () => {
    renderActions();
    const style = window.getComputedStyle(publishButton());
    expect(style.backgroundImage).not.toContain('gradient');
    expect(style.backgroundColor).toBe('rgb(47, 127, 224)');
  });

  it('renders no Engine Room link — it moved to the builder status bar (T13)', () => {
    renderActions();
    expect(screen.queryByText(/engine room/i)).toBeNull();
  });
});

describe('BuilderTopbar panel restore buttons (T15)', () => {
  it('renders no palette restore button by default', () => {
    renderIdentity();
    expect(screen.queryByRole('button', { name: 'Show component palette' })).toBeNull();
  });

  it('renders no inspector restore button by default', () => {
    renderActions();
    expect(screen.queryByRole('button', { name: 'Show inspector' })).toBeNull();
  });

  it('shows the palette restore button before the mark when the palette is collapsed', () => {
    const onRestorePalette = vi.fn();
    renderIdentity({ paletteCollapsed: true, onRestorePalette });
    const btn = screen.getByRole('button', { name: 'Show component palette' });
    expect(btn.getAttribute('title')).toBe('Show component palette');
    fireEvent.click(btn);
    expect(onRestorePalette).toHaveBeenCalledTimes(1);
  });

  it('shows the inspector restore button when the inspector is collapsed', () => {
    const onRestoreInspector = vi.fn();
    renderActions({ inspectorCollapsed: true, onRestoreInspector });
    const btn = screen.getByRole('button', { name: 'Show inspector' });
    expect(btn.getAttribute('title')).toBe('Show inspector');
    fireEvent.click(btn);
    expect(onRestoreInspector).toHaveBeenCalledTimes(1);
  });
});
