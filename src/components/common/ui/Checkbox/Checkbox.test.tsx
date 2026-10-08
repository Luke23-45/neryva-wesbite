// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { Checkbox } from './Checkbox';

function shell() {
  return render(
    <ThemeProvider theme={theme}>
      <Checkbox checked={false} onChange={() => {}}>
        I accept this ships degraded
      </Checkbox>
    </ThemeProvider>,
  );
}

describe('Checkbox', () => {
  it('renders a real checkbox wired to its label, not a div', () => {
    shell();
    const box = screen.getByRole('checkbox', { name: /ships degraded/i });
    expect(box).toBeTruthy();
    expect(box.getAttribute('type')).toBe('checkbox');
  });

  it('reports the next value, not the event', () => {
    const onChange = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <Checkbox checked={false} onChange={onChange}>
          Acknowledge
        </Checkbox>
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('toggles the label when the text is clicked, not only the box', () => {
    const onChange = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <Checkbox checked={false} onChange={onChange}>
          Acknowledge
        </Checkbox>
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Acknowledge'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('marks itself invalid and announces the error when given one', () => {
    render(
      <ThemeProvider theme={theme}>
        <Checkbox checked={false} onChange={() => {}} error="Reason is mandatory">
          Acknowledge
        </Checkbox>
      </ThemeProvider>,
    );
    const box = screen.getByRole('checkbox');
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(box.getAttribute('aria-describedby')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Reason is mandatory');
  });

  it('does not fire while disabled', () => {
    const onChange = vi.fn();
    render(
      <ThemeProvider theme={theme}>
        <Checkbox checked={false} onChange={onChange} disabled>
          Acknowledge
        </Checkbox>
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
  });
});