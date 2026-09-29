// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { SectionNav } from './SectionNav';
import type { SectionEntry } from './section-groups';

const ENTRIES: SectionEntry[] = [
  { id: 'purpose', label: 'Purpose', status: 'ready', statusText: 'Named' },
  { id: 'instructions', label: 'Instructions', status: 'attention', statusText: 'Write instructions' },
  { id: 'model', label: 'Model', status: 'untouched', statusText: '' },
  { id: 'ship', label: 'Ship', status: 'ready', statusText: '' },
];

function renderNav(props: Partial<React.ComponentProps<typeof SectionNav>> = {}) {
  return render(
    <ThemeProvider theme={theme}>
      <SectionNav entries={ENTRIES} selectedId={null} onSelect={() => undefined} locked={false} {...props} />
    </ThemeProvider>,
  );
}

describe('SectionNav', () => {
  it('renders the Overview entry, groups, and section rows', () => {
    renderNav();
    expect(screen.getByRole('navigation', { name: 'Agent sections' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('Validate & ship')).toBeInTheDocument();
    // purpose reads as Identity in the nav.
    expect(screen.getByRole('button', { name: /Identity/ })).toBeInTheDocument();
  });

  it('marks the selected row with aria-current and clicks through', () => {
    const onSelect = vi.fn();
    renderNav({ selectedId: 'model', onSelect });
    expect(screen.getByRole('button', { name: /Model/ })).toHaveAttribute('aria-current', 'page');
    fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
    expect(onSelect).toHaveBeenCalledWith('overview');
    fireEvent.click(screen.getByRole('button', { name: /Ship/ }));
    expect(onSelect).toHaveBeenCalledWith('ship');
  });

  it('renders status badges with accessible labels', () => {
    renderNav();
    // Instructions is attention → the custom SVG badge carries its label.
    expect(screen.getByLabelText('Needs attention')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Configured')).toHaveLength(2);
  });

  it('locks non-Identity rows in new mode', () => {
    const onSelect = vi.fn();
    renderNav({ locked: true, onSelect });
    const modelRow = screen.getByRole('button', { name: /Model/ });
    expect(modelRow).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(modelRow);
    expect(onSelect).not.toHaveBeenCalled();
    const identityRow = screen.getByRole('button', { name: /Identity/ });
    expect(identityRow).not.toHaveAttribute('aria-disabled');
    fireEvent.click(identityRow);
    expect(onSelect).toHaveBeenCalledWith('purpose');
  });
});
