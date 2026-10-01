// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { ActionButton } from './ActionButton';

function renderButton(size: 'sm' | 'md' | 'lg') {
  return render(
    <ThemeProvider theme={theme}>
      <ActionButton size={size}>Label</ActionButton>
    </ThemeProvider>,
  );
}

describe('ActionButton sizes', () => {
  it('lg presents a 44px minimum hit target (DS-19)', () => {
    const { container } = renderButton('lg');
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    // Hard floor: no reliance on padding arithmetic; min-height wins.
    expect(getComputedStyle(button as HTMLElement).minHeight).toBe('44px');
  });

  it('lg keeps the body type scale (same text size as md)', () => {
    const { container } = renderButton('lg');
    const button = container.querySelector('button') as HTMLElement;
    expect(getComputedStyle(button).fontSize).toBe('13px');
  });

  it('sm and md keep their existing rhythm — no min-height (DS-19 blast-radius guard)', () => {
    const sm = renderButton('sm');
    const smButton = sm.container.querySelector('button') as HTMLElement;
    // 'auto' = no min-height declaration emitted; the sm rhythm is untouched.
    expect(getComputedStyle(smButton).minHeight).toBe('auto');
    expect(getComputedStyle(smButton).fontSize).toBe('12px');
    sm.unmount();

    const md = renderButton('md');
    const mdButton = md.container.querySelector('button') as HTMLElement;
    expect(getComputedStyle(mdButton).minHeight).toBe('auto');
    expect(getComputedStyle(mdButton).fontSize).toBe('13px');
    md.unmount();
  });

  it('renders children and passes button props through', () => {
    renderButton('lg');
    expect(screen.getByRole('button', { name: 'Label' })).toBeTruthy();
  });
});
