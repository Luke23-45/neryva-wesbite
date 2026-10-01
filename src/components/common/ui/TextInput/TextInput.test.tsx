// @vitest-environment jsdom
/**
 * TextInput a11y contract (K-BUG5) — label association, error announcement,
 * and hint persistence are asserted here, not assumed.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { TextInput } from './TextInput';

function shell(props?: Partial<React.ComponentProps<typeof TextInput>>) {
  return render(
    <ThemeProvider theme={theme}>
      <TextInput label="Pin address" {...props} />
    </ThemeProvider>,
  );
}

describe('TextInput a11y (K-BUG5)', () => {
  it('associates the label with the input even without an id or name', () => {
    shell({ placeholder: 'kebab-case' });
    const input = screen.getByLabelText('Pin address');
    expect(input.getAttribute('id')).toBeTruthy();
    expect(document.querySelector('label')?.getAttribute('for')).toBe(input.getAttribute('id'));
  });

  it('announces the error via aria-invalid, aria-describedby, and role=alert', () => {
    shell({ error: 'Slugs are 3–64 characters.' });
    const input = screen.getByLabelText('Pin address');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    const errorEl = screen.getByRole('alert');
    expect(errorEl).toHaveTextContent('Slugs are 3–64 characters.');
    expect(describedBy.split(' ')).toContain(errorEl.getAttribute('id'));
  });

  it('keeps the hint visible alongside the error', () => {
    shell({ hint: 'Kebab 3–64, reserved now — 409 on collision.', error: 'Slugs are 3–64 characters.' });
    expect(screen.getByText('Kebab 3–64, reserved now — 409 on collision.')).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
    const input = screen.getByLabelText('Pin address');
    const describedBy = (input.getAttribute('aria-describedby') ?? '').split(' ');
    expect(describedBy.length).toBe(2);
  });

  it('renders no alert and no aria-invalid when valid', () => {
    shell({ hint: 'Kebab 3–64.' });
    const input = screen.getByLabelText('Pin address');
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Kebab 3–64.')).toBeTruthy();
  });
});
