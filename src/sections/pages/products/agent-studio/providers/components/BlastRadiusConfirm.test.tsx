// @vitest-environment jsdom
/**
 * BlastRadiusConfirm — alert-class confirm for toggle-OFF of a pinned model:
 * - Lists every affected assistant with its pinned version.
 * - States the pinning invariant (runs stay on old versions).
 * - Requires explicit confirmation: cancel never fires onConfirm, and the
 *   dialog never self-confirms.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { BlastRadiusConfirm } from './BlastRadiusConfirm';

function renderConfirm(props?: Partial<Parameters<typeof BlastRadiusConfirm>[0]>) {
  return render(
    <ThemeProvider theme={theme}>
      <BlastRadiusConfirm
        affected={[
          { assistant_id: 'a-1', version: 3, assistant_name: 'Support Bot' },
          { assistant_id: 'a-2', version: 7 },
        ]}
        actionLabel="Disable GPT-4o"
        onConfirm={() => {}}
        onCancel={() => {}}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe('BlastRadiusConfirm', () => {
  it('lists every affected assistant with its pinned version', () => {
    renderConfirm();
    expect(screen.getByText('Support Bot')).toBeTruthy();
    expect(screen.getByText('v3')).toBeTruthy();
    // Unnamed assistant falls back to the raw id.
    expect(screen.getByText('a-2')).toBeTruthy();
    expect(screen.getByText('v7')).toBeTruthy();
  });

  it('states the pinning invariant in the copy', () => {
    renderConfirm();
    expect(screen.getByRole('dialog').textContent).toContain('Pinning invariant');
    expect(screen.getByRole('dialog').textContent).toContain('pinned versions');
  });

  it('requires explicit confirmation — confirm fires onConfirm, cancel fires onCancel only', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderConfirm({ onConfirm, onCancel });

    fireEvent.click(screen.getByRole('button', { name: 'Keep enabled' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Disable GPT-4o' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('names the assistant count in the title', () => {
    renderConfirm();
    expect(screen.getByRole('dialog').textContent).toContain('2 pinned assistants');
  });
});
