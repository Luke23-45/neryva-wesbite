// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '@styles/theme';
import { BlockEditor } from './BlockEditor';
import type { BlockJsonKind, EditableBlock } from './types';

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

const MARKDOWN = '# Test objective\n\nHandles **support** queries.';

function target(jsonKind: BlockJsonKind, content = MARKDOWN): EditableBlock {
  return {
    key: `test:block:${jsonKind}`,
    sectionLabel: 'Instructions',
    title: 'Objective',
    jsonKind,
    block: { mode: 'markdown', content },
    placeholder: 'Type…',
  };
}

function renderEditor(t: EditableBlock) {
  return render(
    <ThemeProvider theme={theme}>
      <BlockEditor target={t} onDraft={vi.fn()} onSave={vi.fn()} onClose={vi.fn()} />
    </ThemeProvider>,
  );
}

/** markdown -> JSON -> "Wrap as a JSON string" -> back; assert the final text. */
function roundTrip(t: EditableBlock, validLabel: string): string {
  const { unmount } = renderEditor(t);
  fireEvent.click(screen.getByRole('tab', { name: 'JSON' }));
  fireEvent.click(screen.getByRole('button', { name: 'Wrap as a JSON string' }));
  expect(screen.getByText(validLabel)).toBeTruthy();
  fireEvent.click(screen.getByRole('tab', { name: 'Markdown' }));
  const value = (screen.getByRole('textbox') as HTMLTextAreaElement).value;
  unmount();
  return value;
}

/** Repro of the phase-2 check-1 failure: Instructions blocks use jsonKind 'any'. */
describe('BlockEditor JSON round-trip', () => {
  it("unwraps a wrapped string for the 'any' kind (Instructions blocks)", () => {
    expect(roundTrip(target('any'), 'Valid JSON — parsed')).toBe(MARKDOWN);
  });

  it("unwraps a wrapped string for the 'text' kind (Brand block)", () => {
    expect(roundTrip(target('text'), 'Valid JSON — string')).toBe(MARKDOWN);
  });

  it('leaves a JSON object untouched for the \'any\' kind', () => {
    const t = target('any');
    const { unmount } = renderEditor(t);
    fireEvent.click(screen.getByRole('tab', { name: 'JSON' }));
    const area = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(area, { target: { value: '{"tone":"warm"}' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Markdown' }));
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('{"tone":"warm"}');
    unmount();
  });

  it("joins a string array as lines for the 'list' kind (Role list fields)", () => {
    const t = target('list');
    const { unmount } = renderEditor(t);
    fireEvent.click(screen.getByRole('tab', { name: 'JSON' }));
    const area = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(area, { target: { value: '["patient","precise"]' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Markdown' }));
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('patient\nprecise');
    unmount();
  });

  it('holds Save & close disabled while JSON is invalid', () => {
    renderEditor(target('any'));
    fireEvent.click(screen.getByRole('tab', { name: 'JSON' }));
    const save = screen.getByRole('button', { name: 'Save & close' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
  });
});
