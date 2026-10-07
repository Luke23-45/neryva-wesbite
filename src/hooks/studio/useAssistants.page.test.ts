// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { pageCursorKey, parseAssistantsPage } from './useAssistants';

const ROW = {
  id: 'a1',
  name: 'Billing',
  description: null,
  status: 'live',
  activeVersionId: 'v1',
  model: null,
  updatedAt: '2026-10-02T00:00:00.000Z',
  degradedUntil: null,
  degradedReason: null,
  disabledReason: null,
};

describe('parseAssistantsPage', () => {
  it('parses rows and the newest cursor', () => {
    const page = parseAssistantsPage({
      assistants: [ROW],
      next_cursor: { before: '2026-10-02T00:00:00.000Z', before_id: 'a1' },
    });
    expect(page.assistants).toHaveLength(1);
    expect(page.assistants[0]?.name).toBe('Billing');
    expect(page.nextCursor).toEqual({ before: '2026-10-02T00:00:00.000Z', beforeId: 'a1' });
  });

  it('parses the name cursor shape', () => {
    const page = parseAssistantsPage({
      assistants: [ROW],
      next_cursor: { after_name: 'Billing', after_id: 'a1' },
    });
    expect(page.nextCursor).toEqual({ afterName: 'Billing', afterId: 'a1' });
  });

  it('treats missing, null, and half cursors as no further pages', () => {
    expect(parseAssistantsPage({ assistants: [ROW] }).nextCursor).toBeNull();
    expect(parseAssistantsPage({ assistants: [ROW], next_cursor: null }).nextCursor).toBeNull();
    expect(parseAssistantsPage({ assistants: [ROW], next_cursor: { before: 'x' } }).nextCursor).toBeNull();
    expect(parseAssistantsPage({ assistants: [ROW], next_cursor: { nope: 1 } }).nextCursor).toBeNull();
  });
});

describe('pageCursorKey', () => {
  it('is value-based and sort-aware', () => {
    expect(pageCursorKey(null)).toBe('');
    expect(pageCursorKey(undefined)).toBe('');
    expect(pageCursorKey({ before: 't', beforeId: 'a' })).toBe('b:t:a');
    expect(pageCursorKey({ afterName: 'B', afterId: 'a' })).toBe('a:B:a');
  });
});
