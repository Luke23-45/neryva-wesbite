/**
 * section-ui — markdown toolbar actions.
 *
 * Pure text transforms applied to the editor's textarea: wrap the
 * selection or prefix the selected lines, then restore the caret.
 * No DOM beyond the textarea the caller passes in.
 */

export type ToolbarActionId =
  | 'bold'
  | 'italic'
  | 'code'
  | 'h2'
  | 'ul'
  | 'ol'
  | 'quote'
  | 'link'
  | 'image';

interface Edit {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

function wrap(value: string, start: number, end: number, before: string, after: string): Edit {
  const selected = value.slice(start, end);
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  const caretStart = start + before.length;
  const caretEnd = caretStart + selected.length;
  return { value: next, selectionStart: caretStart, selectionEnd: selected.length > 0 ? caretEnd : caretStart };
}

function prefixLines(value: string, start: number, end: number, prefix: (n: number) => string): Edit {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', end);
  const endIdx = lineEnd === -1 ? value.length : lineEnd;
  const lines = value.slice(lineStart, endIdx).split('\n');
  const prefixed = lines.map((line, i) => `${prefix(i)}${line}`).join('\n');
  const next = value.slice(0, lineStart) + prefixed + value.slice(endIdx);
  const added = prefixed.length - (endIdx - lineStart);
  return { value: next, selectionStart: start + prefix(0).length, selectionEnd: end + added };
}

/**
 * Apply a toolbar action to the textarea's current value/selection.
 * Returns the next value and caret — the caller writes them back.
 */
export function applyToolbarAction(
  action: ToolbarActionId,
  value: string,
  selectionStart: number,
  selectionEnd: number,
): Edit {
  const start = Math.min(selectionStart, selectionEnd);
  const end = Math.max(selectionStart, selectionEnd);
  switch (action) {
    case 'bold':
      return wrap(value, start, end, '**', '**');
    case 'italic':
      return wrap(value, start, end, '*', '*');
    case 'code':
      return wrap(value, start, end, '`', '`');
    case 'h2':
      return prefixLines(value, start, end, () => '## ');
    case 'ul':
      return prefixLines(value, start, end, () => '- ');
    case 'ol':
      return prefixLines(value, start, end, (n) => `${n + 1}. `);
    case 'quote':
      return prefixLines(value, start, end, () => '> ');
    case 'link': {
      const selected = value.slice(start, end) || 'link text';
      const next = value.slice(0, start) + `[${selected}](url)` + value.slice(end);
      const caret = start + 1 + selected.length + 2; // inside (url)
      return { value: next, selectionStart: caret, selectionEnd: caret + 3 };
    }
    case 'image': {
      const selected = value.slice(start, end) || 'alt text';
      const next = value.slice(0, start) + `![${selected}](image-url)` + value.slice(end);
      const caret = start + 2 + selected.length + 2;
      return { value: next, selectionStart: caret, selectionEnd: caret + 9 };
    }
  }
}
