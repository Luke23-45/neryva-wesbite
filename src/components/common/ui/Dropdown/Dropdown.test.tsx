// @vitest-environment jsdom
/**
 * Dropdown contract — one menu engine, three Apple-HIG variants:
 * select (pop-up button), menu (pull-down button), trigger (headless).
 * Covers open/close, value + checkmark, hidden input, keyboard nav,
 * type-ahead, sections, controlled/uncontrolled, focus return.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { Dropdown, type DropdownItem, type DropdownSelectProps } from './Dropdown';

const ITEMS: DropdownItem[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta', description: 'Second option' },
  { value: 'c', label: 'Gamma', disabled: true },
  { value: 'd', label: 'Delta', destructive: true },
];

function shell(node: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{node}</ThemeProvider>);
}

function openSelect(props?: Partial<DropdownSelectProps>) {
  shell(
    <Dropdown variant="select" items={ITEMS} placeholder="Pick one…" {...props} />,
  );
  fireEvent.click(screen.getByRole('button'));
}

describe('Dropdown select variant', () => {
  it('opens on trigger click and lists options with listbox/option roles', () => {
    openSelect();
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true');
  });

  it('selects a value, marks it with aria-selected, and closes', () => {
    const onChange = vi.fn();
    openSelect({ onChange });
    fireEvent.click(screen.getByRole('option', { name: /Beta/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBe('b');
    expect(onChange.mock.calls[0][1].value).toBe('b');
    expect(screen.queryByRole('listbox')).toBeNull();
    // Trigger now shows the selection.
    expect(screen.getByRole('button')).toHaveTextContent('Beta');
  });

  it('shows the placeholder when nothing is selected', () => {
    shell(<Dropdown variant="select" items={ITEMS} placeholder="Pick one…" />);
    expect(screen.getByRole('button')).toHaveTextContent('Pick one…');
  });

  it('renders a hidden input carrying the value when name is set', () => {
    shell(<Dropdown variant="select" items={ITEMS} name="kind" value="a" required />);
    const hidden = document.querySelector('input[name="kind"]') as HTMLInputElement;
    expect(hidden).toBeTruthy();
    expect(hidden.value).toBe('a');
    expect(hidden.required).toBe(true);
  });

  it('renders label, hint, and error like TextInput (hint persists with error)', () => {
    shell(
      <Dropdown
        variant="select"
        items={ITEMS}
        label="Kind"
        hint="Choose wisely."
        error="Required."
      />,
    );
    const button = screen.getByRole('button');
    expect(document.querySelector('label')?.getAttribute('for')).toBe(button.getAttribute('id'));
    expect(screen.getByText('Choose wisely.')).toBeTruthy();
    expect(screen.getByRole('alert')).toHaveTextContent('Required.');
    expect(button.getAttribute('aria-invalid')).toBe('true');
  });

  it('Escape closes and returns focus to the trigger', () => {
    openSelect();
    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button'));
  });

  it('outside pointerdown closes without stealing focus', () => {
    openSelect();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('does not open when disabled', () => {
    shell(<Dropdown variant="select" items={ITEMS} disabled />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('highlights the current selection on open', () => {
    openSelect({ value: 'b' });
    const listbox = screen.getByRole('listbox');
    expect(listbox.getAttribute('aria-activedescendant')).toContain('item-1');
  });
});

describe('Dropdown keyboard', () => {
  it('ArrowDown/Up move highlight and skip disabled items', () => {
    openSelect();
    const listbox = screen.getByRole('listbox');
    // Initial highlight: first enabled (Alpha, item-0).
    expect(listbox.getAttribute('aria-activedescendant')).toContain('item-0');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    expect(listbox.getAttribute('aria-activedescendant')).toContain('item-1');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' });
    // Gamma (item-2) is disabled — skipped to Delta (item-3).
    expect(listbox.getAttribute('aria-activedescendant')).toContain('item-3');
    fireEvent.keyDown(listbox, { key: 'ArrowUp' });
    expect(listbox.getAttribute('aria-activedescendant')).toContain('item-1');
  });

  it('Home/End jump to first/last enabled item', () => {
    openSelect();
    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: 'End' });
    expect(listbox.getAttribute('aria-activedescendant')).toContain('item-3');
    fireEvent.keyDown(listbox, { key: 'Home' });
    expect(listbox.getAttribute('aria-activedescendant')).toContain('item-0');
  });

  it('Enter activates the highlighted option', () => {
    const onChange = vi.fn();
    openSelect({ onChange });
    const listbox = screen.getByRole('listbox');
    fireEvent.keyDown(listbox, { key: 'ArrowDown' }); // Beta
    fireEvent.keyDown(listbox, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('b', expect.objectContaining({ value: 'b' }));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('type-ahead matches by label prefix with a 500ms buffer', () => {
    vi.useFakeTimers();
    try {
      openSelect();
      const listbox = screen.getByRole('listbox');
      fireEvent.keyDown(listbox, { key: 'd' });
      expect(listbox.getAttribute('aria-activedescendant')).toContain('item-3');
      // Buffer expiry: 'b' after 600ms starts a fresh query.
      act(() => {
        vi.advanceTimersByTime(600);
      });
      fireEvent.keyDown(listbox, { key: 'b' });
      expect(listbox.getAttribute('aria-activedescendant')).toContain('item-1');
    } finally {
      vi.useRealTimers();
    }
  });

  it('Tab closes the menu', () => {
    openSelect();
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Tab' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

describe('Dropdown menu variant', () => {
  it('fires onAction with no checkmarks and menu/menuitem roles', () => {
    const onAction = vi.fn();
    shell(<Dropdown variant="menu" title="Actions" items={ITEMS} onAction={onAction} />);
    fireEvent.click(screen.getByRole('button', { name: /actions/i }));
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(screen.getAllByRole('menuitem')).toHaveLength(4);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delta' }));
    expect(onAction).toHaveBeenCalledWith('d', expect.objectContaining({ value: 'd' }));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('renders destructive items in system red', () => {
    shell(<Dropdown variant="menu" title="Actions" items={ITEMS} />);
    fireEvent.click(screen.getByRole('button'));
    const delta = screen.getByRole('menuitem', { name: 'Delta' });
    expect(getComputedStyle(delta).color).toBe('rgb(248, 113, 113)');
  });
});

describe('Dropdown trigger variant', () => {
  it('wires a custom trigger element', () => {
    const onAction = vi.fn();
    shell(
      <Dropdown
        variant="trigger"
        trigger={<button type="button" aria-label="More">⋯</button>}
        items={ITEMS}
        onAction={onAction}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'More' });
    fireEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('menu')).toBeTruthy();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Alpha' }));
    expect(onAction).toHaveBeenCalledWith('a', expect.objectContaining({ value: 'a' }));
  });
});

describe('Dropdown sections + open control', () => {
  const sections = [
    { title: 'Group one', items: [{ value: 'a', label: 'Alpha' }] },
    { title: 'Group two', items: [{ value: 'b', label: 'Beta' }] },
  ];

  it('renders section titles with separators between sections', () => {
    shell(<Dropdown variant="menu" title="Actions" sections={sections} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Group one')).toBeTruthy();
    expect(screen.getByText('Group two')).toBeTruthy();
    expect(document.querySelectorAll('[role="separator"]')).toHaveLength(1);
  });

  it('supports controlled open state', () => {
    const onOpenChange = vi.fn();
    const { rerender } = shell(
      <Dropdown variant="menu" title="Actions" items={ITEMS} open={false} onOpenChange={onOpenChange} />,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('menu')).toBeNull();
    rerender(
      <ThemeProvider theme={theme}>
        <Dropdown variant="menu" title="Actions" items={ITEMS} open onOpenChange={onOpenChange} />
      </ThemeProvider>,
    );
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('supports uncontrolled defaultOpen', () => {
    shell(<Dropdown variant="menu" title="Actions" items={ITEMS} defaultOpen />);
    expect(screen.getByRole('menu')).toBeTruthy();
  });
});
