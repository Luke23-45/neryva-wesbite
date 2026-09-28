// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { BuilderTopBar, type BuilderTopBarProps } from './BuilderTopBar';

function renderBar(overrides: Partial<BuilderTopBarProps> = {}) {
  const onSave = vi.fn();
  const props: BuilderTopBarProps = {
    mode: 'build',
    agentName: 'Test agent',
    hasDraft: true,
    hasLive: false,
    saveState: 'unsaved',
    editPath: null,
    onSave,
    canAuthor: true,
    ...overrides,
  };
  render(
    <ThemeProvider theme={theme}>
      <BuilderTopBar {...props} />
    </ThemeProvider>,
  );
  return { onSave };
}

const saveButton = () => screen.getByRole('button', { name: 'Save changes' });

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
