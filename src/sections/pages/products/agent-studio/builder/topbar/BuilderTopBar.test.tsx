// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { BuilderTopBar, type BuilderTopBarProps } from './BuilderTopBar';

function renderBar(overrides: Partial<BuilderTopBarProps> = {}) {
  const onSave = vi.fn();
  const onTestRun = vi.fn();
  const onPublish = vi.fn();
  const props: BuilderTopBarProps = {
    mode: 'build',
    agentName: 'Test agent',
    orgName: 'Acme Org',
    hasDraft: true,
    hasLive: false,
    saveState: 'unsaved',
    editPath: null,
    onSave,
    canAuthor: true,
    onTestRun,
    onPublish,
    blockingCount: 0,
    ...overrides,
  };
  render(
    <ThemeProvider theme={theme}>
      <BuilderTopBar {...props} />
    </ThemeProvider>,
  );
  return { onSave, onTestRun, onPublish, container: document.body };
}

const saveButton = () => screen.getByRole('button', { name: 'Save changes' });
const testRunButton = () => screen.getByRole('button', { name: /test run/i });
const publishButton = () => screen.getByRole('button', { name: /publish/i });

describe('BuilderTopBar manual save', () => {
  it('calls onSave exactly once when the Save button is clicked', () => {
    const { onSave } = renderBar({ saveState: 'unsaved' });
    fireEvent.click(saveButton());
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('enables Save when there are unsaved changes', () => {
    renderBar({ saveState: 'unsaved' });
    expect(saveButton()).toBeEnabled();
  });

  it('disables Save when everything is saved', () => {
    renderBar({ saveState: 'saved' });
    expect(saveButton()).toBeDisabled();
  });

  it('disables Save while a save is in flight', () => {
    renderBar({ saveState: 'saving' });
    expect(saveButton()).toBeDisabled();
  });

  it('disables Save while syncing (clean but refetching — nothing dirty to save)', () => {
    renderBar({ saveState: 'syncing' });
    expect(saveButton()).toBeDisabled();
  });

  it('disables Save in new mode — there is nothing to save yet', () => {
    renderBar({ mode: 'new', saveState: 'unsaved' });
    expect(saveButton()).toBeDisabled();
    expect(screen.getByText('Not created yet')).toBeTruthy();
  });

  it('disables Save when the viewer cannot author', () => {
    renderBar({ canAuthor: false, saveState: 'unsaved' });
    expect(saveButton()).toBeDisabled();
  });

  it('keeps the honest save-state readout next to the button', () => {
    renderBar({ saveState: 'unsaved' });
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
    expect(saveButton()).toBeTruthy();
  });
});

describe('BuilderTopBar v10 restyle', () => {
  it('renders the flat logo mark and AgentStudio wordmark', () => {
    renderBar();
    expect(screen.getByTestId('topbar-logo')).toBeTruthy();
    expect(screen.getByText('AgentStudio')).toBeTruthy();
  });

  it('renders the logo flat — no gradient anywhere on it', () => {
    renderBar();
    const logo = screen.getByTestId('topbar-logo');
    const style = window.getComputedStyle(logo);
    expect(style.backgroundImage).not.toContain('gradient');
    // flat #2F7FE0
    expect(style.backgroundColor).toBe('rgb(47, 127, 224)');
  });

  it('renders the publish button flat — no gradient', () => {
    renderBar();
    const style = window.getComputedStyle(publishButton());
    expect(style.backgroundImage).not.toContain('gradient');
    expect(style.backgroundColor).toBe('rgb(47, 127, 224)');
  });

  it('renders no tier badge — the engine exposes no org tier (ledger §8.2)', () => {
    renderBar();
    expect(screen.queryByText(/enterprise/i)).toBeNull();
  });

  it('shows the org crumb in the breadcrumb when orgName is set', () => {
    renderBar({ orgName: 'Acme Org' });
    expect(screen.getByText('Acme Org · Agents ·')).toBeTruthy();
    expect(screen.getByText('Test agent')).toBeTruthy();
  });

  it('omits the org crumb when orgName is null but keeps the agent name', () => {
    renderBar({ orgName: null });
    expect(screen.getByText('Test agent')).toBeTruthy();
    expect(screen.queryByText(/Agents ·/)).toBeNull();
  });

  it('renders no relative-timestamp save copy (A2)', () => {
    const { container } = renderBar();
    expect(container.textContent).not.toMatch(/\d+\s*(m|h)\s*ago/i);
    expect(screen.queryByText(/saved .* ago/i)).toBeNull();
  });
});

describe('BuilderTopBar Test run action (T9)', () => {
  it('calls onTestRun when the Test run button is clicked', () => {
    const { onTestRun } = renderBar({ canAuthor: true });
    fireEvent.click(testRunButton());
    expect(onTestRun).toHaveBeenCalledTimes(1);
  });

  it('hides the Test run button in new mode', () => {
    renderBar({ mode: 'new' });
    expect(screen.queryByRole('button', { name: /test run/i })).toBeNull();
  });

  it('disables Test run with an honest reason when the viewer cannot author', () => {
    const { onTestRun } = renderBar({ canAuthor: false });
    const btn = testRunButton();
    expect(btn).toBeDisabled();
    expect(btn.getAttribute('title')).toBe('Testing requires an author role');
    fireEvent.click(btn);
    expect(onTestRun).not.toHaveBeenCalled();
  });
});

describe('BuilderTopBar Publish action (T10)', () => {
  it('calls onPublish when the Publish button is clicked', () => {
    const { onPublish } = renderBar({ blockingCount: 0 });
    fireEvent.click(publishButton());
    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  it('hides the Publish button in new mode', () => {
    renderBar({ mode: 'new' });
    expect(screen.queryByRole('button', { name: /publish/i })).toBeNull();
  });

  it('never disables Publish in build mode — blocked clicks open the issues surface', () => {
    renderBar({ blockingCount: 3, canAuthor: true });
    expect(publishButton()).toBeEnabled();
  });

  it('shows the blocking-count badge when blockingCount > 0', () => {
    renderBar({ blockingCount: 3 });
    expect(screen.getByTestId('publish-badge').textContent).toBe('3');
  });

  it('renders no badge when blockingCount is 0', () => {
    renderBar({ blockingCount: 0 });
    expect(screen.queryByTestId('publish-badge')).toBeNull();
  });

  it('names the blocking count honestly in the Publish title', () => {
    renderBar({ blockingCount: 2 });
    expect(publishButton().getAttribute('title')).toContain('2 blocking issues');
  });
});
