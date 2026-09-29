import { describe, expect, it } from 'vitest';
import { parseAssistants } from './useAssistants';
import { parseConversations, parseConversationsPage } from './useStudioConversations';

describe('parseConversations', () => {
  it('sorts by recency and falls back to a title', () => {
    const conversations = parseConversations({
      conversations: [
        { id: 'c1', title: 'Older', updated_at: '2026-09-01T10:00:00Z' },
        { id: 'c2', name: 'Newer', last_message_at: '2026-09-05T10:00:00Z', status: 'open' },
        { id: 'c3' },
      ],
    });
    expect(conversations.map((c) => c.id)).toEqual(['c2', 'c1', 'c3']);
    expect(conversations[2].title).toBe('Untitled conversation');
    expect(conversations[0].status).toBe('open');
  });

  it('accepts bare-array and items envelopes', () => {
    expect(parseConversations([{ id: 'a' }])).toHaveLength(1);
    expect(parseConversations({ items: [{ conversation_id: 'b' }] })).toHaveLength(1);
  });

  it('survives garbage', () => {
    expect(parseConversations(null)).toEqual([]);
    expect(parseConversations({ conversations: 'x' })).toEqual([]);
  });
});

describe('parseAssistants', () => {
  it('extracts agents from the reasonable envelopes', () => {
    const assistants = parseAssistants({
      assistants: [
        // Identity rows carry NO status/model columns (definitions live on
        // versions): lifecycle derives disabled > live > new; updatedAt
        // passes through; model stays null (no N+1 on the list path).
        { id: 'a1', display_name: 'Support Concierge', active_version_id: 'v1', updated_at: '2026-09-16T10:00:00Z', degraded_until: '2026-09-24T00:00:00Z', degraded_reason: 'unresolved:faq' },
        { agent_id: 'a2' },
        { id: 'a3', name: 'Old', disabled_at: '2026-09-15T10:00:00Z' },
      ],
    });
    // Full AssistantSummary shape — exact match (activeVersionId drives funnel/publish rows without N+1 reads;
    // degraded/disabled passthrough powers the Overview queue from the same response).
    expect(assistants).toEqual([
      { id: 'a1', name: 'Support Concierge', description: null, status: 'live', activeVersionId: 'v1', model: null, updatedAt: '2026-09-16T10:00:00Z', degradedUntil: '2026-09-24T00:00:00Z', degradedReason: 'unresolved:faq', disabledReason: null },
      { id: 'a2', name: 'Untitled agent', description: null, status: 'new', activeVersionId: null, model: null, updatedAt: null, degradedUntil: null, degradedReason: null, disabledReason: null },
      { id: 'a3', name: 'Old', description: null, status: 'disabled', activeVersionId: null, model: null, updatedAt: null, degradedUntil: null, degradedReason: null, disabledReason: null },
    ]);
  });

  it('survives garbage', () => {
    expect(parseAssistants(42)).toEqual([]);
    expect(parseAssistants({ assistants: [null, 'x'] })).toEqual([]);
  });
});

describe('parseConversationsPage — C1 cursor pagination', () => {
  const page = (nextCursor: unknown) => ({
    conversations: [
      { id: 'c1', title: 'Newest', updated_at: '2026-09-05T10:00:00Z' },
      { id: 'c2', title: 'Older', updated_at: '2026-09-01T10:00:00Z' },
    ],
    next_cursor: nextCursor,
  });

  it('parses items and the snake_case next_cursor', () => {
    const parsed = parseConversationsPage(
      page({ before: '2026-09-01T10:00:00Z', before_id: 'c2' }),
    );
    expect(parsed.items.map((c) => c.id)).toEqual(['c1', 'c2']);
    expect(parsed.nextCursor).toEqual({ before: '2026-09-01T10:00:00Z', beforeId: 'c2' });
  });

  it('accepts a camelCase beforeId cursor', () => {
    const parsed = parseConversationsPage(page({ before: '2026-09-01T10:00:00Z', beforeId: 'c2' }));
    expect(parsed.nextCursor).toEqual({ before: '2026-09-01T10:00:00Z', beforeId: 'c2' });
  });

  it('yields a null cursor when the list is exhausted', () => {
    expect(parseConversationsPage(page(null)).nextCursor).toBeNull();
    expect(parseConversationsPage({ conversations: [{ id: 'c1' }] }).nextCursor).toBeNull();
  });

  it('yields a null cursor for half or malformed cursors', () => {
    expect(parseConversationsPage(page({ before: '2026-09-01T10:00:00Z' })).nextCursor).toBeNull();
    expect(parseConversationsPage(page({ before_id: 'c2' })).nextCursor).toBeNull();
    expect(parseConversationsPage(page('junk')).nextCursor).toBeNull();
  });

  it('survives garbage', () => {
    expect(parseConversationsPage(null)).toEqual({ items: [], nextCursor: null });
    expect(parseConversationsPage({ conversations: 'x' })).toEqual({ items: [], nextCursor: null });
  });
});
