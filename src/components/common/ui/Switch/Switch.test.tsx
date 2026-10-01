// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { Switch } from './Switch';

function renderSwitch(props?: Partial<React.ComponentProps<typeof Switch>>) {
  return render(
    <ThemeProvider theme={theme}>
      <Switch checked={false} onChange={() => undefined} {...props} />
    </ThemeProvider>,
  );
}

function injectedCss(): string {
  return Array.from(document.head.querySelectorAll('style'))
    .map((tag) => tag.textContent ?? '')
    .join('\n');
}

describe('Switch', () => {
  it('exposes label as the accessible name without rendering visible label text', () => {
    renderSwitch({ label: 'PII redaction' });
    const toggle = screen.getByRole('switch', { name: 'PII redaction' });
    expect(toggle).toBeTruthy();
    expect(toggle.getAttribute('aria-label')).toBe('PII redaction');
    // One label, one place: the switch must not paint the label as visible
    // text — call sites own their visible titles.
    expect(screen.queryByText('PII redaction')).toBeNull();
  });

  it('forwards a directly-passed aria-label to the track', () => {
    renderSwitch({ 'aria-label': 'Auto-recharge enabled' });
    const toggle = screen.getByRole('switch', { name: 'Auto-recharge enabled' });
    expect(toggle.getAttribute('aria-label')).toBe('Auto-recharge enabled');
    expect(screen.queryByText('Auto-recharge enabled')).toBeNull();
  });

  it('toggles on click and on Enter/Space', () => {
    const onChange = vi.fn();
    renderSwitch({ onChange, label: 'Toggles' });
    const toggle = screen.getByRole('switch', { name: 'Toggles' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
    fireEvent.keyDown(toggle, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(toggle, { key: ' ' });
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('does not toggle when disabled and removes itself from tab order', () => {
    const onChange = vi.fn();
    renderSwitch({ onChange, disabled: true, label: 'Toggles' });
    const toggle = screen.getByRole('switch', { name: 'Toggles' });
    fireEvent.click(toggle);
    fireEvent.keyDown(toggle, { key: 'Enter' });
    fireEvent.keyDown(toggle, { key: ' ' });
    expect(onChange).not.toHaveBeenCalled();
    expect(toggle.getAttribute('tabindex')).toBe('-1');
  });

  it('has a 44px hit box via ::after while the visible track stays 38×22', () => {
    renderSwitch({ label: 'Toggles' });
    const track = screen.getByRole('switch', { name: 'Toggles' });

    const style = getComputedStyle(track);
    expect(style.width).toBe('38px');
    expect(style.height).toBe('22px');
    expect(style.position).toBe('relative');

    const css = injectedCss().replace(/\s+/g, '');
    const classTokens = (track.getAttribute('class') ?? '')
      .split(/\s+/)
      .filter((t) => t && !t.startsWith('sc-'));
    expect(classTokens.length).toBeGreaterThan(0);
    const afterRule = classTokens
      .map((token) => {
        const idx = css.indexOf(`.${token}::after{`);
        return idx === -1 ? null : css.slice(idx, css.indexOf('}', idx) + 1);
      })
      .find((rule) => rule !== null);
    expect(afterRule).toBeTruthy();
    // 22px + 11px + 11px = 44px tall; 38px + 11px + 11px = 60px wide.
    expect(afterRule).toMatch(/content:(""|'')/);
    expect(afterRule).toContain('position:absolute');
    expect(afterRule).toContain('inset:-11px');

    // Guard: the visible track must stay small — if someone "fixes" the
    // measurement by enlarging the track itself, this fails and the ::after
    // contract must be revisited.
    expect(style.width).not.toBe('44px');
    expect(style.height).not.toBe('44px');
  });
});
