import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { Tooltip } from './Tooltip';

function renderTooltip(label = 'hello policy copy', delay = 20) {
  return render(
    <ThemeProvider theme={theme}>
      <Tooltip label={label} delay={delay}>
        <span>Demo</span>
      </Tooltip>
    </ThemeProvider>,
  );
}

describe('Tooltip hover behavior', () => {
  it('shows the bubble after the hover delay and hides on leave', async () => {
    const { container } = renderTooltip();
    const trigger = container.firstChild as HTMLElement;

    expect(screen.queryByRole('tooltip')).toBeNull();

    fireEvent.mouseEnter(trigger);
    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeTruthy();
    });
    expect(screen.getByRole('tooltip').textContent).toContain('hello policy copy');

    fireEvent.mouseLeave(trigger);
    await waitFor(
      () => {
        expect(screen.queryByRole('tooltip')).toBeNull();
      },
      { timeout: 3000 },
    );
  });

  it('does not show before the delay elapses', async () => {
    const { container } = renderTooltip('policy copy', 5000);
    const trigger = container.firstChild as HTMLElement;

    fireEvent.mouseEnter(trigger);
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
