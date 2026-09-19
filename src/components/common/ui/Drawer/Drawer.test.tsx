// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { Drawer } from './Drawer';

function shell(props?: Partial<React.ComponentProps<typeof Drawer>>) {
  return render(
    <ThemeProvider theme={theme}>
      <button type="button">Opener</button>
      <Drawer open title="Trace" subtitle="What the run saw" onClose={() => undefined} {...props}>
        <button type="button">Inside action</button>
      </Drawer>
    </ThemeProvider>,
  );
}

afterEach(() => {
  document.body.style.overflow = '';
});

describe('Drawer (shared sheet — C13 owns, C10/C15 reuse)', () => {
  it('renders nothing closed, dialog open with title', () => {
    const { rerender } = shell({ open: false });
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(
      <ThemeProvider theme={theme}>
        <Drawer open title="Trace" onClose={() => undefined}>
          body
        </Drawer>
      </ThemeProvider>,
    );
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText('Trace')).toBeTruthy();
  });

  it('Escape closes and locks body scroll while open', () => {
    const onClose = vi.fn();
    shell({ onClose });
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('overlay click closes, sheet click does not', () => {
    const onClose = vi.fn();
    shell({ onClose });
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
    const overlay = screen.getByRole('dialog').parentElement;
    if (overlay) fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab inside the sheet', () => {
    shell({});
    const dialog = screen.getByRole('dialog');
    const buttons = Array.from(dialog.querySelectorAll('button'));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('returns focus to the opener on close', () => {
    const tree = (open: boolean) => (
      <ThemeProvider theme={theme}>
        <button type="button">Opener</button>
        <Drawer open={open} title="Trace" onClose={() => undefined}>
          <button type="button">Inside action</button>
        </Drawer>
      </ThemeProvider>
    );
    const { rerender } = render(tree(false));
    screen.getByText('Opener').focus();
    rerender(tree(true));
    // Closing keeps the opener mounted (only the sheet unmounts) — focus returns.
    rerender(tree(false));
    expect(document.activeElement?.textContent).toBe('Opener');
  });
});
